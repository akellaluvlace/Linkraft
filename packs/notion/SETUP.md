# Notion Pack Setup

## Prerequisites

- Node.js >= 18
- A Notion account

## Steps

1. **Create an internal integration**

   Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and click "New integration". Give it a name (e.g. "Linkraft") and select the workspace. Click "Submit".

2. **Copy the integration token**

   On the integration page, find the "Internal Integration Secret" and click "Show" then "Copy". The token starts with `secret_` or `ntn_`.

3. **Set the required capabilities**

   Under "Capabilities", enable:
   - Read content
   - Update content
   - Insert content

4. **Connect the integration to your pages**

   In Notion, open a page or database you want to access. Click the three-dot menu in the top-right corner, then "Connect to" and select your integration. The integration can only access pages it has been explicitly connected to.

5. **Set the API key**

   Option A: environment variable (recommended):
   ```bash
   export NOTION_API_KEY="secret_your-token-here"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json`:
   ```bash
   cp config.example.json mcpkit.config.json
   ```
   Then replace the placeholder with your actual token.

6. **Add to Claude Code**

   Add this to your Claude Code MCP settings (`.mcp.json` or settings):
   ```json
   {
     "mcpServers": {
       "linkraft-notion": {
         "command": "node",
         "args": ["path/to/packs/notion/dist/server.js"],
         "env": {
           "NOTION_API_KEY": "secret_your-token-here"
         }
       }
     }
   }
   ```

7. **Build the pack**

   ```bash
   cd packs/notion
   npm run build
   ```

8. **Verify it works**

   Start Claude Code and try:
   ```
   Use notion_get_page to get page a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

## Permissions Reference

| Action | Required Capability |
|--------|-------------------|
| Read pages/databases/blocks | Read content |
| Update page properties | Update content |
| Archive pages | Update content |
| Create pages/databases | Insert content |
| Append blocks | Insert content |
| Delete blocks | Update content |

## Troubleshooting

**"No API key configured"**: Set `NOTION_API_KEY` env var or add it to `mcpkit.config.json`.

**"Invalid token format"**: Notion tokens start with `secret_` or `ntn_`. Copy it again from [notion.so/my-integrations](https://www.notion.so/my-integrations).

**"Could not find page"**: The integration must be connected to the page. Open the page in Notion, click the three-dot menu, then "Connect to" and select your integration.

**403 Forbidden**: Your integration lacks the required capability. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations), select your integration, and enable the needed capabilities under "Capabilities".

**429 Rate Limited**: Notion allows 3 requests per second. The server handles this automatically with retry, but reduce concurrent usage if you see persistent errors.
