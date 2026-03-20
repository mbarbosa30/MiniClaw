import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useAgents } from '@/hooks/use-agents';
import { StateIndicator, agentVisualState, STATE_COLOR, STATE_LABEL } from '@/components/StateIndicator';
import type { Agent } from '@/types';

function MiniBar({ value, color, track }: { value: number; color: string; track: string }) {
  return (
    <div style={{ width: '100%', height: 1.5, background: track, borderRadius: 1, marginTop: 4 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', background: color, borderRadius: 1 }}
      />
    </div>
  );
}

function MetricRow({
  label, value, sub, bar, barColor,
}: {
  label: string; value: string; sub?: string; bar?: number; barColor?: string;
}) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, color: t.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: t.text, letterSpacing: '-0.01em' }}>
            {value}
          </span>
          {sub && (
            <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, marginLeft: 6 }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      {bar !== undefined && <MiniBar value={bar} color={barColor ?? t.text} track={t.surface} />}
    </div>
  );
}

function AgentCard({ agent, i }: { agent: Agent; i: number }) {
  const t = useTheme();
  const state = agentVisualState(agent);
  const color = STATE_COLOR[state];

  const skills = agent.enabledSkills ?? [];
  const interests = agent.interests ?? [];
  const model = agent.premiumModel && agent.premiumModel !== 'none' ? agent.premiumModel : 'standard';
  const tasks = agent.recentTasks?.length ?? 0;
  const skillFraction = Math.min(skills.length / 10, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.4 }}
      style={{ marginBottom: 36 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: t.text, letterSpacing: '-0.01em' }}>
              {agent.name}
            </span>
            <StateIndicator state={state} />
          </div>
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 9,
            color,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}>
            {STATE_LABEL[state]}
          </span>
        </div>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint }}>
          {model}
        </span>
      </div>

      <MetricRow
        label="Skills"
        value={`${skills.length} active`}
        sub={skills.slice(0, 3).join(', ') || undefined}
        bar={skillFraction}
      />
      <MetricRow
        label="Interests"
        value={`${interests.length}`}
        sub={interests.slice(0, 2).join(', ') || undefined}
      />
      {tasks > 0 && (
        <MetricRow label="Recent tasks" value={`${tasks}`} />
      )}
      {agent.description && (
        <MetricRow
          label="Description"
          value={agent.description.slice(0, 32) + (agent.description.length > 32 ? '…' : '')}
        />
      )}

      <div style={{ height: 1, background: t.divider, marginTop: 4 }} />
    </motion.div>
  );
}

function SkeletonCard({ i }: { i: number }) {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
      style={{ marginBottom: 36 }}
    >
      <div style={{ height: 14, width: '45%', background: t.surface, borderRadius: 3, marginBottom: 12 }} />
      <div style={{ height: 10, width: '60%', background: t.surface, borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 10, width: '40%', background: t.surface, borderRadius: 2 }} />
      <div style={{ height: 1, background: t.divider, marginTop: 20 }} />
    </motion.div>
  );
}

export function DashboardView() {
  const t = useTheme();
  const { data, isLoading } = useAgents();
  const agents = data?.agents ?? [];

  const active = agents.filter((a) => a.status === 'active').length;
  const paused = agents.filter((a) => a.status === 'paused').length;
  const errors = agents.filter((a) => a.status === 'error').length;

  const bigNum = (n: string, label: string, sub?: string) => (
    <div>
      <p style={{ fontSize: 40, fontWeight: 200, color: t.text, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {n}
        {sub && <span style={{ fontSize: 13, color: t.faint }}>{sub}</span>}
      </p>
      <p style={{ fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 5 }}>
        {label}
      </p>
    </div>
  );

  return (
    <div
      style={{
        padding: '40px 32px 0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: t.bg,
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 32, marginBottom: 36, flexShrink: 0 }}>
        {bigNum(`${active}`, 'Active', ` / ${agents.length}`)}
        {bigNum(`${paused}`, 'Paused')}
        {errors > 0 && bigNum(`${errors}`, 'Errors')}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {isLoading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} i={i} />)
          : agents.map((agent, i) => <AgentCard key={agent.id} agent={agent} i={i} />)}

        {!isLoading && agents.length === 0 && (
          <p style={{ fontSize: 13, color: t.faint, fontWeight: 300 }}>No agents to show.</p>
        )}
      </div>
    </div>
  );
}
