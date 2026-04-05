# @linkraft/discord

Discord Bot API integration for Claude Code via MCP. Send messages, manage channels, moderate guilds, and handle member roles.

## Features

- 22 tools covering messages, channels, guilds, and members
- Bot token auth with format validation
- Discord API v10
- Rate limiting with automatic retry on 429 responses
- Automatic retry with exponential backoff

## Quick Start

1. Create a bot at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Copy the bot token and set it:
   ```bash
   export DISCORD_BOT_TOKEN="your-token-here"
   ```
3. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `discord_send_message` | Send text message to a channel |
| `discord_edit_message` | Edit a sent message |
| `discord_delete_message` | Delete a message |
| `discord_get_messages` | Get recent messages |
| `discord_add_reaction` | React with an emoji |
| `discord_pin_message` | Pin a message |
| `discord_get_channel` | Get channel details |
| `discord_modify_channel` | Update channel settings |
| `discord_create_channel` | Create a new channel |
| `discord_delete_channel` | Delete a channel |
| `discord_get_pinned_messages` | Get pinned messages |
| `discord_get_guild` | Get guild/server info |
| `discord_get_guild_channels` | List guild channels |
| `discord_list_guild_members` | List guild members |
| `discord_get_guild_roles` | List guild roles |
| `discord_create_guild_role` | Create a new role |
| `discord_get_member` | Get member info |
| `discord_kick_member` | Kick a member |
| `discord_ban_member` | Ban a user |
| `discord_unban_member` | Unban a user |
| `discord_add_role` | Add role to member |
| `discord_remove_role` | Remove role from member |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your bot token:

```json
{
  "name": "discord",
  "auth": {
    "type": "bot-token",
    "botToken": "YOUR_TOKEN"
  }
}
```

All settings (rate limits, transport, logging) are optional and have sensible defaults. See [config.example.json](config.example.json).

## License

MIT
