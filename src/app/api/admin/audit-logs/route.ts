import { authorizedRequest } from '@/server/http/authorized-handler';
import { listAuditEvents } from '@/server/audit/service';

export function GET(request: Request) {
  return authorizedRequest(request, 'audit.read', async (actor) =>
    Response.json(await listAuditEvents(actor, new URL(request.url).searchParams)),
  );
}
