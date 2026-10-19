'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function PageMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = content.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element || preference.matches) return;

    const animation = element.animate([{ opacity: 0.65 }, { opacity: 1 }], {
      duration: 220,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
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
