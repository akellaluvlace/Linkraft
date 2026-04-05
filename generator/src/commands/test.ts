import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateCommand } from './validate.js';

interface PackageJson {
  scripts?: Record<string, string>;
}

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

function readPackageJson(packDir: string): PackageJson | undefined {
  const pkgPath = join(packDir, 'package.json');
  if (!existsSync(pkgPath)) {
    return undefined;
  }

  try {
    const raw = readFileSync(pkgPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed as PackageJson;
  } catch {
    return undefined;
  }
}

function runScript(packDir: string, scriptName: string, label: string): boolean {
  stderr(`  Running: ${label}`);
  try {
    execSync(`npm run ${scriptName}`, {
      cwd: packDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    stderr(`  [PASS] ${label}`);
    return true;
  } catch (error: unknown) {
    const exitError = error as { stderr?: Buffer };
    const errorOutput = exitError.stderr
      ? exitError.stderr.toString().trim()
      : 'unknown error';
    stderr(`  [FAIL] ${label}`);
    stderr(`         ${errorOutput}`);
    return false;
  }
}

export async function testCommand(packDir: string): Promise<void> {
  stderr(`Testing pack: ${packDir}`);
  stderr('');

  // Step 1: Run validation first
  stderr('--- Validation ---');
  try {
    await validateCommand(packDir);
  } catch {
    // validateCommand calls process.exit(1) on failure,
    // but if it throws instead, we catch and exit here
    stderr('Validation failed. Aborting tests.');
    process.exit(1);
  }

  stderr('');
  stderr('--- Build & Test ---');

  const pkg = readPackageJson(packDir);
  if (!pkg) {
    stderr('  [FAIL] Could not read package.json');
    process.exit(1);
  }

  let allPassed = true;

  // Step 2: Check and run build script
  if (pkg.scripts?.['build']) {
    const buildPassed = runScript(packDir, 'build', 'npm run build');
    if (!buildPassed) {
      allPassed = false;
    }
  } else {
    stderr('  [SKIP] No "build" script in package.json');
  }

  // Step 3: Check and run test script
  if (pkg.scripts?.['test']) {
    const testPassed = runScript(packDir, 'test', 'npm test');
    if (!testPassed) {
      allPassed = false;
    }
  } else {
    stderr('  [SKIP] No "test" script in package.json');
  }

  stderr('');

  if (allPassed) {
    stderr('All checks passed.');
  } else {
    stderr('One or more checks failed.');
    process.exit(1);
  }
}
