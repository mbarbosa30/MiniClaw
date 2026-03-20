import { useConnection, useConnect } from 'wagmi';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const SESSION_MESSAGES: Record<string, string> = {
  signing: 'Sign the request in your wallet…',
  verifying: 'Verifying your signature…',
  error: 'Signature failed. Tap to retry.',
};

export function ConnectView() {
  const { address, isConnected, isConnecting } = useConnection();
  const { error: connectError } = useConnect();
  const { sessionStatus, setSessionStatus } = useAuthStore();

  const isNoProvider =
    !!connectError &&
    connectError.message?.toLowerCase().includes('provider not found');

  const showSpinner =
    !isNoProvider &&
    sessionStatus !== 'error' &&
    (isConnecting || (!isConnected && !connectError) || isConnected);

  const showConnectError = !!connectError && !isNoProvider;

  const handleRetry = () => {
    setSessionStatus('idle');
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 bg-background">
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.80, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
        className="w-20 h-20 bg-white rounded-[1.5rem] border border-neutral-150 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center mb-7 select-none"
      >
        <span className="text-4xl">🦀</span>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.10, duration: 0.45 }}
        className="text-center w-full max-w-xs"
      >
        <h1 className="text-[32px] font-bold text-foreground mb-2 tracking-tight">MiniClaw</h1>
        <p className="text-[15px] text-muted-foreground mb-10 leading-relaxed">
          Your personal AI agents, right in your wallet.
        </p>

        {/* Not in MiniPay */}
        {isNoProvider && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 text-left"
          >
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-0.5">Open in MiniPay</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                MiniClaw runs inside MiniPay. Open this app from your MiniPay wallet to continue.
              </p>
            </div>
          </motion.div>
        )}

        {/* Connection error */}
        {showConnectError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/8 border border-destructive/15 rounded-xl p-3.5 mb-5 text-left"
          >
            <p className="text-xs text-destructive leading-relaxed">
              {connectError instanceof Error
                ? connectError.message
                : 'Connection failed. Unlock MiniPay and reload.'}
            </p>
          </motion.div>
        )}

        {/* Session signing error */}
        {sessionStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 mb-5"
          >
            <div className="bg-destructive/8 border border-destructive/15 rounded-xl p-3.5 w-full text-left">
              <p className="text-xs text-destructive leading-relaxed">
                Could not sign in. The wallet request may have been rejected or timed out.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold border border-primary/80 active:scale-95 transition-all"
            >
              <RotateCcw size={14} />
              Try Again
            </button>
          </motion.div>
        )}

        {/* Spinner */}
        {showSpinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-2.5"
          >
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              {SESSION_MESSAGES[sessionStatus] ??
                (address ? 'Setting up your account…' : 'Connecting to wallet…')}
            </p>
          </motion.div>
        )}

        {isNoProvider && (
          <p className="text-xs text-muted-foreground mt-8">
            Need MiniPay?{' '}
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
