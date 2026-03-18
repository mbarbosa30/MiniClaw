import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useAuthSync } from "@/hooks/use-auth";
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <main className="mobile-app-container">
          <ViewManager />
        </main>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
