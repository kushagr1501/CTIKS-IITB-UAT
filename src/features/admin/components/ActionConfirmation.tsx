'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import ConfirmationHeading from './ConfirmationHeading';

type Confirmation = { title: string; description: string; label: string };

export function useActionConfirmation() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const resolve = useRef<((accepted: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      resolve.current?.(false);
    },
    [],
  );
  const confirm = useCallback(
    (options: Confirmation) =>
      new Promise<boolean>((done) => {
        resolve.current?.(false);
        resolve.current = done;
        setRequest(options);
      }),
    [],
  );
  const finish = useCallback((accepted: boolean) => {
    resolve.current?.(accepted);
    resolve.current = null;
    setRequest(null);
  }, []);
  return {
    confirm,
    confirmation: request ? <ActionConfirmation request={request} onFinish={finish} /> : null,
  };
}

function ActionConfirmation({
  request,
  onFinish,
}: {
  request: Confirmation;
  onFinish: (accepted: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onFinish(false);
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[#e4cfaf] bg-[#fffaf2] p-7 text-[#4a4235] shadow-2xl backdrop:bg-[#30251c]/50 sm:p-8"
    >
      <ConfirmationHeading id={titleId}>{request.title}</ConfirmationHeading>
      <p id={descriptionId} className="mt-3 text-sm leading-6 text-[#655746]">
        {request.description}
      </p>
      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <button type="button" className="admin-secondary" autoFocus onClick={() => onFinish(false)}>
          Cancel
        </button>
        <button type="button" className="admin-primary" onClick={() => onFinish(true)}>
          {request.label}
        </button>
      </div>
    </dialog>
  );
}
