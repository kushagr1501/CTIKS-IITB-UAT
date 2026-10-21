import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setupDatabase } from './database';

const source = JSON.parse(await readFile('docs/content/ashish-karn/content.json', 'utf8')) as {
  collection: { collectedOn: string; note: string };
  profile: {
    name: string;
    slug: string;
    designation: string;
    department: string;
    biography: string;
    websiteUrl: string;
    publicEmail: string;
    researchTags: string[];
    researchOverview: string;
    officeAddress: string;
  };
  education: Array<{ title: string; institution: string; periodText: string; description: string }>;
  experience: Array<{ title: string; organisation: string; periodText: string; description: string }>;
  courses: Array<{
    title: string;
    code: string;
    periodText: string;
    description: string;
    status: 'CURRENT' | 'PREVIOUS';
  }>;
  publications: Array<{
    type: 'JOURNAL_ARTICLE' | 'CONFERENCE_PAPER' | 'BOOK' | 'BOOK_CHAPTER' | 'RESEARCH_MONOGRAPH';
    title: string;
    authors: string;
    venue: string;
    year?: number;
    citation: string;
    doi: string;
    url: string;
  }>;
  students: Array<{
    name: string;
    programme: string;
    biography: string;
    researchTopic: string;
    supervisionRole: string;
    periodText: string;
    status: 'CURRENT' | 'GRADUATED';
    graduationYear?: number;
  }>;
  reviewNotes: string[];
};

const slug = 'ashish-karn';
assert.equal(source.profile.slug, slug);
assert.equal(source.profile.name, 'Prof. Ashish Karn');
assert.deepEqual(source.profile.researchTags, [
  'Development of Engineering Ideas in Indian Tradition',
  'Architectural Engineering: Vāstu and Śilpaśāstra Texts',
  'Traditional Engineering Principles',
  'Materials and Construction Techniques',
  'Mechanical Devices',
  'Nature-Inspired Engineering and Sustainability Principles',
  'Indian Mathematics and Astronomy',
]);
assert.doesNotMatch(JSON.stringify(source.publications), /forthcoming|2027/i);

const academic = {
  researchTags: source.profile.researchTags,
  researchOverview: source.profile.researchOverview,
  officeAddress: source.profile.officeAddress,
  publicPhone: '',
  education: source.education.map((item, displayOrder) => ({ ...item, displayOrder })),
  experience: source.experience.map((item, displayOrder) => ({ ...item, displayOrder })),
  courses: source.courses.map((item, displayOrder) => ({ ...item, displayOrder })),
  publications: source.publications.map((item, displayOrder) => ({ ...item, displayOrder })),
  patents: [],
  students: source.students.map((item, displayOrder) => ({ ...item, displayOrder })),
};
const base = {
  name: source.profile.name,
  designation: source.profile.designation,
  department: source.profile.department,
  biography: source.profile.biography,
  interests: source.profile.researchTags.join(', '),
  websiteUrl: source.profile.websiteUrl,
  publicEmail: source.profile.publicEmail,
};
const fingerprint = createHash('sha256').update(JSON.stringify({ base, academic })).digest('hex');
const deduplicationKey = `faculty-cv-import:${slug}:${fingerprint}`;
const summary = {
  slug,
  education: academic.education.length,
  appointments: academic.experience.length,
  courses: academic.courses.length,
  selectedPublications: academic.publications.length,
  graduatedStudents: academic.students.length,
  researchAreas: academic.researchTags.length,
};

