// ─── Settings Control Center ────────────────────────────────
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, Search, Sparkles, RotateCcw, ToggleLeft, Code2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { SECTIONS, SETTINGS } from '@/data/settingsConfig';

const SettingsPage = () => {
  const {
    values,
    advancedMode,
    searchQuery,
    setValue,
    setAdvancedMode,
    setSearchQuery,
    resetToDefaults,
    applyRecommended,
  } = useSettingsStore();

  const filteredSections = useMemo(() => {
    return SECTIONS.map((section) => {
      let items = SETTINGS.filter((s) => s.section === section.id);
      if (!advancedMode) items = items.filter((s) => s.simpleMode);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        items = items.filter(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.configKey.toLowerCase().includes(q)
        );
      }
      return { section, items };
    }).filter((g) => g.items.length > 0);
  }, [advancedMode, searchQuery]);

  return (
    <div className="max-w-[820px] mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your AI system in plain English
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-card border border-border/60">
                <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {advancedMode ? 'Advanced' : 'Simple'}
                </span>
                <Switch
                  checked={advancedMode}
                  onCheckedChange={setAdvancedMode}
                  className="scale-75 origin-right"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {advancedMode ? 'Showing all settings with config keys' : 'Showing essential settings only'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={applyRecommended}>
              <Sparkles className="w-3.5 h-3.5" />
              Recommended
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Apply the recommended safe configuration</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={resetToDefaults}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Reset all settings to safe defaults</TooltipContent>
        </Tooltip>
      </div>

      {/* Advanced mode banner */}
      {advancedMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20"
        >
          <Code2 className="w-4 h-4 text-primary" />
          <p className="text-[11px] text-muted-foreground">
            Advanced mode — config keys shown in <span className="font-mono text-muted-foreground/50">grey</span>. All settings visible.
          </p>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {SETTINGS.length} settings
          </Badge>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {filteredSections.map(({ section, items }, idx) => (
          <SettingsSection
            key={section.id}
            section={section}
            settings={items}
            values={values}
            onChange={setValue}
            showConfigKeys={advancedMode}
            defaultOpen={idx === 0}
          />
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No settings match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
