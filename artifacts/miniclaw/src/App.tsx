import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { wagmiConfig } from "@/lib/wagmi";
import { useAutoConnect, useWalletSync, useAuthSync } from "@/hooks/use-auth";
import { useRouter } from "@/lib/store";

import { ConnectView } from "@/views/ConnectView";
import { HomeView } from "@/views/HomeView";
import { CreateAgentView } from "@/views/CreateAgentView";
import { AgentDetailView } from "@/views/AgentDetailView";
import { SkillsView, KnowledgeView, SoulView, MemoriesView, TasksView, TelegramView } from "@/views/AgentSubViews";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ViewManager() {
  // Per MiniPay docs: auto-connect must be called in root layout
  useAutoConnect();
  // Watch Wagmi connection and sync address → auth state → home
  useWalletSync();
  // Check existing SelfClaw session on mount (best-effort)
  useAuthSync();

  const view = useRouter(s => s.currentView.name);

  switch (view) {
    case 'connect':      return <ConnectView />;
    case 'home':         return <HomeView />;
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

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <main className="mobile-app-container">
            <ViewManager />
          </main>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
