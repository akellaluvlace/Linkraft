# Google Calendar Pack Setup

## Prerequisites

- Node.js >= 18
- A Google account
- Google Cloud project with Calendar API enabled

## Steps

1. **Create a Google Cloud Project**

   Go to [console.cloud.google.com](https://console.cloud.google.com/). Create a new project (or select an existing one).

2. **Enable the Google Calendar API**

   Navigate to "APIs & Services" > "Library". Search for "Google Calendar API" and click "Enable".

3. **Create OAuth 2.0 Credentials**

   Go to "APIs & Services" > "Credentials". Click "Create Credentials" > "OAuth client ID":
   - **Application type**: Web application
   - **Name**: Linkraft Google Calendar (or any name)
   - **Authorized redirect URIs**: `http://localhost:8585/callback`

4. **Get your credentials**

   After creating, copy:
   - **Client ID**
   - **Client Secret**

5. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export GOOGLE_CALENDAR_CLIENT_ID="your-client-id"
   export GOOGLE_CALENDAR_CLIENT_SECRET="your-client-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

6. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-google-calendar": {
         "command": "node",
         "args": ["path/to/packs/google-calendar/dist/server.js"],
         "env": {
           "GOOGLE_CALENDAR_CLIENT_ID": "your-client-id",
           "GOOGLE_CALENDAR_CLIENT_SECRET": "your-client-secret"
         }
       }
     }
   }
   ```

7. **Build the pack**

   ```bash
   cd packs/google-calendar
   npm run build
   ```

8. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with your Google account, and authorize the app. The callback is handled automatically.

## Configure OAuth Consent Screen

If this is a new Google Cloud project, you may need to configure the OAuth consent screen first:

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" (or "Internal" if using Google Workspace)
3. Fill in the required fields (app name, support email)
4. Add scopes: `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
5. Add your Google account as a test user (while in "Testing" status)

## Quotas

Google Calendar API default quotas:
- 1,000,000 requests per day
- ~100 requests per minute per user

These limits are generous for typical usage.

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**403 Forbidden**: The Calendar API may not be enabled, or your OAuth consent screen may need configuration. Check the Google Cloud Console.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/google-calendar.json` and restarting.

**"Access blocked" during auth**: Your app is in "Testing" status. Add your Google account as a test user in the OAuth consent screen settings.
