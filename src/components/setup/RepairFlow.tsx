// ─── Repair Flow Panel ─────────────────────────────────────
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Download, Play, RotateCcw, Terminal, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import type { SetupState } from '@/services/openclaw/health-checker';
import { installGateway, startGateway, restartGateway, runConfigure } from '@/services/desktop/gateway-commands';
import { isBrowser } from '@/services/desktop/system-info';

interface RepairFlowProps {
  state: SetupState;
  onRefresh: () => void;
}

interface RepairStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => Promise<void>;
  applicable: (state: SetupState) => boolean;
}

const REPAIR_STEPS: RepairStep[] = [
  {
    id: 'install-cli',
    label: 'Install OpenClaw CLI',
    description: 'Download and install the openclaw command-line tool',
    icon: Download,
    action: async () => { /* guide user to install */ },
    applicable: (s) => s === 'cli_missing',
  },
  {
    id: 'install-gateway',
    label: 'Install Gateway Service',
    description: 'Register the gateway as a local service',
    icon: Download,
    action: async () => { await installGateway(); },
    applicable: (s) => s === 'gateway_not_installed',
  },
  {
    id: 'start-gateway',
    label: 'Start Gateway',
    description: 'Launch the gateway service',
    icon: Play,
    action: async () => { await startGateway(); },
    applicable: (s) => s === 'gateway_stopped' || s === 'gateway_not_installed',
  },
  {
    id: 'restart-gateway',
    label: 'Restart Gateway',
    description: 'Stop and restart the gateway service',
    icon: RotateCcw,
    action: async () => { await restartGateway(); },
    applicable: (s) => s === 'config_invalid' || s === 'version_mismatch' || s === 'reconnecting',
  },
  {
    id: 'run-configure',
    label: 'Run Setup Wizard',
    description: 'Run openclaw configure to set up providers and models',
    icon: Terminal,
    action: async () => { await runConfigure(); },
    applicable: (s) => s === 'config_invalid' || s === 'cli_missing',
  },
];

export default function RepairFlow({ state, onRefresh }: RepairFlowProps) {
  const [running, setRunning] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const applicableSteps = REPAIR_STEPS.filter((s) => s.applicable(state));
  const browserMode = isBrowser();

  const runStep = async (step: RepairStep) => {
    setRunning(step.id);
    try {
      await step.action();
      setCompleted((prev) => new Set([...prev, step.id]));
      // Re-run detection after each step
      setTimeout(onRefresh, 1000);
    } catch {
      // Error handling
    } finally {
      setRunning(null);
    }
  };

  if (state === 'connected_healthy') {
    return (
      <div className="glass-panel p-4 text-center">
        <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">System Healthy</p>
        <p className="text-xs text-muted-foreground">No repairs needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Repair & Recovery</h2>
      </div>

      {browserMode && (
        <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-xs text-warning">
          Running in browser mode — repair actions require the desktop app.
        </div>
      )}

      <div className="space-y-2">
        {applicableSteps.length === 0 ? (
          <div className="glass-panel p-4 text-center">
            <p className="text-xs text-muted-foreground">No repair actions available for current state</p>
          </div>
        ) : (
          applicableSteps.map((step, i) => {
            const Icon = step.icon;
            const isRunning = running === step.id;
            const isDone = completed.has(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel p-3 flex items-center gap-3"
              >
                <div className={`p-1.5 rounded-lg ${isDone ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <button
                  onClick={() => runStep(step)}
                  disabled={isRunning || isDone || browserMode}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  {isDone ? 'Done' : isRunning ? 'Running…' : 'Run'}
                  {!isDone && !isRunning && <ArrowRight className="h-3 w-3" />}
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
