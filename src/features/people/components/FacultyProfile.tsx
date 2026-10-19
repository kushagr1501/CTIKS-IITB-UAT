import Link from 'next/link';
import type { ReactNode } from 'react';
import type { getPublicCoreFacultyProfile } from '@/server/faculty/public';
import FacultyPortrait from './FacultyPortrait';
import styles from './FacultyProfile.module.css';
import ProfilePublicationTabs from './ProfilePublicationTabs';
import {
  STUDENT_LINK_LABELS,
  readStudentSocialLinks,
  studentPhotoSchema,
} from '@/features/faculty/student-schema';
import studentStyles from './StudentCard.module.css';

type Profile = NonNullable<Awaited<ReturnType<typeof getPublicCoreFacultyProfile>>>;
type Student = Profile['revisions'][number]['students'][number];
const publicationTypes = {
  JOURNAL_ARTICLE: 'Journal articles',
  CONFERENCE_PAPER: 'Conference papers',
  BOOK: 'Books',
  BOOK_CHAPTER: 'Book chapters',
  RESEARCH_MONOGRAPH: 'Research monographs',
} as const;

function safeLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function ExternalLink({ url, children }: { url: string; children: ReactNode }) {
  const href = safeLink(url);
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : null;
}

function AcademicEntry({
  title,
  detail,
  period,
  children,
}: {
  title: string;
  detail?: string;
  period?: string;
  children?: ReactNode;
}) {
  return (
    <li className={styles.entry}>
      <div className={styles.entryHeading}>
        <h3>{title}</h3>
      </div>
      {(detail || period) && (
        <div className={styles.entryMeta}>
          {detail && <p className={styles.detail}>{detail}</p>}
          {period && <span className={styles.period}>{period}</span>}
        </div>
      )}
      {children}
    </li>
  );
}

