import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import type { Programme } from '../types';

/** One outlined programme block with alternating copy and photograph. */
type ProgrammeBlockProps = Programme & { reverse?: boolean };

export default function ProgrammeBlock({
  title, body, image, imageAlt, href, reverse,
}: ProgrammeBlockProps) {
  return (
    <Reveal
      className="mx-auto grid max-w-shell grid-cols-1 overflow-hidden rounded-2xl border border-ctiks-red md:grid-cols-[minmax(0,47.5%)_minmax(0,52.5%)]"
    >
      <div className={`flex flex-col items-start justify-center gap-6 px-6 py-8 md:gap-8 md:px-8 md:py-10 lg:px-12 lg:py-14 ${reverse ? 'md:order-2' : ''}`}>
        <div className="flex flex-col gap-[22px]">
          <h3 data-reveal-title className="font-body text-[20px] md:text-[24px] font-semibold leading-[30px] md:leading-[33.6px] text-ctiks-red lg:text-[28px]">
            {title}
          </h3>
          <p data-reveal-body className="max-w-[523px] font-body text-[16px] leading-[26px] md:text-[18px] md:leading-[30px] text-ctiks-red lg:text-[22px] lg:leading-[33.6px]">
            {body}
          </p>
        </div>
        <div data-reveal-action>
          <Button href={href}>Know more</Button>
        </div>
      </div>

      <div className={`flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-[30px] ${reverse ? 'md:order-1 md:border-r' : 'md:border-l'} md:border-ctiks-red`}>
        <div data-reveal-media className="w-full max-w-[636px] overflow-hidden">
          <img
            data-reveal-photo
            src={image}
            alt={imageAlt}
            width={636}
            height={423}
            className="aspect-[636/423] w-full object-cover"
          />
        </div>
      </div>
    </Reveal>
  );
}
