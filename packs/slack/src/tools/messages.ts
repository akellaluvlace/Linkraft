import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const SendMessageSchema = z.object({
  channel: z.string().describe('Channel ID to send the message to (e.g. "C01234ABCDE")'),
  text: z.string().describe('Message text. Supports Slack mrkdwn formatting.'),
  thread_ts: z.string().optional().describe('Timestamp of parent message to reply in thread (e.g. "1234567890.123456")'),
});

const UpdateMessageSchema = z.object({
  channel: z.string().describe('Channel ID containing the message'),
  ts: z.string().describe('Timestamp of the message to update (e.g. "1234567890.123456")'),
  text: z.string().describe('New message text'),
});

const DeleteMessageSchema = z.object({
  channel: z.string().describe('Channel ID containing the message'),
  ts: z.string().describe('Timestamp of the message to delete (e.g. "1234567890.123456")'),
});

const GetHistorySchema = z.object({
  channel: z.string().describe('Channel ID to fetch history from'),
  limit: z.number().min(1).max(1000).optional().describe('Number of messages to return (1-1000, default 100)'),
  oldest: z.string().optional().describe('Only messages after this Unix timestamp (e.g. "1234567890.123456")'),
  latest: z.string().optional().describe('Only messages before this Unix timestamp (e.g. "1234567890.123456")'),
});

const GetRepliesSchema = z.object({
  channel: z.string().describe('Channel ID containing the thread'),
  ts: z.string().describe('Timestamp of the parent message (thread root)'),
  limit: z.number().min(1).max(1000).optional().describe('Number of replies to return (1-1000, default 100)'),
});

export function getMessageTools(http: HttpClient) {
  return {
    slack_send_message: {
      description: 'Send a message to a Slack channel. Supports threading via thread_ts.',
      schema: SendMessageSchema,
      handler: async (params: z.infer<typeof SendMessageSchema>) => {
        const body: Record<string, unknown> = {
          channel: params.channel,
          text: params.text,
        };
        if (params.thread_ts) {
          body['thread_ts'] = params.thread_ts;
        }
        const response = await http.post('/chat.postMessage', body);
        return response.data;
      },
    },
    slack_update_message: {
      description: 'Update an existing message in a Slack channel.',
      schema: UpdateMessageSchema,
      handler: async (params: z.infer<typeof UpdateMessageSchema>) => {
        const response = await http.post('/chat.update', {
          channel: params.channel,
          ts: params.ts,
          text: params.text,
        });
        return response.data;
      },
    },
    slack_delete_message: {
      description: 'Delete a message from a Slack channel.',
      schema: DeleteMessageSchema,
      handler: async (params: z.infer<typeof DeleteMessageSchema>) => {
        const response = await http.post('/chat.delete', {
          channel: params.channel,
          ts: params.ts,
        });
        return response.data;
      },
    },
    slack_get_history: {
      description: 'Get recent messages from a Slack channel. Supports time range filtering.',
      schema: GetHistorySchema,
      handler: async (params: z.infer<typeof GetHistorySchema>) => {
        const body: Record<string, unknown> = {
          channel: params.channel,
        };
        if (params.limit !== undefined) {
          body['limit'] = params.limit;
        }
        if (params.oldest) {
          body['oldest'] = params.oldest;
        }
        if (params.latest) {
          body['latest'] = params.latest;
        }
        const response = await http.post('/conversations.history', body);
        return response.data;
      },
    },
    slack_get_replies: {
      description: 'Get replies in a message thread.',
      schema: GetRepliesSchema,
      handler: async (params: z.infer<typeof GetRepliesSchema>) => {
        const body: Record<string, unknown> = {
          channel: params.channel,
          ts: params.ts,
        };
        if (params.limit !== undefined) {
          body['limit'] = params.limit;
        }
        const response = await http.post('/conversations.replies', body);
        return response.data;
      },
    },
  };
}

export const messageSchemas = {
  SendMessageSchema,
  UpdateMessageSchema,
  DeleteMessageSchema,
  GetHistorySchema,
  GetRepliesSchema,
};
