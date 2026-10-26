import styles from '../phd.module.css';
import msc from '../msc.module.css';

export default function MscAdmissionsBanner() {
  return (
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
        <img src="/assets/figma/lotus-large.svg" alt="" aria-hidden="true" className={styles.lotusLarge} />
        <img src="/assets/figma/msc-lotus-small.svg" alt="" aria-hidden="true" className={styles.lotusSmall} />
      </div>
    </section>
  );
}
