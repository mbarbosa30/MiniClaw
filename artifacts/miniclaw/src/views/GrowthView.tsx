import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useRouter } from '@/lib/store';
import { useAgents, useTasks } from '@/hooks/use-agents';
import { ScreenHeader } from '@/components/ui';
import type { AgentTask } from '@/types';

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
};

function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? (cat.charAt(0).toUpperCase() + cat.slice(1));
}

function getThisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  return dateStr.startsWith(getThisMonth());
}

function aggregateTasks(tasks: AgentTask[]): { total: number; cats: Record<string, number> } {
  if (!Array.isArray(tasks)) return { total: 0, cats: {} };
  let total = 0;
  const cats: Record<string, number> = {};
  for (const task of tasks) {
    if (!isThisMonth(task.createdAt)) continue;
    if (task.status !== 'approved' && task.status !== 'completed') continue;
    total++;
    const cat = task.category || task.taskType || 'other';
    cats[cat] = (cats[cat] ?? 0) + 1;
  }
  return { total, cats };
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

// --- Single agent task fetcher - renders null, accumulates data via callback ---

function AgentTaskFetcher({
  agentId,
  onData,
}: {
  agentId: string | number;
  onData: (id: string | number, tasks: AgentTask[]) => void;
}) {
  const { data: tasks } = useTasks(agentId, 'all');

  useEffect(() => {
    if (tasks !== undefined) onData(agentId, Array.isArray(tasks) ? tasks : []);
  }, [tasks]);

  return null;
}

// --- Growth View ---

export function GrowthView() {
  const t = useTheme();
  const pop = useRouter(s => s.pop);
  const { data, isLoading } = useAgents();
  const agents = data?.agents ?? [];

  const [tasksByAgent, setTasksByAgent] = useState<Record<string, AgentTask[]>>({});

  const handleAgentData = (id: string | number, tasks: AgentTask[]) => {
    setTasksByAgent(prev => {
      const key = String(id);
      if (prev[key] === tasks) return prev;
      return { ...prev, [key]: tasks };
    });
  };

  const { combinedTotal, sortedCategories } = useMemo(() => {
    let total = 0;
    const cats: Record<string, number> = {};
    for (const tasks of Object.values(tasksByAgent)) {
      const agg = aggregateTasks(tasks);
      total += agg.total;
      for (const [cat, count] of Object.entries(agg.cats)) {
        cats[cat] = (cats[cat] ?? 0) + count;
      }
    }
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
    return { combinedTotal: total, sortedCategories: sorted };
  }, [tasksByAgent]);

  const maxCount = sortedCategories[0]?.[1] ?? 1;

  const motivational = combinedTotal === 0
    ? 'No completed actions yet this month — your Claw is warming up.'
    : combinedTotal === 1
    ? 'Your Claw helped you act on 1 thing this month.'
    : `Your Claw helped you act on ${combinedTotal} things this month.`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader title="Growth" onBack={pop} />

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '28px 32px 40px' }}>

        {/* Invisible data fetchers for each agent */}
        {agents.map(agent => (
          <AgentTaskFetcher key={agent.id} agentId={agent.id} onData={handleAgentData} />
        ))}

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
            marginBottom: 16,
          }}>
            Actions approved this month
          </p>
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
