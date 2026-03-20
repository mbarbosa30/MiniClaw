import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useAgents, useActivity } from '@/hooks/use-agents';
import { StateIndicator, agentVisualState, STATE_COLOR, STATE_LABEL } from '@/components/StateIndicator';
import type { Agent, AgentListSummary } from '@/types';

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso?: string): string {
  if (!iso) return '';
  try {
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) return '';
    const diff = Date.now() - ms;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return '';
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtMB(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function fmtUptime(pct: number): string {
  return `${pct.toFixed(1)}% up`;
}

// ── MiniBar ───────────────────────────────────────────────────────────────────

function MiniBar({ value, color, track }: { value: number; color: string; track: string }) {
  return (
    <div style={{ width: '100%', height: 1.5, background: track, borderRadius: 1, marginTop: 4 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 1) * 100}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '100%', background: color, borderRadius: 1 }}
      />
    </div>
  );
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

function MetricRow({
  label, value, sub, bar, barColor,
}: {
  label: string; value: string; sub?: string; bar?: number; barColor?: string;
}) {
  const t = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 9,
          color: t.faint,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          {label}
        </span>
        <div style={{ textAlign: 'right', marginLeft: 12 }}>
          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: t.text, letterSpacing: '-0.01em' }}>
            {value}
          </span>
          {sub && (
            <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, marginLeft: 8 }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      {bar !== undefined && <MiniBar value={bar} color={barColor ?? t.text} track={t.surface} />}
    </div>
  );
}

// ── AgentCard ─────────────────────────────────────────────────────────────────

