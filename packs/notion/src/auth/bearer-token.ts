import { BotTokenAuth } from '@linkraft/core';

const NOTION_TOKEN_PREFIX_RE = /^(secret_|ntn_)/;

export class NotionBearerAuth extends BotTokenAuth {
  constructor(botToken?: string, tokenStorePath?: string) {
    const token = botToken ?? process.env['NOTION_API_KEY'];
    super('notion', token, tokenStorePath);
  }

  validateToken(): { valid: boolean; error?: string } {
    const token = this.getBotToken();
    if (!token) {
      return { valid: false, error: 'No API key configured. Set NOTION_API_KEY or add it to mcpkit.config.json' };
    }
    if (!NOTION_TOKEN_PREFIX_RE.test(token)) {
      return { valid: false, error: 'Invalid token format. Notion tokens start with "secret_" or "ntn_". Get yours from https://www.notion.so/my-integrations' };
    }
    return { valid: true };
  }

  async getAuthHeader(): Promise<string> {
    const token = this.getBotToken();
    return `Bearer ${token}`;
  }

  getNotionVersion(): string {
    return '2022-06-28';
  }
}
