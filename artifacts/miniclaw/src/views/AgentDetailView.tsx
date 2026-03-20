import { useState, useRef, useEffect } from 'react';
import { useAgent, useConversations, useMessages } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui';
import { MoreHorizontal } from 'lucide-react';
import { apiFetchStream } from '@/lib/api-client';
import type { Agent, ChatMessage } from '@/types';

const DOT_COLOR: Record<string, string> = {
  active: '#22c55e',
  error: '#f59e0b',
};

function statusDotColor(status: string): string {
  return DOT_COLOR[status] ?? '#555555';
}

function statusFallback(status: string): string {
  if (status === 'active') return 'active';
  return 'paused';
}

const MONO = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.07em',
} as const;

function AgentHeader({
  agent,
  onBack,
  onOptions,
  onPending,
}: {
  agent: Agent;
  onBack: () => void;
  onOptions: () => void;
  onPending: () => void;
}) {
  const t = useTheme();
  const stats = agent.stats;
  const pendingCount = stats?.pendingTasksCount ?? 0;
  const dotColor = statusDotColor(agent.status);

  const activityText: string = (() => {
    if (stats?.currentActivity) return stats.currentActivity;
    const firstTask = agent.recentTasks?.[0]?.title;
    if (firstTask) return firstTask;
    return statusFallback(agent.status);
  })();

  return (
    <div style={{
      flexShrink: 0,
      borderBottom: `1px solid ${t.divider}`,
      background: t.bg,
      height: 52,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 8,
      paddingRight: 8,
    }}>
      {/* Left — back button */}
      <button
        onClick={onBack}
        style={{ width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', color: t.label, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Center — absolutely positioned so it's always screen-centered */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        pointerEvents: 'none',
        paddingLeft: 60,
        paddingRight: 60,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 300,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          color: t.label,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          textAlign: 'center',
        }}>
          {agent.name || 'Agent'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
          <span style={{
            fontSize: 11,
            fontWeight: 300,
            color: t.faint,
            letterSpacing: '0.01em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 200,
          }}>
            {activityText}
          </span>
        </div>
      </div>

      {/* Right — pending badge + options, pushed to right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, zIndex: 1 }}>
        {pendingCount > 0 && (
          <button
            onClick={onPending}
            style={{
              padding: '2px 6px',
              background: 'none',
              border: `1px solid ${t.divider}`,
              borderRadius: 4,
              cursor: 'pointer',
              ...MONO,
              color: t.label,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            {pendingCount}
          </button>
        )}
        <button
          onClick={onOptions}
          style={{ width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', color: t.label, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <MoreHorizontal size={17} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

export function AgentDetailView() {
  const t = useTheme();
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const newChatAt: string | undefined = currentView.params?.newChatAt;
  const { data: agent, isLoading } = useAgent(id);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  useEffect(() => {
    if (newChatAt) setNewChatTrigger(n => n + 1);
  }, [newChatAt]);

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
      <AgentHeader
        agent={agent}
        onBack={pop}
        onOptions={() => push('agent-options', { id })}
        onPending={() => push('tasks', { id })}
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
            placeholder={`Message ${agentName}…`}
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
