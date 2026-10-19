import { useState } from 'react';

type Value = string | number | null;
export type EntryField<T> = {
  key: keyof T & string;
  label: string;
  kind?: 'textarea' | 'url' | 'year';
  max?: number;
  required?: boolean;
  options?: readonly { value: string; label: string }[];
};
function Entry<T extends Record<string, Value>>({
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
  const [open, setOpen] = useState(!row.title && !row.name);
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
        <div className="grid gap-4 border-t border-stone-100 p-4 sm:grid-cols-2">
          {fields.map((field) => {
            const inputId = `${id}-${field.key}`;
            const props = {
              id: inputId,
              className: 'admin-input !text-base',
              value: row[field.key] ?? '',
              onChange: (event: { target: { value: string } }) =>
                onChange({
                  ...row,
                  [field.key]:
                    field.kind === 'year'
                      ? event.target.value === ''
                        ? null
                        : Number(event.target.value)
                      : event.target.value,
                }),
            };
            return (
              <label
                key={field.key}
                htmlFor={inputId}
                className={`admin-label ${field.kind === 'textarea' ? 'sm:col-span-2' : ''}`}
              >
                {field.label}
                {field.required ? ' *' : ''}
                {field.options ? (
                  <select {...props}>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.kind === 'textarea' ? (
                  <textarea {...props} rows={3} maxLength={field.max} />
                ) : (
                  <input
                    {...props}
                    type={field.kind === 'year' ? 'number' : field.kind === 'url' ? 'url' : 'text'}
                    maxLength={field.max}
                    min={field.kind === 'year' ? 1000 : undefined}
                    max={field.kind === 'year' ? 9999 : undefined}
                    disabled={field.key === 'graduationYear' && row.status !== 'GRADUATED'}
                  />
                )}
              </label>
            );
          })}
        </div>
      )}
    </details>
  );
}
export default function AcademicEntries<T extends Record<string, Value>>({
  name,
  label,
  rows,
  fields,
  create,
  onChange,
  limit,
}: {
  name: string;
  label: string;
  rows: T[];
  fields: EntryField<T>[];
  create: () => T;
  onChange: (rows: T[]) => void;
  limit: number;
}) {
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
          onClick={() => onChange([...rows, create()])}
        >
          Add entry
        </button>
      </div>
      {!rows.length && <p className="text-base text-stone-600">No entries added.</p>}
      <ol className="space-y-3">
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
            <div className="mt-1.5 flex justify-end gap-4 px-1 text-sm">
              <button
                type="button"
                className="text-stone-600 hover:underline disabled:opacity-30"
                disabled={index === 0}
                aria-label={`Move ${label} entry ${index + 1} up`}
                onClick={() => move(index, -1)}
              >
                Move up
              </button>
              <button
                type="button"
                className="text-stone-600 hover:underline disabled:opacity-30"
                disabled={index === rows.length - 1}
                aria-label={`Move ${label} entry ${index + 1} down`}
                onClick={() => move(index, 1)}
              >
                Move down
              </button>
              <button
                type="button"
                className="text-ctiks-red hover:underline"
                aria-label={`Remove ${label} entry ${index + 1}`}
                onClick={() => {
                  if (window.confirm(`Remove this ${label.toLowerCase()} entry?`))
                    onChange(rows.filter((_, position) => position !== index));
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
