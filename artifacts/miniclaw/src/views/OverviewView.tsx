import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useAgents, useGrowthSummary, useUsageStats, useTriggerReflection, usePollReflection } from '@/hooks/use-agents';
import { StateIndicator, agentVisualState, STATE_COLOR, STATE_LABEL } from '@/components/StateIndicator';
import type { Agent, AgentListSummary, DeepReflection } from '@/types';
import type { GrowthSummary, AgentUsageStats } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso?: string): string {
  if (!iso) return '';
  try {
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) return '';
    const diff = Date.now() - ms;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtKB(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb.toFixed(0)} KB`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function fmtCostUsd(n: number): string {
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(2)}`;
}

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

// ── MiniBar ───────────────────────────────────────────────────────────────────

function MiniBar({ value, color, track }: { value: number; color: string; track: string }) {
  return (
    <div style={{ width: '100%', height: 1.5, background: track, borderRadius: 1, marginTop: 4 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 1) * 100}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', background: color, borderRadius: 1 }}
      />
    </div>
  );
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

function MetricRow({
  label, value, sub, bar, barColor,
}: {
  label: string; value: string; sub?: string; bar?: number; barColor?: string;
}) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, color: t.faint, letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0 }}>
          {label}
        </span>
        <div style={{ textAlign: 'right', marginLeft: 12 }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: t.text, letterSpacing: '-0.01em' }}>
            {value}
          </span>
          {sub && (
            <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, marginLeft: 8 }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      {bar !== undefined && <MiniBar value={bar} color={barColor ?? t.text} track={t.surface} />}
    </div>
  );
}

// ── DeepReflectionWidget ──────────────────────────────────────────────────────

