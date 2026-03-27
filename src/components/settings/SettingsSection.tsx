// ─── Settings Section Card ──────────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, Shield, Globe, Workflow, Link2, BarChart3, Database, Wrench, Cpu, ScrollText, Radio } from 'lucide-react';
import { SettingControl } from './SettingControl';
import type { SectionMeta, SettingItem } from '@/data/settingsConfig';

const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Shield, Globe, Workflow, Link2, BarChart3, Database, Wrench, Cpu, ScrollText, Radio,
};

interface Props {
  section: SectionMeta;
  settings: SettingItem[];
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  showConfigKeys: boolean;
  defaultOpen?: boolean;
}

// ── Usage stats (mock) for the usage section ────────────────
function UsageStats() {
  const stats = [
    { label: 'Tokens used', value: '124,580', max: '500,000', pct: 25 },
    { label: 'Requests made', value: '342', max: '1,000', pct: 34 },
    { label: 'Estimated cost', value: '$2.14', max: '$10.00', pct: 21 },
  ];
  return (
    <div className="space-y-3 mb-3">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="text-foreground font-medium">{s.value} <span className="text-muted-foreground/60">/ {s.max}</span></span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${s.pct}%`,
                backgroundColor: s.pct > 80 ? 'hsl(var(--destructive))' : s.pct > 60 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Connection status for the connections section ────────────
function ConnectionStatus({ settings, values }: { settings: SettingItem[]; values: Record<string, unknown> }) {
  return (
    <div className="space-y-2 mb-3">
      {settings.map((s) => (
        <div key={s.id} className="flex items-center justify-between py-1">
          <span className="text-xs text-foreground">{s.label}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${values[s.id] ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
            {values[s.id] ? '● Connected' : '○ Not Connected'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── System status for the system section ─────────────────────
function SystemStatus() {
  return (
    <div className="flex items-center gap-3 mb-3 p-2.5 rounded-md bg-success/8 border border-success/20">
      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      <div>
        <p className="text-xs font-medium text-foreground">System Connected</p>
        <p className="text-[10px] text-muted-foreground">Gateway online · Last ping 2s ago</p>
      </div>
      <button className="ml-auto text-[10px] text-primary hover:underline">Reconnect</button>
    </div>
  );
}

export function SettingsSection({ section, settings, values, onChange, showConfigKeys, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICON_MAP[section.icon] ?? Brain;

  if (settings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel overflow-hidden"
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{section.emoji} {section.label}</p>
          <p className="text-[11px] text-muted-foreground">{section.description}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-0">
              {/* Special section content */}
              {section.id === 'usage' && <UsageStats />}
              {section.id === 'connections' && <ConnectionStatus settings={settings} values={values} />}
              {section.id === 'system' && <SystemStatus />}

              {/* Settings controls (skip connection toggles since we show status above) */}
              {settings
                .filter((s) => section.id !== 'connections')
                .map((s) => (
                  <SettingControl
                    key={s.id}
                    setting={s}
                    value={values[s.id]}
                    onChange={onChange}
                    showConfigKey={showConfigKeys}
                  />
                ))}
              {section.id === 'connections' && settings.map((s) => (
                <SettingControl
                  key={s.id}
                  setting={s}
                  value={values[s.id]}
                  onChange={onChange}
                  showConfigKey={showConfigKeys}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
