import { useState, useRef, useEffect } from 'react';
import { useAgent, useDeleteAgent, useUpdateAgent, useConversations, useMessages } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Button, Input, Textarea, Card, Switch } from '@/components/ui';
import { Settings, MessageSquare, Menu, Send, Trash2, Plus } from 'lucide-react';
import { BASE_URL } from '@/lib/api-client';
import type { Agent, HumorStyle, PremiumModel, ChatMessage, Conversation } from '@/types';

export function AgentDetailView() {
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const { data: agent, isLoading } = useAgent(id);
  const [tab, setTab] = useState<'chat' | 'settings' | 'more'>('chat');

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2.5">
        <div className="w-8 h-8 border-[3px] border-neutral-200 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading agent…</p>
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-[15px] font-semibold">Agent not found</p>
        <Button variant="ghost" size="sm" onClick={pop}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ScreenHeader
        title={agent.name}
        onBack={pop}
        rightAction={<span className="text-xl select-none">{agent.emoji}</span>}
      />

      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && <ChatTab agent={agent} />}
        {tab === 'settings' && <SettingsTab agent={agent} onDeleted={pop} />}
        {tab === 'more' && <MoreTab agentId={id} onNavigate={(path) => push(path as Parameters<typeof push>[0], { id })} />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-neutral-100 pb-safe pt-1.5 pb-2.5 flex justify-around items-center">
        <NavButton icon={<MessageSquare size={20} />} label="Chat" active={tab === 'chat'} onClick={() => setTab('chat')} />
        <NavButton icon={<Settings size={20} />} label="Settings" active={tab === 'settings'} onClick={() => setTab('settings')} />
        <NavButton icon={<Menu size={20} />} label="More" active={tab === 'more'} onClick={() => setTab('more')} />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[72px] py-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <div className="p-1.5">
        {icon}
      </div>
      <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
      {active && <span className="w-4 h-0.5 bg-primary rounded-full mt-0.5" />}
    </button>
  );
}

