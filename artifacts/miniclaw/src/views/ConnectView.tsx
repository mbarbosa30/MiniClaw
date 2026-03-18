import { useConnectWallet, detectMiniPay } from '@/hooks/use-auth';
import { Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle } from 'lucide-react';

export function ConnectView() {
  const connect = useConnectWallet();
  const isMiniPay = detectMiniPay();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-background via-background to-secondary/20 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
        className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 relative select-none"
      >
        <span className="text-5xl">🦀</span>
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md">
          <Sparkles size={14} />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.5 }}
        className="text-center z-10 w-full max-w-xs"
      >
        <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">MiniClaw</h1>
        <p className="text-base text-muted-foreground mb-10 leading-relaxed">
          Your personal AI agents, living right in your wallet.
        </p>

        {/* Non-MiniPay warning */}
        {!isMiniPay && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-5 text-left"
          >
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              MiniClaw is designed to run inside MiniPay. Open this app from your MiniPay wallet to connect.
            </p>
          </motion.div>
        )}

        {/* Error message */}
        {connect.isError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-5 text-left"
          >
            <p className="text-xs text-destructive leading-relaxed">
              {connect.error instanceof Error ? connect.error.message : 'Connection failed. Please try again.'}
            </p>
          </motion.div>
        )}

        <Button
          size="lg"
          className="w-full flex gap-3 text-base"
          onClick={() => connect.mutate()}
          disabled={connect.isPending || !isMiniPay}
        >
          {connect.isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-9-1a2 2 0 0 1 4 0v1h-4V6Zm10 13H4V9h16v10Z"/>
            </svg>
          )}
          {connect.isPending ? 'Connecting...' : 'Connect with MiniPay'}
        </Button>

        {!isMiniPay && (
          <p className="text-xs text-muted-foreground mt-4">
            Need MiniPay? Download it from{' '}
            <a
              href="https://minipay.opera.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              minipay.opera.com
            </a>
          </p>
        )}
      </motion.div>
    </div>
  );
}
