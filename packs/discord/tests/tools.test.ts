import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getMessageTools } from '../src/tools/messages.js';
import { getChannelTools } from '../src/tools/channels.js';
import { getGuildTools } from '../src/tools/guilds.js';
import { getMemberTools } from '../src/tools/members.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    put: vi.fn().mockResolvedValue({ status: 204, headers: {}, data: undefined }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    delete: vi.fn().mockResolvedValue({ status: 204, headers: {}, data: undefined }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Message tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 6 message tools', () => {
    const tools = getMessageTools(http);
    expect(Object.keys(tools)).toEqual([
      'discord_send_message',
      'discord_edit_message',
      'discord_delete_message',
      'discord_get_messages',
      'discord_add_reaction',
      'discord_pin_message',
    ]);
  });

  it('each tool has description, schema, and handler', () => {
    const tools = getMessageTools(http);
    for (const tool of Object.values(tools)) {
      expect(tool.description).toBeTypeOf('string');
      expect(tool.schema).toBeDefined();
      expect(tool.handler).toBeTypeOf('function');
    }
  });

  it('send_message posts to correct channel endpoint', async () => {
    const tools = getMessageTools(http);
    await tools.discord_send_message.handler({ channel_id: '111', content: 'Hello' });
    expect(http.post).toHaveBeenCalledWith('/channels/111/messages', { content: 'Hello' });
  });

  it('edit_message patches the correct message', async () => {
    const tools = getMessageTools(http);
    await tools.discord_edit_message.handler({ channel_id: '111', message_id: '222', content: 'Edited' });
    expect(http.patch).toHaveBeenCalledWith('/channels/111/messages/222', { content: 'Edited' });
  });

  it('delete_message deletes the correct message', async () => {
    const tools = getMessageTools(http);
    await tools.discord_delete_message.handler({ channel_id: '111', message_id: '222' });
    expect(http.delete).toHaveBeenCalledWith('/channels/111/messages/222');
  });

  it('get_messages fetches with query params', async () => {
    const tools = getMessageTools(http);
    await tools.discord_get_messages.handler({ channel_id: '111', limit: 10, before: '999' });
    expect(http.get).toHaveBeenCalledWith('/channels/111/messages?limit=10&before=999');
  });

  it('add_reaction puts emoji on message', async () => {
    const tools = getMessageTools(http);
    await tools.discord_add_reaction.handler({ channel_id: '111', message_id: '222', emoji: '👍' });
    expect(http.put).toHaveBeenCalledWith(
      `/channels/111/messages/222/reactions/${encodeURIComponent('👍')}/@me`,
      {},
    );
  });

  it('pin_message puts to pins endpoint', async () => {
    const tools = getMessageTools(http);
    await tools.discord_pin_message.handler({ channel_id: '111', message_id: '222' });
    expect(http.put).toHaveBeenCalledWith('/channels/111/pins/222', {});
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
      'discord_get_channel',
      'discord_modify_channel',
      'discord_create_channel',
      'discord_delete_channel',
      'discord_get_pinned_messages',
    ]);
  });

  it('get_channel fetches by ID', async () => {
    const tools = getChannelTools(http);
    await tools.discord_get_channel.handler({ channel_id: '111' });
    expect(http.get).toHaveBeenCalledWith('/channels/111');
  });

  it('create_channel posts to guild endpoint', async () => {
    const tools = getChannelTools(http);
    await tools.discord_create_channel.handler({ guild_id: '999', name: 'test', type: 0 });
    expect(http.post).toHaveBeenCalledWith('/guilds/999/channels', { name: 'test', type: 0 });
  });

  it('modify_channel patches with body', async () => {
    const tools = getChannelTools(http);
    await tools.discord_modify_channel.handler({ channel_id: '111', name: 'renamed', topic: 'new topic' });
    expect(http.patch).toHaveBeenCalledWith('/channels/111', { name: 'renamed', topic: 'new topic' });
  });
});

describe('Guild tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 5 guild tools', () => {
    const tools = getGuildTools(http);
    expect(Object.keys(tools)).toEqual([
      'discord_get_guild',
      'discord_get_guild_channels',
      'discord_list_guild_members',
      'discord_get_guild_roles',
      'discord_create_guild_role',
    ]);
  });

  it('get_guild fetches by ID', async () => {
    const tools = getGuildTools(http);
    await tools.discord_get_guild.handler({ guild_id: '999' });
    expect(http.get).toHaveBeenCalledWith('/guilds/999');
  });

  it('list_guild_members fetches with query params', async () => {
    const tools = getGuildTools(http);
    await tools.discord_list_guild_members.handler({ guild_id: '999', limit: 50 });
    expect(http.get).toHaveBeenCalledWith('/guilds/999/members?limit=50');
  });

  it('create_guild_role posts to roles endpoint', async () => {
    const tools = getGuildTools(http);
    await tools.discord_create_guild_role.handler({ guild_id: '999', name: 'Moderator', color: 0x3498db });
    expect(http.post).toHaveBeenCalledWith('/guilds/999/roles', { name: 'Moderator', color: 0x3498db });
  });
});

describe('Member tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 6 member tools', () => {
    const tools = getMemberTools(http);
    expect(Object.keys(tools)).toEqual([
      'discord_get_member',
      'discord_kick_member',
      'discord_ban_member',
      'discord_unban_member',
      'discord_add_role',
      'discord_remove_role',
    ]);
  });

  it('get_member fetches by guild and user', async () => {
    const tools = getMemberTools(http);
    await tools.discord_get_member.handler({ guild_id: '999', user_id: '123' });
    expect(http.get).toHaveBeenCalledWith('/guilds/999/members/123');
  });

  it('kick_member deletes member', async () => {
    const tools = getMemberTools(http);
    await tools.discord_kick_member.handler({ guild_id: '999', user_id: '123' });
    expect(http.delete).toHaveBeenCalledWith('/guilds/999/members/123');
  });

  it('ban_member puts to bans endpoint', async () => {
    const tools = getMemberTools(http);
    await tools.discord_ban_member.handler({ guild_id: '999', user_id: '123', delete_message_seconds: 86400 });
    expect(http.put).toHaveBeenCalledWith('/guilds/999/bans/123', { delete_message_seconds: 86400 });
  });

  it('add_role puts to roles endpoint', async () => {
    const tools = getMemberTools(http);
    await tools.discord_add_role.handler({ guild_id: '999', user_id: '123', role_id: '456' });
    expect(http.put).toHaveBeenCalledWith('/guilds/999/members/123/roles/456', {});
  });

  it('remove_role deletes from roles endpoint', async () => {
    const tools = getMemberTools(http);
    await tools.discord_remove_role.handler({ guild_id: '999', user_id: '123', role_id: '456' });
    expect(http.delete).toHaveBeenCalledWith('/guilds/999/members/123/roles/456');
  });
});
