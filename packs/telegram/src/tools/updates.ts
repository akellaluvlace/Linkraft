import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetUpdatesSchema = z.object({
  offset: z.number().optional().describe('Update ID offset. Use last update_id + 1 to avoid duplicates.'),
  limit: z.number().min(1).max(100).optional().describe('Max number of updates (1-100, default 100)'),
  timeout: z.number().optional().describe('Long polling timeout in seconds (0 for short polling)'),
  allowed_updates: z.array(z.string()).optional().describe('List of update types to receive, e.g. ["message", "callback_query"]'),
});

const SetWebhookSchema = z.object({
  url: z.string().url().describe('HTTPS URL to receive updates'),
  max_connections: z.number().min(1).max(100).optional().describe('Max simultaneous connections (1-100, default 40)'),
  allowed_updates: z.array(z.string()).optional().describe('List of update types to receive'),
  secret_token: z.string().optional().describe('Secret token for X-Telegram-Bot-Api-Secret-Token header (1-256 chars)'),
});

const DeleteWebhookSchema = z.object({
  drop_pending_updates: z.boolean().optional().describe('Drop all pending updates'),
});

export function getUpdateTools(http: HttpClient) {
  return {
    telegram_get_updates: {
      description: 'Get new updates (messages, callbacks, etc.) using long polling. Use offset to avoid receiving duplicates.',
      schema: GetUpdatesSchema,
      handler: async (params: z.infer<typeof GetUpdatesSchema>) => {
        const response = await http.post('/getUpdates', params);
        return response.data;
      },
    },
    telegram_set_webhook: {
      description: 'Set a webhook URL for receiving updates. Telegram will POST updates to this HTTPS URL.',
      schema: SetWebhookSchema,
      handler: async (params: z.infer<typeof SetWebhookSchema>) => {
        const response = await http.post('/setWebhook', params);
        return response.data;
      },
    },
    telegram_delete_webhook: {
      description: 'Remove the current webhook. After this, use getUpdates for long polling.',
      schema: DeleteWebhookSchema,
      handler: async (params: z.infer<typeof DeleteWebhookSchema>) => {
        const response = await http.post('/deleteWebhook', params);
        return response.data;
      },
    },
    telegram_get_webhook_info: {
      description: 'Get current webhook configuration: URL, pending update count, last error.',
      schema: z.object({}),
      handler: async () => {
        const response = await http.post('/getWebhookInfo');
        return response.data;
      },
    },
  };
}

export const updateSchemas = {
  GetUpdatesSchema,
  SetWebhookSchema,
  DeleteWebhookSchema,
};
