import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, SlidersHorizontal, Plus } from 'lucide-react';

const MOCK_WALLET = '0x71C7…3Fa9';

type AgentState = 'running' | 'thinking' | 'waiting' | 'pending' | 'idle';

interface Agent {
  id: string;
  name: string;
  state: AgentState;
  snippet: string;
  memory: { used: number; total: number };
  tokens: { ctx: number; cost: number };
  skills: string[];
  holdings: { amount: number; symbol: string; usd: number };
  poc: number;
  progress: number;
  uptime: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Research Owl',
    state: 'thinking',
    snippet: 'Analyzing Celo DeFi landscape…',
    memory: { used: 2.1, total: 8 },
    tokens: { ctx: 14832, cost: 0.04 },
    skills: ['web-search', 'summarize', 'compare'],
    holdings: { amount: 1.2, symbol: 'CELO', usd: 0.82 },
    poc: 73,
    progress: 38,
    uptime: '99.1%',
  },
  {
    id: '2',
    name: 'Draft Studio',
    state: 'running',
    snippet: 'Writing: "Top 5 MiniPay tips"',
    memory: { used: 1.4, total: 8 },
    tokens: { ctx: 8201, cost: 0.02 },
    skills: ['write', 'thread', 'edit'],
    holdings: { amount: 0.6, symbol: 'CELO', usd: 0.41 },
    poc: 58,
    progress: 71,
    uptime: '97.4%',
  },
  {
    id: '3',
    name: 'Fact Check',
    state: 'waiting',
    snippet: 'Awaiting 2 verification calls',
    memory: { used: 0.3, total: 8 },
    tokens: { ctx: 912, cost: 0.00 },
    skills: ['verify', 'cite'],
    holdings: { amount: 0.1, symbol: 'CELO', usd: 0.07 },
    poc: 29,
    progress: 12,
    uptime: '91.0%',
  },
];

/* ─── State indicators ─── */

const STATE_COLOR: Record<AgentState, string> = {
  running: '#22c55e',
  thinking: '#818cf8',
  waiting: '#f59e0b',
  pending: '#d4d4d4',
  idle: '#d4d4d4',
};

const STATE_LABEL: Record<AgentState, string> = {
  running: 'running',
  thinking: 'thinking',
  waiting: 'waiting',
  pending: 'pending',
  idle: 'idle',
};

