import { ASSETS } from '../assets/assets';

/**
 * All homepage copy lives here so the components stay presentational.
 * Swap this file for API/CMS calls when the backend lands.
 */

export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About us', href: '/about-us' },
  { label: 'People', href: '/people' },
  { label: 'Research', href: '/research' },
  { label: 'Academics', href: '/academics' },
  { label: 'Activities', href: '/activities', children: [] },
  { label: 'Contact us', href: '/contact-us' },
];

export const PROGRAMMES = [
  {
    title: 'Ph.D. Programme',
    body: 'Advanced doctoral research driving original contribution, interdisciplinary collaboration, and academic innovation.',
    image: ASSETS.programmePhd.path,
    imageAlt: 'Research notebooks and a laptop on a desk',
    href: '/academics',
  },
  {
    title: 'Outreach & Community Engagement',
    body: 'Translating traditional insights into actionable social solutions through interactive seminars, training modules, and public dialogues.',
    image: ASSETS.programmeOutreach.path,
    imageAlt: 'Participants at a community workshop',
    href: '/activities',
  },
  {
    title: 'Areas of Interest',
    body: 'Cover the primary themes driving our coursework, doctoral dissertations, and collaborative research projects.',
    image: ASSETS.programmeAreas.path,
    imageAlt: 'A board displaying the centre’s research themes',
    href: '/research',
  },
];

export const UPCOMING_EVENT = {
  title: 'Traditional Science in Modern Applications',
  summary:
    'A hybrid gathering of researchers discussing the integration of classical frameworks into contemporary methodology.',
  date: 'Oct 15, 2026',
  time: '10:00 AM – 04:30 PM',
  href: '/eventspage',
};

export const ANNOUNCEMENTS = [
  {
    title: 'Spring 2027 Doctoral Research Fellowship Open',
    body: 'Applications are invited for full-time Ph.D. positions under MoE and institute-funded research assistantships.',
    date: 'Oct 05, 2026',
    href: '/announcements',
  },
  {
    title: 'Ministry Grant Sanctioned for Heritage Skill Documentation',
    body: 'The centre receives funding to archive oral traditions, indigenous craft methodologies, and sustainable materials.',
    date: 'Sep 28, 2026',
    href: '/announcements',
  },
];

export const FOOTER_COLUMNS = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'About Us', href: '/about-us' },
      { label: 'People', href: '/people' },
      { label: 'Research', href: '/research' },
      { label: 'Academics', href: '/academics' },
      { label: 'Contact Us', href: '/contact-us' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'IIT Bombay', href: 'https://www.iitb.ac.in/' },
      { label: 'Announcements', href: '/announcements' },
      { label: 'News', href: '/news' },
      { label: 'Events', href: '/eventspage' },
    ],
  },
  {
    heading: 'Account',
    links: [{ label: 'Log In', href: '/wp-login.php' }],
  },
];
