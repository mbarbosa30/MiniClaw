// The external API base URL
export const BASE_URL = 'https://selfclaw.ai';

// Event target to trigger global auth state changes
export const apiEvents = new EventTarget();

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // CRITICAL for cookie-based auth
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

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
