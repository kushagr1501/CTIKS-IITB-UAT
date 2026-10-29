import Link from 'next/link';
import SectionHero from '@/components/ui/SectionHero';
import { ASSETS } from '@/config/assets';
import { getPublicActivities, getPublicActivityCounts, type ActivityTimeFilter } from '@/server/activities/public';
import { ACTIVITY_PATHS, ACTIVITY_SECTIONS, type ActivitySection } from '../types';
import { eventSchedule, formatActivityDate } from '../dates';
import ActivitySearchForm from './ActivitySearchForm';
import ActivityDescription from './ActivityDescription';
import ActivityPoster from './ActivityPoster';
import styles from './Activities.module.css';

export type ActivitySearchParams = Promise<{ q?: string | string[]; page?: string | string[]; time?: string | string[] }>;

export default async function ActivityListing({
  section,
  searchParams,
}: {
  section?: ActivitySection;
  searchParams: ActivitySearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 200) : '';
  const requestedPage =
    typeof params.page === 'string' && /^\d{1,6}$/.test(params.page) ? Number(params.page) : 1;
  const explicitTime = params.time === 'upcoming' || params.time === 'past' || params.time === 'all' ? params.time : undefined;
  const initialTime: ActivityTimeFilter = explicitTime ?? (section === 'EVENT' ? 'upcoming' : 'all');
  let result = await getPublicActivities(section, query, requestedPage, initialTime);
  let time = initialTime;
  let fallback = false;
  if (section === 'EVENT' && !explicitTime && initialTime === 'upcoming' && result.total === 0) {
    const past = await getPublicActivities(section, query, requestedPage, 'past');
    if (past.total > 0) { result = past; time = 'past'; fallback = true; }
  }
  const { items, page, pageCount, total } = result;
  const counts = await getPublicActivityCounts(query, time);
  const title = section ? ACTIVITY_SECTIONS[section] : 'Activities';
  const path = section ? ACTIVITY_PATHS[section] : '/activities';
  const makeUrl = (target: string, selectedTime?: ActivityTimeFilter, pageNumber?: number, search = query) => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedTime) params.set('time', selectedTime);
    if (pageNumber) params.set('page', String(pageNumber));
    const suffix = params.toString();
    return suffix ? `${target}?${suffix}` : target;
  };
  const pageLink = (number: number) => makeUrl(path, explicitTime, number);
  const tabs = [
    { href: '/activities', label: 'All', count: counts.total },
    ...Object.entries(ACTIVITY_SECTIONS).map(([key, label]) => ({
      href: ACTIVITY_PATHS[key as ActivitySection], label, count: counts.sections[key as ActivitySection],
    })),
  ];

  return (
    <div className={styles.page}>
      <SectionHero title={title}>Explore news, announcements, and events from CTIKS</SectionHero>
      <section id="activity-list" aria-label={title} className={`${styles.shell} ${styles.listSection}`}>
        <div className={styles.toolbar}>
          <nav aria-label="Activity sections" className={styles.tabs}>
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={makeUrl(tab.href, explicitTime)}
                scroll={false}
                aria-current={path === tab.href ? 'page' : undefined}
                className={styles.tab}
              >
                {tab.label} <span>({tab.count})</span>
              </Link>
            ))}
          </nav>
          <ActivitySearchForm key={`${path}-${explicitTime ?? ''}`} path={path} title={title} query={query} time={explicitTime} />
        </div>
        <nav aria-label="Filter activities by time" className={styles.timeFilters}>
          <span>Time</span>
          {(['upcoming', 'past', 'all'] as const).map((option) => (
            <Link key={option} href={makeUrl(path, option)} scroll={false} aria-current={time === option ? 'true' : undefined} className={styles.timeFilter}>
              {option === 'upcoming' ? 'Upcoming' : option === 'past' ? 'Past' : 'All'}
            </Link>
          ))}
        </nav>
        <p className={styles.timeHelp}>Time filters use the activity dates. Undated items appear in All.</p>
        {fallback && <p className={styles.fallbackNotice}>No upcoming events. Showing past events.</p>}
        <p className="sr-only" role="status" aria-live="polite">
          {total} {total === 1 ? 'activity' : 'activities'}
          {query ? ` matching ${query}` : ''}, page {page} of {pageCount}
        </p>
        <div className={styles.list}>
          {items.map((activity) => {
            const schedule = eventSchedule(activity.eventStartAt, activity.eventEndAt, activity.eventHasTime);
            return (
              <article key={activity.id} id={`activity-${activity.id}`} className={styles.card}>
                {activity.imageUrl && (
                  <ActivityPoster src={activity.imageUrl} title={activity.title} />
                )}
                <div className={styles.cardContent}>
                  <div className={styles.badges}>
                    {activity.sections.map((key) => (
                      <span key={key} className={`${styles.badge} ${styles[key]}`}>
                        {ACTIVITY_SECTIONS[key]}
                      </span>
                    ))}
                  </div>
                  <h2>{activity.title}</h2>
                  <ActivityDescription
                    key={activity.description}
                    id={activity.id}
                    title={activity.title}
                    description={activity.description}
                  />
                  <div className={styles.metadata}>
                    <span className={styles.metaItem}>
                      <img src={ASSETS.iconCalendar} alt="" aria-hidden="true" />
                      <span className={styles.metaDetail}>
                        <span className={styles.metaLabel}>{schedule ? 'Date' : 'Posted on'}</span>
                        <time dateTime={activity.eventStartAt ?? activity.createdAt}>
                          {schedule?.date ?? formatActivityDate(activity.createdAt)}
                        </time>
                      </span>
                    </span>
                    {schedule?.time && (
                      <span className={styles.metaItem}>
                        <img src={ASSETS.iconClock} alt="" aria-hidden="true" />
                        <span className={styles.metaDetail}>
                          <span className={styles.metaLabel}>Time (IST)</span>
                          <span>{schedule.time.replace(/\s+IST$/, '')}</span>
                        </span>
                      </span>
                    )}
                    {activity.venue && (
                      <span className={`${styles.metaItem} ${styles.venue}`}>
                        <img src="/assets/figma/location.svg" alt="" aria-hidden="true" />
                        <span className={styles.metaDetail}>
                          <span className={styles.metaLabel}>Location</span>
                          <span>{activity.venue}</span>
                        </span>
                      </span>
                    )}
                    {activity.supportingDocumentUrl && (
                      <a className={styles.actionLink} href={activity.supportingDocumentUrl} target="_blank" rel="noopener noreferrer">View supporting PDF ↗</a>
                    )}
                    {activity.registrationUrl && (
                      <a
                        className={styles.actionLink}
                        href={activity.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${activity.linkLabel || 'More info'}: ${activity.title} (opens in a new tab)`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          aria-hidden="true"
                        >
                          <path d="M7 17 17 7M7 7h10v10" />
                        </svg>
                        <span>{activity.linkLabel || 'More info'}</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!items.length && (
          <div className={styles.empty}>
            <h2>{query ? 'No matching activities' : 'Activity will be updated soon'}</h2>
            {query && <p>Try another keyword or browse all activities.</p>}
            {query && (
              <Link href={makeUrl(path, explicitTime, undefined, '')} scroll={false}>
                Clear search
              </Link>
            )}
          </div>
        )}
        {pageCount > 1 && (
          <nav aria-label="Activities pagination" className={styles.pagination}>
            {page > 1 && (
              <Link scroll={false} href={pageLink(page - 1)}>
                Previous
              </Link>
            )}
            <span>
              Page {page} of {pageCount}
            </span>
            {page < pageCount && (
              <Link scroll={false} href={pageLink(page + 1)}>
                Next
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
