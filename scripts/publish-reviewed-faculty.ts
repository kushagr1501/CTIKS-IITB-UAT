import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { setupDatabase } from './database';

const https = z.url().refine((value) => value.startsWith('https://'));
const text = z.string().default('');
const source = { sourceUrl: https };
const schema = z
  .object({
    slug: z.enum(['vijayaraghavan-m-chariar', 'nagendra-pavana']),
    primarySource: https,
    collectedOn: z.iso.date(),
    expectedRestoredRevision: z.number().int().positive(),
    sources: z.array(https).min(1),
    reviewNotes: z.array(z.string()).min(1),
    designation: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    websiteUrl: https,
    publicEmail: z.union([z.email(), z.literal('')]),
    biography: z.string().min(1),
    researchTags: z.array(z.string().min(1)).min(1),
    researchOverview: text,
    officeAddress: text,
    publicPhone: text,
    education: z.array(
      z.object({
        ...source,
        title: z.string().min(1),
        institution: text,
        description: text,
        periodText: text,
      }),
    ),
    experience: z.array(
      z.object({
        ...source,
        title: z.string().min(1),
        organisation: text,
        description: text,
        periodText: text,
      }),
    ),
    courses: z.array(
      z.object({
        ...source,
        title: z.string().min(1),
        code: text,
        description: text,
        periodText: text,
        status: z.enum(['CURRENT', 'PREVIOUS']),
      }),
    ),
    publications: z.array(
      z.object({
        ...source,
        type: z.enum(['JOURNAL_ARTICLE', 'BOOK', 'BOOK_CHAPTER', 'CONFERENCE_PAPER', 'RESEARCH_MONOGRAPH']),
        title: z.string().min(1),
        authors: text,
        venue: text,
        year: z.number().int().min(1800).max(2026).optional(),
        citation: text,
        doi: text,
        url: z.union([https, z.literal('')]).default(''),
      }),
    ),
    patents: z.array(
      z.object({
        ...source,
        title: z.string().min(1),
        inventors: text,
        identifier: z.string().min(1),
        status: z.literal('Granted'),
        year: z.number().int().min(1800).max(2026),
        description: text,
        url: https,
      }),
    ),
    students: z.array(
      z.object({
        ...source,
        name: z.string().min(1),
        programme: text,
        biography: text,
        researchTopic: text,
        periodText: text,
        supervisionRole: text,
        status: z.enum(['CURRENT', 'GRADUATED']),
        graduationYear: z.number().int().min(1800).max(2026).nullable().optional(),
        imageUrl: z.union([https, z.literal('')]).default(''),
        socialLinks: z.array(z.object({
          platform: z.enum(['WEBSITE', 'LINKEDIN', 'GOOGLE_SCHOLAR', 'ORCID', 'RESEARCHGATE', 'GITHUB', 'X', 'INSTAGRAM']),
          url: https,
        }).strict()).default([]),
      }),
    ),
  })
  .strict();
