// ─── useOpenClawConfig Hook ────────────────────────────────
import { useState, useCallback } from 'react';
import { configManager, CONFIG_SCHEMA } from '@/services/openclaw';
import type { ConfigSnapshot, ConfigChange, ConfigValidationResult } from '@/services/openclaw/config-manager';

export function useOpenClawConfig() {
  const [snapshot, setSnapshot] = useState<ConfigSnapshot | null>(configManager.getSnapshot());
  const [pendingChanges, setPendingChanges] = useState<ConfigChange[]>([]);
  const [validation, setValidation] = useState<ConfigValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await configManager.load();
      setSnapshot(snap);
      setPendingChanges([]);
      setValidation(null);
      setApplyResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const stageChange = useCallback((path: string, value: unknown) => {
    configManager.stageChange(path, value);
    setPendingChanges(configManager.getPendingChanges());
    setValidation(configManager.validate());
  }, []);

  const discardChanges = useCallback(() => {
    configManager.discardChanges();
    setPendingChanges([]);
    setValidation(null);
  }, []);

  const applyChanges = useCallback(async () => {
    setLoading(true);
    try {
      const result = await configManager.apply();
      setApplyResult(result);
      if (result.success) {
        setSnapshot(configManager.getSnapshot());
        setPendingChanges([]);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const rollback = useCallback(async () => {
    const result = await configManager.rollback();
    setApplyResult(result);
    if (result.success) {
      setPendingChanges([]);
    }
    return result;
  }, []);

  const getFieldValue = useCallback((path: string) => {
    return configManager.getFieldValue(path);
  }, []);

  return {
    snapshot,
    pendingChanges,
    validation,
    loading,
    applyResult,
    schema: CONFIG_SCHEMA,
    riskLevel: configManager.getMaxRiskLevel(),
    hasPendingChanges: pendingChanges.length > 0,
    loadConfig,
    stageChange,
    discardChanges,
    applyChanges,
    rollback,
    getFieldValue,
  };
}
