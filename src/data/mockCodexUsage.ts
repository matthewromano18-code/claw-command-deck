import {
  CodexUsageStore,
  CodexUsageDataPoint,
  CodexUsageBreakdown,
  CodexUsageEvent,
  TimeRange,
  BreakdownCategory,
} from './codexUsageTypes';

// ─── Helpers ───────────────────────────────────────────────
const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const genTrend = (count: number, intervalMin: number, baseTokens: number): CodexUsageDataPoint[] =>
  Array.from({ length: count }, (_, i) => ({
    timestamp: ago((count - i) * intervalMin),
    tokens: Math.round(baseTokens + Math.random() * baseTokens * 0.6 - baseTokens * 0.3),
    requests: Math.round(3 + Math.random() * 8),
    cost: parseFloat((0.002 + Math.random() * 0.008).toFixed(4)),
  }));

// ─── Trends ────────────────────────────────────────────────
const trends: Record<TimeRange, CodexUsageDataPoint[]> = {
  '1h': genTrend(12, 5, 1200),
  today: genTrend(24, 60, 4800),
  '7d': genTrend(7, 1440, 32000),
  '30d': genTrend(30, 1440, 28000),
};

// ─── Breakdowns ────────────────────────────────────────────
const modelBreakdown: CodexUsageBreakdown[] = [
  { label: 'gpt-4o', tokens: 184200, requests: 312, cost: 3.68, percentage: 52 },
  { label: 'gpt-4o-mini', tokens: 98400, requests: 487, cost: 0.49, percentage: 28 },
  { label: 'o3-mini', tokens: 42600, requests: 64, cost: 1.07, percentage: 12 },
  { label: 'codex-mini', tokens: 28300, requests: 143, cost: 0.14, percentage: 8 },
];

const workflowBreakdown: CodexUsageBreakdown[] = [
  { label: 'Code Generation', tokens: 142000, requests: 220, cost: 2.84, percentage: 40 },
  { label: 'Research', tokens: 89000, requests: 310, cost: 1.34, percentage: 25 },
  { label: 'Analysis', tokens: 71000, requests: 180, cost: 0.71, percentage: 20 },
  { label: 'Chat / Q&A', tokens: 35500, requests: 150, cost: 0.36, percentage: 10 },
  { label: 'Other', tokens: 16000, requests: 146, cost: 0.13, percentage: 5 },
];

const clientBreakdown: CodexUsageBreakdown[] = [
  { label: 'Mission Control', tokens: 198000, requests: 540, cost: 3.12, percentage: 56 },
  { label: 'CLI Agent', tokens: 95500, requests: 290, cost: 1.43, percentage: 27 },
  { label: 'API Direct', tokens: 60000, requests: 176, cost: 0.83, percentage: 17 },
];

const sessionBreakdown: CodexUsageBreakdown[] = [
  { label: 'Session #A8F2', tokens: 62000, requests: 84, cost: 1.24, percentage: 35 },
  { label: 'Session #C1D4', tokens: 44800, requests: 62, cost: 0.90, percentage: 25 },
  { label: 'Session #E7B9', tokens: 38400, requests: 51, cost: 0.58, percentage: 22 },
  { label: 'Other Sessions', tokens: 32000, requests: 109, cost: 0.48, percentage: 18 },
];

const taskTypeBreakdown: CodexUsageBreakdown[] = [
  { label: 'Code Review', tokens: 88000, requests: 140, cost: 1.76, percentage: 33 },
  { label: 'Bug Fix', tokens: 62000, requests: 98, cost: 0.93, percentage: 23 },
  { label: 'Feature Build', tokens: 54000, requests: 74, cost: 1.08, percentage: 20 },
  { label: 'Documentation', tokens: 36000, requests: 120, cost: 0.18, percentage: 14 },
  { label: 'Refactor', tokens: 26500, requests: 44, cost: 0.53, percentage: 10 },
];

const breakdowns: Record<BreakdownCategory, CodexUsageBreakdown[]> = {
  model: modelBreakdown,
  workflow: workflowBreakdown,
  client: clientBreakdown,
  session: sessionBreakdown,
  taskType: taskTypeBreakdown,
};

// ─── Events ────────────────────────────────────────────────
const recentEvents: CodexUsageEvent[] = [
  { id: 'evt-1', type: 'request_completed', timestamp: ago(2), model: 'gpt-4o', tokenCount: 3840, requestType: 'code_gen', status: 'success', message: 'Code generation completed' },
  { id: 'evt-2', type: 'token_spike', timestamp: ago(8), model: 'gpt-4o', tokenCount: 12400, requestType: 'analysis', status: 'warning', message: 'Token spike detected — 12.4k in single request' },
  { id: 'evt-3', type: 'request_completed', timestamp: ago(14), model: 'gpt-4o-mini', tokenCount: 890, requestType: 'chat', status: 'success', message: 'Chat response delivered' },
  { id: 'evt-4', type: 'rate_limit_warning', timestamp: ago(22), model: 'gpt-4o', tokenCount: 0, requestType: 'system', status: 'warning', message: 'Approaching rate limit — 82% consumed' },
  { id: 'evt-5', type: 'request_completed', timestamp: ago(31), model: 'o3-mini', tokenCount: 5200, requestType: 'research', status: 'success', message: 'Research task completed' },
  { id: 'evt-6', type: 'request_sent', timestamp: ago(35), model: 'codex-mini', tokenCount: 1100, requestType: 'code_review', status: 'success', message: 'Code review request dispatched' },
  { id: 'evt-7', type: 'quota_warning', timestamp: ago(48), model: 'gpt-4o', tokenCount: 0, requestType: 'system', status: 'warning', message: 'Monthly quota 78% consumed' },
  { id: 'evt-8', type: 'request_completed', timestamp: ago(55), model: 'gpt-4o-mini', tokenCount: 620, requestType: 'doc_gen', status: 'success', message: 'Documentation generated' },
];

// ─── Full Store ────────────────────────────────────────────
export const mockCodexUsage: CodexUsageStore = {
  summary: {
    totalTokens: 353500,
    inputTokens: 212100,
    outputTokens: 127080,
    cachedTokens: 14320,
    requestsMade: 1006,
    estimatedCost: 5.38,
    remainingQuota: 646500,
    quotaLimit: 1_000_000,
  },
  health: {
    status: 'healthy',
    message: 'All systems nominal — usage within limits',
    resetTime: new Date(Date.now() + 4 * 3600_000).toISOString(),
    rateLimitState: 'ok',
    rateLimitRemaining: 4200,
    rateLimitTotal: 5000,
  },
  trends,
  breakdowns,
  recentEvents,
  lastUpdated: new Date().toISOString(),
};
