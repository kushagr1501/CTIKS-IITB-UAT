import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { HttpError } from '@/server/http/errors';
import { requireActor } from './session';
import { hasPermission, type Permission } from './permissions';

// Layouts and pages share this check only during the current server render.
const getPageActor = cache(async () => requireActor(await headers()));

export async function requirePageActor(permission?: Permission) {
  let actor;
  try {
    actor = await getPageActor();
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect('/login');
    throw error;
  }
  if (permission && !hasPermission(actor.role, permission))
    redirect(actor.role === 'ADMIN' ? '/admin/people' : '/faculty');
  return actor;
}
