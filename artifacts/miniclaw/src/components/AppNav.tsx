import { List, BarChart2, Activity, Newspaper, ShoppingBag } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, useAppStore, type ViewName } from '@/lib/store';
import { useAgents } from '@/hooks/use-agents';

type NavTab = 'home' | 'overview' | 'activity-global' | 'feed' | 'marketplace';

const TABS: { id: NavTab; Icon: React.ElementType }[] = [
  { id: 'home', Icon: List },
  { id: 'overview', Icon: BarChart2 },
  { id: 'activity-global', Icon: Activity },
  { id: 'feed', Icon: Newspaper },
  { id: 'marketplace', Icon: ShoppingBag },
];

export function AppNav() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const currentView = useRouter((s) => s.currentView.name) as ViewName;
  const hasUnseenCompletions = useAppStore((s) => s.hasUnseenCompletions);
  const { data: agentData } = useAgents();
  const totalPendingTasks = (agentData?.agents ?? []).reduce(
    (s, a) => s + (a.pendingTaskCount ?? a.stats?.pendingTasksCount ?? 0), 0,
  );
  const showActivityBadge = hasUnseenCompletions || totalPendingTasks > 0;

  const activeTab: NavTab | null = TABS.some(tab => tab.id === currentView)
    ? (currentView as NavTab)
    : null;

  return (
    <div
      style={{
        borderTop: `1px solid ${t.navBorder}`,
        display: 'flex',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        paddingTop: 16,
        background: t.bg,
        transition: 'background 0.3s ease, border-color 0.3s ease',
        flexShrink: 0,
      }}
    >
      {TABS.map(({ id, Icon }) => (
        <button
          key={id}
          onClick={() => push(id)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 0',
            position: 'relative',
          }}
        >
          <Icon
            size={18}
            strokeWidth={activeTab === id ? 2.25 : 1.5}
            color={activeTab === id ? t.text : t.faint}
          />
          {/* Amber dot badge on Activity tab when there are pending tasks or unseen completions */}
          {id === 'activity-global' && showActivityBadge && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 'calc(50% - 14px)',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'block',
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
