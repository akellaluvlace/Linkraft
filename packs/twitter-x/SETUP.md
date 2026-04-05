# Twitter/X Pack Setup

## Prerequisites

- Node.js >= 18
- A Twitter/X account
- Twitter Developer account (free tier works)

## Steps

1. **Create a Developer Project**

   Go to [developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard). Create a project and an app within it.

2. **Configure OAuth 2.0**

   In your app settings, go to "User authentication settings" and set:
   - **App permissions**: Read and Write
   - **Type of app**: Web App
   - **Callback URL**: `http://localhost:8585/callback`
   - **Website URL**: any valid URL (e.g. your GitHub profile)

3. **Get your credentials**

   From the "Keys and tokens" tab, copy:
   - **Client ID** (OAuth 2.0)
   - **Client Secret** (OAuth 2.0)

4. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export TWITTER_CLIENT_ID="your-client-id"
   export TWITTER_CLIENT_SECRET="your-client-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

5. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-twitter-x": {
         "command": "node",
         "args": ["path/to/packs/twitter-x/dist/server.js"],
         "env": {
           "TWITTER_CLIENT_ID": "your-client-id",
           "TWITTER_CLIENT_SECRET": "your-client-secret"
         }
       }
     }
   }
   ```

6. **Build the pack**

   ```bash
   cd packs/twitter-x
   npm run build
   ```

7. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with Twitter, and authorize the app. The callback is handled automatically.

## Free Tier Limits

The Twitter API free tier includes:
- 1,500 tweet creates per month
- 50 requests per 15-minute window (most endpoints)
- Recent search (last 7 days only)

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**403 Forbidden**: Your app may not have the required permissions. Check "User authentication settings" in the Developer Portal.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/twitter-x.json` and restarting.
