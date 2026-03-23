import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAutoConnect, useRestoreSession } from "@/hooks/use-auth";
import { useGatewayEndpoints, useRecentEvents } from "@/hooks/use-agents";
import { useRouter, useAppStore, useAuthStore } from "@/lib/store";
import { ThemeCtx, LIGHT, DARK } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";
import type { AgentEvent } from "@/types";

import { ConnectView } from "@/views/ConnectView";
import { HomeView } from "@/views/HomeView";
import { OverviewView } from "@/views/OverviewView";
import { MarketplaceView } from "@/views/MarketplaceView";
import { FeedView } from "@/views/FeedView";
import { GlobalActivityView } from "@/views/GlobalActivityView";
import { SettingsView } from "@/views/SettingsView";
import { CreateAgentView } from "@/views/CreateAgentView";
import { AgentDetailView } from "@/views/AgentDetailView";
import { SkillsView, KnowledgeView, MemoriesView, SoulView, TasksView, TelegramView, AgentOptionsView, AgentSettingsView, EconomyView, ActivityView } from "@/views/AgentSubViews";
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

const MAIN_VIEWS = new Set(['home', 'overview', 'feed', 'marketplace', 'settings', 'activity-global']);

// Maps an agent event to a short human-readable toast string.
// Returns null for events that only warrant cache invalidation (no toast shown).
function eventToast(ev: AgentEvent): string | null {
  const n = ev.agentName ?? 'Agent';
  const d = ev.data ?? {};
  switch (ev.event) {
    case 'task_completed':         return null; // shown as dot badge on Activity icon, not a toast
    case 'task_failed':            return `${n} — task failed`;
    case 'reminder_fired':         return `${n} — ${(d.description as string) ?? 'reminder'}`;
    case 'proactive_message':      return `${n} has a message`;
    case 'order_delivered':        return `Order delivered by ${n}`;
    case 'order_completed':        return `Order completed`;
    case 'order_failed':           return `Order failed`;
    case 'memory_milestone':       return `${n} reached ${d.count ?? ''} memories`.trim();
    case 'daily_digest':           return `${n}'s digest is ready`;
    case 'deep_reflection_complete': return `${n} completed a deep reflection`;
    case 'post_created':           return `${n} posted`;
    case 'wallet_created':         return `${n}'s wallet created`;
    case 'token_deployed':         return `${n}'s token deployed`;
    case 'identity_registered':    return `${n} registered onchain identity`;
    default:                       return null;
  }
}

// Polls /events/recent every 12s when authenticated. Shows toasts for notable
// events and invalidates relevant React Query caches so UI reflects live state.
// `since` starts at mount time — no history is replayed on open.
// Resets on auth transitions (login after logout) to avoid stale window gaps.
function useEventNotifications() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setHasUnseenCompletions = useAppStore((s) => s.setHasUnseenCompletions);
  const currentViewName = useRouter((s) => s.currentView.name);
  const [since, setSince] = useState(() => new Date().toISOString());
  const prevAuthenticated = useRef(isAuthenticated);

  // Reset the event window whenever the user logs in fresh, so any historical
  // events accumulated during the unauthenticated period are not replayed.
  useEffect(() => {
    if (!prevAuthenticated.current && isAuthenticated) {
      setSince(new Date().toISOString());
    }
    prevAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  const { data } = useRecentEvents(since, isAuthenticated);

  useEffect(() => {
    if (!data?.events?.length) return;

    const events = [...data.events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latest = events[events.length - 1].timestamp;
    setSince(latest);

    for (const ev of events) {
      // Per-event cache invalidation
      if (ev.event === 'task_completed' || ev.event === 'task_failed') {
        qc.invalidateQueries({ queryKey: ['tasks', ev.agentId] });
        qc.invalidateQueries({ queryKey: ['tasks', ev.agentId, 'pending'] });
        qc.invalidateQueries({ queryKey: ['tasks', ev.agentId, 'all'] });
        qc.invalidateQueries({ queryKey: ['tasks', ev.agentId, 'completed'] });
        qc.invalidateQueries({ queryKey: ['task-summary', ev.agentId] });
      }
      // Show dot badge on Activity icon for task completions,
      // but skip if the user is already viewing the Activity screen.
      if (ev.event === 'task_completed' && currentViewName !== 'activity-global') {
        setHasUnseenCompletions(true);
      }
      // Marketplace order events — target actual query keys used in use-agents.ts
      if (['order_in_progress', 'order_delivered', 'order_completed', 'order_failed'].includes(ev.event)) {
        qc.invalidateQueries({ queryKey: ['marketplace-orders-my', ev.agentId] });
        qc.invalidateQueries({ queryKey: ['marketplace-orders-incoming', ev.agentId] });
      }
      if (['post_created', 'like_received', 'comment_received'].includes(ev.event)) {
        qc.invalidateQueries({ queryKey: ['feed'] });
      }
      // Always refresh agent list so status / activity updates propagate
      qc.invalidateQueries({ queryKey: ['agents'] });

      // Show toast for notable events only
      const msg = eventToast(ev);
      if (msg) toast({ title: msg });
    }
  }, [data]);
}

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
  useGatewayEndpoints();
  return (
    <div style={{ position: 'fixed', top, left: 0, right: 0, height: h, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {view === 'home' && <HomeView />}
        {view === 'overview' && <OverviewView />}
        {view === 'feed' && <FeedView />}
        {view === 'activity-global' && <GlobalActivityView />}
        {view === 'marketplace' && <MarketplaceView />}
        {view === 'settings' && <SettingsView />}
      </div>
      <AppNav />
    </div>
  );
}

function ViewManager() {
  useAutoConnect();
  useRestoreSession();
  useEventNotifications();

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
    case 'activity':       return <ActivityView />;
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
