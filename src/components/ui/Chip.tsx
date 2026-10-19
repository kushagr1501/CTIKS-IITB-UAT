import type { ReactNode } from 'react';
import { ASSETS } from '@/config/assets';

/**
 * Pill showing a date or a time range, with a leading 32 x 32 icon.
 * `icon` takes a key from ASSETS — 'iconCalendar' or 'iconClock'.
 */
type ChipProps = {
  icon?: 'iconCalendar' | 'iconClock';
  children: ReactNode;
};

export default function Chip({ icon = 'iconCalendar', children }: ChipProps) {
  const src = ASSETS[icon];

  return (
    <span className="inline-flex max-w-full items-center gap-[14px] rounded-full border border-ctiks-red px-4 py-1.5">
      <img src={src} alt="" aria-hidden="true" className="h-8 w-8 shrink-0" />
      <span className="font-body text-[16px] font-medium text-ctiks-red">{children}</span>
    </span>
  );
}
