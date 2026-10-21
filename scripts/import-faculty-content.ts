import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setupDatabase } from './database';
import type { FacultyPublicationType, Prisma } from '../src/generated/prisma/client';

// Deliberately accepts only the reviewed collection for this existing identity.
// No demo module is imported and no new faculty/account is provisioned.
const source = JSON.parse(
  await readFile('docs/content/k-ramasubramanian/content.json', 'utf8'),
) as typeof import('../docs/content/k-ramasubramanian/content.json');
const slug = 'k-ramasubramanian';
assert.equal(source.profile.slug, slug);
const allowedTypes = new Set(['JOURNAL_ARTICLE', 'BOOK_CHAPTER', 'CONFERENCE_PAPER']);
const publications: Prisma.FacultyPublicationCreateWithoutRevisionInput[] =
  source.publications.monographs.map((item) => ({
    type: 'RESEARCH_MONOGRAPH',
    title: item.title,
    authors: item.authors,
    venue: item.venue,
    year: item.year,
    url: item.url ?? '',
  }));
for (const item of source.publications.selectedArticles) {
  // Keep incomplete or damaged extracted citations in the source pack for review.
  if (
    !item.title ||
    item.needsReview ||
    item.authors?.includes('‘') ||
    !item.type ||
    !allowedTypes.has(item.type)
  )
    continue;
  publications.push({
    type: item.type as FacultyPublicationType,
    title: item.title.replace(/,$/, ''),
    authors: item.authors ?? '',
    venue: item.bibliographicDetails,
    year: item.year,
  });
}
const editedVolumes = [
  {
    title: '500 Years of Tantrasaṅgraha — A Landmark in the History of Astronomy',
    authors: 'M. S. Sriram; K. Ramasubramanian; M. D. Srinivas',
    year: 2002,
    venue: 'Indian Institute of Advanced Study',
  },
  {
    title: 'Gaṇitānanda',
    authors: 'K. Ramasubramanian',
    year: 2015,
    venue: 'Indian Society of History of Mathematics, Delhi',
  },
  {
    title: 'History of Indian Astronomy: A Handbook',
    authors: 'K. Ramasubramanian; Aniket Sule; Mayank Vahia',
    year: 2016,
    venue: 'TIFR and IIT Bombay',
  },
  {
    title: 'Bhaskara-prabha',
    authors: 'K. Ramasubramanian; Takao Hayashi; Clemency Montelle',
    year: 2018,
    venue: 'Hindustan Book Agency and Springer',
  },
  {
    title: 'Studies in Indian Mathematics and Astronomy',
    authors: 'Aditya Kolachana; K. Mahesh; K. Ramasubramanian',
    year: 2019,
    venue: 'Hindustan Book Agency and Springer',
  },
  {
    title: 'Gaṇitānanda — Selected Articles of R. C. Gupta on History of Mathematics',
    authors: 'K. Ramasubramanian',
    year: 2019,
    venue: 'Springer',
  },
];
for (const item of editedVolumes)
  publications.push({ ...item, type: 'BOOK', authors: `${item.authors} (editors)` });
