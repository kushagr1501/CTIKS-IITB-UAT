import type { ReactNode } from 'react';
import styles from './SectionHero.module.css';

export default function SectionHero({
  title,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.hero}>
      <div className={styles.shell}>
        <h1>{title}</h1>
        {children && <div className={styles.description}>{children}</div>}
      </div>
    </header>
  );
}
