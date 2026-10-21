import type { Metadata } from 'next';
import Image from 'next/image';
import PageHero from '@/components/ui/PageHero';
import Button from '@/components/ui/Button';
import Reveal from '@/components/ui/Reveal';
import { ASSETS } from '@/config/assets';
import { RESEARCH_AREAS } from '@/features/research/content';
import styles from '@/features/research/research.module.css';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Explore eight areas of research at CTIKS, IIT Bombay, spanning Indian knowledge, science, technology, and living traditions.',
};

export default function ResearchPage() {
  return (
    <div className={styles.page}>
      <PageHero title="Research" image={ASSETS.peopleHeroBackdrop}>
        Explore areas of research at the{' '}
        <br />
        Centre for Traditional Indian Knowledge and Skills, IIT Bombay.
      </PageHero>
      <section className={styles.research} aria-labelledby="research-areas">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <h2 id="research-areas">Areas of research</h2>
          </div>
          <div className={styles.gallery}>
            {RESEARCH_AREAS.map((area, index) => (
              <Reveal className={styles.card} variant="arch" delay={(index % 2) * 80} key={area.title}>
                <div data-reveal-media className={styles.imageWrap}>
                  <Image
                    src={`/assets/research/${area.image}`}
                    alt={area.title}
                    fill
                    sizes="(max-width: 767px) calc(100vw - 56px), 530px"
                  />
                </div>
                <div data-reveal-content className={styles.cardBody}>
                  <div className={styles.cardHeading}>
                    <h3>{area.href ? <a href={area.href}>{area.title}</a> : area.title}</h3>
                  </div>
                  <div className={styles.cardActions}>
                    {area.href ? (
                      <Button
                        href={area.href}
                        className={styles.cardButton}
                        aria-label={`Know more about ${area.title}`}
                      >
                        Know more
                      </Button>
                    ) : (
                      <p className={styles.comingSoon}>Details coming soon</p>
                    )}
                    <span className={styles.actionRule} aria-hidden="true" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
