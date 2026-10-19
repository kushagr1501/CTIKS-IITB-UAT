export const PHD_BROCHURE = 'https://ctiks.iitb.ac.in/wp-content/uploads/2026/03/CTIKS_phd_brochure_data.pdf';
export const PHD_ADMISSIONS = 'https://acad.iitb.ac.in/admissions/research';

export const PHD_HIGHLIGHTS = [
  {
    title: 'Eligibility',
    icon: 'graduation.svg',
    body: 'First Class or 60% marks (55% marks for SC/ST) in the qualifying degree, as specified in the General Eligibility Criterion. Specific qualifying degrees for each area of specialization are listed below.',
  },
  {
    title: 'Admission Procedure',
    icon: 'admission.svg',
    body: 'Candidates who satisfy the minimum eligibility criteria will be shortlisted and they will be asked to appear for a written test and / or interview to be conducted by CTIKS. The final selection will be based on their performance in the test and interview.',
  },
  {
    title: 'Fellowship',
    icon: 'fellowship.svg',
    body: 'As per the rules of IITB – Refer to the PhD Admission Brochure',
  },
  {
    title: 'Course credit requirement',
    icon: 'credits.svg',
    body: 'As per the rules of IITB – Refer to the PhD Admission Brochure',
  },
];

export const MATHEMATICS_DEGREES = [
  'M.Tech. / M.E. or equivalent degree in Engineering / Technology',
  'MBA or equivalent degree (with B.Tech. / B.E. or equivalent degree)',
  'B.Tech. / B.E. or equivalent degree in Engineering / Technology',
  'B.S. (4-year) degree in Mathematics / Physics',
  'M.Sc. or equivalent degree in Mathematics / Physics',
];

export const MATHEMATICS_REQUIREMENTS = [
  'Valid GATE score',
  'Selected through UGC NET (including lectureship / Assistant Professorship)',
  'Selected through a national-level examination conducted by MoE or its agencies (UGC / IIT / IISc / IIIT, etc.)',
  'Selected provisionally for the DST-INSPIRE Fellowship (provisional award letter required)',
  'Minimum of two years of professional experience after obtaining the qualifying degree',
];

export const MATHEMATICS_RESEARCH =
  'Textual & Critical Studies of Primary Sources, Computational Techniques (including Vakya system), Pedagogy & Knowledge Transmission, Kerala School & Late Medieval Developments, Planetary Models & Observational Astronomy, Astronomical Instruments (including masonry) & Observational Practices, Cross-Cultural Studies on the History and Evolution of Astronomy.';

type Specialization = {
  title: string;
  degree?: string;
  degrees?: string[];
  requirements?: string[];
  selection?: string;
  desirable?: string;
  research: string;
};

export const PHD_AREAS: Specialization[] = [
  {
    title: 'Indian Mathematics and Astronomy',
    degrees: MATHEMATICS_DEGREES,
    requirements: MATHEMATICS_REQUIREMENTS,
    desirable: 'Reasonable familiarity with Sanskrit is desirable.',
    research: MATHEMATICS_RESEARCH,
  },
  {
    title: 'Linguistics and Language Technology',
    degree: 'M.A. in Sanskrit / Prakrit / Pali / Sanskrit Linguistics',
    selection:
      'Candidates must be selected through UGC NET (including lectureship / Assistant Professorship).',
    desirable:
      'Familiarity with Python programming language and competence in traditional knowledge explicitly displayed by clearance of relevant exams (e.g., Vedashastrottejaka Sabha, Pune) is desirable.',
    research:
      'Mathematical modeling of Paninian grammar, Shabdabodha and indivisibility of the sentence, Discourse Analysis, Yogyata Relations and Automatic Script Generator, Accent generator, Wordnet of Indian Languages, and other relevant topics in Vyakarana.',
  },
  {
    title: 'Yoga and Wellness Science',
    degree: 'As specified in the General Eligibility Criteria.',
    desirable: 'Post Graduate Degree or equivalent in Psychology, Management, or Yoga is desirable.',
    research:
      'Language and Wellness, Psychological aspects of Yoga-based practices at individual and organizational levels, Study of classical texts in Yoga, Cultural/Social/Historical Studies of Yoga, Application of Yoga in therapy, sports, and management.',
  },
  {
    title: 'Ancient Water Management Systems',
    degree:
      'M.Tech. / M.E. or equivalent in Hydrology and Water Resources Engineering / Irrigation Water Management / Architecture / Agricultural Engineering.',
    desirable: 'Background in Epigraphy, manuscriptology, and archaeology is desirable.',
    research:
      'Sustainable Water Management drawing from inscriptional sources, Community-based sustainable large-scale rainwater harvesting, Temple tanks and their heritage, Management of Tank-Irrigation Systems (socio-hydrological approach), Stepwells and water management, Water management in the Forts of 12 UNESCO heritage sites in Maharashtra and Tamil Nadu.',
  },
  {
    title: 'Heritage Structure Conservation',
    degree:
      'M.Tech. / M.E. or equivalent in Geotechnical Engineering / Construction Technology / Structural Engineering / Construction Materials / Conservation.',
    research:
      'Analysis of jointless structures in temples and temple tanks, Heritage Impact Assessment, Characterization of ancient construction materials and methods, Interventions to existing heritage structures.',
  },
  {
    title: 'Indian Financial and Business Models',
    degree: 'As specified in the General Eligibility Criteria.',
    research:
      'Traditional Indian foundations of Business, Commerce, Finance and Economics; Arthashastra & Ancient Economic and Business Thought; Indigenous Financial, Banking and Business Systems; Accounting, Measurement & Wealth Reporting; Sustainable Business and Circular Economy; Behavioral Finance; Family Business, Intergenerational Capital; Entrepreneurship and Innovation; Corporate Governance and Leadership; Ethics, Trust & Informal Governance; MSMEs & Informal Economy.',
  },
];
