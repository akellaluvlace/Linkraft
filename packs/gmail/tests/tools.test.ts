import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getMessageTools } from '../src/tools/messages.js';
import { getLabelTools } from '../src/tools/labels.js';
import { getThreadTools } from '../src/tools/threads.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { messages: [] } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
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
      'gmail_list_messages',
      'gmail_get_message',
      'gmail_send_message',
      'gmail_trash_message',
      'gmail_untrash_message',
    ]);
  });

  it('list_messages calls GET /users/me/messages with query', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_list_messages.handler({ query: 'is:unread', max_results: 20 });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/users/me/messages');
    expect(call).toContain('q=is%3Aunread');
    expect(call).toContain('maxResults=20');
  });

  it('list_messages works without params', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_list_messages.handler({});
    expect(http.get).toHaveBeenCalledWith('/users/me/messages');
  });

  it('get_message calls GET /users/me/messages/:id with format=full', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_get_message.handler({ message_id: 'abc123' });
    expect(http.get).toHaveBeenCalledWith('/users/me/messages/abc123?format=full');
  });

  it('send_message posts base64url-encoded raw message', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_send_message.handler({
      to: 'user@example.com',
      subject: 'Test',
      body: 'Hello',
    });
    expect(http.post).toHaveBeenCalledWith('/users/me/messages/send', {
      raw: expect.any(String),
    });
    const rawArg = (http.post as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as { raw: string };
    const decoded = Buffer.from(rawArg.raw, 'base64url').toString('utf-8');
    expect(decoded).toContain('To: user@example.com');
    expect(decoded).toContain('Subject: Test');
    expect(decoded).toContain('Hello');
  });

  it('send_message includes cc and bcc headers', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_send_message.handler({
      to: 'user@example.com',
      subject: 'Test',
      body: 'Hello',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
    });
    const rawArg = (http.post as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as { raw: string };
    const decoded = Buffer.from(rawArg.raw, 'base64url').toString('utf-8');
    expect(decoded).toContain('Cc: cc@example.com');
    expect(decoded).toContain('Bcc: bcc@example.com');
  });

  it('trash_message calls POST /users/me/messages/:id/trash', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_trash_message.handler({ message_id: 'abc123' });
    expect(http.post).toHaveBeenCalledWith('/users/me/messages/abc123/trash', {});
  });

  it('untrash_message calls POST /users/me/messages/:id/untrash', async () => {
    const tools = getMessageTools(http);
    await tools.gmail_untrash_message.handler({ message_id: 'abc123' });
    expect(http.post).toHaveBeenCalledWith('/users/me/messages/abc123/untrash', {});
  });
});

describe('Label tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 4 label tools', () => {
    const tools = getLabelTools(http);
    expect(Object.keys(tools)).toEqual([
      'gmail_list_labels',
      'gmail_create_label',
      'gmail_delete_label',
      'gmail_modify_labels',
    ]);
  });

  it('list_labels calls GET /users/me/labels', async () => {
    const tools = getLabelTools(http);
    await tools.gmail_list_labels.handler({});
    expect(http.get).toHaveBeenCalledWith('/users/me/labels');
  });

  it('create_label posts name to /users/me/labels', async () => {
    const tools = getLabelTools(http);
    await tools.gmail_create_label.handler({ name: 'Projects/Linkraft' });
    expect(http.post).toHaveBeenCalledWith('/users/me/labels', { name: 'Projects/Linkraft' });
  });

  it('delete_label calls DELETE /users/me/labels/:id', async () => {
    const tools = getLabelTools(http);
    await tools.gmail_delete_label.handler({ label_id: 'Label_123' });
    expect(http.delete).toHaveBeenCalledWith('/users/me/labels/Label_123');
  });

  it('modify_labels posts addLabelIds and removeLabelIds', async () => {
    const tools = getLabelTools(http);
    await tools.gmail_modify_labels.handler({
      message_id: 'abc123',
      add_label_ids: ['STARRED'],
      remove_label_ids: ['UNREAD'],
    });
    expect(http.post).toHaveBeenCalledWith('/users/me/messages/abc123/modify', {
      addLabelIds: ['STARRED'],
      removeLabelIds: ['UNREAD'],
    });
  });

  it('modify_labels handles only add', async () => {
    const tools = getLabelTools(http);
    await tools.gmail_modify_labels.handler({
      message_id: 'abc123',
      add_label_ids: ['IMPORTANT'],
    });
    expect(http.post).toHaveBeenCalledWith('/users/me/messages/abc123/modify', {
      addLabelIds: ['IMPORTANT'],
    });
  });
});

describe('Thread tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 2 thread tools', () => {
    const tools = getThreadTools(http);
    expect(Object.keys(tools)).toEqual([
      'gmail_list_threads',
      'gmail_get_thread',
    ]);
  });

  it('list_threads calls GET /users/me/threads with query', async () => {
    const tools = getThreadTools(http);
    await tools.gmail_list_threads.handler({ query: 'from:boss@company.com', max_results: 10 });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/users/me/threads');
    expect(call).toContain('q=from%3Aboss%40company.com');
    expect(call).toContain('maxResults=10');
  });

  it('list_threads works without params', async () => {
    const tools = getThreadTools(http);
    await tools.gmail_list_threads.handler({});
    expect(http.get).toHaveBeenCalledWith('/users/me/threads');
  });

  it('get_thread calls GET /users/me/threads/:id with format=full', async () => {
    const tools = getThreadTools(http);
    await tools.gmail_get_thread.handler({ thread_id: 'thread123' });
    expect(http.get).toHaveBeenCalledWith('/users/me/threads/thread123?format=full');
  });
});
