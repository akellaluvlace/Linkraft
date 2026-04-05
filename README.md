# Linkraft

Open-source toolkit that connects Claude Code to any service via MCP servers.

- **10 Pre-built Packs**: Telegram, Discord, Twitter/X, LinkedIn, Instagram, Gmail, Notion, Slack, Google Calendar, Google Sheets
- **128 Tools** across all packs, fully tested
- **Generator CLI**: point at any OpenAPI/Swagger spec and get a working MCP server

## Quick Start

### Use a pre-built pack

```bash
# Clone the repo
git clone https://github.com/akellaluvlace/Linkraft.git
cd Linkraft

# Install dependencies
npm install

# Build everything
npm run build

# Set up a pack (example: Telegram)
export TELEGRAM_BOT_TOKEN="your-token-from-botfather"

# Add to Claude Code MCP settings
```

Add this to your `.mcp.json`:
```json
{
  "mcpServers": {
    "linkraft-telegram": {
      "command": "node",
      "args": ["path/to/Linkraft/packs/telegram/dist/server.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your-token"
      }
    }
  }
}
```

### Generate a pack from an API spec

```bash
# Generate from OpenAPI spec
npx linkraft generate https://petstore.swagger.io/v2/swagger.json --name petstore

# Generate from local file
npx linkraft generate ./my-api.yaml --name my-api --auth api-key

# Validate a pack
npx linkraft validate ./packs/telegram

# Test a pack
npx linkraft test ./packs/telegram
```

## Available Packs

| Pack | Tools | Auth | Description |
|------|-------|------|-------------|
| [Telegram](packs/telegram) | 18 | Bot Token | Messages, groups, keyboards, webhooks |
| [Discord](packs/discord) | 22 | Bot Token | Messages, channels, guilds, members |
| [Twitter/X](packs/twitter-x) | 17 | OAuth 2.0 PKCE | Tweets, users, likes, bookmarks |
| [LinkedIn](packs/linkedin) | 9 | OAuth 2.0 | Posts, profiles, organizations |
| [Instagram](packs/instagram) | 10 | OAuth 2.0 | Media, comments, insights |
| [Gmail](packs/gmail) | 11 | Google OAuth | Send, read, label, threads |
| [Notion](packs/notion) | 10 | Bearer Token | Pages, databases, blocks |
| [Slack](packs/slack) | 14 | OAuth 2.0 | Messages, channels, reactions |
| [Google Calendar](packs/google-calendar) | 9 | Google OAuth | Events, calendars, quick add |
| [Google Sheets](packs/google-sheets) | 8 | Google OAuth | Read, write, append, manage |

Each pack has its own README, SETUP.md, and SKILL.md. See the individual pack directories for details.

## Project Structure

```
Linkraft/
  core/           # Shared modules (auth, HTTP, rate limiting, config)
  generator/      # CLI tool to generate MCP servers from API specs
  packs/          # Pre-built integration packs
    telegram/
    discord/
    twitter-x/
    linkedin/
    instagram/
    gmail/
    notion/
    slack/
    google-calendar/
    google-sheets/
  marketplace.json  # Pack registry
```

## Development

```bash
# Install
npm install

# Build all
npm run build

# Test all (284 tests)
npm test

# Lint
npm run lint

# Format
npm run format
```

## Tech Stack

- TypeScript (strict mode), Node.js >= 18
- `@modelcontextprotocol/sdk` for MCP servers
- OAuth 2.0 (PKCE) for auth flows
- stdio transport (local) + Streamable HTTP (remote)
- Vitest for testing

## License

MIT

## Author

[Akella inMotion](https://www.akellainmotion.com/legacy) (Nikita), Dublin
