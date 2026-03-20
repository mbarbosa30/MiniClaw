import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

const TIMEOUT_MS = 8000;

/**
 * Splash screen shown while MiniPay auto-connects the wallet.
 * In normal MiniPay usage this completes in under a second.
 * If auto-connect takes too long, shows a retry prompt.
 */
export function ConnectView() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background relative overflow-hidden">
      {/* Ambient orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 38%, hsla(243,75%,59%,0.10) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.80, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
        className="w-20 h-20 bg-white rounded-[1.5rem] border border-neutral-200 flex items-center justify-center select-none mb-6"
      >
        <span className="text-4xl">🦀</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex flex-col items-center gap-2.5 text-center px-8"
      >
        {!timedOut ? (
          <>
            <Loader2 size={18} className="animate-spin text-primary/60" />
            <p className="text-[13px] text-muted-foreground">Connecting wallet…</p>
          </>
        ) : (
          <>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Couldn't connect to your wallet.
              <br />Open this app inside MiniPay and try again.
            </p>
            <button
              className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
