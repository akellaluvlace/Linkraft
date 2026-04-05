import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetBlockChildrenSchema = z.object({
  block_id: z.string().describe('Block or page ID to get children from'),
  page_size: z.number().min(1).max(100).optional().describe('Number of blocks to return (1-100, default 100)'),
  start_cursor: z.string().optional().describe('Cursor for pagination. Use next_cursor from a previous response'),
});

const AppendBlockChildrenSchema = z.object({
  block_id: z.string().describe('Block or page ID to append children to'),
  children: z.array(z.record(z.string(), z.unknown())).describe('Array of block objects to append. Example: [{ "object": "block", "type": "paragraph", "paragraph": { "rich_text": [{ "type": "text", "text": { "content": "Hello world" } }] } }]'),
});

const DeleteBlockSchema = z.object({
  block_id: z.string().describe('Block ID to delete (archive)'),
});

export function getBlockTools(http: HttpClient) {
  return {
    notion_get_block_children: {
      description: 'Get child blocks of a Notion block or page. Use for reading page content.',
      schema: GetBlockChildrenSchema,
      handler: async (params: z.infer<typeof GetBlockChildrenSchema>) => {
        const queryParts: string[] = [];
        if (params.page_size != null) {
          queryParts.push(`page_size=${params.page_size}`);
        }
        if (params.start_cursor) {
          queryParts.push(`start_cursor=${encodeURIComponent(params.start_cursor)}`);
        }
        const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const response = await http.get(`/blocks/${params.block_id}/children${queryStr}`);
        return response.data;
      },
    },
    notion_append_block_children: {
      description: 'Append content blocks to a Notion page or block. Use to add text, headings, lists, and other content.',
      schema: AppendBlockChildrenSchema,
      handler: async (params: z.infer<typeof AppendBlockChildrenSchema>) => {
        const response = await http.patch(`/blocks/${params.block_id}/children`, {
          children: params.children,
        });
        return response.data;
      },
    },
    notion_delete_block: {
      description: 'Delete (archive) a Notion block. Removes the block from its parent.',
      schema: DeleteBlockSchema,
      handler: async (params: z.infer<typeof DeleteBlockSchema>) => {
        const response = await http.delete(`/blocks/${params.block_id}`);
        return response.data;
      },
    },
  };
}

export const blockSchemas = {
  GetBlockChildrenSchema,
  AppendBlockChildrenSchema,
  DeleteBlockSchema,
};
