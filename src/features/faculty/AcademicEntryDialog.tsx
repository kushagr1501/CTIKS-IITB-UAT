import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AcademicEntryFields, { type EntryField, type EntryValue } from './AcademicEntryFields';
import { academicContentSchema } from './profile-schema';

export type AcademicCollection =
  'education' | 'experience' | 'courses' | 'publications' | 'patents' | 'students';

export default function AcademicEntryDialog<T extends Record<string, EntryValue>>({
  name,
  label,
  fields,
  create,
  onAdd,
  onClose,
}: {
  name: AcademicCollection;
  label: string;
  fields: EntryField<T>[];
  create: () => T;
  onAdd: (row: T) => void;
  onClose: () => void;
}) {
  const [row, setRow] = useState(create);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const formId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-900/50"
    >
      <form
        id={formId}
        noValidate
        className="flex max-h-[calc(100dvh-2rem)] flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          // Portal events still bubble through React to the profile's publish form.
          event.stopPropagation();
          const result = academicContentSchema.shape[name].safeParse([row]);
          if (!result.success) {
            const issue = result.error.issues[0];
            const field = fields.find((item) => item.key === issue.path[1]);
            const missingRequired =
              field?.required && typeof row[field.key] === 'string' && !String(row[field.key]).trim();
            setError(
              missingRequired
                ? `${field.label} is required.`
                : `${field ? `${field.label}: ` : ''}${issue.message}`,
            );
            if (field) document.getElementById(`${formId}-${field.key}`)?.focus();
            return;
          }
          onAdd(row);
          onClose();
        }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
          <div>
            <h2 id={titleId} className="font-display text-2xl text-ctiks-maroon">
              Add entry · {label}
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-stone-600">
              Save or publish your profile to apply the new entry.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close add entry window"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-white text-2xl leading-none text-stone-600 hover:bg-stone-100"
            onClick={() => dialogRef.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
          {error && (
            <p role="alert" className="admin-error mb-5">
              {error}
            </p>
          )}
          <AcademicEntryFields
            row={row}
            fields={fields}
            id={formId}
            onChange={(value) => {
              setRow(value);
              setError('');
            }}
          />
        </div>
        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-stone-200 bg-stone-50 px-5 py-4 sm:px-7">
          <button type="button" className="admin-secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="admin-primary">
            Add entry
          </button>
        </footer>
      </form>
    </dialog>,
    document.body,
  );
}
