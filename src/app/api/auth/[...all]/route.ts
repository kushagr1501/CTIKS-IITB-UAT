import { getAuth } from '@/server/auth/config';
import { verifyCsrf } from '@/server/auth/csrf';
import { requireActor, type Actor } from '@/server/auth/session';
import { authRequestSchemas, isAuthPath } from '@/server/auth/request-schema';
import { consumeRateLimit, privateRateKey } from '@/server/auth/rate-limit';
import { getDatabase } from '@/server/database/client';
import { writeAudit } from '@/server/audit/write';
import { readJson } from '@/server/http/body';
import { errorResponse } from '@/server/http/errors';

export const dynamic = 'force-dynamic';

function removeTokens(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeTokens);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) => !['token', 'accessToken', 'refreshToken', 'idToken', 'emailVerified'].includes(key),
        )
        .map(([key, entry]) => [key, removeTokens(entry)]),
    );
  }
  return value;
}

async function recordSuccessfulAction(path: string, data: Record<string, unknown>, actor?: Actor) {
  const database = getDatabase();
  if (path === '/change-password' && actor) {
    await writeAudit({ actor, action: 'PASSWORD_CHANGED' });
  }
  if (path === '/sign-out' && actor) {
    await writeAudit({ actor, action: 'LOGOUT', deduplicationKey: `logout:${actor.sessionId}` });
  }
  if (
    path === '/sign-in/email' &&
    data.user &&
    typeof data.user === 'object' &&
    'id' in data.user &&
    typeof data.user.id === 'string'
  ) {
    const user = await database.user.findUnique({ where: { id: data.user.id } });
    if (user) await writeAudit({ actor: user, action: 'LOGIN_SUCCESS' });
  }
}

export async function POST(request: Request) {
  try {
    const path = new URL(request.url).pathname.slice('/api/auth'.length);
    if (!isAuthPath(path)) return Response.json({ error: 'Not found.' }, { status: 404 });
    verifyCsrf(request);
    await consumeRateLimit('auth:global', 120, 60);
    const body = authRequestSchemas[path].parse(await readJson(request, 8192));
    if ('email' in body) await consumeRateLimit(`login:${privateRateKey(body.email)}`, 10, 15 * 60);

    let actor: Actor | undefined;
    if (path === '/change-password' || path === '/sign-out') {
      try {
        actor = await requireActor(request.headers);
      } catch (error) {
        if (path !== '/sign-out' || !(error instanceof Error && 'status' in error && error.status === 401))
          throw error;
      }
    }

    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.delete('content-length');
    const response = await getAuth().handler(
      new Request(request.url, {
        method: 'POST',
        headers: forwardedHeaders,
        body: JSON.stringify(body),
      }),
    );
    const data: Record<string, unknown> = await response.json();
    if (response.ok) await recordSuccessfulAction(path, data, actor);
    else if (path === '/sign-in/email' && 'email' in body) {
      await writeAudit({ action: 'LOGIN_FAILED', details: { submittedIdentifier: body.email } });
    }
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'no-store');
    const safeData =
      !response.ok && path === '/sign-in/email'
        ? {
            error:
              response.status === 429
                ? 'Too many attempts. Please try again later.'
                : 'The email or password could not be verified.',
          }
        : removeTokens(data);
    return Response.json(safeData, { status: response.status, headers });
  } catch (error) {
    return errorResponse(error);
  }
}

export function GET() {
  return Response.json({ error: 'Not found.' }, { status: 404 });
}
