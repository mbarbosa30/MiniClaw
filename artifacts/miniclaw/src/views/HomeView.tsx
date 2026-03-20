import { useAgents } from '@/hooks/use-agents';
import { useAuthStore, useRouter } from '@/lib/store';
import { Button } from '@/components/ui';
import { formatAddress } from '@/lib/utils';
import { LogOut, Plus, ChevronRight, Bot } from 'lucide-react';
import { useLogout } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

export function HomeView() {
  const { data: agents, isLoading, isError, refetch } = useAgents();
  const address = useAuthStore(s => s.address);
  const push = useRouter(s => s.push);
  const logout = useLogout();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5 bg-background border-b border-neutral-100">
        <div>
          <h1 className="font-bold text-[22px] tracking-tight text-foreground">MiniClaw</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[13px] text-muted-foreground font-medium tracking-tight">
              {formatAddress(address || '')}
            </span>
          </div>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100 transition-colors"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 no-scrollbar pb-28">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[72px] bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-center mt-8 gap-3">
            <div className="w-14 h-14 bg-destructive/8 rounded-full flex items-center justify-center text-xl">⚠️</div>
            <h3 className="font-semibold text-[15px]">Couldn't load agents</h3>
            <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-1">Retry</Button>
          </div>
        ) : agents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center mt-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Bot size={28} className="text-neutral-400" />
            </div>
            <h3 className="font-semibold text-[16px] mb-1.5">No agents yet</h3>
            <p className="text-sm text-muted-foreground">Create your first AI agent to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents?.map((agent, i) => (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="w-full flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-neutral-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] active:scale-[0.985] transition-transform text-left"
                onClick={() => push('agent-detail', { id: agent.id })}
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {agent.emoji || '🤖'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] tracking-tight truncate">{agent.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span className="text-xs text-muted-foreground capitalize">{agent.status || 'Active'}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-300 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none">
        <Button
          size="lg"
          className="w-full flex gap-2 pointer-events-auto shadow-[0_4px_16px_rgba(79,70,229,0.25)]"
          onClick={() => push('create')}
        >
          <Plus size={18} />
          Create New Agent
        </Button>
      </div>
    </div>
  );
}
