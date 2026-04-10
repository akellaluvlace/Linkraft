import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { writeOvernightScript, overnightInstructions } from '../../src/shared/overnight.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'overnight-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('writeOvernightScript', () => {
  it('writes dreamroll script to .dreamroll directory', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    expect(fs.existsSync(script.path)).toBe(true);
    expect(script.path).toContain('.dreamroll');
    expect(script.path).toMatch(/dreamroll-loop\.(ps1|sh)$/);
  });

  it('writes sheep script to .sheep directory', () => {
    const script = writeOvernightScript(tmpDir, 'sheep');
    expect(fs.existsSync(script.path)).toBe(true);
    expect(script.path).toContain('.sheep');
    expect(script.path).toMatch(/sheep-loop\.(ps1|sh)$/);
  });

  it('script content invokes claude with the correct mode command', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    expect(script.content).toContain('claude -p "/linkraft dreamroll"');
    expect(script.content).toContain('--allowedTools');
    expect(script.content).toContain("'Bash(*)'");
  });

  it('sheep script has the sheep command', () => {
    const script = writeOvernightScript(tmpDir, 'sheep');
    expect(script.content).toContain('claude -p "/linkraft sheep"');
  });

  it('creates the state directory if missing', () => {
    expect(fs.existsSync(path.join(tmpDir, '.dreamroll'))).toBe(false);
    writeOvernightScript(tmpDir, 'dreamroll');
    expect(fs.existsSync(path.join(tmpDir, '.dreamroll'))).toBe(true);
  });

  it('windows script uses while ($true) and Start-Sleep', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    if (script.platform === 'windows') {
      expect(script.content).toContain('while ($true)');
      expect(script.content).toContain('Start-Sleep -Seconds 10');
    }
  });

  it('unix script uses while true, sleep, and bash shebang', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    if (script.platform === 'unix') {
      expect(script.content).toMatch(/^#!\/usr\/bin\/env bash/);
      expect(script.content).toContain('while true; do');
      expect(script.content).toContain('sleep 10');
      expect(script.content).toContain('done');
    }
  });

  it('unix script is executable', () => {
    const script = writeOvernightScript(tmpDir, 'sheep');
    if (script.platform === 'unix') {
      const stat = fs.statSync(script.path);
      // Check owner execute bit
      expect(stat.mode & 0o100).toBeGreaterThan(0);
    }
  });

  it('includes a stop-with-ctrl-c comment', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    expect(script.content).toContain('Ctrl+C');
  });

  it('overwrites an existing script without error', () => {
    writeOvernightScript(tmpDir, 'dreamroll');
    const second = writeOvernightScript(tmpDir, 'dreamroll');
    expect(fs.existsSync(second.path)).toBe(true);
  });
});

describe('overnightInstructions', () => {
  it('includes the script path and mode name', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    const instructions = overnightInstructions(script, 'dreamroll');
    expect(instructions).toContain(script.path);
    expect(instructions).toContain('DREAMROLL');
  });

  it('tells the user to open a new terminal', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    const instructions = overnightInstructions(script, 'dreamroll');
    expect(instructions.toLowerCase()).toContain('new');
    expect(instructions.toLowerCase()).toContain('separate');
  });

  it('mentions resumption from state.json', () => {
    const script = writeOvernightScript(tmpDir, 'sheep');
    const instructions = overnightInstructions(script, 'sheep');
    expect(instructions).toContain('state.json');
  });

  it('reminds user to keep laptop awake', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    const instructions = overnightInstructions(script, 'dreamroll');
    expect(instructions.toLowerCase()).toContain('plugged');
  });

  it('windows instructions include ExecutionPolicy bypass', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    if (script.platform === 'windows') {
      const instructions = overnightInstructions(script, 'dreamroll');
      expect(instructions).toContain('ExecutionPolicy Bypass');
    }
  });
});
