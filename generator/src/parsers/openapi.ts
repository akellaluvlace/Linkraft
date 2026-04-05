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

function toStringType(schemaType: unknown): string {
  if (typeof schemaType === 'string') {
    return schemaType;
  }
  if (Array.isArray(schemaType) && schemaType.length > 0) {
    // OpenAPI 3.1 allows type as array, e.g. ["string", "null"]
    const nonNull = schemaType.filter((t) => t !== 'null');
    return typeof nonNull[0] === 'string' ? nonNull[0] : 'string';
  }
  return 'string';
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
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

function parseParameters(spec: SpecRecord, params: unknown): ParsedParameter[] {
  if (!Array.isArray(params)) return [];

  const result: ParsedParameter[] = [];
  for (const rawParam of params) {
    const param = resolveIfRef(spec, rawParam);
    const inValue = param['in'];
    if (inValue !== 'path' && inValue !== 'query' && inValue !== 'header') {
      continue;
    }

    const schema = resolveIfRef(spec, param['schema']);

    const parsed: ParsedParameter = {
      name: typeof param['name'] === 'string' ? param['name'] : '',
      in: inValue,
      required: param['required'] === true,
      type: toStringType(schema['type']),
    };

    if (typeof param['description'] === 'string') {
      parsed.description = param['description'];
    }
    if (typeof schema['format'] === 'string') {
      parsed.format = schema['format'];
    }
    if (Array.isArray(schema['enum'])) {
      parsed.enum = toStringArray(schema['enum']);
    }

    result.push(parsed);
  }

  return result;
}

function parseRequestBody(spec: SpecRecord, body: unknown): ParsedRequestBody | undefined {
  if (body === null || body === undefined) return undefined;
  const resolved = resolveIfRef(spec, body);

  const content = resolved['content'];
  if (content === null || content === undefined || typeof content !== 'object') {
    return undefined;
  }

  const contentObj = content as SpecRecord;
  // Prefer application/json, fall back to first available content type
  let contentType = 'application/json';
  let mediaType = contentObj['application/json'] as SpecRecord | undefined;

  if (!mediaType) {
    const keys = Object.keys(contentObj);
    if (keys.length === 0) return undefined;
    contentType = keys[0] ?? 'application/json';
    mediaType = contentObj[contentType] as SpecRecord;
  }

  if (!mediaType || typeof mediaType !== 'object') return undefined;

  const schema = resolveIfRef(spec, mediaType['schema']);
  const properties = parseSchemaProperties(spec, schema);

  return {
    required: resolved['required'] === true,
    contentType,
    properties,
  };
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

    const responseContent = response['content'];
    if (responseContent !== null && responseContent !== undefined && typeof responseContent === 'object') {
      const contentKeys = Object.keys(responseContent as SpecRecord);
      if (contentKeys.length > 0) {
        parsed.contentType = contentKeys[0];
      }
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
    // Collect path-level parameters
    const pathLevelParams = resolved['parameters'];

    for (const method of HTTP_METHODS) {
      const operation = resolved[method];
      if (operation === null || operation === undefined || typeof operation !== 'object') {
        continue;
      }

      const op = operation as SpecRecord;

      // Merge path-level and operation-level parameters (operation takes precedence)
      const pathParams = parseParameters(spec, pathLevelParams);
      const opParams = parseParameters(spec, op['parameters']);

      const mergedParams = [...pathParams];
      for (const opParam of opParams) {
        const existingIdx = mergedParams.findIndex(
          (p) => p.name === opParam.name && p.in === opParam.in,
        );
        if (existingIdx >= 0) {
          mergedParams[existingIdx] = opParam;
        } else {
          mergedParams.push(opParam);
        }
      }

      const endpoint: ParsedEndpoint = {
        method: method.toUpperCase() as ParsedEndpoint['method'],
        path,
        tags: toStringArray(op['tags']),
        parameters: mergedParams,
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

      const reqBody = parseRequestBody(spec, op['requestBody']);
      if (reqBody) {
        endpoint.requestBody = reqBody;
      }

      endpoints.push(endpoint);
    }
  }

  return endpoints;
}

function parseAuthSchemes(spec: SpecRecord): ParsedAuthScheme[] {
  const components = spec['components'];
  if (components === null || components === undefined || typeof components !== 'object') {
    return [];
  }

  const securitySchemes = (components as SpecRecord)['securitySchemes'];
  if (securitySchemes === null || securitySchemes === undefined || typeof securitySchemes !== 'object') {
    return [];
  }

  const schemes: ParsedAuthScheme[] = [];
  const schemesObj = securitySchemes as SpecRecord;

  for (const schemeValue of Object.values(schemesObj)) {
    const scheme = resolveIfRef(spec, schemeValue);
    const schemeType = scheme['type'];

    if (schemeType === 'apiKey') {
      const inValue = scheme['in'];
      const auth: ParsedAuthScheme = {
        type: 'api-key',
      };
      if (typeof scheme['name'] === 'string') {
        auth.headerName = scheme['name'];
      }
      if (inValue === 'header' || inValue === 'query') {
        auth.in = inValue;
      }
      schemes.push(auth);
    } else if (schemeType === 'oauth2') {
      const flows = scheme['flows'];
      const auth: ParsedAuthScheme = {
        type: 'oauth2',
      };

      if (flows !== null && flows !== undefined && typeof flows === 'object') {
        const flowsObj = flows as SpecRecord;
        // Check authorization code flow first, then implicit, then client credentials
        const flowKey = flowsObj['authorizationCode']
          ? 'authorizationCode'
          : flowsObj['implicit']
            ? 'implicit'
            : flowsObj['clientCredentials']
              ? 'clientCredentials'
              : null;

        if (flowKey) {
          const flow = flowsObj[flowKey] as SpecRecord;
          auth.flows = {};
          if (typeof flow['authorizationUrl'] === 'string') {
            auth.flows.authorizationUrl = flow['authorizationUrl'];
          }
          if (typeof flow['tokenUrl'] === 'string') {
            auth.flows.tokenUrl = flow['tokenUrl'];
          }
          if (flow['scopes'] !== null && flow['scopes'] !== undefined && typeof flow['scopes'] === 'object') {
            auth.flows.scopes = flow['scopes'] as Record<string, string>;
          }
        }
      }
      schemes.push(auth);
    } else if (schemeType === 'http') {
      const schemeValue = scheme['scheme'];
      if (schemeValue === 'bearer') {
        schemes.push({ type: 'bearer' });
      }
    }
  }

  return schemes;
}

export function parseOpenApi(spec: Record<string, unknown>): ParsedSpec {
  const info = spec['info'];
  if (info === null || info === undefined || typeof info !== 'object') {
    throw new Error('Invalid OpenAPI spec: missing "info" object.');
  }

  const infoObj = info as SpecRecord;

  const title = typeof infoObj['title'] === 'string' ? infoObj['title'] : 'Untitled API';
  const version = typeof infoObj['version'] === 'string' ? infoObj['version'] : '0.0.0';

  let baseUrl = '';
  const servers = spec['servers'];
  if (Array.isArray(servers) && servers.length > 0) {
    const firstServer = servers[0] as SpecRecord;
    if (typeof firstServer['url'] === 'string') {
      baseUrl = firstServer['url'];
    }
  }

  const parsed: ParsedSpec = {
    title,
    version,
    baseUrl,
    endpoints: parseEndpoints(spec),
    auth: parseAuthSchemes(spec),
  };

  if (typeof infoObj['description'] === 'string') {
    parsed.description = infoObj['description'];
  }

  return parsed;
}
