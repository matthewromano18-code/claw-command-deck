// ─── OpenClaw Gateway Configuration ────────────────────────
import type { ConnectionConfig } from './types';

export const DEFAULT_GATEWAY_CONFIG: ConnectionConfig = {
  wsUrl: 'ws://127.0.0.1:18789',
  httpUrl: 'http://127.0.0.1:18789',
  reconnectInterval: 3000,
  maxReconnectAttempts: 20,
  heartbeatInterval: 15000,
  connectionTimeout: 10000,
};

export const STORAGE_KEYS = {
  deviceIdentity: 'openclaw:device-identity',
  connectionConfig: 'openclaw:connection-config',
  authToken: 'openclaw:auth-token',
} as const;

export const GATEWAY_ENDPOINTS = {
  status: '/api/status',
  agents: '/api/agents',
  tasks: '/api/tasks',
  events: '/api/events',
  auth: '/api/auth',
  pair: '/api/pair',
  version: '/api/version',
} as const;
