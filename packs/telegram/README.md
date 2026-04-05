# @linkraft/telegram

Telegram Bot API integration for Claude Code via MCP. Send messages, manage groups, handle webhooks, and create inline keyboards.

## Features

- 18 tools covering messages, groups, webhooks, and keyboards
- Bot token auth with format validation
- Rate limiting (30 req/min, 50k/day by default)
- Automatic retry with exponential backoff
- HTML, Markdown, and MarkdownV2 formatting support

## Quick Start

1. Get a bot token from [@BotFather](https://t.me/BotFather) on Telegram
2. Set your token:
   ```bash
   export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
   ```
3. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `telegram_send_message` | Send text message with formatting |
| `telegram_send_photo` | Send photo by URL or file_id |
| `telegram_send_document` | Send file by URL or file_id |
| `telegram_edit_message` | Edit a sent message |
| `telegram_delete_message` | Delete a message |
| `telegram_forward_message` | Forward between chats |
| `telegram_get_chat` | Get chat details |
| `telegram_get_chat_members_count` | Get member count |
| `telegram_ban_chat_member` | Ban a user |
| `telegram_unban_chat_member` | Unban a user |
| `telegram_set_chat_title` | Change chat title |
| `telegram_pin_message` | Pin a message |
| `telegram_get_updates` | Long poll for updates |
| `telegram_set_webhook` | Set webhook URL |
| `telegram_delete_webhook` | Remove webhook |
| `telegram_get_webhook_info` | Check webhook status |
| `telegram_send_inline_keyboard` | Send inline buttons |
| `telegram_answer_callback_query` | Answer button press |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your bot token:

```json
{
  "name": "telegram",
  "auth": {
    "type": "bot-token",
    "botToken": "YOUR_TOKEN"
  }
}
```

All settings (rate limits, transport, logging) are optional and have sensible defaults. See [config.example.json](config.example.json).

## License

MIT
