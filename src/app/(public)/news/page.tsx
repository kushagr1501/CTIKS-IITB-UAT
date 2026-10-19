import ActivityListing, { type ActivitySearchParams } from '@/features/activities/components/ActivityListing';
export const metadata = { title: 'News' };
export const dynamic = 'force-dynamic';
export default function NewsPage({ searchParams }: { searchParams: ActivitySearchParams }) {
  return <ActivityListing section="NEWS" searchParams={searchParams} />;
}
