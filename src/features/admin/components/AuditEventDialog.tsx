import { useEffect, useId, useRef } from 'react';
import { formatAuditTime, presentAuditEvent } from '../audit-presentation';
import type { AuditRecord } from '../types';
import AuditEventDetails from './AuditEventDetails';

export default function AuditEventDialog({ event, onClose }: { event: AuditRecord; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={(closeEvent) => {
        // Ignore a queued close event if Strict Mode has already reopened the dialog.
        if (!closeEvent.currentTarget.open) onClose();
      }}
      onClick={(clickEvent) => {
        if (clickEvent.target !== clickEvent.currentTarget) return;
        const bounds = clickEvent.currentTarget.getBoundingClientRect();
        if (
          clickEvent.clientX < bounds.left ||
          clickEvent.clientX > bounds.right ||
          clickEvent.clientY < bounds.top ||
          clickEvent.clientY > bounds.bottom
        )
          dialogRef.current?.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-900/60"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 bg-stone-50 px-5 py-6 sm:px-8">
          <div className="min-w-0">
            <h2 id={titleId} className="text-2xl font-semibold leading-tight text-stone-900">
              Activity details
            </h2>
            <p className="mt-3 text-lg font-medium leading-7 text-stone-800 [overflow-wrap:anywhere] sm:text-xl">
              {event.targetName ?? event.actorName ?? 'Account activity'}
            </p>
            <span className="mt-3 inline-block rounded-md border border-ctiks-red/20 bg-white px-3 py-1 text-sm font-semibold capitalize text-ctiks-maroon">
              {event.action.replaceAll('_', ' ').toLowerCase()}
            </span>
          </div>
          <button
            type="button"
            className="admin-secondary shrink-0 text-base"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-8">
          <dl className="mb-6 grid gap-5 border-b border-stone-200 pb-6 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-sm font-medium text-stone-600">Performed by</dt>
              <dd className="mt-2 [overflow-wrap:anywhere]">
                <p className="text-base font-semibold text-stone-900">
                  {event.actorName ?? 'Unverified attempt / system'}
                </p>
                {event.actorEmail && <p className="mt-1 text-sm text-stone-600">{event.actorEmail}</p>}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-stone-600">Date &amp; time (IST)</dt>
              <dd className="mt-2 text-base font-semibold text-stone-900">
                <time dateTime={event.createdAt}>{formatAuditTime(event.createdAt)}</time>
              </dd>
            </div>
          </dl>
          <AuditEventDetails presentation={presentAuditEvent(event)} />
        </div>
      </div>
    </dialog>
  );
}
