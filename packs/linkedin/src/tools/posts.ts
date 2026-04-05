import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const CreatePostSchema = z.object({
  author_urn: z.string().describe('Author URN, e.g. "urn:li:person:abc123". Use linkedin_get_me to find your URN.'),
  text: z.string().max(3000).describe('Post text content, up to 3000 characters'),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().describe('Post visibility: PUBLIC or CONNECTIONS (default PUBLIC)'),
});

const DeletePostSchema = z.object({
  post_id: z.string().describe('UGC post URN to delete, e.g. "urn:li:ugcPost:123456"'),
});

const GetPostSchema = z.object({
  post_id: z.string().describe('UGC post URN to retrieve, e.g. "urn:li:ugcPost:123456"'),
});

export function getPostTools(http: HttpClient) {
  return {
    linkedin_create_post: {
      description: 'Create a text post on LinkedIn. Requires author URN and text content.',
      schema: CreatePostSchema,
      handler: async (params: z.infer<typeof CreatePostSchema>) => {
        const visibility = params.visibility ?? 'PUBLIC';
        const body = {
          author: params.author_urn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: params.text,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': visibility,
          },
        };
        const response = await http.post('/ugcPosts', body);
        return response.data;
      },
    },
    linkedin_delete_post: {
      description: 'Delete a LinkedIn post by its UGC post URN.',
      schema: DeletePostSchema,
      handler: async (params: z.infer<typeof DeletePostSchema>) => {
        const encoded = encodeURIComponent(params.post_id);
        const response = await http.delete(`/ugcPosts/${encoded}`);
        return response.data;
      },
    },
    linkedin_get_post: {
      description: 'Get a LinkedIn post by its UGC post URN.',
      schema: GetPostSchema,
      handler: async (params: z.infer<typeof GetPostSchema>) => {
        const encoded = encodeURIComponent(params.post_id);
        const response = await http.get(`/ugcPosts/${encoded}`);
        return response.data;
      },
    },
  };
}

export const postSchemas = {
  CreatePostSchema,
  DeletePostSchema,
  GetPostSchema,
};
