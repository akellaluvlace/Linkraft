import { describe, it, expect } from 'vitest';
import { parseOpenApi } from '../src/parsers/openapi.js';
import { parseSwagger } from '../src/parsers/swagger.js';
import { parseManualConfig } from '../src/parsers/manual.js';
import { detectSpecFormat } from '../src/parsers/loader.js';
import type { ManualConfig } from '../src/types.js';

describe('detectSpecFormat', () => {
  it('detects OpenAPI 3.x', () => {
    expect(detectSpecFormat({ openapi: '3.0.0' })).toBe('openapi3');
    expect(detectSpecFormat({ openapi: '3.1.0' })).toBe('openapi3');
  });

  it('detects Swagger 2.0', () => {
    expect(detectSpecFormat({ swagger: '2.0' })).toBe('swagger2');
  });

  it('detects manual config', () => {
    expect(detectSpecFormat({ name: 'test', endpoints: [] })).toBe('manual');
  });

  it('returns unknown for unrecognized', () => {
    expect(detectSpecFormat({ foo: 'bar' })).toBe('unknown');
  });
});

describe('parseOpenApi', () => {
  const minimalSpec = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0', description: 'A test API' },
    servers: [{ url: 'https://api.example.com/v1' }],
    paths: {
      '/users': {
        get: {
          operationId: 'listUsers',
          summary: 'List all users',
          tags: ['users'],
          parameters: [
            { name: 'limit', in: 'query', required: false, schema: { type: 'integer' }, description: 'Max results' },
          ],
          responses: { '200': { description: 'OK' } },
        },
        post: {
          operationId: 'createUser',
          summary: 'Create a user',
          tags: ['users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'User name' },
                    email: { type: 'string', format: 'email' },
                  },
                  required: ['name'],
                },
              },
            },
          },
          responses: { '201': { description: 'Created' } },
        },
      },
      '/users/{id}': {
        get: {
          operationId: 'getUser',
          summary: 'Get a user',
          tags: ['users'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    },
  };

  it('extracts spec metadata', () => {
    const result = parseOpenApi(minimalSpec);
    expect(result.title).toBe('Test API');
    expect(result.version).toBe('1.0.0');
    expect(result.baseUrl).toBe('https://api.example.com/v1');
  });

  it('parses endpoints', () => {
    const result = parseOpenApi(minimalSpec);
    expect(result.endpoints).toHaveLength(3);
    expect(result.endpoints[0]?.operationId).toBe('listUsers');
    expect(result.endpoints[1]?.operationId).toBe('createUser');
    expect(result.endpoints[2]?.operationId).toBe('getUser');
  });

  it('parses query parameters', () => {
    const result = parseOpenApi(minimalSpec);
    const listUsers = result.endpoints[0];
    expect(listUsers?.parameters).toHaveLength(1);
    expect(listUsers?.parameters[0]?.name).toBe('limit');
    expect(listUsers?.parameters[0]?.in).toBe('query');
    expect(listUsers?.parameters[0]?.type).toBe('integer');
  });

  it('parses request body', () => {
    const result = parseOpenApi(minimalSpec);
    const createUser = result.endpoints[1];
    expect(createUser?.requestBody).toBeDefined();
    expect(createUser?.requestBody?.properties).toHaveLength(2);
    expect(createUser?.requestBody?.properties[0]?.name).toBe('name');
    expect(createUser?.requestBody?.properties[0]?.required).toBe(true);
  });

  it('parses auth schemes', () => {
    const result = parseOpenApi(minimalSpec);
    expect(result.auth).toHaveLength(1);
    expect(result.auth[0]?.type).toBe('bearer');
  });
});

describe('parseSwagger', () => {
  const minimalSpec = {
    swagger: '2.0',
    info: { title: 'Swagger API', version: '2.0.0' },
    host: 'api.example.com',
    basePath: '/v2',
    schemes: ['https'],
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          summary: 'List pets',
          tags: ['pets'],
          parameters: [
            { name: 'limit', in: 'query', type: 'integer', required: false },
          ],
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  };

  it('builds correct base URL', () => {
    const result = parseSwagger(minimalSpec);
    expect(result.baseUrl).toBe('https://api.example.com/v2');
  });

  it('parses endpoints', () => {
    const result = parseSwagger(minimalSpec);
    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]?.operationId).toBe('listPets');
  });
});

describe('parseManualConfig', () => {
  const config: ManualConfig = {
    name: 'my-api',
    description: 'My custom API',
    version: '1.0.0',
    baseUrl: 'https://api.example.com',
    auth: { type: 'api-key' },
    endpoints: [
      {
        name: 'get_items',
        method: 'GET',
        path: '/items',
        description: 'Get all items',
        parameters: [
          { name: 'limit', in: 'query', type: 'integer', required: false },
        ],
      },
      {
        name: 'create_item',
        method: 'POST',
        path: '/items',
        description: 'Create an item',
        parameters: [
          { name: 'name', in: 'body', type: 'string', required: true },
        ],
      },
    ],
  };

  it('converts to ParsedSpec', () => {
    const result = parseManualConfig(config);
    expect(result.title).toBe('my-api');
    expect(result.baseUrl).toBe('https://api.example.com');
    expect(result.endpoints).toHaveLength(2);
  });

  it('handles body params as requestBody', () => {
    const result = parseManualConfig(config);
    const createItem = result.endpoints[1];
    expect(createItem?.requestBody).toBeDefined();
    expect(createItem?.requestBody?.properties).toHaveLength(1);
    expect(createItem?.requestBody?.properties[0]?.name).toBe('name');
  });

  it('parses auth config', () => {
    const result = parseManualConfig(config);
    expect(result.auth).toHaveLength(1);
    expect(result.auth[0]?.type).toBe('api-key');
  });
});
