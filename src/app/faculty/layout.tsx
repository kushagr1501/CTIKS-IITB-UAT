import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AccountNavigation from '@/components/layout/AccountNavigation';
import { requirePageActor } from '@/server/auth/page-access';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Faculty account', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function FacultyLayout({ children }: { children: ReactNode }) {
  const actor = await requirePageActor('faculty.self.read');
  if (actor.role === 'ADMIN') redirect('/admin/people');
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ctiks-red">
                CTIKS · IIT Bombay
              </p>
              <p className="mt-1 font-display text-2xl text-ctiks-maroon">Faculty account</p>
            </div>
            <p className="text-sm text-stone-600 [overflow-wrap:anywhere]">{actor.email}</p>
          </div>
          <AccountNavigation area="faculty" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
    </div>
  );
}