const academic = {
  researchTags: source.profile.researchTags,
  researchOverview: source.profile.researchOverview,
  officeAddress: source.contactCandidates.officeAddress,
  publicPhone: source.contactCandidates.publicPhone,
  education: source.education.map((item, displayOrder) => ({
    title: item.title,
    institution: item.institution,
    description: item.description,
    periodText: item.periodText,
    displayOrder,
  })),
  experience: source.experience.map((item, displayOrder) => ({
    title: item.title,
    organisation: item.organisation,
    periodText: item.periodText.replace(' (as stated on source)', '').replace('Dates not supplied', ''),
    displayOrder,
  })),
  courses: source.courses.map((item, displayOrder) => ({
    title: item.title,
    code: item.code ?? '',
    periodText: 'NPTEL · 40 lectures',
    description: 'With M. S. Sriram and M. D. Srinivas.',
    status: 'PREVIOUS' as const,
    displayOrder,
  })),
  publications: publications.map((item, displayOrder) => ({ ...item, displayOrder })),
  students: source.students.map((item, displayOrder) => ({
    name: item.name,
    programme: item.programme,
    biography: '',
    researchTopic: item.researchTopic,
    periodText: item.periodText,
    status: 'GRADUATED' as const,
    graduationYear: item.graduationYear,
    displayOrder,
  })),
};
const base = {
  biography: source.profile.biography,
  interests: source.profile.researchTags.join(', '),
  publicEmail: source.contactCandidates.publicEmail,
};
const payload = JSON.stringify({ base, academic });
assert.doesNotMatch(
  payload,
  /DEMO|Sample semester|Sample Academic Block|Illustrative|Research Student [AB]/i,
);
const fingerprint = createHash('sha256').update(payload).digest('hex');
const deduplicationKey = `faculty-source-import:${slug}:${fingerprint}`;
const database = setupDatabase();
const apply = process.argv.includes('--apply');
try {
  const profile = await database.facultyProfile.findUniqueOrThrow({ where: { slug } });
  assert.equal(profile.category, 'CORE');
  const summary = {
    faculty: profile.name,
    education: academic.education.length,
    positions: academic.experience.length,
    courses: academic.courses.length,
    publications: academic.publications.length,
    graduates: academic.students.length,
    currentStudents: 0,
    currentCourses: 0,
    patents: 0,
  };
  if (!apply) {
    console.log(JSON.stringify({ dryRun: true, ...summary }, null, 2));
  } else {
    const otherProfiles = await database.facultyProfile.findMany({
      where: { id: { not: profile.id } },
      orderBy: { id: 'asc' },
    });
    const result = await database.$transaction(
      async (transaction) => {
        if (await transaction.auditEvent.findUnique({ where: { deduplicationKey } }))
          return { alreadyImported: true };
        const before = await transaction.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } });
        assert.equal(before.version, profile.version, 'Profile changed; rerun the import.');
        if (
          await transaction.facultyProfileRevision.findFirst({
            where: { facultyId: profile.id, status: { in: ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'] } },
          })
        )
          throw new Error('An academic draft exists. Review it before publishing an import.');
        const highest = await transaction.facultyProfileRevision.aggregate({
          where: { facultyId: profile.id },
          _max: { revisionNumber: true },
        });
        const updated = await transaction.facultyProfile.updateMany({
          where: { id: profile.id, version: before.version },
          data: { ...base, version: { increment: 1 } },
        });
        assert.equal(updated.count, 1, 'Concurrent edit detected.');
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
            websiteUrl: before.websiteUrl,
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
            action: 'FACULTY_CONTENT_IMPORTED',
            targetId: profile.id,
            targetName: profile.name,
            before: {
              biography: before.biography,
              interests: before.interests,
              publicEmail: before.publicEmail,
              version: before.version,
            },
            after: { ...base, revisionId: revision.id, version: before.version + 1 },
            details: {
              source: 'https://www.kramasubramanian.com/',
              collectionDate: source.collection.collectedOn,
              fingerprint,
              summary,
              dummyDataImported: false,
              contactSource: 'Publicly linked CV; current validity not independently confirmed',
              sources: [
                source.profile.biographySourceUrls[0],
                'https://www.kramasubramanian.com/research/articles-published',
                'https://www.kramasubramanian.com/research/books-published',
                'https://www.kramasubramanian.com/research/edited-volumes',
                'https://www.kramasubramanian.com/research/scholars-nurtured',
                'https://www.kramasubramanian.com/profile/curriculum-vitae',
              ],
            },
            deduplicationKey,
          },
        });
        return { alreadyImported: false, revision: revision.revisionNumber };
      },
      { timeout: 30000, isolationLevel: 'Serializable' },
    );
    assert.deepEqual(
      await database.facultyProfile.findMany({ where: { id: { not: profile.id } }, orderBy: { id: 'asc' } }),
      otherProfiles,
      'Unrelated faculty must remain unchanged',
    );
    const after = await database.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } });
    for (const field of [
      'id',
      'slug',
      'name',
      'category',
      'designation',
      'department',
      'imageUrl',
      'websiteUrl',
      'userId',
      'visible',
      'displayOrder',
    ] as const)
      assert.equal(after[field], profile[field], `${field} must remain unchanged`);
    console.log(JSON.stringify({ applied: true, ...result, ...summary }, null, 2));
  }
} finally {
  await database.$disconnect();
}
