import { ASSETS } from '@/config/assets';
import type { Programme } from './types';

/**
 * Static programme copy. Events and announcements come from the Activities CMS.
 */

export const PROGRAMMES: Programme[] = [
  {
    title: 'Ph.D. Programme',
    body: 'Advanced doctoral research driving original contribution, interdisciplinary collaboration, and academic innovation.',
    image: ASSETS.programmePhd,
    imageAlt: 'Research notebooks and a laptop on a desk',
    href: '/academics',
  },
  {
    title: 'Outreach & Community Engagement',
    body: 'Translating traditional insights into actionable social solutions through interactive seminars, training modules, and public dialogues.',
    image: ASSETS.programmeOutreach,
    imageAlt: 'Participants at a community workshop',
    href: '/activities',
  },
  {
    title: 'Areas of Interest',
    body: 'Cover the primary themes driving our coursework, doctoral dissertations, and collaborative research projects.',
    image: ASSETS.programmeAreas,
    imageAlt: 'A board displaying the centre’s research themes',
    href: '/research',
  },
];
