import Button from '../ui/Button';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

/**
 * One outlined programme block: copy on the left, photograph on the right,
 * separated by a vertical rule. The rule is a real border on the grid gap,
 * so it collapses cleanly when the block stacks on narrow screens.
 */
export default function ProgrammeBlock({ title, body, image, imageAlt, href, reverse }) {
  const [ref, isVisible] = useIntersectionObserver({ triggerOnce: true, threshold: 0.15 });

  return (
    <article 
      ref={ref}
      className={`mx-auto grid max-w-shell grid-cols-1 border border-ctiks-red md:grid-cols-[minmax(0,47.5%)_minmax(0,52.5%)] transition-all duration-[1200ms] ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
      }`}
    >
      <div className={`flex flex-col items-start justify-center gap-6 px-6 py-8 md:gap-8 md:px-8 md:py-10 lg:px-12 lg:py-14 ${reverse ? 'md:order-2' : ''}`}>
        <div className="flex flex-col gap-[22px]">
          <h3 className="font-body text-[20px] md:text-[24px] font-semibold leading-[30px] md:leading-[33.6px] text-ctiks-red lg:text-[28px]">
            {title}
          </h3>
          <p className="max-w-[523px] font-body text-[16px] leading-[26px] md:text-[18px] md:leading-[30px] text-ctiks-red lg:text-[22px] lg:leading-[33.6px]">
            {body}
          </p>
        </div>
        <Button href={href}>Know more</Button>
      </div>

      <div className={`flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-[30px] ${reverse ? 'md:order-1 md:border-r' : 'md:border-l'} md:border-ctiks-red`}>
        <img
          src={image}
          alt={imageAlt}
          width={636}
          height={423}
          className="aspect-[636/423] w-full max-w-[636px] object-cover"
        />
      </div>
    </article>
  );
}
