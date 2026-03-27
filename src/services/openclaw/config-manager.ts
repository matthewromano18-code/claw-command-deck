// ─── OpenClaw Configuration Manager ────────────────────────
// Reads, writes, validates, and applies ~/.openclaw/openclaw.json
// All filesystem operations go through platform abstraction.

import { platform } from '../platform';
import { gatewayAPI } from './gateway-api';

export interface OpenClawConfig {
  version?: string;
  gateway?: {
    host?: string;
    port?: number;
    auth?: {
      type?: 'none' | 'token' | 'password';
      tokenPath?: string;
    };
    tls?: boolean;
    logLevel?: string;
  };
  models?: Array<{
    id: string;
    provider: string;
    model: string;
    apiKeyEnv?: string;
    default?: boolean;
  }>;
  agents?: {
    maxConcurrent?: number;
    defaultTimeout?: number;
    retryPolicy?: {
      maxRetries?: number;
      backoffMs?: number;
    };
  };
  logging?: {
    level?: string;
    file?: string;
    maxSizeMb?: number;
  };
  plugins?: string[];
  [key: string]: unknown;
}

export interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json';
  section: string;
  options?: string[];
  default?: unknown;
  riskLevel: 'low' | 'medium' | 'high';
  requiresRestart: boolean;
}

export interface ConfigChange {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
  warnings: Array<{ path: string; message: string }>;
}

export interface ConfigSnapshot {
  config: OpenClawConfig;
  raw: string;
  hash: string;
  loadedAt: string;
}

const CONFIG_PATH = '~/.openclaw/openclaw.json';

// ── Schema for the settings forms ──────────────────────────
export const CONFIG_SCHEMA: ConfigField[] = [
  { key: 'gateway.host', label: 'Gateway Host', description: 'Hostname or IP for the gateway listener', type: 'string', section: 'Gateway', default: '127.0.0.1', riskLevel: 'medium', requiresRestart: true },
  { key: 'gateway.port', label: 'Gateway Port', description: 'Port number for gateway connections', type: 'number', section: 'Gateway', default: 18789, riskLevel: 'medium', requiresRestart: true },
  { key: 'gateway.auth.type', label: 'Auth Mode', description: 'How clients authenticate to the gateway', type: 'select', section: 'Gateway', options: ['none', 'token', 'password'], default: 'token', riskLevel: 'high', requiresRestart: true },
  { key: 'gateway.tls', label: 'Enable TLS', description: 'Use encrypted connections', type: 'boolean', section: 'Gateway', default: false, riskLevel: 'high', requiresRestart: true },
  { key: 'gateway.logLevel', label: 'Log Level', description: 'Gateway log verbosity', type: 'select', section: 'Gateway', options: ['debug', 'info', 'warn', 'error'], default: 'info', riskLevel: 'low', requiresRestart: false },
  { key: 'agents.maxConcurrent', label: 'Max Concurrent Agents', description: 'Maximum agents running simultaneously', type: 'number', section: 'Agents', default: 5, riskLevel: 'medium', requiresRestart: false },
  { key: 'agents.defaultTimeout', label: 'Default Timeout (s)', description: 'Timeout in seconds for agent tasks', type: 'number', section: 'Agents', default: 300, riskLevel: 'low', requiresRestart: false },
  { key: 'agents.retryPolicy.maxRetries', label: 'Max Retries', description: 'Number of retry attempts for failed tasks', type: 'number', section: 'Agents', default: 3, riskLevel: 'low', requiresRestart: false },
  { key: 'logging.level', label: 'App Log Level', description: 'Application-wide log verbosity', type: 'select', section: 'Logging', options: ['debug', 'info', 'warn', 'error'], default: 'info', riskLevel: 'low', requiresRestart: false },
  { key: 'logging.file', label: 'Log File Path', description: 'Path to the log output file', type: 'string', section: 'Logging', default: '~/.openclaw/logs/openclaw.log', riskLevel: 'low', requiresRestart: true },
  { key: 'logging.maxSizeMb', label: 'Max Log Size (MB)', description: 'Maximum log file size before rotation', type: 'number', section: 'Logging', default: 50, riskLevel: 'low', requiresRestart: false },
];

// ── Helpers ────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  let current = obj;
  for (const k of keys) {
    if (!current[k] || typeof current[k] !== 'object') current[k] = {};
    current = current[k] as Record<string, unknown>;
  }
  current[last] = value;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ── Config Manager ─────────────────────────────────────────

class ConfigManager {
  private snapshot: ConfigSnapshot | null = null;
  private pendingChanges: ConfigChange[] = [];

  async load(): Promise<ConfigSnapshot> {
    try {
      const raw = await platform.fs.readText(CONFIG_PATH);
      const config = JSON.parse(raw) as OpenClawConfig;
      this.snapshot = {
        config,
        raw,
        hash: simpleHash(raw),
        loadedAt: new Date().toISOString(),
      };
      this.pendingChanges = [];
      return this.snapshot;
    } catch {
      // Return empty config if file doesn't exist or can't be read
      const emptyConfig: OpenClawConfig = {};
      const raw = '{}';
      this.snapshot = {
        config: emptyConfig,
        raw,
        hash: simpleHash(raw),
        loadedAt: new Date().toISOString(),
      };
      return this.snapshot;
    }
  }

