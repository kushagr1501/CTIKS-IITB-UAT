import 'server-only';
import source from '../../../docs/content/k-ramasubramanian/content.json';
import type { getPublicCoreFacultyProfile } from '@/server/faculty/public';

type Profile = NonNullable<Awaited<ReturnType<typeof getPublicCoreFacultyProfile>>>;
type Academic = Profile['revisions'][number];
type Publication = Academic['publications'][number];

// Presentation-only demo. This never writes placeholders to a faculty record.
export function buildFacultyDemoProfile(existing: Profile): Profile {
  const publications: Publication[] = source.publications.monographs.map((item, index) => ({
    id: `source-book-${index}`,
    type: 'RESEARCH_MONOGRAPH',
    title: item.title,
    authors: item.authors,
    venue: item.venue,
    year: item.year,
    citation: '',
    doi: '',
    url: item.url ?? '',
  }));
  for (const [index, item] of source.publications.selectedArticles.entries()) {
    if (
      !item.title ||
      item.needsReview ||
      item.authors?.includes('‘') ||
      !item.type ||
      !['JOURNAL_ARTICLE', 'BOOK_CHAPTER', 'CONFERENCE_PAPER'].includes(item.type)
    )
      continue;
    publications.push({
      id: `source-article-${index}`,
      type: item.type as Publication['type'],
      title: item.title,
      authors: item.authors ?? '',
      venue: item.bibliographicDetails,
      year: item.year,
      citation: '',
      doi: '',
      url: '',
    });
  }
  return {
    ...existing,
    biography: source.profile.biography,
    publicEmail: source.contactCandidates.publicEmail,
    interests: source.profile.researchTags.join(', '),
    revisions: [
      {
        id: existing.revisions[0]?.id ?? 'demo-revision',
        researchTags: source.profile.researchTags,
        researchOverview: source.profile.researchOverview,
        officeAddress: 'Room A-204, Academic Block (demo)',
        publicPhone: source.contactCandidates.publicPhone,
        education: source.education.map((item, index) => ({
          id: `source-education-${index}`,
          title: item.title,
          institution: item.institution,
          description: item.description,
          periodText: item.periodText,
        })),
        experience: source.experience.map((item, index) => ({
          id: `source-position-${index}`,
          title: item.title,
          organisation: item.organisation,
          description: '',
          periodText: item.periodText.replace(' (as stated on source)', '').replace('Dates not supplied', ''),
        })),
        courses: [
          ...source.courses.map((item, index) => ({
            id: `source-course-${index}`,
            title: item.title,
            code: item.code ?? '',
            periodText: 'NPTEL · 40 lectures',
            description: 'With M. S. Sriram and M. D. Srinivas.',
            status: 'PREVIOUS' as const,
          })),
          {
            id: 'demo-course-1',
            title: 'Introduction to Indian Mathematical Texts',
            code: 'DEMO 101',
            periodText: '',
            description: '',
            status: 'CURRENT',
          },
          {
            id: 'demo-course-2',
            title: 'Manuscript Reading Seminar',
            code: 'DEMO 202',
            periodText: '',
            description: '',
            status: 'CURRENT',
          },
        ],
        publications,
        patents: [
          {
            id: 'demo-patent',
            title: 'Manuscript Image Alignment Tool (demo)',
            inventors: '',
            identifier: 'DEMO-PATENT-001',
            status: '',
            year: null,
            description: '',
            url: '',
          },
        ],
        students: [
          ...source.students.map((item, index) => ({
            id: `source-graduate-${index}`,
            name: item.name,
            programme: item.programme,
            biography: '',
            researchTopic: item.researchTopic,
            supervisionRole: '',
            periodText: item.periodText,
            status: 'GRADUATED' as const,
            graduationYear: item.graduationYear,
            imageUrl: '',
            socialLinks: [],
          })),
          {
            id: 'demo-student-1',
            name: 'Research Student A (demo)',
            programme: 'Ph.D.',
            biography: '',
            researchTopic: 'Historical astronomical computations',
            supervisionRole: '',
            periodText: '',
            status: 'CURRENT',
            graduationYear: null,
            imageUrl: '',
            socialLinks: [],
          },
          {
            id: 'demo-student-2',
            name: 'Research Student B (demo)',
            programme: 'Ph.D.',
            biography: '',
            researchTopic: 'Digital study of Sanskrit manuscripts',
            supervisionRole: '',
            periodText: '',
            status: 'CURRENT',
            graduationYear: null,
            imageUrl: '',
            socialLinks: [],
          },
        ],
      },
    ],
  };
}
