import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const LikeTweetSchema = z.object({
  user_id: z.string().describe('Authenticated user ID (use twitter_get_me to find)'),
  tweet_id: z.string().describe('ID of the tweet to like'),
});

const UnlikeTweetSchema = z.object({
  user_id: z.string().describe('Authenticated user ID'),
  tweet_id: z.string().describe('ID of the tweet to unlike'),
});

const RetweetSchema = z.object({
  user_id: z.string().describe('Authenticated user ID'),
  tweet_id: z.string().describe('ID of the tweet to retweet'),
});

const UndoRetweetSchema = z.object({
  user_id: z.string().describe('Authenticated user ID'),
  tweet_id: z.string().describe('ID of the tweet to undo retweet'),
});

const BookmarkTweetSchema = z.object({
  user_id: z.string().describe('Authenticated user ID'),
  tweet_id: z.string().describe('ID of the tweet to bookmark'),
});

const RemoveBookmarkSchema = z.object({
  user_id: z.string().describe('Authenticated user ID'),
  tweet_id: z.string().describe('ID of the tweet to remove from bookmarks'),
});

const GetBookmarksSchema = z.object({
  user_id: z.string().describe('Authenticated user ID'),
  max_results: z.number().min(1).max(100).optional().describe('Number of bookmarks to return (1-100)'),
  tweet_fields: z.string().optional().describe('Comma-separated tweet fields'),
});

export function getEngagementTools(http: HttpClient) {
  return {
    twitter_like_tweet: {
      description: 'Like a tweet.',
      schema: LikeTweetSchema,
      handler: async (params: z.infer<typeof LikeTweetSchema>) => {
        const response = await http.post(`/users/${params.user_id}/likes`, {
          tweet_id: params.tweet_id,
        });
        return response.data;
      },
    },
    twitter_unlike_tweet: {
      description: 'Remove a like from a tweet.',
      schema: UnlikeTweetSchema,
      handler: async (params: z.infer<typeof UnlikeTweetSchema>) => {
        const response = await http.delete(`/users/${params.user_id}/likes/${params.tweet_id}`);
        return response.data;
      },
    },
    twitter_retweet: {
      description: 'Retweet a tweet.',
      schema: RetweetSchema,
      handler: async (params: z.infer<typeof RetweetSchema>) => {
        const response = await http.post(`/users/${params.user_id}/retweets`, {
          tweet_id: params.tweet_id,
        });
        return response.data;
      },
    },
    twitter_undo_retweet: {
      description: 'Remove a retweet.',
      schema: UndoRetweetSchema,
      handler: async (params: z.infer<typeof UndoRetweetSchema>) => {
        const response = await http.delete(`/users/${params.user_id}/retweets/${params.tweet_id}`);
        return response.data;
      },
    },
    twitter_bookmark_tweet: {
      description: 'Add a tweet to your bookmarks.',
      schema: BookmarkTweetSchema,
      handler: async (params: z.infer<typeof BookmarkTweetSchema>) => {
        const response = await http.post(`/users/${params.user_id}/bookmarks`, {
          tweet_id: params.tweet_id,
        });
        return response.data;
      },
    },
    twitter_remove_bookmark: {
      description: 'Remove a tweet from your bookmarks.',
      schema: RemoveBookmarkSchema,
      handler: async (params: z.infer<typeof RemoveBookmarkSchema>) => {
        const response = await http.delete(`/users/${params.user_id}/bookmarks/${params.tweet_id}`);
        return response.data;
      },
    },
    twitter_get_bookmarks: {
      description: 'Get your bookmarked tweets.',
      schema: GetBookmarksSchema,
      handler: async (params: z.infer<typeof GetBookmarksSchema>) => {
        const queryParams = new URLSearchParams();
        if (params.max_results) queryParams.set('max_results', String(params.max_results));
        if (params.tweet_fields) queryParams.set('tweet.fields', params.tweet_fields);
        const qs = queryParams.toString();
        const response = await http.get(`/users/${params.user_id}/bookmarks${qs ? `?${qs}` : ''}`);
        return response.data;
      },
    },
  };
}

export const engagementSchemas = {
  LikeTweetSchema,
  UnlikeTweetSchema,
  RetweetSchema,
  UndoRetweetSchema,
  BookmarkTweetSchema,
  RemoveBookmarkSchema,
  GetBookmarksSchema,
};
