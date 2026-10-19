import ActivityListing, { type ActivitySearchParams } from '@/features/activities/components/ActivityListing';
export const metadata = { title: 'Announcements' };
export const dynamic = 'force-dynamic';
export default function AnnouncementsPage({ searchParams }: { searchParams: ActivitySearchParams }) {
  return <ActivityListing section="ANNOUNCEMENT" searchParams={searchParams} />;
}
