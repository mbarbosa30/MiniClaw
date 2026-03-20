import { useState, useRef, useEffect } from 'react';
import { useAgent, useConversations, useMessages } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ScreenHeader, Button } from '@/components/ui';
import { MoreHorizontal, Plus } from 'lucide-react';
import { apiFetchStream } from '@/lib/api-client';
import type { Agent, ChatMessage } from '@/types';

export function AgentDetailView() {
  const t = useTheme();
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const { data: agent, isLoading } = useAgent(id);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: t.bg }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${t.divider}`, borderTopColor: t.text, animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 12, color: t.faint }}>Loading…</p>
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
        rightAction={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setNewChatTrigger(n => n + 1)}
              style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.label }}
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => push('agent-options', { id })}
              style={{ padding: 8, marginRight: -8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.label }}
            >
              <MoreHorizontal size={18} strokeWidth={1.5} />
            </button>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatTab agent={agent} agentName={agentName} newChatTrigger={newChatTrigger} />
      </div>
    </div>
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

  const agentLabel = agentName.toUpperCase();

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

          const roleLabel = m.role === 'user' ? 'YOU' : agentLabel;

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
