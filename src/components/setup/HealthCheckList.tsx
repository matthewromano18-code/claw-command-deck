// ─── Health Check List ─────────────────────────────────────
import { CheckCircle2, XCircle, AlertTriangle, Loader2, SkipForward } from 'lucide-react';
import type { HealthCheck, CheckStatus } from '@/services/openclaw/health-checker';
import { motion } from 'framer-motion';

const STATUS_ICON: Record<CheckStatus, React.ElementType> = {
  pass: CheckCircle2,
  fail: XCircle,
  warn: AlertTriangle,
  checking: Loader2,
  skipped: SkipForward,
};

const STATUS_COLOR: Record<CheckStatus, string> = {
  pass: 'text-success',
  fail: 'text-destructive',
  warn: 'text-warning',
  checking: 'text-muted-foreground',
  skipped: 'text-muted-foreground',
};

interface HealthCheckListProps {
  checks: HealthCheck[];
}

export default function HealthCheckList({ checks }: HealthCheckListProps) {
  return (
    <div className="space-y-1">
      {checks.map((check, i) => {
        const Icon = STATUS_ICON[check.status];
        const color = STATUS_COLOR[check.status];
        return (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${color} ${check.status === 'checking' ? 'animate-spin' : ''}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{check.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {check.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {check.detail || check.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
