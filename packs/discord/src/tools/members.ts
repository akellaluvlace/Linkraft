import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetMemberSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  user_id: z.string().describe('Discord user ID'),
});

const KickMemberSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  user_id: z.string().describe('User ID to kick'),
});

const BanMemberSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  user_id: z.string().describe('User ID to ban'),
  delete_message_seconds: z.number().min(0).max(604800).optional().describe('Seconds of message history to delete (0-604800, i.e. up to 7 days)'),
});

const UnbanMemberSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  user_id: z.string().describe('User ID to unban'),
});

const AddRoleSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  user_id: z.string().describe('Discord user ID'),
  role_id: z.string().describe('Role ID to add'),
});

const RemoveRoleSchema = z.object({
  guild_id: z.string().describe('Discord guild/server ID'),
  user_id: z.string().describe('Discord user ID'),
  role_id: z.string().describe('Role ID to remove'),
});

export function getMemberTools(http: HttpClient) {
  return {
    discord_get_member: {
      description: 'Get info about a guild member: nickname, roles, join date, avatar.',
      schema: GetMemberSchema,
      handler: async (params: z.infer<typeof GetMemberSchema>) => {
        const response = await http.get(`/guilds/${params.guild_id}/members/${params.user_id}`);
        return response.data;
      },
    },
    discord_kick_member: {
      description: 'Kick a member from a guild. Requires "Kick Members" permission.',
      schema: KickMemberSchema,
      handler: async (params: z.infer<typeof KickMemberSchema>) => {
        const response = await http.delete(`/guilds/${params.guild_id}/members/${params.user_id}`);
        return response.data;
      },
    },
    discord_ban_member: {
      description: 'Ban a user from a guild and optionally delete their recent messages. Requires "Ban Members" permission.',
      schema: BanMemberSchema,
      handler: async (params: z.infer<typeof BanMemberSchema>) => {
        const { guild_id, user_id, ...body } = params;
        const response = await http.put(`/guilds/${guild_id}/bans/${user_id}`, body);
        return response.data;
      },
    },
    discord_unban_member: {
      description: 'Remove a ban from a user. Requires "Ban Members" permission.',
      schema: UnbanMemberSchema,
      handler: async (params: z.infer<typeof UnbanMemberSchema>) => {
        const response = await http.delete(`/guilds/${params.guild_id}/bans/${params.user_id}`);
        return response.data;
      },
    },
    discord_add_role: {
      description: 'Add a role to a guild member. Requires "Manage Roles" permission.',
      schema: AddRoleSchema,
      handler: async (params: z.infer<typeof AddRoleSchema>) => {
        const response = await http.put(
          `/guilds/${params.guild_id}/members/${params.user_id}/roles/${params.role_id}`,
          {},
        );
        return response.data;
      },
    },
    discord_remove_role: {
      description: 'Remove a role from a guild member. Requires "Manage Roles" permission.',
      schema: RemoveRoleSchema,
      handler: async (params: z.infer<typeof RemoveRoleSchema>) => {
        const response = await http.delete(
          `/guilds/${params.guild_id}/members/${params.user_id}/roles/${params.role_id}`,
        );
        return response.data;
      },
    },
  };
}

export const memberSchemas = {
  GetMemberSchema,
  KickMemberSchema,
  BanMemberSchema,
  UnbanMemberSchema,
  AddRoleSchema,
  RemoveRoleSchema,
};
