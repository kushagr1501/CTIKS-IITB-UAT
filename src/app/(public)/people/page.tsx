import type { Metadata } from 'next';
import PeopleHero from '@/features/people/components/PeopleHero';
import FacultyDirectory from '@/features/people/components/FacultyDirectory';
import { getVisibleFaculty } from '@/server/faculty/public';

export const metadata: Metadata = {
  title: 'People',
  description: 'Meet the faculty, postdoctoral researchers and scholars, and doctoral students of CTIKS, IIT Bombay.',
};

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const faculty = await getVisibleFaculty();
  return (
    <div className="overflow-x-hidden">
      <PeopleHero />
      <FacultyDirectory faculty={faculty} />
    </div>
  );
}
