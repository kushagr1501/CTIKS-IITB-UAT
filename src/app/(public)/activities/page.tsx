import ActivityListing, { type ActivitySearchParams } from '@/features/activities/components/ActivityListing';
export const metadata = { title: 'Activities' };
export const dynamic = 'force-dynamic';
export default function ActivitiesPage({ searchParams }: { searchParams: ActivitySearchParams }) {
  return <ActivityListing searchParams={searchParams} />;
}
