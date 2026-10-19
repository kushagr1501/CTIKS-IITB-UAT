import ActivityListing, { type ActivitySearchParams } from '@/features/activities/components/ActivityListing';
export const metadata = { title: 'Events' };
export const dynamic = 'force-dynamic';
export default function EventsPage({ searchParams }: { searchParams: ActivitySearchParams }) {
  return <ActivityListing section="EVENT" searchParams={searchParams} />;
}
