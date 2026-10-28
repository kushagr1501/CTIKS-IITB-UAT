'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Reveal from '@/components/ui/Reveal';
export type ResearchCardArea = { title: string; imageUrl: string; summary: string };
import styles from './research.module.css';

type Professor = { name: string; href: string | null };

export default function ResearchCard({
  area,
  professors,
  index,
}: {
  area: ResearchCardArea;
  professors: Professor[];
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backHeading = useRef<HTMLHeadingElement>(null);
  const hasDetails = Boolean(area.summary);

  function flip(showDetails: boolean) {
    setFlipped(showDetails);
    requestAnimationFrame(() => {
      if (showDetails) backHeading.current?.focus({ preventScroll: true });
      else frontButton.current?.focus({ preventScroll: true });
      if (showDetails) {
        frontButton.current?.closest('article')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'start',
        });
      }
    });
  }

  return (
    <Reveal className={styles.card} variant="arch" delay={(index % 2) * 80}>
      <div
        className={`${styles.flipInner} ${hasDetails ? styles.hasDetails : ''} ${flipped ? styles.flipped : ''}`}
      >
        <div className={`${styles.face} ${styles.front}`} inert={flipped} aria-hidden={flipped}>
          <div data-reveal-media className={styles.imageWrap}>
            <Image
              src={area.imageUrl}
              unoptimized={!area.imageUrl.startsWith('/assets/')}
              alt={area.title}
              fill
              sizes="(max-width: 767px) calc(100vw - 56px), 530px"
            />
          </div>
          <div data-reveal-content className={styles.cardBody}>
            <div className={styles.cardHeading}>
              <h3>{area.title}</h3>
            </div>
            <div className={styles.cardActions}>
              {hasDetails ? (
                <button
                  ref={frontButton}
                  type="button"
                  className={styles.flipButton}
                  aria-label={`Know more about ${area.title}`}
                  onClick={() => flip(true)}
                >
                  Know more <span aria-hidden="true">›</span>
                </button>
              ) : (
                <p className={styles.comingSoon}>Details coming soon</p>
              )}
              <span className={styles.actionRule} aria-hidden="true" />
            </div>
          </div>
        </div>

        {hasDetails && (
          <div className={`${styles.face} ${styles.back}`} inert={!flipped} aria-hidden={!flipped}>
            <div className={styles.backContent}>
              <h3 ref={backHeading} tabIndex={-1}>
                {area.title}
              </h3>
              <p className={styles.backSummary}>{area.summary}</p>
              <div className={styles.professors}>
                <h4>Professors</h4>
                {professors.length > 0 ? (
                  <ul>
                    {professors.map((person) => (
                      <li key={person.name}>
                        {person.href ? (
                          <a
                            href={person.href}
                            target={person.href.startsWith('https://') ? '_blank' : undefined}
                            rel={person.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
                          >
                            {person.name}
                          </a>
                        ) : (
                          person.name
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Professor profiles will be listed here when available.</p>
                )}
              </div>
            </div>
            <div className={styles.backActions}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => flip(false)}
                aria-label={`Back to ${area.title} card`}
              >
                <span aria-hidden="true">←</span> Back to card
              </button>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  );
}
