---
name: gmail
description: Send, read, and manage Gmail messages, labels, and threads via the Gmail API
---

# Gmail Pack

Connect to the Gmail API via Google OAuth 2.0. Send emails, search messages, manage labels, and browse threads.

## Available Tools

### Messages
- `gmail_list_messages` - List messages matching a Gmail search query (e.g. "is:unread", "from:user@example.com")
- `gmail_get_message` - Get a single message by ID with full headers and body
- `gmail_send_message` - Send an email with to, subject, body, and optional cc/bcc
- `gmail_trash_message` - Move a message to trash (recoverable within 30 days)
- `gmail_untrash_message` - Remove a message from trash

### Labels
- `gmail_list_labels` - List all labels (system and user-created)
- `gmail_create_label` - Create a new label (supports nested labels with "/" separator)
- `gmail_delete_label` - Delete a label (messages are not deleted)
- `gmail_modify_labels` - Add or remove labels from a message (mark read, archive, star, etc.)

### Threads
- `gmail_list_threads` - List threads matching a search query
- `gmail_get_thread` - Get a full thread with all messages

## Usage Examples

Send an email:
```
gmail_send_message to="user@example.com" subject="Hello" body="Hi from Linkraft!"
```

Search for unread messages:
```
gmail_list_messages query="is:unread" max_results=20
```

Get a specific message:
```
gmail_get_message message_id="18abc123def"
```

List all labels:
```
gmail_list_labels
```

Mark a message as read:
```
gmail_modify_labels message_id="18abc123def" remove_label_ids=["UNREAD"]
```

Archive a message (remove from inbox):
```
gmail_modify_labels message_id="18abc123def" remove_label_ids=["INBOX"]
```

Search threads by sender:
```
gmail_list_threads query="from:boss@company.com" max_results=10
```

## Auth

Uses Google OAuth 2.0 (standard code flow with client secret). On first run, the server opens a browser-based auth flow. Tokens are stored locally and refresh automatically.

Set `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Rate Limits

The Gmail API allows 250 requests per minute per user. The server retries automatically on 429 responses.
