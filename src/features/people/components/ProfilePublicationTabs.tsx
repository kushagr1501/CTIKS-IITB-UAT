'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import styles from './FacultyProfile.module.css';

export default function ProfilePublicationTabs({
  groups,
}: {
  groups: { label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  if (groups.length === 1)
    return (
      <div>
        <h3 className={styles.groupTitle}>{groups[0].label}</h3>
        {groups[0].content}
      </div>
    );
  return (
    <div>
      <div role="tablist" aria-label="Publication types" className={styles.tabs}>
        {groups.map((group, index) => (
          <button
            key={group.label}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === 'ArrowRight') next = (index + 1) % groups.length;
              else if (event.key === 'ArrowLeft') next = (index + groups.length - 1) % groups.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = groups.length - 1;
              else return;
              event.preventDefault();
              setActive(next);
              buttons.current[next]?.focus();
            }}
          >
            {group.label}
          </button>
        ))}
      </div>
      {groups.map((group, index) => (
        <div
          key={group.label}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={active !== index}
          tabIndex={0}
        >
          {group.content}
        </div>
      ))}
    </div>
  );
}
