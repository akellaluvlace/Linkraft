---
name: instagram
description: Manage Instagram media, comments, and insights via the Instagram Graph API
---

# Instagram Pack

Connect to the Instagram Graph API via OAuth 2.0 (Facebook login). View and publish media, manage comments, and access account and media insights.

## Available Tools

### Media
- `instagram_get_media` - Get a media item by ID (caption, type, URL, timestamp, permalink)
- `instagram_get_user_media` - Get recent media from an Instagram user
- `instagram_create_photo_post` - Create and publish a photo post (two-step: container + publish)

Note: Media deletion is not available through the Instagram Graph API. Delete media through the Instagram app instead.

### Comments
- `instagram_get_comments` - Get comments on a media item
- `instagram_reply_to_comment` - Reply to a comment
- `instagram_delete_comment` - Delete a comment
- `instagram_hide_comment` - Hide or unhide a comment

### Insights
- `instagram_get_user_insights` - Get account-level insights (impressions, reach, profile views)
- `instagram_get_media_insights` - Get insights for a specific media item
- `instagram_get_profile` - Get profile info (username, name, bio, follower/following counts)

## Usage Examples

Get your profile:
```
instagram_get_profile user_id="17841400123456789"
```

Get recent media:
```
instagram_get_user_media user_id="17841400123456789" limit=10
```

Publish a photo:
```
instagram_create_photo_post user_id="17841400123456789" image_url="https://example.com/photo.jpg" caption="Posted via Linkraft"
```

Get comments on a post:
```
instagram_get_comments media_id="17890500123456789"
```

Reply to a comment:
```
instagram_reply_to_comment comment_id="17858900123456789" message="Thanks for your comment!"
```

Get account insights:
```
instagram_get_user_insights user_id="17841400123456789" period="day"
```

## Auth

Uses OAuth 2.0 via Facebook (standard code flow, not PKCE). On first run, the server opens a browser-based auth flow through Facebook. Tokens are stored locally and refresh automatically.

Set `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` from the [Facebook Developer Portal](https://developers.facebook.com/apps/).

## Requirements

- A Facebook App with Instagram Graph API enabled
- An Instagram Professional (Business or Creator) account connected to a Facebook Page
- The Facebook Page must be linked to the Instagram account

## Rate Limits

The Facebook Graph API allows up to 200 requests per minute per user token. Default: 200 requests/minute. The server retries automatically on 429 responses.
