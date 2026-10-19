import { formatAuditTime, presentAuditEvent } from '../audit-presentation';
import type { AuditRecord } from '../types';

export default function AuditLogRow({
  event,
  onView,
}: {
  event: AuditRecord;
  onView: (event: AuditRecord) => void;
}) {
  const presentation = presentAuditEvent(event);
  const hasDetails = presentation.changes.length > 0 || presentation.info.length > 0;
  const viewLabel =
    !presentation.removed && presentation.showPrevious && presentation.changes.length
      ? `View ${presentation.changes.length} ${presentation.changes.length === 1 ? 'change' : 'changes'}`
      : 'View';

  return (
    <tr className="border-b border-stone-100 align-top">
      <td className="whitespace-nowrap p-3">{formatAuditTime(event.createdAt)}</td>
      <td className="p-3 [overflow-wrap:anywhere]">
        <p>{event.actorName ?? 'Unverified attempt / system'}</p>
        <p className="mt-1 text-xs text-stone-500">{event.actorEmail}</p>
      </td>
      <td className="p-3 text-xs font-semibold [overflow-wrap:anywhere]">
        {event.action.replaceAll('_', ' ')}
      </td>
      <td className="p-3 [overflow-wrap:anywhere]">{event.targetName ?? '—'}</td>
      <td className="p-3">
        {hasDetails ? (
          <button
            type="button"
            aria-haspopup="dialog"
            className="text-left text-ctiks-red underline-offset-4 hover:underline"
            onClick={() => onView(event)}
          >
            {viewLabel}
          </button>
        ) : (
          <p className="text-stone-600">{presentation.message}</p>
        )}
      </td>
    </tr>
  );
}
