import PageHero from '@/components/ui/PageHero';
import { ASSETS } from '@/config/assets';
import { PEOPLE_HERO } from '../content';

export default function PeopleHero() {
  return (
    <PageHero title={PEOPLE_HERO.title} image={ASSETS.peopleHeroBackdrop}>
      {PEOPLE_HERO.summary}
    </PageHero>
  );
}
