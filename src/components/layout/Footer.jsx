import { FOOTER_COLUMNS } from '../../data/homepage';
import { ASSETS } from '../../assets/assets';

function SocialIcon({ d }) {
  return (
    <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-ctiks-red text-white hover:bg-ctiks-maroon transition-colors">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d={d} />
      </svg>
    </a>
  );
}

function Column({ heading, links }) {
  return (
    <div className="flex flex-col gap-5 min-w-[140px]">
      <h3 className="border-b border-white/20 pb-3 font-display text-[13px] font-bold uppercase tracking-[2.5px] text-ctiks-gold">
        {heading}
      </h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="font-body text-[14px] text-white/80 hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer>
      {/* Top Section - Connect with Us */}
      <div className="relative isolate pt-16 pb-24 lg:pt-24 lg:pb-32 bg-ctiks-cream overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage: `url(${ASSETS.footerImage.path})`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        <div className="relative z-10 mx-auto max-w-shell px-6">
          <div className="flex flex-col items-center text-center gap-12 lg:flex-row lg:text-left lg:justify-between">
            
            {/* Left: Text */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <h2 className="font-display text-[28px] font-bold uppercase leading-[33.6px] tracking-[2.8px] text-ctiks-red">
                Connect with Us
              </h2>
              <div className="h-0.5 w-12 bg-ctiks-gold" />
              <p className="font-body text-lg text-ctiks-red">
                Updates, events, and insights <br className="hidden sm:block" /> from CTIKS, IIT Bombay.
              </p>
            </div>

            {/* Middle: Social Icons */}
            <div className="flex justify-center gap-4">
              <SocialIcon d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
              <SocialIcon d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              <SocialIcon d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              <SocialIcon d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.07M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </div>

            {/* Right: Knowledge in Continuity */}
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:border-l lg:border-ctiks-gold lg:pl-10">
              <div className="font-motto flex flex-col items-center lg:items-start text-2xl font-bold text-ctiks-red leading-tight">
                Knowledge
                <br />
                inContinuity
                <div className="h-0.5 w-10 bg-ctiks-gold mt-3" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Section - Dark Red (Enhanced Layout) */}
      <div className="bg-ctiks-red">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-16">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 pb-14">
            
            {/* Left: IITB Logo */}
            <div className="flex-shrink-0 lg:w-1/4">
              <img src={ASSETS.iitbLogo.path} alt="IIT Bombay Logo" className="h-[100px] lg:h-[140px] object-contain opacity-90 hover:opacity-100 transition-opacity" />
            </div>

            {/* Middle: Links Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12 lg:gap-x-24 w-full lg:w-1/2 justify-items-start lg:justify-items-center">
              {FOOTER_COLUMNS.map((col) => (
                <Column key={col.heading} {...col} />
              ))}
            </div>

            {/* Right: Spacer for centering */}
            <div className="hidden lg:block lg:w-1/4"></div>

          </div>

          <div className="h-px w-full bg-white/10" />

          {/* Copyright */}
          <div className="flex justify-center pb-8 pt-6">
            <p className="text-center font-body text-[13px] text-white/50 tracking-wide">
              © 2026 Centre for Traditional Indian Knowledge and Skills, IIT Bombay. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
