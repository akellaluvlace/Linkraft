import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getMessageTools } from '../src/tools/messages.js';
import { getChannelTools } from '../src/tools/channels.js';
import { getReactionTools } from '../src/tools/reactions.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true } }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true } }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true } }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { ok: true } }),
  } as unknown as HttpClient;
}

describe('Message tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 5 message tools', () => {
    const tools = getMessageTools(http);
    expect(Object.keys(tools)).toEqual([
      'slack_send_message',
      'slack_update_message',
      'slack_delete_message',
      'slack_get_history',
      'slack_get_replies',
    ]);
  });

  it('send_message posts to /chat.postMessage', async () => {
    const tools = getMessageTools(http);
    await tools.slack_send_message.handler({ channel: 'C123', text: 'Hello' });
    expect(http.post).toHaveBeenCalledWith('/chat.postMessage', {
      channel: 'C123',
      text: 'Hello',
    });
  });

  it('send_message includes thread_ts when provided', async () => {
    const tools = getMessageTools(http);
    await tools.slack_send_message.handler({
      channel: 'C123',
      text: 'Thread reply',
      thread_ts: '1234567890.123456',
    });
    expect(http.post).toHaveBeenCalledWith('/chat.postMessage', {
      channel: 'C123',
      text: 'Thread reply',
      thread_ts: '1234567890.123456',
    });
  });

  it('update_message posts to /chat.update', async () => {
    const tools = getMessageTools(http);
    await tools.slack_update_message.handler({
      channel: 'C123',
      ts: '1234567890.123456',
      text: 'Updated text',
    });
    expect(http.post).toHaveBeenCalledWith('/chat.update', {
      channel: 'C123',
      ts: '1234567890.123456',
      text: 'Updated text',
    });
  });

  it('delete_message posts to /chat.delete', async () => {
    const tools = getMessageTools(http);
    await tools.slack_delete_message.handler({
      channel: 'C123',
      ts: '1234567890.123456',
    });
    expect(http.post).toHaveBeenCalledWith('/chat.delete', {
      channel: 'C123',
      ts: '1234567890.123456',
    });
  });

  it('get_history posts to /conversations.history', async () => {
    const tools = getMessageTools(http);
    await tools.slack_get_history.handler({ channel: 'C123', limit: 50 });
    expect(http.post).toHaveBeenCalledWith('/conversations.history', {
      channel: 'C123',
      limit: 50,
    });
  });

  it('get_history includes oldest/latest when provided', async () => {
    const tools = getMessageTools(http);
    await tools.slack_get_history.handler({
      channel: 'C123',
      oldest: '1000000000.000000',
      latest: '2000000000.000000',
    });
    expect(http.post).toHaveBeenCalledWith('/conversations.history', {
      channel: 'C123',
      oldest: '1000000000.000000',
      latest: '2000000000.000000',
    });
  });

  it('get_replies posts to /conversations.replies', async () => {
    const tools = getMessageTools(http);
    await tools.slack_get_replies.handler({
      channel: 'C123',
      ts: '1234567890.123456',
      limit: 25,
    });
    expect(http.post).toHaveBeenCalledWith('/conversations.replies', {
      channel: 'C123',
      ts: '1234567890.123456',
      limit: 25,
    });
  });
});

describe('Channel tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 5 channel tools', () => {
    const tools = getChannelTools(http);
    expect(Object.keys(tools)).toEqual([
      'slack_list_channels',
      'slack_get_channel_info',
      'slack_create_channel',
      'slack_invite_to_channel',
      'slack_set_channel_topic',
    ]);
  });

  it('list_channels posts to /conversations.list with default types', async () => {
    const tools = getChannelTools(http);
    await tools.slack_list_channels.handler({ limit: 20 });
    expect(http.post).toHaveBeenCalledWith('/conversations.list', {
      types: 'public_channel,private_channel',
      limit: 20,
    });
  });

  it('get_channel_info posts to /conversations.info', async () => {
    const tools = getChannelTools(http);
    await tools.slack_get_channel_info.handler({ channel: 'C123' });
    expect(http.post).toHaveBeenCalledWith('/conversations.info', {
      channel: 'C123',
    });
  });

  it('create_channel posts to /conversations.create', async () => {
    const tools = getChannelTools(http);
    await tools.slack_create_channel.handler({ name: 'test-channel', is_private: true });
    expect(http.post).toHaveBeenCalledWith('/conversations.create', {
      name: 'test-channel',
      is_private: true,
    });
  });

  it('invite_to_channel posts to /conversations.invite', async () => {
    const tools = getChannelTools(http);
    await tools.slack_invite_to_channel.handler({ channel: 'C123', users: 'U111,U222' });
    expect(http.post).toHaveBeenCalledWith('/conversations.invite', {
      channel: 'C123',
      users: 'U111,U222',
    });
  });

  it('set_channel_topic posts to /conversations.setTopic', async () => {
    const tools = getChannelTools(http);
    await tools.slack_set_channel_topic.handler({ channel: 'C123', topic: 'New topic' });
    expect(http.post).toHaveBeenCalledWith('/conversations.setTopic', {
      channel: 'C123',
      topic: 'New topic',
    });
  });
});

describe('Reaction tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 4 reaction tools', () => {
    const tools = getReactionTools(http);
    expect(Object.keys(tools)).toEqual([
      'slack_add_reaction',
      'slack_remove_reaction',
      'slack_pin_message',
      'slack_unpin_message',
    ]);
  });

  it('add_reaction posts to /reactions.add', async () => {
    const tools = getReactionTools(http);
    await tools.slack_add_reaction.handler({
      channel: 'C123',
      timestamp: '1234567890.123456',
      name: 'thumbsup',
    });
    expect(http.post).toHaveBeenCalledWith('/reactions.add', {
      channel: 'C123',
      timestamp: '1234567890.123456',
      name: 'thumbsup',
    });
  });

  it('remove_reaction posts to /reactions.remove', async () => {
    const tools = getReactionTools(http);
    await tools.slack_remove_reaction.handler({
      channel: 'C123',
      timestamp: '1234567890.123456',
      name: 'thumbsup',
    });
    expect(http.post).toHaveBeenCalledWith('/reactions.remove', {
      channel: 'C123',
      timestamp: '1234567890.123456',
      name: 'thumbsup',
    });
  });

  it('pin_message posts to /pins.add', async () => {
    const tools = getReactionTools(http);
    await tools.slack_pin_message.handler({
      channel: 'C123',
      timestamp: '1234567890.123456',
    });
    expect(http.post).toHaveBeenCalledWith('/pins.add', {
      channel: 'C123',
      timestamp: '1234567890.123456',
    });
  });

  it('unpin_message posts to /pins.remove', async () => {
    const tools = getReactionTools(http);
    await tools.slack_unpin_message.handler({
      channel: 'C123',
      timestamp: '1234567890.123456',
    });
    expect(http.post).toHaveBeenCalledWith('/pins.remove', {
      channel: 'C123',
      timestamp: '1234567890.123456',
    });
  });
});
