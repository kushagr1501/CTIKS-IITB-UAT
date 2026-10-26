import PageHero from '@/components/ui/PageHero';
import { PEOPLE_HERO } from '../content';

export default function PeopleHero() {
  return (
    <PageHero title={PEOPLE_HERO.title}>
      {PEOPLE_HERO.summary}
    </PageHero>
  );
}
