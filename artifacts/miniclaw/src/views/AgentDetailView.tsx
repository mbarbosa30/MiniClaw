import { useState, useRef, useEffect } from 'react';
import { useAgent, useDeleteAgent, useUpdateAgent } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { ScreenHeader, Button, Input, Textarea, Card } from '@/components/ui';
import { Settings, MessageSquare, Menu, Send, Trash2 } from 'lucide-react';
import { BASE_URL } from '@/lib/api-client';

export function AgentDetailView() {
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id = currentView.params?.id;
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

      <div className="flex-1 overflow-hidden relative">
        {tab === 'chat' && <ChatTab agent={agent} />}
        {tab === 'settings' && <SettingsTab agent={agent} onTabChange={setTab} onDeleted={pop} />}
        {tab === 'more' && <MoreTab agentId={id} onNavigate={(path) => push(path as any, { id })} />}
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-background border-t border-black/5 pb-safe px-6 pt-2 pb-3 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
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
function ChatTab({ agent }: { agent: any }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: `Hi! I'm ${agent.name} ${agent.emoji}. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const res = await fetch(`${BASE_URL}/api/selfclaw/v1/hosted-agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMsg })
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
        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed?.choices?.[0]?.delta?.content
                || parsed?.content
                || parsed?.text
                || (typeof parsed === 'string' ? parsed : '');
              if (chunk) {
                setMessages(prev => {
                  const msgs = [...prev];
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: msgs[msgs.length - 1].content + chunk
                  };
                  return msgs;
                });
              }
            } catch {
              // plain text chunk
              if (data && data !== '[DONE]') {
                setMessages(prev => {
                  const msgs = [...prev];
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: msgs[msgs.length - 1].content + data
                  };
                  return msgs;
                });
              }
            }
          }
        }
      }
    } catch (e) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'system', content: 'Something went wrong. Please try again.' }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
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
                ? 'bg-destructive/10 text-destructive text-sm'
                : 'bg-white border border-black/5 rounded-tl-sm shadow-sm'
            }`}>
              {m.content || (m.role === 'assistant' && isStreaming && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              ) : m.content)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-3 bg-background border-t border-black/5">
        <div className="flex items-end gap-2 bg-muted/50 rounded-2xl p-1 border border-black/5 focus-within:border-primary/20 focus-within:ring-2 focus-within:ring-primary/5 transition-all">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
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
function SettingsTab({ agent, onTabChange, onDeleted }: { agent: any; onTabChange: (tab: any) => void; onDeleted: () => void }) {
  const update = useUpdateAgent();
  const remove = useDeleteAgent();

  const [form, setForm] = useState({
    name: agent.name || '',
    emoji: agent.emoji || '🤖',
    description: agent.description || '',
    interests: agent.interests || '',
    topicsToWatch: agent.topicsToWatch || '',
    humorStyle: agent.humorStyle || 'warm',
    premiumModel: agent.premiumModel || false,
  });

  const handleSave = () => {
    update.mutate({ id: agent.id, data: form }, {
      onSuccess: () => onTabChange('chat')
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this agent? This action cannot be undone.')) {
      remove.mutate(agent.id, { onSuccess: onDeleted });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5 no-scrollbar pb-20">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-3xl">
          {form.emoji}
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emoji</label>
          <Input
            value={form.emoji}
            onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
            className="mt-1"
            placeholder="🤖"
            maxLength={4}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1.5" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={3} />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interests</label>
        <Input value={form.interests} onChange={e => setForm(p => ({ ...p, interests: e.target.value }))} className="mt-1.5" placeholder="e.g. DeFi, NFTs, AI" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Topics to Watch</label>
        <Input value={form.topicsToWatch} onChange={e => setForm(p => ({ ...p, topicsToWatch: e.target.value }))} className="mt-1.5" placeholder="e.g. Celo price, ETH news" />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Humor Style</label>
        <div className="flex flex-wrap gap-2">
          {['none', 'dry', 'warm', 'playful', 'sarcastic'].map(style => (
            <button
              key={style}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${form.humorStyle === style ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              onClick={() => setForm(p => ({ ...p, humorStyle: style }))}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-black/5">
        <div>
          <p className="font-semibold text-sm">Premium Model</p>
          <p className="text-xs text-muted-foreground mt-0.5">Use a more capable AI model</p>
        </div>
        <button
          role="switch"
          aria-checked={form.premiumModel}
          onClick={() => setForm(p => ({ ...p, premiumModel: !p.premiumModel }))}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${form.premiumModel ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.premiumModel ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <Button className="w-full" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? 'Saving...' : 'Save Changes'}
      </Button>

      <div className="pt-4 border-t border-black/5">
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
      {menu.map((item, i) => (
        <button
          key={item.id}
          className="w-full text-left bg-white rounded-2xl p-4 flex items-center gap-4 border border-black/5 shadow-sm active:scale-[0.98] transition-all hover:border-primary/10"
          onClick={() => onNavigate(item.id)}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="w-12 h-12 bg-secondary/40 rounded-xl flex items-center justify-center text-2xl shrink-0">
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