function AgentCard({ agent, i }: { agent: Agent; i: number }) {
  const t = useTheme();
  const state = agentVisualState(agent);
  const color = STATE_COLOR[state];

  const memLimit = agent.memorySizeLimit ?? 8_388_608; // 8 MB default
  const memBar = (agent.memorySizeEstimate != null && agent.memorySizeEstimate > 0)
    ? agent.memorySizeEstimate / memLimit
    : undefined;

  const skillNames = (agent.enabledSkillNames ?? []).filter(Boolean);

  const { data: activityItems, isLoading: activityLoading } = useActivity(agent.id);
  const recentItems = (activityItems ?? []).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1, duration: 0.4 }}
      style={{ marginBottom: 36 }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 16, fontWeight: 400, color: t.text, letterSpacing: '-0.015em', lineHeight: 1 }}>
              {agent.name}
            </span>
            <StateIndicator state={state} />
          </div>
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 8,
            color,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            background: `${color}1a`,
            border: `1px solid ${color}40`,
            borderRadius: 3,
            padding: '2px 5px',
            display: 'inline-block',
          }}>
            {STATE_LABEL[state]}
          </span>
        </div>
        {agent.uptimePercent != null && (
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 9,
            color: t.faint,
            letterSpacing: '0.02em',
            marginTop: 2,
          }}>
            {fmtUptime(agent.uptimePercent)}
          </span>
        )}
      </div>

      {/* MEMORY */}
      {agent.memorySizeEstimate != null && agent.memorySizeEstimate > 0 && (
        <MetricRow
          label="Memory"
          value={fmtMB(agent.memorySizeEstimate)}
          sub={`/ ${fmtMB(memLimit)}`}
          bar={memBar}
          barColor={t.text}
        />
      )}

      {/* TOKENS */}
      {agent.llmTokensUsedToday != null && agent.llmTokensUsedToday > 0 && (
        <MetricRow
          label="Tokens"
          value={agent.llmTokensUsedToday.toLocaleString()}
          sub={agent.tokenCostUsd != null ? `${fmtCost(agent.tokenCostUsd)} today` : undefined}
        />
      )}

      {/* ECONOMICS */}
      {agent.economicsEarnedToday != null && agent.economicsEarnedToday > 0 && (
        <MetricRow
          label="Economics"
          value={`${fmtCost(agent.economicsEarnedToday)} earned today`}
        />
      )}

      {/* POC SCORE */}
      {agent.pocScore != null && agent.pocScore > 0 && (
        <MetricRow
          label="PoC Score"
          value={`${agent.pocScore} pts`}
          bar={agent.pocScore / 100}
          barColor="#818cf8"
        />
      )}

      {/* SKILLS */}
      {skillNames.length > 0 && (
        <MetricRow
          label="Skills"
          value={`${skillNames.length} active`}
          sub={skillNames.slice(0, 3).join(', ')}
        />
      )}

      {/* HOLDINGS — detail-only, null on list endpoint, hidden when null */}
      {agent.celoBalance != null && agent.celoBalance > 0 && (
        <MetricRow
          label="Holdings"
          value={`${agent.celoBalance} CELO`}
          sub={agent.holdingsUsd != null ? `$${agent.holdingsUsd.toFixed(2)}` : undefined}
        />
      )}

      {/* PROGRESS */}
      {agent.progressPercent != null && agent.progressPercent > 0 && (
        <MetricRow
          label="Progress"
          value={`${agent.progressPercent}%`}
          bar={agent.progressPercent / 100}
          barColor={t.text}
        />
      )}

      {/* RECENT ACTIVITY */}
      {activityLoading && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 9, width: '18%', background: t.surface, borderRadius: 2, marginBottom: 8 }} />
          <div style={{ height: 9, width: '78%', background: t.surface, borderRadius: 2, marginBottom: 5 }} />
          <div style={{ height: 9, width: '62%', background: t.surface, borderRadius: 2 }} />
        </div>
      )}
      {!activityLoading && recentItems.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 9,
            color: t.faint,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 7,
          }}>
            Recent
          </span>
          {recentItems.map((item) => {
            const text = item.summary || item.description || item.content || item.type;
            const ts = relativeTime(item.createdAt);
            return (
              <div
                key={item.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 5 }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 300,
                  color: t.label,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.4,
                }}>
                  {text}
                </span>
                {ts && (
                  <span style={{
                    fontFamily: 'ui-monospace, Menlo, monospace',
                    fontSize: 9,
                    color: t.faint,
                    letterSpacing: '0.02em',
                    flexShrink: 0,
                  }}>
                    {ts}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 1, background: t.divider, marginTop: 4 }} />
    </motion.div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────

function SkeletonCard({ i }: { i: number }) {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
      style={{ marginBottom: 36 }}
    >
      <div style={{ height: 16, width: '50%', background: t.surface, borderRadius: 3, marginBottom: 8 }} />
      <div style={{ height: 9, width: '25%', background: t.surface, borderRadius: 2, marginBottom: 18 }} />
      {[70, 55, 80, 45].map((w, j) => (
        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ height: 9, width: '20%', background: t.surface, borderRadius: 2 }} />
          <div style={{ height: 9, width: `${w - 30}%`, background: t.surface, borderRadius: 2 }} />
        </div>
      ))}
      <div style={{ height: 1, background: t.divider, marginTop: 4 }} />
    </motion.div>
  );
}

// ── SummaryHeader ─────────────────────────────────────────────────────────────

function SummaryHeader({ summary, agentCount }: { summary?: AgentListSummary; agentCount: number }) {
  const t = useTheme();

  const activeStr = summary
    ? `${summary.activeCount}`
    : '—';
  const totalStr = summary ? ` / ${summary.totalCount}` : ` / ${agentCount}`;
  const tokStr = summary ? fmtTokens(summary.totalTokens) : '—';
  const costStr = summary ? fmtCost(summary.totalCostUsd) : '—';

  const col = (main: string, label: string, sub?: string) => (
    <div>
      <p style={{ fontSize: 40, fontWeight: 200, color: t.text, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {main}
        {sub && <span style={{ fontSize: 14, fontWeight: 300, color: t.faint }}>{sub}</span>}
      </p>
      <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 9, color: t.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 32, marginBottom: 36, flexShrink: 0 }}>
      {col(activeStr, 'Active', totalStr)}
      {col(tokStr, 'Tokens')}
      {col(costStr, 'Cost')}
    </div>
  );
}

// ── DashboardView ─────────────────────────────────────────────────────────────

export function DashboardView() {
  const t = useTheme();
  const { data, isLoading } = useAgents();
  const agents = data?.agents ?? [];
  const summary = data?.summary;

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
      <SummaryHeader summary={summary} agentCount={agents.length} />

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
