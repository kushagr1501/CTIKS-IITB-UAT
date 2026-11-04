import Link from 'next/link';
import { ASSETS } from '@/config/assets';

/**
 * Masthead: IIT Bombay crest, the centre's name, the CTIKS seal.
 * The "IIT BOMBAY" lockup sits on an exported 257 x 53 SVG tab.
 */
export default function Header() {
  return (
    <header className="bg-ctiks-cream">
      <div className="mx-auto flex max-w-masthead flex-row items-center justify-between gap-2 px-3 py-[20px] md:gap-8 md:px-6 md:py-4">
        <a href="https://www.iitb.ac.in/" className="shrink-0">
          <img
            src={ASSETS.iitbLogo}
            alt="Indian Institute of Technology Bombay"
            width={144}
            height={144}
            className="h-[54px] w-[54px] sm:h-[84px] sm:w-[84px] md:h-[120px] md:w-[120px] object-contain"
          />
        </a>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 md:gap-2">
          <Link
            href="/"
            className="w-full text-center uppercase text-ctiks-maroon"
          >
            <span className="block font-display text-[10px] font-semibold leading-tight tracking-tight text-ctiks-maroon sm:text-[14px] md:text-[20px] lg:whitespace-nowrap xl:text-[26px]">
              Centre for Traditional Indian Knowledge and Skills
            </span>
          </Link>

          <div className="relative mx-auto mt-1 h-[25px] w-[132px] sm:h-[33px] sm:w-[166px] md:h-[45px] md:w-[228px]">
            <img
              src={ASSETS.iitbPill}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] sm:text-[12px] md:text-[19px] font-semibold uppercase tracking-widest md:tracking-[2.3px] text-ctiks-maroon">
              IIT Bombay
            </span>
          </div>
        </div>

        <Link href="/" className="shrink-0">
          <img
            src={ASSETS.ctiksLogo}
            alt="Centre for Traditional Indian Knowledge and Skills"
            width={168}
            height={168}
            className="h-[60px] w-[60px] sm:h-[96px] sm:w-[96px] md:h-[132px] md:w-[132px] object-contain"
          />
        </Link>
      </div>
    </header>
  );
}
