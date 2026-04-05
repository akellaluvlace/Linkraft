import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ParsedSpec, ParsedEndpoint, GeneratorOptions } from '../types.js';
import { generateToolFile } from './tools.js';
import { generateServerFile } from './server.js';
import { generateAuthFile } from './auth.js';
import { generatePluginFiles } from './plugin.js';

export function generatePack(spec: ParsedSpec, options: GeneratorOptions): string[] {
  const packDir = join(options.output, options.name);
  const createdFiles: string[] = [];

  // Create directory structure
  const dirs = [
    packDir,
    join(packDir, 'src'),
    join(packDir, 'src', 'tools'),
    join(packDir, 'src', 'auth'),
    join(packDir, '.claude-plugin'),
    join(packDir, 'skills', options.name),
    join(packDir, 'tests'),
  ];
  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }

  // Group endpoints by tag/resource
  const groups = groupEndpoints(spec.endpoints);

  // Generate tool files
  for (const [groupName, endpoints] of Object.entries(groups)) {
    const content = generateToolFile(groupName, endpoints, spec.baseUrl);
    const filePath = join(packDir, 'src', 'tools', `${groupName}.ts`);
    writeFileSync(filePath, content, 'utf-8');
    createdFiles.push(filePath);
  }

  // Determine auth type
  const authType = options.auth ?? inferAuthType(spec);

  // Generate auth file
  const authContent = generateAuthFile(options.name, authType, spec);
  const authPath = join(packDir, 'src', 'auth', authType === 'oauth2' ? 'oauth.ts' : 'auth.ts');
  writeFileSync(authPath, authContent, 'utf-8');
  createdFiles.push(authPath);

  // Generate server file
  const groupNames = Object.keys(groups);
  const serverContent = generateServerFile(options.name, spec, authType, groupNames);
  const serverPath = join(packDir, 'src', 'server.ts');
  writeFileSync(serverPath, serverContent, 'utf-8');
  createdFiles.push(serverPath);

  // Generate plugin/config files
  const pluginFiles = generatePluginFiles(options, spec, authType, groupNames);
  for (const [relativePath, content] of Object.entries(pluginFiles)) {
    const filePath = join(packDir, relativePath);
    writeFileSync(filePath, content, 'utf-8');
    createdFiles.push(filePath);
  }

  return createdFiles;
}

function groupEndpoints(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
  const groups: Record<string, ParsedEndpoint[]> = {};

  for (const endpoint of endpoints) {
    const tag = endpoint.tags[0] ?? inferGroupName(endpoint.path);
    const groupName = sanitizeGroupName(tag);
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(endpoint);
  }

  return groups;
}

function inferGroupName(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const firstNonParam = segments.find(s => !s.startsWith('{'));
  return firstNonParam ?? 'general';
}

function sanitizeGroupName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferAuthType(spec: ParsedSpec): 'oauth2' | 'api-key' | 'bearer' {
  if (spec.auth.length === 0) return 'api-key';
  const first = spec.auth[0];
  if (!first) return 'api-key';
  if (first.type === 'oauth2') return 'oauth2';
  if (first.type === 'bearer') return 'bearer';
  return 'api-key';
}
