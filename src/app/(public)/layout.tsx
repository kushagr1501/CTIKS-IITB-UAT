import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Nav from '@/components/layout/Nav';
import SmoothScroll from '@/components/providers/SmoothScroll';
import FontSwitcher from '@/components/layout/FontSwitcher';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <FontSwitcher>
      <div className="flex-1 bg-ctiks-cream">
        <SmoothScroll />
        <Header />
        <Nav />
        <main>{children}</main>
      </div>
    </FontSwitcher>
  );
}
