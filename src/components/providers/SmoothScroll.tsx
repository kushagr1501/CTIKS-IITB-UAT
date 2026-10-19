'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';

export default function SmoothScroll() {
  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    let animationFrameId: number | undefined;

    function stopScrolling() {
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId);
      lenis?.destroy();
      lenis = undefined;
    }

    function updateScrolling() {
      stopScrolling();
      if (motionPreference.matches) return;

      lenis = new Lenis({
        duration: 1.2,
        easing: (time: number) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
      });

      function animate(time: number) {
        lenis?.raf(time);
        animationFrameId = requestAnimationFrame(animate);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    updateScrolling();
    motionPreference.addEventListener('change', updateScrolling);
    return () => {
      motionPreference.removeEventListener('change', updateScrolling);
      stopScrolling();
    };
  }, []);

  return null;
}
