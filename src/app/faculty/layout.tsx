import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AccountNavigation from '@/components/layout/AccountNavigation';
import { ASSETS } from '@/config/assets';
import { requirePageActor } from '@/server/auth/page-access';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Faculty account', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function FacultyLayout({ children }: { children: ReactNode }) {
  const actor = await requirePageActor('faculty.self.read');
  if (actor.role === 'ADMIN') redirect('/admin/people');
  return (
    <div className="min-h-screen bg-ctiks-cream text-ctiks-maroon">
      <header className="border-b border-[#e8d4b8] border-t-4 border-t-[#820d0d] bg-[#fff7ed]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          <div className="mb-5 grid grid-cols-[68px_minmax(0,1fr)_68px] items-center gap-2 sm:grid-cols-[108px_minmax(0,1fr)_108px] sm:gap-6">
            <img
              src={ASSETS.iitbLogo}
              alt="Indian Institute of Technology Bombay"
              width={96}
              height={96}
              className="h-[60px] w-[60px] justify-self-center object-contain sm:h-24 sm:w-24"
            />
            <div className="min-w-0 text-center">
              <p className="font-display text-[14px] font-semibold uppercase leading-snug tracking-[0.02em] text-ctiks-maroon sm:text-[20px] lg:text-[26px]">
                Centre for Traditional Indian Knowledge and Skills
              </p>
              <p className="mt-2 text-xs font-medium tracking-wide text-[#81674f] sm:text-base">
                Core Faculty
              </p>
            </div>
            <img
              src={ASSETS.ctiksLogo}
              alt="Centre for Traditional Indian Knowledge and Skills"
              width={108}
              height={108}
              className="h-[68px] w-[68px] shrink-0 object-contain sm:h-[108px] sm:w-[108px]"
            />
          </div>
          <div className="border-t border-[#ead7bd] pt-4">
            <AccountNavigation area="faculty" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
    </div>
  );
}
