'use client';

import { useId, useRef } from 'react';
import styles from './Activities.module.css';

export default function ActivityPoster({ src, title }: { src: string; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  return (
    <>
      <button type="button" className={styles.thumbnailButton} onClick={() => dialog.current?.showModal()} aria-label={`Enlarge poster for ${title}`}>
        <img src={src} alt={`Poster for ${title}`} loading="lazy" referrerPolicy="no-referrer" className={styles.thumbnail} />
      </button>
      <dialog ref={dialog} className={styles.posterDialog} aria-labelledby={headingId} onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}>
        <div className={styles.posterHeader}>
          <h2 id={headingId}>{title}</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close poster">×</button>
        </div>
        <div className={styles.posterScroll} data-lenis-prevent>
          <img src={src} alt={`Poster for ${title}`} referrerPolicy="no-referrer" />
        </div>
      </dialog>
    </>
  );
}
