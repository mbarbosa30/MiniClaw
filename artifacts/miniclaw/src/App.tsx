import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { wagmiConfig } from "@/lib/wagmi";
import { useAutoConnect, useRestoreSession } from "@/hooks/use-auth";
import { useGatewayEndpoints } from "@/hooks/use-agents";
import { useRouter, useAppStore } from "@/lib/store";
import { ThemeCtx, LIGHT, DARK } from "@/lib/theme";

import { ConnectView } from "@/views/ConnectView";
import { HomeView } from "@/views/HomeView";
import { DashboardView } from "@/views/DashboardView";
import { GrowthView } from "@/views/GrowthView";
import { FeedView } from "@/views/FeedView";
import { SettingsView } from "@/views/SettingsView";
import { CreateAgentView } from "@/views/CreateAgentView";
import { AgentDetailView } from "@/views/AgentDetailView";
import { SkillsView, KnowledgeView, MemoriesView, SoulView, TasksView, TelegramView, AgentOptionsView, AgentSettingsView, EconomyView } from "@/views/AgentSubViews";
import { AppNav } from "@/components/AppNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const MAIN_VIEWS = new Set(['home', 'dashboard', 'settings', 'growth', 'feed']);

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

function MainLayout() {
  const view = useRouter((s) => s.currentView.name);
  const { h, top } = useVisualViewport();
  return (
    <div style={{ position: 'fixed', top, left: 0, right: 0, height: h, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'home' && <HomeView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'settings' && <SettingsView />}
        {view === 'growth' && <GrowthView />}
        {view === 'feed' && <FeedView />}
      </div>
      <AppNav />
    </div>
  );
}

function ViewManager() {
  useAutoConnect();
  useRestoreSession();
  // Prefetch the gateway manifest once at startup — no blocking, result cached
  // for the session. Views use useHasEndpoint() to read it reactively.
  useGatewayEndpoints();

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemedApp />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
