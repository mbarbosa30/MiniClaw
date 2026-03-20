import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Card, Switch, Button, Input, Textarea } from '@/components/ui';
import {
  useSkillDefs, useAgent, useToggleSkill,
  useKnowledge, useAddKnowledge, useDeleteKnowledge,
  useSoul, useUpdateSoul,
  useMemories, useUpdateMemory, useDeleteMemory,
  useTasks, useResolveTask,
  useTelegramStatus, useUpdateTelegramSettings,
} from '@/hooks/use-agents';
import { apiFetch } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Link as LinkIcon, FileText, Check, X, Send } from 'lucide-react';
import type { Memory, TelegramNotificationLevel } from '@/types';

function SubScreenLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const pop = useRouter(s => s.pop);
  return (
    <div className="h-full flex flex-col bg-background">
      <ScreenHeader title={title} onBack={pop} />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2.5">
      <div className="w-7 h-7 border-[3px] border-neutral-200 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-6">
      <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center text-2xl">{icon}</div>
      <h3 className="font-semibold text-[15px]">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">{description}</p>
    </div>
  );
}

// --- SKILLS VIEW ---
export function SkillsView() {
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
        <EmptyState icon="⚡" title="No skills available" description="Skills will appear here once the API returns them." />
      ) : (
        <div className="divide-y divide-neutral-100">
          {skills.map(skill => (
            <div key={skill.id} className="px-5 py-4 flex items-center justify-between">
              <div className="pr-4 flex-1">
                <h4 className="font-semibold text-sm">{skill.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{skill.description}</p>
              </div>
              <Switch
                checked={skill.enabled}
                onChange={(c) => toggle.mutate({ agentId, skillId: skill.id, enable: c })}
              />
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- KNOWLEDGE VIEW ---
export function KnowledgeView() {
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
      {/* Add form */}
      <div className="px-5 py-4 border-b border-neutral-100 space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Title *</label>
          <Input placeholder="e.g. Company overview" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Content *</label>
          <Textarea rows={3} placeholder="Paste text or a URL…" value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <Button
          className="w-full"
          onClick={handleAdd}
          disabled={add.isPending || !title.trim() || !content.trim() || used >= 20}
        >
          {add.isPending ? 'Adding…' : used >= 20 ? 'Limit reached (20/20)' : 'Add to Knowledge Base'}
        </Button>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Saved Entries</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${used >= 20 ? 'bg-destructive/8 text-destructive border-destructive/15' : 'bg-neutral-100 text-muted-foreground border-neutral-200'}`}>
          {used}/20
        </span>
      </div>

      {isLoading ? <LoadingState /> : !knowledge?.length ? (
        <EmptyState icon="📚" title="No knowledge yet" description="Add entries to teach your agent about specific topics." />
      ) : (
        <div className="divide-y divide-neutral-100">
          {knowledge.map(k => (
            <div key={k.id} className="px-5 py-4 flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground/40 shrink-0">
                {k.content.startsWith('http') ? <LinkIcon size={13} /> : <FileText size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{k.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 break-all leading-relaxed line-clamp-2">{k.content}</p>
              </div>
              <button
                className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 -mr-1 shrink-0"
                onClick={() => remove.mutate({ agentId, id: k.id })}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- SOUL VIEW ---
export function SoulView() {
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: soul, isLoading } = useSoul(agentId);
  const update = useUpdateSoul();
  const [soulText, setSoulText] = useState('');

  useEffect(() => {
    if (soul?.soul) setSoulText(soul.soul);
  }, [soul?.soul]);

  return (
    <SubScreenLayout title="Soul Document">
      <div className="px-5 py-4 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed border border-neutral-100 rounded-xl px-3.5 py-3 bg-neutral-50">
          The Soul document defines your agent's core identity, tone, and behavior. Edit with care.
        </p>
        {isLoading ? <LoadingState /> : (
          <>
            <Textarea
              className="min-h-[320px] font-mono text-sm leading-relaxed"
              value={soulText}
              onChange={e => setSoulText(e.target.value)}
              placeholder="System prompt and identity directives…"
            />
            {update.isError && (
              <p className="text-xs text-destructive px-0.5">
                {update.error instanceof Error ? update.error.message : 'Failed to save.'}
              </p>
            )}
            {update.isSuccess && (
              <p className="text-xs text-muted-foreground px-0.5">Soul document saved.</p>
            )}
            <Button className="w-full" onClick={() => update.mutate({ agentId, soul: soulText })} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save Soul Document'}
            </Button>
          </>
        )}
      </div>
    </SubScreenLayout>
  );
}

// --- MEMORIES VIEW ---
export function MemoriesView() {
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
        <EmptyState icon="🧠" title="No memories yet" description="Your agent forms memories as you chat over time." />
      ) : (
        <div className="divide-y divide-neutral-100">
          {memories.map(memory => (
            <div key={memory.id} className="px-5 py-4">
              {editingId === memory.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleSaveEdit(memory.id)} disabled={updateMemory.isPending}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-foreground/80 mb-2.5">
                    {memory.content ?? JSON.stringify(memory)}
                  </p>
                  <div className="flex items-center gap-2">
                    {memory.category && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize border bg-neutral-100 text-muted-foreground border-neutral-200">
                        {memory.category}
                      </span>
                    )}
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      onClick={() => handleEdit(memory)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-muted-foreground/40 hover:text-destructive transition-colors p-0.5"
                      onClick={() => deleteMemory.mutate({ agentId, id: memory.id })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- TASKS VIEW ---
export function TasksView() {
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const { data: tasks, isLoading } = useTasks(agentId, tab);
  const resolve = useResolveTask();

  return (
    <SubScreenLayout title="Tasks">
      {/* Tab switcher */}
      <div className="flex border-b border-neutral-100">
        {(['pending', 'all'] as const).map(t => (
          <button
            key={t}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'Needs Review' : 'All Tasks'}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState /> : !tasks?.length ? (
        <EmptyState
          icon="✅"
          title={tab === 'pending' ? 'No pending tasks' : 'No tasks yet'}
          description={tab === 'pending' ? "No autonomous actions are waiting for your approval." : "Your agent hasn't started any tasks yet."}
        />
      ) : (
        <div className="divide-y divide-neutral-100">
          {tasks.map(task => (
            <div key={task.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold flex-1 leading-snug">
                  {task.title ?? task.description ?? task.action ?? 'Pending task'}
                </p>
                {task.status && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-neutral-100 text-muted-foreground border-neutral-200 shrink-0">
                    {task.status}
                  </span>
                )}
              </div>
              {task.description && task.title && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{task.description}</p>
              )}
              {(task.status === 'pending' || tab === 'pending') && (
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold active:opacity-80 transition-opacity"
                    onClick={() => resolve.mutate({ agentId, taskId: task.id, action: 'approve' })}
                    disabled={resolve.isPending}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neutral-200 text-muted-foreground text-sm font-semibold active:bg-neutral-50 transition-colors"
                    onClick={() => resolve.mutate({ agentId, taskId: task.id, action: 'reject' })}
                    disabled={resolve.isPending}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SubScreenLayout>
  );
}

// --- TELEGRAM VIEW ---
export function TelegramView() {
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: status, isLoading } = useTelegramStatus(agentId);
  const updateSettings = useUpdateTelegramSettings();
  const qc = useQueryClient();

  const [botToken, setBotToken] = useState('');
  const [notificationLevel, setNotificationLevel] = useState<TelegramNotificationLevel>('all');

  useEffect(() => {
    if (status?.notificationLevel) {
      setNotificationLevel(status.notificationLevel);
    }
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
        <div className="px-5 py-4 space-y-4">
          {/* Status row */}
          <div className="flex items-center gap-3 py-3 border-b border-neutral-100">
            <span className="text-xl">✈️</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{status?.connected ? 'Bot Connected' : 'Not Connected'}</p>
              {status?.connected && status.botUsername && (
                <p className="text-xs text-muted-foreground">@{status.botUsername}</p>
              )}
              {!status?.connected && (
                <p className="text-xs text-muted-foreground">Connect a Telegram bot</p>
              )}
            </div>
            {status?.connected && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
          </div>

          {!status?.connected ? (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 block">Bot Token</label>
                  <Input
                    placeholder="1234567890:ABC…"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    type="password"
                  />
                </div>
                {connect.isError && (
                  <p className="text-xs text-destructive">
                    {connect.error instanceof Error ? connect.error.message : 'Connection failed.'}
                  </p>
                )}
                <Button
                  className="w-full flex gap-2"
                  onClick={() => connect.mutate()}
                  disabled={!botToken.trim() || connect.isPending}
                >
                  <Send size={15} />
                  {connect.isPending ? 'Connecting…' : 'Connect to Telegram'}
                </Button>
              </div>

              <div className="border border-neutral-100 rounded-xl px-4 py-3.5 bg-neutral-50">
                <h4 className="font-semibold text-sm mb-2">How to create a bot</h4>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Open Telegram and search for <strong>@BotFather</strong></li>
                  <li>Send <code className="bg-white px-1 rounded border border-neutral-200">/newbot</code> and follow prompts</li>
                  <li>Copy the API token BotFather gives you</li>
                  <li>Paste it above and tap Connect</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Notification Level</label>
                <div className="flex gap-1.5">
                  {(['all', 'important', 'none'] as TelegramNotificationLevel[]).map(level => (
                    <button
                      key={level}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all border ${notificationLevel === level ? 'bg-foreground text-background border-foreground' : 'bg-white text-muted-foreground border-neutral-200'}`}
                      onClick={() => setNotificationLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {updateSettings.isError && (
                <p className="text-xs text-destructive">
                  {updateSettings.error instanceof Error ? updateSettings.error.message : 'Failed to save settings.'}
                </p>
              )}
              {updateSettings.isSuccess && (
                <p className="text-xs text-muted-foreground">Settings saved.</p>
              )}

              <Button
                className="w-full"
                onClick={() => updateSettings.mutate({ agentId, data: { notificationLevel } })}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
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

export { Card };
