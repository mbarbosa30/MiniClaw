import { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, SlidersHorizontal, Plus } from 'lucide-react';

/* ─── Theme ─── */

interface Theme {
  bg: string;
  text: string;
  textDim: string;     // idle agent names, section sub-info
  label: string;       // row labels, muted descriptors
  faint: string;       // very muted — timestamps, monospace meta
  divider: string;
  surface: string;     // picker/toggle hover bg, activity bar track
  navBorder: string;
  dark: boolean;
}

const LIGHT: Theme = {
  bg: '#ffffff', text: '#0a0a0a', textDim: '#c4c4c4',
  label: '#aaa', faint: '#bbb', divider: '#f5f5f5',
  surface: '#f0f0f0', navBorder: '#f0f0f0', dark: false,
};

const DARK: Theme = {
  bg: '#0f0f0f', text: '#e2e2e2', textDim: '#2e2e2e',
  label: '#4a4a4a', faint: '#383838', divider: '#1c1c1c',
  surface: '#1c1c1c', navBorder: '#1a1a1a', dark: true,
};

const ThemeCtx = createContext<Theme>(LIGHT);
const useTheme = () => useContext(ThemeCtx);

/* ─── Data ─── */

const MOCK_WALLET = '0x71C7…3Fa9';
type AgentState = 'running' | 'thinking' | 'waiting' | 'pending' | 'idle';

interface Agent {
  id: string; name: string; state: AgentState; snippet: string;
  memory: { used: number; total: number };
  tokens: { ctx: number; cost: number };
  skills: string[];
  holdings: { amount: number; symbol: string; usd: number };
  poc: number; progress: number; uptime: string;
}

const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Research Owl', state: 'thinking', snippet: 'Analyzing Celo DeFi landscape…',
    memory: { used: 2.1, total: 8 }, tokens: { ctx: 14832, cost: 0.04 },
    skills: ['web-search', 'summarize', 'compare'],
    holdings: { amount: 1.2, symbol: 'CELO', usd: 0.82 }, poc: 73, progress: 38, uptime: '99.1%' },
  { id: '2', name: 'Draft Studio', state: 'running', snippet: 'Writing: "Top 5 MiniPay tips"',
    memory: { used: 1.4, total: 8 }, tokens: { ctx: 8201, cost: 0.02 },
    skills: ['write', 'thread', 'edit'],
    holdings: { amount: 0.6, symbol: 'CELO', usd: 0.41 }, poc: 58, progress: 71, uptime: '97.4%' },
  { id: '3', name: 'Fact Check', state: 'waiting', snippet: 'Awaiting 2 verification calls',
    memory: { used: 0.3, total: 8 }, tokens: { ctx: 912, cost: 0.00 },
    skills: ['verify', 'cite'],
    holdings: { amount: 0.1, symbol: 'CELO', usd: 0.07 }, poc: 29, progress: 12, uptime: '91.0%' },
];

const STATE_COLOR: Record<AgentState, string> = {
  running: '#22c55e', thinking: '#818cf8', waiting: '#f59e0b', pending: '#555', idle: '#333',
};
const STATE_LABEL: Record<AgentState, string> = {
  running: 'running', thinking: 'thinking', waiting: 'waiting', pending: 'pending', idle: 'idle',
};

/* ─── State indicators ─── */

function ThinkingDots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i}
          style={{ display: 'block', width: 3.5, height: 3.5, borderRadius: '50%', background: color }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }} />
      ))}
    </span>
  );
}

function RunningBars({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
      {[0.5, 1, 0.7].map((scale, i) => (
        <motion.span key={i}
          style={{ display: 'block', width: 3, borderRadius: 1, background: color }}
          animate={{ height: ['4px', `${10 * scale}px`, '4px'] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
      ))}
    </span>
  );
}

function WaitingDot({ color }: { color: string }) {
  return (
    <motion.span
      style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }}
      animate={{ opacity: [1, 0.15, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
  );
}

function StateIndicator({ state }: { state: AgentState }) {
  const color = STATE_COLOR[state];
  if (state === 'thinking') return <ThinkingDots color={color} />;
  if (state === 'running') return <RunningBars color={color} />;
  if (state === 'waiting') return <WaitingDot color={color} />;
  return <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }} />;
}

/* ─── Mini bar ─── */

function MiniBar({ value, color, track }: { value: number; color: string; track: string }) {
  return (
    <div style={{ width: '100%', height: 1.5, background: track, borderRadius: 1, marginTop: 4 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', background: color, borderRadius: 1 }} />
    </div>
  );
}

/* ─── List tab ─── */

function ListTab() {
  const t = useTheme();
  return (
    <div style={{ padding: '40px 32px 0' }}>
      <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.05em', marginBottom: 40 }}>
        {MOCK_WALLET}
      </p>
      <div>
        {MOCK_AGENTS.map((agent, i) => (
          <motion.button key={agent.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className="w-full text-left" style={{ paddingTop: 20, paddingBottom: 20, display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', lineHeight: 1,
                color: (agent.state === 'idle' || agent.state === 'pending') ? t.textDim : t.text,
              }}>
                {agent.name}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', height: 12 }}>
                <StateIndicator state={agent.state} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: STATE_COLOR[agent.state] }}>
                {STATE_LABEL[agent.state]}
              </span>
              <span style={{ fontSize: 10, color: t.label, fontStyle: 'italic' }}>{agent.snippet}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 5 }}>
              {[`${agent.tokens.ctx.toLocaleString()} tok`, `${agent.memory.used} MB`, `PoC ${agent.poc}`, `${agent.holdings.amount} ${agent.holdings.symbol}`].map(v => (
                <span key={v} style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.03em' }}>{v}</span>
              ))}
            </div>
          </motion.button>
        ))}
        {/* New agent */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: MOCK_AGENTS.length * 0.07 + 0.05, duration: 0.35 }}
          className="w-full text-left"
          style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, border: `1px solid ${t.divider}`, borderRadius: '50%' }}>
            <Plus size={9} color={t.faint} strokeWidth={2} />
          </span>
          <span style={{ fontSize: 27, fontWeight: 300, letterSpacing: '-0.025em', color: t.textDim, lineHeight: 1 }}>New agent</span>
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Dashboard tab ─── */

