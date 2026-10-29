import { revalidatePath } from 'next/cache';

export function revalidateActivities() {
  for (const path of [
    '/',
    '/activities',
    '/news',
    '/announcements',
    '/events',
    '/past-events',
    '/campus-updates',
    '/admin/activities',
  ])
    revalidatePath(path);
}
