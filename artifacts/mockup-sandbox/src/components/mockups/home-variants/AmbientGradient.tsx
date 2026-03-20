import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

const MOCK_WALLET = '0x71C7…3Fa9';

const MOCK_AGENTS = [
  {
    id: '1',
    name: 'Research Owl',
    status: 'active',
    lastRun: '2m ago',
    activity: 0.82,
    msgs: 148,
    uptime: '99%',
  },
  {
    id: '2',
    name: 'Draft Studio',
    status: 'active',
    lastRun: '14m ago',
    activity: 0.55,
    msgs: 73,
    uptime: '97%',
  },
  {
    id: '3',
    name: 'Fact Check',
    status: 'idle',
    lastRun: '3h ago',
    activity: 0.12,
    msgs: 9,
    uptime: '91%',
  },
];

type Tab = 'list' | 'dashboard' | 'settings';

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: active ? '#22c55e' : '#d4d4d4',
        flexShrink: 0,
      }}
    />
  );
}

function ActivityBar({ value, active }: { value: number; active: boolean }) {
  return (
    <div style={{ width: '100%', height: 1.5, background: '#f0f0f0', borderRadius: 1 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        style={{
          height: '100%',
          background: active ? '#1a1a1a' : '#d4d4d4',
          borderRadius: 1,
        }}
      />
    </div>
  );
}

function ListTab() {
  return (
    <div className="flex-1 px-8 pt-10">
      {/* Minimal wallet */}
      <p
        style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 9,
          color: '#bbb',
          letterSpacing: '0.05em',
          marginBottom: 48,
        }}
      >
        {MOCK_WALLET}
      </p>

      {/* Agent names — the entire design */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {MOCK_AGENTS.map((agent, i) => (
          <motion.button
            key={agent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="w-full text-left flex items-center gap-3"
            style={{ paddingTop: 22, paddingBottom: 22 }}
          >
            <StatusDot active={agent.status === 'active'} />
            <span
              style={{
                fontSize: 28,
                fontWeight: 300,
                color: agent.status === 'active' ? '#0a0a0a' : '#c4c4c4',
                letterSpacing: '-0.025em',
                lineHeight: 1,
              }}
            >
              {agent.name}
            </span>
          </motion.button>
        ))}

        {/* New — same weight, muted */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: MOCK_AGENTS.length * 0.08 + 0.04, duration: 0.4 }}
          className="w-full text-left flex items-center gap-3"
          style={{ paddingTop: 22, paddingBottom: 22 }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              flexShrink: 0,
              border: '1px solid #d4d4d4',
              borderRadius: '50%',
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 300,
              color: '#d4d4d4',
              letterSpacing: '-0.025em',
              lineHeight: 1,
            }}
          >
            New agent
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function DashboardTab() {
  const active = MOCK_AGENTS.filter(a => a.status === 'active').length;
  const total = MOCK_AGENTS.length;
  const totalMsgs = MOCK_AGENTS.reduce((s, a) => s + a.msgs, 0);

  return (
    <div className="flex-1 px-8 pt-10 overflow-y-auto no-scrollbar">
      {/* Summary numbers */}
      <div style={{ display: 'flex', gap: 40, marginBottom: 48 }}>
        <div>
          <p style={{ fontSize: 48, fontWeight: 200, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {active}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#bbb', letterSpacing: 0, marginLeft: 6 }}>
              / {total}
            </span>
          </p>
          <p style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
            Active
          </p>
        </div>
        <div>
          <p style={{ fontSize: 48, fontWeight: 200, color: '#0a0a0a', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {totalMsgs}
          </p>
          <p style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
            Messages
          </p>
        </div>
      </div>

      {/* Agent rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {MOCK_AGENTS.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            {/* Name + last run */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot active={agent.status === 'active'} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: agent.status === 'active' ? '#0a0a0a' : '#c4c4c4',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {agent.name}
                </span>
              </div>
              <span style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.02em' }}>
                {agent.lastRun}
              </span>
            </div>

            {/* Activity bar */}
            <ActivityBar value={agent.activity} active={agent.status === 'active'} />

            {/* Sub-stats */}
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.02em' }}>
                {agent.msgs} msgs
              </span>
              <span style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.02em' }}>
                {agent.uptime} uptime
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="flex-1 px-8 pt-10">
      <p
        style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 9,
          color: '#bbb',
          letterSpacing: '0.05em',
          marginBottom: 48,
        }}
      >
        {MOCK_WALLET}
      </p>
      {[
        { label: 'Wallet', value: MOCK_WALLET },
        { label: 'Platform', value: 'selfclaw.ai' },
        { label: 'Network', value: 'Celo Mainnet' },
        { label: 'Session', value: 'MiniPay' },
      ].map((row) => (
        <div
          key={row.label}
          style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 18 }}
        >
          <span style={{ fontSize: 13, fontWeight: 400, color: '#bbb', letterSpacing: '-0.01em' }}>
            {row.label}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: '#0a0a0a',
              letterSpacing: '-0.01em',
              fontFamily: row.label === 'Wallet' ? 'ui-monospace, Menlo, monospace' : undefined,
              fontSize: row.label === 'Wallet' ? 11 : 13,
            } as React.CSSProperties}
          >
            {row.value}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 40 }}>
        <button
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: '#bbb',
            letterSpacing: '-0.01em',
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

export function AmbientGradient() {
  const [activeTab, setActiveTab] = useState<Tab>('list');

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white select-none"
      style={{ width: 390 }}
    >
      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'list' && <ListTab />}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

      {/* Bottom navigation — minimal icon-only */}
      <div
        style={{
          display: 'flex',
          borderTop: '1px solid #f0f0f0',
          paddingBottom: 20,
          paddingTop: 12,
        }}
      >
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