function MetricRow({ label, value, sub, bar, barColor }: { label: string; value: string; sub?: string; bar?: number; barColor?: string }) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, color: t.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: t.text, letterSpacing: '-0.01em' }}>{value}</span>
          {sub && <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, marginLeft: 6 }}>{sub}</span>}
        </div>
      </div>
      {bar !== undefined && <MiniBar value={bar} color={barColor ?? t.text} track={t.surface} />}
    </div>
  );
}

function AgentCard({ agent, i }: { agent: Agent; i: number }) {
  const t = useTheme();
  const color = STATE_COLOR[agent.state];
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.4 }} style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: t.text, letterSpacing: '-0.01em' }}>{agent.name}</span>
            <StateIndicator state={agent.state} />
          </div>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {STATE_LABEL[agent.state]}
          </span>
        </div>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint }}>{agent.uptime} up</span>
      </div>
      <MetricRow label="Memory" value={`${agent.memory.used} MB`} sub={`/ ${agent.memory.total} MB`} bar={agent.memory.used / agent.memory.total} barColor={agent.memory.used / agent.memory.total > 0.7 ? '#f59e0b' : t.text} />
      <MetricRow label="Tokens" value={agent.tokens.ctx.toLocaleString()} sub={`$${agent.tokens.cost.toFixed(2)} today`} bar={Math.min(agent.tokens.ctx / 20000, 1)} />
      <MetricRow label="Economics" value={`$${(agent.poc * 0.002).toFixed(3)}`} sub="earned today" />
      <MetricRow label="PoC Score" value={`${agent.poc} pts`} bar={agent.poc / 100} barColor="#818cf8" />
      <MetricRow label="Skills" value={`${agent.skills.length} active`} sub={agent.skills.join(', ')} />
      <MetricRow label="Holdings" value={`${agent.holdings.amount} ${agent.holdings.symbol}`} sub={`$${agent.holdings.usd.toFixed(2)}`} />
      <MetricRow label="Progress" value={`${agent.progress}%`} bar={agent.progress / 100} barColor={color} />
      <div style={{ height: 1, background: t.divider, marginTop: 4 }} />
    </motion.div>
  );
}

function DashboardTab() {
  const t = useTheme();
  const active = MOCK_AGENTS.filter(a => a.state === 'running' || a.state === 'thinking').length;
  const totalTokens = MOCK_AGENTS.reduce((s, a) => s + a.tokens.ctx, 0);
  const totalCost = MOCK_AGENTS.reduce((s, a) => s + a.tokens.cost, 0);
  const bigNum = (n: string) => (
    <p style={{ fontSize: 40, fontWeight: 200, color: t.text, lineHeight: 1, letterSpacing: '-0.04em' }}>{n}</p>
  );
  return (
    <div style={{ padding: '40px 32px 0', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 32, marginBottom: 36 }}>
        <div>{bigNum(`${active}`)}<span style={{ fontSize: 13, color: t.faint }}> / {MOCK_AGENTS.length}</span>
          <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>Active</p>
        </div>
        <div>{bigNum(`${(totalTokens / 1000).toFixed(1)}`)}<span style={{ fontSize: 13, color: t.faint }}>k</span>
          <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>Tokens</p>
        </div>
        <div>{bigNum(`$${totalCost.toFixed(2)}`)}<p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>Cost</p>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
        {MOCK_AGENTS.map((agent, i) => <AgentCard key={agent.id} agent={agent} i={i} />)}
      </div>
    </div>
  );
}

