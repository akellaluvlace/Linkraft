import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const SendMessageSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  content: z.string().max(2000).describe('Message content, up to 2000 characters'),
  tts: z.boolean().optional().describe('Send as text-to-speech message'),
});

const EditMessageSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  message_id: z.string().describe('Message ID to edit'),
  content: z.string().max(2000).describe('New message content'),
});

const DeleteMessageSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  message_id: z.string().describe('Message ID to delete'),
});

const GetMessagesSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  limit: z.number().min(1).max(100).optional().describe('Number of messages to retrieve (1-100, default 50)'),
  before: z.string().optional().describe('Get messages before this message ID'),
  after: z.string().optional().describe('Get messages after this message ID'),
});

const ReactSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  message_id: z.string().describe('Message ID to react to'),
  emoji: z.string().describe('Emoji to react with. Use Unicode emoji or custom format: name:id'),
});

const PinMessageSchema = z.object({
  channel_id: z.string().describe('Discord channel ID'),
  message_id: z.string().describe('Message ID to pin'),
});

export function getMessageTools(http: HttpClient) {
  return {
    discord_send_message: {
      description: 'Send a text message to a Discord channel.',
      schema: SendMessageSchema,
      handler: async (params: z.infer<typeof SendMessageSchema>) => {
        const { channel_id, ...body } = params;
        const response = await http.post(`/channels/${channel_id}/messages`, body);
        return response.data;
      },
    },
    discord_edit_message: {
      description: 'Edit a previously sent message in a Discord channel.',
      schema: EditMessageSchema,
      handler: async (params: z.infer<typeof EditMessageSchema>) => {
        const { channel_id, message_id, ...body } = params;
        const response = await http.patch(`/channels/${channel_id}/messages/${message_id}`, body);
        return response.data;
      },
    },
    discord_delete_message: {
      description: 'Delete a message from a Discord channel. Requires "Manage Messages" permission for others\' messages.',
      schema: DeleteMessageSchema,
      handler: async (params: z.infer<typeof DeleteMessageSchema>) => {
        const response = await http.delete(`/channels/${params.channel_id}/messages/${params.message_id}`);
        return response.data;
      },
    },
    discord_get_messages: {
      description: 'Get recent messages from a Discord channel. Returns up to 100 messages.',
      schema: GetMessagesSchema,
      handler: async (params: z.infer<typeof GetMessagesSchema>) => {
        const { channel_id, ...query } = params;
        const queryStr = Object.entries(query)
          .filter(([, v]) => v != null)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&');
        const path = queryStr ? `/channels/${channel_id}/messages?${queryStr}` : `/channels/${channel_id}/messages`;
        const response = await http.get(path);
        return response.data;
      },
    },
    discord_add_reaction: {
      description: 'Add a reaction emoji to a message. Use Unicode emoji or custom format name:id.',
      schema: ReactSchema,
      handler: async (params: z.infer<typeof ReactSchema>) => {
        const emoji = encodeURIComponent(params.emoji);
        const response = await http.put(
          `/channels/${params.channel_id}/messages/${params.message_id}/reactions/${emoji}/@me`,
          {},
        );
        return response.data;
      },
    },
    discord_pin_message: {
      description: 'Pin a message in a Discord channel. Requires "Manage Messages" permission.',
      schema: PinMessageSchema,
      handler: async (params: z.infer<typeof PinMessageSchema>) => {
        const response = await http.put(`/channels/${params.channel_id}/pins/${params.message_id}`, {});
        return response.data;
      },
    },
  };
}

export const messageSchemas = {
  SendMessageSchema,
  EditMessageSchema,
  DeleteMessageSchema,
  GetMessagesSchema,
  ReactSchema,
  PinMessageSchema,
};
