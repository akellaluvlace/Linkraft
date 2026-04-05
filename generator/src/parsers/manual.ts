import type {
  ParsedSpec,
  ParsedEndpoint,
  ParsedParameter,
  ParsedRequestBody,
  ParsedProperty,
  ParsedAuthScheme,
  ManualConfig,
  ManualEndpoint,
  ManualParameter,
} from '../types.js';

function convertParameter(param: ManualParameter): ParsedParameter {
  return {
    name: param.name,
    in: param.in === 'body' ? 'query' : param.in, // body params handled separately
    required: param.required === true,
    type: param.type,
    description: param.description,
  };
}

function extractBodyParams(params: ManualParameter[]): ParsedRequestBody | undefined {
  const bodyParams = params.filter((p) => p.in === 'body');
  if (bodyParams.length === 0) return undefined;

  const properties: ParsedProperty[] = bodyParams.map((p) => ({
    name: p.name,
    type: p.type,
    required: p.required === true,
    description: p.description,
  }));

  return {
    required: bodyParams.some((p) => p.required === true),
    contentType: 'application/json',
    properties,
  };
}

function convertEndpoint(endpoint: ManualEndpoint): ParsedEndpoint {
  const params = endpoint.parameters ?? [];
  const nonBodyParams = params.filter((p) => p.in !== 'body');

  const parsed: ParsedEndpoint = {
    method: endpoint.method,
    path: endpoint.path,
    operationId: endpoint.name,
    description: endpoint.description,
    tags: [],
    parameters: nonBodyParams.map(convertParameter),
    responses: {},
  };

  const requestBody = extractBodyParams(params);
  if (requestBody) {
    parsed.requestBody = requestBody;
  }

  return parsed;
}

function convertAuth(auth: ManualConfig['auth']): ParsedAuthScheme {
  const scheme: ParsedAuthScheme = {
    type: auth.type,
  };

  if (auth.headerName) {
    scheme.headerName = auth.headerName;
  }

  if (auth.type === 'oauth2') {
    const scopes: Record<string, string> = {};
    if (auth.scopes) {
      for (const scope of auth.scopes) {
        scopes[scope] = '';
      }
    }

    scheme.flows = {
      authorizationUrl: auth.authorizationUrl,
      tokenUrl: auth.tokenUrl,
      scopes,
    };
  }

  return scheme;
}

export function parseManualConfig(config: ManualConfig): ParsedSpec {
  if (!config.name) {
    throw new Error('Invalid manual config: "name" is required.');
  }
  if (!config.baseUrl) {
    throw new Error('Invalid manual config: "baseUrl" is required.');
  }
  if (!config.auth) {
    throw new Error('Invalid manual config: "auth" is required.');
  }
  if (!Array.isArray(config.endpoints)) {
    throw new Error('Invalid manual config: "endpoints" must be an array.');
  }

  const parsed: ParsedSpec = {
    title: config.name,
    version: config.version ?? '1.0.0',
    baseUrl: config.baseUrl,
    endpoints: config.endpoints.map(convertEndpoint),
    auth: [convertAuth(config.auth)],
  };

  if (config.description) {
    parsed.description = config.description;
  }

  return parsed;
}
