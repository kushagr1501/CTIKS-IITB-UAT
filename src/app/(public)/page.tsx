import Hero from '@/features/home/components/Hero';
import Programmes from '@/features/home/components/Programmes';
import UpcomingEvents from '@/features/home/components/UpcomingEvents';
import Announcements from '@/features/home/components/Announcements';
import ConnectWithUs from '@/features/home/components/ConnectWithUs';
import { getHomepageActivities } from '@/server/activities/public';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { events, announcements } = await getHomepageActivities();
  return (
    <>
      <Hero />
      <Programmes />
      <UpcomingEvents events={events} />
      <Announcements announcements={announcements} />
      <ConnectWithUs />
    </>
  );
}
