'use client';

import { useEffect, useRef } from 'react';
import { ASSETS } from '@/config/assets';
import styles from './AdminNotice.module.css';

export default function AdminNotice({
  message,
  error = false,
  onDismiss,
}: {
  message: string;
  error?: boolean;
  onDismiss: () => void;
}) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!message) return;
    const element = notice.current;
    element?.showPopover();
    const timeout = window.setTimeout(onDismiss, error ? 9000 : 5500);
    return () => {
      window.clearTimeout(timeout);
      if (element?.isConnected && element.matches(':popover-open')) element.hidePopover();
    };
  }, [message, error, onDismiss]);

  if (!message) return null;
  return (
    <div ref={notice} popover="manual" className={styles.notice} role={error ? 'alert' : 'status'}>
      <div className="flex items-start gap-3">
        <img src={ASSETS.ctiksLogo} alt="CTIKS" width={48} height={48} className={styles.logo} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ctiks-maroon">{error ? 'Please try again' : 'Updated'}</p>
          <p className="mt-1 text-sm leading-6 text-[#655746] [overflow-wrap:anywhere]">{message}</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className={styles.close}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
