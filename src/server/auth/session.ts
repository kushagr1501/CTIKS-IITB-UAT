import 'server-only';
import { getDatabase } from '@/server/database/client';
import { HttpError } from '@/server/http/errors';
import { getAuth } from './config';
import { getRedis, redisPrefix, redisOperation } from '@/server/redis/client';
import { touchSession } from './redis-storage';
import { canSignIn, hasPermission, type Permission } from './permissions';

export type Actor = {
  id: string;
  email: string;
  name: string;
  role: string;
  sessionId: string;
};

export function assertPermission(actor: Actor, permission: Permission) {
  if (!hasPermission(actor.role, permission))
    throw new HttpError(403, 'You do not have permission for this operation.');
}

export async function requireActor(requestHeaders: Headers, permission?: Permission): Promise<Actor> {
  const result = await getAuth().api.getSession({ headers: requestHeaders });
  if (!result) throw new HttpError(401, 'Please log in to continue.');
  const database = getDatabase();
  // Redis contains a login snapshot; permissions always use the current Neon user.
  const user = await database.user.findUnique({
    where: { id: result.session.userId },
    include: { facultyProfile: { select: { category: true } } },
  });
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  const actor: Actor = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionId: result.session.id,
  };
  if (permission) assertPermission(actor, permission);
  if (!canSignIn(user.role, user.facultyProfile?.category))
    throw new HttpError(401, 'This account no longer has access. Please contact the administrator.');
  const valid = await redisOperation(() =>
    touchSession(getRedis(), redisPrefix(), result.session.token, result.session.expiresAt),
  );
  if (!valid) throw new HttpError(401, 'Your session has ended. Please log in again.');
  return actor;
}
