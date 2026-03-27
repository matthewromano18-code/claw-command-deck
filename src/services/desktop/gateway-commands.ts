// ─── Desktop Gateway Commands ──────────────────────────────
// Stubs that map to CLI commands. In Tauri, these call shell.execute().
import { platform } from '../platform';
import type { ShellResult } from '../platform/types';

export interface GatewayProcessStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  pid?: number;
  error?: string;
}

export async function getGatewayStatus(): Promise<GatewayProcessStatus> {
  if (!platform.shell.isAvailable()) {
    return { installed: false, running: false, error: 'Shell not available (browser mode)' };
  }

  try {
    const result = await platform.shell.execute('openclaw', ['gateway', 'status']);
    if (result.code === 0) {
      return { installed: true, running: true, version: result.stdout.trim() };
    }
    return { installed: true, running: false, error: result.stderr };
  } catch {
    return { installed: false, running: false };
  }
}

export async function installGateway(): Promise<ShellResult> {
  return platform.shell.execute('openclaw', ['gateway', 'install']);
}

export async function startGateway(): Promise<ShellResult> {
  return platform.shell.execute('openclaw', ['gateway', 'start']);
}

export async function stopGateway(): Promise<ShellResult> {
  return platform.shell.execute('openclaw', ['gateway', 'stop']);
}

export async function restartGateway(): Promise<ShellResult> {
  return platform.shell.execute('openclaw', ['gateway', 'restart']);
}

export async function getOpenClawStatus(): Promise<ShellResult> {
  return platform.shell.execute('openclaw', ['status']);
}

export async function runConfigure(): Promise<ShellResult> {
  return platform.shell.execute('openclaw', ['configure']);
}

export async function checkCLIInstalled(): Promise<boolean> {
  if (!platform.shell.isAvailable()) return false;
  try {
    const result = await platform.shell.execute('openclaw', ['--version']);
    return result.code === 0;
  } catch {
    return false;
  }
}
