# @linkraft/slack

Slack Web API integration for Claude Code via MCP. Send messages, manage channels, add reactions, and pin messages.

## Features

- 14 tools covering messages, channels, reactions, and pins
- OAuth 2.0 (standard code flow)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- Slack Web API

## Quick Start

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Add OAuth scopes and set the redirect URL to `http://localhost:8585/callback`
3. Set your credentials:
   ```bash
   export SLACK_CLIENT_ID="your-client-id"
   export SLACK_CLIENT_SECRET="your-client-secret"
   ```
4. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `slack_send_message` | Send a message to a channel |
| `slack_update_message` | Update an existing message |
| `slack_delete_message` | Delete a message |
| `slack_get_history` | Get channel message history |
| `slack_get_replies` | Get thread replies |
| `slack_list_channels` | List accessible channels |
| `slack_get_channel_info` | Get channel details |
| `slack_create_channel` | Create a new channel |
| `slack_invite_to_channel` | Invite users to a channel |
| `slack_set_channel_topic` | Set channel topic |
| `slack_add_reaction` | Add emoji reaction |
| `slack_remove_reaction` | Remove emoji reaction |
| `slack_pin_message` | Pin a message |
| `slack_unpin_message` | Unpin a message |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
