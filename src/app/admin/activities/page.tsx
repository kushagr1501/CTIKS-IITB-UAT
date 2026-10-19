import ActivityManager from '@/features/admin/components/ActivityManager';
import { requirePageActor } from '@/server/auth/page-access';
import { listActivities } from '@/server/activities/service';

export default async function AdminActivitiesPage() {
  const actor = await requirePageActor('activity.read');
  return <ActivityManager initialActivities={await listActivities(actor)} />;
}
