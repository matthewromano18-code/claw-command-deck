// ─── Platform Abstraction Interfaces ───────────────────────
// These interfaces allow swapping browser implementations
// for Tauri native APIs with zero UI changes.

export interface IStorage {
  get<T = string>(key: string): Promise<T | null>;
  set<T = string>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface INotifier {
  notify(title: string, body?: string, options?: NotifyOptions): Promise<void>;
  requestPermission(): Promise<boolean>;
}

export interface NotifyOptions {
  icon?: string;
  sound?: boolean;
  urgency?: 'low' | 'normal' | 'critical';
}

export interface IShell {
  execute(command: string, args?: string[]): Promise<ShellResult>;
  isAvailable(): boolean;
}

export interface ShellResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface IFileSystem {
  readText(path: string): Promise<string>;
  writeText(path: string, contents: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
}

export type PlatformType = 'web' | 'tauri';

export interface PlatformServices {
  type: PlatformType;
  storage: IStorage;
  notifier: INotifier;
  shell: IShell;
  fs: IFileSystem;
}
