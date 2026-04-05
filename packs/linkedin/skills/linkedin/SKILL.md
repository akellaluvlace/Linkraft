---
name: linkedin
description: Create posts, manage profiles, and get organization data on LinkedIn via the Community Management API
---

# LinkedIn Pack

Connect to the LinkedIn API v2 via OAuth 2.0. Create and manage posts, view profiles, and get organization data.

## Available Tools

### Posts
- `linkedin_create_post` - Create a text post on LinkedIn with visibility control
- `linkedin_delete_post` - Delete a post by its UGC post URN
- `linkedin_get_post` - Get a post by its UGC post URN

### Profile
- `linkedin_get_me` - Get your own LinkedIn profile info
- `linkedin_get_profile` - Look up a profile by person ID
- `linkedin_get_connections_count` - Get your total connection count

### Organizations
- `linkedin_get_organization` - Get organization details by ID
- `linkedin_get_organization_followers_count` - Get follower count for an organization
- `linkedin_create_org_post` - Create a post as an organization (requires admin access)

## Usage Examples

Get your profile:
```
linkedin_get_me
```

Create a post:
```
linkedin_create_post author_urn="urn:li:person:abc123" text="Hello from Linkraft!"
```

Get organization follower stats:
```
linkedin_get_organization_followers_count organization_id="12345678"
```

Post as an organization:
```
linkedin_create_org_post organization_id="12345678" text="Company update from Linkraft"
```

## Auth

Uses OAuth 2.0 (standard code flow with client_secret). On first run, the server opens a browser-based auth flow. Tokens are stored locally and refresh automatically.

Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` from the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).

## Rate Limits

LinkedIn API allows up to 100 requests per minute. The server retries automatically on 429 responses.
