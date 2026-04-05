import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const CreateTweetSchema = z.object({
  text: z.string().max(280).describe('Tweet text, up to 280 characters'),
  reply_to: z.string().optional().describe('Tweet ID to reply to'),
  quote_tweet_id: z.string().optional().describe('Tweet ID to quote'),
});

const DeleteTweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to delete'),
});

const GetTweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to retrieve'),
  tweet_fields: z.string().optional().describe('Comma-separated fields: created_at, public_metrics, author_id, conversation_id, etc.'),
});

const SearchTweetsSchema = z.object({
  query: z.string().max(512).describe('Search query (Twitter search syntax). Max 512 characters.'),
  max_results: z.number().min(10).max(100).optional().describe('Number of results (10-100, default 10)'),
  tweet_fields: z.string().optional().describe('Comma-separated fields: created_at, public_metrics, author_id, etc.'),
});

const GetUserTweetsSchema = z.object({
  user_id: z.string().describe('Twitter user ID'),
  max_results: z.number().min(5).max(100).optional().describe('Number of tweets (5-100, default 10)'),
  tweet_fields: z.string().optional().describe('Comma-separated fields: created_at, public_metrics, etc.'),
});

export function getTweetTools(http: HttpClient) {
  return {
    twitter_create_tweet: {
      description: 'Post a new tweet. Supports replies and quote tweets. Max 280 characters.',
      schema: CreateTweetSchema,
      handler: async (params: z.infer<typeof CreateTweetSchema>) => {
        const body: Record<string, unknown> = { text: params.text };
        if (params.reply_to) {
          body['reply'] = { in_reply_to_tweet_id: params.reply_to };
        }
        if (params.quote_tweet_id) {
          body['quote_tweet_id'] = params.quote_tweet_id;
        }
        const response = await http.post('/tweets', body);
        return response.data;
      },
    },
    twitter_delete_tweet: {
      description: 'Delete one of your own tweets by ID.',
      schema: DeleteTweetSchema,
      handler: async (params: z.infer<typeof DeleteTweetSchema>) => {
        const response = await http.delete(`/tweets/${params.tweet_id}`);
        return response.data;
      },
    },
    twitter_get_tweet: {
      description: 'Get a single tweet by ID with optional expanded fields.',
      schema: GetTweetSchema,
      handler: async (params: z.infer<typeof GetTweetSchema>) => {
        const query = params.tweet_fields ? `?tweet.fields=${params.tweet_fields}` : '';
        const response = await http.get(`/tweets/${params.tweet_id}${query}`);
        return response.data;
      },
    },
    twitter_search_tweets: {
      description: 'Search recent tweets (last 7 days) using Twitter search syntax.',
      schema: SearchTweetsSchema,
      handler: async (params: z.infer<typeof SearchTweetsSchema>) => {
        const queryParams = new URLSearchParams({ query: params.query });
        if (params.max_results) queryParams.set('max_results', String(params.max_results));
        if (params.tweet_fields) queryParams.set('tweet.fields', params.tweet_fields);
        const response = await http.get(`/tweets/search/recent?${queryParams.toString()}`);
        return response.data;
      },
    },
    twitter_get_user_tweets: {
      description: 'Get recent tweets from a specific user by their user ID.',
      schema: GetUserTweetsSchema,
      handler: async (params: z.infer<typeof GetUserTweetsSchema>) => {
        const queryParams = new URLSearchParams();
        if (params.max_results) queryParams.set('max_results', String(params.max_results));
        if (params.tweet_fields) queryParams.set('tweet.fields', params.tweet_fields);
        const qs = queryParams.toString();
        const response = await http.get(`/users/${params.user_id}/tweets${qs ? `?${qs}` : ''}`);
        return response.data;
      },
    },
  };
}

export const tweetSchemas = {
  CreateTweetSchema,
  DeleteTweetSchema,
  GetTweetSchema,
  SearchTweetsSchema,
  GetUserTweetsSchema,
};
