import { useEffect, useId, useRef } from 'react';
import type { FacultyRecord } from '../types';

export default function DeleteFacultyDialog({
  profile,
  busy,
  error,
  onClose,
  onDelete,
}: {
  profile: FacultyRecord;
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
      <h2 id={titleId} className="text-2xl font-semibold">
        Delete faculty?
      </h2>
      <p className="mt-3 text-xl font-semibold [overflow-wrap:anywhere]">{profile.name}</p>
      <div
        id={descriptionId}
        className="mt-4 space-y-3 text-base leading-7 text-stone-700 [overflow-wrap:anywhere]"
      >
        <p>
          This permanently removes the faculty profile from the directory and website. This cannot be undone.
        </p>
        {profile.loginEmail && (
          <p>Their login ({profile.loginEmail}) will be disabled and their sessions will end.</p>
        )}
        <p>Past activity and audit history will be kept.</p>
      </div>
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
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? 'Deleting…' : 'Delete faculty'}
        </button>
      </div>
    </dialog>
  );
}
