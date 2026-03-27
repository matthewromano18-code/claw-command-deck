// ─── Health Score Ring ──────────────────────────────────────
import { motion } from 'framer-motion';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'unknown';
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'hsl(var(--success))',
  degraded: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
  unknown: 'hsl(var(--muted-foreground))',
};

export default function HealthScoreRing({ score, size = 96, overallStatus }: HealthScoreRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = STATUS_COLORS[overallStatus] || STATUS_COLORS.unknown;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Health</span>
      </div>
    </div>
  );
}
