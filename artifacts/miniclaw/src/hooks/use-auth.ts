import { useEffect } from 'react';
import { useConnect, useConnectors, useDisconnect, useAccount } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { apiFetch, apiEvents, setWalletAddress } from '@/lib/api-client';
import { useAuthStore, useRouter } from '@/lib/store';

type EthProvider = {
  selectedAddress?: string | null;
  request?: (args: { method: string }) => Promise<string[]>;
};

/**
 * Auto-connect to the injected MiniPay wallet on page load.
 * As soon as the wallet address is available, navigate straight to home.
 * No signing required — platform key + wallet address is sufficient auth.
 *
 * Strategy (in order):
 *  1. Read window.ethereum.selectedAddress synchronously — set immediately by
 *     MiniPay when it injects the provider, no async handshake required.
 *  2. Call eth_accounts asynchronously — covers wallets that don't set
 *     selectedAddress but respond to the JSON-RPC call instantly.
 *  3. Let wagmi's injected() connector do its full handshake — fallback for
 *     browser wallets (MetaMask, etc.) where steps 1 & 2 may not be enough.
 */
export function useAutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { address } = useAccount();
  const { setAuthenticated } = useAuthStore();
  const resetRoute = useRouter(s => s.reset);

  const applyAddress = (addr: string) => {
    setWalletAddress(addr);
    setAuthenticated(addr);
    resetRoute('home');
  };

  // Strategy 1 & 2: read directly from window.ethereum — works in MiniPay
  // even when wagmi's connect() fails or takes too long.
  useEffect(() => {
    const eth = (window as { ethereum?: EthProvider }).ethereum;
    if (!eth) return;

    // selectedAddress is set synchronously by MiniPay on inject
    if (eth.selectedAddress) {
      applyAddress(eth.selectedAddress);
      return;
    }

    // eth_accounts returns immediately in MiniPay without a permission prompt
    eth.request?.({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts?.[0]) applyAddress(accounts[0]);
      })
      .catch(() => { /* silently fall through to wagmi */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Strategy 3: wagmi's full connector handshake — handles MetaMask and other
  // injected wallets where selectedAddress / eth_accounts alone isn't enough.
  useEffect(() => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [connectors, connect]);

  useEffect(() => {
    if (address) applyAddress(address);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
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
