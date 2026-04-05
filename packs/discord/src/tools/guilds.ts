import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetGuildSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
});

const GetGuildChannelsSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
});

const ListGuildMembersSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  limit: z.number().min(1).max(1000).optional().describe('Max number of members to return (1-1000, default 1)'),
  after: z.string().optional().describe('Get members after this user ID'),
});

const GetGuildRolesSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
});

const CreateGuildRoleSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  name: z.string().max(100).optional().describe('Role name (max 100 chars, default "new role")'),
  color: z.number().optional().describe('RGB color value as integer'),
  mentionable: z.boolean().optional().describe('Whether the role can be mentioned by everyone'),
});

export function getGuildTools(http: HttpClient) {
  return {
    discord_get_guild: {
      description: 'Get detailed info about a Discord guild/server: name, owner, member count, features.',
      schema: GetGuildSchema,
      handler: async (params: z.infer<typeof GetGuildSchema>) => {
        const response = await http.get(`/guilds/${params.guild_id}`);
        return response.data;
      },
    },
    discord_get_guild_channels: {
      description: 'List all channels in a Discord guild/server.',
      schema: GetGuildChannelsSchema,
      handler: async (params: z.infer<typeof GetGuildChannelsSchema>) => {
        const response = await http.get(`/guilds/${params.guild_id}/channels`);
        return response.data;
      },
    },
    discord_list_guild_members: {
      description: 'List members of a Discord guild. Requires "Server Members" intent.',
      schema: ListGuildMembersSchema,
      handler: async (params: z.infer<typeof ListGuildMembersSchema>) => {
        const { guild_id, ...query } = params;
        const queryStr = Object.entries(query)
          .filter(([, v]) => v != null)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&');
        const path = queryStr ? `/guilds/${guild_id}/members?${queryStr}` : `/guilds/${guild_id}/members`;
        const response = await http.get(path);
        return response.data;
      },
    },
    discord_get_guild_roles: {
      description: 'List all roles in a Discord guild/server.',
      schema: GetGuildRolesSchema,
      handler: async (params: z.infer<typeof GetGuildRolesSchema>) => {
        const response = await http.get(`/guilds/${params.guild_id}/roles`);
        return response.data;
      },
    },
    discord_create_guild_role: {
      description: 'Create a new role in a guild. Requires "Manage Roles" permission.',
      schema: CreateGuildRoleSchema,
      handler: async (params: z.infer<typeof CreateGuildRoleSchema>) => {
        const { guild_id, ...body } = params;
        const response = await http.post(`/guilds/${guild_id}/roles`, body);
        return response.data;
      },
    },
  };
}

export const guildSchemas = {
  GetGuildSchema,
  GetGuildChannelsSchema,
  ListGuildMembersSchema,
  GetGuildRolesSchema,
  CreateGuildRoleSchema,
};
