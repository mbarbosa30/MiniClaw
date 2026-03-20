import { useState, useRef, useEffect } from 'react';
import { useAgent, useDeleteAgent, useUpdateAgent, useConversations, useMessages } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ScreenHeader, Button, Input, Textarea } from '@/components/ui';
import { Settings, MessageSquare, Menu, Send, Trash2, Plus, Bot, Brain, BookOpen, Zap, ScrollText, CircleCheck } from 'lucide-react';
import { apiFetchStream } from '@/lib/api-client';
import type { Agent, HumorStyle, PremiumModel, ChatMessage, Conversation } from '@/types';

export function AgentDetailView() {
  const t = useTheme();
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const { data: agent, isLoading } = useAgent(id);
  const [tab, setTab] = useState<'chat' | 'settings' | 'more'>('chat');

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, transition: 'background 0.3s ease' }}>
      <ScreenHeader title={agent.name} onBack={pop} />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'chat' && <ChatTab agent={agent} />}
        {tab === 'settings' && <SettingsTab agent={agent} onDeleted={pop} />}
        {tab === 'more' && <MoreTab agentId={id} onNavigate={(path) => push(path as Parameters<typeof push>[0], { id })} />}
      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        display: 'flex',
        paddingBottom: 20,
        paddingTop: 8,
        background: t.bg,
        borderTop: `1px solid ${t.divider}`,
        flexShrink: 0,
        transition: 'background 0.3s ease',
      }}>
        <NavButton icon={<MessageSquare size={19} />} label="Chat" active={tab === 'chat'} onClick={() => setTab('chat')} t={t} />
        <NavButton icon={<Settings size={19} />} label="Settings" active={tab === 'settings'} onClick={() => setTab('settings')} t={t} />
        <NavButton icon={<Menu size={19} />} label="More" active={tab === 'more'} onClick={() => setTab('more')} t={t} />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick, t }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; t: ReturnType<typeof useTheme> }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '4px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? t.text : t.faint,
      }}
    >
      <div style={{ padding: 6 }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.03em', color: active ? t.text : t.faint }}>
        {label}
      </span>
      {active && <span style={{ width: 16, height: 1.5, background: t.text, borderRadius: 1, marginTop: 2 }} />}
    </button>
  );
}

