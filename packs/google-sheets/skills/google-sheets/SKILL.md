---
name: google-sheets
description: Create spreadsheets, read/write cell values, and manage sheets via the Google Sheets API v4
---

# Google Sheets Pack

Connect to the Google Sheets API v4 via OAuth 2.0. Create spreadsheets, read and write cell values, append rows, and batch-read multiple ranges.

## Available Tools

### Spreadsheets
- `gsheets_get_spreadsheet` - Get spreadsheet metadata (title, locale, list of sheets/tabs)
- `gsheets_create_spreadsheet` - Create a new spreadsheet with a title
- `gsheets_add_sheet` - Add a new sheet/tab to an existing spreadsheet

### Values
- `gsheets_get_values` - Read cell values from a range in A1 notation
- `gsheets_update_values` - Write cell values to a range (overwrites existing data)
- `gsheets_append_values` - Append rows after the last row with data
- `gsheets_clear_values` - Clear all values in a range (formatting preserved)
- `gsheets_batch_get` - Read values from multiple ranges in a single request

## Usage Examples

Create a new spreadsheet:
```
gsheets_create_spreadsheet title="Q4 Budget Report"
```

Read cell values:
```
gsheets_get_values spreadsheetId="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" range="Sheet1!A1:D10"
```

Write values to cells:
```
gsheets_update_values spreadsheetId="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" range="Sheet1!A1:B2" values=[["Name","Age"],["Alice",30]]
```

Append rows:
```
gsheets_append_values spreadsheetId="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" range="Sheet1!A:B" values=[["Bob",25],["Carol",28]]
```

Read multiple ranges at once:
```
gsheets_batch_get spreadsheetId="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" ranges=["Sheet1!A1:B5","Sheet2!A1:C3"]
```

## Auth

Uses Google OAuth 2.0 (standard code flow). On first run, the server opens a browser-based auth flow. Tokens are stored locally and refresh automatically.

Set `GOOGLE_SHEETS_CLIENT_ID` and `GOOGLE_SHEETS_CLIENT_SECRET` from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Rate Limits

Google Sheets API default quota: 60 requests per minute, 500,000 per day. The server retries automatically on 429 responses.
