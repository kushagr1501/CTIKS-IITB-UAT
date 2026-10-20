'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './FontSwitcher.module.css';

const FONT_OPTIONS = [
  { id: 'current', name: 'Font 1', detail: 'Original CTIKS' },
  { id: 'source', name: 'Font 2', detail: 'Source Serif + Sans' },
  { id: 'baskerville', name: 'Font 3', detail: 'Baskerville + Source Sans' },
  { id: 'newsreader', name: 'Font 4', detail: 'Newsreader + DM Sans' },
  { id: 'manrope', name: 'Font 5', detail: 'Manrope' },
  { id: 'fraunces', name: 'Font 6', detail: 'Fraunces + DM Sans' },
] as const;

type FontChoice = (typeof FONT_OPTIONS)[number]['id'];

export default function FontSwitcher({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<FontChoice | null>(null);
  const [open, setOpen] = useState(false);
  const active = choice ?? (pathname === '/research' ? 'source' : 'current');

  function select(next: FontChoice) {
    setChoice(next);
  }

  return (
    <div className={styles.site} data-font-preview={active}>
      {children}
      <div className={styles.switcher} onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}>
        <button
          type="button"
          className={styles.trigger}
          aria-label="Choose page font"
          aria-expanded={open}
          aria-controls="font-preview-options"
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.triggerIcon} aria-hidden="true">Aa</span>
          <span>{FONT_OPTIONS.find((option) => option.id === active)?.name}</span>
          <span className={styles.chevron} aria-hidden="true">⌃</span>
        </button>
        {open && (
          <div id="font-preview-options" className={styles.panel} role="group" aria-label="Font preview options">
            <p className={styles.panelTitle}>Preview fonts</p>
            {FONT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.option}
                data-option={option.id}
                aria-pressed={active === option.id}
                onClick={() => select(option.id)}
              >
                <span className={styles.optionName}>{option.name}</span>
                <span className={styles.optionDetail}>{option.detail}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
