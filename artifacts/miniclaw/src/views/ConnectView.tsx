import { useConnectWallet } from '@/hooks/use-auth';
import { Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { Worm, Sparkles } from 'lucide-react';

export function ConnectView() {
  const connect = useConnectWallet();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-background to-secondary/30 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 relative"
      >
        <Worm size={48} className="text-accent" />
        <div className="absolute -top-2 -right-2 bg-primary text-white p-1.5 rounded-full">
          <Sparkles size={16} />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center z-10"
      >
        <h1 className="text-4xl font-display font-bold text-primary mb-3">MiniClaw</h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-[260px]">
          Your personal AI agents, living right in your wallet.
        </p>

        <Button 
          size="lg" 
          className="w-full flex gap-3 text-lg"
          onClick={() => connect.mutate()}
          disabled={connect.isPending}
        >
          {connect.isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-9-1a2 2 0 0 1 4 0v1h-4V6Zm10 13H4V9h16v10Z"/></svg>
          )}
          {connect.isPending ? 'Connecting...' : 'Connect MiniPay'}
        </Button>
      </motion.div>
    </div>
  );
}
