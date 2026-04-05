import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListMessagesSchema = z.object({
  query: z.string().optional().describe('Gmail search query using Gmail search syntax (e.g. "from:user@example.com subject:hello")'),
  max_results: z.number().min(1).max(500).optional().describe('Maximum number of messages to return (1-500, default 10)'),
});

const GetMessageSchema = z.object({
  message_id: z.string().describe('The ID of the message to retrieve'),
});

const SendMessageSchema = z.object({
  to: z.string().describe('Recipient email address (e.g. "user@example.com")'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Plain text email body'),
  cc: z.string().optional().describe('CC recipient email address'),
  bcc: z.string().optional().describe('BCC recipient email address'),
});

const TrashMessageSchema = z.object({
  message_id: z.string().describe('The ID of the message to move to trash'),
});

const UntrashMessageSchema = z.object({
  message_id: z.string().describe('The ID of the message to remove from trash'),
});

function buildRawEmail(params: { to: string; subject: string; body: string; cc?: string; bcc?: string }): string {
  const lines: string[] = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (params.cc) {
    lines.push(`Cc: ${params.cc}`);
  }
  if (params.bcc) {
    lines.push(`Bcc: ${params.bcc}`);
  }
  lines.push('', params.body);
  return Buffer.from(lines.join('\r\n')).toString('base64url');
}

export function getMessageTools(http: HttpClient) {
  return {
    gmail_list_messages: {
      description: 'List Gmail messages matching a search query. Uses Gmail search syntax (e.g. "is:unread", "from:user@example.com").',
      schema: ListMessagesSchema,
      handler: async (params: z.infer<typeof ListMessagesSchema>) => {
        const queryParams = new URLSearchParams();
        if (params.query) queryParams.set('q', params.query);
        if (params.max_results) queryParams.set('maxResults', String(params.max_results));
        const qs = queryParams.toString();
        const response = await http.get(`/users/me/messages${qs ? `?${qs}` : ''}`);
        return response.data;
      },
    },
    gmail_get_message: {
      description: 'Get a single Gmail message by ID with full content including headers, body, and attachments metadata.',
      schema: GetMessageSchema,
      handler: async (params: z.infer<typeof GetMessageSchema>) => {
        const response = await http.get(`/users/me/messages/${params.message_id}?format=full`);
        return response.data;
      },
    },
    gmail_send_message: {
      description: 'Send an email via Gmail. Builds an RFC 2822 message from to, subject, and body fields.',
      schema: SendMessageSchema,
      handler: async (params: z.infer<typeof SendMessageSchema>) => {
        const raw = buildRawEmail(params);
        const response = await http.post('/users/me/messages/send', { raw });
        return response.data;
      },
    },
    gmail_trash_message: {
      description: 'Move a Gmail message to the trash. The message can be recovered within 30 days.',
      schema: TrashMessageSchema,
      handler: async (params: z.infer<typeof TrashMessageSchema>) => {
        const response = await http.post(`/users/me/messages/${params.message_id}/trash`, {});
        return response.data;
      },
    },
    gmail_untrash_message: {
      description: 'Remove a Gmail message from the trash, restoring it to its previous location.',
      schema: UntrashMessageSchema,
      handler: async (params: z.infer<typeof UntrashMessageSchema>) => {
        const response = await http.post(`/users/me/messages/${params.message_id}/untrash`, {});
        return response.data;
      },
    },
  };
}

export const messageSchemas = {
  ListMessagesSchema,
  GetMessageSchema,
  SendMessageSchema,
  TrashMessageSchema,
  UntrashMessageSchema,
};
