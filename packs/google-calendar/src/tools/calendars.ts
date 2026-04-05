import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListCalendarsSchema = z.object({});

const GetCalendarSchema = z.object({
  calendarId: z.string().describe('ID of the calendar to retrieve.'),
});

const CreateCalendarSchema = z.object({
  summary: z.string().describe('Title of the new calendar.'),
  description: z.string().optional().describe('Description of the new calendar.'),
  timeZone: z.string().optional().describe('IANA time zone for the calendar. Example: "America/New_York"'),
});

export function getCalendarTools(http: HttpClient) {
  return {
    gcal_list_calendars: {
      description: 'List all calendars the authenticated user has access to.',
      schema: ListCalendarsSchema,
      handler: async (_params: z.infer<typeof ListCalendarsSchema>) => {
        const response = await http.get('/users/me/calendarList');
        return response.data;
      },
    },
    gcal_get_calendar: {
      description: 'Get details of a specific calendar by its ID.',
      schema: GetCalendarSchema,
      handler: async (params: z.infer<typeof GetCalendarSchema>) => {
        const response = await http.get(`/calendars/${encodeURIComponent(params.calendarId)}`);
        return response.data;
      },
    },
    gcal_create_calendar: {
      description: 'Create a new secondary calendar with a title, optional description, and time zone.',
      schema: CreateCalendarSchema,
      handler: async (params: z.infer<typeof CreateCalendarSchema>) => {
        const body: Record<string, unknown> = { summary: params.summary };
        if (params.description) body['description'] = params.description;
        if (params.timeZone) body['timeZone'] = params.timeZone;
        const response = await http.post('/calendars', body);
        return response.data;
      },
    },
  };
}

export const calendarSchemas = {
  ListCalendarsSchema,
  GetCalendarSchema,
  CreateCalendarSchema,
};
