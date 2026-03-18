import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Card, Switch, Button, Input, Textarea } from '@/components/ui';
import {
  useAgentSkills, useToggleSkill,
  useKnowledge, useAddKnowledge, useDeleteKnowledge,
  useSoul, useUpdateSoul,
  useMemories, useUpdateMemory, useDeleteMemory,
  useTasks, useResolveTask,
  useTelegramStatus, useUpdateTelegramSettings,
} from '@/hooks/use-agents';
import { apiFetch } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Link as LinkIcon, FileText, Pin, PinOff, Check, X, Send } from 'lucide-react';
import type { Memory, TelegramNotificationLevel } from '@/types';

function SubScreenLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const pop = useRouter(s => s.pop);
  return (
    <div className="h-full flex flex-col bg-background">
      <ScreenHeader title={title} onBack={pop} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-muted/20 pb-8">
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-16 h-16 bg-secondary/40 rounded-full flex items-center justify-center text-3xl">{icon}</div>
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[220px]">{description}</p>
    </div>
  );
}

// --- SKILLS VIEW ---
export function SkillsView() {
  const agentId: string = useRouter(s => s.currentView.params?.id ?? '');
  const { data: skills, isLoading } = useAgentSkills(agentId);
  const toggle = useToggleSkill();

  return (
    <SubScreenLayout title="Skills">
      {isLoading ? <LoadingState /> : !skills?.length ? (
        <EmptyState icon="⚡" title="No skills available" description="Skills will appear here once the API returns them." />
      ) : (
        skills.map(skill => (
          <div key={skill.id} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-black/5 shadow-sm">
            <div className="pr-4 flex-1">
              <h4 className="font-semibold text-sm">{skill.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{skill.description}</p>
            </div>
            <Switch
              checked={!!skill.enabled}
              onChange={(c) => toggle.mutate({ agentId, skillId: skill.id, enable: c })}
            />
          </div>
        ))
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

  const [type, setType] = useState<'text' | 'url'>('text');
  const [content, setContent] = useState('');

  const used = knowledge?.length ?? 0;

  const handleAdd = () => {
    if (!content.trim()) return;
    add.mutate({ agentId, data: { type, content: content.trim() } }, {
      onSuccess: () => setContent('')
    });
  };

  return (
    <SubScreenLayout title="Knowledge Base">
      {/* Add new */}
      <div className="bg-white rounded-2xl p-4 border border-primary/10 shadow-sm">
        <div className="flex gap-1.5 mb-4 bg-muted p-1 rounded-xl">
          {(['text', 'url'] as const).map(t => (
            <button
              key={t}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all flex items-center justify-center gap-2 ${type === t ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
              onClick={() => setType(t)}
            >
              {t === 'text' ? <FileText size={14} /> : <LinkIcon size={14} />}
              {t}
            </button>
          ))}
        </div>
        {type === 'text' ? (
          <Textarea rows={3} placeholder="Paste text content..." value={content} onChange={e => setContent(e.target.value)} className="mb-3" />
        ) : (
          <Input placeholder="https://example.com/article" value={content} onChange={e => setContent(e.target.value)} className="mb-3" />
        )}
        <Button className="w-full" onClick={handleAdd} disabled={add.isPending || !content.trim() || used >= 20}>
          {add.isPending ? 'Adding...' : used >= 20 ? 'Limit reached (20/20)' : 'Add to Knowledge Base'}
        </Button>
      </div>

      {/* Saved entries */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Entries</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${used >= 20 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/60 text-secondary-foreground'}`}>
            {used}/20
          </span>
        </div>
        {isLoading ? <LoadingState /> : !knowledge?.length ? (
          <EmptyState icon="📚" title="No knowledge yet" description="Add text or URLs to teach your agent about specific topics." />
        ) : (
          <div className="space-y-2.5">
            {knowledge.map(k => (
              <div key={k.id} className="bg-white rounded-2xl p-4 flex items-start gap-3 border border-black/5 shadow-sm">
                <div className="mt-0.5 text-primary/40 shrink-0">
                  {k.type === 'url' ? <LinkIcon size={16} /> : <FileText size={16} />}
                </div>
                <div className="flex-1 text-sm break-all leading-relaxed line-clamp-3 text-foreground/80">{k.content}</div>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5 -mr-1 shrink-0"
                  onClick={() => remove.mutate({ agentId, id: k.id })}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
      <div className="bg-secondary/20 rounded-2xl p-3 border border-secondary/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Soul document defines your agent's core identity, tone, and behavior. Edit with care.
        </p>
      </div>
      {isLoading ? <LoadingState /> : (
        <>
          <Textarea
            className="min-h-[320px] font-mono text-sm leading-relaxed"
            value={soulText}
            onChange={e => setSoulText(e.target.value)}
            placeholder="System prompt and identity directives..."
          />
          {update.isError && (
            <p className="text-xs text-destructive px-1">
              {update.error instanceof Error ? update.error.message : 'Failed to save.'}
            </p>
          )}
          {update.isSuccess && (
            <p className="text-xs text-green-700 px-1">Soul document saved.</p>
          )}
          <Button
            className="w-full"
            onClick={() => update.mutate({ agentId, soul: soulText })}
            disabled={update.isPending}
          >
            {update.isPending ? 'Saving...' : 'Save Soul Document'}
          </Button>
        </>
      )}
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
  const [editFact, setEditFact] = useState('');

  const handleEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditFact(memory.fact ?? '');
  };

  const handleSaveEdit = (memoryId: string) => {
    updateMemory.mutate(
      { agentId, id: memoryId, data: { fact: editFact } },
      { onSuccess: () => { setEditingId(null); setEditFact(''); } }
    );
  };

  const handlePin = (memory: Memory) => {
    updateMemory.mutate({ agentId, id: memory.id, data: { pinned: !memory.pinned } });
  };

  return (
    <SubScreenLayout title="Memories">
      {isLoading ? <LoadingState /> : !memories?.length ? (
        <EmptyState icon="🧠" title="No memories yet" description="Your agent forms memories as you chat over time." />
      ) : (
        memories.map(memory => (
          <div
            key={memory.id}
            className={`bg-white rounded-2xl p-4 border shadow-sm transition-all ${memory.pinned ? 'border-primary/20 bg-primary/5' : 'border-black/5'}`}
          >
            {editingId === memory.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editFact}
                  onChange={e => setEditFact(e.target.value)}
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
                <p className="text-sm leading-relaxed text-foreground/85 mb-3">
                  {memory.fact ?? JSON.stringify(memory)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 ${memory.pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                    onClick={() => handlePin(memory)}
                  >
                    {memory.pinned ? <Pin size={13} /> : <PinOff size={13} />}
                    {memory.pinned ? 'Pinned' : 'Pin'}
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs"
                    onClick={() => handleEdit(memory)}
                  >
                    Edit
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors ml-auto"
                    onClick={() => deleteMemory.mutate({ agentId, id: memory.id })}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))
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
      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {(['pending', 'all'] as const).map(t => (
          <button
            key={t}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
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
        tasks.map(task => (
          <div key={task.id} className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold flex-1 leading-snug">
                {task.title ?? task.description ?? task.action ?? 'Pending task'}
              </p>
              {task.status && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  task.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  task.status === 'approved' ? 'bg-green-100 text-green-700' :
                  task.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 text-green-700 text-sm font-semibold hover:bg-green-500/20 active:scale-95 transition-all"
                  onClick={() => resolve.mutate({ agentId, taskId: task.id, action: 'approve' })}
                  disabled={resolve.isPending}
                >
                  <Check size={15} /> Approve
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 active:scale-95 transition-all"
                  onClick={() => resolve.mutate({ agentId, taskId: task.id, action: 'reject' })}
                  disabled={resolve.isPending}
                >
                  <X size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        ))
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
  const [notificationLevel, setNotificationLevel] = useState<TelegramNotificationLevel>(
    (status?.notificationLevel) ?? 'all'
  );

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
        <>
          {/* Status */}
          <div className={`rounded-2xl p-4 flex items-center gap-3 border ${status?.connected ? 'bg-green-50 border-green-200' : 'bg-muted border-border'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${status?.connected ? 'bg-green-100' : 'bg-muted-foreground/10'}`}>
              ✈️
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{status?.connected ? 'Bot Connected' : 'Not Connected'}</p>
              {status?.connected && status.botUsername && (
                <p className="text-xs text-muted-foreground mt-0.5">@{status.botUsername}</p>
              )}
              {!status?.connected && (
                <p className="text-xs text-muted-foreground mt-0.5">Connect a Telegram bot to chat via Telegram</p>
              )}
            </div>
            {status?.connected && <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />}
          </div>

          {!status?.connected ? (
            <>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-1">Connect Bot</h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Create a bot via @BotFather on Telegram, then paste the API token below.
                  </p>
                  <Input
                    placeholder="1234567890:ABC..."
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
                  <Send size={16} />
                  {connect.isPending ? 'Connecting...' : 'Connect to Telegram'}
                </Button>
              </div>

              {/* How-to guide */}
              <div className="bg-secondary/20 rounded-2xl p-4 border border-secondary/30">
                <h4 className="font-semibold text-sm mb-2">How to create a bot</h4>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Open Telegram and search for <strong>@BotFather</strong></li>
                  <li>Send <code className="bg-white/60 px-1 rounded">/newbot</code> and follow prompts</li>
                  <li>Copy the API token BotFather gives you</li>
                  <li>Paste it above and tap Connect</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-4">
                <h3 className="font-semibold text-sm">Bot Settings</h3>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Notification Level</label>
                  <div className="flex gap-1.5">
                    {(['all', 'important', 'none'] as TelegramNotificationLevel[]).map(level => (
                      <button
                        key={level}
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl capitalize transition-all ${notificationLevel === level ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
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
                  <p className="text-xs text-green-700">Settings saved.</p>
                )}

                <Button
                  className="w-full"
                  onClick={() => updateSettings.mutate({ agentId, data: { notificationLevel } })}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => { if (confirm('Disconnect Telegram bot?')) disconnect.mutate(); }}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? 'Disconnecting...' : 'Disconnect Bot'}
              </Button>
            </div>
          )}
        </>
      )}
    </SubScreenLayout>
  );
}

export { Card };
