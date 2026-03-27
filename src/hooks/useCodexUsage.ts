import { useState, useCallback } from 'react';
import { mockCodexUsage } from '@/data/mockCodexUsage';
import { CodexUsageStore, TimeRange, BreakdownCategory } from '@/data/codexUsageTypes';

export function useCodexUsage() {
  const [store, setStore] = useState<CodexUsageStore>(mockCodexUsage);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('today');
  const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownCategory>('model');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh — future: call real endpoint
    setTimeout(() => {
      setStore((s) => ({ ...s, lastUpdated: new Date().toISOString() }));
      setIsRefreshing(false);
    }, 800);
  }, []);

  const exportReport = useCallback(() => {
    const safe = {
      summary: store.summary,
      health: { status: store.health.status, message: store.health.message, rateLimitState: store.health.rateLimitState },
      trends: store.trends[selectedRange],
      breakdowns: store.breakdowns[selectedBreakdown],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codex-usage-${selectedRange}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store, selectedRange, selectedBreakdown]);

  const copyDiagnostics = useCallback(async () => {
    const diag = {
      totalTokens: store.summary.totalTokens,
      requests: store.summary.requestsMade,
      healthStatus: store.health.status,
      rateLimitState: store.health.rateLimitState,
      quotaUsedPct: store.summary.quotaLimit
        ? Math.round((store.summary.totalTokens / store.summary.quotaLimit) * 100)
        : null,
      lastUpdated: store.lastUpdated,
    };
    await navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
  }, [store]);

  return {
    store,
    selectedRange,
    setSelectedRange,
    selectedBreakdown,
    setSelectedBreakdown,
    isRefreshing,
    refresh,
    exportReport,
    copyDiagnostics,
  };
}
