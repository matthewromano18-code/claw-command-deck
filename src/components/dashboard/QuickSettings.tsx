import { motion } from 'framer-motion';
import { SettingToggle } from '@/data/types';
import { Switch } from '@/components/ui/switch';

interface QuickSettingsProps {
  settings: SettingToggle[];
  onToggle: (id: string) => void;
}

const QuickSettings = ({ settings, onToggle }: QuickSettingsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-panel p-3"
    >
      <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Quick Settings</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {settings.slice(0, 8).map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-secondary/50 border border-border/30"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{s.label}</p>
            </div>
            <Switch
              checked={s.enabled}
              onCheckedChange={() => onToggle(s.id)}
              className="shrink-0 scale-75"
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickSettings;
