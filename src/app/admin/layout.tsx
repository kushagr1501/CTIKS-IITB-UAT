import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AccountNavigation from '@/components/layout/AccountNavigation';
import { ASSETS } from '@/config/assets';
import { requirePageActor } from '@/server/auth/page-access';

export const metadata: Metadata = { title: 'Administration', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await requirePageActor('faculty.read');
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <div className="mb-5 flex items-center gap-3 sm:gap-6">
            <img
              src={ASSETS.iitbLogo}
              alt="Indian Institute of Technology Bombay"
              width={72}
              height={72}
              className="h-12 w-12 shrink-0 object-contain sm:h-[72px] sm:w-[72px]"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ctiks-red sm:text-xs">
                  CTIKS · IIT Bombay
                </p>
                <p className="mt-1 font-display text-xl text-ctiks-maroon sm:text-2xl">Administration</p>
              </div>
              <p className="text-xs text-stone-500 [overflow-wrap:anywhere] sm:text-sm">{actor.email}</p>
            </div>
            <img
              src={ASSETS.ctiksLogo}
              alt="Centre for Traditional Indian Knowledge and Skills"
              width={80}
              height={80}
              className="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20"
            />
          </div>
          <AccountNavigation area="admin" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
    </div>
  );
}
