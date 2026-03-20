import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Wallet } from 'lucide-react';
import { useMiniPayAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/lib/store';
import { formatAddress } from '@/lib/utils';
import { Button } from '@/components/ui';

export function ConnectView() {
  const { address: wagmiAddress } = useAccount();
  const storeAddress = useAuthStore(s => s.address);
  const displayAddress = wagmiAddress || storeAddress;

  const auth = useMiniPayAuth();

  const isSignRejected =
    auth.isError &&
    auth.error instanceof Error &&
    (auth.error.message.toLowerCase().includes('rejected') ||
      auth.error.message.toLowerCase().includes('denied') ||
      auth.error.message.toLowerCase().includes('cancelled'));

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 bg-background">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.80, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
        className="w-20 h-20 bg-white rounded-[1.5rem] border border-neutral-150 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center mb-6 select-none"
      >
        <span className="text-4xl">🦀</span>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.10, duration: 0.45 }}
        className="w-full max-w-xs"
      >
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold text-foreground mb-2 tracking-tight">MiniClaw</h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Your personal AI agents, right in your wallet.
          </p>
        </div>

        {/* Wallet address badge */}
        {displayAddress && (
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[13px] text-muted-foreground font-medium">
              {formatAddress(displayAddress)}
            </span>
          </div>
        )}

        {/* Connect card */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 space-y-4">

          {/* Error state */}
          {auth.isError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 bg-destructive/8 border border-destructive/15 rounded-lg px-3 py-2.5"
            >
              <AlertCircle size={13} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive leading-relaxed">
                {isSignRejected
                  ? 'Signature cancelled. Tap Connect to try again.'
                  : auth.error instanceof Error
                    ? auth.error.message
                    : 'Connection failed. Please try again.'}
              </p>
            </motion.div>
          )}

          <Button
            className="w-full flex gap-2"
            onClick={() => auth.mutate()}
            disabled={auth.isPending}
          >
            {auth.isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Connecting…</>
            ) : (
              <><Wallet size={15} /> Connect with MiniPay</>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            Sign a message to verify your wallet.
            <br />No gas fees required.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
