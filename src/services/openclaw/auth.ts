// ─── OpenClaw Auth Service ─────────────────────────────────
// Handles challenge/response, device pairing, token management.
// Currently stubbed — wire to real gateway post-export.

import type { AuthChallenge, AuthResponse, DeviceIdentity } from './types';
import { STORAGE_KEYS } from './config';
import { platform } from '../platform';

export class AuthService {
  private pendingChallenge: AuthChallenge | null = null;

  getPendingChallenge(): AuthChallenge | null {
    return this.pendingChallenge;
  }

  setChallenge(challenge: AuthChallenge): void {
    this.pendingChallenge = challenge;
  }

  clearChallenge(): void {
    this.pendingChallenge = null;
  }

  createTokenResponse(token: string): AuthResponse {
    return { type: 'token', value: token };
  }

  createPasswordResponse(password: string): AuthResponse {
    return { type: 'password', value: password };
  }

  createPairApproval(code: string): AuthResponse {
    return { type: 'device_approve', value: code };
  }

  async getStoredToken(): Promise<string | null> {
    return platform.storage.get<string>(STORAGE_KEYS.authToken);
  }

  async clearStoredAuth(): Promise<void> {
    await platform.storage.remove(STORAGE_KEYS.authToken);
    await platform.storage.remove(STORAGE_KEYS.deviceIdentity);
  }

  async getDeviceIdentity(): Promise<DeviceIdentity | null> {
    return platform.storage.get<DeviceIdentity>(STORAGE_KEYS.deviceIdentity);
  }

  generateDeviceId(): string {
    return `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const authService = new AuthService();
