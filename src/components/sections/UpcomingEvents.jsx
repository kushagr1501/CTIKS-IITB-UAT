import Button from '../ui/Button';
import Chip from '../ui/Chip';
import SectionHeading from '../ui/SectionHeading';
import { ASSETS } from '../../assets/assets';
import { UPCOMING_EVENT } from '../../data/homepage';

/**
 * Upcoming event, set on a Figma-drawn panel (an SVG with a torn paper edge)
 * over a wide line-drawing of the campus. Both are exported assets.
 */
export default function UpcomingEvents() {
  const event = UPCOMING_EVENT;

  return (
    <section aria-labelledby="upcoming-events" className="relative isolate">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 opacity-30 mix-blend-multiply"
        style={{
          backgroundImage: `url(${ASSETS.paperTexture.path})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat-y',
        }}
      />
      <img
        src={ASSETS.eventsBackdrop.path}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[628px] w-full object-cover object-bottom"
      />

      <div className="flex justify-center px-6 pt-[70px] pb-[200px] sm:pb-[350px]">
        <div className="relative w-full max-w-[637px] lg:aspect-[637/578]">
          <img
            src={ASSETS.eventsPanel.path}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />

          <div className="relative flex flex-col items-center gap-10 px-8 py-[55px] sm:px-[54px]">
            <SectionHeading
              icon="iconEvents"
              iconSize={{ width: 80, height: 48 }}
              rule
            >
              <span id="upcoming-events">Upcoming events</span>
            </SectionHeading>

            <div className="flex flex-col items-center gap-[22px]">
              <div className="flex flex-col gap-3 text-center">
                <h3 className="font-body text-[20px] font-semibold leading-[33.6px] text-ctiks-red sm:text-[24px]">
                  {event.title}
                </h3>
                <p className="font-body text-[16px] leading-[26px] text-ctiks-red sm:text-[18px]">
                  {event.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-[7px]">
                <Chip icon="iconCalendar">{event.date}</Chip>
                <Chip icon="iconClock">{event.time}</Chip>
              </div>
            </div>

            <Button href={event.href}>Register</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
