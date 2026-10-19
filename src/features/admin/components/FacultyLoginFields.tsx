import { useState } from 'react';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/config/password-policy';
import type { FacultyLogin } from '../types';

export default function FacultyLoginFields({
  enabled,
  onToggle,
  login,
  onChange,
  busy,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  login: FacultyLogin;
  onChange: (login: FacultyLogin) => void;
  busy: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  function generate() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const bytes = crypto.getRandomValues(new Uint8Array(MIN_PASSWORD_LENGTH));
    const password = Array.from(bytes, (byte) => alphabet[byte & 63]).join('');
    onChange({ ...login, password });
    setShowPassword(true);
  }

  return (
    <fieldset disabled={busy} className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:col-span-2">
      <legend className="px-2 text-base font-semibold">Core faculty login</legend>
      <label className="flex items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-4 w-4 accent-ctiks-red"
        />
        Create a login for this faculty member
      </label>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        They can sign in to edit and publish their own profile, and change their password.
      </p>
      {enabled && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="admin-label">
            Login email
            <input
              type="email"
              autoComplete="off"
              className="admin-input"
              value={login.email}
              onChange={(event) => onChange({ ...login, email: event.target.value })}
              required
              maxLength={254}
            />
            <span className="text-xs font-normal leading-5 text-stone-600">
              Used to sign in. This can differ from the public email.
            </span>
          </label>
          <div>
            <label className="admin-label">
              Initial password
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="admin-input"
                value={login.password}
                onChange={(event) => onChange({ ...login, password: event.target.value })}
                required
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="text-sm font-semibold text-ctiks-red hover:underline"
                onClick={generate}
              >
                Generate password
              </button>
              <button
                type="button"
                className="text-sm text-stone-700 hover:underline"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          </div>
        </div>
      )}
    </fieldset>
  );
}
