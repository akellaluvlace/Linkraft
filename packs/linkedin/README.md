# @linkraft/linkedin

LinkedIn API v2 integration for Claude Code via MCP. Create posts, view profiles, manage organization content, and track follower stats.

## Features

- 9 tools covering posts, profiles, and organizations
- OAuth 2.0 (standard code flow with client_secret)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- LinkedIn Community Management API v2

## Quick Start

1. Create an app at the [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Set up OAuth 2.0, callback URL: `http://localhost:8585/callback`
3. Set your credentials:
   ```bash
   export LINKEDIN_CLIENT_ID="your-client-id"
   export LINKEDIN_CLIENT_SECRET="your-client-secret"
   ```
4. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `linkedin_create_post` | Create a text post |
| `linkedin_delete_post` | Delete a post |
| `linkedin_get_post` | Get a post by URN |
| `linkedin_get_me` | Get your profile |
| `linkedin_get_profile` | Look up profile by ID |
| `linkedin_get_connections_count` | Get connection count |
| `linkedin_get_organization` | Get org details |
| `linkedin_get_organization_followers_count` | Get org follower count |
| `linkedin_create_org_post` | Post as an organization |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
