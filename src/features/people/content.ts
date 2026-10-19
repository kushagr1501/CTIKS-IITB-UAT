import { ASSETS } from '@/config/assets';
import type { CoreFaculty, Faculty } from './types';

/**
 * Copy + roster for the People page.
 */

export const PEOPLE_HERO = {
  title: 'People',
  summary:
    'Meet our distinguished faculty, researchers, and traditional masters committed to deep scholarship and classical Indian wisdom.',
};

export const CORE_FACULTY: CoreFaculty[] = [
  {
    name: 'Prof. K. Ramasubramanian',
    role: 'Professor In-charge of CTIKS',
    department: 'Department of Humanities and Social Sciences, IIT Bombay',
    tags: 'Indian Mathematics and Astronomy, Yoga and Wellness Science, Advaita Vedanta',
    image: ASSETS.facultyRamasubramanian,
    website: 'https://www.kramasubramanian.com/',
  },
  {
    name: 'Prof. Vijayaraghavan M. Chariar',
    role: 'Core Faculty Member',
    department: 'CTIKS, IIT Bombay',
    tags: 'Traditional Artisanal Skills, Wellness Systems, Eco-friendly design',
    image: ASSETS.facultyChariar,
    website: 'https://vm-chariariitb.joyisyou.com/',
  },
  {
    name: 'Prof. Ashish Karn',
    role: 'Core Faculty Member',
    department: 'CTIKS, IIT Bombay',
    tags: 'Biomimicry, Fluid Mechanics, Indian Mathematics and Astronomy',
    image: ASSETS.facultyKarn,
  },
  {
    name: 'Prof. Nagendra Pavana',
    role: 'Core Faculty Member',
    department: 'CTIKS, IIT Bombay',
    tags: 'Sanskrit Linguistics, Indian Music and Organology, Vyakarana',
    image: ASSETS.facultyPavana,
    website: 'https://www.sanskritfromhome.org/teacher-profile/Dr.-Nagendra-Pavana-18984714',
  },
];

export const ASSOCIATE_FACULTY: Faculty[] = [
  {
    name: 'Prof. Ashish Pandey',
    department: 'Shailesh J. Mehta School of Management, IIT Bombay',
    tags: 'Yoga and Wellness Science, Leadership, Work Stress Management',
    image: ASSETS.facultyPandey,
    website: 'https://www.som.iitb.ac.in/prof-ashish-pandey/',
  },
  {
    name: 'Prof. G. Siva Kumar',
    department: 'Department of Computer Science and Engineering, IIT Bombay',
    tags: 'Language Technology, AI for IKS and IKS for AI',
    image: ASSETS.facultySivaKumar,
    website: 'https://www.cse.iitb.ac.in/~siva/',
  },
  {
    name: 'Prof. Girish Dalvi',
    department: 'IDC School of Design, IIT Bombay',
    tags: 'Language Technology, Artisanal Skills, Visual Communication',
    image: ASSETS.facultyDalvi,
    website: 'https://www.idc.iitb.ac.in/people/phd/girish-vinod-dalvi',
  },
  {
    name: 'Prof. Malhar Kulkarni',
    department: 'Department of Humanities and Social Sciences, IIT Bombay',
    tags: 'Linguistics and Language Technology, Vyakarana Shastra',
    image: ASSETS.facultyKulkarni,
    website: 'https://homepages.iitb.ac.in/~malhar/',
  },
  {
    name: 'Prof. Neeraj Kumbhakarna',
    department: 'Department of Mechanical Engineering, IIT Bombay',
    tags: 'Thermodynamics, IKS Applied Science Models',
    image: ASSETS.facultyKumbhakarna,
    website: 'https://www.me.iitb.ac.in/faculty/prof-neeraj-kumbhakarna',
  },
  {
    name: 'Prof. Swathy Manohar',
    department: 'Department of Civil Engineering, IIT Bombay',
    tags: 'Heritage Structure Conservation, Ancient Construction Materials',
    image: ASSETS.facultyManohar,
  },
  {
    name: 'Prof. V. Jothiprakash',
    department: 'Department of Civil Engineering, IIT Bombay',
    tags: 'Ancient Water Management Systems, Hydrology',
    image: ASSETS.facultyJothiprakash,
  },
  {
    name: 'Prof. Varadraj Bapat',
    department: 'Shailesh J. Mehta School of Management, IIT Bombay',
    tags: 'Indian Financial and Business Models, Kautilya Arthashastra',
    image: ASSETS.facultyBapat,
    website: 'https://www.som.iitb.ac.in/prof-varadraj-bapat/',
  },
  {
    name: 'Prof. V. S. S. Pavan Kumar Hari',
    department: 'Department of Energy Science and Engineering, IIT Bombay',
    tags: 'Indian Mathematics and Astronomy, Music and Organology',
    image: ASSETS.facultyPavanHari,
    website: 'https://www.ese.iitb.ac.in/faculty/pavan-hari',
  },
];

export const ADJUNCT_FACULTY: Faculty[] = [
  {
    name: 'Prof. Sundeep Kapila',
    department: 'Swasth Foundation',
    tags: 'Healthcare Systems, Yogic Psychology, Health & Wellness',
    image: ASSETS.facultyKapila,
    website: 'https://www.swasth.org/our-journey/',
  },
];

export const VISITING_FACULTY: Faculty[] = [
  {
    name: 'Prof. Vinod Vidwans',
    department: 'FLAME University',
    tags: 'Indian Aesthetic Theories, Natyashastra, Computational Musicology',
    image: ASSETS.facultyVidwans,
    website: 'https://www.flame.edu.in/faculty/vinod-vidwans',
  },
  {
    name: 'Prof. Himanshu Asnani',
    department: 'School of Technology and Computer Science, TIFR Mumbai',
    tags: 'Information Theory, AI & Machine Learning, Sanskrit & Vedic Studies',
    image: ASSETS.facultyAsnani,
    website: 'https://www.himanshuasnani.com/',
  },
  {
    name: 'Pandit Nayan Ghosh',
    department: 'Classical Indian Music (Sitar & Tabla)',
    tags: 'Sitar & Tabla Organology, Classical Hindustani Music, Traditional Pedagogy',
    image: ASSETS.facultyGhosh,
    website: 'https://www.nayanghosh.in/index.html',
  },
  {
    name: 'Prof. Sushruti Santanam',
    department: 'Centre for Arts, Society and Policy (CASP)',
    tags: 'Classical Carnatic Vocal, Musicology, Research in Indian Art & Culture',
    image: ASSETS.facultySanthanam,
    website: 'https://casp.org.in/dr-sushruti-santhanam/',
  },
];

