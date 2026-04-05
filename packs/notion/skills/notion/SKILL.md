---
name: notion
description: Manage Notion pages, databases, and blocks via the Notion API
---

# Notion Pack

Connect to the Notion API (v2022-06-28). Create and update pages, query databases, and manage block content.

## Available Tools

### Pages
- `notion_get_page` - Get a page by ID
- `notion_create_page` - Create a new page in a database or under a page
- `notion_update_page` - Update page properties
- `notion_archive_page` - Archive (soft-delete) a page

### Databases
- `notion_query_database` - Query a database with optional filters and sorts
- `notion_get_database` - Get database schema and metadata
- `notion_create_database` - Create a new database inside a page

### Blocks
- `notion_get_block_children` - Get child blocks of a page or block
- `notion_append_block_children` - Append content blocks to a page or block
- `notion_delete_block` - Delete (archive) a block

## Usage Examples

Get a page:
```
notion_get_page page_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

Create a page in a database:
```
notion_create_page parent_type="database_id" parent_id="abc123" properties={"Name": {"title": [{"text": {"content": "My New Page"}}]}}
```

Query a database with filter:
```
notion_query_database database_id="abc123" filter={"property": "Status", "select": {"equals": "Done"}} page_size=10
```

Append text to a page:
```
notion_append_block_children block_id="page-id" children=[{"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": "Hello from Linkraft!"}}]}}]
```

Archive a page:
```
notion_archive_page page_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Auth

Requires a Notion Internal Integration Token from [notion.so/my-integrations](https://www.notion.so/my-integrations). Set via `NOTION_API_KEY` env var or in `mcpkit.config.json`.

The integration must be connected to the pages/databases you want to access. In Notion, open the page, click the three-dot menu, then "Connect to" and select your integration.

## Rate Limits

Default: 180 requests/minute (3 per second). Notion enforces strict rate limits, and the server handles 429 responses with automatic retry.
