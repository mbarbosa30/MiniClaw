// In dev the Vite server proxies /api → https://selfclaw.ai (avoids CORS).
// In production the app calls selfclaw.ai directly from the browser.
export const BASE_URL = import.meta.env.DEV ? '' : 'https://selfclaw.ai';

const PLATFORM_KEY = import.meta.env.VITE_SELFCLAW_KEY as string | undefined;

export const apiEvents = new EventTarget();

let _walletAddress: string | null = null;
export function setWalletAddress(addr: string | null) {
  _walletAddress = addr;
}

function buildHeaders(extra?: HeadersInit, body?: BodyInit | null): Headers {
  const headers = new Headers(extra);
  if (!headers.has('Content-Type') && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (PLATFORM_KEY) headers.set('Authorization', `Bearer ${PLATFORM_KEY}`);
  if (_walletAddress) headers.set('X-Wallet-Address', _walletAddress);
  return headers;
}

/**
 * Raw fetch for SSE streaming — includes auth headers, returns raw Response.
 */
export async function apiFetchStream(path: string, options?: RequestInit): Promise<Response> {
  const headers = buildHeaders(options?.headers, options?.body);
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    apiEvents.dispatchEvent(new Event('unauthorized'));
    throw new Error('Unauthorized');
  }
  return response;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = buildHeaders(options?.headers, options?.body);
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    apiEvents.dispatchEvent(new Event('unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.message || data.error || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}
