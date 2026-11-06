import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import InteriorHero from '@/components/ui/InteriorHero';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact CTIKS at IIT Bombay and find directions to our Powai campus.',
};

function ContactRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#faecd9]">
        <img src={`/assets/figma/${icon}.svg`} alt="" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-[15px] leading-[1.65] text-[#4a4235] lg:text-[16px]">
        {children}
      </div>
    </div>
  );
}

function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-1 text-[24px] font-semibold leading-[1.4] tracking-[0.5px] text-ctiks-maroon lg:text-[30px]">
        {children}
      </h2>
      <div aria-hidden="true" className="h-1 w-11 bg-[#fbb841]" />
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <InteriorHero title="Contact us">
        CTIKS welcomes collaborations with like-minded organisations and individuals. Kindly get in touch with us to explore opportunities to work together.
      </InteriorHero>
      <div className="mx-auto flex max-w-[1168px] flex-col gap-7 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <section className="border border-ctiks-maroon/40 bg-white p-6 shadow-[0_4px_8px_rgba(130,13,13,.04)] lg:p-8">
            <PanelHeading>Office Address</PanelHeading>
            <div className="flex flex-col gap-5">
              <ContactRow icon="location">
                <address className="not-italic">
                  Centre for Traditional Indian Knowledge and Skills (CTIKS), Second Floor, DSSE,
                  IIT Bombay, Powai, Mumbai, Maharashtra – 400076, India
                </address>
              </ContactRow>
              <ContactRow icon="email">
                <strong className="block text-ctiks-maroon">Email:</strong>
                <a href="mailto:office.ctiks@iitb.ac.in" className="break-words hover:underline">
                  office.ctiks[at]iitb.ac.in
                </a>
              </ContactRow>
              <ContactRow icon="phone">
                <strong className="block text-ctiks-maroon">Phone:</strong>
                <p>+91-22-2576-5151</p>
              </ContactRow>
            </div>
          </section>
          <section className="border border-ctiks-maroon/40 bg-white p-6 shadow-[0_4px_8px_rgba(130,13,13,.04)] lg:p-8">
            <PanelHeading>How to Reach</PanelHeading>
            <p className="mb-5 text-[15px] leading-[1.65] text-[#4a4235] lg:text-[16px]">
              CTIKS is located within the IIT Bombay campus in Powai. The campus is well-connected to major
              transit hubs:
            </p>
            <div className="flex flex-col gap-5">
              <ContactRow icon="plane">
                <strong className="block text-ctiks-maroon">By Air:</strong>
                <p>Chhatrapati Shivaji Maharaj International Airport (approx. 8 km).</p>
              </ContactRow>
              <ContactRow icon="train">
                <strong className="block text-ctiks-maroon">By Rail:</strong>
                <p>Kanjurmarg (Central Line) or Andheri (Western Line) are the nearest stations.</p>
              </ContactRow>
            </div>
          </section>
        </div>
        <a
          href="https://www.google.com/maps/search/?api=1&query=IIT+Bombay+Powai+Mumbai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open IIT Bombay campus in Google Maps"
          className="relative block h-[260px] overflow-hidden border border-ctiks-maroon/40 bg-black sm:h-[340px] lg:h-[400px]"
        >
          <img
            src="/assets/figma/campus-map.png"
            alt="Map showing IIT Bombay, Powai Lake, and surrounding campus landmarks"
            width={1717}
            height={668}
            className="absolute left-1/2 top-1/2 h-[111.33%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 opacity-80"
          />
        </a>
        <nav aria-label="Explore CTIKS" className="grid gap-4 md:grid-cols-2">
          {[
            { eyebrow: 'Meet our', title: 'People', icon: 'people', href: '/people' },
            { eyebrow: 'Explore our', title: 'Research', icon: 'book', href: '/research' },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-center gap-4 rounded-lg border border-[#e7cda9] bg-[#f7e3c7] px-4 py-4 transition-colors hover:border-ctiks-maroon/40 hover:bg-[#f3d8b2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ctiks-red sm:px-5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ctiks-red/25 bg-[#fff2df]">
                <img src={`/assets/figma/${item.icon}.svg`} width={29} height={29} alt="" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#866048]">
                  {item.eyebrow}
                </span>
                <span className="block font-display text-[26px] font-semibold leading-tight text-ctiks-maroon">
                  {item.title}
                </span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ctiks-maroon text-white transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
