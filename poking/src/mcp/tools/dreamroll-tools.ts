import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import { loadState, saveState, createState, stopRun } from '../../dreamroll/state.js';
import { getMorningReport, rollSeedParameters } from '../../dreamroll/generator.js';
import { genomeToPrompt, genomeSummary, genomeFilename } from '../../dreamroll/genome.js';
import { getJudgeEvaluationPrompts, calculateVerdict, applyStyleAdherenceDeduction } from '../../dreamroll/judges.js';
import { maybeEvolve } from '../../dreamroll/evolution.js';
import { likeVariation, hateVariation } from '../../dreamroll/feedback.js';
import { breedGenomes, queuePendingChildren } from '../../dreamroll/breeding.js';
import { saveReferences, deriveWeightsFromReferences, type ReferenceDesignDNA } from '../../dreamroll/references.js';
import { writeOvernightScript, overnightInstructions } from '../../shared/overnight.js';
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
      styleNote: z.string().optional().describe('Plain-text style guidance (e.g., "dark mode, minimal, big bold typography, no gradients"). Injected directly into the prompt as a constraint. Persists across the session.'),
      references: z.array(z.object({
        url: z.string(),
        colors: z.array(z.string()),
        fonts: z.array(z.string()),
        radius: z.string(),
        shadows: z.string(),
        layout: z.string(),
        mood: z.string(),
      })).optional().describe('Extracted design DNA from --reference URLs. Claude scrapes each site before the first call and passes the results here. Saved to .dreamroll/references.json and used to bias evolution weights + generation prompt.'),
      completed: z.object({
        variationId: z.number(),
        filePath: z.string(),
        scores: z.array(z.object({
          judge: z.enum(['brutus', 'venus', 'mercury']),
          score: z.number().min(1).max(10),
          comment: z.string(),
          mobileScore: z.number().min(1).max(10).optional().describe('Judge score 1-10 for the 375x667 mobile viewport. Averages equally with the desktop score.'),
          mobileComment: z.string().optional().describe('Short mobile-specific comment from the judge.'),
        })),
      }).optional().describe('Previous variation result. Pass on every call after the first to record scores and trigger evolution.'),
    },
    async ({ projectRoot, brief, pluginRoot, styleNote, references, completed }) => {
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
          styleNote,
        };
        state = createState(config);
        const variationsDir = path.join(projectRoot, '.dreamroll', 'variations');
        if (!fs.existsSync(variationsDir)) fs.mkdirSync(variationsDir, { recursive: true });

        // Persist references and derive weights on init
        if (references && references.length > 0) {
          state.referenceData = references as ReferenceDesignDNA[];
          saveReferences(projectRoot, state.referenceData);
          const refW = deriveWeightsFromReferences(state.referenceData);
          if (refW) state.referenceWeights = refW as Record<string, Record<string, number>>;
        }

        saveState(projectRoot, state);
        initialized = true;
      } else {
        state.stopRequested = false;

        // Allow updating references and style note on resume
        if (references && references.length > 0) {
          state.referenceData = references as ReferenceDesignDNA[];
          saveReferences(projectRoot, state.referenceData);
          const refW = deriveWeightsFromReferences(state.referenceData);
          if (refW) state.referenceWeights = refW as Record<string, Record<string, number>>;
          saveState(projectRoot, state);
        }
        if (styleNote) {
          state.config.styleNote = styleNote;
          saveState(projectRoot, state);
        }
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
        const recordedMutation = variation?.seed.mutation ?? 'pure';

        // Style-adherence auto-deduction: read the HTML file and check for
        // the required distinctive CSS declarations. Missing strings dock BRUTUS.
        // Skipped for non-pure mutations (they deliberately violate the archetype).
        let finalScores = completed.scores;
        let deductionNote = '';
        if (recordedStyle && completed.filePath && fs.existsSync(completed.filePath)) {
          try {
            const htmlContent = fs.readFileSync(completed.filePath, 'utf-8');
            const result = applyStyleAdherenceDeduction(completed.scores, htmlContent, recordedStyle, recordedMutation);
            finalScores = result.scores;
            if (result.skipped) {
              deductionNote = `\n  CSS check skipped: mutation "${recordedMutation}" is experimental — judges evaluate whether the combination works.`;
            } else if (result.deducted) {
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
        filesPath: null,
        createdAt: new Date().toISOString(),
      };
      // Replace any existing placeholder for this id
      const existingIdx = state.variations.findIndex(v => v.id === nextId);
      if (existingIdx >= 0) state.variations[existingIdx] = placeholder;
      else state.variations.push(placeholder);
      state.currentVariation = nextId;
      saveState(projectRoot, state);

      const outputPath = path.join(projectRoot, '.dreamroll', 'variations', genomeFilename(nextId, seed));
      // The diversity directive is built from the 5 most recent PREVIOUS styles.
      // rollSeedParameters has already appended the current seed's style, so we
      // exclude it here — the generator should be told "avoid the history", not
      // "avoid yourself".
      const fullHistory = state.recentStyles ?? [];
      const recentStyles = fullHistory.slice(0, -1);
      const generationPrompt = genomeToPrompt(seed, state.config.brief ?? 'A product', nextId, outputPath, {
        recentStyles,
        references: state.referenceData,
        styleNote: state.config.styleNote,
      });

      // 5. Build judge prompts (if pluginRoot supplied)
      let judgeBlock = '';
      if (pluginRoot) {
        const agentsDir = path.join(pluginRoot, 'agents');
        const prompts = getJudgeEvaluationPrompts(agentsDir, `${outputPath} — ${genomeSummary(seed)}`);
        if (prompts.length > 0) {
          const isMutation = (seed.mutation ?? 'pure') !== 'pure';
          const blocks = ['', '════════ JUDGES ════════', 'After writing the HTML, score it as each judge below. Use exactly:', 'Judge: [name]', 'Score: [1-10]', 'Comment: [1-2 sentences in character]', ''];
          if (isMutation) {
            blocks.push(
              `IMPORTANT: This variation is an experimental STYLE MUTATION (${seed.mutation}).`,
              'Do NOT evaluate whether it matches the base style archetype. Evaluate whether',
              'the mutation WORKS as a new aesthetic. Is it coherent? Does it communicate?',
              'Is there anything genuinely novel here? Score on invention, not recognition.',
              '',
            );
          }
          blocks.push('Then call dreamroll_start again with `completed: { variationId, filePath, scores }` to record scores and get the next variation.', '');
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

      // Overnight hint: once the user has generated a handful of variations,
      // nudge them toward the overnight loop so they don't have to babysit the
      // session. Surfaced every 5 variations so it isn't spammy.
      let overnightHint = '';
      const completedCount = state.variations.filter(v => v.verdict).length;
      if (completedCount >= 3 && completedCount % 5 === 3) {
        overnightHint = [
          '',
          '────────────────────────────────────────',
          `Tip: you have ${completedCount} variations so far.`,
          'To keep dreamroll running after this session ends:',
          '',
          '    /linkraft dreamroll overnight',
          '',
          'That generates a restart loop script you paste into a separate',
          'terminal. Each new session reads .dreamroll/state.json and continues',
          'where the previous one left off. Leaves you to sleep. Stop with Ctrl+C.',
          '────────────────────────────────────────',
          '',
        ].join('\n');
      }

      const text = [
        header,
        recordedSummary,
        overnightHint,
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

  // ==========================================================================
  // dreamroll_overnight
  // ==========================================================================
  server.tool(
    'dreamroll_overnight',
    'Generates an OS-appropriate restart loop script (.ps1 on Windows, .sh on Mac/Linux) that keeps relaunching claude -p "/linkraft dreamroll" so the run continues across context-fill boundaries. Writes to .dreamroll/dreamroll-loop.{ps1,sh} and returns run instructions.',
    projectRootSchema,
    async ({ projectRoot }) => {
      const script = writeOvernightScript(projectRoot, 'dreamroll');
      const instructions = overnightInstructions(script, 'dreamroll');
      return {
        content: [{
          type: 'text' as const,
          text: `${instructions}\n\n--- SCRIPT CONTENTS ---\n${script.content}`,
        }],
      };
    },
  );

  // ==========================================================================
  // dreamroll_like
  // User feedback: marks a variation as a favorite. Every dimension value in
  // the liked genome gets a 3x multiplier on top of evolution weights.
  // ==========================================================================
  server.tool(
    'dreamroll_like',
    'Marks a variation as a favorite. Every dimension value in the liked genome gets a 3x weight multiplier on top of evolution weights, so future rolls bias toward what the user actually wants. Removes the variation from "hated" if it was there.',
    {
      projectRoot: z.string().describe('Project root directory'),
      variationId: z.number().int().positive().describe('Variation number to like (e.g., 14 for variation_014).'),
    },
    async ({ projectRoot, variationId }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found. Run /linkraft dreamroll first.' }] };
      }
      const ok = likeVariation(state, variationId);
      if (!ok) {
        const exists = state.variations.find(v => v.id === variationId);
        const msg = exists
          ? `Variation ${variationId} is already liked.`
          : `Variation ${variationId} not found.`;
        return { content: [{ type: 'text' as const, text: msg }] };
      }
      saveState(projectRoot, state);
      const variation = state.variations.find(v => v.id === variationId)!;
      const lines = [
        `Liked variation ${variationId}.`,
        `Future rolls bias 3x toward: ${genomeSummary(variation.seed)}`,
        '',
        `User preferences: ${state.userPreferences?.liked.length ?? 0} liked, ${state.userPreferences?.hated.length ?? 0} hated.`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  // ==========================================================================
  // dreamroll_hate
  // User feedback: marks a variation as bad. Every dimension value gets a
  // 0.25x weight multiplier so the next rolls steer away from it.
  // ==========================================================================
  server.tool(
    'dreamroll_hate',
    'Marks a variation as bad. Every dimension value in the hated genome gets a 0.25x weight multiplier, so future rolls steer away from it. Removes the variation from "liked" if it was there.',
    {
      projectRoot: z.string().describe('Project root directory'),
      variationId: z.number().int().positive().describe('Variation number to hate.'),
    },
    async ({ projectRoot, variationId }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found.' }] };
      }
      const ok = hateVariation(state, variationId);
      if (!ok) {
        const exists = state.variations.find(v => v.id === variationId);
        const msg = exists
          ? `Variation ${variationId} is already hated.`
          : `Variation ${variationId} not found.`;
        return { content: [{ type: 'text' as const, text: msg }] };
      }
      saveState(projectRoot, state);
      const variation = state.variations.find(v => v.id === variationId)!;
      const lines = [
        `Hated variation ${variationId}.`,
        `Future rolls bias 0.25x away from: ${genomeSummary(variation.seed)}`,
        '',
        `User preferences: ${state.userPreferences?.liked.length ?? 0} liked, ${state.userPreferences?.hated.length ?? 0} hated.`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  // ==========================================================================
  // dreamroll_breed
  // Crosses two existing variations into 3 children that get queued as the
  // next variations the loop produces.
  // ==========================================================================
  server.tool(
    'dreamroll_breed',
    'Crosses two existing variations into 3 child genomes by alternating dimensions between the parents and rolling a fresh mutation per child. The children are queued in state and consumed by the next 3 calls to dreamroll_start, so the loop will produce them as the next 3 variations.',
    {
      projectRoot: z.string().describe('Project root directory'),
      parentA: z.number().int().positive().describe('Variation number of the first parent.'),
      parentB: z.number().int().positive().describe('Variation number of the second parent.'),
    },
    async ({ projectRoot, parentA, parentB }) => {
      const state = loadState(projectRoot);
      if (!state) {
        return { content: [{ type: 'text' as const, text: 'No Dreamroll state found.' }] };
      }
      const a = state.variations.find(v => v.id === parentA);
      const b = state.variations.find(v => v.id === parentB);
      if (!a || !b) {
        const missing = [!a ? parentA : null, !b ? parentB : null].filter(n => n !== null);
        return { content: [{ type: 'text' as const, text: `Variation(s) not found: ${missing.join(', ')}` }] };
      }
      if (parentA === parentB) {
        return { content: [{ type: 'text' as const, text: 'Cannot breed a variation with itself.' }] };
      }
      const children = breedGenomes(a.seed, b.seed);
      queuePendingChildren(state, children);
      saveState(projectRoot, state);

      const lines = [
        `Bred variation ${parentA} x variation ${parentB} -> ${children.length} children queued.`,
        'The next 3 dreamroll_start calls will use these instead of fresh random rolls.',
        '',
        ...children.map((c, i) => `  child ${i + 1}: ${genomeSummary(c)}`),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
