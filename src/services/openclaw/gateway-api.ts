// ─── OpenClaw Gateway REST API Client ──────────────────────
import { DEFAULT_GATEWAY_CONFIG, GATEWAY_ENDPOINTS, STORAGE_KEYS } from './config';
import { platform } from '../platform';
import type { GatewayInfo } from './types';

class GatewayAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || DEFAULT_GATEWAY_CONFIG.httpUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await platform.storage.get<string>(STORAGE_KEYS.authToken);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });
    if (!res.ok) {
      throw new GatewayAPIError(res.status, await res.text());
    }
    return res.json();
  }

  async getStatus(): Promise<GatewayInfo> {
    return this.request<GatewayInfo>(GATEWAY_ENDPOINTS.status);
  }

  async getAgents(): Promise<unknown[]> {
    return this.request<unknown[]>(GATEWAY_ENDPOINTS.agents);
  }

  async getTasks(): Promise<unknown[]> {
    return this.request<unknown[]>(GATEWAY_ENDPOINTS.tasks);
  }

  async getEvents(): Promise<unknown[]> {
    return this.request<unknown[]>(GATEWAY_ENDPOINTS.events);
  }

  async submitTask(prompt: string, priority?: string): Promise<unknown> {
    return this.request(GATEWAY_ENDPOINTS.tasks, {
      method: 'POST',
      body: JSON.stringify({ prompt, priority }),
    });
  }

  async checkVersion(): Promise<{ version: string; compatible: boolean }> {
    return this.request(GATEWAY_ENDPOINTS.version);
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

export class GatewayAPIError extends Error {
  constructor(public status: number, public body: string) {
    super(`Gateway API error ${status}: ${body}`);
    this.name = 'GatewayAPIError';
  }
}

export const gatewayAPI = new GatewayAPI();