  getSnapshot(): ConfigSnapshot | null {
    return this.snapshot;
  }

  getPendingChanges(): ConfigChange[] {
    return [...this.pendingChanges];
  }

  stageChange(path: string, newValue: unknown): void {
    if (!this.snapshot) return;
    const oldValue = getNestedValue(this.snapshot.config as Record<string, unknown>, path);
    const field = CONFIG_SCHEMA.find((f) => f.key === path);

    // Remove existing change for same path
    this.pendingChanges = this.pendingChanges.filter((c) => c.path !== path);

    // Only add if actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      this.pendingChanges.push({
        path,
        oldValue,
        newValue,
        riskLevel: field?.riskLevel || 'low',
      });
    }
  }

  discardChanges(): void {
    this.pendingChanges = [];
  }

  validate(config?: OpenClawConfig): ConfigValidationResult {
    const cfg = config || this.buildPendingConfig();
    const errors: Array<{ path: string; message: string }> = [];
    const warnings: Array<{ path: string; message: string }> = [];

    // Port range
    if (cfg.gateway?.port !== undefined) {
      if (cfg.gateway.port < 1 || cfg.gateway.port > 65535) {
        errors.push({ path: 'gateway.port', message: 'Port must be between 1 and 65535' });
      }
      if (cfg.gateway.port < 1024) {
        warnings.push({ path: 'gateway.port', message: 'Ports below 1024 require elevated privileges' });
      }
    }

    // Max concurrent agents
    if (cfg.agents?.maxConcurrent !== undefined) {
      if (cfg.agents.maxConcurrent < 1 || cfg.agents.maxConcurrent > 50) {
        errors.push({ path: 'agents.maxConcurrent', message: 'Must be between 1 and 50' });
      }
    }

    // Timeout
    if (cfg.agents?.defaultTimeout !== undefined && cfg.agents.defaultTimeout < 10) {
      warnings.push({ path: 'agents.defaultTimeout', message: 'Very short timeout may cause frequent failures' });
    }

    // TLS without auth warning
    if (cfg.gateway?.auth?.type === 'none' && !cfg.gateway?.tls) {
      warnings.push({ path: 'gateway.auth.type', message: 'No auth and no TLS — gateway is completely open' });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  buildPendingConfig(): OpenClawConfig {
    if (!this.snapshot) return {};
    const config = JSON.parse(JSON.stringify(this.snapshot.config)) as Record<string, unknown>;
    for (const change of this.pendingChanges) {
      setNestedValue(config, change.path, change.newValue);
    }
    return config as OpenClawConfig;
  }

  async apply(): Promise<{ success: boolean; message: string }> {
    if (this.pendingChanges.length === 0) {
      return { success: true, message: 'No changes to apply' };
    }

    const newConfig = this.buildPendingConfig();
    const validation = this.validate(newConfig);
    if (!validation.valid) {
      return { success: false, message: `Validation failed: ${validation.errors.map((e) => e.message).join(', ')}` };
    }

    try {
      // Check for concurrent edits
      const currentRaw = await platform.fs.readText(CONFIG_PATH).catch(() => '{}');
      const currentHash = simpleHash(currentRaw);
      if (this.snapshot && currentHash !== this.snapshot.hash) {
        return { success: false, message: 'Config was modified externally. Please reload before applying.' };
      }

      // Write new config
      const newRaw = JSON.stringify(newConfig, null, 2);
      await platform.fs.writeText(CONFIG_PATH, newRaw);

      // Check if restart is needed
      const needsRestart = this.pendingChanges.some((c) => {
        const field = CONFIG_SCHEMA.find((f) => f.key === c.path);
        return field?.requiresRestart;
      });

      if (needsRestart) {
        // Restart gateway via CLI
        await platform.shell.execute('openclaw', ['gateway', 'restart']);
      }

      // Reload snapshot
      await this.load();

      return { success: true, message: needsRestart ? 'Config applied — gateway restarted' : 'Config applied successfully' };
    } catch (err) {
      return { success: false, message: `Failed to apply config: ${err}` };
    }
  }

  async rollback(): Promise<{ success: boolean; message: string }> {
    if (!this.snapshot) {
      return { success: false, message: 'No snapshot to rollback to' };
    }
    try {
      await platform.fs.writeText(CONFIG_PATH, this.snapshot.raw);
      this.pendingChanges = [];
      return { success: true, message: 'Config rolled back to last loaded state' };
    } catch (err) {
      return { success: false, message: `Rollback failed: ${err}` };
    }
  }

  getFieldValue(path: string): unknown {
    if (!this.snapshot) return undefined;
    // Check pending changes first
    const pending = this.pendingChanges.find((c) => c.path === path);
    if (pending) return pending.newValue;
    return getNestedValue(this.snapshot.config as Record<string, unknown>, path);
  }

  getMaxRiskLevel(): 'low' | 'medium' | 'high' | null {
    if (this.pendingChanges.length === 0) return null;
    if (this.pendingChanges.some((c) => c.riskLevel === 'high')) return 'high';
    if (this.pendingChanges.some((c) => c.riskLevel === 'medium')) return 'medium';
    return 'low';
  }
}

export const configManager = new ConfigManager();
