# Slack Pack Setup

## Prerequisites

- Node.js >= 18
- A Slack workspace where you have permission to install apps
- Ability to create a Slack App

## Steps

1. **Create a Slack App**

   Go to [api.slack.com/apps](https://api.slack.com/apps). Click "Create New App", choose "From scratch", name it (e.g. "Linkraft"), and select your workspace.

2. **Configure OAuth Scopes**

   In the sidebar, go to "OAuth & Permissions". Under "Scopes", add these Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `channels:history`
   - `users:read`
   - `reactions:write`
   - `files:write`
   - `pins:write`

3. **Set the Redirect URL**

   Under "OAuth & Permissions", add a redirect URL:
   ```
   http://localhost:8585/callback
   ```

4. **Get your credentials**

   In the sidebar, go to "Basic Information". Under "App Credentials", copy:
   - **Client ID**
   - **Client Secret**

5. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export SLACK_CLIENT_ID="your-client-id"
   export SLACK_CLIENT_SECRET="your-client-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

6. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-slack": {
         "command": "node",
         "args": ["path/to/packs/slack/dist/server.js"],
         "env": {
           "SLACK_CLIENT_ID": "your-client-id",
           "SLACK_CLIENT_SECRET": "your-client-secret"
         }
       }
     }
   }
   ```

7. **Build the pack**

   ```bash
   cd packs/slack
   npm run build
   ```

8. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with Slack, and authorize the app. The callback is handled automatically.

## Install to Workspace

After OAuth authorization, the app is installed to the workspace you chose. You may need to invite the bot to specific channels using `/invite @YourBotName`.

## Rate Limits

Slack Web API uses tiered rate limiting:
- Tier 1: 1 request per minute
- Tier 2: 20 requests per minute
- Tier 3: 50 requests per minute
- Tier 4: 100 requests per minute

Most methods used by this pack are Tier 2 or Tier 3. The server retries automatically on 429 responses.

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**"not_in_channel" error**: The bot needs to be invited to the channel. Use `/invite @YourBotName` in the channel.

**"missing_scope" error**: Your app is missing a required OAuth scope. Go to "OAuth & Permissions" in your Slack App settings and add the missing scope. You may need to reinstall the app.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/slack.json` and restarting.
