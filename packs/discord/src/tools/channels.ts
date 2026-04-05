import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetChannelSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
});

const ModifyChannelSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  name: z.string().min(1).max(100).optional().describe('New channel name (1-100 chars)'),
  topic: z.string().max(1024).optional().describe('Channel topic (0-1024 chars, 0-256 for forum channels)'),
  nsfw: z.boolean().optional().describe('Whether the channel is NSFW'),
  rate_limit_per_user: z.number().min(0).max(21600).optional().describe('Slowmode delay in seconds (0-21600)'),
});

const CreateChannelSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  name: z.string().min(1).max(100).describe('Channel name (1-100 chars)'),
  type: z.number().optional().describe('Channel type: 0=text, 2=voice, 4=category, 5=announcement, 13=stage, 15=forum'),
  topic: z.string().max(1024).optional().describe('Channel topic'),
  parent_id: z.string().optional().describe('Category ID to nest this channel under'),
});

const DeleteChannelSchema = z.object({
  channel_id: z.string().describe('Discord channel ID to delete'),
});

const GetPinsSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
});

export function getChannelTools(http: HttpClient) {
  return {
    discord_get_channel: {
      description: 'Get detailed info about a Discord channel: name, type, topic, permissions.',
      schema: GetChannelSchema,
      handler: async (params: z.infer<typeof GetChannelSchema>) => {
        const response = await http.get(`/channels/${params.channel_id}`);
        return response.data;
      },
    },
    discord_modify_channel: {
      description: 'Update a channel\'s name, topic, NSFW flag, or slowmode. Requires "Manage Channels" permission.',
      schema: ModifyChannelSchema,
      handler: async (params: z.infer<typeof ModifyChannelSchema>) => {
        const { channel_id, ...body } = params;
        const response = await http.patch(`/channels/${channel_id}`, body);
        return response.data;
      },
    },
    discord_create_channel: {
      description: 'Create a new channel in a guild. Requires "Manage Channels" permission.',
      schema: CreateChannelSchema,
      handler: async (params: z.infer<typeof CreateChannelSchema>) => {
        const { guild_id, ...body } = params;
        const response = await http.post(`/guilds/${guild_id}/channels`, body);
        return response.data;
      },
    },
    discord_delete_channel: {
      description: 'Permanently delete a channel. Requires "Manage Channels" permission. Cannot be undone.',
      schema: DeleteChannelSchema,
      handler: async (params: z.infer<typeof DeleteChannelSchema>) => {
        const response = await http.delete(`/channels/${params.channel_id}`);
        return response.data;
      },
    },
    discord_get_pinned_messages: {
      description: 'Get all pinned messages in a Discord channel.',
      schema: GetPinsSchema,
      handler: async (params: z.infer<typeof GetPinsSchema>) => {
        const response = await http.get(`/channels/${params.channel_id}/pins`);
        return response.data;
      },
    },
  };
}

export const channelSchemas = {
  GetChannelSchema,
  ModifyChannelSchema,
  CreateChannelSchema,
  DeleteChannelSchema,
  GetPinsSchema,
};
