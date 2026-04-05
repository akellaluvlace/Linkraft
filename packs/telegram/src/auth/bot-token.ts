import { BotTokenAuth } from '@linkraft/core';

const BOT_TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]{35,}$/;

export class TelegramBotAuth extends BotTokenAuth {
  constructor(botToken?: string, tokenStorePath?: string) {
    const token = botToken ?? process.env['TELEGRAM_BOT_TOKEN'];
    super('telegram', token, tokenStorePath);
  }

  validateToken(): { valid: boolean; error?: string } {
    const token = this.getBotToken();
    if (!token) {
      return { valid: false, error: 'No bot token configured. Set TELEGRAM_BOT_TOKEN or add it to mcpkit.config.json' };
    }
    if (!BOT_TOKEN_REGEX.test(token)) {
      return { valid: false, error: 'Invalid bot token format. Expected format: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' };
    }
    return { valid: true };
  }

  getApiBaseUrl(): string {
    return 'https://api.telegram.org';
  }

  getPathPrefix(): string {
    const token = this.getBotToken();
    return `/bot${token}`;
  }
}
