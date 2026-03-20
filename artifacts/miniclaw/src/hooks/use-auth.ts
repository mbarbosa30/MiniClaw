import { useEffect } from 'react';
import { useConnect, useConnectors, useDisconnect, useAccount, useSignMessage } from 'wagmi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiEvents } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';
import type { AuthMe } from '@/types';

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 */
export function useAutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { address } = useAccount();
  const setAddress = useAuthStore(s => s.setAddress);

  useEffect(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connectors, connect]);

  useEffect(() => {
    if (address) setAddress(address);
  }, [address, setAddress]);
}

/**
 * On mount, check GET /api/auth/self/me to restore an existing cookie session.
 * Also installs the global 401 listener for auto-logout.
 */
export function useRestoreSession() {
  const { setAuthenticated, logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  // Global 401 → auto-logout
  useEffect(() => {
    const handle = () => {
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handle);
    return () => apiEvents.removeEventListener('unauthorized', handle);
  }, [logout, resetRoute]);

  // Try to restore existing cookie session
  useQuery({
    queryKey: ['restore-session'],
    queryFn: async () => {
      try {
        const me = await apiFetch<AuthMe>('/api/auth/self/me');
        if (me?.walletAddress) {
          setAuthenticated(me.walletAddress);
          resetRoute('home');
        }
        return me;
      } catch {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * MiniPay wallet auth flow (Opera MiniPay):
 *   1. POST /api/auth/self/wallet/minipay-verify/challenge  → { challenge, nonce }
 *   2. signMessage(challenge) with the injected wallet
 *   3. POST /api/auth/self/wallet/minipay-verify            → session cookie set
 */
export function useMiniPayAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { setAuthenticated } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  return useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('No wallet connected');

      // Step 1: get challenge
      const { challenge, nonce } = await apiFetch<{ challenge: string; nonce: string }>(
        '/api/auth/self/wallet/minipay-verify/challenge',
        { method: 'POST' }
      );

      // Step 2: sign
      const signature = await signMessageAsync({ message: challenge });

      // Step 3: verify → sets session cookie
      const result = await apiFetch<{ success: boolean; walletAddress: string }>(
        '/api/auth/self/wallet/minipay-verify',
        {
          method: 'POST',
          body: JSON.stringify({ address, signature, nonce }),
        }
      );

      return result;
    },
    onSuccess: (result) => {
      setAuthenticated(result.walletAddress || address!);
      resetRoute('home');
    },
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
