import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, X, TrendingUp, Bot } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, useAppStore } from '@/lib/store';
import { useAgents, useTasks, useAwareness, useDailyBrief } from '@/hooks/use-agents';
import { StateIndicator, agentVisualState, STATE_COLOR, STATE_LABEL } from '@/components/StateIndicator';
import { resolveIcon } from '@/lib/agent-icon';
import type { Agent, DailyBriefItem } from '@/types';

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 9,
  letterSpacing: '0.04em',
};

// --- Cached agents from localStorage ---
const CACHE_KEY = 'miniclaw_agents_cache';

function getCachedAgents(): Agent[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Agent[];
    return null;
  } catch {
    return null;
  }
}

function setCachedAgents(agents: Agent[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(agents));
  } catch {
    // ignore
  }
}

// --- Daily Brief helpers ---

const BRIEF_EVENT_LABELS: Record<string, (agentName: string) => string> = {
  hosted_agent_created: (n) => `${n} is live and ready to go`,
  task_completed:       (n) => `${n} just finished a task`,
  task_failed:          (n) => `${n} hit a snag on a task`,
  task_created:         (n) => `${n} picked up a new task`,
  memory_added:         (n) => `${n} saved something new to memory`,
  quota_warning:        (n) => `${n} is approaching its daily usage limit`,
  quota_exhausted:      (n) => `${n} has reached its daily usage limit`,
  agent_updated:        (n) => `${n}'s settings were updated`,
  agent_paused:         (n) => `${n} is currently paused`,
  agent_resumed:        (n) => `${n} is back in action`,
  skill_added:          (n) => `${n} gained a new skill`,
  knowledge_added:      (n) => `${n} has new knowledge to work with`,
};

function resolveBriefSummary(item: DailyBriefItem): string {
  const raw = item.highlight?.summary ?? '';
  const type = item.highlight?.type ?? '';
  const name = item.agentName || 'Your agent';
  const isRawKey = !raw || raw === type || !/\s/.test(raw.trim());
  if (isRawKey) {
    return (
      BRIEF_EVENT_LABELS[type]?.(name) ??
      BRIEF_EVENT_LABELS[raw]?.(name) ??
      `${name} has an update for you`
    );
  }
  return raw;
}

// --- Daily Brief ---

function DailyBriefCard({
  item,
  onDismiss,
  onTellMore,
}: {
  item: DailyBriefItem;
  onDismiss: () => void;
  onTellMore: () => void;
}) {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: 12,
        border: `1px solid ${t.divider}`,
        background: t.surface,
        padding: '14px 16px',
        marginBottom: 28,
        position: 'relative',
      }}
    >
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: t.faint,
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={13} />
      </button>

      <div style={{ marginBottom: 4 }}>
        <span style={{ ...MONO, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: t.faint }}>
          Daily Brief · {item.agentName}
        </span>
      </div>

      <p style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.55, color: t.text, paddingRight: 20, marginBottom: (item.pendingTaskCount ?? 0) > 0 ? 8 : 12 }}>
        {resolveBriefSummary(item)}
      </p>

      {(item.pendingTaskCount ?? 0) > 0 && (
        <p style={{ ...MONO, color: t.faint, marginBottom: 12 }}>
          {item.pendingTaskCount} task{item.pendingTaskCount === 1 ? '' : 's'} waiting for review
        </p>
      )}

      <button
        onClick={onTellMore}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: t.text,
          background: 'none',
          border: `1px solid ${t.divider}`,
          borderRadius: 8,
          padding: '5px 12px',
          cursor: 'pointer',
          letterSpacing: '-0.01em',
        }}
      >
        Tell me more
      </button>
    </motion.div>
  );
}


// --- Phase pill helpers (mirrors AgentDetailView) ---

const PHASE_COLOR: Record<string, string> = {
  curious: '#555555',
  developing: '#f59e0b',
  confident: '#22c55e',
};

function phaseColor(phase: string): string {
  return PHASE_COLOR[phase] ?? '#555555';
}

// --- Agent Row ---

