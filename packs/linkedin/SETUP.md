# LinkedIn Pack Setup

## Prerequisites

- Node.js >= 18
- A LinkedIn account
- LinkedIn Developer account

## Steps

1. **Create a LinkedIn App**

   Go to [linkedin.com/developers](https://www.linkedin.com/developers/). Click "Create App" and fill in the required fields (app name, company page, logo).

2. **Request API Access**

   In your app's "Products" tab, request access to:
   - **Sign In with LinkedIn using OpenID Connect** (for openid, profile, email scopes)
   - **Share on LinkedIn** (for w_member_social scope)
   - **Community Management API** (for organization tools, if needed)

3. **Configure OAuth 2.0**

   In your app's "Auth" tab:
   - Add redirect URL: `http://localhost:8585/callback`
   - Note your **Client ID** and **Client Secret**

4. **Set credentials**

   Option A: environment variables (recommended):
   ```bash
   export LINKEDIN_CLIENT_ID="your-client-id"
   export LINKEDIN_CLIENT_SECRET="your-client-secret"
   ```

   Option B: config file. Copy `config.example.json` to `mcpkit.config.json` and fill in the values.

5. **Add to Claude Code**

   Add this to your Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "linkraft-linkedin": {
         "command": "node",
         "args": ["path/to/packs/linkedin/dist/server.js"],
         "env": {
           "LINKEDIN_CLIENT_ID": "your-client-id",
           "LINKEDIN_CLIENT_SECRET": "your-client-secret"
         }
       }
     }
   }
   ```

6. **Build the pack**

   ```bash
   cd packs/linkedin
   npm run build
   ```

7. **Authenticate**

   On first use, the server will print an authorization URL. Open it in your browser, log in with LinkedIn, and authorize the app. The callback is handled automatically.

## API Access Tiers

LinkedIn API access depends on which products are approved for your app:

- **Sign In with LinkedIn**: Profile and email access
- **Share on LinkedIn**: Create posts as yourself
- **Community Management API**: Organization tools, post management (requires company page admin)

## Troubleshooting

**"Not authenticated" on startup**: This is normal on first run. Follow the URL printed to stderr to authorize.

**403 Forbidden**: Your app may not have the required product access. Check the "Products" tab in the Developer Portal.

**429 Too Many Requests**: You've hit a rate limit. The server retries automatically, but you may need to wait.

**"Token refresh failed"**: Re-authenticate by deleting `~/.linkraft/tokens/linkedin.json` and restarting.
