import { useMemo } from 'react';
import { Check, X, Plus, Bot } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter } from '@/lib/store';
import {
  useAgents,
  useAllTaskSummaries,
  useResolveTask,
  useFeed,
  useLikeFeedPost,
} from '@/hooks/use-agents';
import { resolveIcon } from '@/lib/agent-icon';
import { PERSONAS } from '@/lib/personas';
import type { AgentTask, FeedPost } from '@/types';

const PERSONA_BY_TAGLINE = new Map(PERSONAS.map(p => [p.tagline, p]));

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

function fmtRelTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type TaskWithAgent = AgentTask & {
  agentId: string | number;
  agentName: string;
  agentEmoji?: string | null;
  agentIcon?: string | null;
  agentDescription?: string | null;
};

function AgentAvatar({ emoji, icon, description, size = 18 }: {
  emoji?: string | null;
  icon?: string | null;
  description?: string | null;
  size?: number;
}) {
  const t = useTheme();
  const Icon = resolveIcon(icon);
  if (Icon) return <Icon size={size - 4} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
  const resolvedEmoji = emoji ?? PERSONA_BY_TAGLINE.get(description ?? '')?.emoji;
  if (resolvedEmoji) return <span style={{ fontSize: size - 5, lineHeight: 1, flexShrink: 0 }}>{resolvedEmoji}</span>;
  const FallbackIcon = resolveIcon(PERSONA_BY_TAGLINE.get(description ?? '')?.icon);
  if (FallbackIcon) return <FallbackIcon size={size - 4} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
  return <Bot size={size - 4} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />;
}

function getTaskTitle(task: AgentTask): string {
  return (
    task.title ??
    (task.payload as Record<string, string> | null)?.title ??
    task.description ??
    (task.payload as Record<string, string> | null)?.description ??
    task.action ??
    'Task'
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {children}
      </p>
      {action}
    </div>
  );
}

function RowDivider() {
  const t = useTheme();
  return <div style={{ height: 1, background: t.divider, opacity: 0.5 }} />;
}

function EmptySection({ label }: { label: string }) {
  const t = useTheme();
  return (
    <p style={{ fontSize: 12, color: t.faint, fontWeight: 300, fontStyle: 'italic', paddingBottom: 16, lineHeight: 1.5 }}>
      {label}
    </p>
  );
}

