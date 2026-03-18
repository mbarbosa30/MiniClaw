import { useState, useEffect } from 'react';
import { useConnect, useConnectors, useAccount, useDisconnect } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiEvents } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';
import type { AuthStatus } from '@/types';

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 * Per MiniPay docs: never show a "Connect" button — connect automatically.
 */
export function useAutoConnect() {
  const connectors = useConnectors();
  const { connect, isPending, error } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (hasAttempted || connectors.length === 0) return;
    setHasAttempted(true);
    connect({ connector: connectors[0] });
  }, [connectors, connect, hasAttempted]);

  return { isPending, error, hasAttempted };
}

/**
 * After Wagmi gives us a wallet address, exchange it for a
 * SelfClaw server-side session (establishes cookie auth).
 */
export function useEstablishSession() {
  const { setAuth } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  return useMutation({
    mutationFn: async (address: string) => {
      const { token } = await apiFetch<{ token: string }>(
        '/api/auth/self/wallet/minipay-token',
        { method: 'POST' }
      );
      await apiFetch<void>('/api/auth/self/wallet/minipay-connect', {
        method: 'POST',
        body: JSON.stringify({ address, token }),
      });
      return address;
    },
    onSuccess: (address: string) => {
      setAuth(address);
      resetRoute('home');
    },
  });
}

/**
 * On mount, check whether an existing SelfClaw session is still valid.
 * If yes → go straight to home. If no → stay on 'connecting' screen
 * so the Wagmi auto-connect + session flow can run.
 */
export function useAuthSync() {
  const { setAuth, logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  // Redirect on 401 from any API call
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handleUnauthorized);
    return () => apiEvents.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout, resetRoute]);

  // Check for an existing session on mount
  useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => {
      const res = await apiFetch<AuthStatus>('/api/auth/status');
      if (res.loggedIn && res.user?.address) {
        setAuth(res.user.address);
        resetRoute('home');
      }
      return res;
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
      await apiFetch<void>('/api/auth/logout', { method: 'POST' }).catch(() => {});
    },
    onSettled: () => {
      disconnect();
      logout();
      resetRoute('connect');
    },
  });
}
