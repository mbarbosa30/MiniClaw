import { useAgents } from '@/hooks/use-agents';
import { useAuthStore, useRouter } from '@/lib/store';
import { Button, Card } from '@/components/ui';
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
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl">MiniClaw</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-muted-foreground">{formatAddress(address || '')}</span>
          </div>
        </div>
        <button 
          onClick={() => logout.mutate()}
          className="p-3 bg-white rounded-full shadow-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-2 no-scrollbar pb-32">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-black/5 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-center mt-12 gap-3">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-2xl">⚠️</div>
            <h3 className="font-semibold text-base">Couldn't load agents</h3>
            <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="secondary" onClick={() => refetch()} className="mt-1">Retry</Button>
          </div>
        ) : agents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center mt-12">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <Bot size={40} className="text-primary/40" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground">Create your first AI agent to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents?.map((agent, i) => (
              <motion.div 
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  className="flex items-center p-4 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all active:scale-[0.98]"
                  onClick={() => push('agent-detail', { id: agent.id })}
                >
                  <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center text-2xl mr-4 shrink-0 shadow-inner">
                    {agent.emoji || '🤖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                      <span className="text-sm text-muted-foreground capitalize">{agent.status || 'Active'}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground/50 shrink-0" />
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none">
        <Button 
          size="lg" 
          className="w-full flex gap-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] pointer-events-auto"
          onClick={() => push('create')}
        >
          <Plus size={20} />
          Create New Agent
        </Button>
      </div>
    </div>
  );
}
