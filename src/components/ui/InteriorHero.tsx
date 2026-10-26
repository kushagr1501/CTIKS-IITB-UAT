import type { ReactNode } from 'react';
import SectionHero from './SectionHero';

export default function InteriorHero({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <SectionHero title={title}>{children}</SectionHero>;
}
