'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiJson } from '@/features/admin/api-client';
import AdminNotice from '@/features/admin/components/AdminNotice';

const adminLinks = [
  { href: '/admin/people', label: 'Faculty directory' },
  { href: '/admin/activities', label: 'Activities' },
  { href: '/admin/audit-logs', label: 'Audit logs' },
  { href: '/admin/security', label: 'Change password' },
];
const facultyLinks = [
  { href: '/faculty', label: 'My profile' },
  { href: '/faculty/security', label: 'Change password' },
];

export default function AccountNavigation({ area }: { area: 'admin' | 'faculty' }) {
  const links = area === 'admin' ? adminLinks : facultyLinks;
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await apiJson('/api/auth/sign-out', { method: 'POST', body: '{}' });
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Could not sign out. Please try again.');
      setBusy(false);
    }
  }
  return (
    <nav
      aria-label={area === 'admin' ? 'Administration' : 'Faculty account'}
      className={`flex flex-wrap items-center gap-2 ${area === 'admin' ? 'justify-center' : ''}`}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === link.href ? 'bg-ctiks-red text-white' : 'text-stone-700 hover:bg-stone-100'}`}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View website (opens in a new tab)"
        className="rounded-lg px-3 py-2 text-sm text-stone-600 underline decoration-current underline-offset-4"
      >
        View website ↗
      </Link>
      {/* Browser extensions can add fdprocessedid before this control hydrates. */}
      <button
        suppressHydrationWarning
        data-sign-out
        className={`admin-secondary ${area === 'admin' ? 'sm:ml-3' : 'ml-auto'}`}
        type="button"
        disabled={busy}
        onClick={logout}
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      <AdminNotice message={error} error onDismiss={() => setError('')} />
    </nav>
  );
}
