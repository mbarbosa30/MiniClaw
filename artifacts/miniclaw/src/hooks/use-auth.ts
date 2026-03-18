import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiEvents } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';
import { useEffect } from 'react';
import type { AuthStatus } from '@/types';

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean;
      isMinipay?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
    };
  }
}

/**
 * Detect whether the app is running inside a MiniPay-compatible wallet browser.
 * Checks window.ethereum flags and user-agent string.
 */
export function detectMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.ethereum?.isMiniPay || window.ethereum?.isMinipay) return true;
  if (typeof navigator !== 'undefined' && /MiniPay/i.test(navigator.userAgent)) return true;
  return false;
}

export function useAuthSync() {
  const { setAuth, logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  // Listen for 401s from any API call and redirect to connect
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
    queryKey: ['auth-status'],
    queryFn: async () => {
      const res = await apiFetch<AuthStatus>('/api/auth/status');
      if (res.loggedIn && res.user?.address) {
        setAuth(res.user.address);
        resetRoute('home');
      } else {
        setAuth(null);
        resetRoute('connect');
      }
      return res;
    },
    retry: false,
    // Don't re-run on focus/reconnect — only on mount
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useConnectWallet() {
  const { setAuth } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  return useMutation({
    mutationFn: async () => {
      // Strictly require a MiniPay-compatible provider
      if (!window.ethereum) {
        throw new Error('No wallet provider found. Please open this app inside MiniPay.');
      }

      // Request accounts from the injected wallet (MiniPay)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet. Please unlock your wallet and try again.');
      }
      const address = accounts[0];

      // Get one-time token from SelfClaw
      const { token } = await apiFetch<{ token: string }>(
        '/api/auth/self/wallet/minipay-token',
        { method: 'POST' }
      );

      // Connect with address + token → establishes session cookie
      await apiFetch<void>('/api/auth/self/wallet/minipay-connect', {
        method: 'POST',
        body: JSON.stringify({ address, token })
      });

      return address;
    },
    onSuccess: (address: string) => {
      setAuth(address);
      resetRoute('home');
    }
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  return useMutation({
    mutationFn: async () => {
      // Best-effort server-side logout
      await apiFetch<void>('/api/auth/logout', { method: 'POST' }).catch(() => {});
    },
    onSettled: () => {
      logout();
      resetRoute('connect');
    }
  });
}
