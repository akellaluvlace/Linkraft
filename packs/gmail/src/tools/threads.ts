import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListThreadsSchema = z.object({
  query: z.string().optional().describe('Gmail search query using Gmail search syntax (e.g. "is:unread", "from:user@example.com")'),
  max_results: z.number().min(1).max(500).optional().describe('Maximum number of threads to return (1-500, default 10)'),
});

const GetThreadSchema = z.object({
  thread_id: z.string().describe('The ID of the thread to retrieve'),
});

export function getThreadTools(http: HttpClient) {
  return {
    gmail_list_threads: {
      description: 'List Gmail threads matching a search query. Threads group related messages together.',
      schema: ListThreadsSchema,
      handler: async (params: z.infer<typeof ListThreadsSchema>) => {
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.set('q', params.query);
        if (params.max_results) queryParams.set('maxResults', String(params.max_results));
        const qs = queryParams.toString();
        const response = await http.get(`/users/me/threads${qs ? `?${qs}` : ''}`);
        return response.data;
      },
    },
    gmail_get_thread: {
      description: 'Get a full Gmail thread by ID with all messages, headers, and body content.',
      schema: GetThreadSchema,
      handler: async (params: z.infer<typeof GetThreadSchema>) => {
        const response = await http.get(`/users/me/threads/${params.thread_id}?format=full`);
        return response.data;
      },
    },
  };
}

export const threadSchemas = {
  ListThreadsSchema,
  GetThreadSchema,
};
