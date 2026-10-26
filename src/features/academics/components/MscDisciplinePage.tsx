import Link from 'next/link';
import SectionHero from '@/components/ui/SectionHero';
import { MSC_DISCIPLINES } from '../msc-content';
import styles from '../phd.module.css';
import detail from '../MscDiscipline.module.css';
import MscAdmissionsBanner from './MscAdmissionsBanner';

type Discipline = (typeof MSC_DISCIPLINES)[number];

export default function MscDisciplinePage({ discipline }: { discipline: Discipline }) {
  const otherDisciplines = MSC_DISCIPLINES.filter((item) => item.slug !== discipline.slug);

  return (
    <div className={styles.paper}>
      <SectionHero title={`M.Sc. in ${discipline.title}`}>
        Explore {discipline.title} at CTIKS, IIT Bombay.
      </SectionHero>
      <div className={styles.content}>
        <nav aria-label="M.Sc. pages" className={detail.breadcrumb}>
          <Link href="/academics">Academics</Link>
          <span aria-hidden="true">›</span>
          <Link href="/academics/msc">M.Sc. Programme</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{discipline.title}</span>
        </nav>

        <MscAdmissionsBanner />

        <section className={`${styles.intro} ${detail.intro}`}>
          <div>
            <p className={styles.eyebrow}>Master of Science Programme</p>
            <h2>M.Sc. in {discipline.title}</h2>
            <p>{discipline.about}</p>
          </div>
          <img src={discipline.cardImage} alt={discipline.cardImageAlt} width={636} height={419} />
        </section>

        <section className={styles.section} aria-labelledby="study-themes">
          <h2 id="study-themes">Indicative study themes</h2>
          <div className={`${styles.whitePanel} ${detail.panel}`}>
            <ul>
              {discipline.themes.map((theme) => <li key={theme}>{theme}</li>)}
            </ul>
          </div>
        </section>

        <div className={detail.columns}>
          <section className={styles.section} aria-labelledby="learning-experiences">
            <h2 id="learning-experiences">Possible learning experiences</h2>
            <div className={`${styles.whitePanel} ${detail.panel}`}><p>{discipline.experiences}</p></div>
          </section>
          <section className={styles.section} aria-labelledby="potential-pathways">
            <h2 id="potential-pathways">Potential pathways</h2>
            <div className={`${styles.whitePanel} ${detail.panel}`}><p>{discipline.pathways}</p></div>
          </section>
        </div>

        <section className={`${styles.whitePanel} ${detail.admissionsNote}`} aria-label="Admission information">
          <h2>Admission information</h2>
          <p>
            Study themes are indicative and subject to the official curriculum. Admission eligibility,
            selection details, and the application schedule will be announced separately.
          </p>
          <Link href="/academics/msc#msc-application">View M.Sc. application guidance →</Link>
        </section>

        {otherDisciplines.map((other) => (
          <Link className={detail.otherDiscipline} href={`/academics/msc/${other.slug}`} key={other.slug}>
            Explore M.Sc. in {other.title} <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