function ThinkingDots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ display: 'block', width: 3.5, height: 3.5, borderRadius: '50%', background: color }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function RunningBars({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
      {[0.5, 1, 0.7].map((scale, i) => (
        <motion.span
          key={i}
          style={{ display: 'block', width: 3, borderRadius: 1, background: color }}
          animate={{ height: ['4px', `${10 * scale}px`, '4px'] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function WaitingDot({ color }: { color: string }) {
  return (
    <motion.span
      style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }}
      animate={{ opacity: [1, 0.15, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function PendingRing({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'block',
        width: 5,
        height: 5,
        borderRadius: '50%',
        border: `1.5px solid ${color}`,
        background: 'transparent',
      }}
    />
  );
}

function StateIndicator({ state }: { state: AgentState }) {
  const color = STATE_COLOR[state];
  if (state === 'thinking') return <ThinkingDots color={color} />;
  if (state === 'running') return <RunningBars color={color} />;
  if (state === 'waiting') return <WaitingDot color={color} />;
  if (state === 'pending') return <PendingRing color={color} />;
  return (
    <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }} />
  );
}

/* ─── Mini bar ─── */

function MiniBar({ value, color = '#1a1a1a' }: { value: number; color?: string }) {
  return (
    <div style={{ width: '100%', height: 1.5, background: '#f0f0f0', borderRadius: 1, marginTop: 4 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', background: color, borderRadius: 1 }}
      />
    </div>
  );
}

/* ─── List tab ─── */

function ListTab() {
  return (
    <div style={{ padding: '40px 32px 0' }}>
      <p
        style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 9,
          color: '#bbb',
          letterSpacing: '0.05em',
          marginBottom: 40,
        }}
      >
        {MOCK_WALLET}
      </p>

      <div>
        {MOCK_AGENTS.map((agent, i) => (
          <motion.button
            key={agent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className="w-full text-left"
            style={{ paddingTop: 20, paddingBottom: 20, display: 'block' }}
          >
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: 27,
                  fontWeight: 300,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  color: agent.state === 'idle' || agent.state === 'pending' ? '#c4c4c4' : '#0a0a0a',
                }}
              >
                {agent.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', height: 12 }}>
                <StateIndicator state={agent.state} />
              </span>
            </div>

            {/* Status line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: STATE_COLOR[agent.state],
                }}
              >
                {STATE_LABEL[agent.state]}
              </span>
              <span style={{ fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>
                {agent.snippet}
              </span>
            </div>

            {/* Tiny data row */}
            <div style={{ display: 'flex', gap: 16, marginTop: 5 }}>
              <span
                style={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 9,
                  color: '#ccc',
                  letterSpacing: '0.03em',
                }}
              >
                {agent.tokens.ctx.toLocaleString()} tok
              </span>
              <span
                style={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 9,
                  color: '#ccc',
                  letterSpacing: '0.03em',
                }}
              >
                {agent.memory.used} MB
              </span>
              <span
                style={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 9,
                  color: '#ccc',
                  letterSpacing: '0.03em',
                }}
              >
                PoC {agent.poc}
              </span>
              <span
                style={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: 9,
                  color: '#ccc',
                  letterSpacing: '0.03em',
                }}
              >
                {agent.holdings.amount} {agent.holdings.symbol}
              </span>
            </div>
          </motion.button>
        ))}

        {/* New agent */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: MOCK_AGENTS.length * 0.07 + 0.05, duration: 0.35 }}
          className="w-full text-left"
          style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              border: '1px solid #ddd',
              borderRadius: '50%',
            }}
          >
            <Plus size={9} color="#ccc" strokeWidth={2} />
          </span>
          <span style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: '#d4d4d4', lineHeight: 1 }}>
            New agent
          </span>
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Dashboard tab ─── */

function MetricRow({ label, value, sub, bar, barColor }: {
  label: string;
  value: string;
  sub?: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: '#0a0a0a', letterSpacing: '-0.01em' }}>
            {value}
          </span>
          {sub && (
            <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: '#bbb', marginLeft: 6 }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      {bar !== undefined && <MiniBar value={bar} color={barColor} />}
    </div>
  );
}

function AgentCard({ agent, i }: { agent: Agent; i: number }) {
  const color = STATE_COLOR[agent.state];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.4 }}
      style={{ marginBottom: 36 }}
    >
      {/* Agent header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a', letterSpacing: '-0.01em' }}>
              {agent.name}
            </span>
            <StateIndicator state={agent.state} />
          </div>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: color, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {STATE_LABEL[agent.state]}
          </span>
        </div>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: '#bbb' }}>
          {agent.uptime} up
        </span>
      </div>

      {/* Metrics */}
      <MetricRow
        label="Memory"
        value={`${agent.memory.used} MB`}
        sub={`/ ${agent.memory.total} MB`}
        bar={agent.memory.used / agent.memory.total}
        barColor={agent.memory.used / agent.memory.total > 0.7 ? '#f59e0b' : '#1a1a1a'}
      />
      <MetricRow
        label="Tokens"
        value={agent.tokens.ctx.toLocaleString()}
        sub={`$${agent.tokens.cost.toFixed(2)} today`}
        bar={Math.min(agent.tokens.ctx / 20000, 1)}
      />
      <MetricRow
        label="Economics"
        value={`$${(agent.poc * 0.002).toFixed(3)}`}
        sub="earned today"
      />
      <MetricRow
        label="PoC Score"
        value={`${agent.poc} pts`}
        bar={agent.poc / 100}
        barColor="#818cf8"
      />
      <MetricRow
        label="Skills"
        value={`${agent.skills.length} active`}
        sub={agent.skills.join(', ')}
      />
      <MetricRow
        label="Holdings"
        value={`${agent.holdings.amount} ${agent.holdings.symbol}`}
        sub={`$${agent.holdings.usd.toFixed(2)}`}
      />
      <MetricRow
        label="Progress"
        value={`${agent.progress}%`}
        bar={agent.progress / 100}
        barColor={color}
      />

      {/* Divider */}
      <div style={{ height: 1, background: '#f0f0f0', marginTop: 4 }} />
    </motion.div>
  );
}

