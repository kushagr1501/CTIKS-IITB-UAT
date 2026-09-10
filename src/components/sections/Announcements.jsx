import Button from '../ui/Button';
import Chip from '../ui/Chip';
import SectionHeading from '../ui/SectionHeading';
import { ANNOUNCEMENTS } from '../../data/homepage';

function Row({ title, body, date, href }) {
  return (
    <article className="flex flex-col gap-6 rounded-[10px] bg-ctiks-sand px-6 py-[30px] lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-[140px] lg:px-10">
      <div className="flex max-w-[635px] flex-col gap-3">
        <h3 className="font-body text-[20px] font-semibold leading-[33.6px] text-ctiks-red sm:text-[24px]">
          {title}
        </h3>
        <p className="font-body text-[16px] leading-[26px] text-ctiks-red sm:text-[18px]">
          {body}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-6">
        <Chip icon="iconCalendar">{date}</Chip>
        <Button variant="redOnSand" href={href}>
          Register
        </Button>
      </div>
    </article>
  );
}

export default function Announcements() {
  return (
    <section aria-labelledby="recent-announcements">
      <div className="h-[30px] w-full bg-ctiks-gold" />

      <div className="mx-auto flex max-w-shell flex-col items-center gap-[42px] px-6 py-[60px]">
        <SectionHeading
          icon="iconAnnouncements"
          iconSize={{ width: 42, height: 38 }}
        >
          <span id="recent-announcements">Recent announcements</span>
        </SectionHeading>

        <div className="flex w-full flex-col gap-[18px]">
          {ANNOUNCEMENTS.map((a) => (
            <Row key={a.title} {...a} />
          ))}
        </div>
      </div>
    </section>
  );
}
