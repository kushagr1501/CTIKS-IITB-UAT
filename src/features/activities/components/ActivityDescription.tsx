'use client';

import { useState } from 'react';
import styles from './Activities.module.css';

export default function ActivityDescription({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = description.length > 320;
  const boundary = description.lastIndexOf(' ', 320);
  const preview = `${description.slice(0, boundary > 240 ? boundary : 320).trimEnd()}…`;
  return (
    <div className={styles.description}>
      <p id={`description-${id}`} className={styles.descriptionText} data-expanded={expanded}>
        {long && !expanded ? preview : description}
      </p>
      {long && (
        <>
          {' '}
          <button
            type="button"
            className={`${styles.readMore} ${expanded ? styles.readLess : ''}`}
            aria-expanded={expanded}
            aria-controls={`description-${id}`}
            aria-label={`Read ${expanded ? 'less' : 'full'}: ${title}`}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Read Less' : 'Read Full'}
          </button>
        </>
      )}
    </div>
  );
}
