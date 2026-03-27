// ─── Browser fallback implementations ──────────────────────
import type { IStorage, INotifier, IShell, IFileSystem, ShellResult, NotifyOptions } from './types';

export class BrowserStorage implements IStorage {
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async set<T = string>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

export class BrowserNotifier implements INotifier {
  async notify(title: string, body?: string, _options?: NotifyOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
}

export class BrowserShell implements IShell {
  async execute(_command: string, _args?: string[]): Promise<ShellResult> {
    console.warn('[Platform] Shell commands are not available in browser mode.');
    return { code: 1, stdout: '', stderr: 'Shell not available in browser' };
  }

  isAvailable(): boolean {
    return false;
  }
}

export class BrowserFileSystem implements IFileSystem {
  async readText(_path: string): Promise<string> {
    throw new Error('File system not available in browser mode');
  }

  async writeText(_path: string, _contents: string): Promise<void> {
    throw new Error('File system not available in browser mode');
  }

  async exists(_path: string): Promise<boolean> {
    return false;
  }

  async remove(_path: string): Promise<void> {
    throw new Error('File system not available in browser mode');
  }
}
