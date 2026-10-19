import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function createCsrfToken(secret: string) {
  const nonce = randomBytes(32).toString('base64url');
  return `${nonce}.${createHmac('sha256', secret).update(nonce).digest('base64url')}`;
}

export function isValidCsrfToken(token: string, secret: string) {
  if (!/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [nonce, signature] = token.split('.');
  const expected = createHmac('sha256', secret).update(nonce).digest('base64url');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
