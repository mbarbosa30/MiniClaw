import { LogOut } from 'lucide-react';

const MOCK_WALLET = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
const SHORT_WALLET = '0x71C7…976F';

const MOCK_AGENTS = [
  { id: '1', emoji: '🧠', name: 'Research Owl', status: 'active', description: 'Deep-dives topics on demand' },
  { id: '2', emoji: '✍️', name: 'Draft Studio', status: 'active', description: 'Writes copy, posts, threads' },
  { id: '3', emoji: '🔎', name: 'Fact Check', status: 'idle', description: 'Verifies claims and sources' },
];

export function SurgicalLight() {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-white select-none"
      style={{ width: 390 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-12 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-[22px] font-bold tracking-tight text-black leading-none"
              style={{ letterSpacing: '-0.02em' }}
            >
              MiniClaw
            </h1>
            <button
              className="text-[11px] font-medium"
              style={{
                color: '#6366f1',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                letterSpacing: '0.01em',
              }}
            >
              New agent
            </button>
          </div>
          <p
            className="mt-1.5 text-[11px] leading-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#A3A3A3',
              letterSpacing: '0.02em',
            }}
          >
            {SHORT_WALLET}
          </p>
        </div>
        <button className="p-1.5" style={{ color: '#D4D4D4' }}>
          <LogOut size={15} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#F5F5F5', marginLeft: 24, marginRight: 24 }} />

      {/* Agents section */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 no-scrollbar">
        <p
          className="mb-5 text-[10px] font-medium"
          style={{
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#C4C4C4',
          }}
        >
          Your agents
        </p>

        <div className="space-y-0">
          {MOCK_AGENTS.map((agent, i) => (
            <button
              key={agent.id}
              className="w-full text-left py-5 flex items-start gap-3 group"
              style={{
                borderBottom: i < MOCK_AGENTS.length - 1 ? '1px solid #F5F5F5' : 'none',
              }}
            >
              {/* Emoji square */}
              <span
                className="text-base leading-none mt-0.5 w-5 text-center shrink-0"
                style={{ fontSize: 16 }}
              >
                {agent.emoji}
              </span>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[18px] font-semibold text-black leading-tight truncate"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {agent.name}
                </p>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: '#A3A3A3' }}>
                  {agent.description}
                </p>
              </div>

              {/* Status: typographic only */}
              <span
                className="text-[10px] font-medium mt-1 shrink-0"
                style={{
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: agent.status === 'active' ? '#6366f1' : '#D4D4D4',
                }}
              >
                {agent.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom safe area */}
      <div className="h-6 bg-white" />
    </div>
  );
}
