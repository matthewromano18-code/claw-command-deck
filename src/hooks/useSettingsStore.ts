// ─── Settings Store Hook ────────────────────────────────────
import { useState, useCallback } from 'react';
import { getDefaultValues, RECOMMENDED_PRESET, SETTINGS } from '@/data/settingsConfig';

export function useSettingsStore() {
  const [values, setValues] = useState<Record<string, unknown>>(getDefaultValues());
  const [advancedMode, setAdvancedMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const setValue = useCallback((id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setValues(getDefaultValues());
  }, []);

  const applyRecommended = useCallback(() => {
    setValues(RECOMMENDED_PRESET);
  }, []);

  const getConfigKey = useCallback((id: string) => {
    return SETTINGS.find((s) => s.id === id)?.configKey ?? id;
  }, []);

  // Export as OpenClaw config map
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
    exportConfig,
  };
}
