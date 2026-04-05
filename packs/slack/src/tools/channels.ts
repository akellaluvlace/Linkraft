import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListChannelsSchema = z.object({
  limit: z.number().min(1).max(1000).optional().describe('Number of channels to return (1-1000, default 100)'),
  types: z.string().optional().describe('Comma-separated channel types (default "public_channel,private_channel")'),
});

const GetChannelInfoSchema = z.object({
  channel: z.string().describe('Channel ID to get info for (e.g. "C01234ABCDE")'),
});

const CreateChannelSchema = z.object({
  name: z.string().describe('Channel name (lowercase, no spaces, max 80 chars, e.g. "project-updates")'),
  is_private: z.boolean().optional().describe('Create as a private channel (default false)'),
});

const InviteToChannelSchema = z.object({
  channel: z.string().describe('Channel ID to invite users to'),
  users: z.string().describe('Comma-separated list of user IDs to invite (e.g. "U01234,U56789")'),
});

const SetChannelTopicSchema = z.object({
  channel: z.string().describe('Channel ID to set the topic for'),
  topic: z.string().describe('New channel topic text'),
});

export function getChannelTools(http: HttpClient) {
  return {
    slack_list_channels: {
      description: 'List Slack channels the bot has access to.',
      schema: ListChannelsSchema,
      handler: async (params: z.infer<typeof ListChannelsSchema>) => {
        const body: Record<string, unknown> = {
          types: params.types ?? 'public_channel,private_channel',
        };
        if (params.limit !== undefined) {
          body['limit'] = params.limit;
        }
        const response = await http.post('/conversations.list', body);
        return response.data;
      },
    },
    slack_get_channel_info: {
      description: 'Get detailed information about a Slack channel.',
      schema: GetChannelInfoSchema,
      handler: async (params: z.infer<typeof GetChannelInfoSchema>) => {
        const response = await http.post('/conversations.info', {
          channel: params.channel,
        });
        return response.data;
      },
    },
    slack_create_channel: {
      description: 'Create a new Slack channel.',
      schema: CreateChannelSchema,
      handler: async (params: z.infer<typeof CreateChannelSchema>) => {
        const body: Record<string, unknown> = {
          name: params.name,
        };
        if (params.is_private !== undefined) {
          body['is_private'] = params.is_private;
        }
        const response = await http.post('/conversations.create', body);
        return response.data;
      },
    },
    slack_invite_to_channel: {
      description: 'Invite one or more users to a Slack channel.',
      schema: InviteToChannelSchema,
      handler: async (params: z.infer<typeof InviteToChannelSchema>) => {
        const response = await http.post('/conversations.invite', {
          channel: params.channel,
          users: params.users,
        });
        return response.data;
      },
    },
    slack_set_channel_topic: {
      description: 'Set the topic of a Slack channel.',
      schema: SetChannelTopicSchema,
      handler: async (params: z.infer<typeof SetChannelTopicSchema>) => {
        const response = await http.post('/conversations.setTopic', {
          channel: params.channel,
          topic: params.topic,
        });
        return response.data;
      },
    },
  };
}

export const channelSchemas = {
  ListChannelsSchema,
  GetChannelInfoSchema,
  CreateChannelSchema,
  InviteToChannelSchema,
  SetChannelTopicSchema,
};
