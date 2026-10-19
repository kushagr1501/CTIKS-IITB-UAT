import 'server-only';
import { requireActor, type Actor } from '@/server/auth/session';
import { verifyCsrf } from '@/server/auth/csrf';
import { consumeRateLimit } from '@/server/auth/rate-limit';
import type { Permission } from '@/server/auth/permissions';
import { errorResponse } from './errors';

export async function authorizedRequest(
  request: Request,
  permission: Permission,
  handler: (actor: Actor) => Promise<Response>,
) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) verifyCsrf(request);
    const actor = await requireActor(request.headers, permission);
    await consumeRateLimit(`account:${actor.id}`, 180, 60);
    const response = await handler(actor);
    response.headers.set('cache-control', 'no-store');
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
