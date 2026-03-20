// Always use relative URLs — the Replit shared proxy routes /api/* to the
// api-server in both dev and production. The api-server proxies /api/selfclaw/*
// to selfclaw.ai server-side, avoiding any browser CORS restrictions.
export const BASE_URL = '';

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

async function dispatchUnauthorized(response: Response): Promise<void> {
  let message: string | undefined;
  try {
    const cloned = response.clone();
    const data = await cloned.json();
    message = data.error || data.message;
  } catch {
    // fall through — message stays undefined
  }
  apiEvents.dispatchEvent(
    new CustomEvent('unauthorized', { detail: { message } }),
  );
}

/**
 * Raw fetch for SSE streaming — includes auth headers, returns raw Response.
 */
export async function apiFetchStream(path: string, options?: RequestInit): Promise<Response> {
  const headers = buildHeaders(options?.headers, options?.body);
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    await dispatchUnauthorized(response);
    throw new Error('Unauthorized');
  }
  return response;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = buildHeaders(options?.headers, options?.body);
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    await dispatchUnauthorized(response);
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
