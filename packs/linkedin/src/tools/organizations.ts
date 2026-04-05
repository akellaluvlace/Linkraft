import { z } from 'zod';
import type { HttpClient } from '@linkraft/core';

const GetOrganizationSchema = z.object({
  organization_id: z.string().describe('LinkedIn organization ID (numeric)'),
});

const GetOrganizationFollowersCountSchema = z.object({
  organization_id: z.string().describe('LinkedIn organization ID (numeric)'),
});

const CreateOrgPostSchema = z.object({
  organization_id: z.string().describe('LinkedIn organization ID (numeric). The post will be authored by this organization.'),
  text: z.string().max(3000).describe('Post text content, up to 3000 characters'),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().describe('Post visibility: PUBLIC or CONNECTIONS (default PUBLIC)'),
});

export function getOrganizationTools(http: HttpClient) {
  return {
    linkedin_get_organization: {
      description: 'Get LinkedIn organization details by ID.',
      schema: GetOrganizationSchema,
      handler: async (params: z.infer<typeof GetOrganizationSchema>) => {
        const response = await http.get(`/organizations/${params.organization_id}`);
        return response.data;
      },
    },
    linkedin_get_organization_followers_count: {
      description: 'Get the follower count for a LinkedIn organization.',
      schema: GetOrganizationFollowersCountSchema,
      handler: async (params: z.infer<typeof GetOrganizationFollowersCountSchema>) => {
        const orgUrn = `urn:li:organization:${params.organization_id}`;
        const queryParams = new URLSearchParams({
          q: 'organizationalEntity',
          organizationalEntity: orgUrn,
        });
        const response = await http.get(`/organizationalEntityFollowerStatistics?${queryParams.toString()}`);
        return response.data;
      },
    },
    linkedin_create_org_post: {
      description: 'Create a text post as a LinkedIn organization. Requires organization admin access.',
      schema: CreateOrgPostSchema,
      handler: async (params: z.infer<typeof CreateOrgPostSchema>) => {
        const visibility = params.visibility ?? 'PUBLIC';
        const body = {
          author: `urn:li:organization:${params.organization_id}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: params.text,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': visibility,
          },
        };
        const response = await http.post('/ugcPosts', body);
        return response.data;
      },
    },
  };
}

export const organizationSchemas = {
  GetOrganizationSchema,
  GetOrganizationFollowersCountSchema,
  CreateOrgPostSchema,
};
