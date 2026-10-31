import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { getEnvironment } from '@/server/env';
import { HttpError } from '@/server/http/errors';
import { isValidCsrfToken } from './csrf-token';

export function csrfCookieName() {
  return getEnvironment().secureCookies ? '__Host-ctiks-csrf' : 'ctiks-csrf';
}

export function verifyCsrf(request: Request) {
  const environment = getEnvironment();
  if (!environment.trustedOrigins.includes(request.headers.get('origin') ?? ''))
    throw new HttpError(403, 'This request origin is not allowed.');
  const supplied = request.headers.get('x-csrf-token') ?? '';
  const cookie =
    request.headers
      .get('cookie')
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${csrfCookieName()}=`))
      ?.slice(csrfCookieName().length + 1) ?? '';
  if (
    !isValidCsrfToken(supplied, environment.BETTER_AUTH_SECRET) ||
    supplied.length !== cookie.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(cookie))
  ) {
    throw new HttpError(403, 'Your form session has expired. Please try again.');
  }
}
