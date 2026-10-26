import type { Metadata } from 'next';
import Link from 'next/link';
import InteriorHero from '@/components/ui/InteriorHero';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Projects at the Centre for Traditional Indian Knowledge and Skills, IIT Bombay.',
};

export default function ProjectsPage() {
  return (
    <>
      <InteriorHero title="Projects">
        Explore the work of the Centre for Traditional Indian Knowledge and Skills.
      </InteriorHero>
      <section className="mx-auto max-w-[1120px] px-6 py-12 text-ctiks-maroon sm:py-16">
        <h2 className="font-display text-2xl font-semibold">Projects</h2>
        <p className="mt-4 max-w-[680px] font-body leading-relaxed">
          Project details will be added here. In the meantime, explore our{' '}
          <Link href="/research" className="underline underline-offset-4 hover:text-ctiks-red">
            research areas
          </Link>
          .
        </p>
      </section>
    </>
  );
}
