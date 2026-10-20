'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = content.current?.querySelector('main');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element || preference.matches) return;

    const animation = element.animate(
      [
        { opacity: 0, transform: 'translateY(28px)' },
        { opacity: 0.82, transform: 'translateY(7px)', offset: 0.68 },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 1050,
        easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
        fill: 'both',
      },
    );
    const stop = () => {
      if (preference.matches) animation.cancel();
    };
    preference.addEventListener('change', stop);
    return () => {
      animation.cancel();
      preference.removeEventListener('change', stop);
    };
  }, [pathname]);

  return (
    <div ref={content} className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
