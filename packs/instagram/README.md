# @linkraft/instagram

Instagram Graph API integration for Claude Code via MCP. View and publish media, manage comments, and access account insights.

## Features

- 10 tools covering media, comments, and insights
- OAuth 2.0 via Facebook (standard code flow)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- Instagram Graph API v21.0

## Quick Start

1. Create a Facebook App at the [Facebook Developer Portal](https://developers.facebook.com/apps/)
2. Add Instagram Graph API product to your app
3. Set callback URL: `http://localhost:8585/callback`
4. Set your credentials:
   ```bash
   export INSTAGRAM_CLIENT_ID="your-app-id"
   export INSTAGRAM_CLIENT_SECRET="your-app-secret"
   ```
5. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `instagram_get_media` | Get a media item by ID |
| `instagram_get_user_media` | Get a user's recent media |
| `instagram_create_photo_post` | Create and publish a photo |
| `instagram_get_comments` | Get comments on a media item |
| `instagram_reply_to_comment` | Reply to a comment |
| `instagram_delete_comment` | Delete a comment |
| `instagram_hide_comment` | Hide or unhide a comment |
| `instagram_get_user_insights` | Get account insights |
| `instagram_get_media_insights` | Get media insights |
| `instagram_get_profile` | Get profile info |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
