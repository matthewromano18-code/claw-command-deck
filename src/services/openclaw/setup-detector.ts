// ─── OpenClaw Setup Detector ───────────────────────────────
// Runs on app launch to determine current system state.

import { healthChecker, type HealthReport, type SetupState } from './health-checker';
import { gatewayConnection } from './connection';

export interface SetupSnapshot {
  state: SetupState;
  report: HealthReport;
  timestamp: string;
  isFirstRun: boolean;
  demoMode: boolean;
}

class SetupDetector {
  private snapshot: SetupSnapshot | null = null;
  private listeners: Array<(snapshot: SetupSnapshot) => void> = [];

  async detect(): Promise<SetupSnapshot> {
    const report = await healthChecker.runFullCheck();
    const state = healthChecker.detectSetupState();

    // Consider it first run if CLI is missing and no stored credentials
    const isFirstRun = state === 'cli_missing';
    const demoMode = state !== 'connected_healthy';

    this.snapshot = {
      state,
      report,
      timestamp: new Date().toISOString(),
      isFirstRun,
      demoMode,
    };

    this.listeners.forEach((fn) => fn(this.snapshot!));
    return this.snapshot;
  }

  getSnapshot(): SetupSnapshot | null {
    return this.snapshot;
  }

  isDemoMode(): boolean {
    return this.snapshot?.demoMode ?? true;
  }

  onUpdate(listener: (snapshot: SetupSnapshot) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async attemptAutoConnect(): Promise<void> {
    const state = this.snapshot?.state;
    if (state === 'gateway_stopped' || state === 'connected_healthy') {
      try {
        await gatewayConnection.connect();
      } catch {
        // Connection will handle state transitions
      }
    }
  }
}

export const setupDetector = new SetupDetector();
