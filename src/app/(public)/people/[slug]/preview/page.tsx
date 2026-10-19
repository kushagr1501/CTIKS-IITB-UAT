import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicCoreFacultyProfile } from '@/server/faculty/public';
import { buildFacultyDemoProfile } from '@/features/people/demo-profile';
import FacultyProfile from '@/features/people/components/FacultyProfile';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Faculty profile — demonstration preview',
  robots: { index: false, follow: false },
};

export default async function FacultyDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== 'k-ramasubramanian') notFound();
  const profile = await getPublicCoreFacultyProfile(slug);
  if (!profile) notFound();
  return (
    <>
      <aside
        className="border-y border-amber-200 bg-amber-50/60 px-5 py-3 text-sm leading-6 text-stone-700"
        aria-label="Demonstration notice"
      >
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <p>Draft preview · Includes sample entries and unconfirmed details.</p>
          <p className="flex flex-wrap gap-x-6">
            <Link className="font-semibold underline underline-offset-4" href={`/people/${slug}`}>
              View current profile
            </Link>
            <a
              className="underline underline-offset-4"
              href="https://www.kramasubramanian.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source website ↗
            </a>
          </p>
        </div>
      </aside>
      <FacultyProfile profile={buildFacultyDemoProfile(profile)} />
    </>
  );
}