const identities = {
  'vijayaraghavan-m-chariar': 'https://vm-chariariitb.joyisyou.com/',
  'nagendra-pavana': 'https://www.sanskritfromhome.org/teacher-profile/Dr.-Nagendra-Pavana-18984714',
} as const;
function ordered<T extends { sourceUrl: string }>(items: T[]) {
  return items.map(({ sourceUrl, ...item }, displayOrder) => {
    assert.ok(sourceUrl);
    return { ...item, displayOrder };
  });
}
const collections = await Promise.all(
  Object.entries(identities).map(async ([slug, url]) => {
    const data = schema.parse(
      JSON.parse(await readFile(`docs/content/reviewed-2026-10-19/${slug}.json`, 'utf8')),
    );
    assert.equal(data.slug, slug);
    assert.equal(data.primarySource, url);
    assert.equal(data.websiteUrl, url);
    const host = new URL(url).hostname;
    for (const sourceUrl of [
      ...data.sources,
      ...[data.education, data.experience, data.courses, data.publications, data.patents, data.students]
        .flat()
        .map((item) => item.sourceUrl),
    ])
      assert.equal(
        new URL(sourceUrl).hostname,
        host,
        'Only the requested source and its own linked content may be imported.',
      );
    const base = {
      biography: data.biography,
      interests: data.researchTags.join(', '),
      publicEmail: data.publicEmail,
      websiteUrl: data.websiteUrl,
      ...(data.designation ? { designation: data.designation } : {}),
      ...(data.department ? { department: data.department } : {}),
    };
    const academic = {
      education: ordered(data.education),
      experience: ordered(data.experience),
      courses: ordered(data.courses),
      publications: ordered(data.publications),
      patents: ordered(data.patents),
      students: ordered(data.students),
    };
    assert.doesNotMatch(
      JSON.stringify({ base, academic }),
      /Lorem ipsum|\bDEMO\b|Illustrative|<\/?[a-z][^>]*>|children:\s*`/i,
    );
    for (const publication of academic.publications)
      assert.doesNotMatch(
        `${publication.title} ${publication.venue}`,
        /under review|expected|forthcoming|in press/i,
      );
    const fingerprint = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return {
      data,
      base,
      academic,
      fingerprint,
      key: `faculty-reviewed-replacement:2026-10-19:${slug}:${fingerprint}`,
    };
  }),
);

const db = setupDatabase();
try {
  const unrelated = await db.facultyProfile.findMany({
    where: { slug: { notIn: Object.keys(identities) } },
    orderBy: { id: 'asc' },
  });
  const result = await db.$transaction(
    async (tx) => {
      const results = [];
      for (const { data, base, academic, fingerprint, key } of collections) {
        const before = await tx.facultyProfile.findUniqueOrThrow({ where: { slug: data.slug } });
        assert.equal(before.category, 'CORE');
        if (await tx.auditEvent.findUnique({ where: { deduplicationKey: key } })) {
          results.push({ slug: data.slug, alreadyPublished: true });
          continue;
        }
        assert.equal(
          await tx.facultyProfileRevision.count({
            where: { facultyId: before.id, status: { in: ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'] } },
          }),
          0,
          'A working draft must be reviewed.',
        );
        const current = await tx.facultyProfileRevision.findFirstOrThrow({
          where: { facultyId: before.id, status: 'PUBLISHED' },
          include: {
            _count: {
              select: {
                education: true,
                experience: true,
                courses: true,
                publications: true,
                patents: true,
                students: true,
              },
            },
          },
        });
        assert.equal(
          current.revisionNumber,
          data.expectedRestoredRevision,
          'Profile has changed since restoration.',
        );
        assert.ok(
          Object.values(current._count).every((count) => count === 0),
          'Expected the restored empty academic profile.',
        );
        const restoration = await tx.auditEvent.findUniqueOrThrow({
          where: { deduplicationKey: `faculty-source-restore:2026-10-19:${before.id}:baseline-1` },
        });
        const restored = restoration.after as { revisionId: string; version: number };
        assert.equal(restored.revisionId, current.id);
        assert.equal(restored.version, before.version);
        const summary = {
          slug: data.slug,
          education: academic.education.length,
          positions: academic.experience.length,
          courses: academic.courses.length,
          publications: academic.publications.length,
          patents: academic.patents.length,
          students: academic.students.length,
        };
        if (!process.argv.includes('--apply')) {
          results.push({ ...summary, dryRun: true });
          continue;
        }
        const highest = await tx.facultyProfileRevision.aggregate({
          where: { facultyId: before.id },
          _max: { revisionNumber: true },
        });
        const changed = await tx.facultyProfile.updateMany({
          where: { id: before.id, version: before.version },
          data: { ...base, version: { increment: 1 } },
        });
        assert.equal(changed.count, 1, 'Concurrent profile change.');
        await tx.facultyProfileRevision.update({ where: { id: current.id }, data: { status: 'SUPERSEDED' } });
        const revision = await tx.facultyProfileRevision.create({
          data: {
            facultyId: before.id,
            revisionNumber: (highest._max.revisionNumber ?? 0) + 1,
            sourceProfileVersion: before.version + 1,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            biography: data.biography,
            interests: base.interests,
            imageUrl: before.imageUrl,
            websiteUrl: data.websiteUrl,
            publicEmail: data.publicEmail,
            researchTags: data.researchTags,
            researchOverview: data.researchOverview,
            officeAddress: data.officeAddress,
            publicPhone: data.publicPhone,
            education: { create: academic.education },
            experience: { create: academic.experience },
            courses: { create: academic.courses },
            publications: { create: academic.publications },
            patents: { create: academic.patents },
            students: { create: academic.students },
          },
        });
        await tx.auditEvent.create({
          data: {
            action: 'FACULTY_REVIEWED_CONTENT_PUBLISHED',
            targetId: before.id,
            targetName: before.name,
            before: {
              revisionId: current.id,
              biography: before.biography,
              interests: before.interests,
              publicEmail: before.publicEmail,
              websiteUrl: before.websiteUrl,
              designation: before.designation,
              department: before.department,
              version: before.version,
            },
            after: { ...base, revisionId: revision.id, version: before.version + 1 },
            details: {
              requestedSourcesOnly: true,
              sources: data.sources,
              reviewNotes: data.reviewNotes,
              collectedOn: data.collectedOn,
              fingerprint,
              summary,
              dummyDataImported: false,
            },
            deduplicationKey: key,
          },
        });
        const after = await tx.facultyProfile.findUniqueOrThrow({ where: { id: before.id } });
        for (const field of [
          'id',
          'slug',
          'name',
          'category',
          'imageUrl',
          'userId',
          'visible',
          'displayOrder',
        ] as const)
          assert.equal(after[field], before[field], `${field} must be preserved`);
        const counts = await tx.facultyProfileRevision.findUniqueOrThrow({
          where: { id: revision.id },
          select: {
            _count: {
              select: {
                education: true,
                experience: true,
                courses: true,
                publications: true,
                patents: true,
                students: true,
              },
            },
          },
        });
        for (const field of Object.keys(academic) as (keyof typeof academic)[])
          assert.equal(counts._count[field], academic[field].length);
        results.push({ ...summary, applied: true, revision: revision.revisionNumber });
      }
      assert.deepEqual(
        await tx.facultyProfile.findMany({
          where: { slug: { notIn: Object.keys(identities) } },
          orderBy: { id: 'asc' },
        }),
        unrelated,
      );
      return results;
    },
    { isolationLevel: 'Serializable', timeout: 30000 },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.$disconnect();
}
