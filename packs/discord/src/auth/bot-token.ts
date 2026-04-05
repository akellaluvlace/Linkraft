import { BotTokenAuth } from '@linkraft/core';

const BOT_TOKEN_REGEX = /^[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}$/;

export class DiscordBotAuth extends BotTokenAuth {
  constructor(botToken?: string, tokenStorePath?: string) {
    const token = botToken ?? process.env['DISCORD_BOT_TOKEN'];
    super('discord', token, tokenStorePath);
  }

  validateToken(): { valid: boolean; error?: string } {
    const token = this.getBotToken();
    if (!token) {
      return { valid: false, error: 'No bot token configured. Set DISCORD_BOT_TOKEN or add it to mcpkit.config.json' };
    }
    if (!BOT_TOKEN_REGEX.test(token)) {
      return { valid: false, error: 'Invalid bot token format. Get your token from https://discord.com/developers/applications' };
    }
    return { valid: true };
  }

  async getAuthHeader(): Promise<string> {
    const token = this.getBotToken();
    return `Bot ${token}`;
  }
}
