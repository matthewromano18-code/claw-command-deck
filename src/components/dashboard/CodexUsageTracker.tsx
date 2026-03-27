import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Zap, ArrowDownRight, ArrowUpRight, Database, DollarSign,
  Activity, Shield, Clock, AlertTriangle, RefreshCw, Download,
  Copy, ExternalLink, TrendingUp, BarChart3,
  CircleDot, CheckCircle2, XCircle, AlertCircle, ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCodexUsage } from '@/hooks/useCodexUsage';
import { BreakdownCategory, UsageHealthStatus, UsageEventType } from '@/data/codexUsageTypes';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { toast } from '@/hooks/use-toast';

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const healthColor: Record<UsageHealthStatus, string> = {
  healthy: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  critical: 'bg-destructive text-destructive-foreground',
};

const eventIcon: Record<UsageEventType, React.ElementType> = {
  request_sent: ArrowUpRight,
  request_completed: CheckCircle2,
  token_spike: AlertTriangle,
  rate_limit_warning: AlertCircle,
  quota_warning: XCircle,
};

const eventColor: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
};

const breakdownLabels: Record<BreakdownCategory, string> = {
  model: 'Model',
  workflow: 'Workflow',
  client: 'Client',
  session: 'Session',
  taskType: 'Task Type',
};

