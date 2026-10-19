import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { setupDatabase } from './database';

const slugs = ['vijayaraghavan-m-chariar', 'nagendra-pavana'];
const database = setupDatabase();
const apply = process.argv.includes('--apply');
try {
  const snapshot = await database.facultyProfile.findMany({
    where: { slug: { in: slugs } },
    include: {
      revisions: {
        include: {
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
  await mkdir('.private/reviewed-faculty', { recursive: true });
  const backup = `.private/reviewed-faculty/before-restore-${Date.now()}.json`;
  await writeFile(backup, JSON.stringify(snapshot, null, 2));
  const result = await database.$transaction(
    async (tx) => {
      const results = [];
      for (const original of snapshot) {
        const key = `faculty-source-restore:2026-10-19:${original.id}:baseline-1`;
        if (await tx.auditEvent.findUnique({ where: { deduplicationKey: key } })) {
          results.push({ slug: original.slug, alreadyRestored: true });
          continue;
        }
        const before = await tx.facultyProfile.findUniqueOrThrow({ where: { id: original.id } });
        assert.equal(before.version, original.version, 'Concurrent edit; review before restoring.');
        assert.equal(before.category, 'CORE');
        assert.ok(
          !original.revisions.some((r) => ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'].includes(r.status)),
          'A working draft needs review.',
        );
        const baseline = original.revisions.find((r) => r.revisionNumber === 1);
        assert.ok(baseline, 'Original baseline is missing.');
        // This rollback restores only the original empty academic profiles.
        for (const key of [
          'education',
          'experience',
          'courses',
          'publications',
          'patents',
          'students',
        ] as const)
          assert.equal(baseline[key].length, 0, 'Baseline contains academic records; review manually.');
        const published = original.revisions.find((r) => r.status === 'PUBLISHED');
        assert.ok(published);
        const imported = await tx.auditEvent.findFirst({
          where: { action: 'FACULTY_CONTENT_IMPORTED', targetId: before.id },
          orderBy: { createdAt: 'desc' },
        });
        assert.ok(imported, 'Published content is not a recorded import.');
        const importedAfter = imported.after as { revisionId?: string; version?: number };
        assert.equal(
          importedAfter.revisionId,
          published.id,
          'Newer content must be reviewed before restoring.',
        );
        assert.equal(importedAfter.version, before.version, 'Profile changed after import.');
        if (!apply) {
          results.push({ slug: before.slug, dryRun: true, restoringRevision: 1 });
          continue;
        }
        const base = {
          biography: baseline.biography,
          interests: baseline.interests,
          publicEmail: baseline.publicEmail,
        };
        const changed = await tx.facultyProfile.updateMany({
          where: { id: before.id, version: before.version },
          data: { ...base, version: { increment: 1 } },
        });
        assert.equal(changed.count, 1);
        await tx.facultyProfileRevision.updateMany({
          where: { facultyId: before.id, status: 'PUBLISHED' },
          data: { status: 'SUPERSEDED' },
        });
        const restored = await tx.facultyProfileRevision.create({
          data: {
            facultyId: before.id,
            revisionNumber: Math.max(...original.revisions.map((r) => r.revisionNumber)) + 1,
            sourceProfileVersion: before.version + 1,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            ...base,
            imageUrl: before.imageUrl,
            websiteUrl: before.websiteUrl,
            researchTags: baseline.researchTags,
            researchOverview: baseline.researchOverview,
            officeAddress: baseline.officeAddress,
            publicPhone: baseline.publicPhone,
          },
        });
        await tx.auditEvent.create({
          data: {
            action: 'FACULTY_CONTENT_RESTORED',
            targetId: before.id,
            targetName: before.name,
            before: {
              revisionId: published.id,
              biography: before.biography,
              interests: before.interests,
              publicEmail: before.publicEmail,
              version: before.version,
            },
            after: { revisionId: restored.id, ...base, version: before.version + 1 },
            details: {
              requestedAction: 'Undo source imports before reviewing the two user-specified sites',
              restoredFromRevision: baseline.id,
              previousRevisionsRetained: true,
            },
            deduplicationKey: key,
          },
        });
        results.push({ slug: before.slug, restored: true, revision: restored.revisionNumber });
      }
      return results;
    },
    { isolationLevel: 'Serializable', timeout: 30000 },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await database.$disconnect();
}
