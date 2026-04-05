import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetChatSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
});

const GetChatMembersCountSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
});

const BanChatMemberSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  user_id: z.number().describe('User ID to ban'),
  until_date: z.number().optional().describe('Unix timestamp for ban end. 0 or absent = permanent ban.'),
  revoke_messages: z.boolean().optional().describe('Delete all messages from the user in the chat'),
});

const UnbanChatMemberSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  user_id: z.number().describe('User ID to unban'),
  only_if_banned: z.boolean().optional().describe('Only unban if currently banned'),
});

const SetChatTitleSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  title: z.string().min(1).max(128).describe('New chat title, 1-128 characters'),
});

const PinMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  message_id: z.number().describe('Message ID to pin'),
  disable_notification: z.boolean().optional().describe('Pin silently'),
});

export function getGroupTools(http: HttpClient) {
  return {
    telegram_get_chat: {
      description: 'Get detailed info about a chat: title, type, description, member count, permissions.',
      schema: GetChatSchema,
      handler: async (params: z.infer<typeof GetChatSchema>) => {
        const response = await http.post('/getChat', params);
        return response.data;
      },
    },
    telegram_get_chat_members_count: {
      description: 'Get the number of members in a chat.',
      schema: GetChatMembersCountSchema,
      handler: async (params: z.infer<typeof GetChatMembersCountSchema>) => {
        const response = await http.post('/getChatMemberCount', params);
        return response.data;
      },
    },
    telegram_ban_chat_member: {
      description: 'Ban a user from a group or supergroup. Bot must be admin with ban rights.',
      schema: BanChatMemberSchema,
      handler: async (params: z.infer<typeof BanChatMemberSchema>) => {
        const response = await http.post('/banChatMember', params);
        return response.data;
      },
    },
    telegram_unban_chat_member: {
      description: 'Unban a previously banned user. User can rejoin the group.',
      schema: UnbanChatMemberSchema,
      handler: async (params: z.infer<typeof UnbanChatMemberSchema>) => {
        const response = await http.post('/unbanChatMember', params);
        return response.data;
      },
    },
    telegram_set_chat_title: {
      description: 'Change the title of a group, supergroup, or channel. Bot must be admin.',
      schema: SetChatTitleSchema,
      handler: async (params: z.infer<typeof SetChatTitleSchema>) => {
        const response = await http.post('/setChatTitle', params);
        return response.data;
      },
    },
    telegram_pin_message: {
      description: 'Pin a message in a chat. Bot must be admin with pin rights.',
      schema: PinMessageSchema,
      handler: async (params: z.infer<typeof PinMessageSchema>) => {
        const response = await http.post('/pinChatMessage', params);
        return response.data;
      },
    },
  };
}

export const groupSchemas = {
  GetChatSchema,
  GetChatMembersCountSchema,
  BanChatMemberSchema,
  UnbanChatMemberSchema,
  SetChatTitleSchema,
  PinMessageSchema,
};
