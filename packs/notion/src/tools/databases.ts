import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const QueryDatabaseSchema = z.object({
  database_id: z.string().describe('Notion database ID to query'),
  filter: z.record(z.string(), z.unknown()).optional().describe('Optional filter object. Example: { "property": "Status", "select": { "equals": "Done" } }'),
  sorts: z.array(z.record(z.string(), z.unknown())).optional().describe('Optional array of sort objects. Example: [{ "property": "Created", "direction": "descending" }]'),
  page_size: z.number().min(1).max(100).optional().describe('Number of results per page (1-100, default 100)'),
  start_cursor: z.string().optional().describe('Cursor for pagination. Use next_cursor from a previous response'),
});

const GetDatabaseSchema = z.object({
  database_id: z.string().describe('Notion database ID to retrieve'),
});

const CreateDatabaseSchema = z.object({
  parent_page_id: z.string().describe('ID of the parent page where the database will be created'),
  title: z.string().describe('Database title text'),
  properties: z.record(z.string(), z.record(z.string(), z.unknown())).describe('Database property schema. Keys are property names, values are property config objects. Example: { "Name": { "title": {} }, "Tags": { "multi_select": { "options": [{ "name": "Tag1" }] } } }'),
});

export function getDatabaseTools(http: HttpClient) {
  return {
    notion_query_database: {
      description: 'Query a Notion database with optional filters and sorts. Returns matching pages.',
      schema: QueryDatabaseSchema,
      handler: async (params: z.infer<typeof QueryDatabaseSchema>) => {
        const { database_id, ...body } = params;
        const requestBody: Record<string, unknown> = {};
        if (body.filter) requestBody['filter'] = body.filter;
        if (body.sorts) requestBody['sorts'] = body.sorts;
        if (body.page_size) requestBody['page_size'] = body.page_size;
        if (body.start_cursor) requestBody['start_cursor'] = body.start_cursor;
        const response = await http.post(`/databases/${database_id}/query`, requestBody);
        return response.data;
      },
    },
    notion_get_database: {
      description: 'Get a Notion database schema and metadata. Returns property definitions and configuration.',
      schema: GetDatabaseSchema,
      handler: async (params: z.infer<typeof GetDatabaseSchema>) => {
        const response = await http.get(`/databases/${params.database_id}`);
        return response.data;
      },
    },
    notion_create_database: {
      description: 'Create a new database inside a Notion page. Define columns via the properties schema.',
      schema: CreateDatabaseSchema,
      handler: async (params: z.infer<typeof CreateDatabaseSchema>) => {
        const response = await http.post('/databases', {
          parent: { page_id: params.parent_page_id },
          title: [{ type: 'text', text: { content: params.title } }],
          properties: params.properties,
        });
        return response.data;
      },
    },
  };
}

export const databaseSchemas = {
  QueryDatabaseSchema,
  GetDatabaseSchema,
  CreateDatabaseSchema,
};
