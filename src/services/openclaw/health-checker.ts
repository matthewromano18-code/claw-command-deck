// ─── OpenClaw Health Checker ───────────────────────────────
// Runs system-level checks and computes a setup health score.

import { platform } from '../platform';
import { gatewayAPI } from './gateway-api';
import { gatewayConnection } from './connection';
import { configManager } from './config-manager';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'checking' | 'skipped';

export interface HealthCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail?: string;
  category: 'cli' | 'gateway' | 'auth' | 'config' | 'models' | 'system';
}

export interface HealthReport {
  checks: HealthCheck[];
  score: number; // 0-100
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown';
}

export type SetupState =
  | 'cli_missing'
  | 'gateway_not_installed'
  | 'gateway_stopped'
  | 'gateway_starting'
  | 'gateway_running_no_auth'
  | 'pairing_required'
  | 'reconnecting'
  | 'config_invalid'
  | 'version_mismatch'
  | 'connected_healthy';

class HealthChecker {
  private lastReport: HealthReport | null = null;

  async runFullCheck(): Promise<HealthReport> {
    const checks: HealthCheck[] = [];

    // 1. CLI presence
    checks.push(await this.checkCLI());

    // 2. Gateway service state
    checks.push(await this.checkGatewayService());

    // 3. Gateway HTTP reachability
    checks.push(await this.checkGatewayHTTP());

    // 4. WebSocket connection
    checks.push(this.checkWebSocketState());

    // 5. Auth state
    checks.push(await this.checkAuth());

    // 6. Config file
    checks.push(await this.checkConfig());

    // 7. Models/providers
    checks.push(await this.checkModels());

    // Calculate score
    const weights: Record<CheckStatus, number> = { pass: 1, warn: 0.6, fail: 0, checking: 0.3, skipped: 0.5 };
    const total = checks.length;
    const sum = checks.reduce((acc, c) => acc + (weights[c.status] || 0), 0);
    const score = Math.round((sum / total) * 100);

    let overallStatus: HealthReport['overallStatus'] = 'healthy';
    if (score < 40) overallStatus = 'critical';
    else if (score < 70) overallStatus = 'degraded';
    else if (score < 100) overallStatus = 'degraded';

    this.lastReport = {
      checks,
      score,
      timestamp: new Date().toISOString(),
      overallStatus: score === 100 ? 'healthy' : overallStatus,
    };

    return this.lastReport;
  }

  getLastReport(): HealthReport | null {
    return this.lastReport;
  }

  detectSetupState(): SetupState {
    if (!this.lastReport) return 'cli_missing';
    const check = (id: string) => this.lastReport!.checks.find((c) => c.id === id);

    if (check('cli')?.status === 'fail') return 'cli_missing';
    if (check('gateway-service')?.status === 'fail') return 'gateway_not_installed';
    if (check('gateway-http')?.status === 'fail') return 'gateway_stopped';
    if (check('config')?.status === 'fail') return 'config_invalid';

    const wsState = gatewayConnection.getState();
    if (wsState === 'pairing_required') return 'pairing_required';
    if (wsState === 'auth_required') return 'gateway_running_no_auth';
    if (wsState === 'reconnecting') return 'reconnecting';
    if (wsState === 'incompatible_version') return 'version_mismatch';
    if (wsState === 'connected') return 'connected_healthy';

    return 'gateway_stopped';
  }

  // ── Individual Checks ──────────────────────────────────

  private async checkCLI(): Promise<HealthCheck> {
    const base: HealthCheck = {
      id: 'cli',
      label: 'OpenClaw CLI',
      description: 'CLI binary is installed and accessible',
      status: 'checking',
      category: 'cli',
    };

    if (!platform.shell.isAvailable()) {
      return { ...base, status: 'skipped', detail: 'Shell not available (browser mode)' };
    }

    try {
      const result = await platform.shell.execute('openclaw', ['--version']);
      if (result.code === 0) {
        return { ...base, status: 'pass', detail: `v${result.stdout.trim()}` };
      }
      return { ...base, status: 'fail', detail: result.stderr || 'CLI returned non-zero exit code' };
    } catch {
      return { ...base, status: 'fail', detail: 'openclaw binary not found in PATH' };
    }
  }

