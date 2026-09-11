import { ASSETS } from '../../assets/assets';

/**
 * About-page hero banner.
 * Red-gradient-over-photograph treatment, ornament + title, one line of copy.
 */
export default function AboutHero() {
  return (
    <section className="relative isolate flex min-h-[400px] sm:min-h-[500px] flex-col items-center justify-center gap-6 overflow-hidden border-b-2 border-ctiks-maroon px-6 py-[100px] sm:py-[140px] text-center sm:px-20">
      <img
        src={ASSETS.aboutHeroBackdrop.path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[20%_center] sm:object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(170,19,19,0.2) 0%, rgba(170,19,19,0.92) 100%)' }}
      />

      <div className="flex flex-col items-center gap-[22px]">
        <img
          src={ASSETS.aboutHeroIcon.path}
          alt=""
          aria-hidden="true"
          width={42}
          height={38}
          className="h-[38px] w-[42px] object-contain drop-shadow-sm"
        />
        <h1 className="font-display text-[28px] font-bold uppercase leading-tight tracking-[3.6px] text-white sm:text-[36px] drop-shadow">
          About Us
        </h1>
      </div>

      <p className="max-w-[800px] font-body text-[18px] font-medium leading-[1.5] text-white sm:text-[20px] drop-shadow-sm">
        Nurturing scholarly study, rigorous reconstruction, and practical contemporary
        integration of India's intellectual and artisanal inheritance.
      </p>
    </section>
  );
}
