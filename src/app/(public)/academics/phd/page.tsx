import type { Metadata } from 'next';
import AdmissionsBanner from '@/features/academics/components/AdmissionsBanner';
import { PHD_ADMISSIONS, PHD_AREAS, PHD_BROCHURE, PHD_HIGHLIGHTS } from '@/features/academics/content';
import styles from '@/features/academics/phd.module.css';

export const metadata: Metadata = {
  title: 'Ph.D. Programme',
  description:
    'Doctoral research, eligibility, specialisations, and the application procedure at CTIKS, IIT Bombay.',
};

export default function PhdPage() {
  return (
    <div className={styles.paper}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>Doctor of Philosophy (Ph.D) Program</h1>
          <p>Ph.D. program at CTIKS, IITB has been introduced from Academic Year 2026-27</p>
        </div>
      </header>
      <div className={styles.content}>
        <AdmissionsBanner />
        <section className={styles.intro}>
          <div className={styles.introHeading}>
            <div>
              <p className={styles.eyebrow}>Doctoral Programme</p>
              <h2>Ph.D. Programme</h2>
            </div>
            <a href={PHD_BROCHURE} target="_blank" rel="noopener noreferrer" className={styles.brochure}>
              <img
                src="/assets/figma/brochure-button.svg"
                width={498}
                height={53}
                alt=""
                aria-hidden="true"
              />
              <span>Download Official Admission Brochure</span>
            </a>
          </div>
          <p>
            Advanced doctoral research driving original contribution, interdisciplinary collaboration, and
            academic innovation.
          </p>
        </section>
        <section className={styles.section}>
          <h2>PROGRAM HIGHLIGHTS</h2>
          <div className={styles.highlights}>
            {PHD_HIGHLIGHTS.map((item, index) => (
              <article className={styles.highlight} key={item.title}>
                <span className={styles.medallion}>
                  <img src={`/assets/figma/${item.icon}`} alt="" aria-hidden="true" />
                </span>
                <h3>{item.title}</h3>
                <p>
                  {index > 1 ? (
                    <>
                      As per the rules of IITB – Refer to the{' '}
                      <a href={PHD_BROCHURE} target="_blank" rel="noopener noreferrer">
                        PhD Admission Brochure
                      </a>
                    </>
                  ) : (
                    item.body
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <h2>Areas of Specialization</h2>
          <div className={styles.areas}>
            {PHD_AREAS.map((area, index) => (
              <details key={area.title} className={styles.area} open={index === 0}>
                <summary>
                  IKS{index + 1} – {area.title}
                  <img src="/assets/figma/accordion-down.svg" alt="" aria-hidden="true" />
                </summary>
                <div className={styles.areaBody}>
                  {area.degrees ? (
                    <div>
                      <strong>Qualifying Degree (any one of the following):</strong>
                      <ul className="mt-6">
                        {area.degrees.map((degree) => (
                          <li key={degree}>{degree}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>
                      <strong>Qualifying Degree: </strong>
                      {area.degree}
                    </p>
                  )}
                  {area.requirements && (
                    <>
                      <p>
                        Candidates with a B.Tech./B.E., B.S., or M.Sc. qualification must also fulfil{' '}
                        <strong>one</strong> of the following:
                      </p>
                      <ul>
                        {area.requirements.map((requirement) => (
                          <li key={requirement}>{requirement}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {area.selection && <p>{area.selection}</p>}
                  {area.desirable && (
                    <p>
                      <em>{area.desirable}</em>
                    </p>
                  )}
                  <p>
                    <strong>Research Areas: </strong>
                    {area.research}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
        <section id="application-procedure" className={`${styles.section} scroll-mt-24`}>
          <h2>Application Procedure</h2>
          <ol className={`${styles.whitePanel} ${styles.steps}`}>
            <li className={styles.step}>
              <span className={styles.stepIcon}>
                <img
                  src="/assets/figma/application-step-1.png"
                  width={45}
                  height={51}
                  alt=""
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3>Step 1</h3>
                <p>
                  Visit the <a href={PHD_ADMISSIONS}>IIT Bombay Admissions page</a> for the latest Information
                  Brochure, Application Forms, and Admission Schedule.
                </p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepIcon}>
                <img
                  src="/assets/figma/application-step-2.png"
                  width={46}
                  height={40}
                  alt=""
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3>Step 2</h3>
                <p>Fill in the online application form as per the instructions on the admissions page.</p>
              </div>
            </li>
            <li className={styles.step}>
              <span className={styles.stepIcon}>
                <img
                  src="/assets/figma/application-step-3.png"
                  width={48}
                  height={45}
                  alt=""
                  aria-hidden="true"
                />
              </span>
              <div>
                <h3>Step 3</h3>
                <p>
                  Candidates must submit a Statement of Purpose in the specified format, mentioning the titles
                  of topics of interest with a detailed justification of how their academic background is
                  suitable for research in that area.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className={styles.section}>
          <h2>Application Categories</h2>
          <div className={`${styles.whitePanel} ${styles.categories}`}>
            <p>There are two broad types of applicants:</p>
            <ul>
              <li>
                <strong>Full-Time Research Scholar</strong> – works full-time towards the Ph.D. degree
                (categories: TA, RA, SW, SF, FA)
              </li>
              <li>
                <strong>Part-Time Research Scholar</strong> – employed with an organization and works
                part-time towards the degree (categories: IS, PS, EX, CT)
              </li>
            </ul>
            <em>
              Criteria for awarding Teaching Assistantship and other application categories are as per the
              guidelines mentioned in the IIT Bombay Ph.D. Admissions Brochure.
            </em>
          </div>
        </section>
      </div>
    </div>
  );
}