/* ─── Settings tab ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <p style={{ fontSize: 9, fontWeight: 600, color: t.faint, letterSpacing: '0.10em', textTransform: 'uppercase', paddingTop: 28, paddingBottom: 10 }}>
      {children}
    </p>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <span style={{ fontSize: 12, color: t.label, letterSpacing: '-0.01em' }}>{label}</span>
      {children}
    </div>
  );
}

function Val({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  const t = useTheme();
  return (
    <span style={{ fontSize: mono ? 10 : 12, color: t.text, letterSpacing: mono ? '0.02em' : '-0.01em', ...(mono ? { fontFamily: 'ui-monospace, Menlo, monospace' } : {}) }}>
      {children}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useTheme();
  return (
    <button onClick={onToggle} style={{
      fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, letterSpacing: '0.06em',
      color: on ? t.text : t.faint, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: on ? 600 : 400,
    }}>
      {on ? 'on' : 'off'}
    </button>
  );
}

function Picker({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const i = options.indexOf(value);
  return (
    <button onClick={() => onChange(options[(i + 1) % options.length])} style={{
      fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: t.text, letterSpacing: '0.02em',
      background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {value}
      <span style={{ color: t.faint, fontSize: 8 }}>▼</span>
    </button>
  );
}

function ActionRow({ label, color }: { label: string; color?: string }) {
  const t = useTheme();
  return (
    <div style={{ paddingTop: 13, paddingBottom: 13, borderBottom: `1px solid ${t.divider}` }}>
      <button style={{ fontSize: 12, color: color ?? t.label, textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em' }}>
        {label}
      </button>
    </div>
  );
}

function SettingsTab({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  const t = useTheme();
  const [streaming, setStreaming] = useState(true);
  const [pocTracking, setPocTracking] = useState(true);
  const [autoMemory, setAutoMemory] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [model, setModel] = useState('gpt-4o');
  const [format, setFormat] = useState('text');
  const [network, setNetwork] = useState('Celo Mainnet');

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '36px 32px 32px', background: t.bg }} className="no-scrollbar">

      <SectionLabel>Appearance</SectionLabel>
      <Row label="Dark mode">
        <Toggle on={darkMode} onToggle={onToggleDark} />
      </Row>

      <SectionLabel>Account</SectionLabel>
      <Row label="Wallet"><Val mono>0x71C7…976F</Val></Row>
      <Row label="Network">
        <Picker options={['Celo Mainnet', 'Celo Alfajores']} value={network} onChange={setNetwork} />
      </Row>
      <Row label="Session"><Val>MiniPay</Val></Row>

      <SectionLabel>selfclaw API</SectionLabel>
      <Row label="Platform"><Val mono>selfclaw.ai</Val></Row>
      <Row label="Key status">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <Val>Active</Val>
        </span>
      </Row>
      <Row label="Rate limit"><Val mono>100 req / min</Val></Row>
      <Row label="Streaming"><Toggle on={streaming} onToggle={() => setStreaming(v => !v)} /></Row>
      <Row label="Response format">
        <Picker options={['text', 'json', 'markdown']} value={format} onChange={setFormat} />
      </Row>

      <SectionLabel>Agent defaults</SectionLabel>
      <Row label="Default model">
        <Picker options={['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-1.5-pro']} value={model} onChange={setModel} />
      </Row>
      <Row label="Temperature"><Val mono>0.7</Val></Row>
      <Row label="Max tokens"><Val mono>4,096</Val></Row>
      <Row label="Context window"><Val mono>16k</Val></Row>
      <Row label="Memory per agent"><Val mono>8 MB</Val></Row>
      <Row label="Auto-compress memory"><Toggle on={autoMemory} onToggle={() => setAutoMemory(v => !v)} /></Row>

      <SectionLabel>PoC & Economics</SectionLabel>
      <Row label="Contribution tracking"><Toggle on={pocTracking} onToggle={() => setPocTracking(v => !v)} /></Row>
      <Row label="PoC threshold"><Val mono>50 pts</Val></Row>
      <Row label="Earnings wallet"><Val mono>0x71C7…976F</Val></Row>
      <Row label="Holdings currency"><Val>CELO</Val></Row>

      <SectionLabel>Notifications</SectionLabel>
      <Row label="Agent alerts"><Toggle on={notifications} onToggle={() => setNotifications(v => !v)} /></Row>
      <Row label="Webhook URL"><Val mono>—</Val></Row>

      <SectionLabel>Data</SectionLabel>
      <ActionRow label="Export conversation history" />
      <ActionRow label="Export agent configs" />
      <ActionRow label="Clear all agent memory" color="#f87171" />

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
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={theme}>
      <div className="flex flex-col h-screen overflow-hidden select-none"
        style={{ width: 390, background: theme.bg, transition: 'background 0.3s ease' }}>

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
            <div className="flex-1 overflow-hidden flex flex-col">
              <SettingsTab darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)} />
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ borderTop: `1px solid ${theme.navBorder}`, display: 'flex', paddingBottom: 20, paddingTop: 12, background: theme.bg, transition: 'background 0.3s ease' }}>
          {([
            { id: 'list' as Tab, Icon: List },
            { id: 'dashboard' as Tab, Icon: LayoutGrid },
            { id: 'settings' as Tab, Icon: SlidersHorizontal },
          ] as { id: Tab; Icon: React.ElementType }[]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
              <tab.Icon
                size={18}
                strokeWidth={activeTab === tab.id ? 2.25 : 1.5}
                color={activeTab === tab.id ? theme.text : theme.faint}
              />
            </button>
          ))}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
