import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getMessageTools } from '../src/tools/messages.js';
import { getGroupTools } from '../src/tools/groups.js';
import { getUpdateTools } from '../src/tools/updates.js';
import { getKeyboardTools } from '../src/tools/keyboards.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true, result: {} } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true, result: {} } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true, result: {} } }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true, result: {} } }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true, result: {} } }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true, result: {} } }),
  } as unknown as HttpClient;
}

describe('Message tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 6 message tools', () => {
    const tools = getMessageTools(http);
    const names = Object.keys(tools);
    expect(names).toEqual([
      'telegram_send_message',
      'telegram_send_photo',
      'telegram_send_document',
      'telegram_edit_message',
      'telegram_delete_message',
      'telegram_forward_message',
    ]);
  });

  it('each tool has description, schema, and handler', () => {
    const tools = getMessageTools(http);
    for (const tool of Object.values(tools)) {
      expect(tool.description).toBeTypeOf('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.schema).toBeDefined();
      expect(tool.handler).toBeTypeOf('function');
    }
  });

  it('send_message calls POST /sendMessage with params', async () => {
    const tools = getMessageTools(http);
    const params = { chat_id: '12345', text: 'Hello' };
    await tools.telegram_send_message.handler(params);
    expect(http.post).toHaveBeenCalledWith('/sendMessage', params);
  });

  it('send_photo calls POST /sendPhoto', async () => {
    const tools = getMessageTools(http);
    const params = { chat_id: '12345', photo: 'https://example.com/photo.jpg' };
    await tools.telegram_send_photo.handler(params);
    expect(http.post).toHaveBeenCalledWith('/sendPhoto', params);
  });

  it('edit_message calls POST /editMessageText', async () => {
    const tools = getMessageTools(http);
    const params = { chat_id: '12345', message_id: 1, text: 'Edited' };
    await tools.telegram_edit_message.handler(params);
    expect(http.post).toHaveBeenCalledWith('/editMessageText', params);
  });

  it('delete_message calls POST /deleteMessage', async () => {
    const tools = getMessageTools(http);
    const params = { chat_id: '12345', message_id: 1 };
    await tools.telegram_delete_message.handler(params);
    expect(http.post).toHaveBeenCalledWith('/deleteMessage', params);
  });

  it('forward_message calls POST /forwardMessage', async () => {
    const tools = getMessageTools(http);
    const params = { chat_id: '12345', from_chat_id: '67890', message_id: 1 };
    await tools.telegram_forward_message.handler(params);
    expect(http.post).toHaveBeenCalledWith('/forwardMessage', params);
  });

  it('returns response data from handler', async () => {
    const mockData = { ok: true, result: { message_id: 42 } };
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 200, headers: {}, data: mockData });
    const tools = getMessageTools(http);
    const result = await tools.telegram_send_message.handler({ chat_id: '1', text: 'test' });
    expect(result).toEqual(mockData);
  });
});

describe('Group tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 6 group tools', () => {
    const tools = getGroupTools(http);
    const names = Object.keys(tools);
    expect(names).toEqual([
      'telegram_get_chat',
      'telegram_get_chat_members_count',
      'telegram_ban_chat_member',
      'telegram_unban_chat_member',
      'telegram_set_chat_title',
      'telegram_pin_message',
    ]);
  });

  it('get_chat calls POST /getChat', async () => {
    const tools = getGroupTools(http);
    await tools.telegram_get_chat.handler({ chat_id: '12345' });
    expect(http.post).toHaveBeenCalledWith('/getChat', { chat_id: '12345' });
  });

  it('ban_chat_member calls POST /banChatMember', async () => {
    const tools = getGroupTools(http);
    await tools.telegram_ban_chat_member.handler({ chat_id: '12345', user_id: 999 });
    expect(http.post).toHaveBeenCalledWith('/banChatMember', { chat_id: '12345', user_id: 999 });
  });

  it('set_chat_title calls POST /setChatTitle', async () => {
    const tools = getGroupTools(http);
    await tools.telegram_set_chat_title.handler({ chat_id: '12345', title: 'New Title' });
    expect(http.post).toHaveBeenCalledWith('/setChatTitle', { chat_id: '12345', title: 'New Title' });
  });
});

describe('Update tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 4 update tools', () => {
    const tools = getUpdateTools(http);
    const names = Object.keys(tools);
    expect(names).toEqual([
      'telegram_get_updates',
      'telegram_set_webhook',
      'telegram_delete_webhook',
      'telegram_get_webhook_info',
    ]);
  });

  it('get_updates calls POST /getUpdates', async () => {
    const tools = getUpdateTools(http);
    await tools.telegram_get_updates.handler({ offset: 100, limit: 10 });
    expect(http.post).toHaveBeenCalledWith('/getUpdates', { offset: 100, limit: 10 });
  });

  it('set_webhook calls POST /setWebhook', async () => {
    const tools = getUpdateTools(http);
    await tools.telegram_set_webhook.handler({ url: 'https://example.com/webhook' });
    expect(http.post).toHaveBeenCalledWith('/setWebhook', { url: 'https://example.com/webhook' });
  });

  it('get_webhook_info calls POST /getWebhookInfo', async () => {
    const tools = getUpdateTools(http);
    await tools.telegram_get_webhook_info.handler();
    expect(http.post).toHaveBeenCalledWith('/getWebhookInfo');
  });
});

describe('Keyboard tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 2 keyboard tools', () => {
    const tools = getKeyboardTools(http);
    const names = Object.keys(tools);
    expect(names).toEqual([
      'telegram_send_inline_keyboard',
      'telegram_answer_callback_query',
    ]);
  });

  it('send_inline_keyboard sends reply_markup with inline_keyboard', async () => {
    const tools = getKeyboardTools(http);
    const buttons = [[{ text: 'Click me', callback_data: 'btn1' }]];
    await tools.telegram_send_inline_keyboard.handler({
      chat_id: '12345',
      text: 'Choose:',
      inline_keyboard: buttons,
    });
    expect(http.post).toHaveBeenCalledWith('/sendMessage', {
      chat_id: '12345',
      text: 'Choose:',
      reply_markup: { inline_keyboard: buttons },
    });
  });

  it('answer_callback_query calls POST /answerCallbackQuery', async () => {
    const tools = getKeyboardTools(http);
    await tools.telegram_answer_callback_query.handler({
      callback_query_id: 'abc123',
      text: 'Done!',
    });
    expect(http.post).toHaveBeenCalledWith('/answerCallbackQuery', {
      callback_query_id: 'abc123',
      text: 'Done!',
    });
  });
});
