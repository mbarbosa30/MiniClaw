// Always use relative URLs — the Replit shared proxy routes /api/* to the
// api-server in both dev and production. The api-server proxies /api/selfclaw/*
// to selfclaw.ai server-side, avoiding any browser CORS restrictions.
export const BASE_URL = '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const PLATFORM_KEY = import.meta.env.VITE_SELFCLAW_KEY as string | undefined;

// Plain emitter — avoids `new EventTarget()` which is not constructable in
// older Android WebViews (MiniPay). Keeps the same addEventListener /
// removeEventListener / dispatchEvent surface so no other file needs changing.
type _Listener = (event: { type: string; detail?: Record<string, unknown> }) => void;
const _emitterMap = new Map<string, Set<_Listener>>();
export const apiEvents = {
  addEventListener(type: string, fn: unknown): void {
    if (typeof fn !== 'function') return;
    if (!_emitterMap.has(type)) _emitterMap.set(type, new Set());
    _emitterMap.get(type)!.add(fn as _Listener);
  },
  removeEventListener(type: string, fn: unknown): void {
    if (typeof fn === 'function') _emitterMap.get(type)?.delete(fn as _Listener);
  },
  dispatchEvent(evt: { type: string; detail?: Record<string, unknown> }): void {
    _emitterMap.get(evt.type)?.forEach(fn => fn(evt));
  },
};

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
  // Normalize to lowercase, trimmed — API validates strict lowercase hex EVM address
  if (_walletAddress) headers.set('X-Wallet-Address', _walletAddress.trim().toLowerCase());
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
  apiEvents.dispatchEvent({ type: 'unauthorized', detail: { message } });
}

// When the gateway returns 503 with { code: "SERVICE_UNAVAILABLE", retryAfterMs: N },
// wait N ms then retry the fetch exactly once. Any other status is returned as-is.
async function withRetryAfter(fn: () => Promise<Response>): Promise<Response> {
  const response = await fn();
  if (response.status !== 503) return response;

  let retryAfterMs: number | null = null;
  try {
    const data = await response.clone().json();
    const ms = data.retryAfterMs;
    if (typeof ms === 'number' && Number.isFinite(ms) && ms >= 0) {
      retryAfterMs = ms;
    }
  } catch {
    // Not JSON or missing retryAfterMs — fall through and surface the 503 normally
  }

  if (retryAfterMs == null) return response;

  await new Promise<void>(resolve => setTimeout(resolve, retryAfterMs!));
  return fn();
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = buildHeaders(options?.headers, options?.body);
  const response = await withRetryAfter(() => fetch(`${BASE_URL}${path}`, { ...options, headers }));

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
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}

export async function apiFetchWithHeaders<T>(path: string, options?: RequestInit): Promise<{ data: T; headers: Headers; status: number }> {
  const headers = buildHeaders(options?.headers, options?.body);
  const response = await withRetryAfter(() => fetch(`${BASE_URL}${path}`, { ...options, headers }));

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
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) return { data: {} as T, headers: response.headers, status: 204 };

  const data = await response.json();
  return { data, headers: response.headers, status: response.status };
}

export async function apiFetchStream(path: string, options?: RequestInit): Promise<Response> {
  const headers = buildHeaders(options?.headers, options?.body);
  headers.set('Accept', 'text/event-stream');
  const response = await withRetryAfter(() => fetch(`${BASE_URL}${path}`, { ...options, headers }));

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
    throw new ApiError(errorMessage, response.status);
  }

  return response;
}
