import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListEventsSchema = z.object({
  calendarId: z.string().optional().describe('Calendar ID to list events from. Defaults to "primary".'),
  maxResults: z.number().min(1).max(2500).optional().describe('Maximum number of events to return (1-2500).'),
  timeMin: z.string().optional().describe('Lower bound (inclusive) for event start time, as ISO 8601 string. Example: "2024-01-01T00:00:00Z"'),
  timeMax: z.string().optional().describe('Upper bound (exclusive) for event end time, as ISO 8601 string. Example: "2024-12-31T23:59:59Z"'),
  query: z.string().optional().describe('Free text search terms to find events matching these terms in summary, description, location, etc.'),
});

const GetEventSchema = z.object({
  calendarId: z.string().optional().describe('Calendar ID. Defaults to "primary".'),
  eventId: z.string().describe('ID of the event to retrieve.'),
});

const CreateEventSchema = z.object({
  calendarId: z.string().optional().describe('Calendar ID. Defaults to "primary".'),
  summary: z.string().describe('Title of the event.'),
  start: z.string().describe('Start time as ISO 8601 string. Example: "2024-06-15T10:00:00-04:00"'),
  end: z.string().describe('End time as ISO 8601 string. Example: "2024-06-15T11:00:00-04:00"'),
  description: z.string().optional().describe('Description or notes for the event.'),
  location: z.string().optional().describe('Geographic location of the event as free-form text.'),
  attendees: z.array(z.string()).optional().describe('List of attendee email addresses to invite.'),
});

const UpdateEventSchema = z.object({
  calendarId: z.string().optional().describe('Calendar ID. Defaults to "primary".'),
  eventId: z.string().describe('ID of the event to update.'),
  summary: z.string().optional().describe('Updated title of the event.'),
  start: z.string().optional().describe('Updated start time as ISO 8601 string.'),
  end: z.string().optional().describe('Updated end time as ISO 8601 string.'),
  description: z.string().optional().describe('Updated description or notes.'),
  location: z.string().optional().describe('Updated geographic location.'),
});

const DeleteEventSchema = z.object({
  calendarId: z.string().optional().describe('Calendar ID. Defaults to "primary".'),
  eventId: z.string().describe('ID of the event to delete.'),
});

const QuickAddSchema = z.object({
  calendarId: z.string().optional().describe('Calendar ID. Defaults to "primary".'),
  text: z.string().describe('Natural language text describing the event. Example: "Lunch with Sarah tomorrow at noon"'),
});

export function getEventTools(http: HttpClient) {
  return {
    gcal_list_events: {
      description: 'List events from a Google Calendar. Supports filtering by time range and free text search.',
      schema: ListEventsSchema,
      handler: async (params: z.infer<typeof ListEventsSchema>) => {
        const calendarId = params.calendarId ?? 'primary';
        const queryParams = new URLSearchParams({
          singleEvents: 'true',
          orderBy: 'startTime',
        });
        if (params.maxResults) queryParams.set('maxResults', String(params.maxResults));
        if (params.timeMin) queryParams.set('timeMin', params.timeMin);
        if (params.timeMax) queryParams.set('timeMax', params.timeMax);
        if (params.query) queryParams.set('q', params.query);
        const response = await http.get(`/calendars/${encodeURIComponent(calendarId)}/events?${queryParams.toString()}`);
        return response.data;
      },
    },
    gcal_get_event: {
      description: 'Get a single event by its ID from a Google Calendar.',
      schema: GetEventSchema,
      handler: async (params: z.infer<typeof GetEventSchema>) => {
        const calendarId = params.calendarId ?? 'primary';
        const response = await http.get(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`);
        return response.data;
      },
    },
    gcal_create_event: {
      description: 'Create a new event on a Google Calendar. Specify summary, start/end times, and optionally description, location, and attendees.',
      schema: CreateEventSchema,
      handler: async (params: z.infer<typeof CreateEventSchema>) => {
        const calendarId = params.calendarId ?? 'primary';
        const body: Record<string, unknown> = {
          summary: params.summary,
          start: { dateTime: params.start },
          end: { dateTime: params.end },
        };
        if (params.description) body['description'] = params.description;
        if (params.location) body['location'] = params.location;
        if (params.attendees) body['attendees'] = params.attendees.map((email) => ({ email }));
        const response = await http.post(`/calendars/${encodeURIComponent(calendarId)}/events`, body);
        return response.data;
      },
    },
    gcal_update_event: {
      description: 'Update an existing event on a Google Calendar. Only the provided fields are changed.',
      schema: UpdateEventSchema,
      handler: async (params: z.infer<typeof UpdateEventSchema>) => {
        const calendarId = params.calendarId ?? 'primary';
        const body: Record<string, unknown> = {};
        if (params.summary) body['summary'] = params.summary;
        if (params.start) body['start'] = { dateTime: params.start };
        if (params.end) body['end'] = { dateTime: params.end };
        if (params.description) body['description'] = params.description;
        if (params.location) body['location'] = params.location;
        const response = await http.patch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`, body);
        return response.data;
      },
    },
    gcal_delete_event: {
      description: 'Delete an event from a Google Calendar by its ID.',
      schema: DeleteEventSchema,
      handler: async (params: z.infer<typeof DeleteEventSchema>) => {
        const calendarId = params.calendarId ?? 'primary';
        const response = await http.delete(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(params.eventId)}`);
        return response.data;
      },
    },
    gcal_quick_add: {
      description: 'Create an event using natural language. Google parses the text to extract date, time, and summary automatically.',
      schema: QuickAddSchema,
      handler: async (params: z.infer<typeof QuickAddSchema>) => {
        const calendarId = params.calendarId ?? 'primary';
        const queryParams = new URLSearchParams({ text: params.text });
        const response = await http.post(`/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?${queryParams.toString()}`, {});
        return response.data;
      },
    },
  };
}

export const eventSchemas = {
  ListEventsSchema,
  GetEventSchema,
  CreateEventSchema,
  UpdateEventSchema,
  DeleteEventSchema,
  QuickAddSchema,
};
