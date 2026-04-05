import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const InlineButtonSchema = z.object({
  text: z.string().describe('Button label'),
  callback_data: z.string().optional().describe('Data sent in callback query when pressed (1-64 bytes)'),
  url: z.string().url().optional().describe('URL to open when pressed'),
});

const SendInlineKeyboardSchema = z.object({
  chat_id: z.union([z.string(), z.number()]).describe('Chat ID or @channel_username'),
  text: z.string().describe('Message text'),
  parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
  inline_keyboard: z.array(z.array(InlineButtonSchema)).describe('Array of button rows. Each row is an array of buttons.'),
});

const AnswerCallbackQuerySchema = z.object({
  callback_query_id: z.string().describe('ID of the callback query to answer'),
  text: z.string().optional().describe('Notification text shown to user (0-200 chars)'),
  show_alert: z.boolean().optional().describe('Show as alert popup instead of toast notification'),
});

export function getKeyboardTools(http: HttpClient) {
  return {
    telegram_send_inline_keyboard: {
      description: 'Send a message with inline keyboard buttons. Buttons can trigger callbacks or open URLs.',
      schema: SendInlineKeyboardSchema,
      handler: async (params: z.infer<typeof SendInlineKeyboardSchema>) => {
        const { inline_keyboard, ...rest } = params;
        const response = await http.post('/sendMessage', {
          ...rest,
          reply_markup: { inline_keyboard },
        });
        return response.data;
      },
    },
    telegram_answer_callback_query: {
      description: 'Answer a callback query from an inline keyboard button press. Must be called within 10 seconds.',
      schema: AnswerCallbackQuerySchema,
      handler: async (params: z.infer<typeof AnswerCallbackQuerySchema>) => {
        const response = await http.post('/answerCallbackQuery', params);
        return response.data;
      },
    },
  };
}

export const keyboardSchemas = {
  InlineButtonSchema,
  SendInlineKeyboardSchema,
  AnswerCallbackQuerySchema,
};
