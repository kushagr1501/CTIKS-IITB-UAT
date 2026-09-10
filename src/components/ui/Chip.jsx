import { ASSETS } from '../../assets/assets';

/**
 * Pill showing a date or a time range, with a leading 32 x 32 icon.
 * `icon` takes a key from ASSETS — 'iconCalendar' or 'iconClock'.
 */
export default function Chip({ icon = 'iconCalendar', children }) {
  const src = ASSETS[icon]?.path ?? ASSETS.iconCalendar.path;

  return (
    <span className="inline-flex items-center gap-[14px] rounded-full border border-ctiks-red px-4 py-1.5">
      <img src={src} alt="" aria-hidden="true" className="h-8 w-8" />
      <span className="whitespace-nowrap font-body text-[16px] font-medium text-ctiks-red">
        {children}
      </span>
    </span>
  );
}
