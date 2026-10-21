import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import { ASSETS } from '@/config/assets';
import type { PublicActivity } from '@/features/activities/types';
import { eventSchedule } from '@/features/activities/dates';
import styles from './UpcomingEvents.module.css';

type TicketEvent = Pick<
  PublicActivity,
  'id' | 'title' | 'description' | 'eventStartAt' | 'eventEndAt' | 'registrationUrl' | 'linkLabel'
>;

const ticketDateFormat = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

function EventTicket({ event }: { event: TicketEvent }) {
  const schedule = eventSchedule(event.eventStartAt, event.eventEndAt);
  const dateParts = event.eventStartAt
    ? Object.fromEntries(
        ticketDateFormat.formatToParts(new Date(event.eventStartAt)).map(({ type, value }) => [type, value]),
      )
    : null;
  const timeParts = schedule?.time.replace(/ IST$/, '').split(' – ') ?? [];
  const href = event.registrationUrl || '/events';

  return (
    <article className="relative h-[350px] shrink-0 basis-[86%] snap-start overflow-hidden rounded-xl sm:basis-[47%] lg:basis-[31%] xl:basis-[calc((100%-3rem)/4)]">
      <img src={ASSETS.eventsPanel} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div className="relative flex h-full flex-col px-5 pb-6 pt-7 sm:px-6">
        <div className="flex items-center gap-3 rounded-xl border border-[#efd5b8] bg-[#fff3e4] px-3 py-2.5">
          <time
            dateTime={event.eventStartAt ?? undefined}
            aria-label={schedule?.date}
            className="relative flex h-[72px] w-[64px] shrink-0 flex-col rounded-md border border-[#d6aa77] bg-white text-center shadow-[0_3px_0_#e7cfb4,0_5px_10px_rgba(103,53,23,.13)]"
          >
            <span
              aria-hidden="true"
              className="absolute -top-1.5 left-3 h-3 w-2 rounded-full border-2 border-[#b49a7b] bg-[#f8e9d5]"
            />
            <span
              aria-hidden="true"
              className="absolute -top-1.5 right-3 h-3 w-2 rounded-full border-2 border-[#b49a7b] bg-[#f8e9d5]"
            />
            <span className="rounded-t-[5px] bg-ctiks-maroon py-1 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              {dateParts?.month ?? 'Soon'}
            </span>
            <strong className="font-display text-[27px] font-semibold leading-[30px] text-ctiks-maroon">
              {dateParts?.day ?? '—'}
            </strong>
            <span className="font-body text-[10px] font-semibold text-[#805744]">
              {dateParts?.year ?? ''}
            </span>
          </time>
          <span aria-hidden="true" className="h-12 w-px shrink-0 bg-[#d8b68f]" />
          <div className="flex min-w-0 flex-1 flex-col justify-center font-body text-ctiks-maroon">
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#91684f]">
              Time (IST)
            </span>
            {timeParts[1] ? (
              <p className="mt-1.5 whitespace-nowrap text-center text-[11px] font-semibold leading-tight sm:text-[12px]">
                {timeParts[0]} <span className="mx-0.5 font-normal text-[#b68155]">–</span> {timeParts[1]}
              </p>
            ) : (
              <p className="mt-1.5 text-center text-[11px] font-semibold leading-tight sm:text-[12px]">
                {timeParts[0] ?? 'Details to follow'}
              </p>
            )}
            {schedule?.date.includes('–') && (
              <p className="mt-1 text-center text-[10px] leading-tight">{schedule.date}</p>
            )}
          </div>
        </div>
        <h3 className="mt-4 line-clamp-3 font-display text-[22px] font-semibold leading-[1.18] text-ctiks-red [overflow-wrap:anywhere]">
          {event.title}
        </h3>
        <p className="mt-2 line-clamp-3 whitespace-pre-line font-body text-[13px] leading-[1.5] text-[#805744] [overflow-wrap:anywhere]">
          {event.description}
        </p>
        <div className="mt-auto pt-4" />
        <Link
          href={href}
          {...(event.registrationUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="group relative inline-flex h-10 w-[172px] self-center items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctiks-red"
        >
          <img src={ASSETS.buttonRed} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <span className="relative flex items-center gap-1.5 font-body text-[12px] font-semibold uppercase">
            {event.registrationUrl ? event.linkLabel || 'More info' : 'View events'}
            <img
              src={ASSETS.arrowWhite}
              alt=""
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      </div>
    </article>
  );
}

export default function UpcomingEvents({ events }: { events: PublicActivity[] }) {
  const canViewMore = events.length > 4;
  const viewMoreContent = (
    <>
      <img src={ASSETS.buttonRed} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <span className="relative flex items-center gap-1.5 font-body text-[13px] font-semibold uppercase">
        View more
        <img
          src={ASSETS.arrowWhite}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </>
  );
  const viewMoreClassName =
    'group relative inline-flex h-11 w-[190px] items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ctiks-red';

  return (
    <section
      aria-labelledby="upcoming-events"
      className="relative isolate overflow-hidden pb-32 pt-16 sm:pb-44"
    >
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
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[370px] w-full object-cover object-bottom"
      />

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <SectionHeading icon="iconEvents" iconSize={{ width: 80, height: 48 }} rule>
          <span id="upcoming-events">Upcoming events</span>
        </SectionHeading>
        {events.length > 1 && (
          <p
            className={`mt-5 text-center font-body text-xs font-semibold text-ctiks-maroon ${events.length <= 4 ? 'xl:hidden' : ''}`}
          >
            <span className="sm:hidden">Swipe to see more events →</span>
            <span className="hidden sm:inline">Scroll to see more events →</span>
          </p>
        )}
        {events.length ? (
          <div
            role="region"
            aria-label="Upcoming event cards"
            className={`${styles.track} flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red ${events.length > 1 ? 'mt-5' : 'mt-10'} ${events.length < 4 ? 'xl:justify-center' : ''}`}
            tabIndex={0}
          >
            {events.map((event) => (
              <EventTicket key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="mt-10 bg-[#ffe8c8] px-6 py-16 text-center font-body text-[20px] font-semibold text-ctiks-maroon">
            Upcoming events will be announced here.
          </div>
        )}
        {canViewMore && (
          <div className="mt-3 flex justify-center">
            <Link href="/events" className={viewMoreClassName}>
              {viewMoreContent}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
