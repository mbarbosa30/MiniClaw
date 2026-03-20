import { motion } from 'framer-motion';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, useAuthStore } from '@/lib/store';
import { useAgents } from '@/hooks/use-agents';
import { StateIndicator, agentVisualState, STATE_COLOR, STATE_LABEL } from '@/components/StateIndicator';
import { formatAddress } from '@/lib/utils';
import type { Agent } from '@/types';

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 9,
  letterSpacing: '0.04em',
};

function AgentRow({
  agent,
  index,
  onPress,
  onOptions,
}: {
  agent: Agent;
  index: number;
  onPress: () => void;
  onOptions: () => void;
}) {
  const t = useTheme();
  const state = agentVisualState(agent);
  const color = STATE_COLOR[state];
  const isIdle = state === 'idle' || state === 'pending';

  const activity =
    agent.stats?.currentActivity ??
    (agent.description ? agent.description.slice(0, 52) + (agent.description.length > 52 ? '…' : '') : null);

  const statSegments: string[] = [];
  if (agent.llmTokensUsedToday) statSegments.push(`${agent.llmTokensUsedToday.toLocaleString()} tok`);
  if (agent.memorySizeEstimate != null && agent.memorySizeEstimate > 0) {
    statSegments.push(`${(agent.memorySizeEstimate / 1_048_576).toFixed(1)} MB`);
  }
  if (agent.pocScore != null && agent.pocScore > 0) statSegments.push(`PoC ${agent.pocScore}`);
  if (agent.celoBalance != null && agent.celoBalance > 0) statSegments.push(`${agent.celoBalance} CELO`);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      style={{ paddingTop: 20, paddingBottom: 20 }}
    >
      {/* Row 1: name + options button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="text-left"
          onClick={onPress}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 27,
            fontWeight: 300,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            color: isIdle ? t.textDim : t.text,
          }}
        >
          {agent.name}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOptions(); }}
          style={{
            width: 32,
            height: 32,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: t.faint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: 4,
          }}
        >
          <MoreHorizontal size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Row 2: status dot + label + activity text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <StateIndicator state={state} />
        </span>
        <span style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color,
          flexShrink: 0,
        }}>
          {STATE_LABEL[state]}
        </span>
        {activity && (
          <span style={{ fontSize: 10, color: t.label, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activity}
          </span>
        )}
      </div>

      {/* Row 3: monospace live stats */}
      {statSegments.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
          {statSegments.map((seg) => (
            <span key={seg} style={{ ...MONO, color: t.faint }}>
              {seg}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonRow({ index }: { index: number }) {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
      style={{ paddingTop: 20, paddingBottom: 20 }}
    >
      <div style={{ height: 27, width: `${50 + index * 15}%`, background: t.surface, borderRadius: 3 }} />
      <div style={{ height: 10, width: '40%', background: t.surface, borderRadius: 2, marginTop: 10 }} />
    </motion.div>
  );
}

export function HomeView() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const address = useAuthStore((s) => s.address);
  const { data, isLoading, isError } = useAgents();
  const agents = data?.agents ?? [];

  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar"
      style={{ padding: '40px 32px 0', background: t.bg, transition: 'background 0.3s ease' }}
    >
      <p style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 9,
        color: t.faint,
        letterSpacing: '0.05em',
        marginBottom: 40,
      }}>
        {address ? formatAddress(address) : '—'}
      </p>

      {isError && (
        <p style={{ fontSize: 11, color: '#f87171', letterSpacing: '-0.01em', marginBottom: 16 }}>
          Could not load agents. Check your connection.
        </p>
      )}

      <div>
        {isLoading
          ? [0, 1, 2].map((i) => <SkeletonRow key={i} index={i} />)
          : agents.map((agent, i) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              index={i}
              onPress={() => push('agent-detail', { id: String(agent.id) })}
              onOptions={() => push('agent-options', { id: String(agent.id) })}
            />
          ))}

        {!isLoading && agents.length === 0 && !isError && (
          <p style={{ fontSize: 13, color: t.faint, fontWeight: 300, marginBottom: 20 }}>
            No agents yet.
          </p>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.max(agents.length, 1) * 0.07 + 0.05, duration: 0.35 }}
          className="w-full text-left"
          onClick={() => push('create')}
          style={{ paddingTop: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            border: `1px solid ${t.divider}`,
            borderRadius: '50%',
          }}>
            <Plus size={9} color={t.faint} strokeWidth={2} />
          </span>
          <span style={{
            fontSize: 27,
            fontWeight: 300,
            letterSpacing: '-0.025em',
            color: t.textDim,
            lineHeight: 1,
          }}>
            New agent
          </span>
        </motion.button>
      </div>
    </div>
  );
}
