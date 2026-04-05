import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getPostTools } from '../src/tools/posts.js';
import { getProfileTools } from '../src/tools/profile.js';
import { getOrganizationTools } from '../src/tools/organizations.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: 'urn:li:ugcPost:1' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Post tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 post tools', () => {
    const tools = getPostTools(http);
    expect(Object.keys(tools)).toEqual([
      'linkedin_create_post',
      'linkedin_delete_post',
      'linkedin_get_post',
    ]);
  });

  it('create_post posts to /ugcPosts', async () => {
    const tools = getPostTools(http);
    await tools.linkedin_create_post.handler({
      author_urn: 'urn:li:person:abc123',
      text: 'Hello LinkedIn',
    });
    expect(http.post).toHaveBeenCalledWith('/ugcPosts', expect.objectContaining({
      author: 'urn:li:person:abc123',
      lifecycleState: 'PUBLISHED',
    }));
  });

  it('create_post includes shareCommentary text', async () => {
    const tools = getPostTools(http);
    await tools.linkedin_create_post.handler({
      author_urn: 'urn:li:person:abc123',
      text: 'Test post',
    });
    const body = (http.post as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<string, unknown>;
    const specificContent = body['specificContent'] as Record<string, Record<string, Record<string, string>>>;
    expect(specificContent['com.linkedin.ugc.ShareContent']['shareCommentary']['text']).toBe('Test post');
  });

  it('delete_post calls DELETE /ugcPosts/:id', async () => {
    const tools = getPostTools(http);
    await tools.linkedin_delete_post.handler({ post_id: 'urn:li:ugcPost:123456' });
    const call = (http.delete as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/ugcPosts/');
    expect(call).toContain('urn%3Ali%3AugcPost%3A123456');
  });

  it('get_post calls GET /ugcPosts/:id', async () => {
    const tools = getPostTools(http);
    await tools.linkedin_get_post.handler({ post_id: 'urn:li:ugcPost:123456' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/ugcPosts/');
    expect(call).toContain('urn%3Ali%3AugcPost%3A123456');
  });
});

describe('Profile tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 profile tools', () => {
    const tools = getProfileTools(http);
    expect(Object.keys(tools)).toEqual([
      'linkedin_get_me',
      'linkedin_get_profile',
      'linkedin_get_connections_count',
    ]);
  });

  it('get_me calls GET /me', async () => {
    const tools = getProfileTools(http);
    await tools.linkedin_get_me.handler({});
    expect(http.get).toHaveBeenCalledWith('/me');
  });

  it('get_me includes projection when fields provided', async () => {
    const tools = getProfileTools(http);
    await tools.linkedin_get_me.handler({ fields: 'id,localizedFirstName' });
    expect(http.get).toHaveBeenCalledWith('/me?projection=(id,localizedFirstName)');
  });

  it('get_profile calls GET /people/(id:...)', async () => {
    const tools = getProfileTools(http);
    await tools.linkedin_get_profile.handler({ person_id: 'abc123' });
    expect(http.get).toHaveBeenCalledWith('/people/(id:abc123)');
  });

  it('get_connections_count calls GET /connections', async () => {
    const tools = getProfileTools(http);
    await tools.linkedin_get_connections_count.handler({});
    expect(http.get).toHaveBeenCalledWith('/connections?q=viewer&count=0');
  });
});

describe('Organization tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 organization tools', () => {
    const tools = getOrganizationTools(http);
    expect(Object.keys(tools)).toEqual([
      'linkedin_get_organization',
      'linkedin_get_organization_followers_count',
      'linkedin_create_org_post',
    ]);
  });

  it('get_organization calls GET /organizations/:id', async () => {
    const tools = getOrganizationTools(http);
    await tools.linkedin_get_organization.handler({ organization_id: '12345' });
    expect(http.get).toHaveBeenCalledWith('/organizations/12345');
  });

  it('get_organization_followers_count calls follower stats endpoint', async () => {
    const tools = getOrganizationTools(http);
    await tools.linkedin_get_organization_followers_count.handler({ organization_id: '12345' });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/organizationalEntityFollowerStatistics');
    expect(call).toContain('q=organizationalEntity');
    expect(call).toContain('urn%3Ali%3Aorganization%3A12345');
  });

  it('create_org_post posts to /ugcPosts with org author', async () => {
    const tools = getOrganizationTools(http);
    await tools.linkedin_create_org_post.handler({
      organization_id: '12345',
      text: 'Org post',
    });
    expect(http.post).toHaveBeenCalledWith('/ugcPosts', expect.objectContaining({
      author: 'urn:li:organization:12345',
      lifecycleState: 'PUBLISHED',
    }));
  });

  it('create_org_post defaults to PUBLIC visibility', async () => {
    const tools = getOrganizationTools(http);
    await tools.linkedin_create_org_post.handler({
      organization_id: '12345',
      text: 'Org post',
    });
    const body = (http.post as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as Record<string, unknown>;
    const visibility = body['visibility'] as Record<string, string>;
    expect(visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe('PUBLIC');
  });
});
