import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const CellValue = z.union([z.string(), z.number(), z.boolean()]);
const ValuesArray = z.array(z.array(CellValue));

const GetValuesSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet'),
  range: z.string().describe('A1 notation range to read, e.g. "Sheet1!A1:D10"'),
});

const UpdateValuesSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet'),
  range: z.string().describe('A1 notation range to write to, e.g. "Sheet1!A1:D10"'),
  values: ValuesArray.describe('2D array of cell values, e.g. [["Name","Age"],["Alice",30]]'),
});

const AppendValuesSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet'),
  range: z.string().describe('A1 notation range to append after, e.g. "Sheet1!A:D"'),
  values: ValuesArray.describe('2D array of rows to append, e.g. [["Bob",25],["Carol",28]]'),
});

const ClearValuesSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet'),
  range: z.string().describe('A1 notation range to clear, e.g. "Sheet1!A1:D10"'),
});

const BatchGetSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet'),
  ranges: z.array(z.string()).describe('Array of A1 notation ranges to read, e.g. ["Sheet1!A1:B5","Sheet2!A1:C3"]'),
});

export function getValueTools(http: HttpClient) {
  return {
    gsheets_get_values: {
      description: 'Read cell values from a spreadsheet range in A1 notation.',
      schema: GetValuesSchema,
      handler: async (params: z.infer<typeof GetValuesSchema>) => {
        const response = await http.get(
          `/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}`,
        );
        return response.data;
      },
    },
    gsheets_update_values: {
      description: 'Write cell values to a spreadsheet range. Overwrites existing data.',
      schema: UpdateValuesSchema,
      handler: async (params: z.infer<typeof UpdateValuesSchema>) => {
        const response = await http.put(
          `/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}?valueInputOption=USER_ENTERED`,
          { values: params.values },
        );
        return response.data;
      },
    },
    gsheets_append_values: {
      description: 'Append rows after the last row with data in the given range.',
      schema: AppendValuesSchema,
      handler: async (params: z.infer<typeof AppendValuesSchema>) => {
        const response = await http.post(
          `/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}:append?valueInputOption=USER_ENTERED`,
          { values: params.values },
        );
        return response.data;
      },
    },
    gsheets_clear_values: {
      description: 'Clear all values in a spreadsheet range. Formatting is preserved.',
      schema: ClearValuesSchema,
      handler: async (params: z.infer<typeof ClearValuesSchema>) => {
        const response = await http.post(
          `/spreadsheets/${params.spreadsheetId}/values/${encodeURIComponent(params.range)}:clear`,
        );
        return response.data;
      },
    },
    gsheets_batch_get: {
      description: 'Read values from multiple ranges in a single request.',
      schema: BatchGetSchema,
      handler: async (params: z.infer<typeof BatchGetSchema>) => {
        const rangeParams = params.ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
        const response = await http.get(
          `/spreadsheets/${params.spreadsheetId}/values:batchGet?${rangeParams}`,
        );
        return response.data;
      },
    },
  };
}

export const valueSchemas = {
  GetValuesSchema,
  UpdateValuesSchema,
  AppendValuesSchema,
  ClearValuesSchema,
  BatchGetSchema,
};
