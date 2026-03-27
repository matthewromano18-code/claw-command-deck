// ─── Tauri Platform Implementations ────────────────────────
// These replace browser stubs when running inside Tauri.
// Tauri APIs are dynamically imported at runtime — the packages
// only exist in the local dev/build environment, not in Lovable.

import type { IStorage, INotifier, IShell, IFileSystem, ShellResult, NotifyOptions } from './types';

// Helper: dynamic import that won't fail at build time in non-Tauri envs
async function tauriImport<T>(module: string): Promise<T> {
  return import(/* @vite-ignore */ module) as Promise<T>;
}

export class TauriStorage implements IStorage {
  private store: any = null;

  private async getStore() {
    if (!this.store) {
      const mod = await tauriImport<any>('@tauri-apps/plugin-store');
      this.store = await mod.Store.load('mission-control.json');
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

export class TauriNotifier implements INotifier {
  async notify(title: string, body?: string, _options?: NotifyOptions): Promise<void> {
    const mod = await tauriImport<any>('@tauri-apps/plugin-notification');
    mod.sendNotification({ title, body: body || '' });
  }

  async requestPermission(): Promise<boolean> {
    const mod = await tauriImport<any>('@tauri-apps/plugin-notification');
    if (await mod.isPermissionGranted()) return true;
    const result = await mod.requestPermission();
    return result === 'granted';
  }
}

export class TauriShell implements IShell {
  async execute(command: string, args?: string[]): Promise<ShellResult> {
    const mod = await tauriImport<any>('@tauri-apps/api/core');
    const cmdMap: Record<string, string> = {
      'openclaw gateway status': 'gateway_status',
      'openclaw gateway install': 'gateway_install',
      'openclaw gateway start': 'gateway_start',
      'openclaw gateway stop': 'gateway_stop',
      'openclaw gateway restart': 'gateway_restart',
      'openclaw status': 'openclaw_status',
      'openclaw configure': 'openclaw_configure',
      'openclaw --version': 'openclaw_status',
    };
    const fullCmd = [command, ...(args || [])].join(' ');
    const tauriCmd = cmdMap[fullCmd];
    if (tauriCmd) {
      return mod.invoke(tauriCmd) as Promise<ShellResult>;
    }
    return { code: 1, stdout: '', stderr: `Command not allowed: ${fullCmd}` };
  }

  isAvailable(): boolean {
    return true;
  }
}

export class TauriFileSystem implements IFileSystem {
  async readText(path: string): Promise<string> {
    const mod = await tauriImport<any>('@tauri-apps/api/core');
    return mod.invoke('plugin:fs|read_text_file', { path });
  }

  async writeText(path: string, contents: string): Promise<void> {
    const mod = await tauriImport<any>('@tauri-apps/api/core');
    await mod.invoke('plugin:fs|write_text_file', { path, contents });
  }

  async exists(path: string): Promise<boolean> {
    try {
      const mod = await tauriImport<any>('@tauri-apps/api/core');
      return mod.invoke('plugin:fs|exists', { path });
    } catch {
      return false;
    }
  }

  async remove(path: string): Promise<void> {
    const mod = await tauriImport<any>('@tauri-apps/api/core');
    await mod.invoke('plugin:fs|remove_file', { path });
  }
}
