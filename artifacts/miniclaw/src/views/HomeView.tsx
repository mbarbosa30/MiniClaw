import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Check, X, Bot, Settings } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, useAppStore } from '@/lib/store';
import { useAgents, useAllTaskSummaries, useResolveTask } from '@/hooks/use-agents';
import { StateIndicator, agentVisualState, STATE_COLOR, STATE_LABEL } from '@/components/StateIndicator';
import { resolveIcon } from '@/lib/agent-icon';
import { PERSONAS } from '@/lib/personas';
import type { Agent, AgentTask } from '@/types';

const PERSONA_BY_TAGLINE = new Map(PERSONAS.map(p => [p.tagline, p]));

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

// --- Activity section helpers ---

type TaskWithAgent = AgentTask & {
  agentId: string | number;
  agentName: string;
  agentColor?: string;
};

function getTaskTitle(task: AgentTask): string {
  return (
    task.title ??
    (task.payload as any)?.title ??
    task.description ??
    (task.payload as any)?.description ??
    task.action ??
    'Task'
  );
}

function isProactive(task: AgentTask): boolean {
  return task.skillId === 'proactive-reflection';
}

// --- Activity section ---

function ActivityTaskRow({
  task,
  variant,
  onApprove,
  onReject,
}: {
  task: TaskWithAgent;
  variant: 'pending' | 'running' | 'completed';
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const t = useTheme();
  const title = getTaskTitle(task);
  const proactive = isProactive(task);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 11, paddingBottom: 11 }}>
      {/* dot */}
      <div style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        flexShrink: 0,
        background: variant === 'completed' ? t.faint :
                    variant === 'running'   ? '#f59e0b' : t.text,
        opacity: variant === 'completed' ? 0.35 : 1,
      }} />

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: variant === 'completed' ? t.label : t.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 300, color: t.faint }}>{task.agentName}</span>
          <span style={{ color: t.divider }}> · </span>
          <span style={{ fontWeight: 400 }}>{title}</span>
        </p>
        {proactive && (
          <span style={{ ...MONO, color: t.faint, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            proactive
          </span>
        )}
      </div>

      {/* approve / reject for pending */}
      {variant === 'pending' && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onApprove}
            style={{ background: 'none', border: `1px solid ${t.divider}`, borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: t.text, display: 'flex', alignItems: 'center' }}
          >
            <Check size={11} strokeWidth={2.5} />
          </button>
          <button
            onClick={onReject}
            style={{ background: 'none', border: `1px solid ${t.divider}`, borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: t.faint, display: 'flex', alignItems: 'center' }}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function ActivitySection({
  agents,
  summaries,
}: {
  agents: Agent[];
  summaries: ReturnType<typeof useAllTaskSummaries>;
}) {
  const t = useTheme();
  const resolve = useResolveTask();

  const pending: TaskWithAgent[] = [];
  const running: TaskWithAgent[] = [];
  const scheduled: TaskWithAgent[] = [];
  const completed: TaskWithAgent[] = [];

  summaries.forEach((result, i) => {
    const agent = agents[i];
    if (!result.data || !agent) return;
    const attach = (task: AgentTask): TaskWithAgent => ({
      ...task,
      agentId: agent.id,
      agentName: agent.name,
      agentColor: undefined,
    });
    (result.data.pending?.items ?? []).forEach(t => pending.push(attach(t)));
    (result.data.running?.items ?? []).forEach(t => running.push(attach(t)));
    (result.data.scheduled?.items ?? []).forEach(t => scheduled.push(attach(t)));
    (result.data.recentlyCompleted?.items ?? []).slice(0, 3).forEach(t => completed.push(attach(t)));
  });

  if (!pending.length && !running.length && !scheduled.length && !completed.length) return null;

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{ ...MONO, color: t.faint, textTransform: 'uppercase' as const, letterSpacing: '0.08em', paddingBottom: 4, marginBottom: 2 }}>
      {children}
    </p>
  );

  const rowDivider = <div style={{ height: 1, background: t.divider, opacity: 0.5 }} />;

  return (
    <div style={{ marginBottom: 28 }}>
      {pending.length > 0 && (
        <div style={{ marginBottom: running.length || scheduled.length || completed.length ? 20 : 0 }}>
          <SectionLabel>Pending approval</SectionLabel>
          {pending.map((task, i) => (
            <div key={task.id}>
              <ActivityTaskRow
                task={task}
                variant="pending"
                onApprove={() => resolve.mutate({ agentId: task.agentId, taskId: task.id, action: 'approve' })}
                onReject={() => resolve.mutate({ agentId: task.agentId, taskId: task.id, action: 'reject' })}
              />
              {i < pending.length - 1 && rowDivider}
            </div>
          ))}
        </div>
      )}

      {running.length > 0 && (
        <div style={{ marginBottom: scheduled.length || completed.length ? 20 : 0 }}>
          <SectionLabel>In progress</SectionLabel>
          {running.map((task, i) => (
            <div key={task.id}>
              <ActivityTaskRow task={task} variant="running" />
              {i < running.length - 1 && rowDivider}
            </div>
          ))}
        </div>
      )}

      {scheduled.length > 0 && (
        <div style={{ marginBottom: completed.length ? 20 : 0 }}>
          <SectionLabel>Scheduled</SectionLabel>
          {scheduled.map((task, i) => (
            <div key={task.id}>
              <ActivityTaskRow task={task} variant="running" />
              {i < scheduled.length - 1 && rowDivider}
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <SectionLabel>Recent · 48h</SectionLabel>
          {completed.map((task, i) => (
            <div key={task.id}>
              <ActivityTaskRow task={task} variant="completed" />
              {i < completed.length - 1 && rowDivider}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: t.divider, marginTop: 8 }} />
    </div>
  );
}


// --- Time-ago helper ---

function timeAgo(isoTimestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000);
  if (isNaN(diff) || diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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
  tokenShare,
  onPress,
  onOptions,
}: {
  agent: Agent;
  index: number;
  tokenShare: number;
  onPress: () => void;
  onOptions: () => void;
}) {
  const t = useTheme();
  const state = agentVisualState(agent);
  const color = STATE_COLOR[state];
  const isIdle = state === 'idle';

  const isSpawning = agent.spawningStatus === 'researching' || agent.spawningStatus === 'training';
  const pendingCount = agent.pendingTaskCount ?? agent.stats?.pendingTasksCount ?? 0;

  const latestEvent = agent.recentActivities?.[0];
  const liveActivity = latestEvent
    ? `${latestEvent.summary.trim()} · ${timeAgo(latestEvent.timestamp)}`
    : (agent.stats?.currentActivity?.trim() || agent.recentActivity?.trim() || null);
  const activity =
    liveActivity ??
    (agent.description ? agent.description.slice(0, 52) + (agent.description.length > 52 ? '…' : '') : null);

  const statSegments: string[] = [];
  if (agent.tokensUsedToday) statSegments.push(`${agent.tokensUsedToday.toLocaleString()} tok`);
  if (agent.memoriesSizeEstimate != null && agent.memoriesSizeEstimate > 0) {
    const kb = agent.memoriesSizeEstimate;
    statSegments.push(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`);
  }
  if (agent.pocScore != null && agent.pocScore > 0) statSegments.push(`PoC ${agent.pocScore}`);
  const celoFloat = parseFloat(agent.celoBalance ?? '0');
  if (celoFloat > 0) statSegments.push(`${celoFloat.toFixed(4)} CELO`);

  const pColor = agent.phase ? phaseColor(agent.phase) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      style={{ paddingTop: 20, paddingBottom: 0 }}
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
              const Icon = resolveIcon(agent.icon);
              if (Icon) return <Icon size={14} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
              const emoji = agent.emoji ?? PERSONA_BY_TAGLINE.get(agent.description)?.emoji;
              if (emoji) return <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>;
              const FallbackIcon = resolveIcon(PERSONA_BY_TAGLINE.get(agent.description)?.icon);
              if (FallbackIcon) return <FallbackIcon size={14} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
              return <Bot size={14} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
            })()}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8, height: 12 }}>
          <StateIndicator state={state} />
        </div>
      </div>

      {/* Row 2: status label + pending badge + activity text + ⋯ right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
        <span style={{
          fontFamily: isSpawning ? 'ui-monospace, Menlo, monospace' : undefined,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: isSpawning ? '#a78bfa' : color,
          flexShrink: 0,
        }}>
          {isSpawning ? 'TRAINING…' : STATE_LABEL[state]}
        </span>
        {!isSpawning && pendingCount > 0 && (
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
        {activity && (() => {
          const cleaned = activity.replace('Still learning who I am', 'Learning who I am');
          const dotIdx = cleaned.lastIndexOf(' · ');
          const desc = dotIdx >= 0 ? cleaned.slice(0, dotIdx) : cleaned;
          const time = dotIdx >= 0 ? cleaned.slice(dotIdx) : null;
          return (
            <span style={{ fontSize: 10, color: t.label, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
              {desc}{time && <span style={{ color: t.faint, opacity: 0.7, fontSize: 9 }}>{time}</span>}
            </span>
          );
        })()}
        <button
          onClick={(e) => { e.stopPropagation(); onOptions(); }}
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: t.faint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <MoreHorizontal size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* Row 3: monospace live stats + phase pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 5, minHeight: 14 }}>
        {statSegments.map((seg) => (
          <span key={seg} style={{ ...MONO, color: t.faint }}>
            {seg}
          </span>
        ))}
        {agent.phase && pColor ? (
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
            {agent.phase}
          </span>
        ) : null}
      </div>

      <div style={{
        height: 1,
        marginTop: 19,
        background: `linear-gradient(to right, ${t.divider}, transparent ${Math.max(12, Math.round(tokenShare * 100))}%)`,
        opacity: 0.8,
      }} />
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

export function HomeView() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const { hasSeenOnboard, setHasSeenOnboard } = useAppStore();
  const { data, isLoading, isError } = useAgents();

  const [cachedAgents, setCachedAgentsState] = useState<Agent[]>(() => getCachedAgents() ?? []);

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

  // Fetch task summaries for all active agents so the home page shows pending,
  // running, and scheduled tasks even when no approval is needed. During initial
  // load (isLoading=true) we pass an empty array so the agent list is the only
  // network call; per-agent summaries start once list data arrives.
  const activeAgents = useMemo(
    () => agents.filter(a => a.status === 'active'),
    [agents],
  );
  const taskSummaries = useAllTaskSummaries(isLoading ? [] : activeAgents.map(a => a.id));

  const quotaGradient = useMemo(() => {
    const withQuota = agents.filter(a => (a as Agent & { quota?: { tokensLimit?: number } }).quota?.tokensLimit);
    if (withQuota.length === 0) return null;
    const totalUsed = withQuota.reduce((s, a) => s + ((a as Agent & { quota?: { tokensUsed?: number } }).quota?.tokensUsed ?? 0), 0);
    const totalLimit = withQuota.reduce((s, a) => s + ((a as Agent & { quota?: { tokensLimit?: number } }).quota?.tokensLimit ?? 0), 0);
    const remaining = Math.max(0, Math.min(1, (totalLimit - totalUsed) / totalLimit));
    const color = remaining > 0.5 ? '#6366f1' : remaining > 0.2 ? '#f59e0b' : '#ef4444';
    const opacity = 0.12 + remaining * 0.32;
    return { color, opacity };
  }, [agents]);

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
      className="flex-1"
      style={{ display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease', overflow: 'hidden' }}
    >
      {/* Pinned header — does not scroll */}
      <div
        style={{ flexShrink: 0, padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            fontSize: 22,
            fontWeight: 200,
            letterSpacing: '-0.03em',
            color: t.text,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}>
            My Agents
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#f59e0b',
              display: 'inline-block',
              flexShrink: 0,
              opacity: (isError && cachedAgents.length > 0) ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }} />
          </p>
          <button
            onClick={() => push('settings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              color: t.faint,
            }}
          >
            <Settings size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {/* Quota gradient separator — pinned, always visible, full-bleed */}
      <div style={{
        flexShrink: 0,
        height: 1,
        background: quotaGradient
          ? `linear-gradient(to right, transparent, ${quotaGradient.color})`
          : `linear-gradient(to right, transparent, ${t.divider})`,
        opacity: quotaGradient ? quotaGradient.opacity : 0.6,
      }} />
      {/* Scrollable list */}
      <div
        className="overflow-y-auto no-scrollbar"
        style={{ flex: 1, padding: '20px 32px 0' }}
      >
        {/* Activity section */}
        {agents.length > 0 && (
          <ActivitySection agents={activeAgents} summaries={taskSummaries} />
        )}

        {isError && cachedAgents.length === 0 && (
          <p style={{ fontSize: 11, color: '#ef4444', letterSpacing: '-0.01em', marginBottom: 16 }}>
            Could not load agents. Check your connection.
          </p>
        )}


        <div>
          {showSkeleton
            ? [0, 1, 2].map((i) => <SkeletonRow key={i} index={i} />)
            : (() => {
                const totalTokens = agents.reduce((s, a) => s + (a.tokensUsedToday ?? 0), 0);
                return agents.map((agent, i) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    index={i}
                    tokenShare={totalTokens > 0 ? (agent.tokensUsedToday ?? 0) / totalTokens : 0}
                    onPress={() => push('agent-detail', { id: String(agent.id) })}
                    onOptions={() => push('agent-options', { id: String(agent.id) })}
                  />
                ));
              })()}

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
    </div>
  );
}
