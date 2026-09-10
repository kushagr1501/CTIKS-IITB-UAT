import { ASSETS } from '../../assets/assets';

/**
 * Masthead: IIT Bombay crest, the centre's name, the CTIKS seal.
 * The "IIT BOMBAY" lockup sits on an exported 257 x 53 SVG tab.
 */
export default function Header() {
  return (
    <header className="bg-ctiks-cream">
      <div className="mx-auto flex max-w-masthead flex-row items-center justify-between gap-2 px-3 py-[20px] md:gap-8 md:px-6 md:py-[30px]">
        <a href="https://www.iitb.ac.in/" className="shrink-0">
          <img
            src={ASSETS.iitbLogo.path}
            alt="Indian Institute of Technology Bombay"
            width={120}
            height={120}
            className="h-[45px] w-[45px] sm:h-[70px] sm:w-[70px] md:h-[120px] md:w-[120px] object-contain"
          />
        </a>

        <div className="flex flex-1 flex-col items-center gap-1.5 md:gap-3">
          <a href="/" className="w-full text-center uppercase text-ctiks-maroon">
            <span className="block font-display text-[10px] sm:text-[14px] md:text-[24px] font-normal tracking-wide md:tracking-[1.44px]">
              Centre for Traditional
            </span>
            <span className="block font-display text-[12px] sm:text-[16px] md:text-[34px] font-semibold leading-tight">
              Indian Knowledge and Skill
            </span>
          </a>

          <div className="relative h-[24px] w-[120px] sm:h-[30px] sm:w-[150px] md:h-[53px] md:w-[257px] mx-auto mt-1">
            <img
              src={ASSETS.iitbPill.path}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] sm:text-[12px] md:text-[24px] font-semibold uppercase tracking-widest md:tracking-[2.88px] text-ctiks-gold">
              IIT Bombay
            </span>
          </div>
        </div>

        <a href="/" className="shrink-0">
          <img
            src={ASSETS.ctiksLogo.path}
            alt="Centre for Traditional Indian Knowledge and Skills"
            width={140}
            height={140}
            className="h-[50px] w-[50px] sm:h-[80px] sm:w-[80px] md:h-[140px] md:w-[140px] object-cover"
          />
        </a>
      </div>
    </header>
  );
}
