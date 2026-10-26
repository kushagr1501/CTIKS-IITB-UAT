import type { Metadata } from 'next';
import Link from 'next/link';
import InteriorHero from '@/components/ui/InteriorHero';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Useful CTIKS and IIT Bombay links.',
};

const resources = [
  { label: 'IIT Bombay', href: 'https://www.iitb.ac.in/' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
];

export default function ResourcesPage() {
  return (
    <>
      <InteriorHero title="Resources">
        Useful links from CTIKS and IIT Bombay.
      </InteriorHero>
      <section className="mx-auto max-w-[1120px] px-6 py-12 text-ctiks-maroon sm:py-16">
        <h2 className="font-display text-2xl font-semibold">Useful links</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {resources.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-lg border border-ctiks-red/20 bg-white/60 px-5 py-4 font-body font-semibold transition-colors hover:border-ctiks-red hover:text-ctiks-red"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
