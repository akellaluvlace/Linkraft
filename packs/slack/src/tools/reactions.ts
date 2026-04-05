import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const AddReactionSchema = z.object({
  channel: z.string().describe('Channel ID containing the message'),
  timestamp: z.string().describe('Timestamp of the message to react to (e.g. "1234567890.123456")'),
  name: z.string().describe('Emoji name without colons (e.g. "thumbsup", "heart", "rocket")'),
});

const RemoveReactionSchema = z.object({
  channel: z.string().describe('Channel ID containing the message'),
  timestamp: z.string().describe('Timestamp of the message to remove reaction from'),
  name: z.string().describe('Emoji name without colons (e.g. "thumbsup")'),
});

const PinMessageSchema = z.object({
  channel: z.string().describe('Channel ID containing the message'),
  timestamp: z.string().describe('Timestamp of the message to pin'),
});

const UnpinMessageSchema = z.object({
  channel: z.string().describe('Channel ID containing the message'),
  timestamp: z.string().describe('Timestamp of the message to unpin'),
});

export function getReactionTools(http: HttpClient) {
  return {
    slack_add_reaction: {
      description: 'Add an emoji reaction to a message.',
      schema: AddReactionSchema,
      handler: async (params: z.infer<typeof AddReactionSchema>) => {
        const response = await http.post('/reactions.add', {
          channel: params.channel,
          timestamp: params.timestamp,
          name: params.name,
        });
        return response.data;
      },
    },
    slack_remove_reaction: {
      description: 'Remove an emoji reaction from a message.',
      schema: RemoveReactionSchema,
      handler: async (params: z.infer<typeof RemoveReactionSchema>) => {
        const response = await http.post('/reactions.remove', {
          channel: params.channel,
          timestamp: params.timestamp,
          name: params.name,
        });
        return response.data;
      },
    },
    slack_pin_message: {
      description: 'Pin a message in a Slack channel.',
      schema: PinMessageSchema,
      handler: async (params: z.infer<typeof PinMessageSchema>) => {
        const response = await http.post('/pins.add', {
          channel: params.channel,
          timestamp: params.timestamp,
        });
        return response.data;
      },
    },
    slack_unpin_message: {
      description: 'Unpin a message in a Slack channel.',
      schema: UnpinMessageSchema,
      handler: async (params: z.infer<typeof UnpinMessageSchema>) => {
        const response = await http.post('/pins.remove', {
          channel: params.channel,
          timestamp: params.timestamp,
        });
        return response.data;
      },
    },
  };
}

export const reactionSchemas = {
  AddReactionSchema,
  RemoveReactionSchema,
  PinMessageSchema,
  UnpinMessageSchema,
};
