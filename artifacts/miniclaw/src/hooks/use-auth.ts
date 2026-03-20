import { useEffect, useRef } from 'react';
import { useConnect, useConnectors, useDisconnect, useConnection, useSignMessage } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiEvents } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';
import type { AuthMe } from '@/types';

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 * Per https://docs.minipay.xyz/getting-started/quick-start.html
 * Must be called from the root layout, not from a child view.
 */
export function useAutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();

  useEffect(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connectors, connect]);
}

/**
 * Watch Wagmi's connection state. When a wallet address is available,
 * run the SelfClaw nonce → sign → quick-connect auth flow.
 *
 * Auth flow per https://selfclaw.ai/miniclaw-api:
 * 1. POST /api/auth/self/wallet/connect-nonce → { nonce, challenge }
 * 2. Sign challenge with wagmi useSignMessage
 * 3. POST /api/auth/self/wallet/quick-connect → session cookie set
 */
export function useWalletSync() {
  const { address, isConnected } = useConnection();
  const { isAuthenticated, sessionStatus, setSessionStatus, setAuth } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);
  const { signMessageAsync } = useSignMessage();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !address || isAuthenticated) return;
    if (sessionStatus !== 'idle' || attemptedRef.current) return;

    attemptedRef.current = true;

    (async () => {
      try {
        // Step 1: Get nonce + challenge
        setSessionStatus('signing');
        const { nonce, challenge } = await apiFetch<{ nonce: string; challenge: string }>(
          '/api/auth/self/wallet/connect-nonce',
          { method: 'POST' }
        );

        // Step 2: Sign the challenge — triggers wallet popup in MiniPay
        const signature = await signMessageAsync({ message: challenge });

        // Step 3: Verify signature, create session cookie
        setSessionStatus('verifying');
        const me = await apiFetch<AuthMe>('/api/auth/self/wallet/quick-connect', {
          method: 'POST',
          body: JSON.stringify({ address, signature, nonce }),
        });

        setAuth(me.walletAddress ?? address);
        resetRoute('home');
      } catch {
        setSessionStatus('error');
        attemptedRef.current = false; // allow retry
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isAuthenticated, sessionStatus]);
}

/**
 * On mount, check whether an existing SelfClaw session cookie is still valid.
 * If yes → navigate home. If not → stay on connect screen and let WalletSync handle it.
 * Also installs a global listener for 401 events emitted by apiFetch.
 */
export function useAuthSync() {
  const { setAuth, logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  // Listen for 401s fired by apiFetch
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handleUnauthorized);
    return () => apiEvents.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout, resetRoute]);

  // Check existing session on mount
  useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        const me = await apiFetch<AuthMe>('/api/auth/self/me');
        if (me?.walletAddress) {
          setAuth(me.walletAddress);
          resetRoute('home');
        }
        return me;
      } catch {
        // 401 or network error — stay on connect screen
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);
  const { disconnect } = useDisconnect();

  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>('/api/auth/self/logout', { method: 'POST' }).catch(() => {});
    },
    onSettled: () => {
      disconnect();
      logout();
      resetRoute('connect');
    },
  });
}
