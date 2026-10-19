import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import SectionHeading from '@/components/ui/SectionHeading';
import Link from 'next/link';
import type { PublicActivity } from '@/features/activities/types';
import { formatActivityDate } from '@/features/activities/dates';

function AnnouncementRow({ title, description, createdAt, registrationUrl, linkLabel }: PublicActivity) {
  return (
    <article className="flex flex-col gap-6 rounded-[10px] bg-ctiks-sand px-6 py-[30px] lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-[140px] lg:px-10">
      <div className="flex min-w-0 max-w-[635px] flex-col gap-3">
        <h3 className="font-body text-[20px] font-semibold leading-[33.6px] text-ctiks-red [overflow-wrap:anywhere] sm:text-[24px]">
          {title}
        </h3>
        <p className="line-clamp-3 whitespace-pre-line font-body text-[16px] leading-[26px] text-ctiks-red [overflow-wrap:anywhere] sm:text-[18px]">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-6">
        <Chip icon="iconCalendar">{formatActivityDate(createdAt)}</Chip>
        <Button
          variant="redOnSand"
          href={registrationUrl || '/announcements'}
          {...(registrationUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {registrationUrl ? linkLabel || 'More info' : 'View notices'}
        </Button>
      </div>
    </article>
  );
}

export default function Announcements({ announcements }: { announcements: PublicActivity[] }) {
  return (
    <section aria-labelledby="recent-announcements">
      <div className="h-[30px] w-full bg-ctiks-gold" />

      <div className="mx-auto flex max-w-shell flex-col items-center gap-[42px] px-6 py-[60px]">
        <SectionHeading icon="iconAnnouncements" iconSize={{ width: 42, height: 38 }}>
          <span id="recent-announcements">Recent announcements</span>
        </SectionHeading>

        <div className="flex w-full flex-col gap-[18px]">
          {announcements.map((a) => (
            <AnnouncementRow key={a.id} {...a} />
          ))}
          {!announcements.length && (
            <p className="rounded-[10px] bg-ctiks-sand px-6 py-10 text-center text-ctiks-maroon">
              New announcements will appear here as they are added.
            </p>
          )}
        </div>
        <Link
          href="/announcements"
          className="text-sm font-semibold text-ctiks-maroon underline underline-offset-4"
        >
          All announcements
        </Link>
      </div>
    </section>
  );
}
