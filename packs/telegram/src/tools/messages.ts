import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const SendMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  text: z.string().describe('Message text, 1-4096 characters'),
  parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional().describe('Text formatting mode'),
  reply_to_message_id: z.number().optional().describe('ID of the message to reply to'),
  disable_notification: z.boolean().optional().describe('Send silently'),
});

const SendPhotoSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  photo: z.string().describe('Photo URL or file_id'),
  caption: z.string().optional().describe('Photo caption, 0-1024 characters'),
  parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
});

const SendDocumentSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  document: z.string().describe('Document URL or file_id'),
  caption: z.string().optional().describe('Document caption, 0-1024 characters'),
  parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
});

const EditMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  message_id: z.number().describe('ID of the message to edit'),
  text: z.string().describe('New text of the message'),
  parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
});

const DeleteMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  message_id: z.number().describe('ID of the message to delete'),
});

const ForwardMessageSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Target chat ID'),
  from_chat_id: z.union([z.string(), z.number()]).describe('Source chat ID'),
  message_id: z.number().describe('Message ID to forward'),
  disable_notification: z.boolean().optional(),
});

export function getMessageTools(http: HttpClient) {
  return {
    telegram_send_message: {
      description: 'Send a text message to a Telegram chat. Supports HTML, Markdown, and MarkdownV2 formatting.',
      schema: SendMessageSchema,
      handler: async (params: z.infer<typeof SendMessageSchema>) => {
        const response = await http.post('/sendMessage', params);
        return response.data;
      },
    },
    telegram_send_photo: {
      description: 'Send a photo to a Telegram chat. Provide a URL or file_id.',
      schema: SendPhotoSchema,
      handler: async (params: z.infer<typeof SendPhotoSchema>) => {
        const response = await http.post('/sendPhoto', params);
        return response.data;
      },
    },
    telegram_send_document: {
      description: 'Send a document/file to a Telegram chat. Provide a URL or file_id.',
      schema: SendDocumentSchema,
      handler: async (params: z.infer<typeof SendDocumentSchema>) => {
        const response = await http.post('/sendDocument', params);
        return response.data;
      },
    },
    telegram_edit_message: {
      description: 'Edit a previously sent text message.',
      schema: EditMessageSchema,
      handler: async (params: z.infer<typeof EditMessageSchema>) => {
        const response = await http.post('/editMessageText', params);
        return response.data;
      },
    },
    telegram_delete_message: {
      description: 'Delete a message. Bot must be admin in groups. Messages older than 48h cannot be deleted.',
      schema: DeleteMessageSchema,
      handler: async (params: z.infer<typeof DeleteMessageSchema>) => {
        const response = await http.post('/deleteMessage', params);
        return response.data;
      },
    },
    telegram_forward_message: {
      description: 'Forward a message from one chat to another.',
      schema: ForwardMessageSchema,
      handler: async (params: z.infer<typeof ForwardMessageSchema>) => {
        const response = await http.post('/forwardMessage', params);
        return response.data;
      },
    },
  };
}

export const messageSchemas = {
  SendMessageSchema,
  SendPhotoSchema,
  SendDocumentSchema,
  EditMessageSchema,
  DeleteMessageSchema,
  ForwardMessageSchema,
};
