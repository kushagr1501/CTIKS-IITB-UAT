import Link from 'next/link';
import { ASSETS } from '@/config/assets';
import { FOOTER_COLUMNS, type FooterColumn } from '@/config/navigation';
import styles from './Footer.module.css';

function Column({ heading, links }: FooterColumn) {
  return (
    <div className={styles.column}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.headingRule} aria-hidden="true">
        <span />
      </div>
      <ul className={styles.links}>
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <img src="/assets/figma/footer-pattern.png" alt="" aria-hidden="true" className={styles.background} />
      <div className={styles.surface}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logos}>
              <a
                href="https://www.iitb.ac.in/"
                aria-label="Indian Institute of Technology Bombay"
                className={styles.iitbLogo}
              >
                <img src={ASSETS.iitbLogo} alt="IIT Bombay" width={150} height={150} />
              </a>
              <Link
                href="/"
                aria-label="Centre for Traditional Indian Knowledge and Skills"
                className={styles.ctiksLogo}
              >
                <img src={ASSETS.ctiksLogo} alt="CTIKS" width={150} height={150} />
              </Link>
            </div>
            <div className={styles.brandText}>
              <p className={styles.brandName}>
                Centre for Traditional Indian
                <br />
                Knowledge and Skills
              </p>
              <p className={styles.affiliation}>IIT Bombay</p>
              <div className={styles.brandRule} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.divider} aria-hidden="true" />
          <nav aria-label="Footer" className={styles.navigation}>
            {FOOTER_COLUMNS.map((column) => (
              <Column key={column.heading} {...column} />
            ))}
          </nav>
        </div>
        <div className={styles.copyright}>
          <p>© 2026 Centre for Traditional Indian Knowledge and Skills, IIT Bombay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
