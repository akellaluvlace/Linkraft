import { loadSpec, detectSpecFormat } from '../parsers/loader.js';
import { parseOpenApi } from '../parsers/openapi.js';
import { parseSwagger } from '../parsers/swagger.js';
import { generatePack } from '../codegen/generator.js';
import type { GeneratorOptions, ParsedSpec } from '../types.js';

interface GenerateCliOptions {
  name?: string;
  output?: string;
  description?: string;
  auth?: 'oauth2' | 'api-key' | 'bearer';
  transport?: 'stdio' | 'http';
  port?: string;
}

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

export async function generateCommand(
  spec: string,
  options: GenerateCliOptions,
): Promise<void> {
  try {
    stderr(`Loading spec from: ${spec}`);
    const rawSpec = await loadSpec(spec);

    const format = detectSpecFormat(rawSpec);
    stderr(`Detected format: ${format}`);

    let parsedSpec: ParsedSpec;

    if (format === 'openapi3') {
      parsedSpec = parseOpenApi(rawSpec);
    } else if (format === 'swagger2') {
      parsedSpec = parseSwagger(rawSpec);
    } else {
      stderr('Error: unsupported spec format. Use OpenAPI 3.x or Swagger 2.0.');
      process.exit(1);
    }

    const name = options.name ?? parsedSpec.title.toLowerCase().replace(/\s+/g, '-');
    const port = options.port ? parseInt(options.port, 10) : 3100;

    const generatorOptions: GeneratorOptions = {
      name,
      output: options.output ?? '.',
      description: options.description ?? parsedSpec.description,
      auth: options.auth,
      transport: options.transport as 'stdio' | 'http' | undefined,
      port,
    };

    stderr(`Generating pack: ${generatorOptions.name}`);
    await generatePack(parsedSpec, generatorOptions);

    stderr('');
    stderr(`Pack "${generatorOptions.name}" generated successfully.`);
    stderr(`  Endpoints: ${parsedSpec.endpoints.length}`);
    stderr(`  Auth schemes: ${parsedSpec.auth.length}`);
    stderr(`  Output: ${generatorOptions.output}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`Error: ${message}`);
    process.exit(1);
  }
}
