export type NavigationLink = {
  label: string;
  href: string;
  children?: NavigationLink[];
};

export type FooterColumn = {
  heading: string;
  links: NavigationLink[];
};

export const NAV_ITEMS: NavigationLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About us', href: '/about-us' },
  { label: 'People', href: '/people' },
  { label: 'Research', href: '/research' },
  { label: 'Academics', href: '/academics' },
  {
    label: 'Activities',
    href: '/activities',
    children: [
      { label: 'News', href: '/news' },
      { label: 'Announcements', href: '/announcements' },
      { label: 'Events', href: '/events' },
    ],
  },
  { label: 'Contact us', href: '/contact-us' },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
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
      { label: 'Events', href: '/events' },
    ],
  },
  {
    heading: 'Account',
    links: [{ label: 'Log In', href: '/login' }],
  },
];
