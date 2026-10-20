import type { Metadata } from 'next';
import InteriorHero from '@/components/ui/InteriorHero';
import Reveal from '@/components/ui/Reveal';
import ProgrammeAction from '@/features/academics/components/ProgrammeAction';
import { ASSETS } from '@/config/assets';

export const metadata: Metadata = {
  title: 'Academics',
  description: 'Explore the doctoral and master’s programmes at CTIKS, IIT Bombay.',
};

const programmes = [
  {
    eyebrow: 'Doctoral Programme',
    title: 'Ph.D. Programme',
    description:
      'Advanced doctoral research driving original contribution, interdisciplinary collaboration, and academic innovation.',
    image: ASSETS.programmePhd,
    alt: 'Research notebooks and a laptop on a desk',
    href: '/academics/phd',
  },
  {
    eyebrow: 'Master’s Programme',
    title: 'M.Sc. Programme',
    description:
      'A multidisciplinary master’s programme offering two specialisations—Indian Mathematics & Astronomy and Yoga & Wellness Science.',
    image: ASSETS.programmeOutreach,
    alt: 'Students studying and collaborating in a classroom',
    href: '/academics/msc',
  },
];

export default function AcademicsPage() {
  return (
    <>
      <InteriorHero title="Academics Programmes" image={ASSETS.heroBackdrop}>
        Nurturing deep knowledge through rigorous research, interdisciplinary
        <br className="hidden sm:block" /> learning, and the living traditions of India.
      </InteriorHero>
      <section aria-label="Academic programmes" className="relative isolate px-4 py-8 sm:px-6 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-cover opacity-30"
          style={{ backgroundImage: `url(${ASSETS.paperTexture})` }}
        />
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 sm:gap-10">
          {programmes.map((programme, index) => (
            <Reveal
              key={programme.title}
              variant="arch"
              className="grid min-w-0 grid-cols-1 rounded-xl border border-ctiks-red bg-[#fffaf2] md:grid-cols-2"
            >
              <div
                data-reveal-content
                className={`flex min-w-0 flex-col items-start justify-center gap-6 px-5 py-7 sm:px-8 lg:py-8 ${index === 1 ? 'md:order-2' : ''}`}
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="mb-1 text-[12px] font-medium uppercase leading-[1.4] lg:text-[13px]">
                      {programme.eyebrow}
                    </p>
                    <h2 className="text-[24px] font-semibold leading-[1.4] lg:text-[28px]">
                      {programme.title}
                    </h2>
                  </div>
                  <p className="max-w-[440px] text-[16px] leading-[1.65] text-[#787776] lg:text-[17px]">
                    {programme.description}
                  </p>
                </div>
                <ProgrammeAction href={programme.href} />
              </div>
              <div
                className={`flex items-center justify-center border-t border-ctiks-red p-4 sm:p-6 md:min-h-[340px] md:border-t-0 ${index === 1 ? 'md:order-1 md:border-r' : 'md:border-l'}`}
              >
                <div data-reveal-media className="w-full">
                  <img
                    src={programme.image}
                    alt={programme.alt}
                    width={636}
                    height={419}
                    className="aspect-[636/419] w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
