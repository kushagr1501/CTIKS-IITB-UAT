import { authorizedRequest } from '@/server/http/authorized-handler';
import { readJson } from '@/server/http/body';
import { createActivity, listActivities } from '@/server/activities/service';
import { revalidateActivities } from '@/server/activities/revalidate';

export function GET(request: Request) {
  return authorizedRequest(request, 'activity.read', async (actor) =>
    Response.json({ activities: await listActivities(actor) }),
  );
}

export function POST(request: Request) {
  return authorizedRequest(request, 'activity.create', async (actor) => {
    const activity = await createActivity(actor, await readJson(request));
    revalidateActivities();
    return Response.json({ activity }, { status: 201 });
  });
}
