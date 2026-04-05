# Discord Pack Setup

## Prerequisites

- Node.js >= 18
- A Discord account

## Steps

1. **Create an application in the Discord Developer Portal**

   Go to [discord.com/developers/applications](https://discord.com/developers/applications) and click "New Application". Give it a name and click "Create".

2. **Create a bot user**

   In your application settings, go to the "Bot" tab and click "Add Bot". Copy the bot token.

3. **Enable required intents**

   On the Bot tab, under "Privileged Gateway Intents", enable:
   - "Server Members Intent" (needed for `discord_list_guild_members`)
   - "Message Content Intent" (needed to read message content)

4. **Invite the bot to your server**

   Go to the "OAuth2" tab, then "URL Generator":
   - Under "Scopes", select `bot`
   - Under "Bot Permissions", select the permissions you need:
     - Send Messages
     - Manage Messages (for delete/pin)
     - Manage Channels (for create/modify/delete channels)
     - Manage Roles (for role management)
     - Kick Members
     - Ban Members
   - Copy the generated URL and open it in your browser to invite the bot

5. **Set the bot token**

   Option A: environment variable (recommended):
   ```bash
   export DISCORD_BOT_TOKEN="your-token-here"
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
       "linkraft-discord": {
         "command": "node",
         "args": ["path/to/packs/discord/dist/server.js"],
         "env": {
           "DISCORD_BOT_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

7. **Build the pack**

   ```bash
   cd packs/discord
   npm run build
   ```

8. **Verify it works**

   Start Claude Code and try:
   ```
   Use discord_get_guild to get info about server 123456789
   ```

## Permissions Reference

| Action | Required Permission |
|--------|-------------------|
| Send/edit messages | Send Messages |
| Delete/pin messages | Manage Messages |
| Read message history | Read Message History |
| Add reactions | Add Reactions |
| Create/modify/delete channels | Manage Channels |
| Kick members | Kick Members |
| Ban/unban members | Ban Members |
| Manage roles | Manage Roles |
| List members | Server Members Intent |

## Troubleshooting

**"No bot token configured"**: Set `DISCORD_BOT_TOKEN` env var or add it to `mcpkit.config.json`.

**403 Forbidden**: Your bot lacks the required permission. Check the permissions reference above and re-invite with the correct scopes.

**"Missing Access" on member list**: Enable "Server Members Intent" in the Developer Portal under Bot settings.

**50001 Missing Access**: The bot cannot see the channel. Check that the bot has access to the channel via role permissions.
