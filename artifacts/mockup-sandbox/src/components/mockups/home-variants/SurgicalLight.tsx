import { useState } from 'react';
import { BookOpen, PenLine, ShieldCheck, Plus, Bot, Settings, LogOut, ChevronRight } from 'lucide-react';

const MOCK_WALLET = '0x71C7…976F';

const MOCK_AGENTS = [
  { id: '1', Icon: BookOpen, name: 'Research Owl', status: 'active', description: 'Deep-dives topics on demand' },
  { id: '2', Icon: PenLine, name: 'Draft Studio', status: 'active', description: 'Writes copy, posts, threads' },
  { id: '3', Icon: ShieldCheck, name: 'Fact Check', status: 'idle', description: 'Verifies claims and sources' },
];

type Tab = 'agents' | 'create' | 'settings';

function AgentIcon({ Icon, active }: { Icon: React.ElementType; active: boolean }) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: 42,
        height: 42,
        background: active ? '#1a1a1a' : '#f7f7f7',
        border: '1px solid',
        borderColor: active ? '#1a1a1a' : '#e4e4e4',
        borderRadius: 4,
      }}
    >
      <Icon size={18} strokeWidth={1.75} color={active ? '#fff' : '#555'} />
    </div>
  );
}

export function SurgicalLight() {
  const [activeTab, setActiveTab] = useState<Tab>('agents');

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white select-none"
      style={{ width: 390 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-10 pb-4"
        style={{ borderBottom: '1px solid #e8e8e8' }}
      >
        <div>
          <h1
            className="text-[22px] font-bold text-black leading-none"
            style={{ letterSpacing: '-0.02em' }}
          >
            MiniClaw
          </h1>
          <p
            className="mt-1.5 text-[10px]"
            style={{
              fontFamily: 'ui-monospace, Menlo, monospace',
              color: '#aaa',
              letterSpacing: '0.03em',
            }}
          >
            {MOCK_WALLET}
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-black"
          style={{
            border: '1px solid #d4d4d4',
            borderRadius: 4,
            letterSpacing: '0.03em',
          }}
        >
          <LogOut size={13} strokeWidth={2} />
          Sign out
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'agents' && (
          <div>
            {/* Count bar */}
            <div
              className="px-5 py-2.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid #efefef', background: '#fafafa' }}
            >
              <span
                className="text-[10px] font-semibold text-black"
                style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Agents
              </span>
              <span className="text-[10px] font-medium" style={{ color: '#aaa', letterSpacing: '0.04em' }}>
                2 of 3 active
              </span>
            </div>

            {/* Agent rows */}
            {MOCK_AGENTS.map((agent) => (
              <button
                key={agent.id}
                className="w-full text-left flex items-center gap-3.5 px-5 py-3.5 bg-white active:bg-neutral-50 transition-colors"
                style={{ borderBottom: '1px solid #efefef' }}
              >
                <AgentIcon Icon={agent.Icon} active={agent.status === 'active'} />

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[15px] font-semibold text-black leading-tight truncate"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {agent.name}
                  </p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: '#aaa' }}>
                    {agent.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5"
                    style={{
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      border: '1px solid',
                      borderRadius: 2,
                      borderColor: agent.status === 'active' ? '#1a1a1a' : '#ddd',
                      color: agent.status === 'active' ? '#1a1a1a' : '#bbb',
                    }}
                  >
                    {agent.status}
                  </span>
                  <ChevronRight size={13} strokeWidth={2} color="#ccc" />
                </div>
              </button>
            ))}

            {/* New agent row */}
            <button
              className="w-full text-left flex items-center gap-3.5 px-5 py-3.5"
              style={{ borderBottom: '1px solid #efefef' }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  border: '1px dashed #ccc',
                  borderRadius: 4,
                }}
              >
                <Plus size={18} strokeWidth={1.75} color="#aaa" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-black" style={{ letterSpacing: '-0.01em' }}>
                  New agent
                </p>
                <p className="text-[11px]" style={{ color: '#aaa' }}>
                  Provision a new AI agent
                </p>
              </div>
            </button>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
            <div
              style={{
                width: 56,
                height: 56,
                border: '1px solid #e4e4e4',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={26} strokeWidth={1.5} color="#555" />
            </div>
            <p className="text-[20px] font-bold text-black" style={{ letterSpacing: '-0.02em' }}>
              New Agent
            </p>
            <p className="text-[13px]" style={{ color: '#aaa' }}>
              Configure a new AI agent powered by selfclaw.ai
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
            <div
              style={{
                width: 56,
                height: 56,
                border: '1px solid #e4e4e4',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={26} strokeWidth={1.5} color="#555" />
            </div>
            <p className="text-[20px] font-bold text-black" style={{ letterSpacing: '-0.02em' }}>
              Settings
            </p>
            <p className="text-[13px]" style={{ color: '#aaa' }}>
              Wallet, preferences, and account options
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className="flex items-stretch"
        style={{ borderTop: '1px solid #e8e8e8' }}
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
              background: activeTab === tab.id ? '#1a1a1a' : '#fff',
              borderRight: i < arr.length - 1 ? '1px solid #e8e8e8' : 'none',
              paddingBottom: 20,
            }}
          >
            <tab.Icon
              size={20}
              strokeWidth={1.75}
              color={activeTab === tab.id ? '#fff' : '#aaa'}
            />
            <span
              className="text-[9px] font-semibold"
              style={{
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: activeTab === tab.id ? '#fff' : '#aaa',
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
