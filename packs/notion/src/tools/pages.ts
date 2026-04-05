import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetPageSchema = z.object({
  page_id: z.string().describe('Notion page ID (UUID format, e.g. "a1b2c3d4-e5f6-7890-abcd-ef1234567890")'),
});

const CreatePageSchema = z.object({
  parent_type: z.enum(['database_id', 'page_id']).describe('Type of parent: "database_id" or "page_id"'),
  parent_id: z.string().describe('ID of the parent database or page'),
  properties: z.record(z.string(), z.unknown()).describe('Page properties object. For database parents, must match the database schema. Example: { "Name": { "title": [{ "text": { "content": "My Page" } }] } }'),
  children: z.array(z.record(z.string(), z.unknown())).optional().describe('Optional array of block objects to add as page content'),
});

const UpdatePageSchema = z.object({
  page_id: z.string().describe('Notion page ID to update'),
  properties: z.record(z.string(), z.unknown()).describe('Properties to update. Only include properties you want to change. Example: { "Status": { "select": { "name": "Done" } } }'),
});

const ArchivePageSchema = z.object({
  page_id: z.string().describe('Notion page ID to archive (soft-delete)'),
});

export function getPageTools(http: HttpClient) {
  return {
    notion_get_page: {
      description: 'Get a Notion page by ID. Returns page properties and metadata.',
      schema: GetPageSchema,
      handler: async (params: z.infer<typeof GetPageSchema>) => {
        const response = await http.get(`/pages/${params.page_id}`);
        return response.data;
      },
    },
    notion_create_page: {
      description: 'Create a new page in Notion. Specify a parent (database or page) and properties.',
      schema: CreatePageSchema,
      handler: async (params: z.infer<typeof CreatePageSchema>) => {
        const body: Record<string, unknown> = {
          parent: { [params.parent_type]: params.parent_id },
          properties: params.properties,
        };
        if (params.children) {
          body['children'] = params.children;
        }
        const response = await http.post('/pages', body);
        return response.data;
      },
    },
    notion_update_page: {
      description: 'Update properties of an existing Notion page. Only include properties you want to change.',
      schema: UpdatePageSchema,
      handler: async (params: z.infer<typeof UpdatePageSchema>) => {
        const response = await http.patch(`/pages/${params.page_id}`, {
          properties: params.properties,
        });
        return response.data;
      },
    },
    notion_archive_page: {
      description: 'Archive (soft-delete) a Notion page. The page can be restored from the trash.',
      schema: ArchivePageSchema,
      handler: async (params: z.infer<typeof ArchivePageSchema>) => {
        const response = await http.patch(`/pages/${params.page_id}`, {
          archived: true,
        });
        return response.data;
      },
    },
  };
}

export const pageSchemas = {
  GetPageSchema,
  CreatePageSchema,
  UpdatePageSchema,
  ArchivePageSchema,
};
