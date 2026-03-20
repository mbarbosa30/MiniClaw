import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const TIMEOUT_MS = 8000;

/**
 * Maps a raw selfclaw 401 error message to a user-friendly string.
 * Returns null for unrecognised messages so the caller can use a default.
 */
function resolveAuthErrorMessage(raw: string): { text: string; canRetry: boolean } {
  if (
    raw === 'X-Wallet-Address header is required' ||
    raw === 'X-Wallet-Address is not a valid EVM address'
  ) {
    return {
      text: "MiniPay didn't provide a valid wallet address.\nTry restarting MiniPay.",
      canRetry: true,
    };
  }
  if (raw === 'Invalid or revoked platform API key') {
    return {
      text: 'Service configuration error.\nPlease contact support.',
      canRetry: false,
    };
  }
  return {
    text: 'Authentication failed.\nOpen this app inside MiniPay.',
    canRetry: true,
  };
}

/**
 * Splash screen shown while MiniPay auto-connects the wallet.
 * In normal MiniPay usage this completes in under a second.
 * If a 401 comes back, shows a specific message based on the error code.
 * If auto-connect simply takes too long, shows a generic retry prompt.
 */
export function ConnectView() {
  const [timedOut, setTimedOut] = useState(false);
  const authError = useAuthStore(s => s.authError);

  useEffect(() => {
    if (authError) return; // don't start timeout if we already have a hard error
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [authError]);

  const resolved = authError ? resolveAuthErrorMessage(authError) : null;

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
        {resolved ? (
          <>
            <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">
              {resolved.text}
            </p>
            {resolved.canRetry && (
              <button
                className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={13} />
                Retry
              </button>
            )}
          </>
        ) : !timedOut ? (
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
