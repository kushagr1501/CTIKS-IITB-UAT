import type { Metadata } from 'next';
import PageHero from '@/components/ui/PageHero';
import ResearchCard from '@/features/research/ResearchCard';
import { listPublicResearchAreas } from '@/server/research/service';
import styles from '@/features/research/research.module.css';
import { getPublicPeopleMenu } from '@/server/faculty/public';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Explore areas of research at CTIKS, IIT Bombay, spanning Indian knowledge, science, technology, and living traditions.',
};

export const dynamic = 'force-dynamic';

export default async function ResearchPage() {
  const [visiblePeople, areas] = await Promise.all([getPublicPeopleMenu(), listPublicResearchAreas()]);

  return (
    <div className={styles.page}>
      <PageHero title="Research">
        Explore areas of research at the Centre for Traditional Indian Knowledge and Skills, IIT Bombay.
      </PageHero>
      <section className={styles.research} aria-labelledby="research-areas">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <h2 id="research-areas">Areas of research</h2>
          </div>
          <div className={styles.gallery}>
            {areas.map((area, index) => {
              const professors = area.professorNames.map((name) => {
                const person = visiblePeople.find((member) => member.name === name);
                return {
                  name,
                  href:
                    person?.category === 'CORE'
                      ? `/people/${person.slug}`
                      : person?.websiteUrl?.startsWith('https://')
                        ? person.websiteUrl
                        : null,
                };
              });

              return (
                <ResearchCard
                  area={{ title: area.title, imageUrl: area.imageUrl, summary: area.description }}
                  professors={professors}
                  index={index}
                  key={area.id}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
