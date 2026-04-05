---
name: slack
description: Send messages, manage channels, add reactions, and pin messages in Slack via the Web API
---

# Slack Pack

Connect to the Slack Web API via OAuth 2.0. Send and manage messages, list and create channels, add emoji reactions, and pin messages.

## Available Tools

### Messages
- `slack_send_message` - Send a message to a channel, with optional threading
- `slack_update_message` - Update an existing message
- `slack_delete_message` - Delete a message
- `slack_get_history` - Get recent messages from a channel
- `slack_get_replies` - Get replies in a message thread

### Channels
- `slack_list_channels` - List channels the bot can access
- `slack_get_channel_info` - Get detailed info about a channel
- `slack_create_channel` - Create a new channel (public or private)
- `slack_invite_to_channel` - Invite users to a channel
- `slack_set_channel_topic` - Set a channel's topic

### Reactions and Pins
- `slack_add_reaction` - Add an emoji reaction to a message
- `slack_remove_reaction` - Remove an emoji reaction from a message
- `slack_pin_message` - Pin a message in a channel
- `slack_unpin_message` - Unpin a message in a channel

## Usage Examples

Send a message:
```
slack_send_message channel="C01234ABCDE" text="Hello from Linkraft!"
```

Reply in a thread:
```
slack_send_message channel="C01234ABCDE" text="Thread reply" thread_ts="1234567890.123456"
```

List channels:
```
slack_list_channels limit=20
```

Add a reaction:
```
slack_add_reaction channel="C01234ABCDE" timestamp="1234567890.123456" name="rocket"
```

Get channel history:
```
slack_get_history channel="C01234ABCDE" limit=50
```

## Auth

Uses OAuth 2.0 (standard code flow). On first run, the server opens a browser-based auth flow. Tokens are stored locally and refresh automatically.

Set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` from your [Slack App settings](https://api.slack.com/apps).

## Rate Limits

Slack Web API has per-method rate limits (typically Tier 2 or Tier 3). Default: 50 requests/minute. The server retries automatically on 429 responses.
