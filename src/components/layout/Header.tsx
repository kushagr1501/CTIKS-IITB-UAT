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
            width={120}
            height={120}
            className="h-[45px] w-[45px] sm:h-[70px] sm:w-[70px] md:h-[100px] md:w-[100px] object-contain"
          />
        </a>

        <div className="flex flex-1 flex-col items-center gap-1.5 md:gap-2">
          <Link
            href="/"
            className="w-full text-center uppercase text-ctiks-maroon"
          >
            <span className="block whitespace-nowrap font-display text-[clamp(8px,2vw,26px)] font-semibold leading-tight tracking-tight text-ctiks-maroon">
              Centre for Traditional Indian Knowledge and Skills
            </span>
          </Link>

          <div className="relative h-[24px] w-[120px] sm:h-[30px] sm:w-[150px] md:h-[42px] md:w-[204px] mx-auto mt-1">
            <img
              src={ASSETS.iitbPill}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] sm:text-[12px] md:text-[19px] font-semibold uppercase tracking-widest md:tracking-[2.3px] text-ctiks-gold">
              IIT Bombay
            </span>
          </div>
        </div>

        <Link href="/" className="shrink-0">
          <img
            src={ASSETS.ctiksLogo}
            alt="Centre for Traditional Indian Knowledge and Skills"
            width={140}
            height={140}
            className="h-[50px] w-[50px] sm:h-[80px] sm:w-[80px] md:h-[110px] md:w-[110px] object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
