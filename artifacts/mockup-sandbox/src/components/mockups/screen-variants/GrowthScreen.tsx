import { useState } from 'react';
import { motion } from 'framer-motion';

/* ─── Theme ─── */

const T = {
  bg: '#ffffff', text: '#0a0a0a', label: '#aaa', faint: '#bbb',
  divider: '#f5f5f5', surface: '#f0f0f0',
};

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  letterSpacing: '0.04em',
};

/* ─── Helpers ─── */

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* ─── Mock data ─── */

const CATEGORIES = [
  { label: 'Research', count: 19 },
  { label: 'Alerts', count: 14 },
  { label: 'Digests', count: 9 },
  { label: 'Wallet Actions', count: 5 },
];
const MAX_CAT = 19;

const TOKEN_CARDS = [
  { label: '24h', value: 14832 },
  { label: '7d', value: 98_140 },
  { label: '30d', value: 381_000 },
];

const CALL_TYPES = [
  { type: 'Chat', calls: 47, tokens: 14832 },
  { type: 'Skills', calls: 28, tokens: 62_400 },
  { type: 'Memory', calls: 113, tokens: 22_100 },
  { type: 'Guard', calls: 12, tokens: 4_280 },
];
const MAX_CALLS = 113;

/* ─── Animated bar ─── */

function AnimBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div style={{ height: 2, background: T.surface, borderRadius: 1 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', background: color, borderRadius: 1 }}
      />
    </div>
  );
}

/* ─── Growth tab ─── */

function GrowthTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Hero number */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <p style={{
          fontSize: 56,
          fontWeight: 200,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: T.text,
          marginBottom: 8,
        }}>
          47
        </p>
        <p style={{ ...MONO, fontSize: 9, color: T.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Actions approved this month
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          <p style={{ ...MONO, fontSize: 9, color: '#22c55e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            12-day streak
          </p>
          <p style={{ ...MONO, fontSize: 9, color: T.faint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            18 active days
          </p>
        </div>
        <p style={{ fontSize: 13, fontWeight: 300, color: T.label, lineHeight: 1.55 }}>
          Your Claw helped you act on 47 things this month.
        </p>
      </motion.div>

      <div style={{ height: 1, background: T.divider, marginBottom: 24 }} />

      {/* Category bars */}
      {CATEGORIES.map(({ label, count }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 400, color: T.text, letterSpacing: '-0.01em' }}>{label}</span>
            <span style={{ ...MONO, fontSize: 10, color: T.faint }}>{count}</span>
          </div>
          <AnimBar pct={count / MAX_CAT} color={T.text} delay={i * 0.06 + 0.1} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Analytics tab ─── */

function AnalyticsTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Token cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {TOKEN_CARDS.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            style={{ background: T.surface, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <span style={{ fontSize: 18, fontWeight: 200, letterSpacing: '-0.03em', lineHeight: 1, color: T.text }}>
              {fmtNum(value)}
            </span>
            <span style={{ ...MONO, fontSize: 8, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 300, color: T.text }}>200</span>
          <span style={{ ...MONO, fontSize: 9, color: T.faint, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            calls (30d)
          </span>
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 300, color: T.text }}>1.4s</span>
          <span style={{ ...MONO, fontSize: 9, color: T.faint, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            avg latency
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: T.divider, marginBottom: 20 }} />

      {/* Call-type breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {CALL_TYPES.map(({ type, calls, tokens }, idx) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 + 0.15, duration: 0.28 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 300, color: T.text, letterSpacing: '-0.01em' }}>{type}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ ...MONO, fontSize: 9, color: T.faint }}>{calls} calls</span>
                <span style={{ ...MONO, fontSize: 9, color: T.faint }}>{fmtNum(tokens)} tok</span>
              </div>
            </div>
            <AnimBar pct={calls / MAX_CALLS} color={T.label} delay={idx * 0.06 + 0.2} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Root ─── */

type Tab = 'growth' | 'usage';

export function GrowthScreen() {
  const [tab, setTab] = useState<Tab>('growth');

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

      {/* Header */}
      <div style={{ padding: '28px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 22, fontWeight: 200, letterSpacing: '-0.03em', color: T.text, lineHeight: 1 }}>
            Growth
          </p>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
            {(['growth', 'usage'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  ...MONO,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: tab === t ? T.text : T.faint,
                  fontWeight: tab === t ? 600 : 400,
                  transition: 'color 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 1, background: T.divider, marginTop: 20 }} />
      </div>

      {/* Content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        {tab === 'growth' ? <GrowthTab /> : <AnalyticsTab />}
      </div>
    </div>
  );
}
