import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { autoConfig, generateQAPlan } from '../../sheep/auto-config.js';
import { initSession, getNextArea, recordCycleResult, completeHunt, getReport } from '../../sheep/hunter.js';
import { loadStats } from '../../sheep/stats.js';
import { writeOvernightScript, overnightInstructions } from '../../shared/overnight.js';

export function registerSheepTools(server: McpServer): void {
  server.tool(
    'sheep_scan',
    'Auto-detects project stack, build/test commands, and generates a QA plan. Zero config.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const config = autoConfig(projectRoot);
      const qaPlan = generateQAPlan(config);
      const summary = [
        `Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
        `Styling: ${config.stack.styling ?? 'none detected'}`,
        `Database: ${config.stack.database ?? 'none detected'}`,
        `Testing: ${config.stack.testing ?? 'none detected'}`,
        `Build: ${config.buildCommand ?? 'not found'}`,
        `Test: ${config.testCommand ?? 'not found'}`,
        `Package manager: ${config.stack.packageManager}`,
        '', '---', '',
        qaPlan,
      ].join('\n');
      return { content: [{ type: 'text' as const, text: summary }] };
    },
  );

  server.tool(
    'sheep_init',
    'Initializes or resumes a Sheep QA session. Creates .sheep/ with QA plan, stats, story, human-review. Resumes automatically if a running session exists.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const { config, stats, resumed, preflightUsed, recoveredFromCorruption } = initSession(projectRoot);
      const status = resumed ? 'RESUMED' : 'INITIALIZED';
      return {
        content: [{
          type: 'text' as const,
          text: [
            `SheepCalledShip ${status}.`,
            '',
            `Project: ${projectRoot}`,
            `Stack: ${config.stack.framework ?? 'unknown'} (${config.stack.language})`,
            `Build: ${config.buildCommand ?? 'not detected'}`,
            `Test: ${config.testCommand ?? 'not detected'}`,
            resumed ? `Resuming from cycle ${stats.cycleCount}` : '',
            recoveredFromCorruption ? 'Previous session state corrupted. Old stats moved to stats.json.corrupted. Starting fresh.' : '',
            preflightUsed ? 'Preflight report found: using findings to prioritize QA plan.' : '',
            '',
            'Files:',
            '  .sheep/QA_PLAN.md      QA plan',
            '  .sheep/stats.json      live stats',
            '  .sheep/story.md        narrative report',
            '  .sheep/human-review.md logged items',
            '',
            'Call sheep_next to get the next target area.',
          ].filter(l => l !== '').join('\n'),
        }],
      };
    },
  );

  server.tool(
    'sheep_next',
    'Returns the next area to test: area name, files, description, risk level. Returns instructions for the analysis/fix/commit loop.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const next = getNextArea(projectRoot);
      if (!next) {
        return { content: [{ type: 'text' as const, text: 'All cycles complete. Call sheep_complete to finalize.' }] };
      }
      const lines = [
        `CYCLE ${next.cycleNumber}`,
        `Area: ${next.area}`,
        `Risk: ${next.riskLevel}`,
        `Description: ${next.description}`,
        '',
        'Files to scan:',
        ...next.files.map(f => `  ${f}`),
        '',
        'Loop:',
        '1. Read files, find bugs (null checks, error handling, types, security)',
        '2. Categorize: FIX (safe) or LOG (needs human)',
        '3. Apply FIX items, run build, run tests',
        '4. If build/tests fail: revert, mark as LOG',
        '5. If pass: git commit with [sheep] prefix',
        '6. Call sheep_record_cycle with results',
      ];

      // Overnight hint: once the user has completed a few cycles, nudge them
      // toward the overnight loop so they don't babysit the session. Shown
      // every 3 cycles starting at cycle 4.
      const stats = loadStats(projectRoot);
      if (stats && stats.cycleCount >= 3 && (stats.cycleCount + 1) % 3 === 0) {
        lines.push(
          '',
          '────────────────────────────────────────',
          `Tip: ${stats.cycleCount} cycles completed, ${stats.bugs.autoFixed} bugs auto-fixed.`,
          'To keep sheep hunting after this session ends:',
          '',
          '    /linkraft sheep overnight',
          '',
          'That generates a restart loop script you paste into a separate',
          'terminal. Each new session resumes from .sheep/stats.json at the',
          'next cycle. Stop with Ctrl+C.',
          '────────────────────────────────────────',
        );
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'sheep_record_cycle',
    'Records a completed cycle. Generates persona commentary (deezeebalz99, Martha, Sheep). Writes to stats, story, human-review.',
    {
      projectRoot: z.string().describe('Project root directory'),
      area: z.string().describe('Area tested'),
      target: z.string().describe('What was examined'),
      filesScanned: z.array(z.string()).describe('Files scanned'),
      bugsFound: z.array(z.object({
        id: z.string(),
        file: z.string(),
        line: z.number().nullable(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        category: z.string(),
        description: z.string(),
        fix: z.string().nullable(),
        autoFixed: z.boolean(),
        whyNotFixed: z.string().nullable(),
      })).describe('All bugs found'),
      buildPassed: z.boolean(),
      testsPassed: z.boolean(),
      testCount: z.number(),
      commitHash: z.string().nullable(),
    },
    async (input) => {
      const bugsFixed = input.bugsFound.filter(b => b.autoFixed);
      const bugsLogged = input.bugsFound.filter(b => !b.autoFixed);

      const result = recordCycleResult(input.projectRoot, {
        area: input.area,
        target: input.target,
        filesScanned: input.filesScanned,
        bugsFound: input.bugsFound,
        bugsFixed,
        bugsLogged,
        buildPassed: input.buildPassed,
        testsPassed: input.testsPassed,
        testCount: input.testCount,
        commitHash: input.commitHash,
      });

      const lines = [
        `Cycle ${result.cycleNumber} recorded.`,
        `Bugs: ${result.bugsFound.length} found, ${result.bugsFixed.length} fixed, ${result.bugsLogged.length} logged`,
        `Build: ${result.buildPassed ? 'PASS' : 'FAIL'} | Tests: ${result.testCount}`,
        result.commitHash ? `Commit: ${result.commitHash}` : '',
        '',
      ];
      if (result.sheepMonologue) lines.push(`Sheep: "${result.sheepMonologue}"`);
      if (result.deezeebalzRoast) lines.push(`deezeebalz99: "${result.deezeebalzRoast}"`);
      if (result.marthaMessage) lines.push(`Martha: ${result.marthaMessage}`);
      lines.push('', 'Call sheep_next for the next target.');

      return { content: [{ type: 'text' as const, text: lines.filter(l => l !== '').join('\n') }] };
    },
  );

  server.tool(
    'sheep_complete',
    'Completes the session. Generates content-pack.md, writes epilogue, finalizes stats.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const { stats, contentPackPath } = completeHunt(projectRoot);
      return {
        content: [{
          type: 'text' as const,
          text: [
            'SHEEPCALLEDSHIP SESSION COMPLETE',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '',
            `Cycles: ${stats.cycleCount} | Runtime: ${stats.totalRuntimeMinutes}m`,
            `Bugs: ${stats.bugs.discovered} found, ${stats.bugs.autoFixed} fixed, ${stats.bugs.logged} logged`,
            `Commits: ${stats.commits}`,
            '',
            'Output:',
            '  .sheep/stats.json        final statistics',
            '  .sheep/story.md          narrative field report',
            '  .sheep/human-review.md   items for human review',
            `  ${contentPackPath}   social media content`,
          ].join('\n'),
        }],
      };
    },
  );

  server.tool(
    'sheep_status',
    'Live session status: cycles, bugs, areas, runtime, latest persona commentary.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      return { content: [{ type: 'text' as const, text: getReport(projectRoot) }] };
    },
  );

  server.tool(
    'sheep_report',
    'Full session report with output file locations.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const stats = loadStats(projectRoot);
      if (!stats) {
        return { content: [{ type: 'text' as const, text: 'No Sheep session. Run /linkraft sheep to start.' }] };
      }
      const report = getReport(projectRoot);
      const extras = [
        report,
        'Output:',
        '  .sheep/QA_PLAN.md        QA plan',
        '  .sheep/stats.json        statistics',
        '  .sheep/story.md          narrative',
        '  .sheep/human-review.md   human items',
        stats.status === 'completed' ? '  .sheep/content-pack.md   content' : '',
      ].filter(l => l !== '');
      return { content: [{ type: 'text' as const, text: extras.join('\n') }] };
    },
  );

  server.tool(
    'sheep_overnight',
    'Generates an OS-appropriate restart loop script (.ps1 on Windows, .sh on Mac/Linux) that keeps relaunching claude -p "/linkraft sheep" so the QA run continues across context-fill boundaries. Writes to .sheep/sheep-loop.{ps1,sh} and returns run instructions.',
    { projectRoot: z.string().describe('Project root directory') },
    async ({ projectRoot }) => {
      const script = writeOvernightScript(projectRoot, 'sheep');
      const instructions = overnightInstructions(script, 'sheep');
      return {
        content: [{
          type: 'text' as const,
          text: `${instructions}\n\n--- SCRIPT CONTENTS ---\n${script.content}`,
        }],
      };
    },
  );
}
