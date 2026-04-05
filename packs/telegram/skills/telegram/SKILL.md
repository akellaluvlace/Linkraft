---
name: telegram
description: Send messages, manage groups, handle webhooks and inline keyboards via the Telegram Bot API
---

# Telegram Pack

Connect to the Telegram Bot API. Send and manage messages, moderate groups, set up webhooks, and create interactive inline keyboards.

## Available Tools

### Messages
- `telegram_send_message` - Send text with optional HTML/Markdown formatting
- `telegram_send_photo` - Send a photo by URL or file_id
- `telegram_send_document` - Send a file/document by URL or file_id
- `telegram_edit_message` - Edit a previously sent message
- `telegram_delete_message` - Delete a message (48h limit in groups)
- `telegram_forward_message` - Forward a message between chats

### Groups
- `telegram_get_chat` - Get chat info (title, type, description, member count)
- `telegram_get_chat_members_count` - Get member count
- `telegram_ban_chat_member` - Ban a user (bot must be admin)
- `telegram_unban_chat_member` - Unban a user
- `telegram_set_chat_title` - Change chat title (bot must be admin)
- `telegram_pin_message` - Pin a message (bot must be admin)

### Updates & Webhooks
- `telegram_get_updates` - Poll for new messages/events via long polling
- `telegram_set_webhook` - Register an HTTPS webhook URL
- `telegram_delete_webhook` - Remove the current webhook
- `telegram_get_webhook_info` - Check webhook status and pending updates

### Keyboards
- `telegram_send_inline_keyboard` - Send a message with clickable inline buttons
- `telegram_answer_callback_query` - Respond to an inline button press

## Usage Examples

Send a formatted message:
```
telegram_send_message chat_id="@mychannel" text="<b>Breaking news!</b>\nSomething happened." parse_mode="HTML"
```

Send a photo with caption:
```
telegram_send_photo chat_id="12345" photo="https://example.com/img.jpg" caption="Check this out"
```

Create an inline keyboard:
```
telegram_send_inline_keyboard chat_id="12345" text="Choose an option:" inline_keyboard=[[{"text":"Option A","callback_data":"a"},{"text":"Option B","callback_data":"b"}]]
```

Check for new messages:
```
telegram_get_updates limit=10 timeout=5
```

## Auth

Requires a Telegram Bot Token from [@BotFather](https://t.me/BotFather). Set via `TELEGRAM_BOT_TOKEN` env var or in `mcpkit.config.json`.

## Rate Limits

Default: 30 requests/minute, 50,000/day (matches Telegram Bot API limits). Configurable in `mcpkit.config.json`.
