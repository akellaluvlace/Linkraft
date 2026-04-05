import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getEventTools } from '../src/tools/events.js';
import { getCalendarTools } from '../src/tools/calendars.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: 'event-1' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { items: [] } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: 'event-1', summary: 'Updated' } }),
    delete: vi.fn().mockResolvedValue({ status: 204, headers: {}, data: {} }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Event tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 6 event tools', () => {
    const tools = getEventTools(http);
    expect(Object.keys(tools)).toEqual([
      'gcal_list_events',
      'gcal_get_event',
      'gcal_create_event',
      'gcal_update_event',
      'gcal_delete_event',
      'gcal_quick_add',
    ]);
  });

  it('list_events calls GET with default calendarId and singleEvents', async () => {
    const tools = getEventTools(http);
    await tools.gcal_list_events.handler({});
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/calendars/primary/events');
    expect(call).toContain('singleEvents=true');
    expect(call).toContain('orderBy=startTime');
  });

  it('list_events passes time range and query', async () => {
    const tools = getEventTools(http);
    await tools.gcal_list_events.handler({
      timeMin: '2024-01-01T00:00:00Z',
      timeMax: '2024-12-31T23:59:59Z',
      query: 'standup',
      maxResults: 10,
    });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('timeMin=2024-01-01T00%3A00%3A00Z');
    expect(call).toContain('timeMax=2024-12-31T23%3A59%3A59Z');
    expect(call).toContain('q=standup');
    expect(call).toContain('maxResults=10');
  });

  it('get_event fetches by calendarId and eventId', async () => {
    const tools = getEventTools(http);
    await tools.gcal_get_event.handler({ eventId: 'abc123' });
    expect(http.get).toHaveBeenCalledWith('/calendars/primary/events/abc123');
  });

  it('create_event posts with start/end wrapped in objects', async () => {
    const tools = getEventTools(http);
    await tools.gcal_create_event.handler({
      summary: 'Team meeting',
      start: '2024-06-15T10:00:00-04:00',
      end: '2024-06-15T11:00:00-04:00',
      description: 'Weekly sync',
      location: 'Room A',
      attendees: ['alice@example.com', 'bob@example.com'],
    });
    expect(http.post).toHaveBeenCalledWith('/calendars/primary/events', {
      summary: 'Team meeting',
      start: { dateTime: '2024-06-15T10:00:00-04:00' },
      end: { dateTime: '2024-06-15T11:00:00-04:00' },
      description: 'Weekly sync',
      location: 'Room A',
      attendees: [{ email: 'alice@example.com' }, { email: 'bob@example.com' }],
    });
  });

  it('create_event works with minimal params', async () => {
    const tools = getEventTools(http);
    await tools.gcal_create_event.handler({
      summary: 'Quick event',
      start: '2024-06-15T10:00:00Z',
      end: '2024-06-15T10:30:00Z',
    });
    expect(http.post).toHaveBeenCalledWith('/calendars/primary/events', {
      summary: 'Quick event',
      start: { dateTime: '2024-06-15T10:00:00Z' },
      end: { dateTime: '2024-06-15T10:30:00Z' },
    });
  });

  it('update_event patches only provided fields', async () => {
    const tools = getEventTools(http);
    await tools.gcal_update_event.handler({
      eventId: 'abc123',
      summary: 'Updated title',
      location: 'Room B',
    });
    expect(http.patch).toHaveBeenCalledWith('/calendars/primary/events/abc123', {
      summary: 'Updated title',
      location: 'Room B',
    });
  });

  it('update_event wraps start/end in dateTime objects', async () => {
    const tools = getEventTools(http);
    await tools.gcal_update_event.handler({
      eventId: 'abc123',
      start: '2024-06-16T09:00:00Z',
      end: '2024-06-16T10:00:00Z',
    });
    expect(http.patch).toHaveBeenCalledWith('/calendars/primary/events/abc123', {
      start: { dateTime: '2024-06-16T09:00:00Z' },
      end: { dateTime: '2024-06-16T10:00:00Z' },
    });
  });

  it('delete_event calls DELETE with correct path', async () => {
    const tools = getEventTools(http);
    await tools.gcal_delete_event.handler({ eventId: 'abc123' });
    expect(http.delete).toHaveBeenCalledWith('/calendars/primary/events/abc123');
  });

  it('quick_add posts with text query param', async () => {
    const tools = getEventTools(http);
    await tools.gcal_quick_add.handler({ text: 'Lunch with Sarah tomorrow at noon' });
    const call = (http.post as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/calendars/primary/events/quickAdd');
    expect(call).toContain('text=Lunch+with+Sarah+tomorrow+at+noon');
  });

  it('uses custom calendarId when provided', async () => {
    const tools = getEventTools(http);
    await tools.gcal_list_events.handler({ calendarId: 'work@group.calendar.google.com' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/calendars/work%40group.calendar.google.com/events');
  });
});

describe('Calendar tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 calendar tools', () => {
    const tools = getCalendarTools(http);
    expect(Object.keys(tools)).toEqual([
      'gcal_list_calendars',
      'gcal_get_calendar',
      'gcal_create_calendar',
    ]);
  });

  it('list_calendars calls /users/me/calendarList', async () => {
    const tools = getCalendarTools(http);
    await tools.gcal_list_calendars.handler({});
    expect(http.get).toHaveBeenCalledWith('/users/me/calendarList');
  });

  it('get_calendar fetches by ID', async () => {
    const tools = getCalendarTools(http);
    await tools.gcal_get_calendar.handler({ calendarId: 'cal-123' });
    expect(http.get).toHaveBeenCalledWith('/calendars/cal-123');
  });

  it('create_calendar posts with summary and optional fields', async () => {
    const tools = getCalendarTools(http);
    await tools.gcal_create_calendar.handler({
      summary: 'Work Calendar',
      description: 'My work events',
      timeZone: 'America/New_York',
    });
    expect(http.post).toHaveBeenCalledWith('/calendars', {
      summary: 'Work Calendar',
      description: 'My work events',
      timeZone: 'America/New_York',
    });
  });

  it('create_calendar works with summary only', async () => {
    const tools = getCalendarTools(http);
    await tools.gcal_create_calendar.handler({ summary: 'Personal' });
    expect(http.post).toHaveBeenCalledWith('/calendars', { summary: 'Personal' });
  });
});
