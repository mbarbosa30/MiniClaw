import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, X, TrendingUp, Bot } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, useAppStore } from '@/lib/store';
import { useAgents, useTasks, useActivity, useAwareness } from '@/hooks/use-agents';
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

      <p style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.55, color: t.text, paddingRight: 20, marginBottom: 12 }}>
        {item.highlight?.summary}
      </p>

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

// --- Agent Brief Fetcher (per agent) ---

function useAgentBrief(agent: Agent | null) {
  const { data: pendingTasks } = useTasks(agent?.id, 'pending');
  const { data: activity } = useActivity(agent?.id);

  if (!agent) return null;

  const mostRecentTask = pendingTasks?.[0];
  const mostRecentActivity = activity?.[0];

  const taskFinding = mostRecentTask
    ? (mostRecentTask.title || mostRecentTask.description || mostRecentTask.action || 'Found a pending task that needs your attention.')
    : null;

  const activityFinding = mostRecentActivity
    ? (mostRecentActivity.summary || mostRecentActivity.description || mostRecentActivity.content || null)
    : null;

  const summary = taskFinding || activityFinding;
  if (!summary) return null;

  return {
    agentId: agent.id,
    agentName: agent.name,
    highlight: {
      type: taskFinding ? 'pending_task' : 'activity',
      source: mostRecentTask?.skillId ?? mostRecentActivity?.type ?? '',
      summary,
      id: mostRecentTask?.id,
      createdAt: mostRecentTask?.createdAt ?? (mostRecentActivity?.timestamp ?? mostRecentActivity?.createdAt),
    },
  } as import('@/types').DailyBriefItem;
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
  const isIdle = state === 'idle' || state === 'pending';

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
  if (agent.pocScore != null && agent.pocScore > 0) statSegments.push(`PoC ${agent.pocScore}`);
  if (agent.celoBalance != null && agent.celoBalance > 0) statSegments.push(`${agent.celoBalance} CELO`);

  const pColor = awareness ? phaseColor(awareness.phase) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      style={{ paddingTop: 20, paddingBottom: 20 }}
    >
      {/* Row 1: name [bare-icon] | [StateIndicator] [phase pill] [options] */}
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
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {agent.name}
          </button>
          {(() => {
            const Icon = resolveIcon(agent.icon) ?? Bot;
            return <Icon size={14} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8, height: 12 }}>
          <StateIndicator state={state} />
          {awareness && pColor && (
            <span style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: pColor,
              background: `${pColor}1a`,
              border: `1px solid ${pColor}40`,
              borderRadius: 3,
              padding: '2px 5px',
              whiteSpace: 'nowrap',
            }}>
              {awareness.label || awareness.phase}
            </span>
          )}
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

      {/* Row 2: status label + pending badge + activity text */}
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
            {activity}
          </span>
        )}
      </div>

      {/* Row 3: monospace live stats */}
      {statSegments.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 5 }}>
          {statSegments.map((seg) => (
            <span key={seg} style={{ ...MONO, color: t.faint }}>
              {seg}
            </span>
          ))}
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

// --- Brief loading sub-component (fetches per-agent data) ---
function BriefLoader({
  agents,
  onBriefReady,
}: {
  agents: Agent[];
  onBriefReady: (brief: DailyBriefItem | null) => void;
}) {
  const firstAgent = agents[0] ?? null;
  const brief = useAgentBrief(firstAgent);

  useEffect(() => {
    onBriefReady(brief ?? null);
  }, [brief]);

  return null;
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
  const [briefItem, setBriefItem] = useState<DailyBriefItem | null>(null);
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

  const showBrief = briefItem && !briefDismissed && agents.length > 0;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <p style={{
          fontSize: 22,
          fontWeight: 200,
          letterSpacing: '-0.03em',
          color: t.text,
          lineHeight: 1,
        }}>
          Agents
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
          <TrendingUp size={13} strokeWidth={1.5} />
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, letterSpacing: '0.06em' }}>
            Growth
          </span>
        </button>
      </div>

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

      {/* Load brief data (only when agents are loaded) */}
      {agents.length > 0 && !briefDismissed && (
        <BriefLoader
          agents={agents}
          onBriefReady={(b) => {
            if (b && !briefItem) setBriefItem(b);
          }}
        />
      )}

      {isError && (
        <p style={{ fontSize: 11, color: '#f87171', letterSpacing: '-0.01em', marginBottom: 16 }}>
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
