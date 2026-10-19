'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PasswordInput from '@/components/ui/PasswordInput';
import { MAX_PASSWORD_LENGTH } from '@/config/password-policy';
import { apiJson } from '../api-client';

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const { user } = await apiJson<{ user: { role: string } }>('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          rememberMe: true,
        }),
      });
      router.push(user.role === 'CORE_FACULTY' ? '/faculty' : '/admin');
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to log in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-ctiks-red/15 bg-white p-7 shadow-sm sm:p-10">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ctiks-red">
        CTIKS · IIT Bombay
      </p>
      <h1 className="font-display text-3xl text-ctiks-maroon">Account login</h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Sign in with your administrator or core faculty account.
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <label className="admin-label">
          Email
          <input
            name="email"
            type="email"
            className="admin-input"
            autoComplete="username"
            required
            maxLength={254}
          />
        </label>
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          maxLength={MAX_PASSWORD_LENGTH}
        />
        {error && (
          <p role="alert" className="admin-error">
            {error}
          </p>
        )}
        <button disabled={busy} className="admin-primary w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <Link href="/" className="mt-7 block text-sm text-stone-600 underline underline-offset-4">
        Return to website
      </Link>
    </div>
  );
}
