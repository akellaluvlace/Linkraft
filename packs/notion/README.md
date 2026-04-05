# @linkraft/notion

Notion API integration for Claude Code via MCP. Manage pages, query databases, and read/write block content.

## Features

- 10 tools covering pages, databases, and blocks
- Bearer token auth with format validation
- Notion API v2022-06-28
- Rate limiting with automatic retry on 429 responses
- Automatic retry with exponential backoff

## Quick Start

1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Copy the Internal Integration Token and set it:
   ```bash
   export NOTION_API_KEY="secret_your-token-here"
   ```
3. Connect the integration to your pages/databases in Notion
4. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `notion_get_page` | Get a page by ID |
| `notion_create_page` | Create a new page |
| `notion_update_page` | Update page properties |
| `notion_archive_page` | Archive (soft-delete) a page |
| `notion_query_database` | Query a database with filters and sorts |
| `notion_get_database` | Get database schema |
| `notion_create_database` | Create a new database |
| `notion_get_block_children` | Get child blocks of a page/block |
| `notion_append_block_children` | Append content blocks |
| `notion_delete_block` | Delete a block |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your token:

```json
{
  "name": "notion",
  "auth": {
    "type": "bot-token",
    "botToken": "secret_YOUR_TOKEN"
  }
}
```

All settings (rate limits, transport, logging) are optional and have sensible defaults. See [config.example.json](config.example.json).

## License

MIT
