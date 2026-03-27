import { Card, CardContent } from '@/components/ui/card';
import { Cpu, HardDrive, Thermometer, MemoryStick } from 'lucide-react';
import { useMissionControl } from '@/hooks/useMissionControl';
import { VitalMetric } from '@/data/types';

interface VitalBarProps {
  label: string;
  icon: React.ElementType;
  metric: VitalMetric;
  statusColor?: 'success' | 'warning' | 'destructive';
}

const getBarColor = (pct: number) => {
  if (pct > 85) return 'bg-destructive';
  if (pct > 60) return 'bg-warning';
  return 'bg-success';
};

const VitalBar = ({ label, icon: Icon, metric, statusColor }: VitalBarProps) => {
  const barColor = statusColor ? `bg-${statusColor}` : getBarColor(metric.percentage);

  return (
    <Card className="glass-panel flex-1 min-w-[180px]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-foreground">{metric.percentage}%</span>
            <span className="text-[11px] text-muted-foreground">used</span>
          </div>
        </div>

        {metric.subtitle && (
          <span className="text-[11px] text-muted-foreground">{metric.subtitle}</span>
        )}

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {metric.details.map((d) => (
            <div key={d.label} className="text-center">
              <span className="text-xs font-mono font-semibold text-foreground">{d.value}</span>
              <p className="text-[10px] text-muted-foreground leading-tight">{d.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function SystemVitals() {
  const { systemVitals } = useMissionControl('vitals:update');
  const { cpu, memory, disk, temperature, uptime, hostname } = systemVitals;

  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">System Vitals</span>
            {hostname && (
              <span className="text-[11px] text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{hostname}</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">Uptime: {uptime}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <VitalBar icon={Cpu} label="CPU" metric={cpu} />
          <VitalBar icon={MemoryStick} label="Memory" metric={memory} />
          <VitalBar icon={HardDrive} label="Disk" metric={disk} statusColor="success" />
          <Card className="glass-panel flex-1 min-w-[180px]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">Temperature</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-foreground">
                  {temperature.value !== null ? temperature.value : '—'}
                </span>
                <span className="text-sm text-muted-foreground">{temperature.unit}</span>
              </div>
              {temperature.message && (
                <p className="text-[11px] text-muted-foreground">{temperature.message}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