const database = setupDatabase();
const apply = process.argv.includes('--apply');
try {
  const profile = await database.facultyProfile.findUniqueOrThrow({ where: { slug } });
  assert.equal(profile.category, 'CORE');
  assert.equal(profile.visible, true, 'Existing profile must already be visible.');
  const priorImport = await database.auditEvent.findUnique({ where: { deduplicationKey } });
  if (priorImport) {
    console.log(JSON.stringify({ alreadyImported: true, faculty: profile.name, ...summary }, null, 2));
  } else {
    const existingRevisions = await database.facultyProfileRevision.findMany({
      where: { facultyId: profile.id },
      include: {
        education: true,
        experience: true,
        courses: true,
        publications: true,
        patents: true,
        students: true,
      },
    });
    assert.equal(existingRevisions.length, 1, 'Review existing academic content before importing.');
    const existing = existingRevisions[0];
    assert.equal(existing.status, 'PUBLISHED');
    assert.equal(
      existing.education.length +
        existing.experience.length +
        existing.courses.length +
        existing.publications.length +
        existing.patents.length +
        existing.students.length,
      0,
      'Refusing to overwrite existing academic content.',
    );

    if (!apply) {
      console.log(JSON.stringify({ dryRun: true, faculty: profile.name, ...summary }, null, 2));
    } else {
      const result = await database.$transaction(
        async (transaction) => {
          if (await transaction.auditEvent.findUnique({ where: { deduplicationKey } }))
            return { alreadyImported: true };
          const before = await transaction.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } });
          assert.equal(before.version, profile.version, 'Profile changed; rerun after review.');
          assert.equal(before.visible, true);
          assert.equal(before.category, 'CORE');
          if (
            await transaction.facultyProfileRevision.findFirst({
              where: { facultyId: profile.id, status: { in: ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'] } },
            })
          )
            throw new Error('An academic draft exists. Review it before importing.');
          const highest = await transaction.facultyProfileRevision.aggregate({
            where: { facultyId: profile.id },
            _max: { revisionNumber: true },
          });
          assert.equal(highest._max.revisionNumber, 1, 'Profile content changed; review before importing.');
          const changed = await transaction.facultyProfile.updateMany({
            where: { id: profile.id, version: before.version },
            data: { ...base, version: { increment: 1 } },
          });
          assert.equal(changed.count, 1, 'Concurrent profile edit detected.');
          await transaction.facultyProfileRevision.updateMany({
            where: { facultyId: profile.id, status: 'PUBLISHED' },
            data: { status: 'SUPERSEDED' },
          });
          const revision = await transaction.facultyProfileRevision.create({
            data: {
              facultyId: profile.id,
              revisionNumber: (highest._max.revisionNumber ?? 0) + 1,
              status: 'PUBLISHED',
              publishedAt: new Date(),
              ...base,
              imageUrl: before.imageUrl,
              websiteUrl: source.profile.websiteUrl,
              publicEmail: source.profile.publicEmail,
              researchTags: academic.researchTags,
              researchOverview: academic.researchOverview,
              officeAddress: academic.officeAddress,
              publicPhone: academic.publicPhone,
              education: { create: academic.education },
              experience: { create: academic.experience },
              courses: { create: academic.courses },
              publications: { create: academic.publications },
              students: { create: academic.students },
            },
          });
          await transaction.auditEvent.create({
            data: {
              action: 'FACULTY_CV_CONTENT_IMPORTED',
              targetId: profile.id,
              targetName: profile.name,
              before: {
                designation: before.designation,
                biography: before.biography,
                interests: before.interests,
                publicEmail: before.publicEmail,
                version: before.version,
              },
              after: { ...base, revisionId: revision.id, version: before.version + 1 },
              details: {
                source: 'CV_Ashish_Karn (1).pdf supplied for the faculty profile',
                collectionDate: source.collection.collectedOn,
                reviewNotes: source.reviewNotes,
                fingerprint,
                summary,
                dummyDataImported: false,
              },
              deduplicationKey,
            },
          });
          const after = await transaction.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } });
          for (const [key, value] of Object.entries({
            id: profile.id,
            slug: profile.slug,
            category: profile.category,
            imageUrl: profile.imageUrl,
            userId: profile.userId,
            visible: profile.visible,
            displayOrder: profile.displayOrder,
          })) {
            assert.equal(after[key as keyof typeof after], value, `${key} must remain unchanged`);
          }
          return { alreadyImported: false, revision: revision.revisionNumber };
        },
        { timeout: 30000, isolationLevel: 'Serializable' },
      );
      console.log(JSON.stringify({ applied: true, ...result, faculty: profile.name, ...summary }, null, 2));
    }
  }
} finally {
  await database.$disconnect();
}
