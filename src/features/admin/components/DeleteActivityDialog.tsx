import { useEffect, useId, useRef } from 'react';
import type { ActivityRecord } from '@/features/activities/types';
import ConfirmationHeading from './ConfirmationHeading';

export default function DeleteActivityDialog({
  activity,
  busy,
  error,
  onClose,
  onDelete,
}: {
  activity: ActivityRecord;
  busy: boolean;
  error: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

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
      aria-describedby={descriptionId}
      aria-busy={busy}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl backdrop:bg-stone-900/60 sm:p-8"
    >
      <ConfirmationHeading id={titleId}>
        Are you sure you want to delete this activity?
      </ConfirmationHeading>
      <p className="mt-3 text-lg font-semibold [overflow-wrap:anywhere]">{activity.title}</p>
      <p id={descriptionId} className="mt-4 text-sm leading-6 text-stone-600">
        This permanently removes the activity from the website. This cannot be undone.
      </p>
      {error && (
        <p role="alert" className="admin-error mt-5">
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="admin-secondary"
          disabled={busy}
          onClick={() => dialogRef.current?.close()}
        >
          Cancel
        </button>
        <button type="button" className="admin-primary" disabled={busy} onClick={onDelete}>
          {busy ? 'Deleting…' : 'Delete activity'}
        </button>
      </div>
    </dialog>
  );
}
