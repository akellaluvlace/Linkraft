# @linkraft/gmail

Gmail API integration for Claude Code via MCP. Send emails, search messages, manage labels, and browse threads.

## Features

- 11 tools covering messages, labels, and threads
- Google OAuth 2.0 (standard code flow with client secret)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- Gmail API v1

## Quick Start

1. Create a project at the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Gmail API in "APIs & Services"
3. Create OAuth 2.0 credentials with callback URL: `http://localhost:8585/callback`
4. Set your credentials:
   ```bash
   export GMAIL_CLIENT_ID="your-client-id"
   export GMAIL_CLIENT_SECRET="your-client-secret"
   ```
5. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `gmail_list_messages` | Search messages with Gmail query syntax |
| `gmail_get_message` | Get message by ID with full content |
| `gmail_send_message` | Send an email |
| `gmail_trash_message` | Move message to trash |
| `gmail_untrash_message` | Remove message from trash |
| `gmail_list_labels` | List all labels |
| `gmail_create_label` | Create a label |
| `gmail_delete_label` | Delete a label |
| `gmail_modify_labels` | Add/remove labels from a message |
| `gmail_list_threads` | Search threads |
| `gmail_get_thread` | Get thread with all messages |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
