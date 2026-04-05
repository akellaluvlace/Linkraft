# @linkraft/google-sheets

Google Sheets API v4 integration for Claude Code via MCP. Create spreadsheets, read and write cell values, append rows, and batch-read across ranges.

## Features

- 8 tools covering spreadsheet management and cell value operations
- OAuth 2.0 (standard code flow, browser-based auth)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- Google Sheets API v4

## Quick Start

1. Create a project at the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Sheets API
3. Create OAuth 2.0 credentials with callback URL: `http://localhost:8585/callback`
4. Set your credentials:
   ```bash
   export GOOGLE_SHEETS_CLIENT_ID="your-client-id"
   export GOOGLE_SHEETS_CLIENT_SECRET="your-client-secret"
   ```
5. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `gsheets_get_spreadsheet` | Get spreadsheet metadata (title, sheets/tabs) |
| `gsheets_create_spreadsheet` | Create a new spreadsheet |
| `gsheets_add_sheet` | Add a sheet/tab to an existing spreadsheet |
| `gsheets_get_values` | Read cell values from a range |
| `gsheets_update_values` | Write cell values to a range |
| `gsheets_append_values` | Append rows after existing data |
| `gsheets_clear_values` | Clear values in a range |
| `gsheets_batch_get` | Read multiple ranges in one request |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
