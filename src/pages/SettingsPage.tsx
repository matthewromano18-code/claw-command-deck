import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Zap, Link2, ToggleLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { mockSettings } from '@/data/mockData';
import { SettingToggle } from '@/data/types';

const categoryMeta: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  connection: { label: 'Connection', icon: Link2, description: 'External system connections and API status' },
  automation: { label: 'Automation', icon: Zap, description: 'Automatic task routing and retry behavior' },
  safety: { label: 'Safety & Guardrails', icon: Shield, description: 'Cost limits, human approval, and fail-safes' },
  integration: { label: 'Integrations', icon: ToggleLeft, description: 'Connected services and data export' },
};

const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingToggle[]>(mockSettings);

  const toggle = (id: string) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const categories = ['connection', 'automation', 'safety', 'integration'] as const;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configure your Mission Control behavior</p>
      </div>

      {categories.map((cat) => {
        const meta = categoryMeta[cat];
        const items = settings.filter((s) => s.category === cat);
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <meta.icon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{meta.label}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{meta.description}</p>
            <div className="space-y-3">
              {items.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div>
                    <p className="text-sm text-foreground font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  <Switch checked={s.enabled} onCheckedChange={() => toggle(s.id)} />
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SettingsPage;
