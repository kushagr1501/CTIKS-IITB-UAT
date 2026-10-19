import type { Metadata } from 'next';
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
      <header className={`${styles.hero} ${msc.hero}`}>
        <div className={styles.heroInner}>
          <h1>Master of Science (M.Sc.) Program</h1>
          <p>M.Sc. programs at CTIKS, IITB will be offered from the academic year 2027-28.</p>
        </div>
      </header>
      <div className={styles.content}>
        <section className={styles.banner} aria-label="M.Sc. admissions academic year 2027–28">
          <div className={styles.admissionsPanel}>
            <div className={styles.templeCrop}>
              <img src="/assets/figma/phd-temple.png" alt="" aria-hidden="true" />
            </div>
            <div className={styles.admissionsCopy}>
              <p className={styles.admissionsEyebrow}>Forthcoming admissions</p>
              <h2>
                M.Sc. Admissions
                <br />
                Academic Year 2027-28
              </h2>
              <p>Admission notification will be issued in January 2027.</p>
              <div className={styles.admissionsActions}>
                <span className={msc.comingSoon}>
                  <img src="/assets/figma/msc-coming-soon.svg" alt="" aria-hidden="true" />
                  <span>Coming soon</span>
                </span>
              </div>
            </div>
          </div>
          <div className={styles.schedule}>
            <div className={styles.milestone}>
              <img src="/assets/figma/msc-calendar.svg" alt="" aria-hidden="true" />
              <div>
                <strong>JAN 2027</strong>
                <b>Admission notification</b>
                <span>Details to be announced</span>
              </div>
            </div>
            <div className={styles.milestone}>
              <span className={styles.scheduleMedallion}>
                <img src="/assets/figma/admissions-people.svg" alt="" aria-hidden="true" />
              </span>
              <div>
                <strong>2027–28</strong>
                <b>Academic year</b>
                <span>Programmes begin</span>
              </div>
            </div>
            <img
              src="/assets/figma/lotus-large.svg"
              alt=""
              aria-hidden="true"
              className={styles.lotusLarge}
            />
            <img
              src="/assets/figma/msc-lotus-small.svg"
              alt=""
              aria-hidden="true"
              className={styles.lotusSmall}
            />
          </div>
        </section>
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
              <article className={`${styles.whitePanel} ${msc.discipline}`} key={discipline.title}>
                <h3>{discipline.title}</h3>
                <div className={msc.disciplineBody}>
                  <div>
                    <h4>About this discipline</h4>
                    <p>{discipline.about}</p>
                  </div>
                  <div>
                    <h4>Indicative study themes</h4>
                    <ul>
                      {discipline.themes.map((theme) => (
                        <li key={theme}>{theme}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Possible learning experiences</h4>
                    <p>{discipline.experiences}</p>
                  </div>
                  <div>
                    <h4>Potential pathways</h4>
                    <p>{discipline.pathways}</p>
                  </div>
                  <p>
                    Study themes are indicative and subject to the official curriculum. Admission eligibility
                    will be announced separately.
                  </p>
                </div>
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
