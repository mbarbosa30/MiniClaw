import { List, LayoutGrid, SlidersHorizontal, Rss } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useRouter, type ViewName } from '@/lib/store';
import { useHasEndpoint } from '@/hooks/use-agents';

type NavTab = 'home' | 'dashboard' | 'feed' | 'settings';

const BASE_TABS: { id: NavTab; Icon: React.ElementType }[] = [
  { id: 'home', Icon: List },
  { id: 'dashboard', Icon: LayoutGrid },
  { id: 'settings', Icon: SlidersHorizontal },
];

export function AppNav() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const currentView = useRouter((s) => s.currentView.name) as ViewName;
  const feedAvailable = useHasEndpoint('/v1/feed');

  const tabs: { id: NavTab; Icon: React.ElementType }[] = feedAvailable
    ? [
        BASE_TABS[0],
        BASE_TABS[1],
        { id: 'feed', Icon: Rss },
        BASE_TABS[2],
      ]
    : BASE_TABS;

  const activeTab: NavTab = tabs.some(tab => tab.id === currentView)
    ? (currentView as NavTab)
    : 'home';

  return (
    <div
      style={{
        borderTop: `1px solid ${t.navBorder}`,
        display: 'flex',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        paddingTop: 12,
        background: t.bg,
        transition: 'background 0.3s ease, border-color 0.3s ease',
        flexShrink: 0,
      }}
    >
      {tabs.map(({ id, Icon }) => (
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
            padding: '8px 0',
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
