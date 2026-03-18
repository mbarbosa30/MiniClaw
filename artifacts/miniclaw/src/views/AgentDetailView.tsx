import { useState, useRef, useEffect } from 'react';
import { useAgent, useDeleteAgent, useUpdateAgentSettings, useConversations, useMessages } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Button, Input, Textarea, Card, Switch } from '@/components/ui';
import { Settings, MessageSquare, Menu, Send, Trash2, Plus } from 'lucide-react';
import { BASE_URL } from '@/lib/api-client';
import type { Agent, HumorStyle, ChatMessage, Conversation } from '@/types';

export function AgentDetailView() {
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const { data: agent, isLoading } = useAgent(id);
  const [tab, setTab] = useState<'chat' | 'settings' | 'more'>('chat');

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading agent...</p>
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-semibold">Agent not found</p>
        <Button variant="ghost" onClick={pop}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ScreenHeader
        title={agent.name}
        onBack={pop}
        rightAction={<div className="text-2xl select-none">{agent.emoji}</div>}
      />

      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && <ChatTab agent={agent} />}
        {tab === 'settings' && <SettingsTab agent={agent} onDeleted={pop} />}
        {tab === 'more' && <MoreTab agentId={id} onNavigate={(path) => push(path as Parameters<typeof push>[0], { id })} />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-background border-t border-black/5 pb-safe pt-2 pb-3 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <NavButton icon={<MessageSquare size={22} />} label="Chat" active={tab === 'chat'} onClick={() => setTab('chat')} />
        <NavButton icon={<Settings size={22} />} label="Settings" active={tab === 'settings'} onClick={() => setTab('settings')} />
        <NavButton icon={<Menu size={22} />} label="More" active={tab === 'more'} onClick={() => setTab('more')} />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-colors min-w-[64px] py-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );
}

