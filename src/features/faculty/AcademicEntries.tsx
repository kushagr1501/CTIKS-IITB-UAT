import { useState } from 'react';
import AcademicEntryFields, { type EntryField, type EntryValue } from './AcademicEntryFields';
import AcademicEntryDialog, { type AcademicCollection } from './AcademicEntryDialog';
export type { EntryField } from './AcademicEntryFields';

function Entry<T extends Record<string, EntryValue>>({
  row,
  fields,
  id,
  title,
  onChange,
}: {
  row: T;
  fields: EntryField<T>[];
  id: string;
  title: string;
  onChange: (row: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      className="min-w-0 rounded-lg border border-stone-200 bg-white"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer break-words px-4 py-3 text-base font-medium text-stone-800">
        {title}
      </summary>
      {open && (
        <div className="border-t border-stone-100 p-4">
          <AcademicEntryFields row={row} fields={fields} id={id} onChange={onChange} />
        </div>
      )}
    </details>
  );
}

const moveButtonClass =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400 disabled:hover:bg-stone-50';

export default function AcademicEntries<T extends Record<string, EntryValue>>({
  name,
  label,
  rows,
  fields,
  create,
  onChange,
  limit,
}: {
  name: AcademicCollection;
  label: string;
  rows: T[];
  fields: EntryField<T>[];
  create: () => T;
  onChange: (rows: T[]) => void;
  limit: number;
}) {
  const [adding, setAdding] = useState(false);
  function move(index: number, direction: -1 | 1) {
    const next = [...rows];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  }
  return (
    <section id={`editor-${name}`} className="admin-panel scroll-mt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-ctiks-maroon">
          {label} <span className="text-base font-normal text-stone-500">({rows.length})</span>
        </h2>
        <button
          type="button"
          className="admin-secondary"
          disabled={rows.length >= limit}
          onClick={() => setAdding(true)}
        >
          Add entry
        </button>
      </div>
      {!rows.length && <p className="text-base text-stone-600">No entries added.</p>}
      <ol className="space-y-4">
        {rows.map((row, index) => (
          <li key={index} className="min-w-0">
            <Entry
              row={row}
              fields={fields}
              id={`${name}-${index}`}
              title={`${index + 1}. ${String(row.title || row.name || 'New entry')}`}
              onChange={(value) =>
                onChange(rows.map((entry, position) => (position === index ? value : entry)))
              }
            />
            <div className="mt-2 flex flex-wrap justify-end gap-2 text-sm">
              <button
                type="button"
                className={moveButtonClass}
                disabled={index === 0}
                aria-label={`Move ${label} entry ${index + 1} up`}
                onClick={() => move(index, -1)}
              >
                <span aria-hidden="true">↑</span> Move up
              </button>
              <button
                type="button"
                className={moveButtonClass}
                disabled={index === rows.length - 1}
                aria-label={`Move ${label} entry ${index + 1} down`}
                onClick={() => move(index, 1)}
              >
                <span aria-hidden="true">↓</span> Move down
              </button>
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:border-red-300 hover:bg-red-100"
                aria-label={`Delete ${label} entry ${index + 1}`}
                onClick={() => {
                  if (window.confirm(`Delete this ${label.toLowerCase()} entry?`))
                    onChange(rows.filter((_, position) => position !== index));
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5"
                  />
                </svg>{' '}
                Delete
              </button>
            </div>
          </li>
        ))}
      </ol>
      {adding && (
        <AcademicEntryDialog
          name={name}
          label={label}
          fields={fields}
          create={create}
          onAdd={(row) => {
            if (rows.length < limit) onChange([...rows, row]);
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}
