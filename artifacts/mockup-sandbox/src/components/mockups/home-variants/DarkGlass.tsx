import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';

const MOCK_WALLET = '0x71C7…3Fa9';

const MOCK_AGENTS = [
  { id: '1', emoji: '🧠', name: 'Research Owl', status: 'active', description: 'Deep-dives topics on demand' },
  { id: '2', emoji: '✍️', name: 'Draft Studio', status: 'active', description: 'Writes copy, posts, threads' },
  { id: '3', emoji: '🔎', name: 'Fact Check', status: 'idle', description: 'Verifies claims and sources' },
];

export function DarkGlass() {
  return (
    <div
      className="relative flex flex-col h-screen overflow-hidden select-none"
      style={{ background: '#08080F', width: 390 }}
    >
      {/* Ambient indigo bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse 70% 45% at 50% 0%, hsla(243,75%,59%,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-10 pb-5">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">MiniClaw</h1>
          <div
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#10b981', boxShadow: '0 0 5px #10b981' }}
            />
            <span className="text-[11px] font-mono text-white/50">{MOCK_WALLET}</span>
          </div>
        </div>
        <button
          className="p-2 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Agent list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-32 no-scrollbar">
        <p
          className="text-[11px] font-medium tracking-widest uppercase mb-4"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Your Agents
        </p>
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {MOCK_AGENTS.map((agent, i) => (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255,255,255,0.04)' }}
                whileTap={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 340, damping: 28 }}
                className="w-full text-left rounded-2xl p-4"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3.5">
                  {/* Avatar — darker rounded square with light rim */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderTop: '1px solid rgba(255,255,255,0.14)',
                      borderLeft: '1px solid rgba(255,255,255,0.10)',
                      borderRight: '1px solid rgba(255,255,255,0.04)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    {agent.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-white truncate">{agent.name}</p>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {agent.description}
                    </p>
                  </div>
                  {/* Status glow dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={
                      agent.status === 'active'
                        ? { background: '#10b981', boxShadow: '0 0 6px #10b981, 0 0 12px rgba(16,185,129,0.4)' }
                        : { background: 'rgba(255,255,255,0.18)' }
                    }
                  />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating action button — indigo with glow halo */}
      <div className="absolute bottom-8 right-5 z-20">
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'hsla(243,75%,59%,1)',
            boxShadow: '0 0 0 1px hsla(243,75%,59%,0.3), 0 0 20px hsla(243,75%,59%,0.35), 0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Bottom safe area fill */}
      <div className="absolute bottom-0 left-0 right-0 h-6 z-10" style={{ background: '#08080F' }} />
    </div>
  );
}
