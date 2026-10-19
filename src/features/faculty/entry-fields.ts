import type { AcademicContent } from './profile-schema';
import type { EntryField } from './AcademicEntries';
type Collection = 'education' | 'experience' | 'courses' | 'publications' | 'patents' | 'students';
type Definition<K extends Collection> = {
  label: string;
  limit: number;
  fields: EntryField<AcademicContent[K][number]>[];
  create: () => AcademicContent[K][number];
};
export const collections: { [K in Collection]: Definition<K> } = {
  education: {
    label: 'Education',
    limit: 100,
    create: () => ({ title: '', institution: '', periodText: '', description: '' }),
    fields: [
      { key: 'title', label: 'Qualification / title', required: true, max: 300 },
      { key: 'institution', label: 'Institution', max: 400 },
      { key: 'periodText', label: 'Period or date', max: 200 },
      { key: 'description', label: 'Description', kind: 'textarea', max: 3000 },
    ],
  },
  experience: {
    label: 'Work experience',
    limit: 100,
    create: () => ({ title: '', organisation: '', periodText: '', description: '' }),
    fields: [
      { key: 'title', label: 'Position', required: true, max: 300 },
      { key: 'organisation', label: 'Organisation', max: 400 },
      { key: 'periodText', label: 'Period or date', max: 200 },
      { key: 'description', label: 'Description', kind: 'textarea', max: 3000 },
    ],
  },
  courses: {
    label: 'Teaching',
    limit: 150,
    create: () => ({ title: '', code: '', description: '', periodText: '', status: 'CURRENT' }),
    fields: [
      { key: 'title', label: 'Course title', required: true, max: 300 },
      { key: 'code', label: 'Course code', max: 80 },
      {
        key: 'status',
        label: 'Teaching status',
        options: [
          { value: 'CURRENT', label: 'Currently teaching' },
          { value: 'PREVIOUS', label: 'Previously taught' },
        ],
      },
      { key: 'periodText', label: 'Semester / period', max: 200 },
      { key: 'description', label: 'Description', kind: 'textarea', max: 3000 },
    ],
  },
  publications: {
    label: 'Publications',
    limit: 500,
    create: () => ({
      title: '',
      type: 'JOURNAL_ARTICLE',
      authors: '',
      venue: '',
      year: null,
      citation: '',
      doi: '',
      url: '',
    }),
    fields: [
      { key: 'title', label: 'Title', required: true, max: 1000 },
      {
        key: 'type',
        label: 'Type',
        options: [
          { value: 'JOURNAL_ARTICLE', label: 'Journal article' },
          { value: 'CONFERENCE_PAPER', label: 'Conference paper' },
          { value: 'BOOK', label: 'Book' },
          { value: 'BOOK_CHAPTER', label: 'Book chapter' },
          { value: 'RESEARCH_MONOGRAPH', label: 'Research monograph' },
        ],
      },
      { key: 'authors', label: 'Authors', max: 2000 },
      { key: 'venue', label: 'Where was it published?', max: 2000 },
      { key: 'year', label: 'Year', kind: 'year' },
      { key: 'doi', label: 'DOI', max: 300 },
      { key: 'url', label: 'Publication link (HTTPS)', kind: 'url', max: 2048 },
      { key: 'citation', label: 'Full citation', kind: 'textarea', max: 5000 },
    ],
  },
  patents: {
    label: 'Patents',
    limit: 100,
    create: () => ({
      title: '',
      inventors: '',
      identifier: '',
      status: '',
      year: null,
      description: '',
      url: '',
    }),
    fields: [
      { key: 'title', label: 'Title', required: true, max: 1000 },
      { key: 'inventors', label: 'Inventors', max: 2000 },
      { key: 'identifier', label: 'Patent number', max: 300 },
      { key: 'status', label: 'Status', max: 120 },
      { key: 'year', label: 'Year', kind: 'year' },
      { key: 'url', label: 'Patent link (HTTPS)', kind: 'url', max: 2048 },
      { key: 'description', label: 'Description', kind: 'textarea', max: 5000 },
    ],
  },
  students: {
    label: 'Students',
    limit: 300,
    create: () => ({
      name: '',
      programme: '',
      researchTopic: '',
      supervisionRole: '',
      periodText: '',
      status: 'CURRENT',
      graduationYear: null,
      imageUrl: '',
      socialLinks: [],
    }),
    fields: [
      { key: 'name', label: 'Name', required: true, max: 200 },
      { key: 'programme', label: 'Programme', max: 200 },
      { key: 'imageUrl', label: 'Student photo URL', kind: 'image', max: 2048 },
      {
        key: 'status',
        label: 'Student status',
        options: [
          { value: 'CURRENT', label: 'Current student' },
          { value: 'GRADUATED', label: 'Graduated student' },
        ],
      },
      { key: 'graduationYear', label: 'Graduation year', kind: 'year' },
      { key: 'supervisionRole', label: 'Supervision role', max: 200 },
      { key: 'periodText', label: 'Period', max: 200 },
      { key: 'researchTopic', label: 'Research topic', kind: 'textarea', max: 2000 },
      { key: 'socialLinks', label: 'Social & academic links', kind: 'socialLinks' },
    ],
  },
};
