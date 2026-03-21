import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useAgents, useGrowthSummary } from '@/hooks/use-agents';
import type { GrowthSummary } from '@/types';

// --- Helpers ---

const CATEGORY_LABELS: Record<string, string> = {
  reminder: 'Reminders',
  info: 'Information',
  summary: 'Summaries',
  payment: 'Payments',
  post: 'Posts',
  transfer: 'Transfers',
  research: 'Research',
  alert: 'Alerts',
  analysis: 'Analysis',
  digest: 'Digests',
  'wallet-action': 'Wallet Actions',
  informational: 'Informational',
};

function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1));
}

// --- Category bar ---

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
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: t.faint, letterSpacing: '0.02em' }}>{count}</span>
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

// --- Per-agent growth fetcher — renders null, reports data up via callback ---

function AgentGrowthFetcher({
  agentId,
  onData,
}: {
  agentId: string | number;
  onData: (id: string | number, data: GrowthSummary | undefined) => void;
}) {
  const { data, isLoading } = useGrowthSummary(agentId);

  useEffect(() => {
    if (!isLoading) {
      onData(agentId, data);
    }
  }, [data, isLoading]);

  return null;
}

// --- Growth View ---

export function GrowthView() {
  const t = useTheme();
  const { data, isLoading: agentsLoading } = useAgents();
  const agents = data?.agents ?? [];

  const [summaryByAgent, setSummaryByAgent] = useState<Record<string, GrowthSummary>>({});
  const [resolvedAgents, setResolvedAgents] = useState<Set<string>>(new Set());

  // Reset when the agent set changes (prune stale summaries)
  const agentIdsKey = agents.map(a => String(a.id)).sort().join(',');
  useEffect(() => {
    setSummaryByAgent({});
    setResolvedAgents(new Set());
  }, [agentIdsKey]);

  const handleData = (id: string | number, summary: GrowthSummary | undefined) => {
    const key = String(id);
    setResolvedAgents(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    if (summary) {
      setSummaryByAgent(prev => {
        if (prev[key] === summary) return prev;
        return { ...prev, [key]: summary };
      });
    }
  };

  // Show skeletons until agents have loaded AND all per-agent summaries have resolved
  const isLoading = agentsLoading || (agents.length > 0 && resolvedAgents.size < agents.length);

  const { combinedTotal, sortedCategories, maxStreak, totalActiveDays } = useMemo(() => {
    let total = 0;
    const cats: Record<string, number> = {};
    let maxStreak = 0;
    let totalActiveDays = 0;

    for (const s of Object.values(summaryByAgent)) {
      total += s.totalApproved ?? 0;
      if ((s.streak ?? 0) > maxStreak) maxStreak = s.streak ?? 0;
      totalActiveDays += s.activeDays ?? 0;
      for (const [cat, count] of Object.entries(s.breakdown ?? {})) {
        cats[cat] = (cats[cat] ?? 0) + count;
      }
    }

    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
    return { combinedTotal: total, sortedCategories: sorted, maxStreak, totalActiveDays };
  }, [summaryByAgent]);

  const maxCount = sortedCategories[0]?.[1] ?? 1;

  const streakColor = maxStreak >= 7 ? '#22c55e' : maxStreak > 0 ? '#f59e0b' : t.faint;

  const motivational = combinedTotal === 0
    ? 'No completed actions yet this month — your Claw is warming up.'
    : combinedTotal === 1
    ? 'Your Claw helped you act on 1 thing this month.'
    : `Your Claw helped you act on ${combinedTotal} things this month.`;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease', minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0 32px 40px' }}>

        {/* Invisible data fetchers for each agent */}
        {agents.map(agent => (
          <AgentGrowthFetcher key={agent.id} agentId={agent.id} onData={handleData} />
        ))}

        <p style={{
          fontSize: 22,
          fontWeight: 200,
          letterSpacing: '-0.03em',
          color: t.text,
          lineHeight: 1,
          paddingTop: 28,
          paddingBottom: 4,
        }}>
          Growth
        </p>

        {/* Hero number */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 32 }}
        >
          <p style={{
            fontSize: 56,
            fontWeight: 200,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: t.text,
            marginBottom: 10,
          }}>
            {isLoading ? '—' : combinedTotal}
          </p>
          <p style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 9,
            color: t.faint,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Actions approved this month
          </p>

          {/* Streak + active days — always shown once loaded, faint at 0 */}
          {!isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <p style={{
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 9,
                color: streakColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {maxStreak}-day streak
              </p>
              <p style={{
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 9,
                color: t.faint,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {totalActiveDays} active {totalActiveDays === 1 ? 'day' : 'days'}
              </p>
            </div>
          )}

          <p style={{ fontSize: 13, fontWeight: 300, color: t.label, lineHeight: 1.55 }}>
            {motivational}
          </p>
        </motion.div>

        {/* Divider */}
        <div style={{ height: 1, background: t.divider, marginBottom: 28 }} />

        {/* Category bars */}
        {isLoading ? (
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
          <p style={{ fontSize: 12, color: t.faint, fontWeight: 300 }}>
            No approved tasks this month yet.
          </p>
        ) : (
          sortedCategories.map(([cat, count], i) => (
            <CategoryBar
              key={cat}
              label={getCategoryLabel(cat)}
              count={count}
              maxCount={maxCount}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
