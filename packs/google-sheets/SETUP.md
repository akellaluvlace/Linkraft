# Google Sheets Pack Setup

## Prerequisites

- Node.js >= 18
- A Google account
- Google Cloud project with Sheets API enabled

## Steps

1. **Create a Google Cloud project**

   Go to [console.cloud.google.com](https://console.cloud.google.com/). Create a new project or select an existing one.

2. **Enable the Google Sheets API**

   In your project, go to "APIs & Services" > "Library". Search for "Google Sheets API" and click "Enable".

3. **Create OAuth 2.0 credentials**

   Go to "APIs & Services" > "Credentials". Click "Create Credentials" > "OAuth client ID" and set:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `http://localhost:8585/callback`

4. **Get your credentials**

   After creating the OAuth client, copy:
   - **Client ID**
   - **Client Secret**

5. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export GOOGLE_SHEETS_CLIENT_ID="your-client-id"
   export GOOGLE_SHEETS_CLIENT_SECRET="your-client-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

6. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-google-sheets": {
         "command": "node",
         "args": ["path/to/packs/google-sheets/dist/server.js"],
         "env": {
           "GOOGLE_SHEETS_CLIENT_ID": "your-client-id",
           "GOOGLE_SHEETS_CLIENT_SECRET": "your-client-secret"
         }
       }
     }
   }
   ```

7. **Build the pack**

   ```bash
   cd packs/google-sheets
   npm run build
   ```

8. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with Google, and authorize the app. The callback is handled automatically.

## Quotas

The Google Sheets API has the following default quotas:
- 60 read requests per minute per user
- 60 write requests per minute per user
- 500,000 requests per day per project

For higher limits, request a quota increase in the Google Cloud Console.

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**403 Forbidden**: The Sheets API may not be enabled. Check "APIs & Services" > "Library" in the Cloud Console.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/google-sheets.json` and restarting.
