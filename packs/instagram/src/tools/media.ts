import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetMediaSchema = z.object({
  media_id: z.string().describe('Instagram media ID to retrieve'),
});

const GetUserMediaSchema = z.object({
  user_id: z.string().describe('Instagram user ID (use instagram_get_profile to find)'),
  limit: z.number().min(1).max(100).optional().describe('Number of media items to return (1-100, default 25)'),
});

const CreatePhotoPostSchema = z.object({
  user_id: z.string().describe('Instagram user ID (use instagram_get_profile to find)'),
  image_url: z.string().url().describe('Public URL of the image to post (must be accessible by Facebook servers)'),
  caption: z.string().optional().describe('Caption for the photo post'),
});

export function getMediaTools(http: HttpClient) {
  return {
    instagram_get_media: {
      description: 'Get an Instagram media item by ID. Returns id, caption, media type, URL, timestamp, and permalink.',
      schema: GetMediaSchema,
      handler: async (params: z.infer<typeof GetMediaSchema>) => {
        const fields = 'id,caption,media_type,media_url,timestamp,permalink';
        const response = await http.get(`/${params.media_id}?fields=${fields}`);
        return response.data;
      },
    },
    instagram_get_user_media: {
      description: 'Get recent media from an Instagram user. Returns a list of media items with id, caption, type, timestamp, and permalink.',
      schema: GetUserMediaSchema,
      handler: async (params: z.infer<typeof GetUserMediaSchema>) => {
        const fields = 'id,caption,media_type,timestamp,permalink';
        const queryParams = new URLSearchParams({ fields });
        if (params.limit) queryParams.set('limit', String(params.limit));
        const response = await http.get(`/${params.user_id}/media?${queryParams.toString()}`);
        return response.data;
      },
    },
    instagram_create_photo_post: {
      description: 'Create and publish a photo post on Instagram. The image_url must be publicly accessible. This is a two-step process: creates a media container, then publishes it.',
      schema: CreatePhotoPostSchema,
      handler: async (params: z.infer<typeof CreatePhotoPostSchema>) => {
        // Step 1: Create media container
        const containerBody: Record<string, unknown> = {
          image_url: params.image_url,
        };
        if (params.caption) {
          containerBody['caption'] = params.caption;
        }
        const container = await http.post(`/${params.user_id}/media`, containerBody);
        const creationId = (container.data as Record<string, unknown>).id;

        // Step 2: Publish the container
        const response = await http.post(`/${params.user_id}/media_publish`, {
          creation_id: creationId,
        });
        return response.data;
      },
    },
  };
}

export const mediaSchemas = {
  GetMediaSchema,
  GetUserMediaSchema,
  CreatePhotoPostSchema,
};
