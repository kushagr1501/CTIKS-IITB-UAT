import Link from 'next/link';
import { ASSETS } from '@/config/assets';
import { getPublicActivities, getPublicActivityCounts } from '@/server/activities/public';
import { ACTIVITY_PATHS, ACTIVITY_SECTIONS, type ActivitySection } from '../types';
import { eventSchedule, formatActivityDate } from '../dates';
import ActivitySearchForm from './ActivitySearchForm';
import ActivityDescription from './ActivityDescription';
import styles from './Activities.module.css';

export type ActivitySearchParams = Promise<{ q?: string | string[]; page?: string | string[] }>;

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
  const [{ items, page, pageCount, total }, counts] = await Promise.all([
    getPublicActivities(section, query, requestedPage),
    getPublicActivityCounts(query),
  ]);
  const title = section ? ACTIVITY_SECTIONS[section] : 'Activities';
  const path = section ? ACTIVITY_PATHS[section] : '/activities';
  const pageLink = (number: number) =>
    `${path}?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(number) })}`;
  const tabs = [
    { href: '/activities', label: 'All', count: counts.total },
    ...Object.entries(ACTIVITY_SECTIONS).map(([key, label]) => ({
      href: ACTIVITY_PATHS[key as ActivitySection],
      label,
      count: counts.sections[key as ActivitySection],
    })),
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.shell}>
          <h1>{title}</h1>
          <p>Explore news, announcements, and events from CTIKS</p>
        </div>
      </section>
      <section id="activity-list" aria-label={title} className={`${styles.shell} ${styles.listSection}`}>
        <div className={styles.toolbar}>
          <nav aria-label="Activity sections" className={styles.tabs}>
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={`${tab.href}${query ? `?${new URLSearchParams({ q: query })}` : ''}`}
                scroll={false}
                aria-current={path === tab.href ? 'page' : undefined}
                className={styles.tab}
              >
                {tab.label} <span>({tab.count})</span>
              </Link>
            ))}
          </nav>
          <ActivitySearchForm key={path} path={path} title={title} query={query} />
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {total} {total === 1 ? 'activity' : 'activities'}
          {query ? ` matching ${query}` : ''}, page {page} of {pageCount}
        </p>
        <div className={styles.list}>
          {items.map((activity) => {
            const schedule = eventSchedule(activity.eventStartAt, activity.eventEndAt);
            return (
              <article key={activity.id} id={`activity-${activity.id}`} className={styles.card}>
                {activity.imageUrl && (
                  <img
                    src={activity.imageUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className={styles.thumbnail}
                  />
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
                    {schedule && (
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
              <Link href={path} scroll={false}>
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
