import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { wagmiConfig } from "@/lib/wagmi";
import { useAutoConnect, useRestoreSession } from "@/hooks/use-auth";
import { useRouter, useAppStore } from "@/lib/store";
import { ThemeCtx, LIGHT, DARK } from "@/lib/theme";

import { ConnectView } from "@/views/ConnectView";
import { HomeView } from "@/views/HomeView";
import { DashboardView } from "@/views/DashboardView";
import { SettingsView } from "@/views/SettingsView";
import { CreateAgentView } from "@/views/CreateAgentView";
import { AgentDetailView } from "@/views/AgentDetailView";
import { SkillsView, KnowledgeView, SoulView, MemoriesView, TasksView, TelegramView } from "@/views/AgentSubViews";
import { AppNav } from "@/components/AppNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const MAIN_VIEWS = new Set(['home', 'dashboard', 'settings']);

function MainLayout() {
  const view = useRouter((s) => s.currentView.name);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'home' && <HomeView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'settings' && <SettingsView />}
      </div>
      <AppNav />
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
    case 'agent-detail': return <AgentDetailView />;
    case 'skills':       return <SkillsView />;
    case 'knowledge':    return <KnowledgeView />;
    case 'soul':         return <SoulView />;
    case 'memories':     return <MemoriesView />;
    case 'tasks':        return <TasksView />;
    case 'telegram':     return <TelegramView />;
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
