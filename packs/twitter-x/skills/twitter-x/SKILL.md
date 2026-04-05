---
name: twitter-x
description: Post tweets, manage engagement, look up users, and search Twitter/X via API v2
---

# Twitter/X Pack

Connect to the Twitter/X API v2 via OAuth 2.0 PKCE. Post tweets, search, manage likes, retweets, and bookmarks.

## Available Tools

### Tweets
- `twitter_create_tweet` - Post a new tweet (max 280 chars), reply, or quote tweet
- `twitter_delete_tweet` - Delete one of your tweets
- `twitter_get_tweet` - Get a tweet by ID with expanded fields
- `twitter_search_tweets` - Search recent tweets (last 7 days)
- `twitter_get_user_tweets` - Get recent tweets from a specific user

### Users
- `twitter_get_me` - Get your own profile info
- `twitter_get_user` - Look up a user by ID
- `twitter_get_user_by_username` - Look up a user by @username
- `twitter_get_followers` - Get a user's followers
- `twitter_get_following` - Get who a user follows

### Engagement
- `twitter_like_tweet` - Like a tweet
- `twitter_unlike_tweet` - Unlike a tweet
- `twitter_retweet` - Retweet a tweet
- `twitter_undo_retweet` - Undo a retweet
- `twitter_bookmark_tweet` - Bookmark a tweet
- `twitter_remove_bookmark` - Remove a bookmark
- `twitter_get_bookmarks` - Get your bookmarked tweets

## Usage Examples

Post a tweet:
```
twitter_create_tweet text="Hello from Linkraft!"
```

Search recent tweets:
```
twitter_search_tweets query="MCP server" max_results=20 tweet_fields="created_at,public_metrics,author_id"
```

Look up a user:
```
twitter_get_user_by_username username="elonmusk" user_fields="description,public_metrics"
```

## Auth

Uses OAuth 2.0 with PKCE. On first run, the server opens a browser-based auth flow. Tokens are stored locally and refresh automatically.

Set `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` from the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard).

## Rate Limits

Twitter API v2 has strict per-endpoint rate limits. Default: 15 requests/minute. The server retries automatically on 429 responses.
