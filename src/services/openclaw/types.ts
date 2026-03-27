// ─── OpenClaw Gateway Types ────────────────────────────────

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'pairing_required'
  | 'auth_required'
  | 'connected'
  | 'reconnecting'
  | 'incompatible_version'
  | 'gateway_offline';

export interface GatewayInfo {
  version: string;
  uptime: number;
  agentCount: number;
  status: 'running' | 'stopped' | 'error';
}

export interface GatewayMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  id?: string;
}

export interface AuthChallenge {
  type: 'token' | 'password' | 'device_pair';
  message: string;
  deviceId?: string;
}

export interface AuthResponse {
  type: 'token' | 'password' | 'device_approve';
  value: string;
}

export interface DeviceIdentity {
  deviceId: string;
  deviceName: string;
  token?: string;
  pairedAt?: string;
}

export interface ConnectionConfig {
  wsUrl: string;
  httpUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export type ConnectionEventType =
  | 'state_change'
  | 'message'
  | 'error'
  | 'gateway_info'
  | 'auth_challenge';

export interface ConnectionEvent<T = unknown> {
  type: ConnectionEventType;
  payload: T;
  timestamp: string;
}
