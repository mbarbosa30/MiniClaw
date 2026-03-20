export const BASE_URL = 'https://selfclaw.ai';

// Platform key — set as VITE_SELFCLAW_KEY env var (identifies MiniClaw app to SelfClaw)
const PLATFORM_KEY = import.meta.env.VITE_SELFCLAW_KEY as string | undefined;

export const apiEvents = new EventTarget();

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers = new Headers(options?.headers);

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (PLATFORM_KEY) {
    headers.set('Authorization', `Bearer ${PLATFORM_KEY}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // required for cookie-based sessions
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
