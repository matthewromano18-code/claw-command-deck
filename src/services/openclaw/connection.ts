// ─── OpenClaw Gateway Connection Manager ───────────────────
// Pure TypeScript state machine — no React imports.
import type {
  ConnectionState,
  ConnectionConfig,
  GatewayMessage,
  ConnectionEvent,
  ConnectionEventType,
  AuthChallenge,
  AuthResponse,
  GatewayInfo,
  DeviceIdentity,
} from './types';
import { DEFAULT_GATEWAY_CONFIG, STORAGE_KEYS } from './config';
import { platform } from '../platform';

type Listener<T = unknown> = (event: ConnectionEvent<T>) => void;

export class GatewayConnection {
  private state: ConnectionState = 'disconnected';
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private listeners = new Map<ConnectionEventType | '*', Set<Listener>>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private deviceIdentity: DeviceIdentity | null = null;
  private gatewayInfo: GatewayInfo | null = null;

  constructor(config?: Partial<ConnectionConfig>) {
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config };
  }

  // ── Public API ──────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') return;

    await this.loadDeviceIdentity();
    this.setState('connecting');
    this.reconnectAttempts = 0;
    this.createWebSocket();
  }

  disconnect(): void {
    this.clearTimers();
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.setState('disconnected');
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  sendMessage(type: string, payload: Record<string, unknown> = {}): void {
    if (this.state !== 'connected' || !this.ws) {
      console.warn('[Gateway] Cannot send — not connected');
      return;
    }
    const msg: GatewayMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    this.ws.send(JSON.stringify(msg));
  }

  respondToAuth(response: AuthResponse): void {
    this.sendMessage('auth.response', response as unknown as Record<string, unknown>);
  }

  getState(): ConnectionState {
    return this.state;
  }

  getGatewayInfo(): GatewayInfo | null {
    return this.gatewayInfo;
  }

  getConfig(): ConnectionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...updates };
    platform.storage.set(STORAGE_KEYS.connectionConfig, this.config);
  }

  // ── Subscribe ───────────────────────────────────────────

  on<T = unknown>(type: ConnectionEventType | '*', listener: Listener<T>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener as Listener);
    return () => this.listeners.get(type)?.delete(listener as Listener);
  }

  // ── Internal ────────────────────────────────────────────

  private setState(newState: ConnectionState): void {
    const prev = this.state;
    this.state = newState;
    this.emit('state_change', { prev, current: newState });
  }

  private emit<T>(type: ConnectionEventType, payload: T): void {
    const event: ConnectionEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.listeners.get(type)?.forEach((fn) => fn(event as ConnectionEvent));
    this.listeners.get('*')?.forEach((fn) => fn(event as ConnectionEvent));
  }

  private createWebSocket(): void {
    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.connectionTimer = setTimeout(() => {
        if (this.state === 'connecting') {
          this.ws?.close();
          this.setState('gateway_offline');
          this.scheduleReconnect();
        }
      }, this.config.connectionTimeout);

      this.ws.onopen = () => {
        this.clearConnectionTimer();
        // Don't set connected yet — wait for handshake/auth
        this.sendMessage('connect.hello', {
          client: 'mission-control',
          version: '2.0.0',
          deviceId: this.deviceIdentity?.deviceId,
          deviceToken: this.deviceIdentity?.token,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: GatewayMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch {
          console.warn('[Gateway] Invalid message:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        this.clearTimers();
        if (event.code === 1000) {
          this.setState('disconnected');
        } else {
          this.setState('reconnecting');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.emit('error', { message: 'WebSocket error' });
      };
    } catch {
      this.setState('gateway_offline');
      this.scheduleReconnect();
    }
  }

  private handleMessage(msg: GatewayMessage): void {
    switch (msg.type) {
      case 'connect.welcome':
        this.gatewayInfo = msg.payload as unknown as GatewayInfo;
        this.setState('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('gateway_info', this.gatewayInfo);
        break;

      case 'connect.version_mismatch':
        this.setState('incompatible_version');
        break;

      case 'connect.pair_required':
        this.setState('pairing_required');
        break;

      case 'connect.auth_required':
      case 'auth.challenge':
        this.setState('auth_required');
        this.emit('auth_challenge', msg.payload as AuthChallenge);
        break;

      case 'auth.success':
        if (msg.payload.token) {
          this.saveAuthToken(msg.payload.token as string);
        }
        this.setState('connected');
        this.startHeartbeat();
        break;

      case 'auth.failure':
        this.setState('auth_required');
        this.emit('error', { message: 'Authentication failed' });
        break;

      case 'pair.approved':
        if (msg.payload.deviceId && msg.payload.token) {
          this.saveDeviceIdentity({
            deviceId: msg.payload.deviceId as string,
            deviceName: msg.payload.deviceName as string || 'Mission Control',
            token: msg.payload.token as string,
            pairedAt: new Date().toISOString(),
          });
        }
        this.setState('connected');
        this.startHeartbeat();
        break;

      case 'pong':
        // heartbeat acknowledged
        break;

      default:
        this.emit('message', msg);
        break;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendMessage('ping', {});
    }, this.config.heartbeatInterval);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState('gateway_offline');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    this.reconnectTimer = setTimeout(() => {
      if (this.state === 'reconnecting' || this.state === 'gateway_offline') {
        this.setState('connecting');
        this.createWebSocket();
      }
    }, delay);
  }

  private clearTimers(): void {
    this.clearConnectionTimer();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private async loadDeviceIdentity(): Promise<void> {
    this.deviceIdentity = await platform.storage.get<DeviceIdentity>(STORAGE_KEYS.deviceIdentity);
  }

  private async saveDeviceIdentity(identity: DeviceIdentity): Promise<void> {
    this.deviceIdentity = identity;
    await platform.storage.set(STORAGE_KEYS.deviceIdentity, identity);
  }

  private async saveAuthToken(token: string): Promise<void> {
    await platform.storage.set(STORAGE_KEYS.authToken, token);
    if (this.deviceIdentity) {
      this.deviceIdentity.token = token;
      await this.saveDeviceIdentity(this.deviceIdentity);
    }
  }
}

// Singleton
export const gatewayConnection = new GatewayConnection();
