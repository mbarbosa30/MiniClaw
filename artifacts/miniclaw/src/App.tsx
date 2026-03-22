import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
import { useAutoConnect, useRestoreSession } from "@/hooks/use-auth";
import { useGatewayEndpoints } from "@/hooks/use-agents";
import { useRouter, useAppStore } from "@/lib/store";
import { ThemeCtx, LIGHT, DARK } from "@/lib/theme";

import { ConnectView } from "@/views/ConnectView";
import { HomeView } from "@/views/HomeView";
import { OverviewView } from "@/views/OverviewView";
import { MarketplaceView } from "@/views/MarketplaceView";
import { FeedView } from "@/views/FeedView";
import { SettingsView } from "@/views/SettingsView";
import { CreateAgentView } from "@/views/CreateAgentView";
import { AgentDetailView } from "@/views/AgentDetailView";
import { SkillsView, KnowledgeView, MemoriesView, SoulView, TasksView, TelegramView, AgentOptionsView, AgentSettingsView, EconomyView } from "@/views/AgentSubViews";
import { AppNav } from "@/components/AppNav";
import { useTheme } from "@/lib/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const MAIN_VIEWS = new Set(['home', 'overview', 'feed', 'marketplace', 'settings']);

function useVisualViewport() {
  const [h, setH] = useState(() => window.visualViewport?.height ?? window.innerHeight);
  const [top, setTop] = useState(0);
  useEffect(() => {
    const vp = window.visualViewport;
    const update = () => {
      if (vp) { setH(vp.height); setTop(vp.offsetTop); }
      else { setH(window.innerHeight); setTop(0); }
    };
    if (vp) { vp.addEventListener('resize', update); vp.addEventListener('scroll', update); }
    else { window.addEventListener('resize', update); }
    return () => {
      if (vp) { vp.removeEventListener('resize', update); vp.removeEventListener('scroll', update); }
      else { window.removeEventListener('resize', update); }
    };
  }, []);
  return { h, top };
}

function MainTopBar() {
  const t = useTheme();
  const push = useRouter((s) => s.push);
  const view = useRouter((s) => s.currentView.name);

  if (view === 'settings') return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '12px 20px 0',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => push('settings')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          display: 'flex',
          alignItems: 'center',
          color: t.faint,
        }}
      >
        <Settings size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

function MainLayout() {
  const view = useRouter((s) => s.currentView.name);
  const { h, top } = useVisualViewport();
  useGatewayEndpoints();
  return (
    <div style={{ position: 'fixed', top, left: 0, right: 0, height: h, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MainTopBar />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'home' && <HomeView />}
        {view === 'overview' && <OverviewView />}
        {view === 'feed' && <FeedView />}
        {view === 'marketplace' && <MarketplaceView />}
        {view === 'settings' && <SettingsView />}
      </div>
      {view !== 'settings' && <AppNav />}
    </div>
  );
}

function ViewManager() {
  useAutoConnect();
  useRestoreSession();

  const view = useRouter((s) => s.currentView.name);

  if (view === 'connect') return <ConnectView />;
  if (MAIN_VIEWS.has(view)) return <MainLayout />;

  switch (view) {
    case 'create':       return <CreateAgentView />;
    case 'agent-detail':   return <AgentDetailView />;
    case 'agent-options':  return <AgentOptionsView />;
    case 'agent-settings': return <AgentSettingsView />;
    case 'skills':         return <SkillsView />;
    case 'knowledge':      return <KnowledgeView />;
    case 'soul':           return <SoulView />;
    case 'memories':       return <MemoriesView />;
    case 'tasks':          return <TasksView />;
    case 'telegram':       return <TelegramView />;
    case 'economy':        return <EconomyView />;
    default:             return <ConnectView />;
  }
}

function ThemedApp() {
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={theme}>
      <main
        className="mobile-app-container"
        style={{ background: theme.bg, transition: 'background 0.3s ease' }}
      >
        <ViewManager />
      </main>
      <Toaster />
    </ThemeCtx.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemedApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
