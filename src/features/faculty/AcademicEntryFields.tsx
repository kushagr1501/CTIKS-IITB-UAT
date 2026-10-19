import StudentSocialLinksInput from './StudentSocialLinksInput';
import type { StudentSocialLink } from './student-schema';

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
  onChange,
}: {
  row: T;
  fields: EntryField<T>[];
  id: string;
  onChange: (row: T) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const inputId = `${id}-${field.key}`;
        const rawValue = row[field.key];
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
          value: typeof rawValue === 'string' || typeof rawValue === 'number' ? rawValue : '',
          required: field.required,
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
                placeholder={field.kind === 'image' ? 'https://... or /assets/...' : undefined}
              />
            )}
            {field.kind === 'image' && (
              <span className="text-sm font-normal leading-6 text-stone-500">Use a direct image link.</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
