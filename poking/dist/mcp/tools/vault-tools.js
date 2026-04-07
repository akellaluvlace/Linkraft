"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVaultTools = registerVaultTools;
const zod_1 = require("zod");
const vault_client_js_1 = require("../../vault/vault-client.js");
const component_packager_js_1 = require("../../vault/component-packager.js");
const competition_js_1 = require("../../vault/competition.js");
function registerVaultTools(server) {
    server.tool('vault_browse', 'Browse all components in the Vault community library. Always returns results (falls back to bundled examples if offline).', {}, async () => {
        const result = await vault_client_js_1.vaultClient.browse();
        const header = result.message ? `${result.message}\n\n` : '';
        const sourceTag = result.source === 'bundled' ? ' (bundled)' : '';
        const lines = result.data.map(c => `- **${c.name}** by ${c.author}: ${c.description} [${c.tags.join(', ')}]${sourceTag}`);
        return { content: [{ type: 'text', text: `${header}${lines.join('\n')}` }] };
    });
    server.tool('vault_search', 'Search Vault components by query, tags, framework, or design system.', {
        query: zod_1.z.string().optional().describe('Search text'),
        tags: zod_1.z.array(zod_1.z.string()).optional().describe('Filter by tags'),
        framework: zod_1.z.string().optional().describe('Filter by framework: react, vue, svelte, html'),
        designSystem: zod_1.z.string().optional().describe('Filter by design system, e.g. "neo-brutalism"'),
    }, async (opts) => {
        const result = await vault_client_js_1.vaultClient.search(opts);
        if (result.data.length === 0) {
            const msg = result.message ?? 'No components found matching your criteria. Try broader terms or /linkraft vault browse to see all.';
            return { content: [{ type: 'text', text: msg }] };
        }
        const header = result.message ? `${result.message}\n\n` : '';
        const lines = result.data.map(c => `- **${c.name}** by ${c.author}: ${c.description} [${c.tags.join(', ')}]`);
        return { content: [{ type: 'text', text: `${header}Found ${result.data.length} component(s):\n${lines.join('\n')}` }] };
    });
    server.tool('vault_install', 'Download and install a component from the Vault into your project.', {
        name: zod_1.z.string().describe('Component name to install'),
    }, async ({ name }) => {
        const result = await vault_client_js_1.vaultClient.download(name);
        if (!result.data) {
            const msg = result.message ?? `Component "${name}" not found. Run /linkraft vault browse to see available components.`;
            return { content: [{ type: 'text', text: msg }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    });
    server.tool('vault_save', 'Package a component for saving to the Vault.', {
        entryFile: zod_1.z.string().describe('Entry file path'),
        entryContent: zod_1.z.string().describe('Content of the entry file'),
        localFiles: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).describe('Map of local file paths to content'),
        author: zod_1.z.string().describe('Author name'),
        description: zod_1.z.string().describe('Component description'),
        framework: zod_1.z.enum(['react', 'vue', 'svelte', 'html']).describe('Framework'),
        styling: zod_1.z.enum(['tailwind', 'css-modules', 'css', 'styled-components']).describe('Styling'),
        tags: zod_1.z.array(zod_1.z.string()).describe('Tags for discoverability'),
        designSystem: zod_1.z.string().nullable().describe('Active preset ID or null'),
    }, async (input) => {
        const pkg = (0, component_packager_js_1.packageComponent)({
            entryFile: input.entryFile,
            entryContent: input.entryContent,
            localFiles: input.localFiles,
            author: input.author,
            description: input.description,
            framework: input.framework,
            styling: input.styling,
            tags: input.tags,
            designSystem: input.designSystem,
        });
        return { content: [{ type: 'text', text: JSON.stringify(pkg, null, 2) }] };
    });
    server.tool('vault_my_components', 'Lists components saved by the current user.', {}, async () => {
        return { content: [{ type: 'text', text: 'Local component tracking not yet implemented. Use vault_browse to see community components.' }] };
    });
    server.tool('vault_competition_list', 'Lists all competitions.', { projectRoot: zod_1.z.string().describe('Project root directory') }, async ({ projectRoot }) => {
        const competitions = (0, competition_js_1.listAllCompetitions)(projectRoot);
        if (competitions.length === 0) {
            return { content: [{ type: 'text', text: 'No competitions found. Create one with /linkraft vault competition create.' }] };
        }
        const lines = competitions.map(c => `- **${c.name}** (${c.id}): ${c.description} | Deadline: ${c.deadline} | Submissions: ${c.submissions.length}${c.prize ? ` | Prize: ${c.prize}` : ''}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
    });
    server.tool('vault_competition_submit', 'Submit a component to a competition.', {
        projectRoot: zod_1.z.string().describe('Project root directory'),
        competitionId: zod_1.z.string().describe('Competition ID'),
        componentName: zod_1.z.string().describe('Component name'),
        author: zod_1.z.string().describe('Author name'),
    }, async ({ projectRoot, competitionId, componentName, author }) => {
        const submission = (0, competition_js_1.submitToCompetition)(projectRoot, competitionId, componentName, author);
        if (!submission) {
            return { content: [{ type: 'text', text: `Failed to submit. Competition "${competitionId}" not found or already submitted. Run /linkraft vault competition list to see active competitions.` }] };
        }
        return { content: [{ type: 'text', text: `Submitted "${componentName}" to competition. Good luck!` }] };
    });
}
//# sourceMappingURL=vault-tools.js.map