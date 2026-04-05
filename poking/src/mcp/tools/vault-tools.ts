import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { vaultClient } from '../../vault/vault-client.js';
import { packageComponent } from '../../vault/component-packager.js';
import {
  listAllCompetitions,
  submitToCompetition,
} from '../../vault/competition.js';

export function registerVaultTools(server: McpServer): void {
  server.tool(
    'vault_browse',
    'Browse all components in the Vault community library.',
    {},
    async () => {
      const components = await vaultClient.browse();
      if (components.length === 0) {
        return { content: [{ type: 'text' as const, text: 'Vault is empty or unavailable.' }] };
      }
      const lines = components.map(c =>
        `- **${c.name}** by ${c.author}: ${c.description} [${c.tags.join(', ')}] (${c.stars} stars, ${c.downloads} downloads)`,
      );
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'vault_search',
    'Search Vault components by query, tags, framework, or design system.',
    {
      query: z.string().optional().describe('Search text'),
      tags: z.array(z.string()).optional().describe('Filter by tags'),
      framework: z.string().optional().describe('Filter by framework: react, vue, svelte, html'),
      designSystem: z.string().optional().describe('Filter by design system, e.g. "neo-brutalism"'),
    },
    async (opts) => {
      const results = await vaultClient.search(opts);
      if (results.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No components found matching your criteria.' }] };
      }
      const lines = results.map(c =>
        `- **${c.name}** by ${c.author}: ${c.description} [${c.tags.join(', ')}]`,
      );
      return { content: [{ type: 'text' as const, text: `Found ${results.length} component(s):\n${lines.join('\n')}` }] };
    },
  );

  server.tool(
    'vault_install',
    'Download and install a component from the Vault into your project.',
    {
      name: z.string().describe('Component name to install'),
    },
    async ({ name }) => {
      const component = await vaultClient.download(name);
      if (!component) {
        return { content: [{ type: 'text' as const, text: `Component "${name}" not found in Vault.` }] };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(component, null, 2) }] };
    },
  );

  server.tool(
    'vault_save',
    'Package a component for saving to the Vault. Provide the entry file content, local dependencies, and metadata.',
    {
      entryFile: z.string().describe('Entry file path, e.g. "src/components/Hero.tsx"'),
      entryContent: z.string().describe('Content of the entry file'),
      localFiles: z.record(z.string(), z.string()).describe('Map of local file paths to their content'),
      author: z.string().describe('Author name'),
      description: z.string().describe('Component description'),
      framework: z.enum(['react', 'vue', 'svelte', 'html']).describe('Framework'),
      styling: z.enum(['tailwind', 'css-modules', 'css', 'styled-components']).describe('Styling approach'),
      tags: z.array(z.string()).describe('Tags for discoverability'),
      designSystem: z.string().nullable().describe('Active design system preset ID, or null'),
    },
    async (input) => {
      const pkg = packageComponent({
        entryFile: input.entryFile,
        entryContent: input.entryContent,
        localFiles: input.localFiles as Record<string, string>,
        author: input.author,
        description: input.description,
        framework: input.framework,
        styling: input.styling,
        tags: input.tags,
        designSystem: input.designSystem,
      });
      return { content: [{ type: 'text' as const, text: JSON.stringify(pkg, null, 2) }] };
    },
  );

  server.tool(
    'vault_my_components',
    'Lists components saved by the current user. (Reads from local .vault/saved.json)',
    {},
    async () => {
      return { content: [{ type: 'text' as const, text: 'Local component tracking not yet implemented. Use vault_browse to see community components.' }] };
    },
  );

  server.tool(
    'vault_competition_list',
    'Lists all competitions.',
    {
      projectRoot: z.string().describe('Project root directory'),
    },
    async ({ projectRoot }) => {
      const competitions = listAllCompetitions(projectRoot);
      if (competitions.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No competitions found.' }] };
      }
      const lines = competitions.map(c =>
        `- **${c.name}** (${c.id}): ${c.description} | Deadline: ${c.deadline} | Submissions: ${c.submissions.length}${c.prize ? ` | Prize: ${c.prize}` : ''}`,
      );
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.tool(
    'vault_competition_submit',
    'Submit a component to a competition.',
    {
      projectRoot: z.string().describe('Project root directory'),
      competitionId: z.string().describe('Competition ID'),
      componentName: z.string().describe('Component name to submit'),
      author: z.string().describe('Author name'),
    },
    async ({ projectRoot, competitionId, componentName, author }) => {
      const submission = submitToCompetition(projectRoot, competitionId, componentName, author);
      if (!submission) {
        return { content: [{ type: 'text' as const, text: `Failed to submit. Competition "${competitionId}" not found or component already submitted.` }] };
      }
      return { content: [{ type: 'text' as const, text: `Submitted "${componentName}" to competition. Good luck!` }] };
    },
  );
}
