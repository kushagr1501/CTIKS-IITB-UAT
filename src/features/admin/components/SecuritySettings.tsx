'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/config/password-policy';
import { apiJson } from '../api-client';
import PasswordInput from '@/components/ui/PasswordInput';
import AdminNotice from './AdminNotice';
import { useActionConfirmation } from './ActionConfirmation';

export default function SecuritySettings() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { confirm, confirmation } = useActionConfirmation();

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    if (form.get('newPassword') !== form.get('confirmPassword')) {
      setError('The new passwords do not match.');
      return;
    }
    if (
      !(await confirm({
        title: 'Change your password?',
        description: 'Your other signed-in sessions will end after this change.',
        label: 'Change password',
      }))
    )
      return;
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
    <div className="mx-auto w-full max-w-xl">
      {confirmation}
      <h1 className="font-display text-3xl text-ctiks-maroon">Change password</h1>
      <p className="mb-7 mt-2 text-sm text-stone-600">Change your account password.</p>
      <AdminNotice
        message={error || message}
        error={Boolean(error)}
        onDismiss={() => {
          setError('');
          setMessage('');
        }}
      />
      <div>
        <section className="admin-panel">
          <h2 className="text-xl font-semibold">Set a new password</h2>
          <p className="mb-6 mt-2 text-sm leading-6 text-stone-600">
            Use a unique password with at least {MIN_PASSWORD_LENGTH} characters.
          </p>
          <form onSubmit={changePassword} className="space-y-4">
            {/* Browser extensions can add fdprocessedid to these controls before hydration. */}
            <PasswordInput
              label="Current password"
              suppressHydrationWarning
              name="currentPassword"
              autoComplete="current-password"
              required
              maxLength={MAX_PASSWORD_LENGTH}
            />
            <PasswordInput
              label="New password"
              suppressHydrationWarning
              name="newPassword"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
            />
            <PasswordInput
              label="Confirm new password"
              suppressHydrationWarning
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
            />
            <button suppressHydrationWarning className="admin-primary" disabled={busy}>
              {busy ? 'Please wait…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
