import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { loadState, saveState, createState, stopRun } from '../../dreamroll/state.js';
import { getMorningReport, rollSeedParameters } from '../../dreamroll/generator.js';
import { genomeToPrompt, genomeSummary } from '../../dreamroll/genome.js';
import { getJudgeEvaluationPrompts, calculateVerdict, applyStyleAdherenceDeduction } from '../../dreamroll/judges.js';
import { maybeEvolve } from '../../dreamroll/evolution.js';
import type { DreamrollConfig, Variation } from '../../dreamroll/types.js';

const projectRootSchema = { projectRoot: z.string().describe('Project root directory') };

/**
 * Reads project context for the brief.
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
  // ==========================================================================
  // dreamroll_start
  // Multi-purpose: initializes session, records previous variation if scores
  // are passed, returns next variation parameters + judge prompts.
  // The skill calls this in a loop until stopRequested.
  // ==========================================================================
  server.tool(
    'dreamroll_start',
    'Starts/resumes a Dreamroll session AND advances the loop. First call inits state. Subsequent calls record the previous variation (if completed scores are passed) and return the next variation\'s genome + judge prompts. Returns a stop message when the stop flag is set.',
    {
      projectRoot: z.string().describe('Project root directory'),
      brief: z.string().optional().describe('Product brief for generated copy. Auto-detected from package.json on first call.'),
      pluginRoot: z.string().optional().describe('Linkraft plugin root (where agents/dreamroll-*.md live). Required to return judge prompts inline.'),
      completed: z.object({
        variationId: z.number(),
        filePath: z.string(),
        scores: z.array(z.object({
          judge: z.enum(['brutus', 'venus', 'mercury']),
          score: z.number().min(1).max(10),
          comment: z.string(),
        })),
      }).optional().describe('Previous variation result. Pass on every call after the first to record scores and trigger evolution.'),
    },
    async ({ projectRoot, brief, pluginRoot, completed }) => {
      // 1. Load or create state
      let state = loadState(projectRoot);
      let initialized = false;
      if (!state || state.status === 'completed' || state.status === 'stopped') {
        const resolvedBrief = detectBrief(projectRoot, brief);
        const config: DreamrollConfig = {
          basePage: '',
          targetVariations: null, // never-stop
          budgetHours: 24,
          projectRoot,
          brief: resolvedBrief,
        };
        state = createState(config);
        const variationsDir = path.join(projectRoot, '.dreamroll', 'variations');
        if (!fs.existsSync(variationsDir)) fs.mkdirSync(variationsDir, { recursive: true });
        saveState(projectRoot, state);
        initialized = true;
      } else {
        state.stopRequested = false;
      }

      // 2. Honor stop flag from previous session
      if (state.stopRequested) {
        stopRun(projectRoot, state);
        return { content: [{ type: 'text' as const, text: 'Stop requested. Run marked stopped. Call dreamroll_report for the morning report.' }] };
      }

      // 3. Record previous variation if scores were passed
      let recordedSummary = '';
      if (completed) {
        // Find the pre-recorded variation (dreamroll_start rolls the seed and
        // stores a placeholder variation, so we have the correct genome here).
        let variation = state.variations.find(v => v.id === completed.variationId);
        const recordedStyle = variation?.seed.genre;

        // Style-adherence auto-deduction: read the HTML file and check for
        // the required distinctive CSS declarations. Missing strings dock BRUTUS.
        let finalScores = completed.scores;
        let deductionNote = '';
        if (recordedStyle && completed.filePath && fs.existsSync(completed.filePath)) {
          try {
            const htmlContent = fs.readFileSync(completed.filePath, 'utf-8');
            const result = applyStyleAdherenceDeduction(completed.scores, htmlContent, recordedStyle);
            finalScores = result.scores;
            if (result.deducted) {
              deductionNote = `\n  Auto-deduction: BRUTUS -2 for missing distinctive CSS (${recordedStyle}): ${result.missing.join(', ')}`;
            }
          } catch {
            // Best effort; if the file can't be read, skip the deduction
          }
        }

        const verdict = calculateVerdict(finalScores);
        if (variation) {
          variation.verdict = verdict;
          variation.filesPath = completed.filePath;
        } else {
          variation = {
            id: completed.variationId,
            seed: rollSeedParameters(state), // fallback if the placeholder was lost
            verdict,
            screenshotPath: null,
            filesPath: completed.filePath,
            createdAt: new Date().toISOString(),
          };
          state.variations.push(variation);
        }
        state.currentVariation = Math.max(state.currentVariation, completed.variationId);
        if (verdict.verdict === 'gem' && !state.gems.includes(completed.variationId)) {
          state.gems.push(completed.variationId);
        }
        const adjustments = maybeEvolve(state);
        if (adjustments.length > 0) state.evolutionAdjustments.push(...adjustments);
        saveState(projectRoot, state);

        recordedSummary = [
          `Recorded variation ${completed.variationId}: avg ${verdict.averageScore}/10 — ${verdict.verdict.toUpperCase()}${verdict.hasInstantKeep ? ' (INSTANT KEEP)' : ''}.${deductionNote}`,
          adjustments.length > 0 ? `Evolution kicked in (${adjustments.length} pattern adjustments applied).` : '',
        ].filter(l => l !== '').join('\n');
      }

      // 4. Roll the next variation
      const nextId = state.currentVariation + 1;
      const seed = rollSeedParameters(state);

      // Pre-record the seed so dreamroll_record_verdict (or the next start call)
      // has the correct genome to attach to the variation
      const placeholder: Variation = {
        id: nextId,
        seed,
        verdict: null,
        screenshotPath: null,
        filesPath: null,
        createdAt: new Date().toISOString(),
      };
      // Replace any existing placeholder for this id
      const existingIdx = state.variations.findIndex(v => v.id === nextId);
      if (existingIdx >= 0) state.variations[existingIdx] = placeholder;
      else state.variations.push(placeholder);
      state.currentVariation = nextId;
      saveState(projectRoot, state);

      const outputPath = path.join(projectRoot, '.dreamroll', 'variations', `variation_${String(nextId).padStart(3, '0')}.html`);
      const generationPrompt = genomeToPrompt(seed, state.config.brief ?? 'A product', nextId, outputPath);

      // 5. Build judge prompts (if pluginRoot supplied)
      let judgeBlock = '';
      if (pluginRoot) {
        const agentsDir = path.join(pluginRoot, 'agents');
        const prompts = getJudgeEvaluationPrompts(agentsDir, `${outputPath} — ${genomeSummary(seed)}`);
        if (prompts.length > 0) {
          const blocks = ['', '════════ JUDGES ════════', 'After writing the HTML, score it as each judge below. Use exactly:', 'Judge: [name]', 'Score: [1-10]', 'Comment: [1-2 sentences in character]', '', 'Then call dreamroll_start again with `completed: { variationId, filePath, scores }` to record scores and get the next variation.', ''];
          for (const p of prompts) {
            blocks.push(`-- ${p.judge.toUpperCase()} --`);
            blocks.push(p.prompt);
            blocks.push('');
          }
          judgeBlock = blocks.join('\n');
        }
      }

      const header = initialized
        ? `Dreamroll INITIALIZED.\nProject: ${projectRoot}\nBrief: ${state.config.brief ?? '(none)'}`
        : `Dreamroll RESUMED at variation ${nextId}.`;

      const text = [
        header,
        recordedSummary,
        '',
        '════════ NEXT VARIATION ════════',
        generationPrompt,
        judgeBlock,
      ].filter(l => l !== '').join('\n');

      return { content: [{ type: 'text' as const, text }] };
    },
  );

  // ==========================================================================
  // dreamroll_status
  // ==========================================================================
  server.tool(
    'dreamroll_status',
    'Shows the current Dreamroll run status: variations generated, gems found, top score, current evolution weights.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll run in progress. Call dreamroll_start to begin.' }] };
      }

      const topScore = state.variations
        .filter(v => v.verdict)
        .reduce((max, v) => Math.max(max, v.verdict?.averageScore ?? 0), 0);

      const weightSummary: string[] = [];
      if (state.paramWeights) {
        for (const [dim, vals] of Object.entries(state.paramWeights)) {
          const top = Object.entries(vals).sort((a, b) => b[1] - a[1]).slice(0, 2);
          if (top.length > 0) {
            weightSummary.push(`  ${dim}: ${top.map(([k, w]) => `${k}=${w}`).join(', ')}`);
          }
        }
      }

      const lines = [
        `Status: ${state.status}${state.stopRequested ? ' (stop requested)' : ''}`,
        `Variations: ${state.currentVariation}`,
        `Gems: ${state.gems.length}`,
        `Top score: ${topScore}/10`,
        `Elapsed: ${Math.round(state.elapsedMs / 60000)}m`,
        `Brief: ${state.config.brief ?? '(none)'}`,
      ];
      if (weightSummary.length > 0) {
        lines.push('', 'Current weights (top 2 per dimension):');
        lines.push(...weightSummary);
      }
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  // ==========================================================================
  // dreamroll_stop
  // ==========================================================================
  server.tool(
    'dreamroll_stop',
    'Sets the stop flag. The next dreamroll_start call halts the loop. Graceful: current variation completes if in progress.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll session to stop.' }] };
      }
      state.stopRequested = true;
      saveState(projectRoot, state);
      return { content: [{ type: 'text' as const, text: 'Stop flag set. Dreamroll halts at next variation boundary.' }] };
    },
  );

  // ==========================================================================
  // dreamroll_gems
  // ==========================================================================
  server.tool(
    'dreamroll_gems',
    'Lists all gems (avg >= 7 or any single 10) with full genome and scores.',
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

      const lines: string[] = [`${gems.length} gem(s):`, ''];
      for (const g of gems) {
        const scores = g.verdict?.scores.map(s => `${s.judge}=${s.score}`).join(' ') ?? 'no scores';
        lines.push(`v${String(g.id).padStart(3, '0')}  avg ${g.verdict?.averageScore ?? 0}/10  (${scores})`);
        lines.push(`  ${genomeSummary(g.seed)}`);
        lines.push('');
      }
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  // ==========================================================================
  // dreamroll_report
  // ==========================================================================
  server.tool(
    'dreamroll_report',
    'Generates the morning report: top 5 gems with full genomes, evolution patterns, recommendation. Writes to .dreamroll/report.md.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const reportText = getMorningReport(projectRoot);
      // Persist to .dreamroll/report.md
      const reportPath = path.join(projectRoot, '.dreamroll', 'report.md');
      try {
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(reportPath, reportText, 'utf-8');
      } catch {
        // Best effort; still return the text
      }
      return { content: [{ type: 'text' as const, text: `Written to ${reportPath}\n\n${reportText}` }] };
    },
  );
}
