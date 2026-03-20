import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Splash screen shown briefly while MiniPay auto-connects the wallet.
 * In normal MiniPay usage this is visible for only a fraction of a second.
 */
export function ConnectView() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background gap-6">
      <motion.div
        initial={{ scale: 0.80, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
        className="w-20 h-20 bg-white rounded-[1.5rem] border border-neutral-150 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center select-none"
      >
        <span className="text-4xl">🦀</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <Loader2 size={20} className="animate-spin text-primary" />
        <p className="text-[13px] text-muted-foreground">Connecting wallet…</p>
      </motion.div>
    </div>
  );
}
