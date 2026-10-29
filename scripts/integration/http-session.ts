import assert from 'node:assert/strict';

export class BrowserSession {
  constructor(readonly origin: string) {}

  cookies = new Map<string, string>();
  acceptCookies(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0];
      const index = pair.indexOf('=');
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }
  async request(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      rawBody?: string;
      contentType?: string;
      csrf?: boolean;
      origin?: string;
    } = {},
  ): Promise<Response> {
    const method = options.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (method !== 'GET' && options.csrf !== false) {
      const csrf = await this.request('/api/auth/csrf');
      assert.equal(csrf.status, 200, 'CSRF token request');
      headers['x-csrf-token'] = (await csrf.json()).token;
    }
    headers.cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    if (method !== 'GET') headers.origin = options.origin ?? this.origin;
    if (options.body !== undefined || options.rawBody !== undefined || options.contentType)
      headers['content-type'] = options.contentType ?? 'application/json';
    const response = await fetch(this.origin + path, {
      method,
      headers,
      body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      redirect: 'manual',
    });
    this.acceptCookies(response);
    return response;
  }
}

export async function expectStatus(response: Response, expected: number, label: string) {
  if (response.status !== expected) {
    const body = await response
      .clone()
      .json()
      .catch(() => ({}));
    throw new Error(
      `${label}: expected ${expected}, received ${response.status}. ${body.error ?? body.message ?? ''}`,
    );
  }
  console.log(`PASS ${label}`);
  return response;
}
