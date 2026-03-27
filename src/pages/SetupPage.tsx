// ─── Setup Page ────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { useOpenClawSetup } from '@/hooks/useOpenClawSetup';
import { useGatewayConnection } from '@/hooks/useGatewayConnection';
import GatewayStatusCard from '@/components/gateway/GatewayStatusCard';
import HealthScoreRing from '@/components/setup/HealthScoreRing';
import HealthCheckList from '@/components/setup/HealthCheckList';
import ConfigCenter from '@/components/setup/ConfigCenter';
import RepairFlow from '@/components/setup/RepairFlow';

const STATE_LABELS: Record<string, { label: string; description: string }> = {
  cli_missing: { label: 'CLI Not Found', description: 'Install OpenClaw to get started' },
  gateway_not_installed: { label: 'Gateway Not Installed', description: 'Install the gateway service' },
  gateway_stopped: { label: 'Gateway Stopped', description: 'Start the gateway to connect' },
  gateway_starting: { label: 'Gateway Starting', description: 'Waiting for gateway to come online' },
  gateway_running_no_auth: { label: 'Auth Required', description: 'Authenticate to access the gateway' },
  pairing_required: { label: 'Pairing Required', description: 'Approve this device on the gateway' },
  reconnecting: { label: 'Reconnecting', description: 'Attempting to re-establish connection' },
  config_invalid: { label: 'Config Invalid', description: 'Fix configuration errors' },
  version_mismatch: { label: 'Version Mismatch', description: 'Update your gateway or client' },
  connected_healthy: { label: 'Connected', description: 'System is operational' },
};

const SetupPage = () => {
  const { snapshot, loading, state, report, score, isDemoMode, runDetection } = useOpenClawSetup();
  const { connectionState } = useGatewayConnection();
  const [activeTab, setActiveTab] = useState<'health' | 'config' | 'repair'>('health');

  useEffect(() => {
    if (!snapshot) {
      runDetection();
    }
  }, [snapshot, runDetection]);

  const stateInfo = STATE_LABELS[state] || STATE_LABELS.cli_missing;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Setup & Health
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            OpenClaw system status, configuration, and repair
          </p>
        </div>
        <button
          onClick={runDetection}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-scan
        </button>
      </div>

      {/* Demo mode banner */}
      {isDemoMode && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-warning">Demo Mode</p>
            <p className="text-[11px] text-muted-foreground">
              No live gateway connection — showing simulated data. Connect to a gateway for real operations.
            </p>
          </div>
        </motion.div>
      )}

      {/* Top row: score + gateway status + state */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health Score */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <HealthScoreRing
            score={score}
            overallStatus={report?.overallStatus || 'unknown'}
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{stateInfo.label}</p>
            <p className="text-xs text-muted-foreground">{stateInfo.description}</p>
            {report && (
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {report.checks.filter((c) => c.status === 'pass').length}/{report.checks.length} checks passed
              </p>
            )}
          </div>
        </div>

        {/* Gateway Status */}
        <GatewayStatusCard />

        {/* Quick Summary */}
        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Connection</span>
              <p className="font-mono text-foreground capitalize">{connectionState}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mode</span>
              <p className="font-mono text-foreground">{isDemoMode ? 'Demo' : 'Live'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Checks</span>
              <p className="font-mono text-foreground">{report?.checks.length ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Score</span>
              <p className="font-mono text-foreground">{score}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border pb-px">
        {(['health', 'config', 'repair'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-card text-primary border border-border border-b-card -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'health' ? 'Health Checks' : tab === 'config' ? 'Configuration' : 'Repair'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'health' && report && (
          <div className="glass-panel p-4">
            <HealthCheckList checks={report.checks} />
          </div>
        )}
        {activeTab === 'health' && !report && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-muted-foreground">Run a scan to see health checks</p>
          </div>
        )}
        {activeTab === 'config' && <ConfigCenter />}
        {activeTab === 'repair' && <RepairFlow state={state} onRefresh={runDetection} />}
      </motion.div>
    </div>
  );
};

export default SetupPage;
