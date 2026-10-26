import type { Metadata } from 'next';
import SectionHero from '@/components/ui/SectionHero';
import MscAdmissionsBanner from '@/features/academics/components/MscAdmissionsBanner';
import ProgrammeAction from '@/features/academics/components/ProgrammeAction';
import {
  MSC_APPLICANT_INFORMATION,
  MSC_APPLICATION_STEPS,
  MSC_DISCIPLINES,
  MSC_HIGHLIGHTS,
} from '@/features/academics/msc-content';
import styles from '@/features/academics/phd.module.css';
import msc from '@/features/academics/msc.module.css';

export const metadata: Metadata = {
  title: 'M.Sc. Programme',
  description:
    'Explore Indian Mathematics & Astronomy and Yoga & Wellness Science at CTIKS, IIT Bombay. M.Sc. programmes begin in academic year 2027–28.',
};

export default function MscPage() {
  return (
    <div className={styles.paper}>
      <SectionHero title={<>Master of Science (<span className={msc.degree}>M.Sc.</span>) Program</>}>
        M.Sc. programs at CTIKS, IITB will be offered from the academic year 2027-28.
      </SectionHero>
      <div className={styles.content}>
        <MscAdmissionsBanner />
        <section className={styles.intro}>
          <p className={styles.eyebrow}>Master of Science Programme</p>
          <h2>M.Sc. Programme</h2>
          <p>
            Explore Indian knowledge traditions through postgraduate study in Indian Mathematics &amp;
            Astronomy or Yoga &amp; Wellness Science. M.Sc. programmes will be offered from the academic year
            2027–28.
          </p>
        </section>
        <section className={styles.section} aria-labelledby="msc-highlights">
          <h2 id="msc-highlights">Program Highlights</h2>
          <div className={styles.highlights}>
            {MSC_HIGHLIGHTS.map((item) => (
              <article className={styles.highlight} key={item.title}>
                <span className={styles.medallion}>
                  <img src={`/assets/figma/${item.icon}`} alt="" aria-hidden="true" />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.section} aria-labelledby="msc-disciplines">
          <h2 id="msc-disciplines">M.Sc. Disciplines</h2>
          <div className={msc.disciplines}>
            {MSC_DISCIPLINES.map((discipline) => (
              <article className={`${styles.whitePanel} ${msc.discipline}`} key={discipline.slug}>
                <h3>M.Sc. in {discipline.title}</h3>
                <p className="mb-6 leading-relaxed text-[#4a4235]">{discipline.about}</p>
                <ProgrammeAction href={`/academics/msc/${discipline.slug}`} />
              </article>
            ))}
          </div>
        </section>
        <section className={styles.section} aria-labelledby="msc-application">
          <h2 id="msc-application">Application Information</h2>
          <ol className={`${styles.whitePanel} ${styles.steps}`}>
            {MSC_APPLICATION_STEPS.map((step, index) => (
              <li className={styles.step} key={step}>
                <span className={styles.stepIcon}>
                  <img
                    src={`/assets/figma/application-step-${index + 1}.png`}
                    width={[45, 46, 48][index]}
                    height={[51, 40, 45][index]}
                    alt=""
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h3>Step {index + 1}</h3>
                  <p>{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className={styles.section} aria-labelledby="msc-applicants">
          <h2 id="msc-applicants">Applicant Information</h2>
          <div className={`${styles.whitePanel} ${styles.categories}`}>
            <p>Useful next steps for applicants:</p>
            <ul>
              {MSC_APPLICANT_INFORMATION.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <em>
              Official eligibility, selection process, application schedule, and required documents will be
              published with the January 2027 admission notification.
            </em>
          </div>
        </section>
      </div>
    </div>
  );
}