const StatCard = ({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) => (
  <div className="metric-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className={`w-3.5 h-3.5 ${color || 'text-primary'}`} />
      <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
    </div>
    <span className="text-lg font-semibold text-foreground leading-tight font-mono">{value}</span>
    {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
  </div>
);

type ViewRange = '5h' | 'weekly';

const CodexUsageTracker = () => {
  const {
    store, selectedBreakdown, setSelectedBreakdown,
    isRefreshing, refresh, exportReport, copyDiagnostics,
  } = useCodexUsage();
  const [expanded, setExpanded] = useState(false);
  const [viewRange, setViewRange] = useState<ViewRange>('5h');
  const [chartMode, setChartMode] = useState<'tokens' | 'requests' | 'cost'>('tokens');

  const { summary, health, trends, breakdowns, recentEvents } = store;
  const breakdownData = breakdowns[selectedBreakdown];

  const quotaPct = summary.quotaLimit
    ? Math.round((summary.totalTokens / summary.quotaLimit) * 100)
    : null;

  return (
    <div className="space-y-0">
      {/* ── Collapsed Bar ── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full glass-panel p-2.5 flex items-center gap-3 hover:bg-accent/40 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Codex</span>
        </div>

        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-sm font-semibold font-mono text-foreground">{fmt(summary.totalTokens)}</span>
            <span className="text-[10px] text-muted-foreground">tokens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-semibold font-mono text-foreground">{fmt(summary.requestsMade)}</span>
            <span className="text-[10px] text-muted-foreground">req</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-warning" />
            <span className="text-sm font-semibold font-mono text-foreground">${summary.estimatedCost.toFixed(2)}</span>
          </div>
          {quotaPct !== null && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaPct > 90 ? 'bg-destructive' : quotaPct > 70 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(quotaPct, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{quotaPct}%</span>
            </div>
          )}
        </div>

        <Badge className={`${healthColor[health.status]} text-[9px] px-1.5 py-0 h-4`}>
          {health.status}
        </Badge>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                <StatCard icon={Zap} label="Total Tokens" value={fmt(summary.totalTokens)} color="text-primary" />
                <StatCard icon={ArrowDownRight} label="Input" value={fmt(summary.inputTokens)} color="text-info" />
                <StatCard icon={ArrowUpRight} label="Output" value={fmt(summary.outputTokens)} color="text-primary" />
                <StatCard icon={Database} label="Cached" value={fmt(summary.cachedTokens)} color="text-muted-foreground" />
                <StatCard icon={Activity} label="Requests" value={fmt(summary.requestsMade)} />
                <StatCard icon={DollarSign} label="Est. Cost" value={`$${summary.estimatedCost.toFixed(2)}`} color="text-warning" />
                <StatCard icon={Shield} label="Remaining" value={summary.remainingQuota !== null ? fmt(summary.remainingQuota) : '—'} sub={quotaPct !== null ? `${quotaPct}% used` : undefined} color="text-success" />
                <StatCard icon={Clock} label="Rate Limit" value={health.rateLimitRemaining !== null ? fmt(health.rateLimitRemaining) : '—'} color={health.rateLimitState === 'ok' ? 'text-success' : 'text-warning'} />
              </div>

              {/* Health */}
              <Card className="glass-panel">
                <CardContent className="p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={healthColor[health.status]}>{health.status.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">{health.message}</span>
                    </div>
                    {health.resetTime && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Resets {fmtTime(health.resetTime)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trends + Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3">
                <Card className="glass-panel">
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <CardTitle className="text-xs font-semibold">Trends</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tabs value={viewRange} onValueChange={(v) => setViewRange(v as ViewRange)}>
                          <TabsList className="h-6 p-0.5">
                            <TabsTrigger value="5h" className="text-[10px] px-2 h-5">5h</TabsTrigger>
                            <TabsTrigger value="weekly" className="text-[10px] px-2 h-5">Weekly</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        <Tabs value={chartMode} onValueChange={(v) => setChartMode(v as any)}>
                          <TabsList className="h-6 p-0.5">
                            <TabsTrigger value="tokens" className="text-[10px] px-2 h-5">Tokens</TabsTrigger>
                            <TabsTrigger value="requests" className="text-[10px] px-2 h-5">Requests</TabsTrigger>
                            <TabsTrigger value="cost" className="text-[10px] px-2 h-5">Cost</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends[viewRange]}>
                          <defs>
                            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(218, 68%, 33%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(218, 68%, 33%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(218, 20%, 88%)" strokeOpacity={0.4} />
                          <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: 'hsl(218, 15%, 46%)' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: 'hsl(218, 15%, 46%)' }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(220, 15%, 97%)', border: '1px solid hsl(218, 20%, 88%)', borderRadius: 6, fontSize: 11 }}
                            labelFormatter={fmtTime}
                            formatter={(val: number) => [chartMode === 'cost' ? `$${val.toFixed(4)}` : fmt(val), chartMode.charAt(0).toUpperCase() + chartMode.slice(1)]}
                          />
                          <Area type="monotone" dataKey={chartMode} stroke="hsl(218, 68%, 33%)" fill="url(#trendFill)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel">
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        <CardTitle className="text-xs font-semibold">Breakdowns</CardTitle>
                      </div>
                      <Tabs value={selectedBreakdown} onValueChange={(v) => setSelectedBreakdown(v as BreakdownCategory)}>
                        <TabsList className="h-6 p-0.5">
                          {Object.entries(breakdownLabels).map(([k, v]) => (
                            <TabsTrigger key={k} value={k} className="text-[10px] px-1.5 h-5">{v}</TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="space-y-2">
                      {breakdownData.map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-[11px] text-foreground w-28 truncate font-medium">{item.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full rounded-full bg-primary" />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">{fmt(item.tokens)}</span>
                          <span className="text-[10px] text-muted-foreground font-mono w-12 text-right">${item.cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity + Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                <Card className="glass-panel">
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-3.5 h-3.5 text-primary" />
                      <CardTitle className="text-xs font-semibold">Recent Activity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="space-y-1 max-h-[160px] overflow-y-auto scrollbar-thin">
                      {recentEvents.map((evt) => {
                        const EvtIcon = eventIcon[evt.type];
                        return (
                          <div key={evt.id} className="flex items-center gap-2 py-1 border-b border-border/40 last:border-0">
                            <EvtIcon className={`w-3.5 h-3.5 flex-shrink-0 ${eventColor[evt.status]}`} />
                            <span className="text-[10px] text-muted-foreground font-mono w-12 flex-shrink-0">{fmtTime(evt.timestamp)}</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">{evt.model}</Badge>
                            <span className="text-[11px] text-foreground flex-1 truncate">{evt.message}</span>
                            {evt.tokenCount > 0 && (
                              <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{fmt(evt.tokenCount)} tok</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs font-semibold">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-1.5">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={refresh} disabled={isRefreshing}>
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing…' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={exportReport}>
                      <Download className="w-3.5 h-3.5" /> Export
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={async () => { await copyDiagnostics(); toast({ title: 'Copied', description: 'Diagnostics copied' }); }}>
                      <Copy className="w-3.5 h-3.5" /> Diagnostics
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2" onClick={() => toast({ title: 'Logs', description: 'Coming soon' })}>
                      <ExternalLink className="w-3.5 h-3.5" /> Logs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodexUsageTracker;
