import Link from 'next/link';
import { ASSETS } from '@/config/assets';
import Button from '@/components/ui/Button';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.identity}>
          <a href="https://www.iitb.ac.in/">
            <img
              src={ASSETS.iitbLogo}
              alt="Indian Institute of Technology Bombay"
              width={80}
              height={80}
              className={styles.logo}
            />
          </a>
          <span className={styles.logoDivider} aria-hidden="true" />
          <Link href="/">
            <img
              src={ASSETS.ctiksLogo}
              alt="Centre for Traditional Indian Knowledge and Skills"
              width={80}
              height={80}
              className={styles.logo}
            />
          </Link>
        </div>
        <p className={styles.institution}>
          CTIKS <span aria-hidden="true">·</span> IIT BOMBAY
        </p>
        <p className={styles.code}>404</p>
        <div className={styles.ornament} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.description}>
          The page you’re looking for may have moved or is no longer available. Let’s help you find your way
          back.
        </p>
        <Button href="/" className={styles.homeButton}>
          Back to home
        </Button>
        <nav className={styles.links} aria-label="Helpful pages">
          <Link href="/academics">Explore programmes</Link>
          <span aria-hidden="true">·</span>
          <Link href="/contact-us">Contact us</Link>
        </nav>
      </div>
    </main>
  );
}
