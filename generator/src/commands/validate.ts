import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

interface PluginJson {
  name?: unknown;
  version?: unknown;
  description?: unknown;
}

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

interface CheckResult {
  label: string;
  passed: boolean;
}

function checkFileExists(packDir: string, relativePath: string, label: string): CheckResult {
  const fullPath = join(packDir, relativePath);
  const passed = existsSync(fullPath);
  return { label, passed };
}

function checkPluginJson(packDir: string): CheckResult {
  const label = '.claude-plugin/plugin.json has required fields';
  const filePath = join(packDir, '.claude-plugin', 'plugin.json');

  if (!existsSync(filePath)) {
    return { label, passed: false };
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { label, passed: false };
    }

    const plugin = parsed as PluginJson;
    const hasName = typeof plugin.name === 'string' && plugin.name.length > 0;
    const hasVersion = typeof plugin.version === 'string' && plugin.version.length > 0;
    const hasDescription = typeof plugin.description === 'string' && plugin.description.length > 0;

    return { label, passed: hasName && hasVersion && hasDescription };
  } catch {
    return { label, passed: false };
  }
}

function checkSkillsMd(packDir: string): CheckResult {
  const label = 'skills/ directory has at least one SKILL.md';
  const skillsDir = join(packDir, 'skills');

  if (!existsSync(skillsDir)) {
    return { label, passed: false };
  }

  try {
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillMdPath = join(skillsDir, entry.name, 'SKILL.md');
        if (existsSync(skillMdPath)) {
          return { label, passed: true };
        }
      }
    }
    return { label, passed: false };
  } catch {
    return { label, passed: false };
  }
}

export async function validateCommand(packDir: string): Promise<void> {
  stderr(`Validating pack: ${packDir}`);
  stderr('');

  const results: CheckResult[] = [
    checkFileExists(packDir, join('src', 'server.ts'), 'src/server.ts exists'),
    checkFileExists(packDir, 'package.json', 'package.json exists'),
    checkFileExists(packDir, 'tsconfig.json', 'tsconfig.json exists'),
    checkFileExists(packDir, 'config.example.json', 'config.example.json exists'),
    checkFileExists(packDir, join('.claude-plugin', 'plugin.json'), '.claude-plugin/plugin.json exists'),
    checkPluginJson(packDir),
    checkFileExists(packDir, '.mcp.json', '.mcp.json exists'),
    checkSkillsMd(packDir),
    checkFileExists(packDir, 'README.md', 'README.md exists'),
    checkFileExists(packDir, 'SETUP.md', 'SETUP.md exists'),
  ];

  let allPassed = true;

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    stderr(`  [${status}] ${result.label}`);
    if (!result.passed) {
      allPassed = false;
    }
  }

  stderr('');

  if (allPassed) {
    stderr('Validation passed.');
  } else {
    stderr('Validation failed: one or more checks did not pass.');
    process.exit(1);
  }
}
