'use client';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.method && !['GET', 'HEAD'].includes(options.method)) {
    const csrf = await fetch('/api/auth/csrf', { cache: 'no-store', credentials: 'same-origin' });
    if (!csrf.ok) throw new Error('Unable to start a secure form session. Please reload.');
    const { token } = await csrf.json();
    headers.set('x-csrf-token', token);
  }
  if (options.body && !(options.body instanceof FormData)) headers.set('content-type', 'application/json');
  const response = await fetch(path, { ...options, headers, cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // A full reload discards private client state after session revocation.
    if (response.status === 401 && (path.startsWith('/api/admin/') || path.startsWith('/api/faculty/'))) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/login');
    }
    const fields =
      error.fields && typeof error.fields === 'object'
        ? Object.entries(error.fields)
            .map(([name, messages]) => `${name}: ${Array.isArray(messages) ? messages.join(' ') : ''}`)
            .join(' ')
        : '';
    throw new Error(fields || error.error || error.message || 'The request could not be completed.');
  }
  return response;
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  return (await apiFetch(path, options)).json();
}
