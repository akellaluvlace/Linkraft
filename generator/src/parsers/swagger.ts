import type {
  ParsedSpec,
  ParsedEndpoint,
  ParsedParameter,
  ParsedProperty,
  ParsedRequestBody,
  ParsedResponse,
  ParsedAuthScheme,
} from '../types.js';

type SpecRecord = Record<string, unknown>;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

function resolveRef(spec: SpecRecord, ref: string): SpecRecord {
  if (!ref.startsWith('#/')) {
    throw new Error(`Unsupported $ref format: "${ref}". Only local references starting with "#/" are supported.`);
  }

  const segments = ref.slice(2).split('/');
  let current: unknown = spec;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      throw new Error(`Cannot resolve $ref "${ref}": path segment "${segment}" not found.`);
    }
    current = (current as SpecRecord)[segment];
  }

  if (current === null || current === undefined || typeof current !== 'object') {
    throw new Error(`$ref "${ref}" resolved to a non-object value.`);
  }

  return current as SpecRecord;
}

function resolveIfRef(spec: SpecRecord, value: unknown): SpecRecord {
  if (value === null || value === undefined || typeof value !== 'object') {
    return {} as SpecRecord;
  }
  const obj = value as SpecRecord;
  if (typeof obj['$ref'] === 'string') {
    return resolveRef(spec, obj['$ref']);
  }
  return obj;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function toStringType(schemaType: unknown): string {
  if (typeof schemaType === 'string') return schemaType;
  return 'string';
}

function parseSchemaProperty(spec: SpecRecord, name: string, schema: SpecRecord, requiredFields: string[]): ParsedProperty {
  const resolved = resolveIfRef(spec, schema);

  const prop: ParsedProperty = {
    name,
    type: toStringType(resolved['type']),
    required: requiredFields.includes(name),
  };

  if (typeof resolved['description'] === 'string') {
    prop.description = resolved['description'];
  }
  if (typeof resolved['format'] === 'string') {
    prop.format = resolved['format'];
  }
  if (Array.isArray(resolved['enum'])) {
    prop.enum = toStringArray(resolved['enum']);
  }
  if (resolved['type'] === 'array' && resolved['items'] !== undefined) {
    const itemsResolved = resolveIfRef(spec, resolved['items']);
    prop.items = parseSchemaProperty(spec, 'items', itemsResolved, []);
  }

  return prop;
}

function parseSchemaProperties(spec: SpecRecord, schema: SpecRecord): ParsedProperty[] {
  const resolved = resolveIfRef(spec, schema);
  const properties = resolved['properties'];
  if (properties === null || properties === undefined || typeof properties !== 'object') {
    return [];
  }

  const requiredFields = toStringArray(resolved['required']);
  const props = properties as SpecRecord;
  const result: ParsedProperty[] = [];

  for (const [name, propSchema] of Object.entries(props)) {
    result.push(parseSchemaProperty(spec, name, propSchema as SpecRecord, requiredFields));
  }

  return result;
}

function extractBodyParam(spec: SpecRecord, params: unknown[]): ParsedRequestBody | undefined {
  const bodyParams = params.filter((p) => {
    const resolved = resolveIfRef(spec, p);
    return resolved['in'] === 'body';
  });

  if (bodyParams.length === 0) return undefined;

  const bodyParam = resolveIfRef(spec, bodyParams[0]);
  const schema = resolveIfRef(spec, bodyParam['schema']);
  const properties = parseSchemaProperties(spec, schema);

  return {
    required: bodyParam['required'] === true,
    contentType: 'application/json',
    properties,
  };
}

function parseNonBodyParameters(spec: SpecRecord, params: unknown[]): ParsedParameter[] {
  const result: ParsedParameter[] = [];

  for (const rawParam of params) {
    const param = resolveIfRef(spec, rawParam);
    const inValue = param['in'];

    // Skip body and formData parameters
    if (inValue !== 'path' && inValue !== 'query' && inValue !== 'header') {
      continue;
    }

    const parsed: ParsedParameter = {
      name: typeof param['name'] === 'string' ? param['name'] : '',
      in: inValue,
      required: param['required'] === true,
      type: toStringType(param['type']),
    };

    if (typeof param['description'] === 'string') {
      parsed.description = param['description'];
    }
    if (typeof param['format'] === 'string') {
      parsed.format = param['format'];
    }
    if (Array.isArray(param['enum'])) {
      parsed.enum = toStringArray(param['enum']);
    }

    result.push(parsed);
  }

  return result;
}

function parseResponses(spec: SpecRecord, responses: unknown): Record<string, ParsedResponse> {
  if (responses === null || responses === undefined || typeof responses !== 'object') {
    return {};
  }

  const result: Record<string, ParsedResponse> = {};
  const responsesObj = responses as SpecRecord;

  for (const [statusCode, responseValue] of Object.entries(responsesObj)) {
    const response = resolveIfRef(spec, responseValue);
    const parsed: ParsedResponse = {
      statusCode,
    };

    if (typeof response['description'] === 'string') {
      parsed.description = response['description'];
    }

    // Swagger 2.0 uses "produces" at the operation or spec level, not per-response "content"
    const schema = response['schema'];
    if (schema !== null && schema !== undefined && typeof schema === 'object') {
      parsed.contentType = 'application/json';
    }

    result[statusCode] = parsed;
  }

  return result;
}

function parseEndpoints(spec: SpecRecord): ParsedEndpoint[] {
  const paths = spec['paths'];
  if (paths === null || paths === undefined || typeof paths !== 'object') {
    return [];
  }

  const endpoints: ParsedEndpoint[] = [];
  const pathsObj = paths as SpecRecord;

  for (const [path, pathItem] of Object.entries(pathsObj)) {
    const resolved = resolveIfRef(spec, pathItem);
    const pathLevelParams = Array.isArray(resolved['parameters']) ? resolved['parameters'] as unknown[] : [];

    for (const method of HTTP_METHODS) {
      const operation = resolved[method];
      if (operation === null || operation === undefined || typeof operation !== 'object') {
        continue;
      }

      const op = operation as SpecRecord;
      const opParams = Array.isArray(op['parameters']) ? op['parameters'] as unknown[] : [];

      // Merge path-level and operation-level parameters
      const allRawParams = [...pathLevelParams];
      for (const opParam of opParams) {
        const resolvedOpParam = resolveIfRef(spec, opParam);
        const existingIdx = allRawParams.findIndex((p) => {
          const resolvedExisting = resolveIfRef(spec, p);
          return resolvedExisting['name'] === resolvedOpParam['name'] && resolvedExisting['in'] === resolvedOpParam['in'];
        });
        if (existingIdx >= 0) {
          allRawParams[existingIdx] = opParam;
        } else {
          allRawParams.push(opParam);
        }
      }

      const parameters = parseNonBodyParameters(spec, allRawParams);

      const endpoint: ParsedEndpoint = {
        method: method.toUpperCase() as ParsedEndpoint['method'],
        path,
        tags: toStringArray(op['tags']),
        parameters,
        responses: parseResponses(spec, op['responses']),
      };

      if (typeof op['operationId'] === 'string') {
        endpoint.operationId = op['operationId'];
      }
      if (typeof op['summary'] === 'string') {
        endpoint.summary = op['summary'];
      }
      if (typeof op['description'] === 'string') {
        endpoint.description = op['description'];
      }

      const reqBody = extractBodyParam(spec, allRawParams);
      if (reqBody) {
        endpoint.requestBody = reqBody;
      }

      endpoints.push(endpoint);
    }
  }

  return endpoints;
}

function parseAuthSchemes(spec: SpecRecord): ParsedAuthScheme[] {
  const securityDefinitions = spec['securityDefinitions'];
  if (securityDefinitions === null || securityDefinitions === undefined || typeof securityDefinitions !== 'object') {
    return [];
  }

  const schemes: ParsedAuthScheme[] = [];
  const defsObj = securityDefinitions as SpecRecord;

  for (const defValue of Object.values(defsObj)) {
    const def = resolveIfRef(spec, defValue);
    const defType = def['type'];

    if (defType === 'apiKey') {
      const auth: ParsedAuthScheme = {
        type: 'api-key',
      };
      if (typeof def['name'] === 'string') {
        auth.headerName = def['name'];
      }
      const inValue = def['in'];
      if (inValue === 'header' || inValue === 'query') {
        auth.in = inValue;
      }
      schemes.push(auth);
    } else if (defType === 'oauth2') {
      const auth: ParsedAuthScheme = {
        type: 'oauth2',
        flows: {},
      };
      if (typeof def['authorizationUrl'] === 'string') {
        auth.flows!.authorizationUrl = def['authorizationUrl'];
      }
      if (typeof def['tokenUrl'] === 'string') {
        auth.flows!.tokenUrl = def['tokenUrl'];
      }
      if (def['scopes'] !== null && def['scopes'] !== undefined && typeof def['scopes'] === 'object') {
        auth.flows!.scopes = def['scopes'] as Record<string, string>;
      }
      schemes.push(auth);
    } else if (defType === 'basic') {
      // Swagger 2.0 "basic" maps to bearer in our model
      schemes.push({ type: 'bearer' });
    }
  }

  return schemes;
}

function buildBaseUrl(spec: SpecRecord): string {
  const host = typeof spec['host'] === 'string' ? spec['host'] : '';
  const basePath = typeof spec['basePath'] === 'string' ? spec['basePath'] : '';
  const schemes = spec['schemes'];

  let scheme = 'https';
  if (Array.isArray(schemes) && schemes.length > 0 && typeof schemes[0] === 'string') {
    scheme = schemes[0];
  }

  if (!host) return basePath;

  return `${scheme}://${host}${basePath}`;
}

export function parseSwagger(spec: Record<string, unknown>): ParsedSpec {
  const info = spec['info'];
  if (info === null || info === undefined || typeof info !== 'object') {
    throw new Error('Invalid Swagger 2.0 spec: missing "info" object.');
  }

  const infoObj = info as SpecRecord;

  const title = typeof infoObj['title'] === 'string' ? infoObj['title'] : 'Untitled API';
  const version = typeof infoObj['version'] === 'string' ? infoObj['version'] : '0.0.0';

  const parsed: ParsedSpec = {
    title,
    version,
    baseUrl: buildBaseUrl(spec),
    endpoints: parseEndpoints(spec),
    auth: parseAuthSchemes(spec),
  };

  if (typeof infoObj['description'] === 'string') {
    parsed.description = infoObj['description'];
  }

  return parsed;
}
