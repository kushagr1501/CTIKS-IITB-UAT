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
      <InteriorHero title="Contact us" image="/assets/figma/contact-hero.png" contact>
        We welcome your queries, collaborations, and suggestions.
        <br className="hidden sm:block" /> Get in touch with the Centre for Traditional Indian Knowledge and
        Skills (CTIKS), IIT Bombay.
      </InteriorHero>
      <div className="mx-auto flex max-w-[1168px] flex-col gap-7 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <section className="border border-ctiks-maroon/40 bg-white p-6 shadow-[0_4px_8px_rgba(130,13,13,.04)] lg:p-8">
            <PanelHeading>Office Address</PanelHeading>
            <div className="flex flex-col gap-5">
              <ContactRow icon="location">
                <address className="not-italic">
                  Centre for Traditional Indian Knowledge and Skills (CTIKS) IIT Bombay, Powai, Mumbai,
                  Maharashtra – 400076, India
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
                <p>+91-22-2576-XXXX</p>
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
        <nav aria-label="Explore CTIKS" className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {[
            { eyebrow: 'Meet our', title: 'People', icon: 'people', href: '/people' },
            { eyebrow: 'Explore our', title: 'Research', icon: 'book', href: '/research' },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-between gap-4 border border-ctiks-maroon/40 p-5 shadow-[0_4px_16px_rgba(130,13,13,.04)] transition-colors hover:bg-ctiks-sand/40 lg:gap-8 lg:p-6"
            >
              <div className="flex items-center gap-5">
                <span className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full bg-[#faecd9] lg:h-[70px] lg:w-[70px]">
                  <img src={`/assets/figma/${item.icon}.svg`} alt="" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[12px] font-bold uppercase leading-[1.4] lg:text-[14px]">
                    {item.eyebrow}
                  </span>
                  <span className="block text-[24px] font-semibold leading-[1.4] lg:text-[28px]">
                    {item.title}
                  </span>
                </span>
              </div>
              <img src="/assets/figma/chevron.svg" width={48} height={48} alt="" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
