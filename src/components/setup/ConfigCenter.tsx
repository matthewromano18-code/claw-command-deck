// ─── Config Center Panel ───────────────────────────────────
import { useState } from 'react';
import { useOpenClawConfig } from '@/hooks/useOpenClawConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, AlertTriangle, Shield, ShieldAlert, Check, X, RotateCcw, Code2, FileJson } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { ConfigField } from '@/services/openclaw/config-manager';

type ViewMode = 'form' | 'json';

const RISK_BADGE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: 'Low Risk', color: 'text-success bg-success/10', icon: Shield },
  medium: { label: 'Medium Risk', color: 'text-warning bg-warning/10', icon: AlertTriangle },
  high: { label: 'High Risk', color: 'text-destructive bg-destructive/10', icon: ShieldAlert },
};

export default function ConfigCenter() {
  const {
    snapshot, pendingChanges, validation, loading, applyResult,
    schema, riskLevel, hasPendingChanges,
    loadConfig, stageChange, discardChanges, applyChanges, getFieldValue,
  } = useOpenClawConfig();
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [showConfirm, setShowConfirm] = useState(false);
  const [jsonDraft, setJsonDraft] = useState('');

  // Group schema by section
  const sections = schema.reduce<Record<string, ConfigField[]>>((acc, field) => {
    (acc[field.section] ||= []).push(field);
    return acc;
  }, {});

  const handleApply = async () => {
    setShowConfirm(false);
    await applyChanges();
  };

  const handleJsonApply = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      // Stage all changes from JSON
      for (const field of schema) {
        const keys = field.key.split('.');
        let val: unknown = parsed;
        for (const k of keys) {
          val = val && typeof val === 'object' ? (val as Record<string, unknown>)[k] : undefined;
        }
        if (val !== undefined) {
          stageChange(field.key, val);
        }
      }
    } catch {
      // Invalid JSON
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Configuration Center</h2>
          {snapshot && (
            <span className="text-[10px] text-muted-foreground font-mono">
              hash:{snapshot.hash.slice(0, 8)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setViewMode('form');
            }}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${viewMode === 'form' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Settings2 className="h-3 w-3 inline mr-1" />
            Form
          </button>
          <button
            onClick={() => {
              setViewMode('json');
              if (snapshot) setJsonDraft(JSON.stringify(snapshot.config, null, 2));
            }}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${viewMode === 'json' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Code2 className="h-3 w-3 inline mr-1" />
            JSON
          </button>
          <button
            onClick={loadConfig}
            disabled={loading}
            className="px-2.5 py-1 text-xs rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className={`h-3 w-3 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
        </div>
      </div>

      {!snapshot ? (
        <div className="glass-panel p-6 text-center">
          <FileJson className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No configuration loaded</p>
          <button
            onClick={loadConfig}
            className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Load Config
          </button>
        </div>
      ) : viewMode === 'json' ? (
        <div className="space-y-3">
          <textarea
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
            className="w-full h-64 rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            spellCheck={false}
          />
          <button
            onClick={handleJsonApply}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Parse & Stage Changes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(sections).map(([section, fields]) => (
            <div key={section} className="glass-panel p-4 space-y-3">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{section}</h3>
              <div className="space-y-2">
                {fields.map((field) => (
                  <ConfigFieldRow
                    key={field.key}
                    field={field}
                    value={getFieldValue(field.key)}
                    onChange={(v) => stageChange(field.key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Summary */}
      <AnimatePresence>
        {hasPendingChanges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel-strong p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {pendingChanges.length} pending change{pendingChanges.length !== 1 ? 's' : ''}
                  </span>
                  {riskLevel && (() => {
                    const badge = RISK_BADGE[riskLevel];
                    const BadgeIcon = badge.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${badge.color}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Diff */}
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {pendingChanges.map((c) => (
                  <div key={c.path} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">{c.path}</span>
                    <span className="text-destructive/70 line-through">{JSON.stringify(c.oldValue) ?? 'undefined'}</span>
                    <span className="text-foreground">→</span>
                    <span className="text-success">{JSON.stringify(c.newValue)}</span>
                  </div>
                ))}
              </div>

              {/* Validation */}
              {validation && !validation.valid && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2 space-y-1">
                  {validation.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" /> {e.path}: {e.message}
                    </p>
                  ))}
                </div>
              )}
              {validation?.warnings && validation.warnings.length > 0 && (
                <div className="rounded-lg bg-warning/5 border border-warning/20 p-2 space-y-1">
                  {validation.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> {w.path}: {w.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading || (validation !== null && !validation.valid)}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Check className="h-3 w-3 inline mr-1" />
                  Apply Changes
                </button>
                <button
                  onClick={discardChanges}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply result */}
      {applyResult && (
        <div className={`rounded-lg p-3 text-xs font-medium ${applyResult.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          {applyResult.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-foreground">Confirm Configuration Apply</h3>
            <p className="text-xs text-muted-foreground">
              This will write {pendingChanges.length} change{pendingChanges.length !== 1 ? 's' : ''} to openclaw.json
              {pendingChanges.some((c) => {
                const f = schema.find((s) => s.key === c.path);
                return f?.requiresRestart;
              }) && ' and restart the gateway'}.
            </p>
            {riskLevel === 'high' && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2 text-xs text-destructive">
                ⚠ High-risk changes detected. Review carefully.
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Cancel
              </button>
              <button onClick={handleApply} className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Confirm Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual field renderer ──────────────────────────────

function ConfigFieldRow({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  const displayValue = value ?? field.default ?? '';

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-foreground font-medium">{field.label}</p>
          {field.requiresRestart && (
            <span className="text-[9px] text-warning bg-warning/10 px-1 py-0.5 rounded">restart</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{field.description}</p>
      </div>
      <div className="flex-shrink-0 w-40">
        {field.type === 'boolean' ? (
          <Switch
            checked={!!displayValue}
            onCheckedChange={(checked) => onChange(checked)}
          />
        ) : field.type === 'select' && field.options ? (
          <select
            value={String(displayValue)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === 'number' ? (
          <input
            type="number"
            value={String(displayValue)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        ) : (
          <input
            type="text"
            value={String(displayValue)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}
      </div>
    </div>
  );
}
