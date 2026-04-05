# Instagram Pack Setup

## Prerequisites

- Node.js >= 18
- A Facebook account
- An Instagram Professional account (Business or Creator)
- The Instagram account must be connected to a Facebook Page

## Steps

1. **Create a Facebook App**

   Go to [developers.facebook.com/apps](https://developers.facebook.com/apps/). Click "Create App", choose "Business" type.

2. **Add Instagram Graph API**

   In your app dashboard, click "Add Product" and add "Instagram Graph API".

3. **Configure OAuth Settings**

   Go to "Facebook Login" > "Settings" and set:
   - **Valid OAuth Redirect URIs**: `http://localhost:8585/callback`
   - **Client OAuth Login**: enabled
   - **Web OAuth Login**: enabled

4. **Get your credentials**

   From "App Settings" > "Basic", copy:
   - **App ID** (this is your client ID)
   - **App Secret** (this is your client secret)

5. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export INSTAGRAM_CLIENT_ID="your-app-id"
   export INSTAGRAM_CLIENT_SECRET="your-app-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

6. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-instagram": {
         "command": "node",
         "args": ["path/to/packs/instagram/dist/server.js"],
         "env": {
           "INSTAGRAM_CLIENT_ID": "your-app-id",
           "INSTAGRAM_CLIENT_SECRET": "your-app-secret"
         }
       }
     }
   }
   ```

7. **Build the pack**

   ```bash
   cd packs/instagram
   npm run build
   ```

8. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with Facebook, and authorize the app. The callback is handled automatically.

## Instagram Account Requirements

The Instagram Graph API only works with Professional accounts:
- Your Instagram account must be a Business or Creator account
- It must be connected to a Facebook Page
- The Facebook Page must be associated with the Facebook App

To convert: Instagram Settings > Account > Switch to Professional Account.

## Rate Limits

The Facebook Graph API allows:
- 200 API calls per user per hour (standard)
- Publishing is limited to 25 posts per 24-hour period

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**"Invalid Scopes"**: Make sure your Facebook App has been reviewed for the required permissions, or that you are testing with an admin/developer account.

**403 Forbidden**: Check that your Instagram account is a Professional account and is connected to a Facebook Page.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/instagram.json` and restarting.
