import { PHD_ADMISSIONS } from '../content';
import styles from '../phd.module.css';

export default function AdmissionsBanner() {
  return (
    <section className={styles.banner} aria-label="Ph.D. admissions Spring 2027">
      <div className={styles.admissionsPanel}>
        <div className={styles.templeCrop}>
          <img src="/assets/figma/phd-temple.png" alt="" aria-hidden="true" />
        </div>
        <div className={styles.admissionsCopy}>
          <p className={styles.admissionsEyebrow}>Admissions open</p>
          <h2>
            Ph.D. Admissions
            <br />
            Spring 2027
          </h2>
          <p>Semester begins January 2027</p>
          <div className={styles.admissionsActions}>
            <a href={PHD_ADMISSIONS} className={styles.apply}>
              <span>Apply Now</span>
              <span aria-hidden="true">➜</span>
            </a>
            <a href="#application-procedure" className={styles.detailsLink}>
              Admission details <img src="/assets/figma/admissions-arrow.svg" alt="" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
      <div className={styles.schedule}>
        <div className={styles.milestone}>
          <img src="/assets/figma/admissions-calendar.svg" alt="" aria-hidden="true" />
          <div>
            <strong>02 DEC 2026</strong>
            <b>Written test</b>
            <span>In person</span>
          </div>
        </div>
        <div className={styles.milestone}>
          <span className={styles.scheduleMedallion}>
            <img src="/assets/figma/admissions-people.svg" alt="" aria-hidden="true" />
          </span>
          <div>
            <strong>03 DEC 2026</strong>
            <b>Interview</b>
            <span>In person</span>
          </div>
        </div>
        <img src="/assets/figma/lotus-large.svg" alt="" aria-hidden="true" className={styles.lotusLarge} />
        <img src="/assets/figma/lotus-small.svg" alt="" aria-hidden="true" className={styles.lotusSmall} />
      </div>
    </section>
  );
}
