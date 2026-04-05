import type { ParsedEndpoint, ParsedParameter, ParsedProperty } from '../types.js';

export function generateToolFile(groupName: string, endpoints: ParsedEndpoint[], _baseUrl: string): string {
  const lines: string[] = [
    "import { z } from 'zod';",
    "import type { HttpClient } from '@linkraft/core';",
    '',
  ];

  const toolEntries: string[] = [];

  for (const endpoint of endpoints) {
    const toolName = buildToolName(groupName, endpoint);
    const schemaName = toPascalCase(toolName) + 'Schema';

    // Generate Zod schema
    const schemaLines = generateSchema(schemaName, endpoint);
    lines.push(...schemaLines);
    lines.push('');

    // Generate tool entry
    const entry = generateToolEntry(toolName, schemaName, endpoint);
    toolEntries.push(entry);
  }

  // Generate the getter function
  const fnName = `get${toPascalCase(groupName)}Tools`;
  lines.push(`export function ${fnName}(http: HttpClient) {`);
  lines.push('  return {');
  lines.push(toolEntries.join(',\n'));
  lines.push('  };');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

function generateSchema(schemaName: string, endpoint: ParsedEndpoint): string[] {
  const lines: string[] = [];
  const props: string[] = [];

  // Path and query parameters
  for (const param of endpoint.parameters) {
    props.push(generateParamField(param));
  }

  // Request body properties
  if (endpoint.requestBody) {
    for (const prop of endpoint.requestBody.properties) {
      props.push(generatePropertyField(prop));
    }
  }

  if (props.length === 0) {
    lines.push(`const ${schemaName} = z.object({});`);
  } else {
    lines.push(`const ${schemaName} = z.object({`);
    lines.push(props.join(',\n'));
    lines.push('});');
  }

  return lines;
}

function generateParamField(param: ParsedParameter): string {
  let field = `  ${param.name}: `;
  field += zodTypeFor(param.type, param.format, param.enum);
  if (!param.required) {
    field += '.optional()';
  }
  if (param.description) {
    field += `.describe('${escapeString(param.description)}')`;
  }
  return field;
}

function generatePropertyField(prop: ParsedProperty): string {
  let field = `  ${prop.name}: `;
  field += zodTypeFor(prop.type, prop.format, prop.enum);
  if (!prop.required) {
    field += '.optional()';
  }
  if (prop.description) {
    field += `.describe('${escapeString(prop.description)}')`;
  }
  return field;
}

function zodTypeFor(type: string, format?: string, enumValues?: string[]): string {
  if (enumValues && enumValues.length > 0) {
    const values = enumValues.map(v => `'${escapeString(v)}'`).join(', ');
    return `z.enum([${values}])`;
  }

  switch (type) {
    case 'integer':
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'array':
      return 'z.array(z.string())';
    case 'object':
      return 'z.record(z.unknown())';
    default:
      if (format === 'email') return "z.string().email()";
      if (format === 'uri' || format === 'url') return "z.string().url()";
      return 'z.string()';
  }
}

function generateToolEntry(toolName: string, schemaName: string, endpoint: ParsedEndpoint): string {
  const desc = endpoint.summary ?? endpoint.description ?? `${endpoint.method} ${endpoint.path}`;
  const pathTemplate = buildPathTemplate(endpoint);
  const method = endpoint.method.toLowerCase();

  const lines: string[] = [];
  lines.push(`    ${toolName}: {`);
  lines.push(`      description: '${escapeString(desc)}',`);
  lines.push(`      schema: ${schemaName},`);
  lines.push(`      handler: async (params: z.infer<typeof ${schemaName}>) => {`);

  // Build path with parameter substitution
  const pathParams = endpoint.parameters.filter(p => p.in === 'path');
  const queryParams = endpoint.parameters.filter(p => p.in === 'query');
  const hasBody = endpoint.requestBody != null;

  if (pathParams.length > 0) {
    let pathExpr = `'${pathTemplate}'`;
    for (const p of pathParams) {
      pathExpr = pathExpr.replace(`{${p.name}}`, `\${params.${p.name}}`);
    }
    pathExpr = '`' + pathExpr.slice(1, -1) + '`';
    lines.push(`        let path = ${pathExpr};`);
  } else {
    lines.push(`        let path = '${pathTemplate}';`);
  }

  // Add query params
  if (queryParams.length > 0) {
    lines.push('        const queryParts: string[] = [];');
    for (const q of queryParams) {
      lines.push(`        if (params.${q.name} != null) queryParts.push(\`${q.name}=\${encodeURIComponent(String(params.${q.name}))}\`);`);
    }
    lines.push("        if (queryParts.length > 0) path += '?' + queryParts.join('&');");
  }

  // Make the HTTP call
  if (method === 'get' || method === 'delete') {
    lines.push(`        const response = await http.${method}(path);`);
  } else if (hasBody) {
    const bodyProps = endpoint.requestBody?.properties.map(p => p.name) ?? [];
    if (pathParams.length > 0 || queryParams.length > 0) {
      // Destructure out path/query params, rest is body
      const exclude = [...pathParams.map(p => p.name), ...queryParams.map(p => p.name)];
      if (exclude.length > 0 && bodyProps.length > 0) {
        lines.push(`        const { ${exclude.join(', ')}, ...body } = params;`);
        lines.push(`        const response = await http.${method}(path, body);`);
      } else {
        lines.push(`        const response = await http.${method}(path, params);`);
      }
    } else {
      lines.push(`        const response = await http.${method}(path, params);`);
    }
  } else {
    lines.push(`        const response = await http.${method}(path, params);`);
  }

  lines.push('        return response.data;');
  lines.push('      },');
  lines.push('    }');

  return lines.join('\n');
}

function buildToolName(groupName: string, endpoint: ParsedEndpoint): string {
  if (endpoint.operationId) {
    return toSnakeCase(endpoint.operationId);
  }
  const method = endpoint.method.toLowerCase();
  const resource = endpoint.path
    .split('/')
    .filter(s => s && !s.startsWith('{'))
    .pop() ?? groupName;
  return `${toSnakeCase(resource)}_${method}`;
}

function buildPathTemplate(endpoint: ParsedEndpoint): string {
  return endpoint.path;
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s/g, '');
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .replace(/^_/, '')
    .toLowerCase()
    .replace(/_+/g, '_');
}

function escapeString(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');
}
