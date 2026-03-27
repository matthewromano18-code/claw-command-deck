// ─── useGatewayConnection Hook ─────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { gatewayConnection } from '@/services/openclaw';
import type { ConnectionState, GatewayInfo, AuthChallenge } from '@/services/openclaw/types';

export function useGatewayConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(gatewayConnection.getState());
  const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo | null>(gatewayConnection.getGatewayInfo());
  const [authChallenge, setAuthChallenge] = useState<AuthChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      gatewayConnection.on('state_change', (event) => {
        const { current } = event.payload as { current: ConnectionState };
        setConnectionState(current);
      }),
      gatewayConnection.on('gateway_info', (event) => {
        setGatewayInfo(event.payload as GatewayInfo);
      }),
      gatewayConnection.on('auth_challenge', (event) => {
        setAuthChallenge(event.payload as AuthChallenge);
      }),
      gatewayConnection.on('error', (event) => {
        setError((event.payload as { message: string }).message);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const connect = useCallback(() => gatewayConnection.connect(), []);
  const disconnect = useCallback(() => gatewayConnection.disconnect(), []);
  const reconnect = useCallback(() => gatewayConnection.reconnect(), []);
  const respondToAuth = useCallback(
    (response: Parameters<typeof gatewayConnection.respondToAuth>[0]) =>
      gatewayConnection.respondToAuth(response),
    []
  );

  return {
    connectionState,
    gatewayInfo,
    authChallenge,
    error,
    connect,
    disconnect,
    reconnect,
    respondToAuth,
    clearError: () => setError(null),
  };
}
