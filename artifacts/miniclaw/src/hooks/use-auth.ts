import { useEffect } from 'react';
import { useConnect, useConnectors, useDisconnect, useConnection } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiEvents } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';
import type { AuthStatus } from '@/types';

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 * Copied verbatim from https://docs.minipay.xyz/getting-started/quick-start.html
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
 * store it in auth state and navigate home.
 * This replaces the invented SelfClaw session endpoints entirely.
 */
export function useWalletSync() {
  const { address, isConnected } = useConnection();
  const { setAuth } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      setAuth(address);
      resetRoute('home');
    }
  }, [isConnected, address, isAuthenticated, setAuth, resetRoute]);
}

/**
 * On mount, check whether an existing SelfClaw session is valid.
 * Errors (CORS, network) are caught silently — if the check fails we
 * simply stay on the connect screen and let Wagmi handle it.
 */
export function useAuthSync() {
  const { setAuth, logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handleUnauthorized);
    return () => apiEvents.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout, resetRoute]);

  useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => {
      try {
        const res = await apiFetch<AuthStatus>('/api/auth/status');
        if (res.loggedIn && res.user?.address) {
          setAuth(res.user.address);
          resetRoute('home');
        }
        return res;
      } catch {
        // Network/CORS errors are expected outside MiniPay's domain — ignore
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
      await apiFetch<void>('/api/auth/logout', { method: 'POST' }).catch(() => {});
    },
    onSettled: () => {
      disconnect();
      logout();
      resetRoute('connect');
    },
  });
}
