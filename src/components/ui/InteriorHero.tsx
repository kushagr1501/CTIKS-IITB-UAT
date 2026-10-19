import type { ReactNode } from 'react';

export default function InteriorHero({
  title,
  children,
  image,
  contact = false,
}: {
  title: string;
  children: ReactNode;
  image: string;
  contact?: boolean;
}) {
  return (
    <section className="relative isolate flex min-h-[400px] flex-col items-center justify-center overflow-hidden border-b-2 border-ctiks-maroon px-6 py-20 text-center sm:h-[500px] sm:py-0">
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className={`absolute -z-20 max-w-none object-cover ${contact ? 'left-0 top-[-6.2%] h-[158.4%] w-full object-[50%_top]' : 'left-0 top-[-1.2%] h-[106.2%] w-full'}`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(170,19,19,.2), rgba(170,19,19,.92) 75%)' }}
      />
      <div className="flex w-full flex-col items-center gap-[22px] sm:translate-y-[-10px]">
        <img src={`/assets/figma/${contact ? 'contact' : 'academics'}-lotus.svg`} alt="" aria-hidden="true" />
        <h1 className="font-display text-[28px] font-bold uppercase leading-[1.25] tracking-[3.6px] text-white sm:text-[36px]">
          {title}
        </h1>
        <div className="max-w-[1180px] font-body text-[17px] font-medium leading-[1.5] text-white sm:mt-1 sm:text-[20px]">
          {children}
        </div>
      </div>
    </section>
  );
}
