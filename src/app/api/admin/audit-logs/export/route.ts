import { authorizedRequest } from '@/server/http/authorized-handler';
import { exportAuditEvents } from '@/server/audit/service';

export function POST(request: Request) {
  return authorizedRequest(
    request,
    'audit.export',
    async (actor) =>
      new Response(await exportAuditEvents(actor, new URL(request.url).searchParams), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ctiks-audit-log.csv"',
        },
      }),
  );
}
