import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writePlanningFiles } from '../../launchpad/planner.js';
import { runTests, formatTestResults } from '../../launchpad/tester.js';
import { generateAllDrafts, writeDrafts } from '../../launchpad/distributor.js';

export function registerLaunchpadTools(server: McpServer): void {
  server.tool(
    'launchpad_plan',
    'Generates planning documents for a landing page: brief, wireframe, SEO config, copy structure. Writes to .launchpad/ directory.',
    {
      projectRoot: z.string().describe('Project root directory'),
      productName: z.string().describe('Product name'),
      productDescription: z.string().describe('What the product does'),
      targetAudience: z.string().describe('Who the product is for'),
      uniqueValue: z.string().describe('Unique value proposition (one sentence)'),
      tone: z.string().describe('Desired tone: professional, playful, technical, etc.'),
    },
    async ({ projectRoot, productName, productDescription, targetAudience, uniqueValue, tone }) => {
      const brief = { productName, productDescription, targetAudience, uniqueValue, tone };
      const result = writePlanningFiles(projectRoot, brief);
      return {
        content: [{
          type: 'text' as const,
          text: `Planning files created in ${result.dir}:\n${result.files.map(f => `  - ${f}`).join('\n')}`,
        }],
      };
    },
  );

  server.tool(
    'launchpad_test',
    'Runs quality checks on a landing page: Lighthouse scores, responsive screenshots, CTA visibility.',
    {
      pageUrl: z.string().describe('URL of the page to test, e.g. "http://localhost:3000"'),
    },
    async ({ pageUrl }) => {
      const results = await runTests(pageUrl);
      return { content: [{ type: 'text' as const, text: formatTestResults(results) }] };
    },
  );

  server.tool(
    'launchpad_distribute',
    'Generates distribution drafts for LinkedIn, Twitter, Product Hunt, Reddit, and email. Saves to .launchpad/distribution/.',
    {
      projectRoot: z.string().describe('Project root directory'),
      productName: z.string().describe('Product name'),
      productDescription: z.string().describe('What the product does'),
      targetAudience: z.string().describe('Who the product is for'),
      uniqueValue: z.string().describe('Unique value proposition'),
      tone: z.string().describe('Desired tone'),
    },
    async ({ projectRoot, productName, productDescription, targetAudience, uniqueValue, tone }) => {
      const brief = { productName, productDescription, targetAudience, uniqueValue, tone };
      const drafts = generateAllDrafts(brief);
      const files = writeDrafts(projectRoot, drafts);
      return {
        content: [{
          type: 'text' as const,
          text: `Distribution drafts created:\n${files.map(f => `  - ${f}`).join('\n')}\n\nThese are drafts for your review. Edit before posting.`,
        }],
      };
    },
  );

  server.tool(
    'launchpad_status',
    'Shows the current Launchpad pipeline status: which phases are complete.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.join(projectRoot, '.launchpad');

      if (!fs.existsSync(dir)) {
        return { content: [{ type: 'text' as const, text: 'No Launchpad session. Run /launchpad plan to start.' }] };
      }

      const files = fs.readdirSync(dir);
      const hasBrief = files.includes('brief.md');
      const hasWireframe = files.includes('wireframe.json');
      const hasCopy = files.includes('copy.json');
      const hasSEO = files.includes('seo.json');
      const hasDist = fs.existsSync(path.join(dir, 'distribution'));

      const lines = [
        `Planning: ${hasBrief ? 'DONE' : 'pending'}`,
        `Wireframe: ${hasWireframe ? 'DONE' : 'pending'}`,
        `Copy: ${hasCopy ? 'DONE' : 'pending'}`,
        `SEO: ${hasSEO ? 'DONE' : 'pending'}`,
        `Build: pending (run manually)`,
        `Test: pending (run launchpad_test)`,
        `Distribution: ${hasDist ? 'DONE' : 'pending'}`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
