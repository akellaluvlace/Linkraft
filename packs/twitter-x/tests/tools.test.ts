import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getTweetTools } from '../src/tools/tweets.js';
import { getUserTools } from '../src/tools/users.js';
import { getEngagementTools } from '../src/tools/engagement.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { data: { id: '1' } } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { data: { id: '1' } } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { data: { liked: true } } }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { data: { deleted: true } } }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Tweet tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 5 tweet tools', () => {
    const tools = getTweetTools(http);
    expect(Object.keys(tools)).toEqual([
      'twitter_create_tweet',
      'twitter_delete_tweet',
      'twitter_get_tweet',
      'twitter_search_tweets',
      'twitter_get_user_tweets',
    ]);
  });

  it('create_tweet posts text to /tweets', async () => {
    const tools = getTweetTools(http);
    await tools.twitter_create_tweet.handler({ text: 'Hello world' });
    expect(http.post).toHaveBeenCalledWith('/tweets', { text: 'Hello world' });
  });

  it('create_tweet formats reply correctly', async () => {
    const tools = getTweetTools(http);
    await tools.twitter_create_tweet.handler({ text: 'reply text', reply_to: '123' });
    expect(http.post).toHaveBeenCalledWith('/tweets', {
      text: 'reply text',
      reply: { in_reply_to_tweet_id: '123' },
    });
  });

  it('delete_tweet calls DELETE /tweets/:id', async () => {
    const tools = getTweetTools(http);
    await tools.twitter_delete_tweet.handler({ tweet_id: '123' });
    expect(http.delete).toHaveBeenCalledWith('/tweets/123');
  });

  it('get_tweet fetches by ID with fields', async () => {
    const tools = getTweetTools(http);
    await tools.twitter_get_tweet.handler({ tweet_id: '123', tweet_fields: 'created_at,public_metrics' });
    expect(http.get).toHaveBeenCalledWith('/tweets/123?tweet.fields=created_at,public_metrics');
  });

  it('search_tweets queries recent endpoint', async () => {
    const tools = getTweetTools(http);
    await tools.twitter_search_tweets.handler({ query: 'MCP server', max_results: 20 });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/tweets/search/recent');
    expect(call).toContain('query=MCP+server');
    expect(call).toContain('max_results=20');
  });
});

describe('User tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 5 user tools', () => {
    const tools = getUserTools(http);
    expect(Object.keys(tools)).toEqual([
      'twitter_get_me',
      'twitter_get_user',
      'twitter_get_user_by_username',
      'twitter_get_followers',
      'twitter_get_following',
    ]);
  });

  it('get_me calls /users/me', async () => {
    const tools = getUserTools(http);
    await tools.twitter_get_me.handler({});
    expect(http.get).toHaveBeenCalledWith('/users/me');
  });

  it('get_user_by_username looks up correctly', async () => {
    const tools = getUserTools(http);
    await tools.twitter_get_user_by_username.handler({ username: 'testuser' });
    expect(http.get).toHaveBeenCalledWith('/users/by/username/testuser');
  });

  it('get_followers fetches with params', async () => {
    const tools = getUserTools(http);
    await tools.twitter_get_followers.handler({ user_id: '123', max_results: 50 });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/users/123/followers');
    expect(call).toContain('max_results=50');
  });
});

describe('Engagement tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 7 engagement tools', () => {
    const tools = getEngagementTools(http);
    expect(Object.keys(tools)).toEqual([
      'twitter_like_tweet',
      'twitter_unlike_tweet',
      'twitter_retweet',
      'twitter_undo_retweet',
      'twitter_bookmark_tweet',
      'twitter_remove_bookmark',
      'twitter_get_bookmarks',
    ]);
  });

  it('like_tweet posts to users/:id/likes', async () => {
    const tools = getEngagementTools(http);
    await tools.twitter_like_tweet.handler({ user_id: '111', tweet_id: '222' });
    expect(http.post).toHaveBeenCalledWith('/users/111/likes', { tweet_id: '222' });
  });

  it('unlike_tweet calls DELETE', async () => {
    const tools = getEngagementTools(http);
    await tools.twitter_unlike_tweet.handler({ user_id: '111', tweet_id: '222' });
    expect(http.delete).toHaveBeenCalledWith('/users/111/likes/222');
  });

  it('retweet posts to users/:id/retweets', async () => {
    const tools = getEngagementTools(http);
    await tools.twitter_retweet.handler({ user_id: '111', tweet_id: '222' });
    expect(http.post).toHaveBeenCalledWith('/users/111/retweets', { tweet_id: '222' });
  });

  it('bookmark_tweet posts to bookmarks', async () => {
    const tools = getEngagementTools(http);
    await tools.twitter_bookmark_tweet.handler({ user_id: '111', tweet_id: '222' });
    expect(http.post).toHaveBeenCalledWith('/users/111/bookmarks', { tweet_id: '222' });
  });

  it('get_bookmarks fetches with params', async () => {
    const tools = getEngagementTools(http);
    await tools.twitter_get_bookmarks.handler({ user_id: '111', max_results: 25 });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/users/111/bookmarks');
    expect(call).toContain('max_results=25');
  });
});
