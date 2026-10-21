import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicCoreFacultyOverview } from '@/server/faculty/public';
import FacultyProfile from '@/features/people/components/FacultyProfile';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { profile } = await getPublicCoreFacultyOverview(slug);
  if (!profile) notFound();
  return {
    title: profile.name,
    description:
      `${profile.name}, ${profile.designation || 'Core Faculty'}, ${profile.department}. ${profile.interests}`.slice(
        0,
        300,
      ),
  };
}

export default async function FacultyProfilePage({ params }: Props) {
  const { slug } = await params;
  const { profile, totals } = await getPublicCoreFacultyOverview(slug);
  if (!profile) notFound();
  return <FacultyProfile profile={profile} totals={totals} />;
}
