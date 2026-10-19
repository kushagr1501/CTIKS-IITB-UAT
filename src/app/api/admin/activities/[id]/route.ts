import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { deleteActivity, updateActivity } from '@/server/activities/service';
import { revalidateActivities } from '@/server/activities/revalidate';

export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return authorizedRequest(request, 'activity.update', async (actor) => {
    const { id } = await params;
    const activity = await updateActivity(actor, id, await readJson(request));
    revalidateActivities();
    return Response.json({ activity });
  });
}

export function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return authorizedRequest(request, 'activity.delete', async (actor) => {
    const { id } = await params;
    const deleted = await deleteActivity(actor, id, await readJson(request));
    revalidateActivities();
    return Response.json({ deleted });
  });
}
