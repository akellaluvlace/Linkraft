import { readFileSync } from 'node:fs';
import YAML from 'yaml';

export type SpecFormat = 'openapi3' | 'swagger2' | 'manual' | 'unknown';

export function detectSpecFormat(spec: Record<string, unknown>): SpecFormat {
  // OpenAPI 3.x: has "openapi" field starting with "3."
  const openapi = spec['openapi'];
  if (typeof openapi === 'string' && openapi.startsWith('3.')) {
    return 'openapi3';
  }

  // Swagger 2.0: has "swagger" field equal to "2.0"
  const swagger = spec['swagger'];
  if (typeof swagger === 'string' && swagger === '2.0') {
    return 'swagger2';
  }

  // Manual config: has "name" and "endpoints" array
  if (typeof spec['name'] === 'string' && Array.isArray(spec['endpoints'])) {
    return 'manual';
  }

  return 'unknown';
}

function parseContent(content: string, source: string): Record<string, unknown> {
  // Try JSON first
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Spec from "${source}" parsed as JSON but is not an object.`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    // JSON failed, try YAML
  }

  try {
    const parsed: unknown = YAML.parse(content);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Spec from "${source}" parsed as YAML but is not an object.`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(
      `Failed to parse spec from "${source}": content is neither valid JSON nor valid YAML.`,
    );
  }
}

export async function loadSpec(pathOrUrl: string): Promise<Record<string, unknown>> {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch spec from "${pathOrUrl}": ${String(response.status)} ${response.statusText}`,
      );
    }
    const text = await response.text();
    return parseContent(text, pathOrUrl);
  }

  let content: string;
  try {
    content = readFileSync(pathOrUrl, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read spec file "${pathOrUrl}": ${message}`);
  }

  return parseContent(content, pathOrUrl);
}
