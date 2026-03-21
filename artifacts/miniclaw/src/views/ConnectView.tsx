import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore, useRouter } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const TIMEOUT_MS = import.meta.env.DEV ? 0 : 8000;

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

const DEV_WALLET = '0xDEADBEEF00000000000000000000000000000001';

export function ConnectView() {
  const t = useTheme();
  const [timedOut, setTimedOut] = useState(import.meta.env.DEV);
  const authError = useAuthStore(s => s.authError);
  const setAuthenticated = useAuthStore(s => s.setAuthenticated);
  const resetRoute = useRouter(s => s.reset);

  const handleDevBypass = () => {
    setAuthenticated(DEV_WALLET);
    resetRoute('home');
  };

  useEffect(() => {
    if (authError) return;
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [authError]);

  const resolved = authError ? resolveAuthErrorMessage(authError) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: t.bg,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 38%, hsla(243,75%,59%,0.08) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ scale: 0.80, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
        style={{
          width: 72,
          height: 72,
          background: t.surface,
          borderRadius: 22,
          border: `1px solid ${t.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          userSelect: 'none',
        }}
      >
        <Bot size={32} color={t.text} strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        {resolved ? (
          <>
            <p style={{ fontSize: 12, color: t.label, lineHeight: 1.7, whiteSpace: 'pre-line', fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.01em' }}>
              {resolved.text}
            </p>
            {resolved.canRetry && (
              <button
                style={{
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: t.text,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={12} />
                retry
              </button>
            )}
            {import.meta.env.DEV && (
              <button
                style={{
                  marginTop: 12,
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: t.bg,
                  background: t.text,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
                onClick={handleDevBypass}
              >
                dev preview
              </button>
            )}
          </>
        ) : !timedOut ? (
          <>
            <Loader2 size={18} color={t.faint} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 12, color: t.label, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.02em' }}>connecting wallet…</p>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{ marginTop: 20, textAlign: 'center' }}
            >
              <p style={{ fontSize: 17, fontWeight: 300, letterSpacing: '-0.025em', color: t.text, lineHeight: 1.35, marginBottom: 6 }}>
                Your AI team,<br />right here in MiniPay.
              </p>
              <p style={{ fontSize: 12, color: t.faint, letterSpacing: '-0.01em' }}>
                Pick an agent. Start earning.
              </p>
            </motion.div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, color: t.label, lineHeight: 1.7, fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.01em' }}>
              couldn't connect to wallet.
              <br />open inside minipay and try again.
            </p>
            <button
              style={{
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: t.text,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'ui-monospace, Menlo, monospace',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={12} />
              retry
            </button>
            {import.meta.env.DEV && (
              <button
                style={{
                  marginTop: 12,
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: t.bg,
                  background: t.text,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
                onClick={handleDevBypass}
              >
                dev preview
              </button>
            )}
          </>
        )}
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
