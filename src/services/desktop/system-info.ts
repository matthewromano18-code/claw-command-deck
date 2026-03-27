// ─── Desktop System Info ───────────────────────────────────
// Stubs for OS detection and paths. Replace with Tauri APIs post-export.

import { platform } from '../platform';

export function getPlatformType() {
  return platform.type;
}

export function isDesktop(): boolean {
  return platform.type === 'tauri';
}

export function isBrowser(): boolean {
  return platform.type === 'web';
}
