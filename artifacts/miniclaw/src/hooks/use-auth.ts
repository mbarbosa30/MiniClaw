import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiEvents } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';
import { useEffect } from 'react';

// Connect MiniPay Provider Interface
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useAuthSync() {
  const { setAuth, logout } = useAuthStore();
  const resetRoute = useRouter((s) => s.reset);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handleUnauthorized);
    return () => apiEvents.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout, resetRoute]);

  // Initial status check
  useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ loggedIn: boolean, user?: { address: string } }>('/api/auth/status');
        if (res.loggedIn && res.user?.address) {
          setAuth(res.user.address);
          resetRoute('home');
        } else {
          setAuth(null);
          resetRoute('connect');
        }
        return res;
      } catch (e) {
        setAuth(null);
        resetRoute('connect');
        throw e;
      }
    },
    retry: false
  });
}

export function useConnectWallet() {
  const { setAuth } = useAuthStore();
  const resetRoute = useRouter((s) => s.reset);

  return useMutation({
    mutationFn: async () => {
      // 1. Detect MiniPay or fallback
      let address = '';
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        address = accounts[0];
      } else {
        // Fallback for demo outside MiniPay
        address = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
        console.warn("MiniPay not detected. Using dummy address for demo:", address);
      }

      // 2. Get token
      const { token } = await apiFetch<{ token: string }>('/api/auth/self/wallet/minipay-token', { method: 'POST' });

      // 3. Connect/Login
      await apiFetch('/api/auth/self/wallet/minipay-connect', {
        method: 'POST',
        body: JSON.stringify({ address, token })
      });

      return address;
    },
    onSuccess: (address) => {
      setAuth(address);
      resetRoute('home');
    }
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const resetRoute = useRouter((s) => s.reset);

  return useMutation({
    mutationFn: async () => {
      await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    },
    onSettled: () => {
      logout();
      resetRoute('connect');
    }
  });
}
