'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/config/password-policy';
import { apiJson } from '../api-client';

export default function SecuritySettings() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    if (form.get('newPassword') !== form.get('confirmPassword')) {
      setError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiJson('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: form.get('currentPassword'),
          newPassword: form.get('newPassword'),
          revokeOtherSessions: true,
        }),
      });
      element.reset();
      setMessage('Your password was changed. Other sessions have been revoked.');
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to change the password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl text-ctiks-maroon">Change password</h1>
      <p className="mb-7 mt-2 text-sm text-stone-600">Change your account password.</p>
      {error && (
        <p role="alert" className="admin-error mb-5">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="admin-success mb-5">
          {message}
        </p>
      )}
      <div className="max-w-xl">
        <section className="admin-panel">
          <h2 className="text-xl font-semibold">Set a new password</h2>
          <p className="mb-6 mt-2 text-sm leading-6 text-stone-600">
            Use a unique password with at least {MIN_PASSWORD_LENGTH} characters.
          </p>
          <form onSubmit={changePassword} className="space-y-4">
            {/* Browser extensions can add fdprocessedid to these controls before hydration. */}
            <label className="admin-label">
              Current password
              <input
                suppressHydrationWarning
                name="currentPassword"
                type="password"
                className="admin-input"
                autoComplete="current-password"
                required
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </label>
            <label className="admin-label">
              New password
              <input
                suppressHydrationWarning
                name="newPassword"
                type="password"
                className="admin-input"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </label>
            <label className="admin-label">
              Confirm new password
              <input
                suppressHydrationWarning
                name="confirmPassword"
                type="password"
                className="admin-input"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </label>
            <button suppressHydrationWarning className="admin-primary" disabled={busy}>
              {busy ? 'Please wait…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
