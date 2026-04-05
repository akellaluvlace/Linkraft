import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { validateCommand } from './commands/validate.js';
import { testCommand } from './commands/test.js';

const program = new Command();

program
  .name('linkraft')
  .description('Generate MCP servers from API specifications')
  .version('0.1.0');

program
  .command('generate <spec>')
  .description('Generate an MCP server pack from an API specification')
  .option('-n, --name <name>', 'Pack name')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('-d, --description <desc>', 'Pack description')
  .option('-a, --auth <type>', 'Auth type: oauth2, api-key, bearer')
  .option('--transport <type>', 'Transport: stdio or http', 'stdio')
  .option('--port <port>', 'HTTP transport port', '3100')
  .action(generateCommand);

program
  .command('validate <pack-dir>')
  .description('Validate a pack directory structure and configuration')
  .action(validateCommand);

program
  .command('test <pack-dir>')
  .description('Run health checks on a pack')
  .action(testCommand);

program.parse();