function AgentRow({
  agent,
  index,
  onPress,
  onOptions,
}: {
  agent: Agent;
  index: number;
  onPress: () => void;
  onOptions: () => void;
}) {
  const t = useTheme();
  const state = agentVisualState(agent);
  const color = STATE_COLOR[state];
  const isIdle = state === 'idle';

  const { data: awareness } = useAwareness(agent.id);
  const { data: pendingTasks } = useTasks(agent.id, 'pending');
  const pendingCount = pendingTasks?.length ?? 0;

  const liveActivity = agent.stats?.currentActivity?.trim() || null;
  const activity =
    liveActivity ??
    (agent.description ? agent.description.slice(0, 52) + (agent.description.length > 52 ? '…' : '') : null);

  const statSegments: string[] = [];
  if (agent.llmTokensUsedToday) statSegments.push(`${agent.llmTokensUsedToday.toLocaleString()} tok`);
  if (agent.memorySizeEstimate != null && agent.memorySizeEstimate > 0) {
    statSegments.push(`${(agent.memorySizeEstimate / 1_048_576).toFixed(1)} MB`);
  }
  if (agent.pocScore != null && agent.pocScore.totalScore > 0) statSegments.push(`PoC ${agent.pocScore.totalScore}`);
  if (agent.celoBalance != null && agent.celoBalance > 0) statSegments.push(`${agent.celoBalance} CELO`);

  const pColor = awareness ? phaseColor(awareness.phase) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      style={{ paddingTop: 20, paddingBottom: 20 }}
    >
      {/* Row 1: name [bare-icon] | [StateIndicator] [options] */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button
            className="text-left"
            onClick={onPress}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 27,
              fontWeight: 300,
              letterSpacing: '-0.025em',
              lineHeight: 1,
              color: isIdle ? t.faint : t.text,
              minWidth: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
            {(() => {
              const Icon = resolveIcon(agent.icon) ?? Bot;
              return <Icon size={14} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
            })()}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8, height: 12 }}>
          <StateIndicator state={state} />
          <button
            onClick={(e) => { e.stopPropagation(); onOptions(); }}
            style={{
              width: 28,
              height: 28,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: t.faint,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Row 2: status label + pending badge + activity text | phase pill right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color,
          flexShrink: 0,
        }}>
          {STATE_LABEL[state]}
        </span>
        {pendingCount > 0 && (
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: '#f59e0b',
            flexShrink: 0,
          }}>
            {pendingCount} pending
          </span>
        )}
        {activity && (
          <span style={{ fontSize: 10, color: t.label, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activity.replace('Still learning who I am', 'Learning who I am')}
          </span>
        )}
      </div>

      {/* Row 3: monospace live stats + phase pill */}
      {(statSegments.length > 0 || (awareness && pColor)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 5 }}>
          {statSegments.map((seg) => (
            <span key={seg} style={{ ...MONO, color: t.faint }}>
              {seg}
            </span>
          ))}
          {awareness && pColor && (
            <span style={{
              marginLeft: 'auto',
              flexShrink: 0,
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: pColor,
              whiteSpace: 'nowrap',
            }}>
              {awareness.label || awareness.phase}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonRow({ index }: { index: number }) {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
      style={{ paddingTop: 20, paddingBottom: 20 }}
    >
      <div style={{ height: 27, width: `${50 + index * 15}%`, background: t.surface, borderRadius: 3 }} />
      <div style={{ height: 10, width: '40%', background: t.surface, borderRadius: 2, marginTop: 10 }} />
    </motion.div>
  );
}

const BRIEF_DISMISSED_KEY = 'miniclaw_brief_dismissed';

function getBriefDismissedDate(): string | null {
  try {
    return localStorage.getItem(BRIEF_DISMISSED_KEY);
  } catch {
    return null;
  }
}

function setBriefDismissed() {
  try {
    localStorage.setItem(BRIEF_DISMISSED_KEY, new Date().toDateString());
  } catch {
    // ignore
  }
}

export function HomeView() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const { hasSeenOnboard, setHasSeenOnboard } = useAppStore();
  const { data, isLoading, isError } = useAgents();

  const [cachedAgents, setCachedAgentsState] = useState<Agent[]>(() => getCachedAgents() ?? []);
  const { data: briefs } = useDailyBrief();
  const [briefDismissed, setBriefDismissedState] = useState(() => {
    const dismissed = getBriefDismissedDate();
    return dismissed === new Date().toDateString();
  });

  const apiAgents = data?.agents ?? [];

  // Update localStorage cache when fresh data arrives
  useEffect(() => {
    if (apiAgents.length > 0) {
      setCachedAgentsState(apiAgents);
      setCachedAgents(apiAgents);
    }
  }, [apiAgents]);

  const agents = apiAgents.length > 0 ? apiAgents : cachedAgents;
  const showSkeleton = isLoading && agents.length === 0;

  const quotaGradient = useMemo(() => {
    const withQuota = agents.filter(a => a.quota?.tokensLimit);
    if (withQuota.length === 0) return null;
    const totalUsed = withQuota.reduce((s, a) => s + (a.quota?.tokensUsed ?? 0), 0);
    const totalLimit = withQuota.reduce((s, a) => s + (a.quota?.tokensLimit ?? 0), 0);
    const remaining = Math.max(0, Math.min(1, (totalLimit - totalUsed) / totalLimit));
    const color = remaining > 0.5 ? '#6366f1' : remaining > 0.2 ? '#f59e0b' : '#ef4444';
    const opacity = 0.12 + remaining * 0.32;
    return { color, opacity };
  }, [agents]);

  const briefItem: DailyBriefItem | null = briefDismissed ? null : (briefs?.[0] ?? null);

  const handleDismissBrief = () => {
    setBriefDismissedState(true);
    setBriefDismissed();
  };

  const handleTellMore = () => {
    if (briefItem) {
      push('agent-detail', {
        id: String(briefItem.agentId),
        briefContext: briefItem.highlight?.summary,
      });
    }
  };

  const showBrief = briefItem && agents.length > 0;

  useEffect(() => {
    if (!isLoading && !isError && agents.length === 0 && !hasSeenOnboard) {
      push('create', { fromOnboarding: 'true' });
    }
  }, [isLoading, isError, agents.length, hasSeenOnboard, push]);

  if (!isLoading && !isError && agents.length === 0) {
    if (!hasSeenOnboard) return null;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 40px', background: t.bg }}>
        <p style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, textAlign: 'center', lineHeight: 1.3 }}>
          No agents yet
        </p>
        <p style={{ fontSize: 13, color: t.label, textAlign: 'center', lineHeight: 1.5 }}>
          Pick a co-founder to get started.
        </p>
        <button
          onClick={() => { setHasSeenOnboard(false); push('create', { fromOnboarding: 'true' }); }}
          style={{
            marginTop: 8,
            padding: '12px 28px',
            borderRadius: 14,
            background: t.text,
            color: t.bg,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-0.015em',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Create agent
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar"
      style={{ padding: '40px 32px 0', background: t.bg, transition: 'background 0.3s ease' }}
    >
      {/* Title + Growth button row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          fontSize: 22,
          fontWeight: 200,
          letterSpacing: '-0.03em',
          color: t.text,
          lineHeight: 1,
        }}>
          My Agents
        </p>
        <button
          onClick={() => push('growth')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: t.faint,
            padding: 0,
          }}
        >
          <TrendingUp size={14} strokeWidth={1.5} />
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, letterSpacing: '0.04em' }}>
            Growth
          </span>
        </button>
      </div>

      {/* Quota gradient separator */}
      {quotaGradient && (
        <div style={{
          height: 1,
          background: `linear-gradient(to right, transparent, ${quotaGradient.color})`,
          opacity: quotaGradient.opacity,
          marginLeft: -32,
          marginRight: -32,
          marginBottom: 28,
        }} />
      )}
      {!quotaGradient && <div style={{ marginBottom: 28 }} />}

      {/* Daily Brief */}
      <AnimatePresence>
        {showBrief && (
          <DailyBriefCard
            key="brief"
            item={briefItem}
            onDismiss={handleDismissBrief}
            onTellMore={handleTellMore}
          />
        )}
      </AnimatePresence>

      {isError && (
        <p style={{ fontSize: 11, color: '#ef4444', letterSpacing: '-0.01em', marginBottom: 16 }}>
          Could not load agents. Check your connection.
        </p>
      )}

      <div>
        {showSkeleton
          ? [0, 1, 2].map((i) => <SkeletonRow key={i} index={i} />)
          : agents.map((agent, i) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              index={i}
              onPress={() => push('agent-detail', { id: String(agent.id) })}
              onOptions={() => push('agent-options', { id: String(agent.id) })}
            />
          ))}

        {!isLoading && agents.length === 0 && !isError && (
          <p style={{ fontSize: 13, color: t.faint, fontWeight: 300, marginBottom: 20 }}>
            No agents yet.
          </p>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.max(agents.length, 1) * 0.07 + 0.05, duration: 0.35 }}
          className="w-full text-left"
          onClick={() => push('create')}
          style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            border: `1px solid ${t.divider}`,
            borderRadius: '50%',
          }}>
            <Plus size={9} color={t.faint} strokeWidth={2} />
          </span>
          <span style={{
            fontSize: 27,
            fontWeight: 300,
            letterSpacing: '-0.025em',
            color: t.faint,
            lineHeight: 1,
          }}>
            New agent
          </span>
        </motion.button>
      </div>
    </div>
  );
}
