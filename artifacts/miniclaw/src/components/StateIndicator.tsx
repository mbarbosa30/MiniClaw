import { motion } from 'framer-motion';
import type { Agent } from '@/types';

export type VisualState = 'running' | 'thinking' | 'waiting' | 'pending' | 'idle';

export const STATE_COLOR: Record<VisualState, string> = {
  running: '#22c55e',
  thinking: '#818cf8',
  waiting: '#f59e0b',
  pending: '#60a5fa',
  idle: '#333',
};

export const STATE_LABEL: Record<VisualState, string> = {
  running: 'running',
  thinking: 'thinking',
  waiting: 'waiting',
  pending: 'active',
  idle: 'paused',
};

export function agentVisualState(agent: Agent): VisualState {
  // runtimeStatus takes priority when set
  const rs = agent.runtimeStatus;
  if (rs === 'thinking') return 'thinking';
  if (rs === 'running') return 'running';
  if (rs === 'waiting') return 'waiting';
  // Fall back to lifecycle status: active agents are 'pending' (alive but quiet)
  if (agent.status === 'active') return 'pending';
  // paused, error, or unknown → idle (fully dim)
  return 'idle';
}

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

export function StateIndicator({ state }: { state: VisualState }) {
  const color = STATE_COLOR[state];
  if (state === 'thinking') return <ThinkingDots color={color} />;
  if (state === 'running') return <RunningBars color={color} />;
  if (state === 'waiting') return <WaitingDot color={color} />;
  return <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }} />;
}
