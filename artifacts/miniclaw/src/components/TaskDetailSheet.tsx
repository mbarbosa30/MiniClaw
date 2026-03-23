import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useCompletedTasks } from '@/hooks/use-agents';
import { AgentAvatar } from '@/components/AgentAvatar';
import type { AgentTask } from '@/types';

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

export type TaskWithAgent = AgentTask & {
  agentId: string | number;
  agentName: string;
  agentEmoji?: string | null;
  agentIcon?: string | null;
  agentDescription?: string | null;
};

export type SheetVariant = 'running' | 'completed';

export function humanizeId(id?: string): string {
  if (!id) return '';
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function fmtAbsTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function getTaskDisplayTitle(task: AgentTask): string {
  return (
    task.title ??
    (task.payload as Record<string, string> | null)?.title ??
    task.description ??
    (task.payload as Record<string, string> | null)?.description ??
    task.action ??
    'Task'
  );
}

const MARKDOWN_KEYS = new Set(['research', 'markdown', 'report', 'content', 'text', 'body']);

function ResultDataSection({ data }: { data: Record<string, unknown> }) {
  const t = useTheme();
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const preStyle: React.CSSProperties = {
    fontSize: 11,
    fontFamily: 'ui-monospace, Menlo, monospace',
    color: t.label,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    maxHeight: 240,
    overflowY: 'auto',
    background: t.bg,
    borderRadius: 6,
    padding: '10px 12px',
    border: `1px solid ${t.divider}`,
  };

  return (
    <div style={{ marginTop: 16 }}>
      {entries.map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        const isMarkdownKey = MARKDOWN_KEYS.has(key.toLowerCase());
        const isLongString = typeof value === 'string' && value.length > 120;
        const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);

        return (
          <div key={key} style={{ marginBottom: 14 }}>
            <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
              {label}
            </p>
            {(isMarkdownKey || isLongString) && typeof value === 'string' ? (
              <pre style={preStyle}>{value}</pre>
            ) : Array.isArray(value) ? (
              <p style={{ fontSize: 12, fontWeight: 300, color: t.label, lineHeight: 1.55 }}>
                {(value as unknown[]).map(v =>
                  v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v)
                ).join(', ')}
              </p>
            ) : isObject ? (
              <pre style={preStyle}>{JSON.stringify(value, null, 2)}</pre>
            ) : (
              <p style={{ fontSize: 12, fontWeight: 300, color: t.label, lineHeight: 1.55 }}>
                {String(value)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TaskDetailSheet({
  task,
  variant,
  onClose,
  onViewAgent,
}: {
  task: TaskWithAgent | null;
  variant: SheetVariant;
  onClose: () => void;
  onViewAgent?: (agentId: string | number) => void;
}) {
  const t = useTheme();
  const { data: completedTasks, isLoading: completedLoading } = useCompletedTasks(
    variant === 'completed' ? task?.agentId : undefined,
  );

  const fullTask: TaskWithAgent | null = useMemo(() => {
    if (!task) return null;
    if (variant !== 'completed' || !completedTasks) return task;
    const found = completedTasks.find(ct => ct.id === task.id);
    return found ? { ...task, ...found } : task;
  }, [task, variant, completedTasks]);

  const isOpen = task !== null;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 40,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: t.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
          transform: isOpen ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '78vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {fullTask && (
          <>
            <div style={{
              padding: '18px 24px 0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <AgentAvatar
                  emoji={fullTask.agentEmoji}
                  icon={fullTask.agentIcon}
                  description={fullTask.agentDescription}
                  size={22}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 300, color: t.faint, lineHeight: 1.2 }}>
                    {fullTask.agentName}
                  </p>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: t.text,
                    lineHeight: 1.3,
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {getTaskDisplayTitle(fullTask)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: t.faint,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 100px' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {fullTask.skillId && (
                  <span style={{ ...MONO, fontSize: 9, color: t.faint, background: t.divider, borderRadius: 4, padding: '2px 6px' }}>
                    {humanizeId(fullTask.skillId)}
                  </span>
                )}
                {fullTask.taskType && (
                  <span style={{ ...MONO, fontSize: 9, color: t.faint, background: t.divider, borderRadius: 4, padding: '2px 6px' }}>
                    {fullTask.taskType}
                  </span>
                )}
                {fullTask.category && (
                  <span style={{ ...MONO, fontSize: 9, color: t.faint, background: t.divider, borderRadius: 4, padding: '2px 6px' }}>
                    {fullTask.category}
                  </span>
                )}
                {fullTask.riskLevel && fullTask.riskLevel !== 'low' && (
                  <span style={{
                    ...MONO, fontSize: 9, borderRadius: 4, padding: '2px 6px',
                    color: fullTask.riskLevel === 'high' ? '#ef4444' : '#f59e0b',
                    background: fullTask.riskLevel === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  }}>
                    {fullTask.riskLevel} risk
                  </span>
                )}
                <span style={{ ...MONO, fontSize: 9, color: t.faint }}>
                  {variant === 'completed'
                    ? fmtAbsTime(fullTask.completedAt ?? fullTask.createdAt)
                    : fmtAbsTime(fullTask.createdAt) + ' · running'}
                </span>
              </div>

              {variant === 'completed' && (
                <>
                  {completedLoading && !fullTask.result && (
                    <p style={{ fontSize: 12, color: t.faint, fontStyle: 'italic', fontWeight: 300 }}>
                      Loading result…
                    </p>
                  )}

                  {fullTask.result?.summary && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Outcome
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 300, color: t.text, lineHeight: 1.55, letterSpacing: '-0.01em' }}>
                        {fullTask.result.summary}
                      </p>
                    </div>
                  )}

                  {fullTask.result?.data && Object.keys(fullTask.result.data).length > 0 && (
                    <ResultDataSection data={fullTask.result.data} />
                  )}

                  {!completedLoading && !fullTask.result?.summary && !fullTask.result?.data && (
                    <p style={{ fontSize: 12, color: t.faint, fontStyle: 'italic', fontWeight: 300 }}>
                      No result details available.
                    </p>
                  )}
                </>
              )}

              {variant === 'running' && (
                <div>
                  {fullTask.description && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ ...MONO, fontSize: 9, color: t.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                        Description
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 300, color: t.label, lineHeight: 1.55 }}>
                        {fullTask.description}
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: t.faint, fontStyle: 'italic', fontWeight: 300 }}>
                    This task is currently in progress. Check back shortly for the result.
                  </p>
                </div>
              )}
            </div>

            {onViewAgent && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 24px 32px',
                background: t.bg,
                borderTop: `1px solid ${t.divider}`,
              }}>
                <button
                  onClick={() => { onClose(); onViewAgent(fullTask.agentId); }}
                  style={{
                    width: '100%',
                    padding: '11px 0',
                    background: 'none',
                    border: `1px solid ${t.divider}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 400,
                    color: t.text,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  View agent
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