// --- CHAT TAB ---
function ChatTab({ agent }: { agent: Agent }) {
  const t = useTheme();
  const { data: conversations, refetch: refetchConversations } = useConversations(agent.id);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [showConversations, setShowConversations] = useState(false);
  const { data: history } = useMessages(agent.id, activeConversationId);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi! I'm ${agent.name}. How can I help you today?` }
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, position: 'relative' }}>
      {/* Conversation selector bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: t.bg, borderBottom: `1px solid ${t.divider}`, flexShrink: 0 }}>
        <button
          style={{
            flex: 1,
            textAlign: 'left',
            padding: '6px 12px',
            borderRadius: 8,
            background: t.surface,
            border: 'none',
            fontSize: 11,
            color: t.label,
            cursor: 'pointer',
            fontFamily: 'ui-monospace, Menlo, monospace',
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onClick={() => setShowConversations(!showConversations)}
        >
          {activeConversationId ? `conv-${activeConversationId.slice(-6)}` : 'new-conversation'}
        </button>
        <button
          style={{
            padding: 8,
            borderRadius: 8,
            background: t.surface,
            border: 'none',
            color: t.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={startNewConversation}
          title="New conversation"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Conversation list dropdown */}
      {showConversations && conversations && conversations.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 52,
          left: 12,
          right: 12,
          zIndex: 50,
          background: t.bg,
          borderRadius: 12,
          border: `1px solid ${t.divider}`,
          overflow: 'hidden',
        }}>
          <div className="no-scrollbar" style={{ padding: 6, maxHeight: 192, overflowY: 'auto' }}>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: activeConversationId === String(conv.id) ? t.surface : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  color: t.text,
                }}
                onClick={() => selectConversation(conv)}
              >
                <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.title || `conv-${String(conv.id).slice(-6)}`}
                </p>
                {conv.updatedAt && (
                  <p style={{ fontSize: 10, color: t.faint, marginTop: 2 }}>
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
        onClick={() => setShowConversations(false)}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: t.surface,
                border: `1px solid ${t.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: t.label,
                marginRight: 8,
                marginTop: 2,
                flexShrink: 0,
                alignSelf: 'flex-start',
              }}>
                <Bot size={14} />
              </div>
            )}
            <div style={{
              maxWidth: '80%',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
              padding: '10px 14px',
              fontSize: 14,
              lineHeight: 1.6,
              background: m.role === 'user'
                ? t.text
                : m.role === 'system'
                ? 'rgba(248,113,113,0.08)'
                : t.surface,
              color: m.role === 'user'
                ? t.bg
                : m.role === 'system'
                ? '#f87171'
                : t.text,
              border: m.role === 'system'
                ? '1px solid rgba(248,113,113,0.2)'
                : m.role === 'assistant'
                ? `1px solid ${t.divider}`
                : 'none',
            }}>
              {m.content === '' && m.role === 'assistant' && isStreaming && i === messages.length - 1 ? (
                <span style={{ display: 'flex', gap: 4, alignItems: 'center', height: 20 }}>
                  {[0, 1, 2].map((j) => (
                    <span key={j} style={{
                      width: 5, height: 5,
                      borderRadius: '50%',
                      background: t.faint,
                      animation: `bounce 1.2s ease-in-out ${j * 0.15}s infinite`,
                    }} />
                  ))}
                </span>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 12px', background: t.bg, borderTop: `1px solid ${t.divider}`, flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: t.surface,
          borderRadius: 14,
          border: `1px solid ${t.divider}`,
          padding: '4px 4px 4px 12px',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Message…"
            className="no-scrollbar"
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 40,
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              border: 'none',
              padding: '8px 0',
              fontSize: 14,
              color: t.text,
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
            rows={1}
          />
          <button
            style={{
              padding: '9px 10px',
              borderRadius: 10,
              background: input.trim() && !isStreaming ? t.text : t.divider,
              color: input.trim() && !isStreaming ? t.bg : t.label,
              border: 'none',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-4px); opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- SETTINGS TAB ---
const HUMOR_LABELS: Record<HumorStyle, string> = {
  straight: 'Straight',
  'dry-wit': 'Dry Wit',
  playful: 'Playful',
  sarcastic: 'Sarcastic',
  absurdist: 'Absurdist',
};

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

  const fieldGap = 14;

  return (
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 96px', display: 'flex', flexDirection: 'column', gap: fieldGap }}>
      <FieldBlock label="Name" t={t}>
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </FieldBlock>

      <FieldBlock label="Description" t={t}>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
      </FieldBlock>

      <FieldBlock label="Interests" hint="Separate topics with commas" t={t}>
        <Input
          value={form.interests}
          onChange={e => setForm(p => ({ ...p, interests: e.target.value }))}
          placeholder="DeFi, NFTs, AI"
        />
      </FieldBlock>

      <FieldBlock label="Topics to Watch" hint="Separate topics with commas" t={t}>
        <Input
          value={form.topicsToWatch}
          onChange={e => setForm(p => ({ ...p, topicsToWatch: e.target.value }))}
          placeholder="Celo price, ETH news"
        />
      </FieldBlock>

      <FieldBlock label="Humor Style" t={t}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(HUMOR_LABELS) as HumorStyle[]).map(style => (
            <button
              key={style}
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: form.humorStyle === style ? t.text : t.surface,
                color: form.humorStyle === style ? t.bg : t.label,
                border: `1px solid ${form.humorStyle === style ? t.text : t.divider}`,
              }}
              onClick={() => setForm(p => ({ ...p, humorStyle: style }))}
            >
              {HUMOR_LABELS[style]}
            </button>
          ))}
        </div>
      </FieldBlock>

      <FieldBlock label="AI Model Tier" t={t}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            { value: 'none', label: 'Standard', description: 'Default model included in your plan' },
            { value: 'grok-4.20', label: 'Grok 4.20', description: 'xAI advanced reasoning model' },
            { value: 'gpt-5.4', label: 'GPT-5.4', description: 'Latest OpenAI flagship model' },
          ] as { value: PremiumModel; label: string; description: string }[]).map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: form.premiumModel === value ? t.surface : 'transparent',
                border: `1px solid ${form.premiumModel === value ? t.text : t.divider}`,
              }}
              onClick={() => setForm(p => ({ ...p, premiumModel: value }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{label}</span>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${form.premiumModel === value ? t.text : t.divider}`,
                  background: form.premiumModel === value ? t.text : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {form.premiumModel === value && <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.bg }} />}
                </div>
              </div>
              <p style={{ fontSize: 11, color: t.label, marginTop: 2 }}>{description}</p>
            </button>
          ))}
        </div>
      </FieldBlock>

      <FieldBlock label="Social Handles" t={t}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'twitter', label: 'Twitter / X' },
            { key: 'telegram', label: 'Telegram' },
            { key: 'farcaster', label: 'Farcaster' },
          ].map(({ key, label }) => (
            <div key={key}>
              <p style={{ fontSize: 11, color: t.label, marginBottom: 4 }}>{label}</p>
              <Input
                value={form.socialHandles[key as keyof typeof form.socialHandles]}
                onChange={e => setForm(p => ({ ...p, socialHandles: { ...p.socialHandles, [key]: e.target.value } }))}
                placeholder="@username"
              />
            </div>
          ))}
        </div>
      </FieldBlock>

      {update.isError && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: '#f87171' }}>
            {update.error instanceof Error ? update.error.message : 'Failed to save. Please try again.'}
          </p>
        </div>
      )}

      {update.isSuccess && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: '#22c55e' }}>Settings saved successfully.</p>
        </div>
      )}

      <Button style={{ width: '100%' }} onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save Changes'}
      </Button>

      <div style={{ paddingTop: 8, borderTop: `1px solid ${t.divider}` }}>
        <Button variant="destructive" style={{ width: '100%', display: 'flex', gap: 8 }} onClick={handleDelete} disabled={remove.isPending}>
          <Trash2 size={15} />
          {remove.isPending ? 'Deleting…' : 'Delete Agent'}
        </Button>
      </div>
    </div>
  );
}

