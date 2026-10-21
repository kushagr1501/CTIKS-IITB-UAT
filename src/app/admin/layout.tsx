import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AccountNavigation from '@/components/layout/AccountNavigation';
import { ASSETS } from '@/config/assets';
import { requirePageActor } from '@/server/auth/page-access';
import styles from './AdminShell.module.css';

export const metadata: Metadata = { title: 'Administration', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePageActor('faculty.read');
  return (
    <div className={styles.shell}>
      <header className={styles.masthead}>
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
              <div>
                <p className="font-display text-[14px] font-semibold uppercase leading-snug tracking-[0.02em] text-ctiks-maroon sm:text-[20px] lg:text-[26px]">
                  Centre for Traditional Indian Knowledge and Skills
                </p>
                <p className="mt-2 text-xs font-medium tracking-wide text-[#81674f] sm:text-base">
                  Administration
                </p>
              </div>
            </div>
            <img
              src={ASSETS.ctiksLogo}
              alt="Centre for Traditional Indian Knowledge and Skills"
              width={108}
              height={108}
              className="h-[68px] w-[68px] shrink-0 object-contain sm:h-[108px] sm:w-[108px]"
            />
          </div>
          <div className={styles.navigation}>
            <AccountNavigation area="admin" />
          </div>
        </div>
      </header>
      <main className={`${styles.main} mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12`}>{children}</main>
    </div>
  );
}
