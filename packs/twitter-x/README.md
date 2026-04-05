# @linkraft/twitter-x

Twitter/X API v2 integration for Claude Code via MCP. Post tweets, search, manage likes, retweets, bookmarks, and look up users.

## Features

- 17 tools covering tweets, users, and engagement
- OAuth 2.0 with PKCE (browser-based auth flow)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- Twitter API v2

## Quick Start

1. Create a project at the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Set up OAuth 2.0 with PKCE, callback URL: `http://localhost:8585/callback`
3. Set your credentials:
   ```bash
   export TWITTER_CLIENT_ID="your-client-id"
   export TWITTER_CLIENT_SECRET="your-client-secret"
   ```
4. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `twitter_create_tweet` | Post a tweet, reply, or quote |
| `twitter_delete_tweet` | Delete your tweet |
| `twitter_get_tweet` | Get a tweet by ID |
| `twitter_search_tweets` | Search recent tweets |
| `twitter_get_user_tweets` | Get a user's tweets |
| `twitter_get_me` | Get your profile |
| `twitter_get_user` | Look up user by ID |
| `twitter_get_user_by_username` | Look up user by @username |
| `twitter_get_followers` | Get followers |
| `twitter_get_following` | Get following |
| `twitter_like_tweet` | Like a tweet |
| `twitter_unlike_tweet` | Unlike a tweet |
| `twitter_retweet` | Retweet |
| `twitter_undo_retweet` | Undo retweet |
| `twitter_bookmark_tweet` | Bookmark a tweet |
| `twitter_remove_bookmark` | Remove bookmark |
| `twitter_get_bookmarks` | Get bookmarks |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