function StudentCard({ student }: { student: Student }) {
  const photo = studentPhotoSchema.safeParse(student.imageUrl);
  const image = photo.success ? photo.data : '';
  const links = readStudentSocialLinks(student.socialLinks);
  const detail = [student.programme, student.supervisionRole].filter(Boolean).join(' · ');
  const period = student.periodText || student.graduationYear?.toString();
  return (
    <li className={styles.entry}>
      <div className={image ? studentStyles.withPhoto : undefined}>
        {image && <FacultyPortrait name={student.name} image={image} variant="round" loading="lazy" />}
        <div className={studentStyles.content}>
          <div className={styles.entryHeading}>
            <h3>{student.name}</h3>
          </div>
          {(detail || period) && (
            <div className={styles.entryMeta}>
              {detail && <p className={styles.detail}>{detail}</p>}
              {period && <span className={styles.period}>{period}</span>}
            </div>
          )}
          {student.researchTopic && <p className={styles.prose}>{student.researchTopic}</p>}
          {links.length > 0 && (
            <ul className={studentStyles.links} aria-label={`Links for ${student.name}`}>
              {links.map((link) => (
                <li key={link.platform}>
                  <ExternalLink url={link.url}>{STUDENT_LINK_LABELS[link.platform]}</ExternalLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export default function FacultyProfile({ profile }: { profile: Profile }) {
  const academic = profile.revisions[0];
  const website = safeLink(profile.websiteUrl);
  const tags = academic?.researchTags ?? [];
  const research = Boolean(tags.length || profile.interests || academic?.researchOverview);
  const contact = Boolean(profile.publicEmail || website || academic?.officeAddress || academic?.publicPhone);
  const sections: { id: string; title: string; content: ReactNode }[] = [];
  if (research)
    sections.push({
      id: 'research',
      title: 'Research areas',
      content: (
        <>
          {tags.length ? (
            <ul className={styles.tags}>
              {tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : (
            profile.interests && <p className={styles.prose}>{profile.interests}</p>
          )}
          {academic?.researchOverview && <p className={styles.prose}>{academic.researchOverview}</p>}
        </>
      ),
    });
  if (academic?.education.length)
    sections.push({
      id: 'education',
      title: 'Education',
      content: (
        <ul>
          {academic.education.map((item) => (
            <AcademicEntry
              key={item.id}
              title={item.title}
              detail={item.institution}
              period={item.periodText}
            >
              {item.description && <p className={styles.prose}>{item.description}</p>}
            </AcademicEntry>
          ))}
        </ul>
      ),
    });
  if (academic?.experience.length)
    sections.push({
      id: 'experience',
      title: 'Work experience',
      content: (
        <ul>
          {academic.experience.map((item) => (
            <AcademicEntry
              key={item.id}
              title={item.title}
              detail={item.organisation}
              period={item.periodText}
            >
              {item.description && <p className={styles.prose}>{item.description}</p>}
            </AcademicEntry>
          ))}
        </ul>
      ),
    });
  sections.push({
    id: 'teaching',
    title: 'Teaching',
    content: (
      <div className={styles.columns}>
        {(['CURRENT', 'PREVIOUS'] as const).map((status) => {
          const courses = academic?.courses.filter((item) => item.status === status) ?? [];
          return (
            <div key={status} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {status === 'CURRENT' ? 'Currently teaching' : 'Courses taught'}
              </h3>
              {courses.length ? (
                <ul>
                  {courses.map((item) => (
                    <AcademicEntry
                      key={item.id}
                      title={item.title}
                      detail={item.code}
                      period={item.periodText}
                    >
                      {item.description && <p className={styles.prose}>{item.description}</p>}
                    </AcademicEntry>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>Not added yet.</p>
              )}
            </div>
          );
        })}
      </div>
    ),
  });
  if (academic?.publications.length)
    sections.push({
      id: 'publications',
      title: 'Publications',
      content: (
        <ProfilePublicationTabs
          groups={(Object.keys(publicationTypes) as (keyof typeof publicationTypes)[]).flatMap((type) => {
            const publications = academic.publications.filter((item) => item.type === type);
            return publications.length
              ? [
                  {
                    label: publicationTypes[type],
                    content: (
                      <ul>
                        {publications.map((item) => (
                          <AcademicEntry
                            key={item.id}
                            title={item.title}
                            detail={[item.authors, item.venue].filter(Boolean).join(' · ')}
                            period={item.year?.toString()}
                          >
                            {item.citation && <p className={styles.prose}>{item.citation}</p>}
                            <div className={styles.entryLinks}>
                              {item.doi && (
                                <ExternalLink
                                  url={`https://doi.org/${encodeURIComponent(item.doi.replace(/^https?:\/\/doi\.org\//i, ''))}`}
                                >
                                  DOI: {item.doi.replace(/^https?:\/\/doi\.org\//i, '')}
                                </ExternalLink>
                              )}
                              {item.url && <ExternalLink url={item.url}>View publication</ExternalLink>}
                            </div>
                          </AcademicEntry>
                        ))}
                      </ul>
                    ),
                  },
                ]
              : [];
          })}
        />
      ),
    });
  if (academic?.patents.length)
    sections.push({
      id: 'patents',
      title: 'Patents',
      content: (
        <ul>
          {academic.patents.map((item) => (
            <AcademicEntry
              key={item.id}
              title={item.title}
              detail={[item.inventors, item.identifier, item.status].filter(Boolean).join(' · ')}
              period={item.year?.toString()}
            >
              {item.description && <p className={styles.prose}>{item.description}</p>}
              {item.url && <ExternalLink url={item.url}>View patent</ExternalLink>}
            </AcademicEntry>
          ))}
        </ul>
      ),
    });
  if (academic?.students.length)
    (['GRADUATED', 'CURRENT'] as const).forEach((status) => {
      const students = academic.students.filter((item) => item.status === status);
      if (students.length)
        sections.push({
          id: status === 'CURRENT' ? 'current-students' : 'graduated-students',
          title: status === 'CURRENT' ? 'Current students' : 'Graduated students',
          content: (
            <ul className={styles.students}>
              {students.map((item) => (
                <StudentCard key={item.id} student={item} />
              ))}
            </ul>
          ),
        });
    });
  if (contact)
    sections.push({
      id: 'contact',
      title: 'Office & contact',
      content: (
        <dl className={styles.contact}>
          {profile.publicEmail && (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${profile.publicEmail}`}>{profile.publicEmail}</a>
              </dd>
            </div>
          )}
          {academic?.officeAddress && (
            <div>
              <dt>Office</dt>
              <dd className={styles.prose}>{academic.officeAddress}</dd>
            </div>
          )}
          {academic?.publicPhone && (
            <div>
              <dt>Phone</dt>
              <dd>{academic.publicPhone}</dd>
            </div>
          )}
          {website && (
            <div>
              <dt>Website</dt>
              <dd>
                <ExternalLink url={website}>Personal website</ExternalLink>
              </dd>
            </div>
          )}
        </dl>
      ),
    });

  const sectionOrder = [
    'education',
    'teaching',
    'research',
    'experience',
    'publications',
    'patents',
    'graduated-students',
    'current-students',
    'contact',
  ];
  const sectionTitles: Record<string, string> = {
    education: 'Education',
    teaching: 'Teaching',
    research: 'Research areas',
    experience: 'Work experience',
    publications: 'Publications',
    patents: 'Patents',
    'graduated-students': 'Graduated students',
    'current-students': 'Current students',
    contact: 'Office & contact',
  };
  for (const id of sectionOrder) {
    if (!sections.some((section) => section.id === id)) {
      sections.push({
        id,
        title: sectionTitles[id],
        content: <p className={styles.empty}>Not added yet.</p>,
      });
    }
  }
  sections.sort((a, b) => sectionOrder.indexOf(a.id) - sectionOrder.indexOf(b.id));

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <div className={styles.shell}>
          <h1>{profile.name}</h1>
          <p>
            {profile.designation || 'Core Faculty Member'}, Centre for Traditional Indian Knowledge and Skills
          </p>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <div className={styles.portrait}>
              <FacultyPortrait name={profile.name} image={profile.imageUrl || undefined} />
            </div>
            <div className={styles.identity}>
              <h2>{profile.name}</h2>
              <p className={styles.designation}>{profile.designation || 'Core Faculty Member'}</p>
              <p className={styles.department}>{profile.department}</p>
              {(profile.publicEmail || website) && (
                <div className={styles.headerLinks}>
                  {website && <ExternalLink url={website}>Personal website</ExternalLink>}
                  {profile.publicEmail && <a href={`mailto:${profile.publicEmail}`}>Email</a>}
                </div>
              )}
            </div>
            {profile.biography && (
              <div className={styles.biography}>
                <p className={styles.bioTitle}>
                  {profile.designation || 'Core Faculty Member'}, {profile.department}
                </p>
                <p className={styles.prose}>{profile.biography}</p>
              </div>
            )}
          </header>
          {sections.length > 0 && (
            <div className={styles.body}>
              <nav aria-label="Profile sections" className={styles.navigation}>
                <ul>
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`}>{section.title}</a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className={styles.sections}>
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    aria-labelledby={`${section.id}-heading`}
                    className={styles.section}
                  >
                    <div className={styles.sectionHeading}>
                      <img
                        src="/assets/divider-ornament.svg"
                        alt=""
                        aria-hidden="true"
                        width="22"
                        height="20"
                      />
                      <h2 id={`${section.id}-heading`}>{section.title}</h2>
                    </div>
                    <div className={styles.sectionContent}>{section.content}</div>
                  </section>
                ))}
              </div>
            </div>
          )}
          <Link href="/people" className={styles.back}>
            <span aria-hidden="true">←</span> Back to People
          </Link>
        </div>
      </div>
    </div>
  );
}
