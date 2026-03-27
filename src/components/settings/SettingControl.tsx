// ─── Individual Setting Control Renderer ────────────────────
import { useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { SettingItem } from '@/data/settingsConfig';

interface Props {
  setting: SettingItem;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  onAction?: (id: string) => void;
  showConfigKey?: boolean;
}

export function SettingControl({ setting, value, onChange, onAction, showConfigKey }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<unknown>(null);

  const riskColor = setting.risk === 'danger' ? 'text-destructive' : setting.risk === 'caution' ? 'text-warning' : 'text-success';
  const riskBg = setting.risk === 'danger' ? 'bg-destructive/10' : setting.risk === 'caution' ? 'bg-warning/10' : 'bg-success/10';

  const handleChange = (newVal: unknown) => {
    if (setting.requiresConfirm) {
      setPendingValue(newVal);
      setConfirmOpen(true);
    } else {
      onChange(setting.id, newVal);
    }
  };

  const confirmChange = () => {
    if (pendingValue !== null && pendingValue !== undefined) {
      onChange(setting.id, pendingValue);
    }
    setPendingValue(null);
    setConfirmOpen(false);
  };

  const cancelChange = () => {
    setPendingValue(null);
    setConfirmOpen(false);
  };

  const renderControl = () => {
    switch (setting.type) {
      case 'toggle':
        return (
          <Switch
            checked={value as boolean}
            onCheckedChange={(v) => handleChange(v)}
          />
        );

      case 'slider':
        return (
          <div className="w-full max-w-[200px] space-y-1">
            <div className="flex items-center gap-2">
              <Slider
                value={[value as number]}
                onValueChange={([v]) => onChange(setting.id, v)}
                min={setting.min ?? 0}
                max={setting.max ?? 100}
                step={setting.step ?? 1}
              />
              <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{value as number}</span>
            </div>
            {setting.sliderLabels && (
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{setting.sliderLabels[0]}</span>
                <span>{setting.sliderLabels[1]}</span>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <Select value={value as string} onValueChange={(v) => handleChange(v)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => {
              const num = Number(e.target.value);
              if (setting.min !== undefined && num < setting.min) return;
              if (setting.max !== undefined && num > setting.max) return;
              onChange(setting.id, num);
            }}
            min={setting.min}
            max={setting.max}
            className="w-24 h-8 text-xs"
          />
        );

      case 'button':
        return (
          <Button
            variant="destructive"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              if (setting.requiresConfirm) {
                setPendingValue('action');
                setConfirmOpen(true);
              } else {
                onAction?.(setting.id);
              }
            }}
          >
            {setting.label}
          </Button>
        );

      case 'list':
        return (
          <Input
            value={(value as string[])?.join(', ') ?? ''}
            onChange={(e) => onChange(setting.id, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="domain1.com, domain2.com"
            className="w-[200px] h-8 text-xs"
          />
        );

      default:
        return (
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => onChange(setting.id, e.target.value)}
            className="w-[200px] h-8 text-xs"
          />
        );
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground font-medium">{setting.label}</p>
            {setting.risk !== 'safe' && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${riskBg} ${riskColor} border-0`}>
                {setting.risk === 'danger' ? 'Risk' : 'Caution'}
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-xs">
                {setting.tooltip}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
          {showConfigKey && (
            <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5">{setting.configKey}</p>
          )}
          {setting.warning && (
            <p className="text-[10px] text-warning flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> {setting.warning}
            </p>
          )}
        </div>
        <div className="shrink-0">
          {renderControl()}
        </div>
      </div>

      {/* Confirmation dialog for dangerous actions */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!open) cancelChange(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Confirm Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {setting.warning || `Are you sure you want to change "${setting.label}"? This may affect system behavior.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8" onClick={cancelChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-xs h-8" onClick={confirmChange}>
              {setting.type === 'button' ? 'Yes, do it' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
