import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetMeSchema = z.object({
  fields: z.string().optional().describe('Comma-separated fields: id, localizedFirstName, localizedLastName, profilePicture, etc.'),
});

const GetProfileSchema = z.object({
  person_id: z.string().describe('LinkedIn person ID (not URN, just the ID string)'),
  fields: z.string().optional().describe('Comma-separated fields: id, localizedFirstName, localizedLastName, profilePicture, etc.'),
});

const GetConnectionsCountSchema = z.object({});

export function getProfileTools(http: HttpClient) {
  return {
    linkedin_get_me: {
      description: 'Get the authenticated user\'s LinkedIn profile information.',
      schema: GetMeSchema,
      handler: async (params: z.infer<typeof GetMeSchema>) => {
        const query = params.fields ? `?projection=(${params.fields})` : '';
        const response = await http.get(`/me${query}`);
        return response.data;
      },
    },
    linkedin_get_profile: {
      description: 'Get a LinkedIn profile by person ID.',
      schema: GetProfileSchema,
      handler: async (params: z.infer<typeof GetProfileSchema>) => {
        const query = params.fields ? `?projection=(${params.fields})` : '';
        const response = await http.get(`/people/(id:${params.person_id})${query}`);
        return response.data;
      },
    },
    linkedin_get_connections_count: {
      description: 'Get the total number of connections for the authenticated user.',
      schema: GetConnectionsCountSchema,
      handler: async (_params: z.infer<typeof GetConnectionsCountSchema>) => {
        const response = await http.get('/connections?q=viewer&count=0');
        return { total: (response.data as Record<string, unknown>)['_total'] ?? 0 };
      },
    },
  };
}

export const profileSchemas = {
  GetMeSchema,
  GetProfileSchema,
  GetConnectionsCountSchema,
};
