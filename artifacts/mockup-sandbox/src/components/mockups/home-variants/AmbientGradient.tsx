import { motion } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';

const MOCK_WALLET = '0x71C7…3Fa9';

const ACCENT_COLORS: Record<number, { strip: string; bg: string }> = {
  0: { strip: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
  1: { strip: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  2: { strip: '#14b8a6', bg: 'rgba(20,184,166,0.10)' },
  3: { strip: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
};

const MOCK_AGENTS = [
  { id: '1', emoji: '🧠', name: 'Research Owl', status: 'active', description: 'Deep-dives topics on demand' },
  { id: '2', emoji: '✍️', name: 'Draft Studio', status: 'active', description: 'Writes copy, posts, threads' },
  { id: '3', emoji: '🔎', name: 'Fact Check', status: 'idle', description: 'Verifies claims and sources' },
];

function PulsingDot({ active }: { active: boolean }) {
  if (!active) {
    return (
      <span
        className="w-2 h-2 rounded-full shrink-0 block"
        style={{ background: '#D4D4D4' }}
      />
    );
  }
  return (
    <motion.span
      className="w-2 h-2 rounded-full shrink-0 block"
      style={{ background: '#10b981' }}
      animate={{ scale: [1, 1.35, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function AmbientGradient() {
  return (
    <div
      className="relative flex flex-col h-screen overflow-hidden select-none"
      style={{
        width: 390,
        background: 'linear-gradient(180deg, #F0F0F8 0%, #FAF8F5 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <div>
          <h1
            className="text-[24px] font-bold text-black"
            style={{ letterSpacing: '-0.025em' }}
          >
            MiniClaw
          </h1>
          <div className="mt-1.5">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(180,178,200,0.18)',
                border: '1px solid rgba(150,145,190,0.14)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-[11px] font-medium" style={{ color: '#6B6B80' }}>
                {MOCK_WALLET}
              </span>
            </span>
          </div>
        </div>
        <button
          className="p-2 rounded-xl"
          style={{
            color: '#9CA3AF',
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Section heading */}
      <div className="px-5 mb-3">
        <p
          className="text-[10px] font-medium"
          style={{ color: '#B0ADC5', letterSpacing: '0.10em', textTransform: 'uppercase' }}
        >
          Your agents
        </p>
      </div>

      {/* Agent cards */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-3 no-scrollbar">
        {MOCK_AGENTS.map((agent, i) => {
          const accent = ACCENT_COLORS[i % 4];
          return (
            <motion.button
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 320, damping: 30 }}
              whileTap={{ scale: 0.985 }}
              className="w-full text-left rounded-2xl overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8E8F0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-stretch">
                {/* 3px left accent strip */}
                <div
                  className="w-[3px] shrink-0"
                  style={{ background: accent.strip }}
                />

                {/* Card content */}
                <div className="flex items-center gap-3 px-3.5 py-4 flex-1 min-w-0">
                  {/* Avatar with tinted bg */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: accent.bg }}
                  >
                    {agent.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-[15px] text-black truncate"
                      style={{ letterSpacing: '-0.01em' }}
                    >
                      {agent.name}
                    </p>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                      {agent.description}
                    </p>
                  </div>

                  <PulsingDot active={agent.status === 'active'} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Ghost create button — transparent fill, indigo border only */}
      <div className="absolute bottom-8 left-5 right-5 z-20">
        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[15px] font-semibold"
          style={{
            border: '1.5px solid #6366f1',
            color: '#6366f1',
            background: 'transparent',
          }}
        >
          <Plus size={18} />
          New agent
        </button>
      </div>
    </div>
  );
}