  private async checkGatewayService(): Promise<HealthCheck> {
    const base: HealthCheck = {
      id: 'gateway-service',
      label: 'Gateway Service',
      description: 'Gateway is registered as a service',
      status: 'checking',
      category: 'gateway',
    };

    if (!platform.shell.isAvailable()) {
      return { ...base, status: 'skipped', detail: 'Shell not available' };
    }

    try {
      const result = await platform.shell.execute('openclaw', ['gateway', 'status']);
      if (result.code === 0) {
        return { ...base, status: 'pass', detail: result.stdout.trim() };
      }
      return { ...base, status: 'fail', detail: result.stderr || 'Service not running' };
    } catch {
      return { ...base, status: 'fail', detail: 'Could not check gateway service' };
    }
  }

  private async checkGatewayHTTP(): Promise<HealthCheck> {
    const base: HealthCheck = {
      id: 'gateway-http',
      label: 'Gateway Reachable',
      description: 'HTTP endpoint responds',
      status: 'checking',
      category: 'gateway',
    };

    try {
      const info = await gatewayAPI.getStatus();
      return { ...base, status: 'pass', detail: `v${info.version} — ${info.agentCount} agents` };
    } catch {
      return { ...base, status: 'fail', detail: 'Cannot reach gateway HTTP endpoint' };
    }
  }

  private checkWebSocketState(): HealthCheck {
    const state = gatewayConnection.getState();
    const base: HealthCheck = {
      id: 'websocket',
      label: 'WebSocket Connection',
      description: 'Live WebSocket link to gateway',
      status: 'checking',
      category: 'gateway',
    };

    if (state === 'connected') return { ...base, status: 'pass', detail: 'Connected' };
    if (state === 'connecting' || state === 'reconnecting') return { ...base, status: 'warn', detail: 'Attempting connection…' };
    return { ...base, status: 'fail', detail: `State: ${state}` };
  }

  private async checkAuth(): Promise<HealthCheck> {
    const base: HealthCheck = {
      id: 'auth',
      label: 'Authentication',
      description: 'Device is authenticated with the gateway',
      status: 'checking',
      category: 'auth',
    };

    const token = await platform.storage.get<string>('openclaw:auth-token');
    const identity = await platform.storage.get<unknown>('openclaw:device-identity');

    if (token && identity) {
      return { ...base, status: 'pass', detail: 'Token and device identity present' };
    }
    if (token) {
      return { ...base, status: 'warn', detail: 'Token present but no device identity' };
    }
    return { ...base, status: 'fail', detail: 'No stored credentials' };
  }

  private async checkConfig(): Promise<HealthCheck> {
    const base: HealthCheck = {
      id: 'config',
      label: 'Configuration File',
      description: 'openclaw.json is readable and valid',
      status: 'checking',
      category: 'config',
    };

    try {
      const snapshot = await configManager.load();
      const validation = configManager.validate(snapshot.config);
      if (!validation.valid) {
        return { ...base, status: 'fail', detail: validation.errors[0]?.message || 'Invalid config' };
      }
      if (validation.warnings.length > 0) {
        return { ...base, status: 'warn', detail: validation.warnings[0]?.message };
      }
      return { ...base, status: 'pass', detail: 'Valid configuration' };
    } catch {
      return { ...base, status: 'fail', detail: 'Cannot read config file' };
    }
  }

  private async checkModels(): Promise<HealthCheck> {
    const base: HealthCheck = {
      id: 'models',
      label: 'Model Providers',
      description: 'At least one model provider is configured',
      status: 'checking',
      category: 'models',
    };

    const snapshot = configManager.getSnapshot();
    if (!snapshot) {
      return { ...base, status: 'skipped', detail: 'Config not loaded' };
    }

    const models = snapshot.config.models || [];
    if (models.length === 0) {
      return { ...base, status: 'warn', detail: 'No model providers configured' };
    }
    const defaultModel = models.find((m) => m.default);
    return {
      ...base,
      status: 'pass',
      detail: `${models.length} provider(s) — default: ${defaultModel?.provider || 'none'}`,
    };
  }
}

export const healthChecker = new HealthChecker();
