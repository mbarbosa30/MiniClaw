import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ScreenHeader, Switch, Button, Input, Textarea } from '@/components/ui';
import {
  useSkillDefs, useAgent, useToggleSkill,
  useKnowledge, useAddKnowledge, useDeleteKnowledge,
  useSoul, useUpdateSoul,
  useMemories, useUpdateMemory, useDeleteMemory,
  useTasks, useResolveTask,
  useTelegramStatus, useUpdateTelegramSettings,
  useUpdateAgent, useDeleteAgent,
} from '@/hooks/use-agents';
import { apiFetch } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trash2, Link as LinkIcon, FileText, Check, X, Send,
  Zap, BookOpen, Brain, CircleCheck,
} from 'lucide-react';
import type { Agent, HumorStyle, PremiumModel, Memory, TelegramNotificationLevel } from '@/types';
import { HUSTLE_MODE_SOUL_APPEND } from './CreateAgentView';

function SubScreenLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  const pop = useRouter(s => s.pop);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader title={title} onBack={pop} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${t.divider}`, borderTopColor: t.text, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 12, color: t.faint }}>Loading…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: t.surface, border: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.faint }}>
        {icon}
      </div>
      <p style={{ fontWeight: 600, fontSize: 14, color: t.text, letterSpacing: '-0.01em' }}>{title}</p>
      <p style={{ fontSize: 12, color: t.label, maxWidth: 220, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}

function Divider() {
  const t = useTheme();
  return <div style={{ height: 1, background: t.divider }} />;
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{ fontSize: 9, fontWeight: 600, color: t.faint, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>
      {children}
    </p>
  );
}

// --- SKILLS VIEW ---
export function SkillsView() {
  const t = useTheme();
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: skillDefs, isLoading: skillsLoading } = useSkillDefs();
  const { data: agent, isLoading: agentLoading } = useAgent(agentId);
  const toggle = useToggleSkill();
  const isLoading = skillsLoading || agentLoading;

  const enabledSet = new Set(agent?.enabledSkills ?? []);
  const skills = (skillDefs ?? []).map(skill => ({ ...skill, enabled: enabledSet.has(skill.id) }));

  return (
    <SubScreenLayout title="Skills">
      {isLoading ? <LoadingState /> : !skills.length ? (
        <EmptyState icon={<Zap size={22} />} title="No skills available" description="Skills will appear here once the API returns them." />
      ) : (
        <div>
          {skills.map((skill, i) => (
            <div key={skill.id}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: t.text, letterSpacing: '-0.01em' }}>{skill.name}</p>
                  <p style={{ fontSize: 11, color: t.label, marginTop: 2, lineHeight: 1.5 }}>{skill.description}</p>
                </div>
                <Switch
                  checked={skill.enabled}
                  onChange={(c) => toggle.mutate({ agentId, skillId: skill.id, enable: c })}
                />
              </div>
              {i < skills.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- KNOWLEDGE VIEW ---
export function KnowledgeView() {
  const t = useTheme();
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: knowledge, isLoading } = useKnowledge(agentId);
  const add = useAddKnowledge();
  const remove = useDeleteKnowledge();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const used = knowledge?.length ?? 0;

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;
    add.mutate({ agentId, data: { title: title.trim(), content: content.trim() } }, {
      onSuccess: () => { setTitle(''); setContent(''); }
    });
  };

  return (
    <SubScreenLayout title="Knowledge Base">
      <div style={{ padding: '16px 20px 20px', borderBottom: `1px solid ${t.divider}` }}>
        <div style={{ marginBottom: 12 }}>
          <MonoLabel>Title *</MonoLabel>
          <Input placeholder="e.g. Company overview" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <MonoLabel>Content *</MonoLabel>
          <Textarea rows={3} placeholder="Paste text or a URL…" value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <Button
          style={{ width: '100%' }}
          onClick={handleAdd}
          disabled={add.isPending || !title.trim() || !content.trim() || used >= 20}
        >
          {add.isPending ? 'Adding…' : used >= 20 ? 'Limit reached (20/20)' : 'Add to Knowledge Base'}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: `1px solid ${t.divider}` }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: t.faint, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace' }}>
          Saved Entries
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'ui-monospace, Menlo, monospace', color: used >= 20 ? '#f87171' : t.label }}>
          {used}/20
        </span>
      </div>

      {isLoading ? <LoadingState /> : !knowledge?.length ? (
        <EmptyState icon={<BookOpen size={22} />} title="No knowledge yet" description="Add entries to teach your agent about specific topics." />
      ) : (
        <div>
          {knowledge.map((k, i) => (
            <div key={k.id}>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ marginTop: 2, color: t.faint, flexShrink: 0 }}>
                  {k.content.startsWith('http') ? <LinkIcon size={13} /> : <FileText size={13} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.title}</p>
                  <p style={{ fontSize: 11, color: t.label, marginTop: 2, lineHeight: 1.5, wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{k.content}</p>
                </div>
                <button
                  style={{ color: t.faint, background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
                  onClick={() => remove.mutate({ agentId, id: k.id })}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {i < knowledge.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- MEMORIES VIEW ---
export function MemoriesView() {
  const t = useTheme();
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: memories, isLoading } = useMemories(agentId);
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content ?? '');
  };

  const handleSaveEdit = (memoryId: string) => {
    updateMemory.mutate(
      { agentId, id: memoryId, data: { content: editContent } },
      { onSuccess: () => { setEditingId(null); setEditContent(''); } }
    );
  };

  return (
    <SubScreenLayout title="Memories">
      {isLoading ? <LoadingState /> : !memories?.length ? (
        <EmptyState icon={<Brain size={22} />} title="No memories yet" description="Your agent forms memories as you chat over time." />
      ) : (
        <div>
          {memories.map((memory, i) => (
            <div key={memory.id}>
              <div style={{ padding: '14px 20px' }}>
                {editingId === memory.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={3}
                      style={{ fontSize: 13 }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button size="sm" style={{ flex: 1 }} onClick={() => handleSaveEdit(memory.id)} disabled={updateMemory.isPending}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: t.text, marginBottom: 10 }}>
                      {memory.content ?? JSON.stringify(memory)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {memory.category && (
                        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'ui-monospace, Menlo, monospace', padding: '2px 8px', borderRadius: 999, border: `1px solid ${t.divider}`, color: t.label, textTransform: 'capitalize' }}>
                          {memory.category}
                        </span>
                      )}
                      <button
                        style={{ fontSize: 11, color: t.faint, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                        onClick={() => handleEdit(memory)}
                      >
                        Edit
                      </button>
                      <button
                        style={{ color: t.faint, background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                        onClick={() => deleteMemory.mutate({ agentId, id: memory.id })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              {i < memories.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- TASK RISK CLASSIFICATION ---

const LOW_RISK_TYPES = new Set([
  'reminder', 'info', 'information', 'summary', 'report', 'notify',
  'notification', 'update', 'briefing', 'digest', 'alert', 'note',
  'analysis', 'research', 'insight',
]);

const HIGH_RISK_TYPES = new Set([
  'payment', 'transfer', 'post', 'send', 'sign', 'transaction',
  'submit', 'publish', 'deploy', 'execute', 'buy', 'sell',
]);

function isLowRisk(task: import('@/types').AgentTask): boolean {
  // Prefer explicit riskLevel field if available
  if (task.riskLevel === 'low') return true;
  if (task.riskLevel === 'high' || task.riskLevel === 'medium') return false;

  // Fall back to taskType/category inference
  const type = (task.taskType ?? task.category ?? '').toLowerCase();
  if (!type) return false;
  if (HIGH_RISK_TYPES.has(type)) return false;
  return LOW_RISK_TYPES.has(type);
}

// --- TASKS VIEW ---
export function TasksView() {
  const t = useTheme();
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const { data: rawTasks, isLoading } = useTasks(agentId, tab);
  const resolve = useResolveTask();
  const [autoApproved, setAutoApproved] = useState<Set<string>>(new Set());

  // Auto-approve low-risk pending tasks
  useEffect(() => {
    if (!rawTasks || tab !== 'pending') return;
    for (const task of rawTasks) {
      if (task.status !== 'pending') continue;
      if (autoApproved.has(task.id)) continue;
      if (isLowRisk(task)) {
        setAutoApproved(prev => new Set(prev).add(task.id));
        resolve.mutate({ agentId, taskId: task.id, action: 'approve' });
      }
    }
  }, [rawTasks, tab]);

  // After auto-approval, only show high-risk (action-required) tasks in 'pending' tab
  const tasks = tab === 'pending'
    ? (rawTasks ?? []).filter(task => !isLowRisk(task) && !autoApproved.has(task.id))
    : rawTasks ?? [];

  return (
    <SubScreenLayout title="Tasks">
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.divider}` }}>
        {(['pending', 'all'] as const).map(tabId => (
          <button
            key={tabId}
            style={{
              flex: 1,
              padding: '12px 0',
              fontSize: 13,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === tabId ? t.text : t.faint,
              borderBottom: `2px solid ${tab === tabId ? t.text : 'transparent'}`,
              marginBottom: -1,
              letterSpacing: '-0.01em',
            }}
            onClick={() => setTab(tabId)}
          >
            {tabId === 'pending' ? 'Action Required' : 'All Tasks'}
          </button>
        ))}
      </div>

      {autoApproved.size > 0 && tab === 'pending' && (
        <div style={{ padding: '8px 20px', background: t.surface, borderBottom: `1px solid ${t.divider}` }}>
          <p style={{ fontSize: 10, color: t.faint, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.04em' }}>
            {autoApproved.size} low-risk {autoApproved.size === 1 ? 'task' : 'tasks'} auto-approved
          </p>
        </div>
      )}

      {isLoading ? <LoadingState /> : !tasks.length ? (
        <EmptyState
          icon={<CircleCheck size={22} />}
          title={tab === 'pending' ? 'No action required' : 'No tasks yet'}
          description={tab === 'pending' ? "All pending tasks have been handled. Nice work." : "Your agent hasn't started any tasks yet."}
        />
      ) : (
        <div>
          {tasks.map((task, i) => {
            const needsAction = tab === 'pending' || task.status === 'pending';
            const taskRisk = task.riskLevel ?? (isLowRisk(task) ? 'low' : 'action');

            return (
              <div key={task.id}>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, flex: 1, lineHeight: 1.4, color: t.text }}>
                      {task.title ?? task.description ?? task.action ?? 'Pending task'}
                    </p>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                      {task.taskType && (
                        <span style={{ fontSize: 9, fontWeight: 600, fontFamily: 'ui-monospace, Menlo, monospace', padding: '2px 6px', borderRadius: 999, background: `${t.faint}20`, color: t.faint }}>
                          {task.taskType}
                        </span>
                      )}
                      {task.status && (
                        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'ui-monospace, Menlo, monospace', padding: '2px 8px', borderRadius: 999, border: `1px solid ${t.divider}`, color: t.label }}>
                          {task.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.description && task.title && (
                    <p style={{ fontSize: 11, color: t.label, lineHeight: 1.5, marginBottom: 12 }}>{task.description}</p>
                  )}
                  {needsAction && !isLowRisk(task) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 12, background: t.text, color: t.bg, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: resolve.isPending ? 0.5 : 1 }}
                        onClick={() => resolve.mutate({ agentId, taskId: task.id, action: 'approve' })}
                        disabled={resolve.isPending}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 12, background: t.surface, color: t.label, fontSize: 14, fontWeight: 600, border: `1px solid ${t.divider}`, cursor: 'pointer', opacity: resolve.isPending ? 0.5 : 1 }}
                        onClick={() => resolve.mutate({ agentId, taskId: task.id, action: 'reject' })}
                        disabled={resolve.isPending}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                  {needsAction && isLowRisk(task) && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: t.faint, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.04em' }}>
                        low-risk · auto-approved
                      </span>
                    </div>
                  )}
                </div>
                {i < tasks.length - 1 && <Divider />}
              </div>
            );
          })}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- TELEGRAM VIEW ---
