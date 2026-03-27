// ─── Settings Store Hook ────────────────────────────────────
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getDefaultValues, RECOMMENDED_PRESET, SETTINGS } from '@/data/settingsConfig';

export function useSettingsStore() {
  const [values, setValues] = useState<Record<string, unknown>>(getDefaultValues());
  const [advancedMode, setAdvancedMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const setValue = useCallback((id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    const setting = SETTINGS.find((s) => s.id === id);
    if (setting) {
      if (setting.type === 'toggle') {
        toast.success(`${setting.label}: ${value ? 'ON' : 'OFF'}`);
      } else if (setting.type === 'select') {
        const optLabel = setting.options?.find((o) => o.value === value)?.label ?? value;
        toast.success(`${setting.label} → ${optLabel}`);
      }
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    setValues(getDefaultValues());
    toast.success('All settings reset to safe defaults');
  }, []);

  const applyRecommended = useCallback(() => {
    setValues(RECOMMENDED_PRESET);
    toast.success('Recommended settings applied');
  }, []);

  const handleAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'clear-memory':
        toast.success('AI memory cleared successfully');
        break;
      case 'reconnect':
        toast.info('Reconnecting to gateway...');
        setTimeout(() => toast.success('Gateway reconnected'), 2000);
        break;
      case 'download-logs':
        toast.info('Preparing log download...');
        break;
      default:
        toast.info(`Action: ${actionId}`);
    }
  }, []);

  const getConfigKey = useCallback((id: string) => {
    return SETTINGS.find((s) => s.id === id)?.configKey ?? id;
  }, []);

  const exportConfig = useCallback(() => {
    const config: Record<string, unknown> = {};
    Object.entries(values).forEach(([id, val]) => {
      const key = getConfigKey(id);
      config[key] = val;
    });
    return config;
  }, [values, getConfigKey]);

  return {
    values,
    advancedMode,
    searchQuery,
    setValue,
    setAdvancedMode,
    setSearchQuery,
    resetToDefaults,
    applyRecommended,
    handleAction,
    exportConfig,
  };
}
