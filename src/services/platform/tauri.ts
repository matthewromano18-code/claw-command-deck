// ─── Tauri Platform Implementations ────────────────────────
// These replace browser stubs when running inside Tauri.

import type { IStorage, INotifier, IShell, IFileSystem, ShellResult, NotifyOptions } from './types';

// Uses @tauri-apps/plugin-store for persistent key-value storage
export class TauriStorage implements IStorage {
  private store: any = null;

  private async getStore() {
    if (!this.store) {
      const { Store } = await import('@tauri-apps/plugin-store');
      this.store = await Store.load('mission-control.json');
    }
    return this.store;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const store = await this.getStore();
    return (await store.get(key)) as T | null;
  }

  async set<T = string>(key: string, value: T): Promise<void> {
    const store = await this.getStore();
    await store.set(key, value);
    await store.save();
  }

  async remove(key: string): Promise<void> {
    const store = await this.getStore();
    await store.delete(key);
    await store.save();
  }

  async clear(): Promise<void> {
    const store = await this.getStore();
    await store.clear();
    await store.save();
  }
}

// Uses @tauri-apps/plugin-notification for native macOS notifications
export class TauriNotifier implements INotifier {
  async notify(title: string, body?: string, _options?: NotifyOptions): Promise<void> {
    const { sendNotification } = await import('@tauri-apps/plugin-notification');
    sendNotification({ title, body: body || '' });
  }

  async requestPermission(): Promise<boolean> {
    const { requestPermission, isPermissionGranted } = await import('@tauri-apps/plugin-notification');
    if (await isPermissionGranted()) return true;
    const result = await requestPermission();
    return result === 'granted';
  }
}

// Uses Tauri invoke to call Rust commands for shell execution
export class TauriShell implements IShell {
  async execute(command: string, args?: string[]): Promise<ShellResult> {
    const { invoke } = await import('@tauri-apps/api/core');
    // Route through our Rust commands for allowed operations
    const cmdMap: Record<string, string> = {
      'openclaw gateway status': 'gateway_status',
      'openclaw gateway install': 'gateway_install',
      'openclaw gateway start': 'gateway_start',
      'openclaw gateway stop': 'gateway_stop',
      'openclaw status': 'openclaw_status',
    };
    const fullCmd = [command, ...(args || [])].join(' ');
    const tauriCmd = cmdMap[fullCmd];
    if (tauriCmd) {
      return invoke<ShellResult>(tauriCmd);
    }
    return { code: 1, stdout: '', stderr: `Command not allowed: ${fullCmd}` };
  }

  isAvailable(): boolean {
    return true;
  }
}

// Placeholder — full fs via @tauri-apps/plugin-fs post-export
export class TauriFileSystem implements IFileSystem {
  async readText(path: string): Promise<string> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string>('plugin:fs|read_text_file', { path });
  }

  async writeText(path: string, contents: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('plugin:fs|write_text_file', { path, contents });
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<boolean>('plugin:fs|exists', { path });
    } catch {
      return false;
    }
  }

  async remove(path: string): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('plugin:fs|remove_file', { path });
  }
}
