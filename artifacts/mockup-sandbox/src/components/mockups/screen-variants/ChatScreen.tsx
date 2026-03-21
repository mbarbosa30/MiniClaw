import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Send } from 'lucide-react';

/* ─── Theme ─── */

const T = {
  bg: '#ffffff', text: '#0a0a0a', label: '#aaa', faint: '#bbb',
  divider: '#f5f5f5', surface: '#f0f0f0', navBorder: '#f0f0f0',
};

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

/* ─── Animated typing dots ─── */

function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: T.faint }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

/* ─── Mock data ─── */

const AGENT_NAME = 'Research Owl';
const AGENT_LABEL = 'RESEARCH OWL';

interface Msg {
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: string;
  isTyping?: boolean;
}

const INITIAL_MSGS: Msg[] = [
  {
    role: 'assistant',
    content: `Hi! I'm Research Owl. I track Celo DeFi, compare rates, and surface insights for you. What would you like to explore?`,
    ts: '9:14 AM',
  },
  {
    role: 'user',
    content: 'What are the best stablecoin yields on Celo right now?',
    ts: '9:15 AM',
  },
  {
    role: 'assistant',
    content: `Good question. Here's the current landscape:\n\n**Mento** — cUSD/USDC pools at ~4.2% APY\n**Ubeswap** — cUSD-USDT at ~6.8% APY with IL risk\n**Moola** — cUSD lending at ~3.1% APY, safer\n\nFor risk-adjusted yield, Moola is cleanest. Ubeswap is higher but impermanent loss can eat gains if cUSD de-pegs.`,
    ts: '9:15 AM',
  },
  {
    role: 'user',
    content: 'Tell me more about Ubeswap risks',
    ts: '9:17 AM',
  },
  {
    role: 'assistant',
    content: `Ubeswap LP risks to watch:\n\n1. **IL** — if cUSD/USDT ratio shifts beyond ±0.5%, your LP position loses value vs holding outright\n2. **Smart contract risk** — Ubeswap v2 is unaudited on the new pools\n3. **Liquidity depth** — thin pools amplify IL on rebalancing\n\nMy take: cap exposure to 20% of your stablecoin stack if you go in.`,
    ts: '9:17 AM',
  },
  {
    role: 'user',
    content: 'Can you keep watching this for me and alert me if yields change significantly?',
    ts: '9:19 AM',
  },
  {
    role: 'assistant',
    content: '',
    ts: '',
    isTyping: true,
  },
];

const CHIPS = ['What about CELO staking?', 'Compare to Ethereum yields', 'Set a 1% yield alert'];

/* ─── Awareness strip ─── */

function AwarenessStrip() {
  return (
    <div style={{
      flexShrink: 0,
      padding: '8px 20px 10px',
      borderBottom: `1px solid ${T.divider}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{
          ...MONO,
          fontSize: 8,
          color: '#22c55e',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          background: '#22c55e1a',
          border: '1px solid #22c55e40',
          borderRadius: 3,
          padding: '2px 5px',
        }}>
          confident
        </span>
        <span style={{ ...MONO, fontSize: 9, color: T.faint }}>71%</span>
      </div>
      <div style={{ height: 1.5, background: T.surface, borderRadius: 1, marginBottom: 7, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '71%' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', background: '#22c55e', borderRadius: 1 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {[
          { done: true, label: 'wallet' },
          { done: true, label: 'token' },
          { done: false, label: 'identity' },
        ].map(({ done, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {done ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="3.5" fill="#22c55e" />
                <path d="M2.2 4l1.2 1.2 2.4-2.4" stroke="#0f0f0f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div style={{ width: 6, height: 6, borderRadius: '50%', border: `1px solid ${T.faint}` }} />
            )}
            <span style={{ ...MONO, fontSize: 9, color: done ? T.label : T.faint, textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
        ))}
        <span style={{ ...MONO, fontSize: 9, color: T.faint, marginLeft: 'auto' }}>
          14.8k tok · 2.1 MB
        </span>
      </div>
    </div>
  );
}

/* ─── Quota bar ─── */

function QuotaBar() {
  const pct = 0.34;
  return (
    <div style={{ padding: '5px 20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ ...MONO, fontSize: 8, color: T.faint }}>
          14,832 / 43,000 tokens
        </span>
        <span style={{ ...MONO, fontSize: 8, color: T.faint }}>
          resets in 14h 22m
        </span>
      </div>
      <div style={{ height: 2, background: T.surface, borderRadius: 1, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: T.faint, borderRadius: 1 }}
        />
      </div>
    </div>
  );
}

/* ─── Header ─── */

function Header() {
  return (
    <div style={{
      flexShrink: 0,
      borderBottom: `1px solid ${T.divider}`,
      background: T.bg,
      paddingLeft: 8,
      paddingRight: 8,
    }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 68, flexShrink: 0 }}>
          <button style={{ width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', color: T.label, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 300, letterSpacing: '-0.015em', lineHeight: 1, color: T.text }}>
            {AGENT_NAME}
          </span>
        </div>
        <div style={{ width: 68, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', color: T.label, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MoreHorizontal size={17} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <QuotaBar />
    </div>
  );
}

/* ─── Message bubble ─── */

function MessageItem({ msg, index }: { msg: Msg; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          ...MONO,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: T.faint,
        }}>
          {msg.role === 'user' ? 'YOU' : AGENT_LABEL}
        </span>
        {msg.ts && (
          <span style={{ ...MONO, fontSize: 9, color: T.faint, opacity: 0.6 }}>
            {msg.ts}
          </span>
        )}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 300,
        lineHeight: 1.6,
        color: T.text,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.isTyping ? <ThinkingDots /> : msg.content}
      </div>
    </motion.div>
  );
}

/* ─── Root ─── */

export function ChatScreen() {
  const [inputVal, setInputVal] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  return (
    <div style={{
      width: 390,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: T.bg,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Header />
      <AwarenessStrip />

      {/* Messages */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '22px 32px 8px', display: 'flex', flexDirection: 'column', gap: 26 }}
      >
        {INITIAL_MSGS.map((msg, i) => (
          <MessageItem key={i} msg={msg} index={i} />
        ))}
        <div ref={endRef} />
      </div>

      {/* Chips row */}
      <div
        className="no-scrollbar"
        style={{
          flexShrink: 0,
          overflowX: 'auto',
          display: 'flex',
          gap: 8,
          padding: '6px 32px 2px',
        }}
      >
        {CHIPS.map((chip) => (
          <button
            key={chip}
            style={{
              flexShrink: 0,
              fontSize: 11,
              color: T.label,
              background: 'none',
              border: `1px solid ${T.divider}`,
              borderRadius: 999,
              padding: '5px 12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Compact history button */}
      <div style={{ padding: '4px 32px 0', display: 'flex' }}>
        <button style={{
          ...MONO,
          fontSize: 8,
          color: T.faint,
          background: 'none',
          border: `1px solid ${T.divider}`,
          borderRadius: 3,
          padding: '3px 7px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          compact history
        </button>
      </div>

      {/* Input bar */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.divider}`, padding: '12px 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={`Message ${AGENT_NAME}…`}
              style={{
                width: '100%',
                background: 'transparent',
                outline: 'none',
                border: 'none',
                padding: '6px 0',
                fontSize: 14,
                fontWeight: 300,
                color: T.text,
                letterSpacing: '-0.01em',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <AnimatePresence>
            {inputVal.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: T.text,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 0,
                }}
              >
                <Send size={14} color={T.bg} strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>
          {inputVal.length === 0 && (
            <button
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: T.surface,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={14} color={T.faint} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
