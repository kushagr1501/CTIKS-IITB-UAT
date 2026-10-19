import type { ReactNode } from 'react';
import { ASSETS } from '@/config/assets';

export default function PageHero({
  title,
  image,
  children,
}: {
  title: string;
  image: string;
  children: ReactNode;
}) {
  return (
    <section className="relative isolate flex min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] flex-col items-center justify-center gap-4 sm:gap-6 overflow-hidden border-b-2 border-ctiks-maroon px-4 sm:px-8 md:px-16 py-16 sm:py-24 lg:py-[140px] text-center">
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[20%_center] sm:object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(170,19,19,0.2) 0%, rgba(170,19,19,0.92) 100%)',
        }}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-[22px]">
        <img
          src={ASSETS.peopleHeroIcon}
          alt=""
          aria-hidden="true"
          width={42}
          height={38}
          className="h-[32px] w-[36px] sm:h-[38px] sm:w-[42px] object-contain drop-shadow-sm"
        />
        <h1 className="font-display text-[26px] font-bold uppercase leading-tight tracking-[2.5px] text-white sm:text-[32px] md:text-[36px] sm:tracking-[3.6px] drop-shadow">
          {title}
        </h1>
      </div>
      <p className="max-w-[800px] font-body text-[16px] font-medium leading-[1.5] text-white sm:text-[18px] md:text-[20px] drop-shadow-sm px-2">
        {children}
      </p>
    </section>
  );
}