export function TelegramView() {
  const t = useTheme();
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: status, isLoading } = useTelegramStatus(agentId);
  const updateSettings = useUpdateTelegramSettings();
  const qc = useQueryClient();

  const [botToken, setBotToken] = useState('');
  const [notificationLevel, setNotificationLevel] = useState<TelegramNotificationLevel>('all');

  useEffect(() => {
    if (status?.notificationLevel) setNotificationLevel(status.notificationLevel);
  }, [status?.notificationLevel]);

  const connect = useMutation({
    mutationFn: () => apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${agentId}/telegram/connect`, {
      method: 'POST',
      body: JSON.stringify({ botToken })
    }),
    onSuccess: () => { setBotToken(''); qc.invalidateQueries({ queryKey: ['telegram-status', agentId] }); }
  });

  const disconnect = useMutation({
    mutationFn: () => apiFetch<void>(`/api/selfclaw/v1/hosted-agents/${agentId}/telegram/disconnect`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-status', agentId] })
  });

  return (
    <SubScreenLayout title="Telegram Bot">
      {isLoading ? <LoadingState /> : (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${t.divider}` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.surface, border: `1px solid ${t.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.label, flexShrink: 0 }}>
              <Send size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{status?.connected ? 'Bot Connected' : 'Not Connected'}</p>
              {status?.connected && status.botUsername && (
                <p style={{ fontSize: 11, color: t.label }}>@{status.botUsername}</p>
              )}
              {!status?.connected && (
                <p style={{ fontSize: 11, color: t.label }}>Connect a Telegram bot</p>
              )}
            </div>
            {status?.connected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
          </div>

          {!status?.connected ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <MonoLabel>Bot Token</MonoLabel>
                  <Input
                    placeholder="1234567890:ABC…"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    type="password"
                  />
                </div>
                {connect.isError && (
                  <p style={{ fontSize: 11, color: '#f87171' }}>
                    {connect.error instanceof Error ? connect.error.message : 'Connection failed.'}
                  </p>
                )}
                <Button
                  style={{ width: '100%', display: 'flex', gap: 8 }}
                  onClick={() => connect.mutate()}
                  disabled={!botToken.trim() || connect.isPending}
                >
                  <Send size={15} />
                  {connect.isPending ? 'Connecting…' : 'Connect to Telegram'}
                </Button>
              </div>

              <div style={{ background: t.surface, border: `1px solid ${t.divider}`, borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 8 }}>How to create a bot</p>
                <ol style={{ fontSize: 11, color: t.label, lineHeight: 1.7, paddingLeft: 16 }}>
                  <li>Open Telegram and search for <strong style={{ color: t.text }}>@BotFather</strong></li>
                  <li>Send <code style={{ background: t.bg, padding: '1px 5px', borderRadius: 4, border: `1px solid ${t.divider}`, fontSize: 10 }}>/newbot</code> and follow prompts</li>
                  <li>Copy the API token BotFather gives you</li>
                  <li>Paste it above and tap Connect</li>
                </ol>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <MonoLabel>Notification Level</MonoLabel>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all', 'important', 'none'] as TelegramNotificationLevel[]).map(level => (
                    <button
                      key={level}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 10,
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: notificationLevel === level ? t.text : t.surface,
                        color: notificationLevel === level ? t.bg : t.label,
                        border: `1px solid ${notificationLevel === level ? t.text : t.divider}`,
                      }}
                      onClick={() => setNotificationLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {updateSettings.isError && (
                <p style={{ fontSize: 11, color: '#f87171' }}>
                  {updateSettings.error instanceof Error ? updateSettings.error.message : 'Failed to save settings.'}
                </p>
              )}
              {updateSettings.isSuccess && (
                <p style={{ fontSize: 11, color: t.label }}>Settings saved.</p>
              )}

              <Button
                style={{ width: '100%' }}
                onClick={() => updateSettings.mutate({ agentId, data: { notificationLevel } })}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
              </Button>

              <Button
                variant="destructive"
                style={{ width: '100%' }}
                onClick={() => { if (confirm('Disconnect Telegram bot?')) disconnect.mutate(); }}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? 'Disconnecting…' : 'Disconnect Bot'}
              </Button>
            </div>
          )}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- AGENT OPTIONS VIEW ---
export function AgentOptionsView() {
  const t = useTheme();
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const popWithSignal = useRouter(s => s.popWithSignal);
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');

  const subMenuItems = [
    { id: 'agent-settings', label: 'Settings',  meta: 'configure · identity' },
    { id: 'memories',       label: 'Memories',   meta: 'facts · conversations' },
    { id: 'knowledge',      label: 'Knowledge',  meta: 'docs · urls' },
    { id: 'skills',         label: 'Skills',     meta: 'capabilities' },
    { id: 'soul',           label: 'Soul',       meta: 'identity · directives' },
    { id: 'tasks',          label: 'Tasks',      meta: 'pending approvals' },
    { id: 'telegram',       label: 'Telegram',   meta: 'bot connection' },
  ];

  const allItems = [
    { id: '__new_chat__', label: 'New chat', meta: 'reset conversation' },
    ...subMenuItems,
  ];

  const handleItem = (id: string) => {
    if (id === '__new_chat__') {
      popWithSignal('newChatAt');
      return;
    }
    push(id as Parameters<typeof push>[0], { id: agentId });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader title="Options" onBack={pop} />
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 32px 80px' }}>
        {allItems.map((item, i) => (
          <button
            key={item.id}
            onClick={() => handleItem(item.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              paddingTop: 20,
              paddingBottom: 20,
              display: 'block',
              background: 'none',
              border: 'none',
              borderBottom: i < allItems.length - 1 ? `1px solid ${t.divider}` : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.025em', lineHeight: 1, color: t.text, display: 'block' }}>
              {item.label}
            </span>
            <span style={{ fontSize: 9, color: t.faint, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.04em', marginTop: 6, display: 'block' }}>
              {item.meta}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- AGENT SETTINGS VIEW (helpers) ---
const MODEL_OPTIONS: { value: PremiumModel; label: string }[] = [
  { value: 'none', label: 'standard' },
  { value: 'grok-4.20', label: 'grok 4.20' },
  { value: 'gpt-5.4', label: 'gpt-5.4' },
];

function SLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{ fontSize: 9, fontWeight: 600, color: t.faint, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', paddingTop: 28, paddingBottom: 10 }}>
      {children}
    </p>
  );
}

function SRow({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <span style={{ fontSize: 12, color: t.label, letterSpacing: '-0.01em' }}>{label}</span>
      {children}
    </div>
  );
}

function STextRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const t = useTheme();
  return (
    <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 6 }}>{label}</p>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: t.text, fontFamily: 'inherit', letterSpacing: '-0.01em', padding: 0 }} />
    </div>
  );
}

function STextAreaRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const t = useTheme();
  return (
    <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 6 }}>{label}</p>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 13, color: t.text, fontFamily: 'inherit', letterSpacing: '-0.01em', lineHeight: 1.6, padding: 0 }} />
    </div>
  );
}

function SPicker<T extends string>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: (v: T) => string }) {
  const t = useTheme();
  const i = options.indexOf(value);
  return (
    <button onClick={() => onChange(options[(i + 1) % options.length])}
      style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: t.text, letterSpacing: '0.02em', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      {label(value)}
      <span style={{ color: t.faint, fontSize: 8 }}>▼</span>
    </button>
  );
}

const HUMOR_STYLES: HumorStyle[] = ['straight', 'dry-wit', 'playful', 'sarcastic', 'absurdist'];
const HUMOR_LABEL: Record<HumorStyle, string> = {
  straight: 'No fluff',
  'dry-wit': 'Sharp',
  playful: 'Fun',
  sarcastic: 'Edgy',
  absurdist: 'Weird',
};

function ChipCloud({
  items,
  onRemove,
  onAdd,
  placeholder,
}: {
  items: string[];
  onRemove: (i: number) => void;
  onAdd: (val: string) => void;
  placeholder?: string;
}) {
  const t = useTheme();
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');

  const commit = () => {
    const v = input.trim();
    if (v) onAdd(v);
    setInput('');
    setAdding(false);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12, paddingBottom: 14 }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 100,
            background: t.surface,
            border: `1px solid ${t.divider}`,
            fontSize: 12,
            color: t.text,
            letterSpacing: '-0.01em',
          }}
        >
          {item}
          <button
            onClick={() => onRemove(i)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.faint, fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setAdding(false); setInput(''); } }}
          placeholder={placeholder ?? 'Add…'}
          style={{
            padding: '5px 10px',
            borderRadius: 100,
            background: t.surface,
            border: `1px solid ${t.text}`,
            fontSize: 12,
            color: t.text,
            outline: 'none',
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
            minWidth: 80,
            maxWidth: 140,
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 100,
            background: 'transparent',
            border: `1px dashed ${t.divider}`,
            fontSize: 12,
            color: t.faint,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          + add
        </button>
      )}
    </div>
  );
}

function SettingsForm({ agent, onDeleted }: { agent: Agent; onDeleted: () => void }) {
  const t = useTheme();
  const update = useUpdateAgent();
  const remove = useDeleteAgent();
  const { data: soul, isLoading: soulLoading } = useSoul(agent.id);
  const updateSoul = useUpdateSoul();
  const addKnowledge = useAddKnowledge();

  // --- Tune state ---
  const [localDesc, setLocalDesc] = useState(agent.description ?? '');
  const [descEditing, setDescEditing] = useState(false);
  const [localHumor, setLocalHumor] = useState<HumorStyle>(agent.humorStyle ?? 'straight');
  const [localInterests, setLocalInterests] = useState<string[]>(agent.interests ?? []);
  const [localTopics, setLocalTopics] = useState<string[]>(agent.topicsToWatch ?? []);
  const [soulExpanded, setSoulExpanded] = useState(false);
  const [soulText, setSoulText] = useState('');
  const [savingSoul, setSavingSoul] = useState(false);
  const [soulSaved, setSoulSaved] = useState(false);

  // --- Profile state ---
  const [mainSkill, setMainSkill] = useState('');
  const [platforms, setPlatforms] = useState('');
  const [country, setCountry] = useState('');
  const [agentName, setAgentName] = useState(agent.name ?? '');
  const [hustleMode, setHustleMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const baseSoul = soul?.soul ?? '';

  useEffect(() => {
    if (!soul?.soul) return;
    setHustleMode(soul.soul.includes(HUSTLE_MODE_SOUL_APPEND.trim()));
    if (!soulExpanded) setSoulText(soul.soul);
  }, [soul?.soul, soulExpanded]);

  // --- Tune handlers ---

  const handleDescBlur = async () => {
    setDescEditing(false);
    if (localDesc.trim() === (agent.description ?? '')) return;
    try {
      await update.mutateAsync({ id: agent.id, data: { description: localDesc.trim() } });
    } catch {
      setLocalDesc(agent.description ?? '');
    }
  };

  const handleHumorSelect = async (style: HumorStyle) => {
    setLocalHumor(style);
    try {
      await update.mutateAsync({ id: agent.id, data: { humorStyle: style } });
    } catch {
      setLocalHumor(agent.humorStyle ?? 'straight');
    }
  };

  const saveInterests = async (next: string[]) => {
    setLocalInterests(next);
    try {
      await update.mutateAsync({ id: agent.id, data: { interests: next } });
    } catch {
      setLocalInterests(agent.interests ?? []);
    }
  };

  const saveTopics = async (next: string[]) => {
    setLocalTopics(next);
    try {
      await update.mutateAsync({ id: agent.id, data: { topicsToWatch: next } });
    } catch {
      setLocalTopics(agent.topicsToWatch ?? []);
    }
  };

  const handleSaveSoul = async () => {
    setSavingSoul(true);
    setSoulSaved(false);
    try {
      await updateSoul.mutateAsync({ agentId: agent.id, soul: soulText });
      setSoulSaved(true);
    } catch {
      // noop
    } finally {
      setSavingSoul(false);
    }
  };

  // --- Hustle Mode handler ---

  const handleHustleToggle = async (enabled: boolean) => {
    setHustleMode(enabled);
    let newSoul = baseSoul;
    if (enabled && !newSoul.includes(HUSTLE_MODE_SOUL_APPEND.trim())) {
      newSoul = newSoul + HUSTLE_MODE_SOUL_APPEND;
    } else if (!enabled) {
      newSoul = newSoul.replace(HUSTLE_MODE_SOUL_APPEND, '').trimEnd();
    }
    try {
      await updateSoul.mutateAsync({ agentId: agent.id, soul: newSoul });
    } catch {
      setHustleMode(!enabled);
    }
  };

  const handleResetToDefaults = async () => {
    setResetting(true);
    setResetDone(false);
    setResetError(null);
    try {
      const defaultSoul = await apiFetch<{ soul?: string; template?: { soul?: string } }>(
        `/api/selfclaw/v1/hosted-agents/templates`
      ).catch(() => null);

      let soulTextReset = '';
      if (defaultSoul && !Array.isArray(defaultSoul)) {
        soulTextReset = (defaultSoul as { soul?: string }).soul ?? '';
      }

      if (!soulTextReset) {
        soulTextReset = baseSoul.replace(HUSTLE_MODE_SOUL_APPEND, '').trimEnd();
      }

      await updateSoul.mutateAsync({ agentId: agent.id, soul: soulTextReset });
      setHustleMode(false);
      setResetDone(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!mainSkill.trim() && !platforms.trim() && !country.trim() && agentName === (agent.name ?? '')) return;
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileError(null);
    try {
      const tasks: Promise<unknown>[] = [];

      if (agentName.trim() && agentName !== agent.name) {
        tasks.push(update.mutateAsync({ id: agent.id, data: { name: agentName.trim() } }));
      }
      if (mainSkill.trim()) {
        tasks.push(addKnowledge.mutateAsync({
          agentId: agent.id,
          data: { title: 'Main skill', content: mainSkill.trim() }
        }));
      }
      if (platforms.trim()) {
        tasks.push(addKnowledge.mutateAsync({
          agentId: agent.id,
          data: { title: 'Platforms I use', content: platforms.trim() }
        }));
      }
      if (country.trim()) {
        tasks.push(addKnowledge.mutateAsync({
          agentId: agent.id,
          data: { title: 'Country', content: country.trim() }
        }));
      }

      await Promise.all(tasks);
      setProfileSaved(true);
      setMainSkill('');
      setPlatforms('');
      setCountry('');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this agent? This action cannot be undone.')) {
      remove.mutate(agent.id, { onSuccess: onDeleted });
    }
  };

  return (
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto', padding: '0 32px 80px' }}>

      {/* ── TUNE SECTION ── */}
      <SLabel>Tune</SLabel>

      {/* Description — tap to edit inline */}
      <div
        style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}
        onClick={() => { if (!descEditing) setDescEditing(true); }}
      >
        {descEditing ? (
          <input
            autoFocus
            value={localDesc}
            onChange={e => setLocalDesc(e.target.value)}
            onBlur={handleDescBlur}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleDescBlur(); } }}
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: t.text, fontFamily: 'inherit', letterSpacing: '-0.01em', padding: 0 }}
          />
        ) : (
          <p style={{ fontSize: 13, color: localDesc ? t.text : t.faint, letterSpacing: '-0.01em', lineHeight: 1.5, cursor: 'text' }}>
            {localDesc || 'Tap to add a description…'}
          </p>
        )}
      </div>

      {/* Humor style — 5 tap-select pills */}
      <div style={{ paddingTop: 14, paddingBottom: 2 }}>
        <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 10 }}>Vibe</p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {HUMOR_STYLES.map(style => {
            const active = localHumor === style;
            return (
              <button
                key={style}
                onClick={() => handleHumorSelect(style)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 100,
                  border: `1.5px solid ${active ? t.text : t.divider}`,
                  background: active ? t.text : 'transparent',
                  color: active ? t.bg : t.label,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {HUMOR_LABEL[style]}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ borderBottom: `1px solid ${t.divider}`, paddingBottom: 4 }} />

      {/* Interests chip cloud */}
      <div style={{ paddingTop: 4 }}>
        <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', paddingTop: 10, marginBottom: 0 }}>Interests</p>
        <ChipCloud
          items={localInterests}
          onRemove={i => saveInterests(localInterests.filter((_, idx) => idx !== i))}
          onAdd={v => saveInterests([...localInterests, v])}
          placeholder="e.g. TikTok, savings"
        />
      </div>
      <div style={{ borderBottom: `1px solid ${t.divider}` }} />

      {/* Topics to watch chip cloud */}
      <div style={{ paddingTop: 4 }}>
        <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', paddingTop: 10, marginBottom: 0 }}>Watching</p>
        <ChipCloud
          items={localTopics}
          onRemove={i => saveTopics(localTopics.filter((_, idx) => idx !== i))}
          onAdd={v => saveTopics([...localTopics, v])}
          placeholder="e.g. exchange rates"
        />
      </div>
      <div style={{ borderBottom: `1px solid ${t.divider}` }} />

      {/* ── PROFILE SECTION ── */}
      <SLabel>Profile</SLabel>
      <STextRow
        label="Agent name"
        value={agentName}
        onChange={setAgentName}
        placeholder={agent.name ?? 'Agent name'}
      />
      <STextRow
        label="What's your main skill?"
        value={mainSkill}
        onChange={setMainSkill}
        placeholder="e.g. Video editing, prompt engineering"
      />
      <STextRow
        label="Which platforms do you use?"
        value={platforms}
        onChange={setPlatforms}
        placeholder="e.g. TikTok, Upwork, Gumroad"
      />
      <STextRow
        label="Your country"
        value={country}
        onChange={setCountry}
        placeholder="e.g. Nigeria, Kenya, Brazil"
      />

      {profileError && <p style={{ fontSize: 11, color: '#f87171', fontFamily: 'ui-monospace, Menlo, monospace', marginTop: 8 }}>{profileError}</p>}
      {profileSaved && <p style={{ fontSize: 11, color: '#22c55e', fontFamily: 'ui-monospace, Menlo, monospace', marginTop: 8 }}>Profile saved to knowledge base.</p>}

      <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
        <button
          onClick={handleSaveProfile}
          disabled={savingProfile || (!mainSkill.trim() && !platforms.trim() && !country.trim() && agentName === (agent.name ?? ''))}
          style={{ fontSize: 12, color: t.label, textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em', opacity: savingProfile ? 0.5 : 1 }}
        >
          {savingProfile ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      {/* ── HUSTLE MODE ── */}
      <SLabel>Hustle Mode</SLabel>
      <SRow label="Weekly growth plan">
        <Switch
          checked={hustleMode}
          onChange={(c) => handleHustleToggle(c)}
        />
      </SRow>
      <p style={{ fontSize: 11, color: t.faint, lineHeight: 1.5, paddingTop: 8, paddingBottom: 4 }}>
        When on, your agent proactively suggests income-generating actions every conversation.
      </p>

      {/* Soul editor — collapsed by default */}
      <div style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${t.divider}` }}>
        <button
          onClick={() => { setSoulExpanded(v => !v); if (!soulExpanded) setSoulText(baseSoul); }}
          style={{ fontSize: 12, color: t.faint, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em' }}
        >
          {soulExpanded ? 'Hide personality ↑' : 'Edit personality →'}
        </button>
        {soulExpanded && (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={soulText}
              onChange={e => setSoulText(e.target.value)}
              rows={8}
              style={{ width: '100%', background: t.surface, border: `1px solid ${t.divider}`, borderRadius: 8, outline: 'none', resize: 'none', fontSize: 12, color: t.text, fontFamily: 'inherit', letterSpacing: '-0.01em', lineHeight: 1.6, padding: '10px 12px', boxSizing: 'border-box' }}
            />
            {soulSaved && <p style={{ fontSize: 11, color: '#22c55e', fontFamily: 'ui-monospace, Menlo, monospace', marginTop: 6 }}>Saved.</p>}
            <div style={{ marginTop: 10 }}>
              <button
                onClick={handleSaveSoul}
                disabled={savingSoul || soulLoading}
                style={{ fontSize: 12, color: t.label, textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em', opacity: savingSoul ? 0.5 : 1 }}
              >
                {savingSoul ? 'Saving…' : 'Save personality'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RESET ── */}
      <SLabel>Reset</SLabel>
      {resetError && <p style={{ fontSize: 11, color: '#f87171', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>{resetError}</p>}
      {resetDone && <p style={{ fontSize: 11, color: '#22c55e', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>Reset to defaults.</p>}
      <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
        <button
          onClick={handleResetToDefaults}
          disabled={resetting || soulLoading}
          style={{ fontSize: 12, color: t.label, textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em', opacity: resetting ? 0.5 : 1 }}
        >
          {resetting ? 'Resetting…' : 'Reset to defaults'}
        </button>
      </div>

      {/* ── DANGER ── */}
      <SLabel>Danger</SLabel>
      <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
        <button onClick={handleDelete} disabled={remove.isPending}
          style={{ fontSize: 12, color: '#f87171', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em', opacity: remove.isPending ? 0.5 : 1 }}>
          {remove.isPending ? 'Deleting…' : 'Delete agent'}
        </button>
      </div>
    </div>
  );
}

export function AgentSettingsView() {
  const t = useTheme();
  const pop = useRouter(s => s.pop);
  const reset = useRouter(s => s.reset);
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: agent, isLoading } = useAgent(agentId);

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
        <ScreenHeader title="Settings" onBack={pop} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${t.divider}`, borderTopColor: t.text, animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader title="Settings" onBack={pop} />
      {agent ? (
        <SettingsForm agent={agent} onDeleted={() => reset('home')} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: t.faint }}>Agent not found</p>
        </div>
      )}
    </div>
  );
}

