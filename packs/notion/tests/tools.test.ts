import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getPageTools } from '../src/tools/pages.js';
import { getDatabaseTools } from '../src/tools/databases.js';
import { getBlockTools } from '../src/tools/blocks.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    put: vi.fn().mockResolvedValue({ status: 204, headers: {}, data: undefined }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1' } }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { id: '1', archived: true } }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Page tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 4 page tools', () => {
    const tools = getPageTools(http);
    expect(Object.keys(tools)).toEqual([
      'notion_get_page',
      'notion_create_page',
      'notion_update_page',
      'notion_archive_page',
    ]);
  });

  it('each tool has description, schema, and handler', () => {
    const tools = getPageTools(http);
    for (const tool of Object.values(tools)) {
      expect(tool.description).toBeTypeOf('string');
      expect(tool.schema).toBeDefined();
      expect(tool.handler).toBeTypeOf('function');
    }
  });

  it('get_page fetches by ID', async () => {
    const tools = getPageTools(http);
    await tools.notion_get_page.handler({ page_id: 'abc-123' });
    expect(http.get).toHaveBeenCalledWith('/pages/abc-123');
  });

  it('create_page posts with database parent', async () => {
    const tools = getPageTools(http);
    const properties = { Name: { title: [{ text: { content: 'Test' } }] } };
    await tools.notion_create_page.handler({
      parent_type: 'database_id',
      parent_id: 'db-123',
      properties,
    });
    expect(http.post).toHaveBeenCalledWith('/pages', {
      parent: { database_id: 'db-123' },
      properties,
    });
  });

  it('create_page posts with page parent and children', async () => {
    const tools = getPageTools(http);
    const properties = { title: { title: [{ text: { content: 'Child Page' } }] } };
    const children = [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Hello' } }] } }];
    await tools.notion_create_page.handler({
      parent_type: 'page_id',
      parent_id: 'page-123',
      properties,
      children,
    });
    expect(http.post).toHaveBeenCalledWith('/pages', {
      parent: { page_id: 'page-123' },
      properties,
      children,
    });
  });

  it('update_page patches properties', async () => {
    const tools = getPageTools(http);
    const properties = { Status: { select: { name: 'Done' } } };
    await tools.notion_update_page.handler({ page_id: 'abc-123', properties });
    expect(http.patch).toHaveBeenCalledWith('/pages/abc-123', { properties });
  });

  it('archive_page patches with archived: true', async () => {
    const tools = getPageTools(http);
    await tools.notion_archive_page.handler({ page_id: 'abc-123' });
    expect(http.patch).toHaveBeenCalledWith('/pages/abc-123', { archived: true });
  });
});

describe('Database tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 database tools', () => {
    const tools = getDatabaseTools(http);
    expect(Object.keys(tools)).toEqual([
      'notion_query_database',
      'notion_get_database',
      'notion_create_database',
    ]);
  });

  it('query_database posts with filter and sorts', async () => {
    const tools = getDatabaseTools(http);
    const filter = { property: 'Status', select: { equals: 'Done' } };
    const sorts = [{ property: 'Created', direction: 'descending' }];
    await tools.notion_query_database.handler({
      database_id: 'db-123',
      filter,
      sorts,
      page_size: 10,
    });
    expect(http.post).toHaveBeenCalledWith('/databases/db-123/query', {
      filter,
      sorts,
      page_size: 10,
    });
  });

  it('query_database posts empty body when no filters', async () => {
    const tools = getDatabaseTools(http);
    await tools.notion_query_database.handler({ database_id: 'db-123' });
    expect(http.post).toHaveBeenCalledWith('/databases/db-123/query', {});
  });

  it('get_database fetches by ID', async () => {
    const tools = getDatabaseTools(http);
    await tools.notion_get_database.handler({ database_id: 'db-123' });
    expect(http.get).toHaveBeenCalledWith('/databases/db-123');
  });

  it('create_database posts with parent and properties', async () => {
    const tools = getDatabaseTools(http);
    const properties = { Name: { title: {} }, Tags: { multi_select: { options: [{ name: 'Tag1' }] } } };
    await tools.notion_create_database.handler({
      parent_page_id: 'page-123',
      title: 'My Database',
      properties,
    });
    expect(http.post).toHaveBeenCalledWith('/databases', {
      parent: { page_id: 'page-123' },
      title: [{ type: 'text', text: { content: 'My Database' } }],
      properties,
    });
  });
});

describe('Block tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 block tools', () => {
    const tools = getBlockTools(http);
    expect(Object.keys(tools)).toEqual([
      'notion_get_block_children',
      'notion_append_block_children',
      'notion_delete_block',
    ]);
  });

  it('get_block_children fetches with page_size query param', async () => {
    const tools = getBlockTools(http);
    await tools.notion_get_block_children.handler({ block_id: 'block-123', page_size: 50 });
    expect(http.get).toHaveBeenCalledWith('/blocks/block-123/children?page_size=50');
  });

  it('get_block_children fetches without query params', async () => {
    const tools = getBlockTools(http);
    await tools.notion_get_block_children.handler({ block_id: 'block-123' });
    expect(http.get).toHaveBeenCalledWith('/blocks/block-123/children');
  });

  it('get_block_children fetches with start_cursor', async () => {
    const tools = getBlockTools(http);
    await tools.notion_get_block_children.handler({ block_id: 'block-123', start_cursor: 'cursor-abc' });
    expect(http.get).toHaveBeenCalledWith('/blocks/block-123/children?start_cursor=cursor-abc');
  });

  it('append_block_children patches with children array', async () => {
    const tools = getBlockTools(http);
    const children = [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'Hello' } }] } }];
    await tools.notion_append_block_children.handler({ block_id: 'block-123', children });
    expect(http.patch).toHaveBeenCalledWith('/blocks/block-123/children', { children });
  });

  it('delete_block deletes by ID', async () => {
    const tools = getBlockTools(http);
    await tools.notion_delete_block.handler({ block_id: 'block-123' });
    expect(http.delete).toHaveBeenCalledWith('/blocks/block-123');
  });
});
