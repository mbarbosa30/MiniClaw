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

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 10,
  letterSpacing: '0.03em',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 9,
      fontWeight: 600,
      color: '#bbb',
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      paddingTop: 28,
      paddingBottom: 10,
    }}>
      {children}
    </p>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 13,
      paddingBottom: 13,
      borderBottom: '1px solid #f5f5f5',
    }}>
      <span style={{ fontSize: 12, color: '#aaa', letterSpacing: '-0.01em' }}>{label}</span>
      {children}
    </div>
  );
}

function Val({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span style={{ fontSize: mono ? 10 : 12, color: '#0a0a0a', letterSpacing: mono ? '0.02em' : '-0.01em', ...(mono ? MONO : {}) }}>
      {children}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 10,
        letterSpacing: '0.06em',
        color: on ? '#0a0a0a' : '#ccc',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontWeight: on ? 600 : 400,
      }}
    >
      {on ? 'on' : 'off'}
    </button>
  );
}

function Picker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const i = options.indexOf(value);
  return (
    <button
      onClick={() => onChange(options[(i + 1) % options.length])}
      style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 10,
        color: '#0a0a0a',
        letterSpacing: '0.02em',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {value}
      <span style={{ color: '#ccc', fontSize: 8 }}>▼</span>
    </button>
  );
}

function ActionRow({ label, color = '#bbb' }: { label: string; color?: string }) {
  return (
    <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: '1px solid #f5f5f5' }}>
      <button style={{
        fontSize: 12,
        color,
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        letterSpacing: '-0.01em',
      }}>
        {label}
      </button>
    </div>
  );
}

function SettingsTab() {
  const [streaming, setStreaming] = useState(true);
  const [pocTracking, setPocTracking] = useState(true);
  const [autoMemory, setAutoMemory] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [format, setFormat] = useState('text');
  const [network, setNetwork] = useState('Celo Mainnet');

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '36px 32px 32px' }} className="no-scrollbar">

      {/* — Account — */}
      <SectionLabel>Account</SectionLabel>
      <Row label="Wallet">
        <Val mono>0x71C7…976F</Val>
      </Row>
      <Row label="Network">
        <Picker options={['Celo Mainnet', 'Celo Alfajores']} value={network} onChange={setNetwork} />
      </Row>
      <Row label="Session">
        <Val>MiniPay</Val>
      </Row>

      {/* — selfclaw API — */}
      <SectionLabel>selfclaw API</SectionLabel>
      <Row label="Platform">
        <Val mono>selfclaw.ai</Val>
      </Row>
      <Row label="Key status">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <Val>Active</Val>
        </span>
      </Row>
      <Row label="Rate limit">
        <Val mono>100 req / min</Val>
      </Row>
      <Row label="Streaming">
        <Toggle on={streaming} onToggle={() => setStreaming(v => !v)} />
      </Row>
      <Row label="Response format">
        <Picker options={['text', 'json', 'markdown']} value={format} onChange={setFormat} />
      </Row>

      {/* — Agent defaults — */}
      <SectionLabel>Agent defaults</SectionLabel>
      <Row label="Default model">
        <Picker options={['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-1.5-pro']} value={model} onChange={setModel} />
      </Row>
      <Row label="Temperature">
        <Val mono>0.7</Val>
      </Row>
      <Row label="Max tokens">
        <Val mono>4,096</Val>
      </Row>
      <Row label="Context window">
        <Val mono>16k</Val>
      </Row>
      <Row label="Memory per agent">
        <Val mono>8 MB</Val>
      </Row>
      <Row label="Auto-compress memory">
        <Toggle on={autoMemory} onToggle={() => setAutoMemory(v => !v)} />
      </Row>

      {/* — PoC & Economics — */}
      <SectionLabel>PoC & Economics</SectionLabel>
      <Row label="Contribution tracking">
        <Toggle on={pocTracking} onToggle={() => setPocTracking(v => !v)} />
      </Row>
      <Row label="PoC threshold">
        <Val mono>50 pts</Val>
      </Row>
      <Row label="Earnings wallet">
        <Val mono>0x71C7…976F</Val>
      </Row>
      <Row label="Holdings currency">
        <Val>CELO</Val>
      </Row>

      {/* — Notifications — */}
      <SectionLabel>Notifications</SectionLabel>
      <Row label="Agent alerts">
        <Toggle on={notifications} onToggle={() => setNotifications(v => !v)} />
      </Row>
      <Row label="Webhook URL">
        <Val mono>—</Val>
      </Row>

      {/* — Data — */}
      <SectionLabel>Data</SectionLabel>
      <ActionRow label="Export conversation history" />
      <ActionRow label="Export agent configs" />
      <ActionRow label="Clear all agent memory" color="#f87171" />

      {/* — Session — */}
      <SectionLabel>Session</SectionLabel>
      <ActionRow label="Sign out" />

      <div style={{ height: 32 }} />
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
