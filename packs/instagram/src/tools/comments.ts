import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetCommentsSchema = z.object({
  media_id: z.string().describe('Instagram media ID to get comments for'),
});

const ReplyToCommentSchema = z.object({
  comment_id: z.string().describe('ID of the comment to reply to'),
  message: z.string().describe('Reply text'),
});

const DeleteCommentSchema = z.object({
  comment_id: z.string().describe('ID of the comment to delete'),
});

const HideCommentSchema = z.object({
  comment_id: z.string().describe('ID of the comment to hide'),
  hide: z.boolean().describe('Set true to hide, false to unhide'),
});

export function getCommentTools(http: HttpClient) {
  return {
    instagram_get_comments: {
      description: 'Get comments on an Instagram media item. Returns id, text, username, and timestamp for each comment.',
      schema: GetCommentsSchema,
      handler: async (params: z.infer<typeof GetCommentsSchema>) => {
        const fields = 'id,text,username,timestamp';
        const response = await http.get(`/${params.media_id}/comments?fields=${fields}`);
        return response.data;
      },
    },
    instagram_reply_to_comment: {
      description: 'Reply to a comment on an Instagram media item.',
      schema: ReplyToCommentSchema,
      handler: async (params: z.infer<typeof ReplyToCommentSchema>) => {
        const response = await http.post(`/${params.comment_id}/replies`, {
          message: params.message,
        });
        return response.data;
      },
    },
    instagram_delete_comment: {
      description: 'Delete a comment on an Instagram media item.',
      schema: DeleteCommentSchema,
      handler: async (params: z.infer<typeof DeleteCommentSchema>) => {
        const response = await http.delete(`/${params.comment_id}`);
        return response.data;
      },
    },
    instagram_hide_comment: {
      description: 'Hide or unhide a comment on an Instagram media item. Hidden comments are not visible to the public.',
      schema: HideCommentSchema,
      handler: async (params: z.infer<typeof HideCommentSchema>) => {
        const response = await http.post(`/${params.comment_id}`, {
          hide: params.hide,
        });
        return response.data;
      },
    },
  };
}

export const commentSchemas = {
  GetCommentsSchema,
  ReplyToCommentSchema,
  DeleteCommentSchema,
  HideCommentSchema,
};
