import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const ListLabelsSchema = z.object({});

const CreateLabelSchema = z.object({
  name: z.string().describe('Name for the new label (e.g. "Projects/Linkraft")'),
});

const DeleteLabelSchema = z.object({
  label_id: z.string().describe('The ID of the label to delete'),
});

const ModifyLabelsSchema = z.object({
  message_id: z.string().describe('The ID of the message to modify'),
  add_label_ids: z.array(z.string()).optional().describe('Array of label IDs to add to the message (e.g. ["STARRED", "Label_123"])'),
  remove_label_ids: z.array(z.string()).optional().describe('Array of label IDs to remove from the message (e.g. ["UNREAD", "INBOX"])'),
});

export function getLabelTools(http: HttpClient) {
  return {
    gmail_list_labels: {
      description: 'List all Gmail labels including system labels (INBOX, SENT, TRASH, etc.) and user-created labels.',
      schema: ListLabelsSchema,
      handler: async (_params: z.infer<typeof ListLabelsSchema>) => {
        const response = await http.get('/users/me/labels');
        return response.data;
      },
    },
    gmail_create_label: {
      description: 'Create a new Gmail label. Supports nested labels using "/" separator (e.g. "Projects/Linkraft").',
      schema: CreateLabelSchema,
      handler: async (params: z.infer<typeof CreateLabelSchema>) => {
        const response = await http.post('/users/me/labels', { name: params.name });
        return response.data;
      },
    },
    gmail_delete_label: {
      description: 'Permanently delete a Gmail label. Messages with this label are not deleted, only the label is removed.',
      schema: DeleteLabelSchema,
      handler: async (params: z.infer<typeof DeleteLabelSchema>) => {
        const response = await http.delete(`/users/me/labels/${params.label_id}`);
        return response.data;
      },
    },
    gmail_modify_labels: {
      description: 'Add or remove labels from a Gmail message. Use to mark as read (remove UNREAD), archive (remove INBOX), star, or apply custom labels.',
      schema: ModifyLabelsSchema,
      handler: async (params: z.infer<typeof ModifyLabelsSchema>) => {
        const body: Record<string, string[]> = {};
        if (params.add_label_ids) {
          body['addLabelIds'] = params.add_label_ids;
        }
        if (params.remove_label_ids) {
          body['removeLabelIds'] = params.remove_label_ids;
        }
        const response = await http.post(`/users/me/messages/${params.message_id}/modify`, body);
        return response.data;
      },
    },
  };
}

export const labelSchemas = {
  ListLabelsSchema,
  CreateLabelSchema,
  DeleteLabelSchema,
  ModifyLabelsSchema,
};
