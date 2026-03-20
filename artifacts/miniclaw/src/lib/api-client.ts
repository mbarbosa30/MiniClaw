export const BASE_URL = 'https://selfclaw.ai';

// Platform key — identifies the MiniClaw app to SelfClaw (set via VITE_SELFCLAW_KEY env var)
const PLATFORM_KEY = import.meta.env.VITE_SELFCLAW_KEY as string | undefined;

export const apiEvents = new EventTarget();

// Current wallet address — set by useAutoConnect, injected into every request
let _walletAddress: string | null = null;
export function setWalletAddress(addr: string | null) {
  _walletAddress = addr;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers = new Headers(options?.headers);

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (PLATFORM_KEY) {
    headers.set('Authorization', `Bearer ${PLATFORM_KEY}`);
  }

  if (_walletAddress) {
    headers.set('X-Wallet-Address', _walletAddress);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    apiEvents.dispatchEvent(new Event('unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
