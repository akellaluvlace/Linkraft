import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetMeSchema = z.object({
  user_fields: z.string().optional().describe('Comma-separated fields: description, public_metrics, profile_image_url, created_at, etc.'),
});

const GetUserByIdSchema = z.object({
  user_id: z.string().describe('Twitter user ID'),
  user_fields: z.string().optional().describe('Comma-separated fields: description, public_metrics, profile_image_url, etc.'),
});

const GetUserByUsernameSchema = z.object({
  username: z.string().describe('Twitter username (without @)'),
  user_fields: z.string().optional().describe('Comma-separated fields: description, public_metrics, profile_image_url, etc.'),
});

const GetFollowersSchema = z.object({
  user_id: z.string().describe('Twitter user ID'),
  max_results: z.number().min(1).max(1000).optional().describe('Number of followers to return (1-1000, default 100)'),
  user_fields: z.string().optional().describe('Comma-separated fields for each follower'),
});

const GetFollowingSchema = z.object({
  user_id: z.string().describe('Twitter user ID'),
  max_results: z.number().min(1).max(1000).optional().describe('Number of following to return (1-1000, default 100)'),
  user_fields: z.string().optional().describe('Comma-separated fields for each user'),
});

export function getUserTools(http: HttpClient) {
  return {
    twitter_get_me: {
      description: 'Get the authenticated user\'s profile info.',
      schema: GetMeSchema,
      handler: async (params: z.infer<typeof GetMeSchema>) => {
        const query = params.user_fields ? `?user.fields=${params.user_fields}` : '';
        const response = await http.get(`/users/me${query}`);
        return response.data;
      },
    },
    twitter_get_user: {
      description: 'Get a user\'s profile by their user ID.',
      schema: GetUserByIdSchema,
      handler: async (params: z.infer<typeof GetUserByIdSchema>) => {
        const query = params.user_fields ? `?user.fields=${params.user_fields}` : '';
        const response = await http.get(`/users/${params.user_id}${query}`);
        return response.data;
      },
    },
    twitter_get_user_by_username: {
      description: 'Look up a user by their @username.',
      schema: GetUserByUsernameSchema,
      handler: async (params: z.infer<typeof GetUserByUsernameSchema>) => {
        const query = params.user_fields ? `?user.fields=${params.user_fields}` : '';
        const response = await http.get(`/users/by/username/${params.username}${query}`);
        return response.data;
      },
    },
    twitter_get_followers: {
      description: 'Get a list of users who follow the specified user.',
      schema: GetFollowersSchema,
      handler: async (params: z.infer<typeof GetFollowersSchema>) => {
        const queryParams = new URLSearchParams();
        if (params.max_results) queryParams.set('max_results', String(params.max_results));
        if (params.user_fields) queryParams.set('user.fields', params.user_fields);
        const qs = queryParams.toString();
        const response = await http.get(`/users/${params.user_id}/followers${qs ? `?${qs}` : ''}`);
        return response.data;
      },
    },
    twitter_get_following: {
      description: 'Get a list of users the specified user is following.',
      schema: GetFollowingSchema,
      handler: async (params: z.infer<typeof GetFollowingSchema>) => {
        const queryParams = new URLSearchParams();
        if (params.max_results) queryParams.set('max_results', String(params.max_results));
        if (params.user_fields) queryParams.set('user.fields', params.user_fields);
        const qs = queryParams.toString();
        const response = await http.get(`/users/${params.user_id}/following${qs ? `?${qs}` : ''}`);
        return response.data;
      },
    },
  };
}

export const userSchemas = {
  GetMeSchema,
  GetUserByIdSchema,
  GetUserByUsernameSchema,
  GetFollowersSchema,
  GetFollowingSchema,
};
