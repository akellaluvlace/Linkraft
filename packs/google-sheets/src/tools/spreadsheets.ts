import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetSpreadsheetSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet to retrieve. Found in the spreadsheet URL.'),
});

const CreateSpreadsheetSchema = z.object({
  title: z.string().describe('Title for the new spreadsheet, e.g. "Q4 Budget"'),
});

const AddSheetSchema = z.object({
  spreadsheetId: z.string().describe('The ID of the spreadsheet to add a sheet/tab to'),
  title: z.string().describe('Title for the new sheet/tab, e.g. "January"'),
});

export function getSpreadsheetTools(http: HttpClient) {
  return {
    gsheets_get_spreadsheet: {
      description: 'Get spreadsheet metadata including title, locale, and list of sheets/tabs.',
      schema: GetSpreadsheetSchema,
      handler: async (params: z.infer<typeof GetSpreadsheetSchema>) => {
        const response = await http.get(
          `/spreadsheets/${params.spreadsheetId}?fields=properties,sheets.properties`,
        );
        return response.data;
      },
    },
    gsheets_create_spreadsheet: {
      description: 'Create a new Google Sheets spreadsheet with the given title.',
      schema: CreateSpreadsheetSchema,
      handler: async (params: z.infer<typeof CreateSpreadsheetSchema>) => {
        const response = await http.post('/spreadsheets', {
          properties: { title: params.title },
        });
        return response.data;
      },
    },
    gsheets_add_sheet: {
      description: 'Add a new sheet/tab to an existing spreadsheet.',
      schema: AddSheetSchema,
      handler: async (params: z.infer<typeof AddSheetSchema>) => {
        const response = await http.post(
          `/spreadsheets/${params.spreadsheetId}:batchUpdate`,
          {
            requests: [
              { addSheet: { properties: { title: params.title } } },
            ],
          },
        );
        return response.data;
      },
    },
  };
}

export const spreadsheetSchemas = {
  GetSpreadsheetSchema,
  CreateSpreadsheetSchema,
  AddSheetSchema,
};