function DeepReflectionWidget({ agentId }: { agentId: string | number }) {
  const t = useTheme();
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [triggered, setTriggered] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const { mutate: trigger, isPending: triggering } = useTriggerReflection();
  const polling = triggered && jobId != null;
  const { data: reflection } = usePollReflection(agentId, jobId, polling);

  const done = reflection?.status === 'done';
  const failed = reflection?.status === 'failed';
  const running = polling && !done && !failed;

  function handleTrigger() {
    if (triggering) return;
    setTriggerError(null);
    setJobId(undefined);
    setTriggered(false);
    trigger(agentId, {
      onSuccess: (res) => {
        setJobId(res.jobId);
        setTriggered(true);
      },
      onError: (err) => {
        setTriggerError((err as Error)?.message ?? 'Failed to start reflection.');
      },
    });
  }

  const showTriggerBtn = !triggered && !triggering;
  const showRetryBtn = (failed || !!triggerError) && !triggering;

  return (
    <div style={{ marginBottom: 14 }}>
      {showTriggerBtn && (
        <button
          onClick={handleTrigger}
          style={{
            background: 'none', border: `1px solid ${t.divider}`, borderRadius: 8,
            padding: '6px 12px', fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace',
            color: t.faint, cursor: 'pointer', letterSpacing: '0.04em',
            transition: 'border-color 0.15s, color 0.15s',
          }}
        >
          Deep Reflection · $1
        </button>
      )}

      {triggering && (
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.05em' }}>
          Starting reflection…
        </span>
      )}

      {running && (
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.05em', display: 'block' }}
        >
          Reflecting… ●
        </motion.span>
      )}

      {triggerError && (
        <p style={{ fontSize: 10, color: '#ef4444', fontFamily: 'inherit', fontWeight: 300, marginBottom: 6 }}>{triggerError}</p>
      )}

      {failed && !triggerError && (
        <p style={{ fontSize: 10, color: '#ef4444', fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.04em', marginBottom: 6 }}>
          Reflection failed.
        </p>
      )}

      {showRetryBtn && (
        <button
          onClick={handleTrigger}
          style={{
            background: 'none', border: `1px solid #ef444440`, borderRadius: 8,
            padding: '5px 10px', fontSize: 9, fontFamily: 'ui-monospace, Menlo, monospace',
            color: '#ef4444', cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          Try again · $1
        </button>
      )}

      {done && reflection && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ background: t.surface, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {reflection.clarityScore != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 8, color: t.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Clarity
              </span>
              <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, color: t.text, letterSpacing: '-0.01em', fontWeight: 400 }}>
                {reflection.clarityScore}
                <span style={{ fontSize: 9, color: t.faint }}>/100</span>
              </span>
            </div>
          )}
          {reflection.summary && (
            <p style={{ fontSize: 11, fontWeight: 300, color: t.label, lineHeight: 1.6, margin: 0 }}>
              {reflection.summary}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── AgentCard ─────────────────────────────────────────────────────────────────

function AgentCard({ agent, i }: { agent: Agent; i: number }) {
  const t = useTheme();
  const state = agentVisualState(agent);
  const color = STATE_COLOR[state];

  const memoriesKB = agent.memoriesSizeEstimate ?? 0;
  const memoriesLimitKB = (agent.memoriesLimit ?? 1000) * 0.5;
  const memBar = memoriesKB > 0 ? memoriesKB / memoriesLimitKB : undefined;
  const celoFloat = parseFloat(agent.celoBalance ?? '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.4 }}
      style={{ marginBottom: 36 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 16, fontWeight: 300, color: t.text, letterSpacing: '-0.015em', lineHeight: 1 }}>
              {agent.name}
            </span>
            <StateIndicator state={state} />
          </div>
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 8, color,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            background: `${color}1a`, border: `1px solid ${color}40`,
            borderRadius: 3, padding: '2px 5px', display: 'inline-block',
          }}>
            {STATE_LABEL[state]}
          </span>
        </div>
        {agent.uptimePercent != null && (
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.02em', marginTop: 2 }}>
            {agent.uptimePercent.toFixed(1)}% up
          </span>
        )}
      </div>

      {memoriesKB > 0 && (
        <MetricRow
          label="Memory"
          value={fmtKB(memoriesKB)}
          sub={`/ ${fmtKB(memoriesLimitKB)}`}
          bar={memBar}
          barColor={memBar != null && memBar > 0.7 ? '#f59e0b' : t.text}
        />
      )}
      {agent.tokensUsedToday != null && agent.tokensUsedToday > 0 && (
        <MetricRow
          label="Tokens"
          value={agent.tokensUsedToday.toLocaleString()}
          sub={agent.tokenCostUsd != null ? `${fmtCost(agent.tokenCostUsd)} today` : undefined}
          bar={Math.min(agent.tokensUsedToday / (agent.tokensLimit ?? 100_000), 1)}
        />
      )}
      {agent.economicsEarnedToday != null && agent.economicsEarnedToday > 0 && (
        <MetricRow label="Economics" value={`${fmtCost(agent.economicsEarnedToday)} earned today`} />
      )}
      {agent.pocScore != null && agent.pocScore > 0 && (
        <MetricRow label="PoC Score" value={`${agent.pocScore} pts`} bar={agent.pocScore / 100} />
      )}
      {agent.activeSkillsCount != null && agent.activeSkillsCount > 0 && (
        <MetricRow label="Skills" value={`${agent.activeSkillsCount} active`} />
      )}
      {celoFloat > 0 && (
        <MetricRow
          label="Holdings"
          value={`${celoFloat.toFixed(4)} CELO`}
          sub={agent.holdingsUsd != null ? `$${agent.holdingsUsd.toFixed(2)}` : undefined}
        />
      )}
      {agent.progressPercent != null && agent.progressPercent > 0 && (
        <MetricRow label="Progress" value={`${agent.progressPercent}%`} bar={agent.progressPercent / 100} barColor={color} />
      )}

      {(agent.recentActivities ?? []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
            Recent
          </span>
          {(agent.recentActivities ?? []).slice(0, 2).map((item, idx) => {
            const ts = relativeTime(item.timestamp);
            return (
              <div key={`${item.type}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 300, color: t.label, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                  {item.summary}
                </span>
                {ts && (
                  <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.02em', flexShrink: 0 }}>
                    {ts}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeepReflectionWidget agentId={agent.id} />

      <div style={{ height: 1, background: t.divider, marginTop: 4 }} />
    </motion.div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────

function SkeletonCard({ i }: { i: number }) {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
      style={{ marginBottom: 36 }}
    >
      <div style={{ height: 16, width: '50%', background: t.surface, borderRadius: 3, marginBottom: 8 }} />
      <div style={{ height: 9, width: '25%', background: t.surface, borderRadius: 2, marginBottom: 18 }} />
      {[70, 55, 80, 45].map((w, j) => (
        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ height: 9, width: '20%', background: t.surface, borderRadius: 2 }} />
          <div style={{ height: 9, width: `${w - 30}%`, background: t.surface, borderRadius: 2 }} />
        </div>
      ))}
      <div style={{ height: 1, background: t.divider, marginTop: 4 }} />
    </motion.div>
  );
}

// ── SummaryHeader ─────────────────────────────────────────────────────────────

function SummaryHeader({ summary, agentCount }: { summary?: AgentListSummary; agentCount: number }) {
  const t = useTheme();
  const activeStr = summary ? `${summary.activeCount}` : '—';
  const totalStr = summary ? ` / ${summary.totalCount}` : ` / ${agentCount}`;
  const tokStr = summary ? fmtTokens(summary.combinedTokensToday) : '—';
  const costStr = summary ? fmtCost(summary.combinedCostUsd) : '—';

  const col = (main: string, label: string, sub?: string) => (
    <div>
      <p style={{ fontSize: 40, fontWeight: 200, color: t.text, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {main}
        {sub && <span style={{ fontSize: 14, fontWeight: 300, color: t.faint }}>{sub}</span>}
      </p>
      <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 32, marginBottom: 36, flexShrink: 0 }}>
      {col(activeStr, 'Active', totalStr)}
      {col(tokStr, 'Tokens')}
      {col(costStr, 'Cost')}
    </div>
  );
}

// ── Category bar ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  reminder: 'Reminders', info: 'Information', summary: 'Summaries',
  payment: 'Payments', post: 'Posts', transfer: 'Transfers',
  research: 'Research', alert: 'Alerts', analysis: 'Analysis',
  digest: 'Digests', 'wallet-action': 'Wallet Actions', informational: 'Informational',
};

function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1));
}

function CategoryBar({ label, count, maxCount, index }: { label: string; count: number; maxCount: number; index: number }) {
  const t = useTheme();
  const pct = maxCount > 0 ? count / maxCount : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      style={{ marginBottom: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 400, color: t.text, letterSpacing: '-0.01em' }}>{label}</span>
        <span style={{ ...MONO, fontSize: 10, color: t.faint, letterSpacing: '0.02em' }}>{count}</span>
      </div>
      <div style={{ height: 2, background: t.surface, borderRadius: 1 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ delay: index * 0.06 + 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', background: t.text, borderRadius: 1 }}
        />
      </div>
    </motion.div>
  );
}

const CALL_TYPE_LABELS: Record<string, string> = {
  chat: 'Chat', skill: 'Skills', memory: 'Memory', soul: 'Soul', guard: 'Guard',
};

// ── Growth data fetchers (render-null components) ──────────────────────────────

function AgentGrowthFetcher({ agentId, onData }: { agentId: string | number; onData: (id: string | number, data: GrowthSummary | undefined) => void }) {
  const { data, isLoading } = useGrowthSummary(agentId);
  useEffect(() => { if (!isLoading) onData(agentId, data); }, [data, isLoading, agentId]);
  return null;
}

function UsageFetcher({ agentId, onData }: { agentId: string | number; onData: (id: string | number, data: AgentUsageStats | undefined, loading: boolean) => void }) {
  const { data, isLoading } = useUsageStats(agentId);
  useEffect(() => { onData(agentId, data, isLoading); }, [data, isLoading, agentId]);
  return null;
}

// ── Aggregate usage ───────────────────────────────────────────────────────────

function aggregateUsage(allStats: AgentUsageStats[]): AgentUsageStats {
  if (allStats.length === 0) {
    return { tokens: { last24h: 0, last7d: 0, last30d: 0 }, cost: { last24h: 0, last7d: 0, last30d: 0 }, totalCalls30d: 0, avgLatencyMs: 0, callsByType: [], callsByModel: undefined };
  }
  const tokens = { last24h: 0, last7d: 0, last30d: 0 };
  const cost = { last24h: 0, last7d: 0, last30d: 0 };
  let totalCalls30d = 0, weightedLatency = 0, totalCallsForLatency = 0;
  const typeMap: Record<string, number> = {};
  const modelMap: Record<string, { calls: number; tokens: number; provider?: string; costUsd: number }> = {};

  for (const s of allStats) {
    tokens.last24h += s.tokens.last24h;
    tokens.last7d += s.tokens.last7d;
    tokens.last30d += s.tokens.last30d;
    if (s.cost) {
      cost.last24h += s.cost.last24h;
      cost.last7d += s.cost.last7d;
      cost.last30d += s.cost.last30d;
    }
    totalCalls30d += s.totalCalls30d;
    weightedLatency += s.avgLatencyMs * s.totalCalls30d;
    totalCallsForLatency += s.totalCalls30d;
    for (const ct of s.callsByType) typeMap[ct.type] = (typeMap[ct.type] ?? 0) + ct.calls;
    for (const m of s.callsByModel ?? []) {
      const ex = modelMap[m.model];
      if (ex) { ex.calls += m.calls; ex.tokens += m.tokens; ex.costUsd += m.costUsd ?? 0; }
      else modelMap[m.model] = { calls: m.calls, tokens: m.tokens, provider: m.provider, costUsd: m.costUsd ?? 0 };
    }
  }

  const callsByType = Object.entries(typeMap).sort(([, a], [, b]) => b - a).map(([type, calls]) => ({ type, calls }));
  const callsByModel = Object.entries(modelMap).sort(([, a], [, b]) => b.calls - a.calls).map(([model, v]) => ({ model, calls: v.calls, tokens: v.tokens, provider: v.provider, costUsd: v.costUsd }));
  return { tokens, cost, totalCalls30d, avgLatencyMs: totalCallsForLatency > 0 ? weightedLatency / totalCallsForLatency : 0, callsByType, callsByModel: callsByModel.length > 0 ? callsByModel : undefined };
}

// ── OverviewView ──────────────────────────────────────────────────────────────

export function OverviewView() {
  const t = useTheme();
  const { data, isLoading: agentsLoading } = useAgents();
  const agents = data?.agents ?? [];
  const summary = data?.summary;

  const [summaryByAgent, setSummaryByAgent] = useState<Record<string, GrowthSummary>>({});
  const [resolvedAgents, setResolvedAgents] = useState<Set<string>>(new Set());
  const [usageByAgent, setUsageByAgent] = useState<Record<string, AgentUsageStats>>({});
  const [usageLoadingSet, setUsageLoadingSet] = useState<Set<string>>(new Set());

  const agentIdsKey = agents.map(a => String(a.id)).sort().join(',');
  useEffect(() => {
    setSummaryByAgent({});
    setResolvedAgents(new Set());
    setUsageByAgent({});
    setUsageLoadingSet(new Set());
  }, [agentIdsKey]);

  const handleGrowthData = (id: string | number, gSummary: GrowthSummary | undefined) => {
    const key = String(id);
    setResolvedAgents(prev => { if (prev.has(key)) return prev; const next = new Set(prev); next.add(key); return next; });
    if (gSummary) setSummaryByAgent(prev => { if (prev[key] === gSummary) return prev; return { ...prev, [key]: gSummary }; });
  };

  const handleUsageData = (id: string | number, usageData: AgentUsageStats | undefined, loading: boolean) => {
    const key = String(id);
    setUsageLoadingSet(prev => {
      const isLoading = prev.has(key);
      if (loading && !isLoading) { const next = new Set(prev); next.add(key); return next; }
      if (!loading && isLoading) { const next = new Set(prev); next.delete(key); return next; }
      return prev;
    });
    if (!loading && usageData) setUsageByAgent(prev => { if (prev[key] === usageData) return prev; return { ...prev, [key]: usageData }; });
  };

  const growthLoading = agentsLoading || (agents.length > 0 && resolvedAgents.size < agents.length);
  const usageLoading = usageLoadingSet.size > 0 || (agents.length > 0 && Object.keys(usageByAgent).length === 0 && !agentsLoading);

  const { combinedTotal, sortedCategories, maxStreak, totalActiveDays } = useMemo(() => {
    let total = 0; const cats: Record<string, number> = {}; let maxStreak = 0, totalActiveDays = 0;
    for (const s of Object.values(summaryByAgent)) {
      total += s.totalApproved ?? 0;
      if ((s.streak ?? 0) > maxStreak) maxStreak = s.streak ?? 0;
      totalActiveDays += s.activeDays ?? 0;
      for (const [cat, count] of Object.entries(s.breakdown ?? {})) cats[cat] = (cats[cat] ?? 0) + count;
    }
    return { combinedTotal: total, sortedCategories: Object.entries(cats).sort(([, a], [, b]) => b - a), maxStreak, totalActiveDays };
  }, [summaryByAgent]);

  const usageData = useMemo(() => aggregateUsage(Object.values(usageByAgent)), [usageByAgent]);

  const maxCount = sortedCategories[0]?.[1] ?? 1;
  const streakColor = maxStreak >= 7 ? '#22c55e' : maxStreak > 0 ? '#f59e0b' : t.faint;
  const motivational = combinedTotal === 0
    ? 'No completed actions yet this month — your Claw is warming up.'
    : combinedTotal === 1
    ? 'Your Claw helped you act on 1 thing this month.'
    : `Your Claw helped you act on ${combinedTotal} things this month.`;
  const totalMemKB = agents.reduce((sum, a) => sum + (a.memoriesSizeEstimate ?? 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease', minHeight: 0 }}>
      {/* Invisible data fetchers */}
      {agents.map(agent => (
        <AgentGrowthFetcher key={agent.id} agentId={agent.id} onData={handleGrowthData} />
      ))}
      {agents.map(agent => (
        <UsageFetcher key={agent.id} agentId={agent.id} onData={handleUsageData} />
      ))}

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '40px 32px 40px' }}>

        {/* ── Section 1: Agent Summary ─────────────────────────────────────── */}
        <SummaryHeader summary={summary} agentCount={agents.length} />

        {agentsLoading
          ? [0, 1, 2].map(i => <SkeletonCard key={i} i={i} />)
          : agents.map((agent, i) => <AgentCard key={agent.id} agent={agent} i={i} />)}

        {!agentsLoading && agents.length === 0 && (
          <p style={{ fontSize: 13, color: t.faint, fontWeight: 300 }}>No agents to show.</p>
        )}

        {/* ── Section 2: Growth ─────────────────────────────────────────────── */}
        {!agentsLoading && agents.length > 0 && (
          <>
            <div style={{ height: 1, background: t.divider, margin: '8px 0 32px' }} />

            <p style={{ fontSize: 22, fontWeight: 200, letterSpacing: '-0.03em', color: t.text, lineHeight: 1, marginBottom: 4 }}>
              Growth
            </p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: 32 }}
            >
              <p style={{ fontSize: 56, fontWeight: 200, letterSpacing: '-0.04em', lineHeight: 1, color: t.text, marginBottom: 10 }}>
                {growthLoading ? '—' : combinedTotal}
              </p>
              <p style={{ ...MONO, fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Actions approved this month
              </p>

              {!growthLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                  <p style={{ ...MONO, fontSize: 9, color: streakColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {maxStreak}-day streak
                  </p>
                  <p style={{ ...MONO, fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {totalActiveDays} active {totalActiveDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}

              <p style={{ fontSize: 13, fontWeight: 300, color: t.label, lineHeight: 1.55 }}>
                {motivational}
              </p>
            </motion.div>

            <div style={{ height: 1, background: t.divider, marginBottom: 28 }} />

            {/* Category bars */}
            {growthLoading ? (
              [0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  style={{ marginBottom: 20 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ height: 12, width: '35%', background: t.surface, borderRadius: 2 }} />
                    <div style={{ height: 12, width: '8%', background: t.surface, borderRadius: 2 }} />
                  </div>
                  <div style={{ height: 2, width: `${60 - i * 12}%`, background: t.surface, borderRadius: 1 }} />
                </motion.div>
              ))
            ) : sortedCategories.length === 0 ? (
              <p style={{ fontSize: 12, color: t.faint, fontWeight: 300 }}>No approved tasks this month yet.</p>
            ) : (
              sortedCategories.map(([cat, count], i) => (
                <CategoryBar key={cat} label={getCategoryLabel(cat)} count={count} maxCount={maxCount} index={i} />
              ))
            )}

            {/* Usage section */}
            <div style={{ height: 1, background: t.divider, margin: '12px 0 28px' }} />

            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              Usage{agents.length > 1 ? ` · ${agents.length} agents` : agents[0] ? ` · ${agents[0].name}` : ''}
            </p>

            {usageLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      style={{ height: 52, background: t.surface, borderRadius: 6 }} />
                  ))}
                </div>
              </div>
            ) : usageData.totalCalls30d === 0 && usageData.tokens.last30d === 0 ? (
              <p style={{ fontSize: 12, color: t.faint, fontWeight: 300 }}>No usage data available.</p>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {([
                    { label: '24h', value: usageData.tokens.last24h, cost: usageData.cost?.last24h },
                    { label: '7d', value: usageData.tokens.last7d, cost: usageData.cost?.last7d },
                    { label: '30d', value: usageData.tokens.last30d, cost: usageData.cost?.last30d },
                  ] as { label: string; value: number; cost?: number }[]).map(({ label, value, cost }) => (
                    <div key={label} style={{ background: t.surface, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: t.text }}>{fmtNum(value)}</span>
                      <span style={{ ...MONO, fontSize: 8, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                      {cost != null && cost > 0 && (
                        <span style={{ ...MONO, fontSize: 8, color: t.faint, letterSpacing: '0.04em' }}>{fmtCostUsd(cost)}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 300, color: t.text }}>{fmtNum(usageData.totalCalls30d)}</span>
                    <span style={{ ...MONO, fontSize: 9, color: t.faint, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>calls (30d)</span>
                  </div>
                  {usageData.avgLatencyMs > 0 && (
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 300, color: t.text }}>{fmtLatency(usageData.avgLatencyMs)}</span>
                      <span style={{ ...MONO, fontSize: 9, color: t.faint, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>avg latency</span>
                    </div>
                  )}
                  {totalMemKB > 0 && (
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 300, color: t.text }}>{totalMemKB >= 1024 ? `${(totalMemKB / 1024).toFixed(1)} MB` : `${totalMemKB.toFixed(0)} KB`}</span>
                      <span style={{ ...MONO, fontSize: 9, color: t.faint, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>memory</span>
                    </div>
                  )}
                </div>

                {usageData.callsByType.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {usageData.callsByType.map((ct, idx) => {
                      const maxCalls = Math.max(...usageData.callsByType.map(c => c.calls), 1);
                      const pct = ct.calls / maxCalls;
                      return (
                        <motion.div key={ct.type} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 300, color: t.text, letterSpacing: '-0.01em' }}>{CALL_TYPE_LABELS[ct.type] ?? ct.type}</span>
                            <span style={{ ...MONO, fontSize: 9, color: t.faint }}>{ct.calls}</span>
                          </div>
                          <div style={{ height: 1.5, background: t.surface, borderRadius: 1 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ delay: idx * 0.05 + 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                              style={{ height: '100%', background: t.label, borderRadius: 1 }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {usageData.callsByModel && usageData.callsByModel.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ ...MONO, fontSize: 8, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>By model</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {usageData.callsByModel.map((m, idx) => {
                        const maxCalls = Math.max(...(usageData.callsByModel?.map(x => x.calls) ?? []), 1);
                        const pct = m.calls / maxCalls;
                        const costStr = (m.costUsd ?? 0) > 0 ? ` · ${fmtCostUsd(m.costUsd!)}` : '';
                        return (
                          <motion.div key={m.model} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 300, color: t.text, letterSpacing: '-0.01em' }}>{m.model}</span>
                              <span style={{ ...MONO, fontSize: 9, color: t.faint }}>{m.calls} · {fmtNum(m.tokens)}{costStr}</span>
                            </div>
                            <div style={{ height: 1.5, background: t.surface, borderRadius: 1 }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ delay: idx * 0.05 + 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                style={{ height: '100%', background: t.label, borderRadius: 1 }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(usageData.cost?.last7d ?? 0) > 0 && (
                  <p style={{ ...MONO, fontSize: 9, color: t.faint, letterSpacing: '0.05em', marginTop: 20 }}>
                    At this pace, ~{fmtCostUsd(usageData.cost!.last7d * 4.3)} / mo
                  </p>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
