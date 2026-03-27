// ─── Platform Service Provider ─────────────────────────────
import type { PlatformServices, PlatformType } from './types';
import { BrowserStorage, BrowserNotifier, BrowserShell, BrowserFileSystem } from './browser';

function detectPlatform(): PlatformType {
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return 'tauri';
  }
  return 'web';
}

async function createTauriServices(): Promise<PlatformServices> {
  const { TauriStorage, TauriNotifier, TauriShell, TauriFileSystem } = await import('./tauri');
  return {
    type: 'tauri' as PlatformType,
    storage: new TauriStorage(),
    notifier: new TauriNotifier(),
    shell: new TauriShell(),
    fs: new TauriFileSystem(),
  };
}

function createBrowserServices(): PlatformServices {
  return {
    type: 'web' as PlatformType,
    storage: new BrowserStorage(),
    notifier: new BrowserNotifier(),
    shell: new BrowserShell(),
    fs: new BrowserFileSystem(),
  };
}

// Start with browser services; upgrade to Tauri if detected
let _platform: PlatformServices = createBrowserServices();
let _initialized = false;

export async function initPlatform(): Promise<PlatformServices> {
  if (_initialized) return _platform;
  _initialized = true;
  if (detectPlatform() === 'tauri') {
    try {
      _platform = await createTauriServices();
      console.log('[Platform] Tauri backend detected — native APIs active');
    } catch (e) {
      console.warn('[Platform] Tauri detected but plugins failed to load, falling back to browser', e);
    }
  } else {
    console.log('[Platform] Browser mode — using web fallbacks');
  }
  return _platform;
}

// Synchronous access (returns browser services until initPlatform resolves)
export const platform = new Proxy({} as PlatformServices, {
  get(_target, prop: keyof PlatformServices) {
    return _platform[prop];
  },
});

export type { PlatformServices, PlatformType, IStorage, INotifier, IShell, IFileSystem } from './types';
