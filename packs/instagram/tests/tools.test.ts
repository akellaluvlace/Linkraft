import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getMediaTools } from '../src/tools/media.js';
import { getCommentTools } from '../src/tools/comments.js';
import { getInsightTools } from '../src/tools/insights.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { data: { id: '1' } } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { success: true } }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Media tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 media tools', () => {
    const tools = getMediaTools(http);
    expect(Object.keys(tools)).toEqual([
      'instagram_get_media',
      'instagram_get_user_media',
      'instagram_create_photo_post',
    ]);
  });

  it('get_media fetches by ID with fields', async () => {
    const tools = getMediaTools(http);
    await tools.instagram_get_media.handler({ media_id: '123' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/123');
    expect(call).toContain('fields=id,caption,media_type,media_url,timestamp,permalink');
  });

  it('get_user_media fetches with limit', async () => {
    const tools = getMediaTools(http);
    await tools.instagram_get_user_media.handler({ user_id: '456', limit: 10 });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/456/media');
    expect(call).toContain('limit=10');
    expect(call).toContain('fields=');
    expect(decodeURIComponent(call)).toContain('id,caption,media_type,timestamp,permalink');
  });

  it('create_photo_post makes two POST calls (container + publish)', async () => {
    const mockPost = vi.fn()
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { id: 'container_123' } })
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { id: 'media_456' } });
    http.post = mockPost;

    const tools = getMediaTools(http);
    const result = await tools.instagram_create_photo_post.handler({
      user_id: '789',
      image_url: 'https://example.com/photo.jpg',
      caption: 'Test caption',
    });

    expect(mockPost).toHaveBeenCalledTimes(2);

    // First call: create container
    expect(mockPost).toHaveBeenNthCalledWith(1, '/789/media', {
      image_url: 'https://example.com/photo.jpg',
      caption: 'Test caption',
    });

    // Second call: publish
    expect(mockPost).toHaveBeenNthCalledWith(2, '/789/media_publish', {
      creation_id: 'container_123',
    });

    expect(result).toEqual({ id: 'media_456' });
  });

  it('create_photo_post omits caption when not provided', async () => {
    const mockPost = vi.fn()
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { id: 'container_123' } })
      .mockResolvedValueOnce({ status: 200, headers: {}, data: { id: 'media_456' } });
    http.post = mockPost;

    const tools = getMediaTools(http);
    await tools.instagram_create_photo_post.handler({
      user_id: '789',
      image_url: 'https://example.com/photo.jpg',
    });

    expect(mockPost).toHaveBeenNthCalledWith(1, '/789/media', {
      image_url: 'https://example.com/photo.jpg',
    });
  });
});

describe('Comment tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 4 comment tools', () => {
    const tools = getCommentTools(http);
    expect(Object.keys(tools)).toEqual([
      'instagram_get_comments',
      'instagram_reply_to_comment',
      'instagram_delete_comment',
      'instagram_hide_comment',
    ]);
  });

  it('get_comments fetches with fields', async () => {
    const tools = getCommentTools(http);
    await tools.instagram_get_comments.handler({ media_id: '123' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/123/comments');
    expect(call).toContain('fields=id,text,username,timestamp');
  });

  it('reply_to_comment posts to /{comment_id}/replies', async () => {
    const tools = getCommentTools(http);
    await tools.instagram_reply_to_comment.handler({ comment_id: '456', message: 'Thanks!' });
    expect(http.post).toHaveBeenCalledWith('/456/replies', { message: 'Thanks!' });
  });

  it('delete_comment calls DELETE /{comment_id}', async () => {
    const tools = getCommentTools(http);
    await tools.instagram_delete_comment.handler({ comment_id: '789' });
    expect(http.delete).toHaveBeenCalledWith('/789');
  });

  it('hide_comment posts hide=true to /{comment_id}', async () => {
    const tools = getCommentTools(http);
    await tools.instagram_hide_comment.handler({ comment_id: '789', hide: true });
    expect(http.post).toHaveBeenCalledWith('/789', { hide: true });
  });
});

describe('Insight tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 insight tools', () => {
    const tools = getInsightTools(http);
    expect(Object.keys(tools)).toEqual([
      'instagram_get_user_insights',
      'instagram_get_media_insights',
      'instagram_get_profile',
    ]);
  });

  it('get_user_insights fetches with default metric and period', async () => {
    const tools = getInsightTools(http);
    await tools.instagram_get_user_insights.handler({ user_id: '123' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/123/insights');
    expect(call).toContain('metric=impressions%2Creach%2Cprofile_views');
    expect(call).toContain('period=day');
  });

  it('get_user_insights uses custom metric and period', async () => {
    const tools = getInsightTools(http);
    await tools.instagram_get_user_insights.handler({
      user_id: '123',
      metric: 'impressions,reach',
      period: 'week',
    });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('metric=impressions%2Creach');
    expect(call).toContain('period=week');
  });

  it('get_media_insights fetches with default metrics', async () => {
    const tools = getInsightTools(http);
    await tools.instagram_get_media_insights.handler({ media_id: '456' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/456/insights');
    expect(call).toContain('metric=impressions%2Creach%2Cengagement');
  });

  it('get_profile fetches with correct fields', async () => {
    const tools = getInsightTools(http);
    await tools.instagram_get_profile.handler({ user_id: '123' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/123');
    expect(call).toContain('fields=id,username,name,biography,followers_count,follows_count,media_count');
  });
});