function DashboardTab() {
  const active = MOCK_AGENTS.filter(a => a.state === 'running' || a.state === 'thinking').length;
  const totalTokens = MOCK_AGENTS.reduce((s, a) => s + a.tokens.ctx, 0);
  const totalCost = MOCK_AGENTS.reduce((s, a) => s + a.tokens.cost, 0);

  return (
    <div style={{ padding: '40px 32px 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 40, fontWeight: 200, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {active}
            <span style={{ fontSize: 13, fontWeight: 400, color: '#bbb', marginLeft: 5 }}>/ {MOCK_AGENTS.length}</span>
          </p>
          <p style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>
            Active
          </p>
        </div>
        <div>
          <p style={{ fontSize: 40, fontWeight: 200, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {(totalTokens / 1000).toFixed(1)}
            <span style={{ fontSize: 13, fontWeight: 400, color: '#bbb', marginLeft: 2 }}>k</span>
          </p>
          <p style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>
            Tokens
          </p>
        </div>
        <div>
          <p style={{ fontSize: 40, fontWeight: 200, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-0.04em' }}>
            ${totalCost.toFixed(2)}
          </p>
          <p style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>
            Cost
          </p>
        </div>
      </div>

      {/* Agent sub-dashboards */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {MOCK_AGENTS.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} i={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Settings tab ─── */

function SettingsTab() {
  return (
    <div style={{ padding: '40px 32px 0' }}>
      <p
        style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 9,
          color: '#bbb',
          letterSpacing: '0.05em',
          marginBottom: 40,
        }}
      >
        {MOCK_WALLET}
      </p>
      {[
        { label: 'Wallet', value: MOCK_WALLET, mono: true },
        { label: 'Platform', value: 'selfclaw.ai', mono: false },
        { label: 'Network', value: 'Celo Mainnet', mono: false },
        { label: 'Session', value: 'MiniPay', mono: false },
      ].map((row) => (
        <div
          key={row.label}
          style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 17, paddingBottom: 17 }}
        >
          <span style={{ fontSize: 13, fontWeight: 400, color: '#bbb', letterSpacing: '-0.01em' }}>
            {row.label}
          </span>
          <span
            style={{
              fontSize: row.mono ? 10 : 13,
              fontWeight: 400,
              color: '#0a0a0a',
              letterSpacing: row.mono ? '0.02em' : '-0.01em',
              fontFamily: row.mono ? 'ui-monospace, Menlo, monospace' : undefined,
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 36 }}>
        <button
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: '#bbb',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ─── Root ─── */

type Tab = 'list' | 'dashboard' | 'settings';

export function AmbientGradient() {
  const [activeTab, setActiveTab] = useState<Tab>('list');

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white select-none"
      style={{ width: 390 }}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <ListTab />
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <DashboardTab />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <SettingsTab />
          </div>
        )}
      </div>

      {/* Bottom nav — icons only */}
      <div style={{ borderTop: '1px solid #f0f0f0', display: 'flex', paddingBottom: 20, paddingTop: 12 }}>
        {([
          { id: 'list' as Tab, Icon: List },
          { id: 'dashboard' as Tab, Icon: LayoutGrid },
          { id: 'settings' as Tab, Icon: SlidersHorizontal },
        ] as { id: Tab; Icon: React.ElementType }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            <tab.Icon
              size={18}
              strokeWidth={activeTab === tab.id ? 2.25 : 1.5}
              color={activeTab === tab.id ? '#0a0a0a' : '#d4d4d4'}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
