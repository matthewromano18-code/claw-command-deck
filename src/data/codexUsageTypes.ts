// ─── Codex / OpenAI Usage Tracking Types ───────────────────

export type UsageHealthStatus = 'healthy' | 'warning' | 'critical';
export type TimeRange = '1h' | 'today' | '7d' | '30d';

export interface CodexUsageSummary {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  requestsMade: number;
  estimatedCost: number;
  remainingQuota: number | null; // null if unknown
  quotaLimit: number | null;
}

export interface CodexUsageHealth {
  status: UsageHealthStatus;
  message: string;
  resetTime: string | null; // ISO timestamp
  rateLimitState: 'ok' | 'approaching' | 'limited';
  rateLimitRemaining: number | null;
  rateLimitTotal: number | null;
}

export interface CodexUsageDataPoint {
  timestamp: string;
  tokens: number;
  requests: number;
  cost: number;
}

export interface CodexUsageBreakdown {
  label: string;
  tokens: number;
  requests: number;
  cost: number;
  percentage: number;
}

export type UsageEventType =
  | 'request_sent'
  | 'request_completed'
  | 'token_spike'
  | 'rate_limit_warning'
  | 'quota_warning';

export interface CodexUsageEvent {
  id: string;
  type: UsageEventType;
  timestamp: string;
  model: string;
  tokenCount: number;
  requestType: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

export type BreakdownCategory = 'model' | 'workflow' | 'client' | 'session' | 'taskType';

export interface CodexUsageStore {
  summary: CodexUsageSummary;
  health: CodexUsageHealth;
  trends: Record<TimeRange, CodexUsageDataPoint[]>;
  breakdowns: Record<BreakdownCategory, CodexUsageBreakdown[]>;
  recentEvents: CodexUsageEvent[];
  lastUpdated: string;
}
