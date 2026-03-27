import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { useMissionControl } from '@/hooks/useMissionControl';

interface UsageBarProps {
  label: string;
  percentage: number;
}

const UsageBar = ({ label, percentage }: UsageBarProps) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground font-medium">{label}</span>
      <span className="text-xs font-mono text-muted-foreground">{percentage}% used</span>
    </div>
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          percentage > 85 ? 'bg-destructive' : percentage > 60 ? 'bg-warning' : 'bg-primary'
        }`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  </div>
);

export default function CodexApiUsage() {
  const { codexApiUsage } = useMissionControl('codex-api:update');

  return (
    <Card className="glass-panel">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <div>
            <span className="text-sm font-semibold text-foreground">Codex (OpenAI)</span>
            <p className="text-[11px] text-muted-foreground">{codexApiUsage.plan}</p>
          </div>
        </div>

        <div className="space-y-3">
          <UsageBar label="5-Hour Usage" percentage={codexApiUsage.fiveHourPct} />
          <UsageBar label="Weekly Usage" percentage={codexApiUsage.weeklyPct} />
        </div>

        <div className="flex items-center justify-between py-1.5 border-t border-border/40">
          <span className="text-xs text-muted-foreground">Codex Tasks</span>
          <span className="text-xs font-mono font-semibold text-foreground">{codexApiUsage.codexTasks}</span>
        </div>
      </CardContent>
    </Card>
  );
}
