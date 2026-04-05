import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { generatePack } from '../src/codegen/generator.js';
import type { ParsedSpec, GeneratorOptions } from '../src/types.js';

const TMP_DIR = join(import.meta.dirname, '.tmp-codegen-test');

const testSpec: ParsedSpec = {
  title: 'Petstore',
  description: 'A sample pet store API',
  version: '1.0.0',
  baseUrl: 'https://petstore.example.com/api/v1',
  endpoints: [
    {
      method: 'GET',
      path: '/pets',
      operationId: 'listPets',
      summary: 'List all pets',
      tags: ['pets'],
      parameters: [
        { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Max results' },
      ],
      responses: { '200': { statusCode: '200', description: 'OK' } },
    },
    {
      method: 'POST',
      path: '/pets',
      operationId: 'createPet',
      summary: 'Create a pet',
      tags: ['pets'],
      parameters: [],
      requestBody: {
        required: true,
        contentType: 'application/json',
        properties: [
          { name: 'name', type: 'string', required: true, description: 'Pet name' },
          { name: 'tag', type: 'string', required: false, description: 'Pet tag' },
        ],
      },
      responses: { '201': { statusCode: '201', description: 'Created' } },
    },
    {
      method: 'GET',
      path: '/pets/{petId}',
      operationId: 'getPet',
      summary: 'Get a pet by ID',
      tags: ['pets'],
      parameters: [
        { name: 'petId', in: 'path', required: true, type: 'string', description: 'Pet ID' },
      ],
      responses: { '200': { statusCode: '200', description: 'OK' } },
    },
    {
      method: 'DELETE',
      path: '/pets/{petId}',
      operationId: 'deletePet',
      summary: 'Delete a pet',
      tags: ['pets'],
      parameters: [
        { name: 'petId', in: 'path', required: true, type: 'string' },
      ],
      responses: { '204': { statusCode: '204', description: 'Deleted' } },
    },
    {
      method: 'GET',
      path: '/store/inventory',
      operationId: 'getInventory',
      summary: 'Get store inventory',
      tags: ['store'],
      parameters: [],
      responses: { '200': { statusCode: '200', description: 'OK' } },
    },
  ],
  auth: [{ type: 'api-key', headerName: 'X-API-Key', in: 'header' }],
};

const testOptions: GeneratorOptions = {
  name: 'petstore',
  output: TMP_DIR,
};

beforeEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('generatePack', () => {
  it('creates pack directory structure', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'src', 'tools'))).toBe(true);
    expect(existsSync(join(packDir, 'src', 'auth'))).toBe(true);
    expect(existsSync(join(packDir, '.claude-plugin'))).toBe(true);
    expect(existsSync(join(packDir, 'skills', 'petstore'))).toBe(true);
    expect(existsSync(join(packDir, 'tests'))).toBe(true);
  });

  it('generates tool files grouped by tag', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'src', 'tools', 'pets.ts'))).toBe(true);
    expect(existsSync(join(packDir, 'src', 'tools', 'store.ts'))).toBe(true);
  });

  it('generates server.ts', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'src', 'server.ts'))).toBe(true);
  });

  it('generates auth file', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'src', 'auth', 'auth.ts'))).toBe(true);
  });

  it('generates config files', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'package.json'))).toBe(true);
    expect(existsSync(join(packDir, 'tsconfig.json'))).toBe(true);
    expect(existsSync(join(packDir, 'config.example.json'))).toBe(true);
    expect(existsSync(join(packDir, '.mcp.json'))).toBe(true);
  });

  it('generates plugin metadata', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, '.claude-plugin', 'plugin.json'))).toBe(true);
  });

  it('generates documentation', () => {
    generatePack(testSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'README.md'))).toBe(true);
    expect(existsSync(join(packDir, 'SETUP.md'))).toBe(true);
    expect(existsSync(join(packDir, 'skills', 'petstore', 'SKILL.md'))).toBe(true);
  });

  it('returns list of created files', () => {
    const files = generatePack(testSpec, testOptions);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(existsSync(file)).toBe(true);
    }
  });

  it('uses oauth2 auth file when spec has oauth2', () => {
    const oauthSpec: ParsedSpec = {
      ...testSpec,
      auth: [{
        type: 'oauth2',
        flows: {
          authorizationUrl: 'https://example.com/auth',
          tokenUrl: 'https://example.com/token',
          scopes: { read: 'Read', write: 'Write' },
        },
      }],
    };
    generatePack(oauthSpec, testOptions);
    const packDir = join(TMP_DIR, 'petstore');
    expect(existsSync(join(packDir, 'src', 'auth', 'oauth.ts'))).toBe(true);
  });
});
