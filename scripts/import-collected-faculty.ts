import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { setupDatabase } from './database';

const httpsUrl = z.url().refine((value) => value.startsWith('https://'));
const provenance = { sourceUrl: httpsUrl, sourcePage: z.number().int().positive().nullable().optional() };
const text = z.string().default('');
const collectionSchema = z
  .object({
    slug: z.enum(['vijayaraghavan-m-chariar', 'nagendra-pavana']),
    collectedOn: z.iso.date(),
    primarySource: httpsUrl,
    sources: z.array(httpsUrl).min(1),
    reviewNotes: z.array(z.string()),
    biography: z.string().min(1),
    researchTags: z.array(z.string().min(1)).min(1),
    researchOverview: text,
    publicEmail: z.email().optional(),
    officeAddress: text,
    publicPhone: text,
    education: z.array(
      z.object({
        ...provenance,
        title: z.string().min(1),
        institution: text,
        periodText: text,
        description: text,
      }),
    ),
    experience: z.array(
      z.object({
        ...provenance,
        title: z.string().min(1),
        organisation: text,
        periodText: text,
        description: text,
      }),
    ),
    courses: z.array(
      z.object({
        ...provenance,
        title: z.string().min(1),
        code: text,
        periodText: text,
        description: text,
        status: z.enum(['CURRENT', 'PREVIOUS']),
      }),
    ),
    publications: z.array(
      z.object({
        ...provenance,
        type: z.enum(['JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER', 'RESEARCH_MONOGRAPH']),
        title: z.string().min(1),
        authors: text,
        venue: text,
        year: z.number().int().min(1800).max(2026).optional(),
        citation: text,
        doi: text,
        url: z.union([httpsUrl, z.literal('')]).default(''),
      }),
    ),
    patents: z.array(
      z.object({
        ...provenance,
        title: z.string().min(1),
        inventors: text,
        identifier: text,
        status: text,
        year: z.number().int().min(1800).max(2026).optional(),
        description: text,
        url: z.union([httpsUrl, z.literal('')]).default(''),
      }),
    ),
    students: z.array(
      z.object({
        ...provenance,
        name: z.string().min(1),
        programme: text,
        researchTopic: text,
        supervisionRole: text,
        periodText: text,
        status: z.enum(['CURRENT', 'GRADUATED']),
        graduationYear: z.number().int().min(1800).max(2026).nullable().optional(),
      }),
    ),
  })
  .strict();

function ordered<T extends { sourceUrl: string; sourcePage?: number | null }>(items: T[]) {
  return items.map(({ sourceUrl, sourcePage, ...item }, displayOrder) => {
    assert.ok(sourceUrl);
    assert.ok(sourcePage === undefined || sourcePage === null || sourcePage > 0);
    return { ...item, displayOrder };
  });
}

const slugs = ['vijayaraghavan-m-chariar', 'nagendra-pavana'] as const;
const collections = await Promise.all(
  slugs.map(async (slug) => {
    const source = collectionSchema.parse(
      JSON.parse(await readFile(`docs/content/${slug}/content.json`, 'utf8')),
    );
    assert.equal(source.slug, slug);
    const academic = {
      researchTags: source.researchTags,
      researchOverview: source.researchOverview,
      officeAddress: source.officeAddress,
      publicPhone: source.publicPhone,
      education: ordered(source.education),
      experience: ordered(source.experience),
      courses: ordered(source.courses),
      publications: ordered(source.publications),
      patents: ordered(source.patents),
      students: ordered(source.students),
    };
    const base = {
      biography: source.biography,
      interests: source.researchTags.join(', '),
      ...(source.publicEmail ? { publicEmail: source.publicEmail } : {}),
    };
    assert.doesNotMatch(
      JSON.stringify({ base, academic }),
      /Lorem ipsum|\bDEMO\b|Sample semester|Illustrative|<\/?[a-z][^>]*>/i,
    );
    const fingerprint = createHash('sha256').update(JSON.stringify({ base, academic })).digest('hex');
    return {
      source,
      academic,
      base,
      fingerprint,
      deduplicationKey: `faculty-source-import:${slug}:${fingerprint}`,
    };
  }),
);

