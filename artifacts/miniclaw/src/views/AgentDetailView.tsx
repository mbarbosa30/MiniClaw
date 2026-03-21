import { useState, useRef, useEffect, useCallback } from 'react';
import { useAgent, useConversations, useMessages, useAwareness } from '@/hooks/use-agents';
import { useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui';
import { MoreHorizontal, Bot } from 'lucide-react';
import { apiFetchStream, apiFetch, ApiError } from '@/lib/api-client';
import { resolveIcon } from '@/lib/agent-icon';
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

// --- Phase colors ---

const PHASE_COLOR: Record<string, string> = {
  curious: '#555555',
  developing: '#f59e0b',
  confident: '#22c55e',
};

function phaseColor(phase: string): string {
  return PHASE_COLOR[phase] ?? '#555555';
}

// --- Awareness section ---

function AwarenessSection({ agentId }: { agentId: string }) {
  const t = useTheme();
  const { data, isLoading } = useAwareness(agentId);

  if (isLoading) {
    return (
      <div style={{
        flexShrink: 0,
        padding: '10px 20px 12px',
        borderBottom: `1px solid ${t.divider}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ height: 16, width: '28%', background: t.surface, borderRadius: 3 }} />
          <div style={{ height: 9, width: '10%', background: t.surface, borderRadius: 2 }} />
        </div>
        <div style={{ height: 1.5, background: t.surface, borderRadius: 1, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ height: 9, width: '45%', background: t.surface, borderRadius: 2 }} />
          <div style={{ height: 9, width: '35%', background: t.surface, borderRadius: 2 }} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const color = phaseColor(data.phase);
  const pct = Math.min(Math.max(data.progress ?? 0, 0), 100);

  const onchain = data.onChain ?? { wallet: false, token: false, identity: false };

  // Economy capabilities — prefer economyCapabilities, fall back to legacy phaseDetails
  const ec = data.economyCapabilities;
  const phaseBehavior = ec?.currentPhase?.behavior ?? ec?.currentPhase?.description ?? data.phaseDetails?.behavior ?? null;
  const economyAware = ec?.economyAwareness ?? data.phaseDetails?.economyAwareness ?? false;
  const allTools = ec?.toolsAvailable ?? data.toolsAvailable ?? [];
  const visibleTools = allTools.slice(0, 3);
  const extraTools = allTools.length > 3 ? allTools.length - 3 : 0;

  const formatTool = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const OnchainDot = ({ done, label }: { done: boolean; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {done ? (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="4" cy="4" r="3.5" fill="#22c55e" />
          <path d="M2.2 4l1.2 1.2 2.4-2.4" stroke="#0f0f0f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'transparent',
          border: `1px solid ${t.faint}`,
          flexShrink: 0,
        }} />
      )}
      <span style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 9,
        color: done ? t.label : t.faint,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );

  return (
    <div style={{
      flexShrink: 0,
      padding: '10px 20px 12px',
      borderBottom: `1px solid ${t.divider}`,
    }}>
      {/* Phase pill + percentage */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: phaseBehavior ? 5 : 6 }}>
        <span style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 8,
          color,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          background: `${color}1a`,
          border: `1px solid ${color}40`,
          borderRadius: 3,
          padding: '2px 5px',
        }}>
          {data.label || data.phase}
        </span>
        <span style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 9,
          color: t.faint,
          letterSpacing: '0.02em',
        }}>
          {pct}%
        </span>
      </div>

      {/* Phase behavior text */}
      {phaseBehavior && (
        <p style={{
          fontSize: 10,
          color: t.label,
          lineHeight: 1.5,
          letterSpacing: '-0.005em',
          marginBottom: 6,
        }}>
          {phaseBehavior}
        </p>
      )}

      {/* Progress bar */}
      <div style={{ height: 1.5, background: t.surface, borderRadius: 1, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 1,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Onchain dots + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <OnchainDot done={onchain.wallet} label="wallet" />
        <OnchainDot done={onchain.token} label="token" />
        <OnchainDot done={onchain.identity} label="identity" />
        <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.02em' }}>
          {data.memoriesLearned ?? 0}m · {data.conversationCount ?? 0}c · {data.messageCount ?? 0}msg
        </span>
      </div>

      {/* Economy awareness badge + tools */}
      {(economyAware || visibleTools.length > 0) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {economyAware && (
            <span style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#22c55e',
              background: '#22c55e1a',
              border: '1px solid #22c55e40',
              borderRadius: 3,
              padding: '2px 5px',
            }}>
              Economy aware
            </span>
          )}
          {visibleTools.map(tool => (
            <span
              key={tool}
              style={{
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 8,
                letterSpacing: '0.04em',
                color: t.faint,
                background: t.surface,
                border: `1px solid ${t.divider}`,
                borderRadius: 3,
                padding: '2px 5px',
              }}
            >
              {formatTool(tool)}
            </span>
          ))}
          {extraTools > 0 && (
            <span style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 8,
              letterSpacing: '0.04em',
              color: t.faint,
            }}>
              +{extraTools} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// --- Quota bar ---

interface QuotaState {
  used: number;
  limit: number;
}

function QuotaBar({ quota }: { quota: QuotaState | null }) {
  const t = useTheme();
  if (!quota || quota.limit <= 0) return null;

  const pct = Math.min(quota.used / quota.limit, 1);
  const isWarning = pct >= 0.8;

  return (
    <div style={{ marginTop: 6, paddingBottom: 6 }}>
      <div style={{ height: 2, background: t.surface, borderRadius: 1, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            background: isWarning ? '#f59e0b' : t.faint,
            borderRadius: 1,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {isWarning && (
        <p style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 8,
          color: '#f59e0b',
          letterSpacing: '0.05em',
          marginTop: 3,
          textAlign: 'center',
        }}>
          Almost at limit — upgrade for more
        </p>
      )}
    </div>
  );
}

// --- Agent Header ---

function AgentHeader({
  agent,
  onBack,
  onOptions,
  onPending,
  quota,
}: {
  agent: Agent;
  onBack: () => void;
  onOptions: () => void;
  onPending: () => void;
  quota: QuotaState | null;
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

  const SIDE_W = 72;

  return (
    <div style={{
      flexShrink: 0,
      borderBottom: `1px solid ${t.divider}`,
      background: t.bg,
      paddingLeft: 8,
      paddingRight: 8,
    }}>
      <div style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Left — fixed width, back button */}
        <div style={{ width: SIDE_W, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onBack}
            style={{ width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', color: t.label, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        </div>

        {/* Center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, maxWidth: '100%', overflow: 'hidden' }}>
            {(() => { const Icon = resolveIcon(agent.icon) ?? Bot; return <Icon size={12} strokeWidth={1.5} color={t.faint} style={{ flexShrink: 0 }} />; })()}
            <span style={{
              fontSize: 13,
              fontWeight: 300,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              color: t.label,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}>
              {agent.name || 'Agent'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: '100%', overflow: 'hidden' }}>
            <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <span style={{
              fontSize: 9,
              fontWeight: 300,
              color: t.faint,
              letterSpacing: '0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {activityText}
            </span>
          </div>
        </div>

        {/* Right — fixed width */}
        <div style={{ width: SIDE_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {pendingCount > 0 && (
            <button
              onClick={onPending}
              style={{
                padding: '2px 5px',
                background: 'none',
                border: `1px solid ${t.divider}`,
                borderRadius: 4,
                cursor: 'pointer',
                ...MONO,
                color: t.label,
                lineHeight: 1.4,
                flexShrink: 0,
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

      {/* Quota bar */}
      <div style={{ paddingLeft: 8, paddingRight: 8, paddingBottom: quota ? 0 : undefined }}>
        <QuotaBar quota={quota} />
      </div>
    </div>
  );
}

// --- Quick reply chips per persona ---

const PERSONA_CHIPS: Record<string, string[]> = {
  'ai hustle builder': ['Find me a gig', "What's trending in AI?", 'Help me write a proposal', 'Track my income'],
  'market analyst': ['Latest market update', 'Best opportunities today', 'Analyze this token', 'Portfolio summary'],
  'content creator': ['Content ideas for today', 'Help me write a post', 'What is trending?', 'Schedule my week'],
  'researcher': ['Summarize recent news', 'Deep dive on topic', 'Find sources', 'Latest developments'],
  'reminder bot': ['Set a reminder', 'What do I have today?', 'Morning briefing', 'Upcoming tasks'],
  'default': ['What can you do?', 'Give me a summary', 'What did you find?', 'Anything new?'],
};

function getPersonaChips(agent: Agent): string[] {
  const nameLower = agent.name?.toLowerCase() ?? '';
  const descLower = agent.description?.toLowerCase() ?? '';
  const combined = `${nameLower} ${descLower}`;

  for (const [key, chips] of Object.entries(PERSONA_CHIPS)) {
    if (key === 'default') continue;
    if (combined.includes(key)) return chips;
  }

  // Fallback based on keywords
  if (combined.includes('gig') || combined.includes('hustle') || combined.includes('income')) {
    return PERSONA_CHIPS['ai hustle builder'];
  }
  if (combined.includes('market') || combined.includes('crypto') || combined.includes('price')) {
    return PERSONA_CHIPS['market analyst'];
  }
  if (combined.includes('content') || combined.includes('post') || combined.includes('write')) {
    return PERSONA_CHIPS['content creator'];
  }
  if (combined.includes('research') || combined.includes('news') || combined.includes('analys')) {
    return PERSONA_CHIPS['researcher'];
  }
  if (combined.includes('remind') || combined.includes('schedule') || combined.includes('task')) {
    return PERSONA_CHIPS['reminder bot'];
  }

  return PERSONA_CHIPS['default'];
}

// --- localStorage message cache ---

const MSG_CACHE_PREFIX = 'miniclaw_msgs_';

function getCachedMessages(agentId: string | number): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${MSG_CACHE_PREFIX}${agentId}`);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function setCachedMessages(agentId: string | number, messages: ChatMessage[]) {
  try {
    const last3 = messages.filter(m => m.role !== 'system').slice(-6);
    localStorage.setItem(`${MSG_CACHE_PREFIX}${agentId}`, JSON.stringify(last3));
  } catch {
    // ignore
  }
}

// --- Main view ---

export function AgentDetailView() {
  const t = useTheme();
  const currentView = useRouter(s => s.currentView);
  const pop = useRouter(s => s.pop);
  const push = useRouter(s => s.push);
  const id: string = currentView.params?.id ?? '';
  const newChatAt: string | undefined = currentView.params?.newChatAt;
  const briefContext: string | undefined = currentView.params?.briefContext;
  const { data: agent, isLoading, isError, error, refetch } = useAgent(id);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [quota, setQuota] = useState<QuotaState | null>(null);

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

  if (isError) {
    const is404 = error instanceof ApiError && error.status === 404;
    if (is404) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center', background: t.bg }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Agent not found</p>
          <Button variant="ghost" size="sm" onClick={pop}>Go Back</Button>
        </div>
      );
    }
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center', background: t.bg }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Couldn't load agent</p>
        <p style={{ fontSize: 12, color: t.faint }}>A network error occurred. Please try again.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>Retry</Button>
        <Button variant="ghost" size="sm" onClick={pop}>Go Back</Button>
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
        quota={quota}
      />
      <AwarenessSection agentId={id} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatTab
          agent={agent}
          agentName={agentName}
          newChatTrigger={newChatTrigger}
          briefContext={briefContext}
          onQuotaUpdate={setQuota}
        />
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

const SSE_TIMEOUT_MS = 8000;

function ChatTab({
  agent,
  agentName,
  newChatTrigger,
  briefContext,
  onQuotaUpdate,
}: {
  agent: Agent;
  agentName: string;
  newChatTrigger: number;
  briefContext?: string;
  onQuotaUpdate: (q: QuotaState | null) => void;
}) {
  const t = useTheme();
  const { data: conversations, refetch: refetchConversations } = useConversations(agent.id);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const { data: history } = useMessages(agent.id, activeConversationId);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const makeGreeting = (name: string) => `Hi! I'm ${name}. How can I help you today?`;

  const cachedMsgs = getCachedMessages(agent.id);
  const initialMessages: LocalMessage[] = cachedMsgs.length > 0
    ? cachedMsgs
    : [{ role: 'assistant', content: makeGreeting(agentName), _ts: Date.now() }];

  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const chips = getPersonaChips(agent);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(String(conversations[0].id));
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (history && history.length > 0 && !historyLoaded) {
      setMessages(history);
      setHistoryLoaded(true);
      setCachedMessages(agent.id, history);
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

  // Brief context — inject as first user message when provided
  useEffect(() => {
    if (briefContext && !isStreaming) {
      const hasContext = messages.some(m => m.role === 'user' && m.content === briefContext);
      if (!hasContext) {
        handleSend(briefContext);
      }
    }
  }, [briefContext]);

  const parseQuotaHeaders = (headers: Headers) => {
    const used = parseInt(headers.get('X-Quota-Used') ?? '', 10);
    const limit = parseInt(headers.get('X-Quota-Limit') ?? '', 10);
    if (!isNaN(used) && !isNaN(limit) && limit > 0) {
      onQuotaUpdate({ used, limit });
    }
  };

  const pollForResult = async (messageId: string) => {
    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await apiFetch<{ content: string; done?: boolean }>(
          `/api/selfclaw/v1/hosted-agents/${agent.id}/chat/${messageId}/result`
        );
        if (res.content) {
          setMessages(prev => {
            const msgs = [...prev];
            const last = msgs[msgs.length - 1];
            if (last && last.role === 'assistant') {
              msgs[msgs.length - 1] = { ...last, content: res.content, _ts: Date.now() };
            }
            return msgs;
          });
          if (res.done !== false) return;
        }
      } catch {
        // keep polling
      }
    }
  };

  const handleSend = useCallback(async (override?: string) => {
    const userMsg = (override ?? input).trim();
    if (!userMsg || isStreaming) return;
    if (!override) setInput('');
    const now = Date.now();
    setMessages(prev => {
      const next = [
        ...prev,
        { role: 'user' as const, content: userMsg, _ts: now },
        { role: 'assistant' as const, content: '', _ts: undefined },
      ];
      return next;
    });
    setIsStreaming(true);

    try {
      const body: { message: string; conversationId?: string } = { message: userMsg };
      if (activeConversationId) body.conversationId = activeConversationId;

      const res = await apiFetchStream(`/api/selfclaw/v1/hosted-agents/${agent.id}/chat`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      parseQuotaHeaders(res.headers);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      let buffer = '';
      let pendingMessageId: string | null = null;
      let gotAnyData = false;

      const sseTimeout = setTimeout(() => {
        if (!gotAnyData && pendingMessageId) {
          reader.cancel();
          pollForResult(pendingMessageId);
        }
      }, SSE_TIMEOUT_MS);

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
              messageId?: number | string;
              tokensUsed?: number;
              message?: string;
            } = JSON.parse(data);

            if (parsed.messageId) {
              pendingMessageId = String(parsed.messageId);
            }

            if (parsed.type === 'done') {
              clearTimeout(sseTimeout);
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
                setCachedMessages(agent.id, msgs);
                return msgs;
              });
              continue;
            }

            if (parsed.type === 'error') {
              clearTimeout(sseTimeout);
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'system', content: parsed.message ?? 'The agent encountered an error.', _ts: Date.now() }
              ]);
              continue;
            }

            if (parsed.type !== 'stream') continue;

            const chunk = parsed.content ?? '';
            if (chunk) {
              gotAnyData = true;
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

      clearTimeout(sseTimeout);
    } catch {
      // SSE failed — try poll=true fallback
      try {
        const body: { message: string; conversationId?: string; poll?: boolean } = {
          message: userMsg,
          poll: true,
        };
        if (activeConversationId) body.conversationId = activeConversationId;

        const res2 = await apiFetch<{
          messageId?: string;
          conversationId?: string;
          content?: string;
          reply?: string;
        }>(`/api/selfclaw/v1/hosted-agents/${agent.id}/chat?poll=true`, {
          method: 'POST',
          body: JSON.stringify(body),
        });

        const reply = res2.content || res2.reply;

        if (reply) {
          setMessages(prev => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: reply, _ts: Date.now() };
            setCachedMessages(agent.id, msgs);
            return msgs;
          });
        } else if (res2.messageId) {
          await pollForResult(res2.messageId);
        }

        if (res2.conversationId && !activeConversationId) {
          setActiveConversationId(String(res2.conversationId));
          refetchConversations();
        }
      } catch {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'system', content: 'Something went wrong. Please try again.' }
        ]);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, activeConversationId, agent.id]);

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

      {/* Quick-reply chips */}
      {!isStreaming && (
        <div
          className="no-scrollbar"
          style={{
            flexShrink: 0,
            overflowX: 'auto',
            display: 'flex',
            gap: 8,
            padding: '8px 32px 4px',
            scrollbarWidth: 'none',
          }}
        >
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 400,
                color: t.label,
                background: 'none',
                border: `1px solid ${t.divider}`,
                borderRadius: 999,
                padding: '5px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

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
            onClick={() => handleSend()}
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
