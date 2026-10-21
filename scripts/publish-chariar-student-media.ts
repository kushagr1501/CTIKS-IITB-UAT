import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setupDatabase } from './database';

const sourceUrl = 'https://vm-chariariitb.joyisyou.com/joylab/overview';
const content = JSON.parse(
  await readFile('docs/content/reviewed-2026-10-19/vijayaraghavan-m-chariar.json', 'utf8'),
) as {
  slug: string;
  students: Array<{
    name: string;
    biography: string;
    imageUrl: string;
    socialLinks?: Array<{ platform: string; url: string }>;
    sourceUrl: string;
  }>;
};

assert.equal(content.slug, 'vijayaraghavan-m-chariar');
assert.equal(content.students.length, 4);
for (const student of content.students) {
  assert.equal(student.sourceUrl, sourceUrl);
  assert.ok(student.imageUrl.startsWith('https://vm-chariariitb.joyisyou.com/scholar-images/'));
  for (const link of student.socialLinks ?? []) assert.ok(link.url.startsWith('https://'));
}

const fingerprint = createHash('sha256').update(JSON.stringify(content.students)).digest('hex');
const deduplicationKey = `faculty-student-media:2026-10-20:${content.slug}:${fingerprint}`;
const db = setupDatabase();

try {
  const result = await db.$transaction(
    async (tx) => {
      const profile = await tx.facultyProfile.findUniqueOrThrow({ where: { slug: content.slug } });
      assert.equal(profile.category, 'CORE');
      if (await tx.auditEvent.findUnique({ where: { deduplicationKey } }))
        return { slug: profile.slug, alreadyApplied: true };

      const workingCount = await tx.facultyProfileRevision.count({
        where: { facultyId: profile.id, status: { in: ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'] } },
      });
      assert.equal(workingCount, 0, 'Resolve any working profile draft before publishing this update.');

      const current = await tx.facultyProfileRevision.findFirstOrThrow({
        where: { facultyId: profile.id, status: 'PUBLISHED' },
        orderBy: { revisionNumber: 'desc' },
        include: {
          education: { orderBy: { displayOrder: 'asc' } },
          experience: { orderBy: { displayOrder: 'asc' } },
          courses: { orderBy: { displayOrder: 'asc' } },
          publications: { orderBy: { displayOrder: 'asc' } },
          patents: { orderBy: { displayOrder: 'asc' } },
          students: { orderBy: { displayOrder: 'asc' } },
        },
      });

      const byName = new Map(content.students.map((student) => [student.name, student]));
      const foundNames = new Set<string>();
      const students = current.students.map((student) => {
        const source = byName.get(student.name);
        if (!source) return student;
        foundNames.add(student.name);
        return {
          ...student,
          biography: source.biography,
          imageUrl: source.imageUrl,
          socialLinks: source.socialLinks ?? [],
        };
      });
      assert.deepEqual(
        [...foundNames].sort(),
        [...byName.keys()].sort(),
        'Published student names differ from the source; no records were changed.',
      );

      const changedStudents = current.students.filter((student) => {
        const source = byName.get(student.name);
        return source && (
          student.imageUrl !== source.imageUrl ||
          JSON.stringify(student.socialLinks) !== JSON.stringify(source.socialLinks ?? []) ||
          student.biography !== source.biography
        );
      });
      const summary = {
        slug: profile.slug,
        currentRevision: current.revisionNumber,
        verifiedStudents: students.filter((student) => byName.has(student.name)).map(({ name, biography, imageUrl, socialLinks }) => ({
          name, biography, imageUrl, socialLinks,
        })),
        changedCount: changedStudents.length,
      };
      if (!process.argv.includes('--apply')) return { ...summary, dryRun: true };
      if (changedStudents.length === 0) return { ...summary, alreadyCurrent: true };

      const highest = await tx.facultyProfileRevision.aggregate({
        where: { facultyId: profile.id },
        _max: { revisionNumber: true },
      });
      await tx.facultyProfileRevision.update({
        where: { id: current.id, status: 'PUBLISHED' },
        data: { status: 'SUPERSEDED' },
      });
      const revision = await tx.facultyProfileRevision.create({
        data: {
          facultyId: profile.id,
          revisionNumber: (highest._max.revisionNumber ?? 0) + 1,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          name: current.name,
          designation: current.designation,
          department: current.department,
          biography: current.biography,
          imageUrl: current.imageUrl,
          websiteUrl: current.websiteUrl,
          publicEmail: current.publicEmail,
          interests: current.interests,
          researchTags: current.researchTags,
          researchOverview: current.researchOverview,
          officeAddress: current.officeAddress,
          publicPhone: current.publicPhone,
          education: {
            create: current.education.map(({ title, institution, description, periodText, displayOrder }) => ({
              title, institution, description, periodText, displayOrder,
            })),
          },
          experience: {
            create: current.experience.map(({ title, organisation, description, periodText, displayOrder }) => ({
              title, organisation, description, periodText, displayOrder,
            })),
          },
          courses: {
            create: current.courses.map(({ title, code, periodText, description, status, displayOrder }) => ({
              title, code, periodText, description, status, displayOrder,
            })),
          },
          publications: {
            create: current.publications.map(({ title, type, authors, venue, year, citation, doi, url, displayOrder }) => ({
              title, type, authors, venue, year, citation, doi, url, displayOrder,
            })),
          },
          patents: {
            create: current.patents.map(({ title, inventors, identifier, status, year, description, url, displayOrder }) => ({
              title, inventors, identifier, status, year, description, url, displayOrder,
            })),
          },
          students: {
            create: students.map(({
              name, programme, biography, researchTopic, supervisionRole, periodText, status,
              graduationYear, imageUrl, socialLinks, displayOrder,
            }) => ({
              name, programme, biography, researchTopic, supervisionRole, periodText, status,
              graduationYear, imageUrl, socialLinks, displayOrder,
            })),
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          action: 'FACULTY_STUDENT_MEDIA_PUBLISHED',
          targetId: profile.id,
          targetName: profile.name,
          before: { revisionId: current.id, revisionNumber: current.revisionNumber },
          after: { revisionId: revision.id, revisionNumber: revision.revisionNumber },
          details: { source: sourceUrl, fingerprint, changedStudents: summary.verifiedStudents },
          deduplicationKey,
        },
      });
      return { ...summary, applied: true, newRevision: revision.revisionNumber };
    },
    { isolationLevel: 'Serializable', maxWait: 30000, timeout: 30000 },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.$disconnect();
}
