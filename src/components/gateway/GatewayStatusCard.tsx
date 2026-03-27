// ─── Gateway Status Card ───────────────────────────────────
import { useGatewayConnection } from '@/hooks/useGatewayConnection';
import { isBrowser } from '@/services/desktop';
import { Wifi, WifiOff, Loader2, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Link2, Unlink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  disconnected: {
    label: 'Disconnected',
    color: 'text-muted-foreground',
    icon: WifiOff,
    description: 'Not connected to OpenClaw Gateway',
  },
  connecting: {
    label: 'Connecting…',
    color: 'text-warning',
    icon: Loader2,
    description: 'Establishing connection to gateway',
  },
  pairing_required: {
    label: 'Pairing Required',
    color: 'text-warning',
    icon: ShieldAlert,
    description: 'Approve this device on the gateway',
  },
  auth_required: {
    label: 'Auth Required',
    color: 'text-warning',
    icon: ShieldAlert,
    description: 'Authentication credentials needed',
  },
  connected: {
    label: 'Connected',
    color: 'text-success',
    icon: ShieldCheck,
    description: 'Live connection to OpenClaw Gateway',
  },
  reconnecting: {
    label: 'Reconnecting…',
    color: 'text-warning',
    icon: RefreshCw,
    description: 'Connection lost — attempting reconnect',
  },
  incompatible_version: {
    label: 'Version Mismatch',
    color: 'text-destructive',
    icon: AlertTriangle,
    description: 'Gateway version is incompatible',
  },
  gateway_offline: {
    label: 'Gateway Offline',
    color: 'text-destructive',
    icon: WifiOff,
    description: isBrowser() ? 'Gateway not reachable (browser mode)' : 'Gateway not running — start it from terminal',
  },
};

export default function GatewayStatusCard() {
  const { connectionState, gatewayInfo, connect, disconnect, reconnect } = useGatewayConnection();
  const cfg = STATE_CONFIG[connectionState] || STATE_CONFIG.disconnected;
  const Icon = cfg.icon;
  const isSpinning = connectionState === 'connecting' || connectionState === 'reconnecting';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-muted ${cfg.color}`}>
            <Icon className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">OpenClaw Gateway</h3>
            <p className="text-xs text-muted-foreground">{cfg.description}</p>
          </div>
        </div>
        <span className={`text-xs font-mono font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Gateway info when connected */}
      <AnimatePresence>
        {connectionState === 'connected' && gatewayInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-muted/50 p-2">
                <span className="text-muted-foreground">Version</span>
                <p className="font-mono text-foreground">{gatewayInfo.version}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <span className="text-muted-foreground">Agents</span>
                <p className="font-mono text-foreground">{gatewayInfo.agentCount}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <span className="text-muted-foreground">Uptime</span>
                <p className="font-mono text-foreground">{Math.floor(gatewayInfo.uptime / 60)}m</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error states */}
      <AnimatePresence>
        {connectionState === 'gateway_offline' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs space-y-1">
              <p className="font-medium text-destructive">Gateway Not Reachable</p>
              <p className="text-muted-foreground">
                {isBrowser()
                  ? 'Running in browser mode. Export to desktop to connect to a local gateway.'
                  : 'Ensure OpenClaw Gateway is installed and running: openclaw gateway start'}
              </p>
            </div>
          </motion.div>
        )}

        {connectionState === 'incompatible_version' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs space-y-1">
              <p className="font-medium text-warning">Incompatible Version</p>
              <p className="text-muted-foreground">
                Update your gateway: openclaw gateway update
              </p>
            </div>
          </motion.div>
        )}

        {connectionState === 'pairing_required' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs space-y-1">
              <p className="font-medium text-warning">Pairing Pending</p>
              <p className="text-muted-foreground">
                Approve this device on the OpenClaw Gateway to continue.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-2">
        {connectionState === 'disconnected' || connectionState === 'gateway_offline' ? (
          <button
            onClick={connect}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            Connect
          </button>
        ) : connectionState === 'connected' ? (
          <button
            onClick={disconnect}
            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <Unlink className="h-3.5 w-3.5" />
            Disconnect
          </button>
        ) : null}

        {(connectionState === 'reconnecting' || connectionState === 'incompatible_version' || connectionState === 'auth_required') && (
          <button
            onClick={reconnect}
            className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}
