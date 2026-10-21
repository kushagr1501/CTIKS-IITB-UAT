import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/server/database/client';
import { getPublicCoreCollectionContext } from '@/server/faculty/public';
import {
  PatentEntry,
  PublicationEntry,
  StudentCard,
  publicationTypes,
} from '@/features/people/components/FacultyProfile';
import profileStyles from '@/features/people/components/FacultyProfile.module.css';
import PublicationFilters from './PublicationFilters';
import styles from './ProfileCollection.module.css';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 10;
type Collection = 'publications' | 'patents' | 'students';
type SearchValue = string | string[] | undefined;
type Props = {
  params: Promise<{ slug: string; collection: string }>;
  searchParams: Promise<Record<string, SearchValue>>;
};

function first(value: SearchValue) {
  return typeof value === 'string' ? value : '';
}

function requestedPage(value: SearchValue) {
  const raw = first(value);
  return /^[1-9]\d{0,3}$/.test(raw) ? Number(raw) : 1;
}

function collectionTitle(collection: Collection) {
  return collection === 'publications' ? 'Publications' : collection === 'patents' ? 'Patents' : 'Students';
}

function pageHref(base: string, filters: Record<string, string>, page: number) {
  const query = new URLSearchParams(filters);
  if (page > 1) query.set('page', String(page));
  const suffix = query.toString();
  return `${base}${suffix ? `?${suffix}` : ''}`;
}

function Pagination({
  base,
  filters,
  page,
  total,
}: {
  base: string;
  filters: Record<string, string>;
  page: number;
  total: number;
}) {
  if (!total) return null;
  const pages = Math.ceil(total / PAGE_SIZE);
  return (
    <nav className={styles.pagination} aria-label="Collection pages">
      <span>
        {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, total).toLocaleString()} of{' '}
        {total.toLocaleString()}
      </span>
      <div className={styles.pageLinks}>
        {page > 1 && <Link href={pageHref(base, filters, page - 1)}>← Previous</Link>}
        <span>Page {page} of {pages}</span>
        {page < pages && <Link href={pageHref(base, filters, page + 1)}>Next →</Link>}
      </div>
    </nav>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, collection } = await params;
  if (!['publications', 'patents', 'students'].includes(collection)) notFound();
  const profile = await getPublicCoreCollectionContext(slug);
  if (!profile?.revisions[0]) notFound();
  return { title: `${collectionTitle(collection as Collection)} · ${profile.name}` };
}

export default async function ProfileCollectionPage({ params, searchParams }: Props) {
  const [{ slug, collection }, search] = await Promise.all([params, searchParams]);
  if (!['publications', 'patents', 'students'].includes(collection)) notFound();
  const profile = await getPublicCoreCollectionContext(slug);
  const revisionId = profile?.revisions[0]?.id;
  if (!profile || !revisionId) notFound();

  const database = getDatabase();
  const base = `/people/${profile.slug}/${collection}`;
  const title = collectionTitle(collection as Collection);
  const orderBy = [{ displayOrder: 'asc' as const }, { id: 'asc' as const }];
  const requested = requestedPage(search.page);
  let filters: Record<string, string> = {};
  let filterControls: React.ReactNode = null;
  let list: React.ReactNode;
  let total: number;
  let page: number;

  if (collection === 'publications') {
    const rawType = first(search.type);
    const type = Object.hasOwn(publicationTypes, rawType)
      ? (rawType as keyof typeof publicationTypes)
      : undefined;
    const rawYear = first(search.year);
    const selectedYear = /^\d{4}$/.test(rawYear) ? Number(rawYear) : undefined;
    const years = await database.facultyPublication.findMany({
      where: { revisionId, year: { not: null } },
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' },
    });
    const year = years.some((item) => item.year === selectedYear) ? selectedYear : undefined;
    const where = { revisionId, ...(type ? { type } : {}), ...(year ? { year } : {}) };
    total = await database.facultyPublication.count({ where });
    page = Math.min(requested, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const items = await database.facultyPublication.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, type: true, authors: true, venue: true,
        year: true, citation: true, doi: true, url: true,
      },
    });
    filters = { ...(type ? { type } : {}), ...(year ? { year: String(year) } : {}) };
    filterControls = <PublicationFilters
      key={`${type ?? ''}:${year ?? ''}`}
      base={base}
      types={(Object.keys(publicationTypes) as (keyof typeof publicationTypes)[]).map((value) => ({
        value, label: publicationTypes[value],
      }))}
      years={years.flatMap((item) => item.year === null ? [] : [item.year])}
      selectedType={type ?? ''}
      selectedYear={year?.toString() ?? ''}
    />;
    list = <ul>{items.map((item) => <PublicationEntry key={item.id} item={item} />)}</ul>;
  } else if (collection === 'patents') {
    total = await database.facultyPatent.count({ where: { revisionId } });
    page = Math.min(requested, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const items = await database.facultyPatent.findMany({
      where: { revisionId },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, inventors: true, identifier: true,
        status: true, year: true, description: true, url: true,
      },
    });
    list = <ul>{items.map((item) => <PatentEntry key={item.id} item={item} />)}</ul>;
  } else {
    const rawStatus = first(search.status);
    const status = rawStatus === 'current' || rawStatus === 'graduated' ? rawStatus : undefined;
    const where = {
      revisionId,
      ...(status ? { status: status === 'current' ? 'CURRENT' as const : 'GRADUATED' as const } : {}),
    };
    total = await database.facultyStudent.count({ where });
    page = Math.min(requested, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    const items = await database.facultyStudent.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, name: true, programme: true, biography: true, researchTopic: true,
        supervisionRole: true, periodText: true, status: true, graduationYear: true,
        imageUrl: true, socialLinks: true,
      },
    });
    filters = status ? { status } : {};
    filterControls = (
      <nav className={styles.statusFilters} aria-label="Filter students">
        {([
          ['', 'All students'], ['current', 'Current students'], ['graduated', 'Graduated students'],
        ] as const).map(([value, label]) => (
          <Link key={value} href={pageHref(base, value ? { status: value } : {}, 1)}
            aria-current={(status ?? '') === value ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>
    );
    list = <ul className={profileStyles.students}>{items.map((item) => <StudentCard key={item.id} student={item} />)}</ul>;
  }

  return (
    <main className={profileStyles.page}>
      <div className={profileStyles.content}>
        <div className={profileStyles.shell}>
          <Link href={`/people/${profile.slug}#${collection === 'students' ? (filters.status === 'graduated' ? 'graduated-students' : 'current-students') : collection}`}
            className={styles.back}>← Back to {profile.name}&apos;s profile</Link>
          <header className={styles.heading}>
            <div className={styles.headingCopy}>
              <p className={styles.kicker}>Faculty profile</p>
              <h1>{title}</h1>
              <p>{profile.name}</p>
            </div>
            {collection === 'publications' && filterControls}
          </header>
          {collection !== 'publications' && filterControls}
          <section id={collection} className={profileStyles.section}>
            <div className={profileStyles.sectionContent}>
              {total ? list : <p className={profileStyles.empty}>No entries match these filters.</p>}
              <Pagination base={base} filters={filters} page={page} total={total} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
