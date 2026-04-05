import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetUserInsightsSchema = z.object({
  user_id: z.string().describe('Instagram user ID (use instagram_get_profile to find)'),
  metric: z.string().optional().describe('Comma-separated metrics: impressions, reach, profile_views (default: impressions,reach,profile_views)'),
  period: z.enum(['day', 'week', 'days_28', 'month', 'lifetime']).optional().describe('Time period for insights (default: day)'),
});

const GetMediaInsightsSchema = z.object({
  media_id: z.string().describe('Instagram media ID to get insights for'),
  metric: z.string().optional().describe('Comma-separated metrics: impressions, reach, engagement (default: impressions,reach,engagement)'),
});

const GetProfileSchema = z.object({
  user_id: z.string().describe('Instagram user ID'),
});

export function getInsightTools(http: HttpClient) {
  return {
    instagram_get_user_insights: {
      description: 'Get account-level insights for an Instagram professional account. Requires instagram_manage_insights permission.',
      schema: GetUserInsightsSchema,
      handler: async (params: z.infer<typeof GetUserInsightsSchema>) => {
        const metric = params.metric ?? 'impressions,reach,profile_views';
        const period = params.period ?? 'day';
        const queryParams = new URLSearchParams({ metric, period });
        const response = await http.get(`/${params.user_id}/insights?${queryParams.toString()}`);
        return response.data;
      },
    },
    instagram_get_media_insights: {
      description: 'Get insights for a specific Instagram media item. Returns metrics like impressions, reach, and engagement.',
      schema: GetMediaInsightsSchema,
      handler: async (params: z.infer<typeof GetMediaInsightsSchema>) => {
        const metric = params.metric ?? 'impressions,reach,engagement';
        const queryParams = new URLSearchParams({ metric });
        const response = await http.get(`/${params.media_id}/insights?${queryParams.toString()}`);
        return response.data;
      },
    },
    instagram_get_profile: {
      description: 'Get Instagram profile information: username, name, bio, follower/following counts, and media count.',
      schema: GetProfileSchema,
      handler: async (params: z.infer<typeof GetProfileSchema>) => {
        const fields = 'id,username,name,biography,followers_count,follows_count,media_count';
        const response = await http.get(`/${params.user_id}?fields=${fields}`);
        return response.data;
      },
    },
  };
}

export const insightSchemas = {
  GetUserInsightsSchema,
  GetMediaInsightsSchema,
  GetProfileSchema,
};
