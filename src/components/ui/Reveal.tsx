'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './Reveal.module.css';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'programme' | 'arch';
};

export default function Reveal({ children, className = '', delay = 0, variant = 'programme' }: RevealProps) {
  const target = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = target.current;
    if (!element || !('IntersectionObserver' in window)) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;

    element.dataset.revealState = 'pending';

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.dataset.revealState = 'visible';
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    const finish = () => {
      if (motionPreference.matches) {
        element.dataset.revealState = 'visible';
        observer.disconnect();
      }
    };

    observer.observe(element);
    motionPreference.addEventListener('change', finish);
    return () => {
      motionPreference.removeEventListener('change', finish);
      observer.disconnect();
      delete element.dataset.revealState;
    };
  }, []);

  return (
    <article
      ref={target}
      className={`${styles.card} ${variant === 'arch' ? styles.archCard : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </article>
  );
}
