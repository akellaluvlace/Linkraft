#!/usr/bin/env node

/**
 * Validates a pack directory has all required files.
 * Usage: node scripts/validate-pack.js packs/{name}
 */

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_FILES = [
  '.claude-plugin/plugin.json',
  '.mcp.json',
  'src/server.ts',
  'config.example.json',
  'package.json',
  'tsconfig.json',
  'README.md',
  'SETUP.md',
];

const REQUIRED_PATTERNS = [
  { pattern: 'skills/*/SKILL.md', description: 'SKILL.md in skills directory' },
  { pattern: 'tests/*.test.ts', description: 'at least one test file' },
];

function findByGlob(dir, pattern) {
  const parts = pattern.split('/');
  let current = [dir];

  for (const part of parts) {
    const next = [];
    for (const d of current) {
      if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) continue;
      const entries = fs.readdirSync(d);
      for (const entry of entries) {
        if (part === '*' || entry === part) {
          next.push(path.join(d, entry));
        }
      }
    }
    current = next;
  }

  return current.filter((p) => fs.existsSync(p));
}

function validatePack(packDir) {
  const absDir = path.resolve(packDir);
  const packName = path.basename(absDir);

  if (!fs.existsSync(absDir)) {
    console.error(`ERROR: Pack directory does not exist: ${absDir}`);
    process.exit(1);
  }

  console.log(`Validating pack: ${packName}`);
  console.log(`Directory: ${absDir}\n`);

  const errors = [];
  const warnings = [];

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(absDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  OK   ${file}`);
    } else {
      errors.push(`Missing required file: ${file}`);
      console.log(`  FAIL ${file}`);
    }
  }

  // Check required patterns
  for (const { pattern, description } of REQUIRED_PATTERNS) {
    const matches = findByGlob(absDir, pattern);
    if (matches.length > 0) {
      console.log(`  OK   ${pattern} (${matches.length} found)`);
    } else {
      errors.push(`Missing: ${description} (${pattern})`);
      console.log(`  FAIL ${pattern}`);
    }
  }

  // Validate plugin.json structure
  const pluginJsonPath = path.join(absDir, '.claude-plugin/plugin.json');
  if (fs.existsSync(pluginJsonPath)) {
    try {
      const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
      if (!plugin.name) errors.push('plugin.json missing "name" field');
      if (!plugin.version) errors.push('plugin.json missing "version" field');
      if (!plugin.description) warnings.push('plugin.json missing "description" field');
    } catch (e) {
      errors.push(`plugin.json is not valid JSON: ${e.message}`);
    }
  }

  // Validate .mcp.json structure
  const mcpJsonPath = path.join(absDir, '.mcp.json');
  if (fs.existsSync(mcpJsonPath)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
      if (!mcp.mcpServers || Object.keys(mcp.mcpServers).length === 0) {
        errors.push('.mcp.json must define at least one server in "mcpServers"');
      }
    } catch (e) {
      errors.push(`.mcp.json is not valid JSON: ${e.message}`);
    }
  }

  // Validate package.json
  const packageJsonPath = path.join(absDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (!pkg.name) errors.push('package.json missing "name" field');
      if (!pkg.version) errors.push('package.json missing "version" field');
    } catch (e) {
      errors.push(`package.json is not valid JSON: ${e.message}`);
    }
  }

  // Print results
  console.log('');
  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  WARN  ${w}`);
    console.log('');
  }

  if (errors.length > 0) {
    console.log('Errors:');
    for (const e of errors) console.log(`  ERROR ${e}`);
    console.log(`\nValidation FAILED: ${errors.length} error(s)`);
    process.exit(1);
  } else {
    console.log(`Validation PASSED for pack: ${packName}`);
  }
}

const packDir = process.argv[2];
if (!packDir) {
  console.error('Usage: node scripts/validate-pack.js <pack-directory>');
  console.error('Example: node scripts/validate-pack.js packs/telegram');
  process.exit(1);
}

validatePack(packDir);
