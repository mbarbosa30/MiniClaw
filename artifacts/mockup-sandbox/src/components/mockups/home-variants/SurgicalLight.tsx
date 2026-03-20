import { useState } from 'react';
import { BookOpen, PenLine, ShieldCheck, Plus, Bot, Settings, LogOut, ArrowRight } from 'lucide-react';

const MOCK_WALLET = '0x71C7…976F';

const AgentIcon = ({ icon: Icon, active }: { icon: React.ElementType; active: boolean }) => (
  <div
    className="flex items-center justify-center shrink-0"
    style={{
      width: 44,
      height: 44,
      background: active ? '#000' : '#fff',
      border: '2px solid #000',
      boxShadow: active ? 'none' : '2px 2px 0 #000',
      flexShrink: 0,
    }}
  >
    <Icon size={20} strokeWidth={2} color={active ? '#fff' : '#000'} />
  </div>
);

const MOCK_AGENTS = [
  { id: '1', Icon: BookOpen, name: 'Research Owl', status: 'active', description: 'Deep-dives topics on demand' },
  { id: '2', Icon: PenLine, name: 'Draft Studio', status: 'active', description: 'Writes copy, posts, threads' },
  { id: '3', Icon: ShieldCheck, name: 'Fact Check', status: 'idle', description: 'Verifies claims and sources' },
];

type Tab = 'agents' | 'create' | 'settings';

export function SurgicalLight() {
  const [activeTab, setActiveTab] = useState<Tab>('agents');

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white select-none"
      style={{ width: 390, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-10 pb-4"
        style={{ borderBottom: '2px solid #000' }}
      >
        <div>
          <h1
            className="text-[26px] font-black text-black leading-none uppercase"
            style={{ letterSpacing: '-0.01em' }}
          >
            MiniClaw
          </h1>
          <p
            className="mt-1 text-[10px] text-black/40"
            style={{ fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.04em' }}
          >
            {MOCK_WALLET}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase"
          style={{
            border: '2px solid #000',
            boxShadow: '2px 2px 0 #000',
            letterSpacing: '0.06em',
          }}
        >
          <LogOut size={13} strokeWidth={2.5} />
          Out
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'agents' && (
          <div>
            {/* Section label */}
            <div
              className="px-5 py-2.5 flex items-center justify-between"
              style={{ borderBottom: '2px solid #000', background: '#f5f5f5' }}
            >
              <span
                className="text-[10px] font-black uppercase"
                style={{ letterSpacing: '0.12em' }}
              >
                Your Agents — {MOCK_AGENTS.length}
              </span>
              <span className="text-[10px] font-bold uppercase" style={{ letterSpacing: '0.08em', color: '#888' }}>
                2 active
              </span>
            </div>

            {/* Agent rows */}
            {MOCK_AGENTS.map((agent, i) => (
              <button
                key={agent.id}
                className="w-full text-left flex items-center gap-4 px-5 py-4 bg-white active:bg-yellow-50 transition-colors"
                style={{ borderBottom: '2px solid #000' }}
              >
                <AgentIcon icon={agent.Icon} active={agent.status === 'active'} />

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[16px] font-black text-black leading-tight truncate uppercase"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {agent.name}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 truncate font-medium"
                    style={{ color: '#888' }}
                  >
                    {agent.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className="text-[9px] font-black uppercase px-1.5 py-0.5"
                    style={{
                      letterSpacing: '0.10em',
                      border: '1.5px solid',
                      borderColor: agent.status === 'active' ? '#000' : '#ccc',
                      color: agent.status === 'active' ? '#000' : '#bbb',
                      background: agent.status === 'active' ? '#ffe600' : 'transparent',
                    }}
                  >
                    {agent.status}
                  </span>
                  <ArrowRight size={14} strokeWidth={2.5} color="#000" />
                </div>
              </button>
            ))}

            {/* New agent row */}
            <button
              className="w-full text-left flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: '2px solid #000' }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 44,
                  height: 44,
                  border: '2px dashed #000',
                }}
              >
                <Plus size={20} strokeWidth={2.5} color="#000" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[16px] font-black text-black uppercase"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  New Agent
                </p>
                <p className="text-[11px] font-medium" style={{ color: '#888' }}>
                  Provision a new AI agent
                </p>
              </div>
            </button>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <div
              style={{
                width: 64,
                height: 64,
                border: '2px solid #000',
                boxShadow: '4px 4px 0 #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={32} strokeWidth={1.5} />
            </div>
            <p className="text-[22px] font-black uppercase" style={{ letterSpacing: '-0.01em' }}>
              New Agent
            </p>
            <p className="text-[13px] font-medium" style={{ color: '#888' }}>
              Configure a new AI agent powered by selfclaw.ai
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <div
              style={{
                width: 64,
                height: 64,
                border: '2px solid #000',
                boxShadow: '4px 4px 0 #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <p className="text-[22px] font-black uppercase" style={{ letterSpacing: '-0.01em' }}>
              Settings
            </p>
            <p className="text-[13px] font-medium" style={{ color: '#888' }}>
              Wallet, preferences, and account options
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className="flex items-stretch"
        style={{ borderTop: '2px solid #000' }}
      >
        {([
          { id: 'agents' as Tab, label: 'Agents', Icon: Bot },
          { id: 'create' as Tab, label: 'Create', Icon: Plus },
          { id: 'settings' as Tab, label: 'Settings', Icon: Settings },
        ] as { id: Tab; label: string; Icon: React.ElementType }[]).map((tab, i, arr) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors"
            style={{
              background: activeTab === tab.id ? '#000' : '#fff',
              borderRight: i < arr.length - 1 ? '2px solid #000' : 'none',
              paddingBottom: 20,
            }}
          >
            <tab.Icon
              size={20}
              strokeWidth={2}
              color={activeTab === tab.id ? '#ffe600' : '#000'}
            />
            <span
              className="text-[9px] font-black uppercase"
              style={{
                letterSpacing: '0.10em',
                color: activeTab === tab.id ? '#ffe600' : '#000',
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
