# Gmail Pack Setup

## Prerequisites

- Node.js >= 18
- A Google account
- Access to the Google Cloud Console

## Steps

1. **Create a Google Cloud Project**

   Go to [console.cloud.google.com](https://console.cloud.google.com/). Create a new project or select an existing one.

2. **Enable the Gmail API**

   Navigate to "APIs & Services" > "Library". Search for "Gmail API" and click "Enable".

3. **Configure the OAuth Consent Screen**

   Go to "APIs & Services" > "OAuth consent screen". Set up as:
   - **User Type**: External (or Internal if using Google Workspace)
   - **App name**: any name (e.g. "Linkraft Gmail")
   - **Scopes**: add `gmail.readonly`, `gmail.send`, `gmail.modify`, `gmail.labels`
   - **Test users**: add your Google account email

4. **Create OAuth 2.0 Credentials**

   Go to "APIs & Services" > "Credentials". Click "Create Credentials" > "OAuth client ID":
   - **Application type**: Web application
   - **Authorized redirect URIs**: `http://localhost:8585/callback`

5. **Get your credentials**

   After creation, copy:
   - **Client ID**
   - **Client Secret**

6. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export GMAIL_CLIENT_ID="your-client-id"
   export GMAIL_CLIENT_SECRET="your-client-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

7. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-gmail": {
         "command": "node",
         "args": ["path/to/packs/gmail/dist/server.js"],
         "env": {
           "GMAIL_CLIENT_ID": "your-client-id",
           "GMAIL_CLIENT_SECRET": "your-client-secret"
         }
       }
     }
   }
   ```

8. **Build the pack**

   ```bash
   cd packs/gmail
   npm run build
   ```

9. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with Google, and authorize the app. The callback is handled automatically.

## Quotas

The Gmail API default quota:
- 250 quota units per second per user
- 1,000,000 quota units per day
- Most read operations cost 1-5 units, send costs 100 units

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**403 Forbidden**: The Gmail API may not be enabled, or your app may not have the required scopes. Check the Google Cloud Console.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/gmail.json` and restarting.

**"Access blocked: app not verified"**: Your app is in testing mode. Add your email as a test user in the OAuth consent screen.