const database = setupDatabase();
const apply = process.argv.includes('--apply');
try {
  const unrelated = await database.facultyProfile.findMany({
    where: { slug: { notIn: [...slugs] } },
    orderBy: { id: 'asc' },
  });
  const results = await database.$transaction(
    async (transaction) => {
      const results = [];
      for (const { source, academic, base, fingerprint, deduplicationKey } of collections) {
        const before = await transaction.facultyProfile.findUniqueOrThrow({ where: { slug: source.slug } });
        assert.equal(before.category, 'CORE');
        const summary = {
          slug: source.slug,
          education: academic.education.length,
          experience: academic.experience.length,
          courses: academic.courses.length,
          publications: academic.publications.length,
          patents: academic.patents.length,
          graduates: academic.students.filter((item) => item.status === 'GRADUATED').length,
          currentStudents: academic.students.filter((item) => item.status === 'CURRENT').length,
        };
        if (await transaction.auditEvent.findUnique({ where: { deduplicationKey } })) {
          results.push({ ...summary, alreadyImported: true });
          continue;
        }
        assert.equal(
          await transaction.facultyProfileRevision.count({
            where: { facultyId: before.id, status: { in: ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'] } },
          }),
          0,
          'Review the existing draft before importing.',
        );
        const highest = await transaction.facultyProfileRevision.aggregate({
          where: { facultyId: before.id },
          _max: { revisionNumber: true },
        });
        // These packs fill the original empty profiles. Do not replace later faculty edits.
        assert.equal(
          highest._max.revisionNumber,
          1,
          'Academic content has changed; review before reimporting.',
        );
        if (!apply) {
          results.push({ ...summary, dryRun: true });
          continue;
        }
        const changed = await transaction.facultyProfile.updateMany({
          where: { id: before.id, version: before.version },
          data: { ...base, version: { increment: 1 } },
        });
        assert.equal(changed.count, 1, 'Concurrent profile edit; rerun after review.');
        await transaction.facultyProfileRevision.updateMany({
          where: { facultyId: before.id, status: 'PUBLISHED' },
          data: { status: 'SUPERSEDED' },
        });
        const revision = await transaction.facultyProfileRevision.create({
          data: {
            facultyId: before.id,
            revisionNumber: 2,
            sourceProfileVersion: before.version + 1,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            ...base,
            publicEmail: source.publicEmail ?? before.publicEmail,
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
            patents: { create: academic.patents },
            students: { create: academic.students },
          },
        });
        await transaction.auditEvent.create({
          data: {
            action: 'FACULTY_CONTENT_IMPORTED',
            targetId: before.id,
            targetName: before.name,
            before: {
              biography: before.biography,
              interests: before.interests,
              publicEmail: before.publicEmail,
              version: before.version,
            },
            after: { ...base, revisionId: revision.id, version: before.version + 1 },
            details: {
              source: source.primarySource,
              sources: source.sources,
              collectionDate: source.collectedOn,
              reviewNotes: source.reviewNotes,
              fingerprint,
              summary,
              dummyDataImported: false,
            },
            deduplicationKey,
          },
        });
        const after = await transaction.facultyProfile.findUniqueOrThrow({ where: { id: before.id } });
        for (const key of [
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
          assert.equal(after[key], before[key], `${key} must be preserved`);
        results.push({ ...summary, applied: true, revision: revision.revisionNumber });
      }
      assert.deepEqual(
        await transaction.facultyProfile.findMany({
          where: { slug: { notIn: [...slugs] } },
          orderBy: { id: 'asc' },
        }),
        unrelated,
      );
      return results;
    },
    { timeout: 30000, isolationLevel: 'Serializable' },
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await database.$disconnect();
}
