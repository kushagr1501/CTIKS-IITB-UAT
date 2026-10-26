import type { Metadata } from 'next';
import InteriorHero from '@/components/ui/InteriorHero';
import Reveal from '@/components/ui/Reveal';
import ProgrammeAction from '@/features/academics/components/ProgrammeAction';
import { MSC_DISCIPLINES } from '@/features/academics/msc-content';
import { ASSETS } from '@/config/assets';

export const metadata: Metadata = {
  title: 'Academics',
  description: 'Explore the doctoral and master’s programmes at CTIKS, IIT Bombay.',
};

type ProgrammeCard = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  href?: string;
};

const programmes: ProgrammeCard[] = [
  {
    eyebrow: 'Doctoral Programme',
    title: 'Ph.D. Programme',
    description:
      'Advanced doctoral research driving original contribution, interdisciplinary collaboration, and academic innovation.',
    image: ASSETS.programmePhd,
    alt: 'Research notebooks and a laptop on a desk',
    href: '/academics/phd',
  },
  ...MSC_DISCIPLINES.map((discipline) => ({
    eyebrow: 'Master’s Programme',
    title: `M.Sc. in ${discipline.title}`,
    description: discipline.about,
    image: discipline.cardImage,
    alt: discipline.cardImageAlt,
    href: `/academics/msc/${discipline.slug}`,
  })),
  {
    eyebrow: 'Undergraduate Programme',
    title: 'UG Minor',
    description: 'Details of the UG Minor will be announced here when available.',
    image: ASSETS.programmeOutreach,
    alt: 'Students studying and collaborating in a classroom',
  },
];

export default function AcademicsPage() {
  return (
    <>
      <InteriorHero title="Academics Programmes">
        Nurturing deep knowledge through rigorous research, interdisciplinary
        learning, and the living traditions of India.
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
                className={`flex min-w-0 flex-col items-start justify-center gap-6 px-5 py-7 sm:px-8 lg:py-8 ${index % 2 === 1 ? 'md:order-2' : ''}`}
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
                {programme.href ? (
                  <ProgrammeAction href={programme.href} />
                ) : (
                  <span className="rounded-full border border-ctiks-red/30 bg-[#f9ebd7] px-4 py-2 font-body text-sm font-semibold text-ctiks-maroon">
                    Coming soon
                  </span>
                )}
              </div>
              <div
                className={`flex items-center justify-center border-t border-ctiks-red p-4 sm:p-6 md:min-h-[340px] md:border-t-0 ${index % 2 === 1 ? 'md:order-1 md:border-r' : 'md:border-l'}`}
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
