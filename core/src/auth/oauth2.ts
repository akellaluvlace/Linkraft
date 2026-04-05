import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { URL } from 'node:url';
import { TokenStore } from './token-store.js';
import type { TokenData } from '../types.js';

export interface OAuth2Config {
  clientId: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  callbackPort?: number;
  callbackPath?: string;
  tokenStoreName: string;
  tokenStorePath?: string;
  usePKCE?: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
}

export class OAuth2Client {
  private readonly store: TokenStore;
  private readonly config: OAuth2Config;

  constructor(config: OAuth2Config) {
    this.config = {
      callbackPort: 8585,
      callbackPath: '/callback',
      usePKCE: true,
      ...config,
    };
    this.store = new TokenStore(config.tokenStoreName, config.tokenStorePath);
  }

  async getAuthHeader(): Promise<string | undefined> {
    const token = this.store.load();
    if (!token) return undefined;

    if (this.store.needsRefresh() && token.refreshToken) {
      const refreshed = await this.refreshAccessToken(token.refreshToken);
      return `${refreshed.tokenType} ${refreshed.accessToken}`;
    }

    return `${token.tokenType} ${token.accessToken}`;
  }

  isAuthenticated(): boolean {
    const token = this.store.load();
    return token != null && !this.store.isExpired();
  }

  generateAuthUrl(): { url: string; codeVerifier?: string; state: string } {
    const state = randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.getRedirectUri(),
      scope: this.config.scopes.join(' '),
      state,
    });

    let codeVerifier: string | undefined;

    if (this.config.usePKCE) {
      codeVerifier = randomBytes(32).toString('base64url');
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    return {
      url: `${this.config.authorizeUrl}?${params.toString()}`,
      codeVerifier,
      state,
    };
  }

  async startCallbackServer(
    expectedState: string,
    codeVerifier?: string,
  ): Promise<TokenData> {
    return new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', `http://localhost:${this.config.callbackPort}`);

          if (url.pathname !== this.config.callbackPath) {
            res.writeHead(404).end('Not found');
            return;
          }

          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          if (error) {
            const desc = url.searchParams.get('error_description') ?? error;
            res.writeHead(400).end(`Authorization failed: ${desc}`);
            server.close();
            reject(new Error(`OAuth error: ${desc}`));
            return;
          }

          if (!code || state !== expectedState) {
            res.writeHead(400).end('Invalid callback: missing code or state mismatch');
            server.close();
            reject(new Error('Invalid OAuth callback'));
            return;
          }

          const token = await this.exchangeCode(code, codeVerifier);
          this.store.save(token);

          res.writeHead(200, { 'Content-Type': 'text/html' }).end(
            '<html><body><h1>Authorization successful!</h1>' +
            '<p>You can close this window and return to Claude Code.</p></body></html>',
          );

          server.close();
          resolve(token);
        } catch (err) {
          res.writeHead(500).end('Internal error');
          server.close();
          reject(err);
        }
      });

      server.listen(this.config.callbackPort, () => {
        // Server started, waiting for callback
      });

      server.on('error', reject);

      setTimeout(() => {
        server.close();
        reject(new Error('OAuth callback timeout (5 minutes)'));
      }, 300_000);
    });
  }

  async exchangeCode(code: string, codeVerifier?: string): Promise<TokenData> {
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.getRedirectUri(),
      client_id: this.config.clientId,
    };

    if (this.config.clientSecret) {
      body['client_secret'] = this.config.clientSecret;
    }

    if (codeVerifier) {
      body['code_verifier'] = codeVerifier;
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${text}`);
    }

    const data = await response.json() as TokenResponse;
    return this.toTokenData(data);
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const body: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    };

    if (this.config.clientSecret) {
      body['client_secret'] = this.config.clientSecret;
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token refresh failed (${response.status}): ${text}`);
    }

    const data = await response.json() as TokenResponse;
    const token = this.toTokenData(data);
    // Preserve refresh token if not returned
    if (!token.refreshToken) {
      token.refreshToken = refreshToken;
    }
    this.store.save(token);
    return token;
  }

  getTokenStore(): TokenStore {
    return this.store;
  }

  private getRedirectUri(): string {
    return `http://localhost:${this.config.callbackPort}${this.config.callbackPath}`;
  }

  private toTokenData(response: TokenResponse): TokenData {
    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: response.expires_in
        ? Date.now() + response.expires_in * 1000
        : undefined,
      tokenType: response.token_type ?? 'Bearer',
      scopes: response.scope?.split(' '),
    };
  }
}
