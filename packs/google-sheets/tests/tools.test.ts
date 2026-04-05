import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpClient } from '@linkraft/core';
import { getSpreadsheetTools } from '../src/tools/spreadsheets.js';
import { getValueTools } from '../src/tools/values.js';

function createMockHttp(): HttpClient {
  return {
    post: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { spreadsheetId: '123' } }),
    get: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { values: [['a', 'b']] } }),
    put: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: { updatedCells: 4 } }),
    patch: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    delete: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
    request: vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} }),
  } as unknown as HttpClient;
}

describe('Spreadsheet tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 3 spreadsheet tools', () => {
    const tools = getSpreadsheetTools(http);
    expect(Object.keys(tools)).toEqual([
      'gsheets_get_spreadsheet',
      'gsheets_create_spreadsheet',
      'gsheets_add_sheet',
    ]);
  });

  it('get_spreadsheet fetches with fields param', async () => {
    const tools = getSpreadsheetTools(http);
    await tools.gsheets_get_spreadsheet.handler({ spreadsheetId: 'abc123' });
    expect(http.get).toHaveBeenCalledWith(
      '/spreadsheets/abc123?fields=properties,sheets.properties',
    );
  });

  it('create_spreadsheet posts with title', async () => {
    const tools = getSpreadsheetTools(http);
    await tools.gsheets_create_spreadsheet.handler({ title: 'My Sheet' });
    expect(http.post).toHaveBeenCalledWith('/spreadsheets', {
      properties: { title: 'My Sheet' },
    });
  });

  it('add_sheet sends batchUpdate with addSheet request', async () => {
    const tools = getSpreadsheetTools(http);
    await tools.gsheets_add_sheet.handler({ spreadsheetId: 'abc123', title: 'January' });
    expect(http.post).toHaveBeenCalledWith(
      '/spreadsheets/abc123:batchUpdate',
      {
        requests: [
          { addSheet: { properties: { title: 'January' } } },
        ],
      },
    );
  });
});

describe('Value tools', () => {
  let http: HttpClient;

  beforeEach(() => {
    http = createMockHttp();
  });

  it('registers all 5 value tools', () => {
    const tools = getValueTools(http);
    expect(Object.keys(tools)).toEqual([
      'gsheets_get_values',
      'gsheets_update_values',
      'gsheets_append_values',
      'gsheets_clear_values',
      'gsheets_batch_get',
    ]);
  });

  it('get_values fetches range with encoded path', async () => {
    const tools = getValueTools(http);
    await tools.gsheets_get_values.handler({ spreadsheetId: 'abc123', range: 'Sheet1!A1:D10' });
    expect(http.get).toHaveBeenCalledWith(
      '/spreadsheets/abc123/values/Sheet1!A1%3AD10',
    );
  });

  it('update_values puts with valueInputOption', async () => {
    const tools = getValueTools(http);
    await tools.gsheets_update_values.handler({
      spreadsheetId: 'abc123',
      range: 'Sheet1!A1:B2',
      values: [['Name', 'Age'], ['Alice', 30]],
    });
    expect(http.put).toHaveBeenCalledWith(
      '/spreadsheets/abc123/values/Sheet1!A1%3AB2?valueInputOption=USER_ENTERED',
      { values: [['Name', 'Age'], ['Alice', 30]] },
    );
  });

  it('append_values posts with valueInputOption', async () => {
    const tools = getValueTools(http);
    await tools.gsheets_append_values.handler({
      spreadsheetId: 'abc123',
      range: 'Sheet1!A:B',
      values: [['Bob', 25]],
    });
    expect(http.post).toHaveBeenCalledWith(
      '/spreadsheets/abc123/values/Sheet1!A%3AB:append?valueInputOption=USER_ENTERED',
      { values: [['Bob', 25]] },
    );
  });

  it('clear_values posts to clear endpoint', async () => {
    const tools = getValueTools(http);
    await tools.gsheets_clear_values.handler({ spreadsheetId: 'abc123', range: 'Sheet1!A1:D10' });
    expect(http.post).toHaveBeenCalledWith(
      '/spreadsheets/abc123/values/Sheet1!A1%3AD10:clear',
    );
  });

  it('batch_get builds multiple range params', async () => {
    const tools = getValueTools(http);
    await tools.gsheets_batch_get.handler({
      spreadsheetId: 'abc123',
      ranges: ['Sheet1!A1:B5', 'Sheet2!A1:C3'],
    });
    const call = (http.get as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(call).toContain('/spreadsheets/abc123/values:batchGet');
    expect(call).toContain('ranges=Sheet1!A1%3AB5');
    expect(call).toContain('ranges=Sheet2!A1%3AC3');
  });
});