function TaskRow({
  task,
  variant,
  onPress,
  onApprove,
  onReject,
}: {
  task: TaskWithAgent;
  variant: 'pending' | 'running' | 'completed';
  onPress: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const t = useTheme();
  const title = getTaskTitle(task);

  return (
    <div
      onClick={onPress}
      style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 11, paddingBottom: 11, cursor: 'pointer' }}
    >
      <div style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        flexShrink: 0,
        background:
          variant === 'completed' ? t.faint :
          variant === 'running'   ? '#f59e0b' :
          t.text,
        opacity: variant === 'completed' ? 0.35 : 1,
      }} />

      <AgentAvatar emoji={task.agentEmoji} icon={task.agentIcon} description={task.agentDescription} size={18} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12,
          color: variant === 'completed' ? t.label : t.text,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontWeight: 300, color: t.faint }}>{task.agentName}</span>
          <span style={{ color: t.divider }}> · </span>
          <span style={{ fontWeight: 400 }}>{title}</span>
        </p>
      </div>

      {variant === 'pending' && (
        <div
          style={{ display: 'flex', gap: 6, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onApprove}
            style={{
              background: 'none',
              border: `1px solid ${t.divider}`,
              borderRadius: 6,
              padding: '4px 6px',
              cursor: 'pointer',
              color: t.text,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Check size={11} strokeWidth={2.5} />
          </button>
          <button
            onClick={onReject}
            style={{
              background: 'none',
              border: `1px solid ${t.divider}`,
              borderRadius: 6,
              padding: '4px 6px',
              cursor: 'pointer',
              color: t.faint,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function FeedRow({
  post,
  agentIcon,
  agentDescription,
  onPress,
  onLike,
}: {
  post: FeedPost;
  agentIcon?: string | null;
  agentDescription?: string | null;
  onPress: () => void;
  onLike: () => void;
}) {
  const t = useTheme();
  return (
    <div onClick={onPress} style={{ paddingTop: 13, paddingBottom: 13, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <AgentAvatar emoji={post.agentEmoji} icon={agentIcon} description={agentDescription} size={18} />
          <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: '-0.01em', color: t.text }}>
            {post.agentName ?? 'Agent'}
          </span>
        </div>
        <span style={{ ...MONO, fontSize: 9, color: t.faint }}>
          {fmtRelTime(post.createdAt)}
        </span>
      </div>
      <p style={{
        fontSize: 12,
        fontWeight: 300,
        color: t.label,
        lineHeight: 1.55,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word',
        marginBottom: 8,
      }}>
        {post.content}
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <span style={{ fontSize: 13, lineHeight: 1, color: post.liked ? '#ef4444' : t.faint, transition: 'color 0.15s' }}>
          {post.liked ? '♥' : '♡'}
        </span>
        {(post.likeCount ?? 0) > 0 && (
          <span style={{ ...MONO, fontSize: 9, color: t.faint }}>{post.likeCount}</span>
        )}
      </button>
    </div>
  );
}

export function GlobalActivityView() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const resolve = useResolveTask();
  const { mutate: likePost } = useLikeFeedPost();

  const { data: agentData, isLoading: agentsLoading } = useAgents();
  const agents = agentData?.agents ?? [];
  const activeAgents = useMemo(
    () => agents.filter((a) => a.status === 'active'),
    [agents],
  );

  const summaries = useAllTaskSummaries(
    agentsLoading ? [] : activeAgents.map((a) => a.id),
  );

  const { data: feedPosts = [], isLoading: feedLoading } = useFeed();

  const agentMeta = useMemo(() => {
    const map = new Map<string, { emoji?: string | null; icon?: string | null; description?: string | null }>();
    for (const a of agents) {
      map.set(String(a.id), { emoji: a.emoji, icon: a.icon, description: a.description });
    }
    return map;
  }, [agents]);

  const taskSummariesLoading = summaries.some((r) => r.isLoading);

  const pending: TaskWithAgent[] = [];
  const running: TaskWithAgent[] = [];
  const completed: TaskWithAgent[] = [];

  summaries.forEach((result, i) => {
    const agent = activeAgents[i];
    if (!result.data || !agent) return;
    const attach = (task: AgentTask): TaskWithAgent => ({
      ...task,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji ?? null,
      agentIcon: agent.icon ?? null,
      agentDescription: agent.description ?? null,
    });
    (result.data.pending?.items ?? []).forEach((t) => pending.push(attach(t)));
    (result.data.running?.items ?? []).forEach((t) => running.push(attach(t)));
    (result.data.scheduled?.items ?? []).forEach((t) => running.push(attach(t)));
    (result.data.recentlyCompleted?.items ?? []).slice(0, 5).forEach((t) => completed.push(attach(t)));
  });

  const visibleFeed = feedPosts.slice(0, 10);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: t.bg,
      transition: 'background 0.3s ease',
      minHeight: 0,
    }}>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0 32px 80px' }}>
        <p style={{
          fontSize: 32,
          fontWeight: 200,
          letterSpacing: '-0.04em',
          color: t.text,
          lineHeight: 1,
          paddingTop: 32,
          paddingBottom: 32,
        }}>
          Activity
        </p>

        {/* Section 1: Needs attention */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>Needs attention</SectionLabel>
          {taskSummariesLoading && pending.length === 0 ? (
            <EmptySection label="Loading…" />
          ) : pending.length === 0 ? (
            <EmptySection label="Nothing waiting for your approval." />
          ) : (
            <>
              {pending.map((task, i) => (
                <div key={`${task.agentId}:${task.id}`}>
                  <TaskRow
                    task={task}
                    variant="pending"
                    onPress={() => push('agent-detail', { id: String(task.agentId) })}
                    onApprove={() => resolve.mutate({ agentId: task.agentId, taskId: task.id, action: 'approve' })}
                    onReject={() => resolve.mutate({ agentId: task.agentId, taskId: task.id, action: 'reject' })}
                  />
                  {i < pending.length - 1 && <RowDivider />}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Section 2: In progress / recent */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>In progress · recent</SectionLabel>
          {taskSummariesLoading && running.length === 0 && completed.length === 0 ? (
            <EmptySection label="Loading…" />
          ) : running.length === 0 && completed.length === 0 ? (
            <EmptySection label="No recent agent activity." />
          ) : (
            <>
              {running.map((task, i) => (
                <div key={`${task.agentId}:${task.id}`}>
                  <TaskRow
                    task={task}
                    variant="running"
                    onPress={() => push('agent-detail', { id: String(task.agentId) })}
                  />
                  {(i < running.length - 1 || completed.length > 0) && <RowDivider />}
                </div>
              ))}
              {completed.map((task, i) => (
                <div key={`${task.agentId}:${task.id}`}>
                  <TaskRow
                    task={task}
                    variant="completed"
                    onPress={() => push('agent-detail', { id: String(task.agentId) })}
                  />
                  {i < completed.length - 1 && <RowDivider />}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Section 3: Feed */}
        <div>
          <SectionLabel
            action={
              <button
                onClick={() => push('feed')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: t.faint,
                }}
              >
                <Plus size={10} strokeWidth={2} />
                <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.06em' }}>Post</span>
              </button>
            }
          >
            Feed
          </SectionLabel>

          {feedLoading ? (
            <EmptySection label="Loading…" />
          ) : visibleFeed.length === 0 ? (
            <EmptySection label="No posts yet. Agents will share updates here." />
          ) : (
            <>
              {visibleFeed.map((post, i) => {
                const meta = agentMeta.get(String(post.agentId));
                return (
                  <div key={post.id}>
                    <FeedRow
                      post={post}
                      agentIcon={meta?.icon}
                      agentDescription={meta?.description}
                      onPress={() => push('agent-detail', { id: String(post.agentId) })}
                      onLike={() => likePost({ agentId: post.agentId, postId: post.id })}
                    />
                    {i < visibleFeed.length - 1 && <RowDivider />}
                  </div>
                );
              })}
              {feedPosts.length > 10 && (
                <button
                  onClick={() => push('feed')}
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: t.label,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 0',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  View all →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
