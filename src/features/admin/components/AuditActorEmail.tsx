import type { AuditRecord } from '../types';

export default function AuditActorEmail({
  event,
  className = 'mt-1 text-xs text-stone-500',
}: {
  event: Pick<AuditRecord, 'actorEmail' | 'currentActorEmail'>;
  className?: string;
}) {
  const current = event.currentActorEmail;
  const recorded = event.actorEmail;

  if (!current && !recorded) return null;

  return (
    <div className={className}>
      {current && <p>{current}</p>}
      {recorded && recorded !== current && (
        <p className={current ? 'mt-1' : undefined}>Email at time of activity: {recorded}</p>
      )}
    </div>
  );
}
