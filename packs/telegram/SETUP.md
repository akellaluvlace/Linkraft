# Telegram Pack Setup

## Prerequisites

- Node.js >= 18
- A Telegram account

## Steps

1. **Create a bot with BotFather**

   Open Telegram and message [@BotFather](https://t.me/BotFather):
   ```
   /newbot
   ```
   Follow the prompts. BotFather will give you a token like:
   ```
   123456789:ABCDefGHIJKlmnop_qRSTUVWxyz-1234567
   ```

2. **Set the bot token**

   Option A: environment variable (recommended):
   ```bash
   export TELEGRAM_BOT_TOKEN="123456789:ABCDefGHIJKlmnop_qRSTUVWxyz-1234567"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json`:
   ```bash
   cp config.example.json mcpkit.config.json
   ```
   Then replace `YOUR_BOT_TOKEN_FROM_BOTFATHER` with your actual token.

3. **Add to Claude Code**

   Add this to your Claude Code MCP settings (`.mcp.json` or settings):
   ```json
   {
     "mcpServers": {
       "linkraft-telegram": {
         "command": "node",
         "args": ["path/to/packs/telegram/dist/server.js"],
         "env": {
           "TELEGRAM_BOT_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

4. **Build the pack**

   ```bash
   cd packs/telegram
   npm run build
   ```

5. **Verify it works**

   Start Claude Code and try:
   ```
   Use telegram_get_updates to check for new messages
   ```

## Permissions

Your bot needs specific permissions depending on which tools you use:

| Action | Required Permission |
|--------|-------------------|
| Send/edit/delete messages | Default (no special permissions) |
| Ban/unban members | Admin with "Ban users" right |
| Change chat title | Admin with "Change group info" right |
| Pin messages | Admin with "Pin messages" right |
| Manage webhooks | Default (no special permissions) |

To make your bot an admin, go to your group settings and add it as an administrator with the required rights.

## Troubleshooting

**"No bot token configured"**: Set `TELEGRAM_BOT_TOKEN` env var or add it to `mcpkit.config.json`.

**"Invalid bot token format"**: Token must match `123456:ABC...` format. Copy the full token from BotFather.

**403 Forbidden on group actions**: Your bot needs admin permissions in that group. See the permissions table above.

**409 Conflict**: Another instance is using `getUpdates` on the same bot. Stop other instances or use webhooks instead.
