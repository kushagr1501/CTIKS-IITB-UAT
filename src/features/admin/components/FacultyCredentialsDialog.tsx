import { useEffect, useId, useRef, useState } from 'react';
import type { FacultyLogin } from '../types';

export default function FacultyCredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: FacultyLogin & { name: string };
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [copyMessage, setCopyMessage] = useState('');

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

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `Login: ${window.location.origin}/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`,
      );
      setCopyMessage('Login details copied.');
    } catch {
      setCopyMessage('Copy was unavailable. Select and copy the details below.');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl backdrop:bg-stone-900/60 sm:p-8"
    >
      <h2 id={titleId} className="text-2xl font-semibold">
        Faculty login created
      </h2>
      <p className="mt-2 text-lg font-medium [overflow-wrap:anywhere]">{credentials.name}</p>
      <p className="mt-4 text-base leading-7 text-stone-700">
        Copy these details before closing. The password cannot be viewed again after this popup closes. The
        faculty member can update it on the Change password page.
      </p>
      <dl className="mt-5 space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-5">
        <div>
          <dt className="text-sm font-medium text-stone-600">Login page</dt>
          <dd className="mt-1 text-base font-semibold">/login</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-stone-600">Login email</dt>
          <dd className="mt-1 select-all text-lg font-semibold [overflow-wrap:anywhere]">
            {credentials.email}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-stone-600">Initial password</dt>
          <dd className="mt-1 select-all whitespace-pre-wrap font-mono text-xl font-semibold [overflow-wrap:anywhere]">
            {credentials.password}
          </dd>
        </div>
      </dl>
      <p role="status" className="mt-3 text-sm text-stone-700">
        {copyMessage}
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" className="admin-secondary" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
        <button type="button" className="admin-primary" onClick={copy}>
          Copy login details
        </button>
      </div>
    </dialog>
  );
}
