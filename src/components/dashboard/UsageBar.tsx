import { motion } from 'framer-motion';
import { Activity, Clock, Zap, DollarSign, Target, Timer, ArrowUp, Layers } from 'lucide-react';
import { UsageMetrics } from '@/data/types';

interface UsageBarProps {
  metrics: UsageMetrics;
}

const MetricItem = ({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) => (
  <div className="metric-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className={`w-3.5 h-3.5 ${color || 'text-primary'}`} />
      <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
    </div>
    <span className="text-lg font-semibold text-foreground leading-tight">{value}</span>
    {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
  </div>
);

const UsageBar = ({ metrics }: UsageBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-4 lg:grid-cols-8 gap-2"
    >
      <MetricItem icon={Activity} label="Active" value={metrics.activeTasks} color="text-primary" />
      <MetricItem icon={Layers} label="Queued" value={metrics.queuedTasks} color="text-warning" />
      <MetricItem icon={Target} label="Done Today" value={metrics.completedToday} color="text-success" />
      <MetricItem icon={Zap} label="Tokens" value={`${(metrics.estimatedTokens / 1000).toFixed(0)}k`} />
      <MetricItem icon={DollarSign} label="Cost" value={`$${metrics.estimatedCost.toFixed(2)}`} sub="today" />
      <MetricItem icon={Target} label="Success" value={`${(metrics.successRate * 100).toFixed(0)}%`} color="text-success" />
      <MetricItem icon={Timer} label="Avg Time" value={`${Math.floor(metrics.avgCompletionTime / 60)}m`} sub={`${metrics.avgCompletionTime % 60}s`} />
      <MetricItem icon={ArrowUp} label="Uptime" value={`${metrics.uptime}%`} color="text-success" />
    </motion.div>
  );
};

export default UsageBar;
