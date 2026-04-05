#!/usr/bin/env node

/**
 * Health check for a pack's MCP server.
 * Starts the server via stdio, sends a tools/list request, verifies response, shuts down.
 * Usage: node scripts/health-check.js packs/{name}
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TIMEOUT_MS = 15_000;

function createJsonRpcRequest(id, method, params = {}) {
  const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
}

function parseJsonRpcResponse(data) {
  const bodyStart = data.indexOf('\r\n\r\n');
  if (bodyStart === -1) return null;
  const body = data.slice(bodyStart + 4);
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function healthCheck(packDir) {
  const absDir = path.resolve(packDir);
  const packName = path.basename(absDir);

  if (!fs.existsSync(absDir)) {
    console.error(`ERROR: Pack directory does not exist: ${absDir}`);
    process.exit(1);
  }

  // Find the server entry point
  const mcpJsonPath = path.join(absDir, '.mcp.json');
  if (!fs.existsSync(mcpJsonPath)) {
    console.error(`ERROR: No .mcp.json found in ${absDir}`);
    process.exit(1);
  }

  const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
  const servers = mcpConfig.mcpServers || {};
  const serverNames = Object.keys(servers);

  if (serverNames.length === 0) {
    console.error('ERROR: No servers defined in .mcp.json');
    process.exit(1);
  }

  const serverConfig = servers[serverNames[0]];
  const command = serverConfig.command;
  const args = serverConfig.args || [];

  console.log(`Health check: ${packName}`);
  console.log(`Server: ${serverNames[0]}`);
  console.log(`Command: ${command} ${args.join(' ')}\n`);

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: absDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';
    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        console.error('ERROR: Server did not respond within timeout');
        child.kill();
        process.exit(1);
      }
    }, TIMEOUT_MS);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      const response = parseJsonRpcResponse(stdout);

      if (response && !responded) {
        responded = true;
        clearTimeout(timeout);

        if (response.error) {
          console.error(`ERROR: Server returned error: ${JSON.stringify(response.error)}`);
          child.kill();
          process.exit(1);
        }

        const tools = response.result?.tools || [];
        console.log(`Response received:`);
        console.log(`  Tools found: ${tools.length}`);

        if (tools.length > 0) {
          console.log(`  Tool list:`);
          for (const tool of tools) {
            console.log(`    - ${tool.name}: ${tool.description || '(no description)'}`);
          }
        }

        console.log(`\nHealth check PASSED for pack: ${packName}`);
        child.kill();
        resolve();
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`ERROR: Failed to start server: ${err.message}`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (!responded) {
        clearTimeout(timeout);
        if (stderr) console.error(`Server stderr: ${stderr}`);
        console.error(`ERROR: Server exited with code ${code} before responding`);
        process.exit(1);
      }
    });

    // Send initialize request first
    child.stdin.write(createJsonRpcRequest(1, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'linkraft-health-check', version: '1.0.0' },
    }));

    // After a short delay, send tools/list
    setTimeout(() => {
      if (!responded) {
        // Reset stdout buffer for next response
        stdout = '';
        child.stdin.write(createJsonRpcRequest(2, 'tools/list', {}));
      }
    }, 1000);
  });
}

const packDir = process.argv[2];
if (!packDir) {
  console.error('Usage: node scripts/health-check.js <pack-directory>');
  console.error('Example: node scripts/health-check.js packs/telegram');
  process.exit(1);
}

healthCheck(packDir).catch((err) => {
  console.error(`Health check failed: ${err.message}`);
  process.exit(1);
});
