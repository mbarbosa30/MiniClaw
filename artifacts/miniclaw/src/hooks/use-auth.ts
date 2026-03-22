import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, apiEvents, setWalletAddress } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';

type EthProvider = {
  selectedAddress?: string | null;
  request?: (args: { method: string }) => Promise<string[]>;
};

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 * Reads the wallet address directly from window.ethereum — no wagmi needed.
 * wagmi was removed because it uses new EventTarget() internally, which
 * crashes in MiniPay's older Android WebView with "The object does not
 * support the operation or argument."
 *
 * MiniPay injects window.ethereum ASYNCHRONOUSLY after the page loads, so
 * we handle two cases:
 *   (a) Provider already present on mount → read it immediately.
 *   (b) Provider injected later → listen for 'ethereum#initialized' event.
 */
export function useAutoConnect() {
  const { setAuthenticated } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  useEffect(() => {
    let done = false;

    const applyAddress = (addr: string) => {
      if (done) return;
      done = true;
      setWalletAddress(addr);
      setAuthenticated(addr);
      resetRoute('home');
    };

    async function tryEthereum() {
      const eth = (window as { ethereum?: EthProvider }).ethereum;
      if (!eth) return;

      // selectedAddress is set synchronously by some wallets on inject
      if (eth.selectedAddress) {
        applyAddress(eth.selectedAddress);
        return;
      }

      // eth_requestAccounts is auto-approved in MiniPay (user already authenticated)
      try {
        const accounts = await eth.request?.({ method: 'eth_requestAccounts' });
        if (accounts?.[0]) applyAddress(accounts[0]);
      } catch {
        // wallet declined or unavailable — show timeout screen
      }
    }

    // Case (a): provider already present
    tryEthereum();

    // Case (b): MiniPay dispatches this event when the provider becomes ready
    window.addEventListener('ethereum#initialized', tryEthereum, { once: true });

    return () => {
      done = true;
      window.removeEventListener('ethereum#initialized', tryEthereum);
    };
  }, [setAuthenticated, resetRoute]);
}

/**
 * Installs the global 401 listener. Reads the specific error message from
 * the platform and stores it so ConnectView can display a meaningful reason.
 */
export function useRestoreSession() {
  const { logout, setAuthError } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  useEffect(() => {
    const handle = (event: Event) => {
      const message = (event as CustomEvent<{ message?: string }>).detail?.message;
      setWalletAddress(null);
      setAuthError(message ?? null);
      logout();
      resetRoute('connect');
    };
    apiEvents.addEventListener('unauthorized', handle);
    return () => apiEvents.removeEventListener('unauthorized', handle);
  }, [logout, setAuthError, resetRoute]);
}

export function useLogout() {
  const { logout } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  return useMutation({
    mutationFn: async () => {
      await apiFetch<void>('/api/auth/self/logout', { method: 'POST' }).catch(() => {});
    },
    onSettled: () => {
      setWalletAddress(null);
      logout();
      resetRoute('connect');
    },
  });
}
