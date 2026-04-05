---
name: google-calendar
description: Manage Google Calendar events and calendars, create events, search by time range, quick add with natural language
---

# Google Calendar Pack

Connect to the Google Calendar API v3 via OAuth 2.0. Create, read, update, and delete events. Manage calendars and use natural language to quickly add events.

## Available Tools

### Events
- `gcal_list_events` - List events with optional time range, search query, and result limit
- `gcal_get_event` - Get a single event by its ID
- `gcal_create_event` - Create an event with summary, start/end times, description, location, and attendees
- `gcal_update_event` - Update an existing event (partial update, only specified fields change)
- `gcal_delete_event` - Delete an event by its ID
- `gcal_quick_add` - Create an event from natural language text (Google parses it automatically)

### Calendars
- `gcal_list_calendars` - List all calendars the user has access to
- `gcal_get_calendar` - Get details of a specific calendar
- `gcal_create_calendar` - Create a new secondary calendar

## Usage Examples

List today's events:
```
gcal_list_events timeMin="2024-06-15T00:00:00Z" timeMax="2024-06-15T23:59:59Z"
```

Create an event:
```
gcal_create_event summary="Team standup" start="2024-06-16T09:00:00-04:00" end="2024-06-16T09:30:00-04:00" location="Conference Room A"
```

Quick add with natural language:
```
gcal_quick_add text="Lunch with Sarah tomorrow at noon"
```

Search events:
```
gcal_list_events query="standup" maxResults=5
```

List all calendars:
```
gcal_list_calendars
```

## Auth

Uses Google OAuth 2.0 (standard code flow). On first run, the server opens a browser-based auth flow. Tokens are stored locally and refresh automatically.

Set `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Rate Limits

Google Calendar API allows up to 1,000,000 requests per day and approximately 100 requests per minute per user. The server retries automatically on 429 responses.
