import { List, BarChart2, Activity, ShoppingBag } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, type ViewName } from '@/lib/store';

type NavTab = 'home' | 'overview' | 'activity-global' | 'marketplace';

const TABS: { id: NavTab; Icon: React.ElementType }[] = [
  { id: 'home', Icon: List },
  { id: 'overview', Icon: BarChart2 },
  { id: 'activity-global', Icon: Activity },
  { id: 'marketplace', Icon: ShoppingBag },
];

export function AppNav() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const currentView = useRouter((s) => s.currentView.name) as ViewName;

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
          }}
        >
          <Icon
            size={18}
            strokeWidth={activeTab === id ? 2.25 : 1.5}
            color={activeTab === id ? t.text : t.faint}
          />
        </button>
      ))}
    </div>
  );
}
