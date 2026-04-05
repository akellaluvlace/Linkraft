import { TokenStore } from './token-store.js';

export type ApiKeyLocation = 'header' | 'query';

export interface ApiKeyConfig {
  name: string;
  apiKey?: string;
  headerName?: string;
  headerPrefix?: string;
  location?: ApiKeyLocation;
  queryParamName?: string;
  tokenStorePath?: string;
}

export class ApiKeyAuth {
  private readonly store: TokenStore;
  private readonly config: ApiKeyConfig;

  constructor(config: ApiKeyConfig) {
    this.config = {
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
      location: 'header',
      queryParamName: 'api_key',
      ...config,
    };
    this.store = new TokenStore(config.name, config.tokenStorePath);

    if (config.apiKey) {
      this.store.save({
        accessToken: config.apiKey,
        tokenType: this.config.headerPrefix ?? 'Bearer',
      });
    }
  }

  async getAuthHeader(): Promise<string | undefined> {
    const token = this.store.getAccessToken();
    if (!token) return undefined;

    if (this.config.location === 'header') {
      const prefix = this.config.headerPrefix;
      return prefix ? `${prefix} ${token}` : token;
    }

    return undefined;
  }

  getQueryParam(): { key: string; value: string } | undefined {
    if (this.config.location !== 'query') return undefined;

    const token = this.store.getAccessToken();
    if (!token) return undefined;

    return {
      key: this.config.queryParamName ?? 'api_key',
      value: token,
    };
  }

  isAuthenticated(): boolean {
    return this.store.getAccessToken() != null;
  }

  setApiKey(key: string): void {
    this.store.save({
      accessToken: key,
      tokenType: this.config.headerPrefix ?? 'Bearer',
    });
  }

  getTokenStore(): TokenStore {
    return this.store;
  }
}

export class BotTokenAuth extends ApiKeyAuth {
  constructor(name: string, botToken?: string, tokenStorePath?: string) {
    super({
      name,
      apiKey: botToken,
      headerName: 'Authorization',
      headerPrefix: 'Bearer',
      location: 'header',
      tokenStorePath,
    });
  }

  getBotToken(): string | undefined {
    return this.getTokenStore().getAccessToken();
  }

  setBotToken(token: string): void {
    this.setApiKey(token);
  }
}
