import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAutoConnect, useEstablishSession } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * ConnectView — shown while the app establishes a wallet session.
 *
 * Per MiniPay docs, connection is AUTOMATIC on page load.
 * There is no "Connect" button. The flow is:
 *   1. Wagmi auto-connects to the injected MiniPay wallet
 *   2. Once we have an address, exchange it for a SelfClaw cookie session
 *   3. On success the auth store routes us to 'home'
 *
 * If window.ethereum is missing the user is not in MiniPay — show a message.
 */
export function ConnectView() {
  const { address, isConnected, isConnecting } = useAccount();
  const { error: wagmiError, hasAttempted } = useAutoConnect();
  const session = useEstablishSession();

  // "Provider not found" means window.ethereum is absent — user is outside MiniPay
  const isNoProvider =
    !!wagmiError &&
    (wagmiError.message?.toLowerCase().includes('provider not found') ||
      wagmiError.message?.toLowerCase().includes('no provider') ||
      wagmiError.message?.toLowerCase().includes('window.ethereum'));
  const noProvider = isNoProvider || (hasAttempted && !isConnecting && !isConnected && !address && !wagmiError);
  const walletError = wagmiError && !isNoProvider ? wagmiError : null;
  const sessionError = session.isError;

  // Once Wagmi gives us an address, establish the SelfClaw session
  useEffect(() => {
    if (address && isConnected && !session.isPending && !session.isSuccess && !session.isError) {
      session.mutate(address);
    }
  }, [address, isConnected]);

  // Derive status message
  let statusLine = 'Connecting to your wallet…';
  if (address && isConnected && (session.isPending || session.isIdle)) {
    statusLine = 'Setting up your session…';
  }

  const hasError = !!walletError || !!sessionError || noProvider;

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

        {/* Not in MiniPay */}
        {noProvider && (
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

        {/* Wallet error */}
        {walletError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-5 text-left"
          >
            <p className="text-xs text-destructive leading-relaxed">
              Wallet error:{' '}
              {walletError instanceof Error ? walletError.message : 'Connection failed. Unlock MiniPay and try again.'}
            </p>
          </motion.div>
        )}

        {/* Session error */}
        {sessionError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-5 text-left"
          >
            <p className="text-xs text-destructive leading-relaxed">
              {session.error instanceof Error
                ? session.error.message
                : 'Failed to establish session. Please reload the page.'}
            </p>
          </motion.div>
        )}

        {/* Loading spinner — shown while connecting */}
        {!hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{statusLine}</p>
          </motion.div>
        )}

        {/* Not in MiniPay — link */}
        {noProvider && (
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
