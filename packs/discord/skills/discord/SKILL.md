---
name: discord
description: Send messages, manage channels, guilds, and members via the Discord Bot API
---

# Discord Pack

Connect to the Discord Bot API (v10). Send and manage messages, create and modify channels, manage guild members and roles.

## Available Tools

### Messages
- `discord_send_message` - Send a text message to a channel
- `discord_edit_message` - Edit a previously sent message
- `discord_delete_message` - Delete a message
- `discord_get_messages` - Get recent messages from a channel
- `discord_add_reaction` - Add an emoji reaction to a message
- `discord_pin_message` - Pin a message in a channel

### Channels
- `discord_get_channel` - Get channel info (name, type, topic)
- `discord_modify_channel` - Update channel name, topic, NSFW, or slowmode
- `discord_create_channel` - Create a new channel in a guild
- `discord_delete_channel` - Permanently delete a channel
- `discord_get_pinned_messages` - Get all pinned messages

### Guilds
- `discord_get_guild` - Get guild/server info
- `discord_get_guild_channels` - List all channels in a guild
- `discord_list_guild_members` - List guild members
- `discord_get_guild_roles` - List all roles in a guild
- `discord_create_guild_role` - Create a new role

### Members
- `discord_get_member` - Get member info (nickname, roles, join date)
- `discord_kick_member` - Kick a member from the guild
- `discord_ban_member` - Ban a user and optionally delete their messages
- `discord_unban_member` - Remove a ban
- `discord_add_role` - Add a role to a member
- `discord_remove_role` - Remove a role from a member

## Usage Examples

Send a message:
```
discord_send_message channel_id="123456789" content="Hello from Linkraft!"
```

Get recent messages:
```
discord_get_messages channel_id="123456789" limit=10
```

Create a channel:
```
discord_create_channel guild_id="123456789" name="general-chat" type=0 topic="Main discussion"
```

Ban a user with message cleanup:
```
discord_ban_member guild_id="123456789" user_id="987654321" delete_message_seconds=86400
```

## Auth

Requires a Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications). Set via `DISCORD_BOT_TOKEN` env var or in `mcpkit.config.json`.

## Rate Limits

Default: 50 requests/minute. Discord enforces per-route rate limits, and the server handles 429 responses with automatic retry.
