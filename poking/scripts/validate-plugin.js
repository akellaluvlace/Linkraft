#!/usr/bin/env node
// Validates the entire plugin structure: skills, agents, commands, plugin.json, .mcp.json

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failed = false;

function check(condition, msg) {
  if (!condition) {
    process.stderr.write(`FAIL: ${msg}\n`);
    failed = true;
  } else {
    process.stderr.write(`PASS: ${msg}\n`);
  }
}

// 1. plugin.json exists and is valid JSON
const pluginPath = path.join(ROOT, '.claude-plugin', 'plugin.json');
check(fs.existsSync(pluginPath), 'plugin.json exists');

let plugin;
try {
  plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
  check(true, 'plugin.json is valid JSON');
} catch (e) {
  check(false, `plugin.json parse error: ${e.message}`);
  process.exit(1);
}

check(plugin.name, 'plugin.json has name');
check(plugin.description, 'plugin.json has description');
check(plugin.author && plugin.author.name, 'plugin.json has author');

// 2. All skills exist
if (Array.isArray(plugin.skills)) {
  for (const skill of plugin.skills) {
    const skillPath = path.join(ROOT, skill.path);
    check(fs.existsSync(skillPath), `skill "${skill.name}" exists at ${skill.path}`);
  }
}

// 3. All agents exist
if (Array.isArray(plugin.agents)) {
  for (const agent of plugin.agents) {
    const agentPath = path.join(ROOT, agent.path);
    check(fs.existsSync(agentPath), `agent "${agent.name}" exists at ${agent.path}`);
  }
}

// 4. All commands exist
if (Array.isArray(plugin.commands)) {
  for (const cmd of plugin.commands) {
    const cmdPath = path.join(ROOT, cmd.path);
    check(fs.existsSync(cmdPath), `command "${cmd.name}" exists at ${cmd.path}`);
  }
}

// 5. .mcp.json exists
const mcpPath = path.join(ROOT, '.mcp.json');
check(fs.existsSync(mcpPath), '.mcp.json exists');

if (fs.existsSync(mcpPath)) {
  try {
    JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
    check(true, '.mcp.json is valid JSON');
  } catch (e) {
    check(false, `.mcp.json parse error: ${e.message}`);
  }
}

// 6. Required directories exist
const requiredDirs = ['src', 'skills', 'agents', 'commands', 'presets', 'tests'];
for (const dir of requiredDirs) {
  check(fs.existsSync(path.join(ROOT, dir)), `directory "${dir}" exists`);
}

// Summary
process.stderr.write(`\n${failed ? 'VALIDATION FAILED' : 'ALL CHECKS PASSED'}\n`);
if (failed) process.exit(1);
