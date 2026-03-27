// ─── Pairing Dialog ────────────────────────────────────────
import { useGatewayConnection } from '@/hooks/useGatewayConnection';
import { Loader2, Smartphone } from 'lucide-react';

export default function PairingDialog() {
  const { connectionState, disconnect } = useGatewayConnection();

  if (connectionState !== 'pairing_required') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-5 shadow-2xl text-center">
        <div className="mx-auto w-fit rounded-xl bg-warning/10 p-3">
          <Smartphone className="h-8 w-8 text-warning" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Device Pairing</h2>
          <p className="text-sm text-muted-foreground">
            Approve this device on your OpenClaw Gateway to continue.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Waiting for approval…
        </div>

        <button
          onClick={disconnect}
          className="w-full rounded-lg bg-muted py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