// --- CHAT TAB ---
function ChatTab({ agent }: { agent: Agent }) {
  const { data: conversations } = useConversations(agent.id);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [showConversations, setShowConversations] = useState(false);

  // Load history when conversation selected
  const { data: history } = useMessages(agent.id, activeConversationId);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi! I'm ${agent.name} ${agent.emoji}. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // When history loads for a conversation, replace messages
  useEffect(() => {
    if (history && history.length > 0) {
      setMessages(history);
    }
  }, [history]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewConversation = () => {
    setActiveConversationId(undefined);
    setMessages([{ role: 'assistant', content: `New conversation with ${agent.name}. How can I help?` }]);
    setShowConversations(false);
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id);
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

      // Extract conversation ID from response headers if available
      const newConvId = res.headers.get('x-conversation-id');
      if (newConvId && !activeConversationId) {
        setActiveConversationId(newConvId);
      }

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
          let chunk = '';
          try {
            const parsed: { choices?: Array<{ delta?: { content?: string } }>; content?: string; text?: string } = JSON.parse(data);
            chunk = parsed?.choices?.[0]?.delta?.content ?? parsed?.content ?? parsed?.text ?? '';
          } catch {
            chunk = data;
          }
          if (chunk) {
            setMessages(prev => {
              const msgs = [...prev];
              const last = msgs[msgs.length - 1];
              msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
              return msgs;
            });
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
    <div className="h-full flex flex-col bg-muted/20">
      {/* Conversation selector bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background border-b border-black/5">
        <button
          className="flex-1 text-left px-3 py-1.5 rounded-xl bg-muted/50 text-xs text-muted-foreground font-medium truncate"
          onClick={() => setShowConversations(!showConversations)}
        >
          {activeConversationId ? `Conversation #${activeConversationId.slice(-6)}` : 'New conversation'}
        </button>
        <button
          className="p-2 rounded-xl bg-primary/10 text-primary"
          onClick={startNewConversation}
          title="New conversation"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Conversation list dropdown */}
      {showConversations && conversations && conversations.length > 0 && (
        <div className="absolute top-[120px] left-3 right-3 z-50 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden">
          <div className="p-2 max-h-48 overflow-y-auto no-scrollbar">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-sm"
                onClick={() => selectConversation(conv)}
              >
                <p className="font-medium truncate">{conv.title || `Conversation ${conv.id.slice(-6)}`}</p>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar" onClick={() => setShowConversations(false)}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base mr-2 mt-0.5 shrink-0 self-start">
                {agent.emoji}
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                : m.role === 'system'
                ? 'bg-destructive/10 text-destructive text-sm px-3 py-2'
                : 'bg-white border border-black/5 rounded-tl-sm shadow-sm'
            }`}>
              {m.content === '' && m.role === 'assistant' && isStreaming && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
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
      <div className="p-3 bg-background border-t border-black/5">
        <div className="flex items-end gap-2 bg-muted/40 rounded-2xl p-1 border border-black/5 focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/5 transition-all">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-3 text-[15px] placeholder:text-muted-foreground"
            rows={1}
          />
          <button
            className={`p-3 m-0.5 rounded-xl transition-all ${input.trim() && !isStreaming ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SETTINGS TAB ---
function SettingsTab({ agent, onDeleted }: { agent: Agent; onDeleted: () => void }) {
  const update = useUpdateAgentSettings();
  const remove = useDeleteAgent();

  const [form, setForm] = useState({
    name: agent.name ?? '',
    emoji: agent.emoji ?? '🤖',
    description: agent.description ?? '',
    interests: agent.interests ?? '',
    topicsToWatch: agent.topicsToWatch ?? '',
    humorStyle: agent.humorStyle as HumorStyle,
    premiumModel: agent.premiumModel ?? false,
    socialHandles: {
      twitter: agent.socialHandles?.twitter ?? '',
      telegram: agent.socialHandles?.telegram ?? '',
      farcaster: agent.socialHandles?.farcaster ?? '',
    },
  });

  const handleSave = () => {
    update.mutate({
      id: agent.id,
      data: {
        name: form.name,
        emoji: form.emoji,
        description: form.description,
        interests: form.interests,
        topicsToWatch: form.topicsToWatch,
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
    <div className="h-full overflow-y-auto p-5 space-y-5 no-scrollbar pb-24">

      {/* Emoji + Name */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 bg-secondary/40 rounded-2xl flex items-center justify-center text-3xl shrink-0">
          {form.emoji}
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emoji</label>
          <Input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} className="mt-1" maxLength={4} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interests</label>
        <Input value={form.interests} onChange={e => setForm(p => ({ ...p, interests: e.target.value }))} className="mt-1" placeholder="e.g. DeFi, NFTs, AI" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topics to Watch</label>
        <Input value={form.topicsToWatch} onChange={e => setForm(p => ({ ...p, topicsToWatch: e.target.value }))} className="mt-1" placeholder="e.g. Celo price, ETH news" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Humor Style</label>
        <div className="flex flex-wrap gap-2">
          {(['none', 'dry', 'warm', 'playful', 'sarcastic'] as HumorStyle[]).map(style => (
            <button
              key={style}
              type="button"
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${form.humorStyle === style ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              onClick={() => setForm(p => ({ ...p, humorStyle: style }))}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Social Handles */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Social Handles</label>
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

      {/* Premium Model */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-black/5 shadow-sm">
        <div>
          <p className="font-semibold text-sm">Premium Model</p>
          <p className="text-xs text-muted-foreground mt-0.5">Use a more capable AI model (uses more credits)</p>
        </div>
        <Switch
          checked={form.premiumModel}
          onChange={(checked) => setForm(p => ({ ...p, premiumModel: checked }))}
        />
      </div>

      {update.isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5">
          <p className="text-xs text-destructive">
            {update.error instanceof Error ? update.error.message : 'Failed to save. Please try again.'}
          </p>
        </div>
      )}

      {update.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3.5">
          <p className="text-xs text-green-700">Settings saved successfully.</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? 'Saving...' : 'Save Changes'}
      </Button>

      <div className="pt-2 border-t border-black/5">
        <Button variant="destructive" className="w-full flex gap-2" onClick={handleDelete} disabled={remove.isPending}>
          <Trash2 size={16} />
          {remove.isPending ? 'Deleting...' : 'Delete Agent'}
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
    <div className="h-full overflow-y-auto p-4 space-y-2.5 no-scrollbar pb-20 bg-muted/20">
      {menu.map(item => (
        <button
          key={item.id}
          className="w-full text-left bg-white rounded-2xl p-4 flex items-center gap-4 border border-black/5 shadow-sm active:scale-[0.98] transition-all hover:border-primary/10"
          onClick={() => onNavigate(item.id)}
        >
          <div className="w-12 h-12 bg-secondary/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground/40 shrink-0">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// Re-export Card for use in subviews (avoid circular dep)
export { Card };
