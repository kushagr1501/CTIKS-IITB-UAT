import AuditLogViewer from '@/features/admin/components/AuditLogViewer';
import { requirePageActor } from '@/server/auth/page-access';
import { listAuditEvents } from '@/server/audit/service';

export default async function AuditLogsPage() {
  const actor = await requirePageActor('audit.read');
  const result = await listAuditEvents(actor, new URLSearchParams());
  return (
    <AuditLogViewer
      initialResult={{
        ...result,
        events: result.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
      }}
    />
  );
}
