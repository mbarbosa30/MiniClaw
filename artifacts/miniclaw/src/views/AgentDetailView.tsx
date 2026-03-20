import { useState, useRef, useEffect } from 'react';
import { useAgent, useDeleteAgent, useUpdateAgent, useConversations, useMessages } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ScreenHeader, Button } from '@/components/ui';
import { Settings, MessageSquare, MoreHorizontal, Send, Trash2, Plus } from 'lucide-react';
import { apiFetchStream } from '@/lib/api-client';
import type { Agent, HumorStyle, PremiumModel, ChatMessage } from '@/types';

export function AgentDetailView() {
  const t = useTheme();
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const { data: agent, isLoading } = useAgent(id);
  const [tab, setTab] = useState<'chat' | 'settings' | 'more'>('chat');
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: t.bg }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${t.divider}`, borderTopColor: t.text, animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 12, color: t.faint }}>Loading agent…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center', background: t.bg }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Agent not found</p>
        <Button variant="ghost" size="sm" onClick={pop}>Go Back</Button>
      </div>
    );
  }

  const agentName = agent.name || 'Agent';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader
        title={agentName}
        onBack={pop}
        rightAction={tab === 'chat' ? (
          <button
            onClick={() => setNewChatTrigger(n => n + 1)}
            style={{ padding: 8, marginRight: -8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.label }}
          >
            <Plus size={18} strokeWidth={1.5} />
          </button>
        ) : undefined}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'chat' && <ChatTab agent={agent} agentName={agentName} newChatTrigger={newChatTrigger} />}
        {tab === 'settings' && <SettingsTab agent={agent} onDeleted={pop} />}
        {tab === 'more' && <MoreTab agentId={id} onNavigate={(path) => push(path as Parameters<typeof push>[0], { id })} />}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        display: 'flex',
        paddingBottom: 20,
        paddingTop: 12,
        background: t.bg,
        borderTop: `1px solid ${t.navBorder}`,
        flexShrink: 0,
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        <NavButton icon={MessageSquare} active={tab === 'chat'} onClick={() => setTab('chat')} />
        <NavButton icon={Settings} active={tab === 'settings'} onClick={() => setTab('settings')} />
        <NavButton icon={MoreHorizontal} active={tab === 'more'} onClick={() => setTab('more')} />
      </div>
    </div>
  );
}

function NavButton({ icon, active, onClick }: { icon: React.ElementType; active: boolean; onClick: () => void }) {
  const t = useTheme();
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 0',
      }}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2.25 : 1.5}
        color={active ? t.text : t.faint}
      />
    </button>
  );
}

type LocalMessage = ChatMessage & { _ts?: number };

function fmtTime(ts?: number, iso?: string): string {
  try {
    const d = iso ? new Date(iso) : ts ? new Date(ts) : null;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

// --- CHAT TAB ---
function ChatTab({ agent, agentName, newChatTrigger }: { agent: Agent; agentName: string; newChatTrigger: number }) {
  const t = useTheme();
  const { data: conversations, refetch: refetchConversations } = useConversations(agent.id);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const { data: history } = useMessages(agent.id, activeConversationId);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const makeGreeting = (name: string) => `Hi! I'm ${name}. How can I help you today?`;

  const [messages, setMessages] = useState<LocalMessage[]>([
    { role: 'assistant', content: makeGreeting(agentName), _ts: Date.now() }
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

  useEffect(() => {
    if (newChatTrigger === 0) return;
    setActiveConversationId(undefined);
    setHistoryLoaded(false);
    setMessages([{ role: 'assistant', content: makeGreeting(agentName), _ts: Date.now() }]);
  }, [newChatTrigger]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput('');
    const now = Date.now();
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg, _ts: now },
      { role: 'assistant', content: '', _ts: undefined }
    ]);
    setIsStreaming(true);

    try {
      const body: { message: string; conversationId?: string } = { message: userMsg };
      if (activeConversationId) body.conversationId = activeConversationId;

      const res = await apiFetchStream(`/api/selfclaw/v1/hosted-agents/${agent.id}/chat`, {
        method: 'POST',
        body: JSON.stringify(body),
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
              setMessages(prev => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                if (last && last.role === 'assistant' && !last._ts) {
                  msgs[msgs.length - 1] = { ...last, _ts: Date.now() };
                }
                return msgs;
              });
              continue;
            }

            if (parsed.type === 'error') {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'system', content: parsed.message ?? 'The agent encountered an error.', _ts: Date.now() }
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg }}>
      {/* Messages */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 8px', display: 'flex', flexDirection: 'column', gap: 28 }}
      >
        {messages.map((m, i) => {
          const timestamp = fmtTime(m._ts, m.createdAt);
          const isActiveStream = isStreaming && i === messages.length - 1 && m.role === 'assistant';
          const roleLabel = m.role === 'user' ? 'YOU' : m.role === 'system' ? 'ERROR' : 'AGENT';

          if (m.role === 'system') {
            return (
              <p key={i} style={{
                fontSize: 11,
                fontFamily: 'ui-monospace, Menlo, monospace',
                color: '#f87171',
                margin: 0,
                lineHeight: 1.6,
              }}>
                {m.content}
              </p>
            );
          }

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Role + timestamp row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{
                  fontSize: 9,
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: t.faint,
                }}>
                  {roleLabel}
                </span>
                {timestamp && (
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    letterSpacing: '0.04em',
                    color: t.faint,
                    opacity: 0.6,
                  }}>
                    {timestamp}
                  </span>
                )}
              </div>
              {/* Message text */}
              <p style={{
                fontSize: 14,
                fontWeight: 300,
                lineHeight: 1.6,
                color: t.text,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
                {isActiveStream && (
                  <span style={{ borderRight: `1px solid ${t.label}`, animation: 'blink 1s step-end infinite', marginLeft: 1, paddingRight: 1 }}>&nbsp;</span>
                )}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${t.divider}`, padding: '12px 32px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message…"
            className="no-scrollbar"
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 36,
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              border: 'none',
              padding: 0,
              fontSize: 14,
              fontWeight: 300,
              color: t.text,
              fontFamily: 'inherit',
              lineHeight: 1.6,
              opacity: 1,
            }}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 14,
              letterSpacing: '0.02em',
              color: input.trim() && !isStreaming ? t.text : t.faint,
              background: 'none',
              border: 'none',
              padding: '0 0 2px',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            ↵
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        textarea::placeholder { color: ${t.faint}; opacity: 1; }
      `}</style>
    </div>
  );
}

