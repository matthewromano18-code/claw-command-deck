// ─── Auth Dialog ───────────────────────────────────────────
import { useState } from 'react';
import { useGatewayConnection } from '@/hooks/useGatewayConnection';
import { authService } from '@/services/openclaw';
import { ShieldAlert, Key, Eye, EyeOff } from 'lucide-react';

export default function AuthDialog() {
  const { authChallenge, respondToAuth, connectionState } = useGatewayConnection();
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);

  if (connectionState !== 'auth_required' || !authChallenge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const response =
      authChallenge.type === 'token'
        ? authService.createTokenResponse(value)
        : authService.createPasswordResponse(value);

    respondToAuth(response);
    setValue('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-warning/10 p-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Authentication Required</h2>
            <p className="text-xs text-muted-foreground">{authChallenge.message}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showValue ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={authChallenge.type === 'token' ? 'Enter token…' : 'Enter password…'}
              className="w-full rounded-lg border border-border bg-muted pl-10 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
