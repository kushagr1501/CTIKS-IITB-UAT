'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';

export default function PasswordInput({
  label,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & { label: string }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="admin-label">
      <label htmlFor={inputId}>{label}</label>
      <div className="relative">
        <input {...props} id={inputId} type={visible ? 'text' : 'password'} className="admin-input pr-12" />
        <button
          suppressHydrationWarning
          type="button"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-controls={inputId}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-stone-500 hover:text-ctiks-red disabled:opacity-50"
          disabled={props.disabled}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
