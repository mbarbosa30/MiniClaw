import { motion } from 'framer-motion';
import type { Agent } from '@/types';

export type VisualState =
  | 'thinking'
  | 'working'
  | 'reflecting'
  | 'observing'
  | 'composing'
  | 'resting'
  | 'sleeping'
  | 'running'
  | 'waiting'
  | 'pending'
  | 'idle';

export const STATE_COLOR: Record<VisualState, string> = {
  thinking:   '#818cf8',
  working:    '#22c55e',
  reflecting: '#fbbf24',
  observing:  '#06b6d4',
  composing:  '#a78bfa',
  resting:    '#64748b',
  sleeping:   '#334155',
  running:    '#22c55e',
  waiting:    '#f59e0b',
  pending:    '#94a3b8',
  idle:       '#333',
};

export const STATE_LABEL: Record<VisualState, string> = {
  thinking:   'Thinking...',
  working:    'Working on a task',
  reflecting: 'Deep in thought',
  observing:  'Scanning the horizon',
  composing:  'Composing a message',
  resting:    'Resting',
  sleeping:   'Sleeping',
  running:    'Working on a task',
  waiting:    'Waiting',
  pending:    'Standby',
  idle:       'Standing by',
};

export function agentVisualState(agent: Agent): VisualState {
  // Prefer liveStatus (returned by GET /v1/hosted-agents since 2026-03),
  // fall back to legacy runtimeStatus field for older API responses.
  const ls = agent.liveStatus ?? agent.runtimeStatus;
  if (ls === 'thinking')   return 'thinking';
  if (ls === 'working')    return 'working';
  if (ls === 'reflecting') return 'reflecting';
  if (ls === 'observing')  return 'observing';
  if (ls === 'composing')  return 'composing';
  if (ls === 'resting')    return 'resting';
  if (ls === 'sleeping')   return 'sleeping';
  if (ls === 'running')    return 'running';
  if (ls === 'waiting')    return 'waiting';
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

function WaitingDot({ color, slow }: { color: string; slow?: boolean }) {
  return (
    <motion.span
      style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }}
      animate={{ opacity: slow ? [0.45, 0.1, 0.45] : [1, 0.15, 1] }}
      transition={{ duration: slow ? 3.5 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function StateIndicator({ state }: { state: VisualState }) {
  const color = STATE_COLOR[state];
  if (state === 'thinking' || state === 'composing')
    return <ThinkingDots color={color} />;
  if (state === 'working' || state === 'running' || state === 'observing')
    return <RunningBars color={color} />;
  if (state === 'reflecting' || state === 'waiting')
    return <WaitingDot color={color} />;
  if (state === 'resting')
    return <WaitingDot color={color} slow />;
  return <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: color }} />;
}
