'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
};

export default function Reveal({ children, className = '' }: RevealProps) {
  const target = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = target.current;
    if (!element || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Keep server-rendered content visible when JavaScript is unavailable.
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animation = element.animate(
      [{ opacity: 0, transform: 'translateY(4rem)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 1200, easing: 'ease-out', fill: 'backwards' },
    );
    animation.pause();

    function handleMotionChange() {
      if (motionPreference.matches) {
        animation.cancel();
        observer.disconnect();
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animation.play();
        observer.disconnect();
      }
    }, { threshold: 0.15 });

    observer.observe(element);
    motionPreference.addEventListener('change', handleMotionChange);
    return () => {
      motionPreference.removeEventListener('change', handleMotionChange);
      observer.disconnect();
      animation.cancel();
    };
  }, []);

  return <article ref={target} className={className}>{children}</article>;
}
