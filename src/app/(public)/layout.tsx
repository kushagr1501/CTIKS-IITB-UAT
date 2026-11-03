import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Nav from '@/components/layout/Nav';
import SmoothScroll from '@/components/providers/SmoothScroll';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-ctiks-cream">
      <SmoothScroll />
      <Header />
      <Nav />
      <main>{children}</main>
    </div>
  );
}
