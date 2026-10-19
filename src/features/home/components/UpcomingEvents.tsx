import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import SectionHeading from '@/components/ui/SectionHeading';
import { ASSETS } from '@/config/assets';
import type { PublicActivity } from '@/features/activities/types';
import { eventSchedule } from '@/features/activities/dates';

/**
 * Upcoming event, set on a Figma-drawn panel (an SVG with a torn paper edge)
 * over a wide line-drawing of the campus. Both are exported assets.
 */
export default function UpcomingEvents({ event }: { event: PublicActivity | null }) {
  const schedule = event ? eventSchedule(event.eventStartAt, event.eventEndAt) : null;

  return (
    <section aria-labelledby="upcoming-events" className="relative isolate">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 opacity-30 mix-blend-multiply"
        style={{
          backgroundImage: `url(${ASSETS.paperTexture})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat-y',
        }}
      />
      <img
        src={ASSETS.eventsBackdrop}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[628px] w-full object-cover object-bottom"
      />

      <div className="flex justify-center px-6 pt-[70px] pb-[200px] sm:pb-[350px]">
        <div className="relative w-full max-w-[637px] lg:aspect-[637/578]">
          <img
            src={ASSETS.eventsPanel}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />

          <div className="relative flex flex-col items-center gap-10 px-8 py-[55px] sm:px-[54px]">
            <SectionHeading icon="iconEvents" iconSize={{ width: 80, height: 48 }} rule>
              <span id="upcoming-events">Upcoming events</span>
            </SectionHeading>

            <div className="flex flex-col items-center gap-[22px]">
              <div className="flex flex-col gap-3 text-center">
                <h3 className="font-body text-[20px] font-semibold leading-[33.6px] text-ctiks-red [overflow-wrap:anywhere] sm:text-[24px]">
                  {event?.title ?? 'More gatherings ahead'}
                </h3>
                <p className="line-clamp-4 whitespace-pre-line font-body text-[16px] leading-[26px] text-ctiks-red [overflow-wrap:anywhere] sm:text-[18px]">
                  {event?.description ??
                    'New events will be shared here. Explore our events for more from CTIKS.'}
                </p>
              </div>

              {schedule && (
                <div className="flex flex-wrap items-center justify-center gap-[7px]">
                  <Chip icon="iconCalendar">{schedule.date}</Chip>
                  <Chip icon="iconClock">{schedule.time}</Chip>
                </div>
              )}
              {event?.venue && (
                <p className="text-center text-sm text-ctiks-maroon [overflow-wrap:anywhere]">
                  {event.venue}
                </p>
              )}
            </div>

            <Button
              href={event?.registrationUrl || '/events'}
              {...(event?.registrationUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {event?.registrationUrl ? event.linkLabel || 'More info' : 'View events'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
