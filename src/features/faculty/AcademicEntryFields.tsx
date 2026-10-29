import LocalMediaUpload from './LocalMediaUpload';
import StudentSocialLinksInput from './StudentSocialLinksInput';
import type { StudentSocialLink } from './student-schema';
import type { AcademicCollection } from './academic-entry-types';

export type EntryValue = string | number | null | StudentSocialLink[];
export type EntryField<T> = {
  key: keyof T & string;
  label: string;
  kind?: 'textarea' | 'url' | 'year' | 'image' | 'socialLinks';
  max?: number;
  required?: boolean;
  options?: readonly { value: string; label: string }[];
};

export default function AcademicEntryFields<T extends Record<string, EntryValue>>({
  row,
  fields,
  id,
  collection,
  onChange,
  onLocalMediaUploaded,
  allowLocalUploads = false,
}: {
  row: T;
  fields: EntryField<T>[];
  id: string;
  collection: AcademicCollection;
  onChange: (row: T) => void;
  onLocalMediaUploaded?: (url: string) => void;
  allowLocalUploads?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const inputId = `${id}-${field.key}`;
        const rawValue = row[field.key];
        const attachedLocalPdf =
          field.kind === 'url' && typeof rawValue === 'string' && /^\/api\/local-media\//i.test(rawValue);
        if (field.kind === 'socialLinks')
          return (
            <StudentSocialLinksInput
              key={field.key}
              id={inputId}
              links={Array.isArray(rawValue) ? rawValue : []}
              onChange={(links) => onChange({ ...row, [field.key]: links })}
            />
          );
        const props = {
          id: inputId,
          className: 'admin-input !text-base',
          value: attachedLocalPdf
            ? ''
            : typeof rawValue === 'string' || typeof rawValue === 'number'
              ? rawValue
              : '',
          required: field.required,
          placeholder:
            field.kind === 'image'
              ? 'https://... or /assets/...'
              : field.kind === 'url' && allowLocalUploads
                ? 'Paste an external link (optional)'
                : undefined,
          onChange: (event: { target: { value: string } }) => {
            const value =
              field.kind === 'year'
                ? event.target.value === ''
                  ? null
                  : Number(event.target.value)
                : event.target.value;
            const next = { ...row, [field.key]: value };
            onChange(
              field.key === 'status' && value === 'CURRENT' && 'graduationYear' in next
                ? { ...next, graduationYear: null }
                : next,
            );
          },
        };
        if (field.kind === 'image') {
          const photoUpload = allowLocalUploads ? (
            <LocalMediaUpload
              accept="image/jpeg,image/png,image/webp"
              storageName={`student-${String(row.name || 'new-student')}-photo`}
              onUploaded={(url) => {
                onLocalMediaUploaded?.(url);
                onChange({ ...row, [field.key]: url } as T);
              }}
              variant="photo-choice"
            />
          ) : null;

          return (
            <div key={field.key} className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-stone-700">{field.label}</p>
              {allowLocalUploads ? (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <input
                    {...props}
                    type="url"
                    placeholder="Paste a photo URL"
                    maxLength={field.max}
                    aria-label="Paste student photo URL"
                  />
                  <span className="px-1 text-center text-xs font-medium uppercase tracking-wide text-stone-500">
                    or
                  </span>
                  {photoUpload}
                </div>
              ) : (
                <label htmlFor={inputId} className="admin-label">
                  Photo URL
                  <input {...props} type="url" placeholder="https://…" maxLength={field.max} />
                </label>
              )}
            </div>
          );
        }
        return (
          <div key={field.key} className={field.kind === 'textarea' ? 'sm:col-span-2' : ''}>
            <label htmlFor={inputId} className="admin-label">
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
                  placeholder={props.placeholder}
                />
              )}
            </label>
            {attachedLocalPdf && (
              <span className="mt-1 block text-sm leading-6 text-stone-500">
                A PDF is attached below. Paste a link here if you want to use an external document instead.
              </span>
            )}
            {allowLocalUploads && field.kind === 'url' && (
              <LocalMediaUpload
                accept="application/pdf"
                value={typeof rawValue === 'string' ? rawValue : ''}
                onRemove={() => onChange({ ...row, [field.key]: '' } as T)}
                storageName={`${collection === 'publications' ? 'publication' : 'patent'}-${String(row.title || 'document')}`}
                onUploaded={(url) => {
                  onLocalMediaUploaded?.(url);
                  onChange({ ...row, [field.key]: url } as T);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
