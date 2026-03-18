import { useConnection, useConnect } from 'wagmi';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * ConnectView — shown while auto-connecting to the MiniPay wallet.
 *
 * Per MiniPay docs, there is NO connect button. Wagmi auto-connects
 * on mount (via useAutoConnect in ViewManager). This screen simply shows
 * progress and handles the "not in MiniPay" case.
 */
export function ConnectView() {
  // useConnection is wagmi v3's hook for reading connection state
  const { address, isConnected, isConnecting } = useConnection();
  const { error: connectError } = useConnect();

  // "Provider not found" = window.ethereum absent = not inside MiniPay
  const isNoProvider =
    !!connectError &&
    connectError.message?.toLowerCase().includes('provider not found');

  const showSpinner = !isNoProvider && (isConnecting || (!isConnected && !connectError));
  const showError = !!connectError && !isNoProvider;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-background via-background to-secondary/20 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

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

        {/* Not in MiniPay */}
        {isNoProvider && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-5 text-left"
          >
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-0.5">Open in MiniPay</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                MiniClaw runs inside MiniPay. Open this app from your MiniPay wallet to continue.
              </p>
            </div>
          </motion.div>
        )}

        {/* Connection error (not a missing provider) */}
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-5 text-left"
          >
            <p className="text-xs text-destructive leading-relaxed">
              {connectError instanceof Error
                ? connectError.message
                : 'Connection failed. Unlock MiniPay and reload.'}
            </p>
          </motion.div>
        )}

        {/* Connecting spinner */}
        {showSpinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              {address ? 'Setting up…' : 'Connecting to wallet…'}
            </p>
          </motion.div>
        )}

        {isNoProvider && (
          <p className="text-xs text-muted-foreground mt-6">
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
