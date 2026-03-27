// ─── Platform Service Provider ─────────────────────────────
import type { PlatformServices, PlatformType } from './types';
import { BrowserStorage, BrowserNotifier, BrowserShell, BrowserFileSystem } from './browser';

function detectPlatform(): PlatformType {
  // Tauri injects __TAURI__ on the window object
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'tauri';
  }
  return 'web';
}

function createPlatformServices(): PlatformServices {
  const type = detectPlatform();

  // In Tauri mode, these would be swapped for Tauri API implementations.
  // For now, always return browser fallbacks.
  // Post-export: import from './tauri' when type === 'tauri'.
  return {
    type,
    storage: new BrowserStorage(),
    notifier: new BrowserNotifier(),
    shell: new BrowserShell(),
    fs: new BrowserFileSystem(),
  };
}

export const platform = createPlatformServices();
export type { PlatformServices, PlatformType, IStorage, INotifier, IShell, IFileSystem } from './types';
