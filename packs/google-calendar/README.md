# @linkraft/google-calendar

Google Calendar API v3 integration for Claude Code via MCP. Create, read, update, and delete calendar events. Manage calendars and use natural language quick add.

## Features

- 9 tools covering events and calendars
- OAuth 2.0 (standard code flow, browser-based auth)
- Automatic token refresh
- Rate limiting with retry on 429 responses
- Google Calendar API v3

## Quick Start

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials (Web application), callback URL: `http://localhost:8585/callback`
4. Set your credentials:
   ```bash
   export GOOGLE_CALENDAR_CLIENT_ID="your-client-id"
   export GOOGLE_CALENDAR_CLIENT_SECRET="your-client-secret"
   ```
5. Add the MCP server to your Claude Code config (see [SETUP.md](SETUP.md))

## Tools

| Tool | Description |
|------|-------------|
| `gcal_list_events` | List events with time range and search |
| `gcal_get_event` | Get event by ID |
| `gcal_create_event` | Create an event |
| `gcal_update_event` | Update an event |
| `gcal_delete_event` | Delete an event |
| `gcal_quick_add` | Quick add via natural language |
| `gcal_list_calendars` | List all calendars |
| `gcal_get_calendar` | Get calendar details |
| `gcal_create_calendar` | Create a new calendar |

## Configuration

Copy `config.example.json` to `mcpkit.config.json` and fill in your credentials. See [config.example.json](config.example.json).

## License

MIT
