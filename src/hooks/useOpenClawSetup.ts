// ─── useOpenClawSetup Hook ─────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { setupDetector } from '@/services/openclaw';
import type { SetupSnapshot, SetupState } from '@/services/openclaw/setup-detector';
import type { HealthReport } from '@/services/openclaw/health-checker';

export function useOpenClawSetup() {
  const [snapshot, setSnapshot] = useState<SetupSnapshot | null>(setupDetector.getSnapshot());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = setupDetector.onUpdate(setSnapshot);
    return unsub;
  }, []);

  const runDetection = useCallback(async () => {
    setLoading(true);
    try {
      const result = await setupDetector.detect();
      setSnapshot(result);
    } finally {
      setLoading(false);
    }
  }, []);

  const autoConnect = useCallback(async () => {
    await setupDetector.attemptAutoConnect();
  }, []);

  return {
    snapshot,
    loading,
    state: (snapshot?.state || 'cli_missing') as SetupState,
    report: snapshot?.report as HealthReport | null,
    score: snapshot?.report?.score ?? 0,
    isDemoMode: snapshot?.demoMode ?? true,
    isFirstRun: snapshot?.isFirstRun ?? true,
    runDetection,
    autoConnect,
  };
}
