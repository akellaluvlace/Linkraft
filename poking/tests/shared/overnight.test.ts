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
  it('writes dreamroll script to project root', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    expect(fs.existsSync(script.path)).toBe(true);
    expect(path.dirname(script.path)).toBe(tmpDir);
    expect(script.path).toMatch(/dreamroll-loop\.(ps1|sh)$/);
  });

  it('writes sheep script to project root', () => {
    const script = writeOvernightScript(tmpDir, 'sheep');
    expect(fs.existsSync(script.path)).toBe(true);
    expect(path.dirname(script.path)).toBe(tmpDir);
    expect(script.path).toMatch(/sheep-loop\.(ps1|sh)$/);
  });

  it('returns a runCommand the user can paste directly', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    expect(script.runCommand).toBeTruthy();
    if (script.platform === 'windows') {
      expect(script.runCommand).toContain('powershell');
      expect(script.runCommand).toContain('ExecutionPolicy Bypass');
      expect(script.runCommand).toContain(script.path);
    } else {
      expect(script.runCommand).toBe(script.path);
    }
  });

  it('script self-locates to its own directory', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    if (script.platform === 'windows') {
      expect(script.content).toContain('Set-Location -Path $PSScriptRoot');
    } else {
      expect(script.content).toContain('cd "$(dirname');
    }
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

  it('works even when state directory does not exist yet', () => {
    // Script lives at project root so state dir is not required
    expect(fs.existsSync(path.join(tmpDir, '.dreamroll'))).toBe(false);
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    expect(fs.existsSync(script.path)).toBe(true);
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
    expect(instructions.toLowerCase()).toContain('new terminal');
  });

  it('mentions resumption from state.json', () => {
    const script = writeOvernightScript(tmpDir, 'sheep');
    const instructions = overnightInstructions(script, 'sheep');
    expect(instructions).toContain('state.json');
  });

  it('reminds user to keep machine awake', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    const instructions = overnightInstructions(script, 'dreamroll');
    expect(instructions.toLowerCase()).toContain('plugged');
  });

  it('instructions include the paste-ready runCommand', () => {
    const script = writeOvernightScript(tmpDir, 'dreamroll');
    const instructions = overnightInstructions(script, 'dreamroll');
    expect(instructions).toContain(script.runCommand);
  });
});