function FieldBlock({ label, hint, children, t }: { label: string; hint?: string; children: React.ReactNode; t: ReturnType<typeof useTheme> }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 600, color: t.faint, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: 'ui-monospace, Menlo, monospace', marginBottom: 8 }}>
        {label}
      </p>
      {children}
      {hint && <p style={{ fontSize: 10, color: t.faint, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// --- MORE TAB ---
function MoreTab({ agentId, onNavigate }: { agentId: string; onNavigate: (path: string) => void }) {
  const t = useTheme();

  const menu = [
    { id: 'memories',  label: 'Memories',       icon: <Brain size={18} />,       desc: 'Facts learned from conversations' },
    { id: 'knowledge', label: 'Knowledge Base',  icon: <BookOpen size={18} />,    desc: 'Custom docs & URLs' },
    { id: 'skills',    label: 'Skills',          icon: <Zap size={18} />,         desc: 'Enable capabilities' },
    { id: 'soul',      label: 'Soul Document',   icon: <ScrollText size={18} />,  desc: 'Core identity & directives' },
    { id: 'tasks',     label: 'Pending Tasks',   icon: <CircleCheck size={18} />, desc: 'Approve autonomous actions' },
    { id: 'telegram',  label: 'Telegram Bot',    icon: <Send size={18} />,        desc: 'Connect to Telegram' },
  ];

  return (
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto', paddingBottom: 80 }}>
      <div>
        {menu.map((item, i) => (
          <div key={item.id}>
            <button
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate(item.id)}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: t.surface,
                border: `1px solid ${t.divider}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.label,
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.text, letterSpacing: '-0.01em' }}>{item.label}</p>
                <p style={{ fontSize: 11, color: t.label, marginTop: 2 }}>{item.desc}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: t.divider, flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {i < menu.length - 1 && <div style={{ height: 1, background: t.divider, marginLeft: 70 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

