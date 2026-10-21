import type { ReactNode } from 'react';
import { ASSETS } from '@/config/assets';

export default function ConfirmationHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 pt-2">
        <span aria-hidden="true" className="mb-4 block h-1 w-10 rounded bg-ctiks-gold" />
        <h2 id={id} className="text-xl font-semibold leading-7 text-ctiks-maroon">
          {children}
        </h2>
      </div>
      <img
        src={ASSETS.ctiksLogo}
        alt="CTIKS"
        width={88}
        height={88}
        className="h-20 w-20 shrink-0 object-contain sm:h-[88px] sm:w-[88px]"
      />
    </div>
  );
}
