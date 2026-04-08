import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { loadState, saveState, createState, stopRun } from '../../dreamroll/state.js';
import { getMorningReport, rollSeedParameters } from '../../dreamroll/generator.js';
import { getJudgeEvaluationPrompts, calculateVerdict } from '../../dreamroll/judges.js';
import { maybeEvolve } from '../../dreamroll/evolution.js';
import type { DreamrollConfig } from '../../dreamroll/types.js';

const projectRootSchema = { projectRoot: z.string().describe('Project root directory') };

/**
 * Reads project context from package.json and README for the brief.
 */
function detectBrief(projectRoot: string, overrideBrief?: string): string {
  if (overrideBrief) return overrideBrief;
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;
      const name = typeof pkg['name'] === 'string' ? pkg['name'] : path.basename(projectRoot);
      const desc = typeof pkg['description'] === 'string' ? pkg['description'] : '';
      return desc ? `${name}: ${desc}` : name;
    } catch {}
  }
  return path.basename(projectRoot);
}

export function registerDreamrollTools(server: McpServer): void {
  server.tool(
    'dreamroll_start',
    'Starts or resumes a Dreamroll session. Initializes .dreamroll/ state and returns config + first variation parameters. Safe to call on resume — detects existing running state and continues.',
    {
      projectRoot: z.string().describe('Project root directory'),
      brief: z.string().optional().describe('Product brief for generated copy. Auto-detected from package.json if omitted.'),
    },
    async ({ projectRoot, brief }) => {
      // Check for resumable session
      const existing = loadState(projectRoot);
      if (existing && (existing.status === 'running' || existing.status === 'paused')) {
        existing.stopRequested = false;
        saveState(projectRoot, existing);
        return {
          content: [{
            type: 'text' as const,
            text: [
              'Dreamroll RESUMED.',
              `Project: ${projectRoot}`,
              `Brief: ${existing.config.brief ?? '(none)'}`,
              `Last variation: ${existing.currentVariation}`,
              `Gems so far: ${existing.gems.length}`,
              '',
              'Call dreamroll_next to get the next variation parameters.',
            ].join('\n'),
          }],
        };
      }

      // Fresh session
      const resolvedBrief = detectBrief(projectRoot, brief);
      const config: DreamrollConfig = {
        basePage: '',
        targetVariations: null, // never-stop
        budgetHours: 24,
        projectRoot,
        brief: resolvedBrief,
      };
      const state = createState(config);

      // Ensure variations dir exists
      const variationsDir = path.join(projectRoot, '.dreamroll', 'variations');
      if (!fs.existsSync(variationsDir)) fs.mkdirSync(variationsDir, { recursive: true });

      saveState(projectRoot, state);

      return {
        content: [{
          type: 'text' as const,
          text: [
            'Dreamroll INITIALIZED.',
            `Project: ${projectRoot}`,
            `Brief: ${resolvedBrief}`,
            '',
            'Files:',
            '  .dreamroll/state.json               live state',
            '  .dreamroll/variations/              generated HTML files',
            '',
            'Call dreamroll_next to get the first variation parameters.',
          ].join('\n'),
        }],
      };
    },
  );

  server.tool(
    'dreamroll_next',
    'Returns the next variation to generate: number, rolled parameters, brief, output path. Respects stop flag and evolution weights. Skill calls this in a loop until stopped.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll session. Call dreamroll_start first.' }] };
      }

      // Honor stop flag
      if (state.stopRequested) {
        stopRun(projectRoot, state);
        return { content: [{ type: 'text' as const, text: 'Stop requested. Run marked stopped. Call dreamroll_report for summary.' }] };
      }

      const nextId = state.currentVariation + 1;
      const seed = rollSeedParameters(state);
      const outputPath = path.join(projectRoot, '.dreamroll', 'variations', `variation_${String(nextId).padStart(3, '0')}.html`);

      const lines = [
        `VARIATION ${nextId}`,
        `Output: ${outputPath}`,
        '',
        'Brief:',
        `  ${state.config.brief ?? '(no brief)'}`,
        '',
        'Design Parameters (all 10 rolled):',
        `  Style:       ${seed.genre}`,
        `  Palette:     ${seed.colorPalette}`,
        `  Typography:  ${seed.typography}`,
        `  Layout:      ${seed.layoutArchetype}`,
        `  Density:     ${seed.density}`,
        `  Mood:        ${seed.mood}`,
        `  Era:         ${seed.era}`,
        `  Animation:   ${seed.animation}`,
        `  Imagery:     ${seed.imagery}`,
        `  Wildcard:    ${seed.wildcard}`,
        '',
        'Next steps:',
        '1. Generate a standalone HTML landing page matching these 10 parameters',
        '2. Inline all CSS, no external dependencies',
        '3. HTML comment at top documenting params + scores',
        '4. Write file to the output path above',
        '5. Call dreamroll_judge with the variation description to evaluate',
        '6. Call dreamroll_record_verdict with the scores',
        '7. Call dreamroll_next again for the next variation',
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_stop',
    'Sets the stop flag. The next dreamroll_next call will halt the run. Graceful stop; current variation completes if in progress.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll session to stop.' }] };
      }
      state.stopRequested = true;
      saveState(projectRoot, state);
      return { content: [{ type: 'text' as const, text: 'Stop flag set. Dreamroll will halt at next variation boundary.' }] };
    },
  );

  server.tool(
    'dreamroll_status',
    'Shows the current Dreamroll run status: progress, gems found, current variation, evolution adjustments.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll run in progress.' }] };
      }

      const lines = [
        `Status: ${state.status}${state.stopRequested ? ' (stop requested)' : ''}`,
        `Variations generated: ${state.currentVariation}`,
        `Gems found: ${state.gems.length}`,
        `Elapsed: ${Math.round(state.elapsedMs / 60000)}m`,
        `Evolution adjustments: ${state.evolutionAdjustments.length}`,
        `Brief: ${state.config.brief ?? '(none)'}`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_gems',
    'Lists all gems (high-scoring variations) from the current or last Dreamroll run.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found.' }] };
      }

      const gems = state.variations.filter(v => state.gems.includes(v.id));
      if (gems.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No gems found yet.' }] };
      }

      const lines = gems.map(g => {
        const scores = g.verdict?.scores.map(s => `${s.judge}: ${s.score}`).join(', ') ?? 'no scores';
        return `v${g.id} (avg ${g.verdict?.averageScore ?? 0}/10) [${scores}] style=${g.seed.genre} palette=${g.seed.colorPalette} wildcard=${g.seed.wildcard}`;
      });
      return { content: [{ type: 'text' as const, text: `${gems.length} gem(s):\n${lines.join('\n')}` }] };
    },
  );

  server.tool(
    'dreamroll_judge',
    'Returns judge evaluation prompts for a design variation. Claude evaluates these in-context using the judge personalities (BRUTUS, VENUS, MERCURY). No separate API key needed.',
    {
      variationDescription: z.string().describe('Description of the variation to judge (file path, design parameters, HTML excerpt)'),
      pluginRoot: z.string().describe('Linkraft plugin root directory (where agents/ live)'),
    },
    async ({ variationDescription, pluginRoot }) => {
      const agentsDir = path.join(pluginRoot, 'agents');
      const prompts = getJudgeEvaluationPrompts(agentsDir, variationDescription);

      if (prompts.length === 0) {
        return { content: [{ type: 'text' as const, text: 'Judge prompts not found. Check that agents/dreamroll-*.md files exist.' }] };
      }

      const instructions = [
        'Evaluate this variation as each judge. For each judge below, respond with:',
        'Judge: [name]',
        'Score: [1-10]',
        'Comment: [1-2 sentence verdict in character]',
        '',
        'After all three, call dreamroll_record_verdict with the scores.',
        'Gem threshold: avg >= 7 or any single 10.',
        '',
        '---',
        '',
      ];

      for (const p of prompts) {
        instructions.push(`## ${p.judge.toUpperCase()}`);
        instructions.push(p.prompt);
        instructions.push('');
      }

      return { content: [{ type: 'text' as const, text: instructions.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_record_verdict',
    'Records judge scores for a variation. Called after Claude evaluates using dreamroll_judge. Saves the variation to state and updates gems list.',
    {
      projectRoot: z.string().describe('Project root directory'),
      variationId: z.number().describe('Variation number'),
      filePath: z.string().describe('Path to the generated HTML file'),
      scores: z.array(z.object({
        judge: z.enum(['brutus', 'venus', 'mercury']),
        score: z.number().min(1).max(10),
        comment: z.string(),
      })).describe('Judge scores'),
    },
    async ({ projectRoot, variationId, filePath, scores }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found.' }] };
      }

      const verdict = calculateVerdict(scores);

      // Upsert the variation
      let variation = state.variations.find(v => v.id === variationId);
      if (variation) {
        variation.verdict = verdict;
        variation.filesPath = filePath;
      } else {
        // New variation being recorded — roll a placeholder seed from the file if possible
        variation = {
          id: variationId,
          seed: rollSeedParameters(state), // placeholder; real seed was rolled at dreamroll_next
          verdict,
          screenshotPath: null,
          filesPath: filePath,
          createdAt: new Date().toISOString(),
        };
        state.variations.push(variation);
      }

      state.currentVariation = Math.max(state.currentVariation, variationId);
      if (verdict.verdict === 'gem' && !state.gems.includes(variationId)) {
        state.gems.push(variationId);
      }

      // Evolution check
      const adjustments = maybeEvolve(state);
      if (adjustments.length > 0) {
        state.evolutionAdjustments.push(...adjustments);
      }

      saveState(projectRoot, state);

      const lines: string[] = scores.map(s => `${s.judge.toUpperCase()}: ${s.score}/10 - "${s.comment}"`);
      lines.push('', `Average: ${verdict.averageScore}/10`, `Verdict: ${verdict.verdict.toUpperCase()}`);
      if (verdict.hasInstantKeep) lines.push('(INSTANT KEEP: a judge gave 10)');
      if (adjustments.length > 0) {
        lines.push('', `Evolution kicked in (${adjustments.length} adjustments)`);
      }
      lines.push('', 'Call dreamroll_next for the next variation.');

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'dreamroll_report',
    'Generates the morning report: top gems, patterns, wildcard discoveries, full statistics.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const report = getMorningReport(projectRoot);
      return { content: [{ type: 'text' as const, text: report }] };
    },
  );
}
