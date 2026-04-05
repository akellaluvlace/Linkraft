export interface ParsedEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: Record<string, ParsedResponse>;
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  description?: string;
  type: string;
  format?: string;
  enum?: string[];
}

export interface ParsedRequestBody {
  required: boolean;
  contentType: string;
  properties: ParsedProperty[];
}

export interface ParsedProperty {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  format?: string;
  enum?: string[];
  items?: ParsedProperty;
}

export interface ParsedResponse {
  statusCode: string;
  description?: string;
  contentType?: string;
}

export interface ParsedAuthScheme {
  type: 'oauth2' | 'api-key' | 'bearer' | 'bot-token';
  flows?: {
    authorizationUrl?: string;
    tokenUrl?: string;
    scopes?: Record<string, string>;
  };
  headerName?: string;
  in?: 'header' | 'query';
}

export interface ParsedSpec {
  title: string;
  description?: string;
  version: string;
  baseUrl: string;
  endpoints: ParsedEndpoint[];
  auth: ParsedAuthScheme[];
}

export interface ManualConfig {
  name: string;
  description?: string;
  version?: string;
  baseUrl: string;
  auth: {
    type: 'oauth2' | 'api-key' | 'bearer' | 'bot-token';
    headerName?: string;
    scopes?: string[];
    authorizationUrl?: string;
    tokenUrl?: string;
  };
  endpoints: ManualEndpoint[];
}

export interface ManualEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters?: ManualParameter[];
}

export interface ManualParameter {
  name: string;
  in: 'path' | 'query' | 'body';
  type: string;
  required?: boolean;
  description?: string;
}

export interface GeneratorOptions {
  name: string;
  output: string;
  description?: string;
  auth?: 'oauth2' | 'api-key' | 'bearer';
  transport?: 'stdio' | 'http';
  port?: number;
  selectedEndpoints?: string[];
}
