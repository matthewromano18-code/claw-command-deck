import { Card, CardContent } from '@/components/ui/card';
import { Cpu, HardDrive, Thermometer, MemoryStick } from 'lucide-react';

interface VitalBarProps {
  label: string;
  icon: React.ElementType;
  percentage: number;
  details: { label: string; value: string }[];
  subtitle?: string;
  statusColor?: 'success' | 'warning' | 'destructive';
}

const getBarColor = (pct: number) => {
  if (pct > 85) return 'bg-destructive';
  if (pct > 60) return 'bg-warning';
  return 'bg-success';
};

const VitalBar = ({ label, icon: Icon, percentage, details, subtitle, statusColor }: VitalBarProps) => {
  const barColor = statusColor
    ? `bg-${statusColor}`
    : getBarColor(percentage);

  return (
    <Card className="glass-panel flex-1 min-w-[180px]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-foreground">{percentage}%</span>
            <span className="text-[11px] text-muted-foreground">used</span>
          </div>
        </div>

        {subtitle && (
          <span className="text-[11px] text-muted-foreground">{subtitle}</span>
        )}

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Detail metrics */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {details.map((d) => (
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

const TemperatureCard = () => (
  <Card className="glass-panel flex-1 min-w-[180px]">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Thermometer className="w-4 h-4 text-warning" />
        <span className="text-sm font-semibold text-foreground">Temperature</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono text-foreground">—</span>
        <span className="text-sm text-muted-foreground">°C</span>
      </div>
      <p className="text-[11px] text-muted-foreground">Requires elevated access</p>
    </CardContent>
  </Card>
);

// Mock system data
const MOCK_VITALS = {
  cpu: { percentage: 42, subtitle: 'Apple M4', details: [
    { label: 'user', value: '26.3%' },
    { label: 'sys', value: '15.8%' },
    { label: 'idle', value: '57.9%' },
    { label: 'cores', value: '10' },
  ]},
  memory: { percentage: 74, details: [
    { label: 'used of total', value: '11.9 GB of 16.0 GB' },
    { label: 'available', value: '4.1 GB' },
  ]},
  disk: { percentage: 34, details: [
    { label: 'used of total', value: '157.2 GB of 460.4 GB' },
    { label: 'available', value: '266.4 GB' },
  ]},
};

export default function SystemVitals() {
  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">System Vitals</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Uptime: 4 days</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <VitalBar
            icon={Cpu}
            label="CPU"
            percentage={MOCK_VITALS.cpu.percentage}
            subtitle={MOCK_VITALS.cpu.subtitle}
            details={MOCK_VITALS.cpu.details}
          />
          <VitalBar
            icon={MemoryStick}
            label="Memory"
            percentage={MOCK_VITALS.memory.percentage}
            details={MOCK_VITALS.memory.details}
          />
          <VitalBar
            icon={HardDrive}
            label="Disk"
            percentage={MOCK_VITALS.disk.percentage}
            details={MOCK_VITALS.disk.details}
            statusColor="success"
          />
          <TemperatureCard />
        </div>
      </CardContent>
    </Card>
  );
}