// --- SETTINGS TAB HELPERS ---
const HUMOR_OPTIONS: HumorStyle[] = ['straight', 'dry-wit', 'playful', 'sarcastic', 'absurdist'];
const MODEL_OPTIONS: { value: PremiumModel; label: string }[] = [
  { value: 'none', label: 'standard' },
  { value: 'grok-4.20', label: 'grok 4.20' },
  { value: 'gpt-5.4', label: 'gpt-5.4' },
];

function SLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{
      fontSize: 9, fontWeight: 600, color: t.faint,
      letterSpacing: '0.10em', textTransform: 'uppercase',
      fontFamily: 'ui-monospace, Menlo, monospace',
      paddingTop: 28, paddingBottom: 10,
    }}>{children}</p>
  );
}

function SRow({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 13, paddingBottom: 13,
      borderBottom: `1px solid ${t.divider}`,
    }}>
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
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none',
          fontSize: 13, color: t.text, fontFamily: 'inherit', letterSpacing: '-0.01em',
          padding: 0,
        }}
      />
    </div>
  );
}

function STextAreaRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const t = useTheme();
  return (
    <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 6 }}>{label}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none',
          fontSize: 13, color: t.text, fontFamily: 'inherit', letterSpacing: '-0.01em',
          lineHeight: 1.6, padding: 0,
        }}
      />
    </div>
  );
}

