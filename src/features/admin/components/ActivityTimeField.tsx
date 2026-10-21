import { useId, useState } from 'react';

const minutes = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, '0'));

export default function ActivityTimeField({
  label,
  name,
  defaultValue,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue: string;
  onChange: () => void;
}) {
  const labelId = useId();
  const initialHour = defaultValue ? Number(defaultValue.slice(0, 2)) : null;
  const [hour, setHour] = useState(initialHour === null ? '' : String(initialHour % 12 || 12));
  const [minute, setMinute] = useState(defaultValue.slice(3, 5));
  const [period, setPeriod] = useState(initialHour !== null && initialHour >= 12 ? 'PM' : 'AM');
  const hasValue = Boolean(hour || minute || period === 'PM');
  const value =
    hour && minute
      ? `${String((Number(hour) % 12) + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${minute}`
      : '';

  return (
    <div role="group" aria-labelledby={labelId} className="min-w-0">
      <div className="mb-2 flex min-h-5 items-center justify-between gap-2">
        <span id={labelId} className="text-sm font-medium text-[#65533e]">
          {label}
        </span>
        {hasValue && (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()}`}
            className="text-xs text-ctiks-maroon underline underline-offset-2"
            onClick={() => {
              setHour('');
              setMinute('');
              setPeriod('AM');
              onChange();
            }}
          >
            Clear
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label={`${label} hour`}
          required={hasValue}
          className="admin-input min-w-0"
          value={hour}
          onChange={(event) => {
            setHour(event.target.value);
            if (event.target.value && !minute) setMinute('00');
            onChange();
          }}
        >
          <option value="">Hour</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {String(index + 1).padStart(2, '0')}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} minute`}
          required={hasValue}
          className="admin-input min-w-0"
          value={minute}
          onChange={(event) => {
            setMinute(event.target.value);
            onChange();
          }}
        >
          <option value="">Min</option>
          <optgroup label="Common minutes">
            {minutes
              .filter((value) => Number(value) % 5 === 0)
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
          </optgroup>
          <optgroup label="Other minutes">
            {minutes
              .filter((value) => Number(value) % 5 !== 0)
              .map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
          </optgroup>
        </select>
        <select
          aria-label={`${label} AM or PM`}
          className="admin-input min-w-0"
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value);
            onChange();
          }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