// --- CHAT TAB ---
function ChatTab({ agent }: { agent: Agent }) {
  const { data: conversations, refetch: refetchConversations } = useConversations(agent.id);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [showConversations, setShowConversations] = useState(false);
  const { data: history } = useMessages(agent.id, activeConversationId);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi! I'm ${agent.name} ${agent.emoji}. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(String(conversations[0].id));
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (history && history.length > 0 && !historyLoaded) {
      setMessages(history);
      setHistoryLoaded(true);
    }
  }, [history, historyLoaded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewConversation = () => {
    setActiveConversationId(undefined);
    setHistoryLoaded(false);
    setMessages([{ role: 'assistant', content: `New conversation with ${agent.name}. How can I help?` }]);
    setShowConversations(false);
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConversationId(String(conv.id));
    setHistoryLoaded(false);
    setMessages([]);
    setShowConversations(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'assistant', content: '' }
    ]);
    setIsStreaming(true);

    try {
      const body: { message: string; conversationId?: string } = { message: userMsg };
      if (activeConversationId) body.conversationId = activeConversationId;

      const res = await fetch(`${BASE_URL}/api/selfclaw/v1/hosted-agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed: {
              type: string;
              content?: string;
              conversationId?: number;
              messageId?: number;
              tokensUsed?: number;
              message?: string;
            } = JSON.parse(data);

            if (parsed.type === 'done') {
              if (parsed.conversationId != null && !activeConversationId) {
                setActiveConversationId(String(parsed.conversationId));
                refetchConversations();
              }
              continue;
            }

            if (parsed.type === 'error') {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'system', content: parsed.message ?? 'The agent encountered an error.' }
              ]);
              continue;
            }

            if (parsed.type !== 'stream') continue;

            const chunk = parsed.content ?? '';
            if (chunk) {
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
                return msgs;
              });
            }
          } catch {
            // Malformed SSE line — skip
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'system', content: 'Something went wrong. Please try again.' }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Conversation selector bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-neutral-100">
        <button
          className="flex-1 text-left px-3 py-1.5 rounded-lg bg-neutral-100 text-xs text-muted-foreground font-medium truncate"
          onClick={() => setShowConversations(!showConversations)}
        >
          {activeConversationId ? `Conversation #${activeConversationId.slice(-6)}` : 'New conversation'}
        </button>
        <button
          className="p-2 rounded-lg bg-primary/10 text-primary"
          onClick={startNewConversation}
          title="New conversation"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Conversation list dropdown */}
      {showConversations && conversations && conversations.length > 0 && (
        <div className="absolute top-[52px] left-3 right-3 z-50 bg-white rounded-xl border border-neutral-100 shadow-lg overflow-hidden">
          <div className="p-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors text-sm ${activeConversationId === String(conv.id) ? 'bg-primary/5 text-primary font-medium' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <p className="font-medium truncate">{conv.title || `Conversation ${String(conv.id).slice(-6)}`}</p>
                {conv.updatedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar" onClick={() => setShowConversations(false)}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm mr-2 mt-0.5 shrink-0 self-start">
                {agent.emoji}
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-md shadow-sm'
                : m.role === 'system'
                ? 'bg-destructive/8 text-destructive text-sm px-3 py-2 rounded-xl border border-destructive/15'
                : 'bg-white border border-neutral-100 rounded-tl-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
            }`}>
              {m.content === '' && m.role === 'assistant' && isStreaming && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 bg-white border-t border-neutral-100">
        <div className="flex items-end gap-2 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-primary/40 transition-colors p-1">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message…"
            className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none py-2 px-2.5 text-[15px] placeholder:text-muted-foreground"
            rows={1}
          />
          <button
            className={`p-2.5 m-0.5 rounded-lg transition-all ${input.trim() && !isStreaming ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-neutral-200 text-neutral-400'}`}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Humor style display labels
const HUMOR_LABELS: Record<HumorStyle, string> = {
  straight: 'Straight',
  'dry-wit': 'Dry Wit',
  playful: 'Playful',
  sarcastic: 'Sarcastic',
  absurdist: 'Absurdist',
};

// --- SETTINGS TAB ---
function SettingsTab({ agent, onDeleted }: { agent: Agent; onDeleted: () => void }) {
  const update = useUpdateAgent();
  const remove = useDeleteAgent();

  const [form, setForm] = useState({
    name: agent.name ?? '',
    emoji: agent.emoji ?? '🤖',
    description: agent.description ?? '',
    interests: (agent.interests ?? []).join(', '),
    topicsToWatch: (agent.topicsToWatch ?? []).join(', '),
    humorStyle: (agent.humorStyle ?? 'straight') as HumorStyle,
    premiumModel: (agent.premiumModel ?? 'none') as PremiumModel,
    socialHandles: {
      twitter: agent.socialHandles?.twitter ?? '',
      telegram: agent.socialHandles?.telegram ?? '',
      farcaster: agent.socialHandles?.farcaster ?? '',
    },
  });

  const toArray = (s: string): string[] =>
    s.split(',').map(x => x.trim()).filter(Boolean);

  const handleSave = () => {
    update.mutate({
      id: agent.id,
      data: {
        name: form.name,
        emoji: form.emoji,
        description: form.description,
        interests: toArray(form.interests),
        topicsToWatch: toArray(form.topicsToWatch),
        humorStyle: form.humorStyle,
        premiumModel: form.premiumModel,
        socialHandles: {
          twitter: form.socialHandles.twitter || undefined,
          telegram: form.socialHandles.telegram || undefined,
          farcaster: form.socialHandles.farcaster || undefined,
        },
      }
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this agent? This action cannot be undone.')) {
      remove.mutate(agent.id, { onSuccess: onDeleted });
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4 no-scrollbar pb-24">

      {/* Emoji + Name */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-neutral-200">
          {form.emoji}
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Emoji</label>
          <Input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} className="mt-1" maxLength={4} />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Name</label>
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1.5" />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Description</label>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={3} />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Interests</label>
        <Input
          value={form.interests}
          onChange={e => setForm(p => ({ ...p, interests: e.target.value }))}
          className="mt-1.5"
          placeholder="DeFi, NFTs, AI (comma-separated)"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate topics with commas</p>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Topics to Watch</label>
        <Input
          value={form.topicsToWatch}
          onChange={e => setForm(p => ({ ...p, topicsToWatch: e.target.value }))}
          className="mt-1.5"
          placeholder="Celo price, ETH news (comma-separated)"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate topics with commas</p>
      </div>

      {/* Humor Style */}
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Humor Style</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(HUMOR_LABELS) as HumorStyle[]).map(style => (
            <button
              key={style}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${form.humorStyle === style ? 'bg-primary text-primary-foreground border-primary/80 shadow-sm' : 'bg-white text-muted-foreground border-neutral-200 hover:border-neutral-300'}`}
              onClick={() => setForm(p => ({ ...p, humorStyle: style }))}
            >
              {HUMOR_LABELS[style]}
            </button>
          ))}
        </div>
      </div>

      {/* Model tier */}
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">AI Model Tier</label>
        <div className="space-y-2">
          {([
            { value: 'none', label: 'Standard', description: 'Default model included in your plan' },
            { value: 'grok-4.20', label: 'Grok 4.20', description: 'xAI advanced reasoning model' },
            { value: 'gpt-5.4', label: 'GPT-5.4', description: 'Latest OpenAI flagship model' },
          ] as { value: PremiumModel; label: string; description: string }[]).map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${form.premiumModel === value ? 'border-primary/50 bg-primary/4' : 'border-neutral-200 bg-white'}`}
              onClick={() => setForm(p => ({ ...p, premiumModel: value }))}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{label}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${form.premiumModel === value ? 'border-primary bg-primary' : 'border-neutral-300'}`}>
                  {form.premiumModel === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Social Handles */}
      <div className="space-y-3">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest block">Social Handles</label>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Twitter / X</label>
          <Input
            value={form.socialHandles.twitter}
            onChange={e => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, twitter: e.target.value } }))}
            placeholder="@username"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Telegram</label>
          <Input
            value={form.socialHandles.telegram}
            onChange={e => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, telegram: e.target.value } }))}
            placeholder="@username"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Farcaster</label>
          <Input
            value={form.socialHandles.farcaster}
            onChange={e => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, farcaster: e.target.value } }))}
            placeholder="@username"
          />
        </div>
      </div>

      {update.isError && (
        <div className="bg-destructive/8 border border-destructive/15 rounded-xl p-3.5">
          <p className="text-xs text-destructive">
            {update.error instanceof Error ? update.error.message : 'Failed to save. Please try again.'}
          </p>
        </div>
      )}

      {update.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
          <p className="text-xs text-emerald-700">Settings saved successfully.</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save Changes'}
      </Button>

      <div className="pt-2 border-t border-neutral-100">
        <Button variant="destructive" className="w-full flex gap-2" onClick={handleDelete} disabled={remove.isPending}>
          <Trash2 size={15} />
          {remove.isPending ? 'Deleting…' : 'Delete Agent'}
        </Button>
      </div>
    </div>
  );
}

// --- MORE TAB ---
function MoreTab({ agentId, onNavigate }: { agentId: string; onNavigate: (path: string) => void }) {
  const menu = [
    { id: 'memories', label: 'Memories', icon: '🧠', desc: 'Facts learned from conversations' },
    { id: 'knowledge', label: 'Knowledge Base', icon: '📚', desc: 'Custom docs & URLs' },
    { id: 'skills', label: 'Skills', icon: '⚡', desc: 'Enable capabilities' },
    { id: 'soul', label: 'Soul Document', icon: '✨', desc: 'Core identity & directives' },
    { id: 'tasks', label: 'Pending Tasks', icon: '✅', desc: 'Approve autonomous actions' },
    { id: 'telegram', label: 'Telegram Bot', icon: '✈️', desc: 'Connect to Telegram' },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-2 no-scrollbar pb-20">
      {menu.map(item => (
        <button
          key={item.id}
          className="w-full text-left bg-white rounded-xl px-4 py-3.5 flex items-center gap-3.5 border border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] active:scale-[0.98] transition-all"
          onClick={() => onNavigate(item.id)}
        >
          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xl shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] tracking-tight">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-neutral-300 shrink-0">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export { Card };