function SPicker<T extends string>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: (v: T) => string }) {
  const t = useTheme();
  const i = options.indexOf(value);
  return (
    <button
      onClick={() => onChange(options[(i + 1) % options.length])}
      style={{
        fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: t.text,
        letterSpacing: '0.02em', background: 'none', border: 'none', padding: 0,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {label(value)}
      <span style={{ color: t.faint, fontSize: 8 }}>▼</span>
    </button>
  );
}

// --- SETTINGS TAB ---
function SettingsTab({ agent, onDeleted }: { agent: Agent; onDeleted: () => void }) {
  const t = useTheme();
  const update = useUpdateAgent();
  const remove = useDeleteAgent();

  const [form, setForm] = useState({
    name: agent.name ?? '',
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
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto', padding: '0 32px 80px' }}>
      <SLabel>Identity</SLabel>
      <STextRow label="Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Agent name" />
      <SRow label="Humor">
        <SPicker
          options={HUMOR_OPTIONS}
          value={form.humorStyle}
          onChange={v => setForm(p => ({ ...p, humorStyle: v }))}
          label={v => v}
        />
      </SRow>
      <SRow label="Model">
        <SPicker
          options={MODEL_OPTIONS.map(o => o.value)}
          value={form.premiumModel}
          onChange={v => setForm(p => ({ ...p, premiumModel: v }))}
          label={v => MODEL_OPTIONS.find(o => o.value === v)?.label ?? v}
        />
      </SRow>

      <SLabel>Content</SLabel>
      <STextAreaRow label="Description" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="What this agent does…" />
      <STextRow label="Interests" value={form.interests} onChange={v => setForm(p => ({ ...p, interests: v }))} placeholder="DeFi, NFTs, AI" />
      <STextRow label="Topics to watch" value={form.topicsToWatch} onChange={v => setForm(p => ({ ...p, topicsToWatch: v }))} placeholder="Celo price, ETH news" />

      <SLabel>Social</SLabel>
      <STextRow label="Twitter / X" value={form.socialHandles.twitter} onChange={v => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, twitter: v } }))} placeholder="@username" />
      <STextRow label="Telegram" value={form.socialHandles.telegram} onChange={v => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, telegram: v } }))} placeholder="@username" />
      <STextRow label="Farcaster" value={form.socialHandles.farcaster} onChange={v => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, farcaster: v } }))} placeholder="@username" />

      <SLabel>Actions</SLabel>
      {update.isError && (
        <p style={{ fontSize: 11, color: '#f87171', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>
          {update.error instanceof Error ? update.error.message : 'Failed to save.'}
        </p>
      )}
      {update.isSuccess && (
        <p style={{ fontSize: 11, color: '#22c55e', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>Saved.</p>
      )}
      <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
        <button
          onClick={handleSave}
          disabled={update.isPending}
          style={{ fontSize: 12, color: t.label, textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em', opacity: update.isPending ? 0.5 : 1 }}
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
      <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
        <button
          onClick={handleDelete}
          disabled={remove.isPending}
          style={{ fontSize: 12, color: '#f87171', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em', opacity: remove.isPending ? 0.5 : 1 }}
        >
          {remove.isPending ? 'Deleting…' : 'Delete agent'}
        </button>
      </div>
    </div>
  );
}

// --- MORE TAB ---
function MoreTab({ agentId, onNavigate }: { agentId: string; onNavigate: (path: string) => void }) {
  const t = useTheme();

  const menu = [
    { id: 'memories',  label: 'Memories',   meta: 'facts · conversations' },
    { id: 'knowledge', label: 'Knowledge',   meta: 'docs · urls' },
    { id: 'skills',    label: 'Skills',      meta: 'capabilities' },
    { id: 'soul',      label: 'Soul',        meta: 'identity · directives' },
    { id: 'tasks',     label: 'Tasks',       meta: 'pending approvals' },
    { id: 'telegram',  label: 'Telegram',    meta: 'bot connection' },
  ];

  return (
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto', padding: '0 32px 80px' }}>
      {menu.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            paddingTop: 20,
            paddingBottom: 20,
            display: 'block',
            background: 'none',
            border: 'none',
            borderBottom: i < menu.length - 1 ? `1px solid ${t.divider}` : 'none',
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontSize: 22,
            fontWeight: 300,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            color: t.text,
            display: 'block',
          }}>
            {item.label}
          </span>
          <span style={{
            fontSize: 9,
            color: t.faint,
            fontFamily: 'ui-monospace, Menlo, monospace',
            letterSpacing: '0.04em',
            marginTop: 6,
            display: 'block',
          }}>
            {item.meta}
          </span>
        </button>
      ))}
    </div>
  );
}

