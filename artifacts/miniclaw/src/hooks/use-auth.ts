import { useEffect } from 'react';
import { useConnect, useConnectors, useDisconnect, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, apiEvents, setWalletAddress } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 * As soon as the wallet address is available, navigate straight to home.
 * No signing required — platform key + wallet address is sufficient.
 */
export function useAutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { address } = useAccount();
  const { setAuthenticated, setAddress } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  useEffect(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connectors, connect]);

  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      setAuthenticated(address);
      resetRoute('home');
    }
  }, [address, setAuthenticated, setAddress, resetRoute]);
}

/**
 * Installs the global 401 listener — if the API rejects the platform key,
 * send the user back to the connect/loading screen.
 */
export function useRestoreSession() {
  const { logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  useEffect(() => {
    const handle = () => {
      setWalletAddress(null);
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handle);
    return () => apiEvents.removeEventListener('unauthorized', handle);
  }, [logout, resetRoute]);
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
      setWalletAddress(null);
      disconnect();
      logout();
      resetRoute('connect');
    },
  });
}
