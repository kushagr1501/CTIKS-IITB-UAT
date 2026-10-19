import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: ['.env.migrations.local', '.env.local'], quiet: true });
if (!process.env.DIRECT_URL) throw new Error('Configure the migration-owner DIRECT_URL first.');
const connection = new URL(process.env.DIRECT_URL);
if (!['localhost', '127.0.0.1'].includes(connection.hostname))
  connection.searchParams.set('sslmode', 'verify-full');
const schema = `ctiks_faculty_test_${randomBytes(6).toString('hex')}`;
assert.match(schema, /^ctiks_faculty_test_[a-f0-9]{12}$/);
const pool = new pg.Pool({ connectionString: connection.toString(), max: 1 });
const db = await pool.connect();
const target = '202610190004_faculty_academic_profiles';
let created = false;

try {
  await db.query(`CREATE SCHEMA "${schema}"`);
  created = true;
  await db.query(`SET search_path TO "${schema}"`);
  const migrations = (await readdir('prisma/migrations')).filter((name) => /^\d+_/.test(name)).sort();
  for (const migration of migrations.filter((name) => name < target))
    await db.query(await readFile(`prisma/migrations/${migration}/migration.sql`, 'utf8'));

  const userId = randomUUID();
  await db.query(
    `INSERT INTO users (id, name, email, role, "updatedAt")
     VALUES ($1, 'Schema fixture', $2, 'CORE_FACULTY', now())`,
    [userId, `${userId}@example.invalid`],
  );
  await db.query(`INSERT INTO accounts (id, "userId", password, "updatedAt") VALUES ($1, $2, $3, now())`, [
    randomUUID(),
    userId,
    'test-only-existing-hash',
  ]);
  const fixtures = [
    { id: randomUUID(), category: 'CORE', visible: true, userId },
    { id: randomUUID(), category: 'CORE', visible: false, userId: null },
    { id: randomUUID(), category: 'ASSOCIATE', visible: true, userId: null },
  ];
  for (const fixture of fixtures)
    await db.query(
      `INSERT INTO faculty_profiles (id, slug, name, category, designation, department,
        interests, biography, "imageUrl", "websiteUrl", "publicEmail", "displayOrder",
        visible, version, "userId", "updatedAt")
       VALUES ($1, $1, 'Existing professor', $2::"FacultyCategory", 'Professor', 'CTIKS',
        'Indian mathematics, astronomy; historical methods', 'Existing biography',
        '/assets/faculty.jpg', 'https://example.org', 'public@example.org', 4, $3, 7, $4, now())`,
      [fixture.id, fixture.category, fixture.visible, fixture.userId],
    );
  const before = (await db.query('SELECT * FROM faculty_profiles ORDER BY id')).rows;
  const accountsBefore = (await db.query('SELECT * FROM accounts ORDER BY id')).rows;
  await db.query(await readFile(`prisma/migrations/${target}/migration.sql`, 'utf8'));
  assert.deepEqual((await db.query('SELECT * FROM faculty_profiles ORDER BY id')).rows, before);
  assert.deepEqual((await db.query('SELECT * FROM accounts ORDER BY id')).rows, accountsBefore);
  const baselines = (await db.query('SELECT * FROM faculty_profile_revisions')).rows;
  assert.equal(baselines.length, 2);
  for (const baseline of baselines) {
    const original = before.find((row) => row.id === baseline.facultyId)!;
    assert.equal(original.category, 'CORE');
    for (const field of ['biography', 'imageUrl', 'websiteUrl', 'publicEmail', 'interests'])
      assert.equal(baseline[field], original[field]);
    assert.equal(baseline.status, 'PUBLISHED');
    assert.equal(baseline.sourceProfileVersion, 7);
    assert.equal(baseline.revisionNumber, 1);
    assert.deepEqual(baseline.researchTags, []);
    assert.equal(baseline.reviewedById, null);
    assert.ok(baseline.publishedAt);
  }
  console.log('PASS existing visible/hidden core profiles, logins and content preserved');

  const facultyId = fixtures[0].id;
  const revisionId = randomUUID();
  async function insertRevision(id: string, number: number, status = 'DRAFT') {
    return db.query(
      `INSERT INTO faculty_profile_revisions
       (id, "facultyId", "revisionNumber", "sourceProfileVersion", status, "publishedAt", "updatedAt")
       VALUES ($1, $2, $3, 7, $4::"FacultyRevisionStatus",
         CASE WHEN $4 = 'PUBLISHED' THEN now() ELSE NULL END, now())`,
      [id, facultyId, number, status],
    );
  }
  await insertRevision(revisionId, 2);
  await assert.rejects(insertRevision(randomUUID(), 3), { code: '23505' });
  await assert.rejects(insertRevision(randomUUID(), 3, 'PUBLISHED'), { code: '23505' });
  await assert.rejects(insertRevision(randomUUID(), 2, 'SUPERSEDED'), { code: '23514' });
  await assert.rejects(insertRevision(randomUUID(), 3, 'SUBMITTED'), { code: '23514' });
  await assert.rejects(
    db.query('UPDATE faculty_profile_revisions SET "sourceProfileVersion" = 0 WHERE id = $1', [revisionId]),
    { code: '23514' },
  );
  await assert.rejects(
    db.query('UPDATE faculty_profile_revisions SET "researchTags" = $2 WHERE id = $1', [revisionId, ['']]),
    { code: '23514' },
  );
  await assert.rejects(
    db.query('UPDATE faculty_profile_revisions SET "researchTags" = NULL WHERE id = $1', [revisionId]),
    { code: '23502' },
  );
  console.log('PASS one working/published revision and required workflow/version metadata');

  const entries = [
    { table: 'faculty_education', columns: 'title, "periodText"', values: "'Ph.D.', '2018–Present'" },
    { table: 'faculty_experience', columns: 'title', values: "'Professor'" },
    { table: 'faculty_courses', columns: 'title, status', values: "'Indian astronomy', 'CURRENT'" },
    { table: 'faculty_publications', columns: 'title, type', values: "'Research paper', 'JOURNAL_ARTICLE'" },
    { table: 'faculty_patents', columns: 'title', values: "'Research invention'" },
    { table: 'faculty_students', columns: 'name, status', values: "'Student', 'CURRENT'" },
  ];
  for (const entry of entries) {
    // Identifiers and fragments come only from the fixed fixtures above.
    await db.query(
      `INSERT INTO ${entry.table} (id, "revisionId", ${entry.columns}) VALUES ($1, $2, ${entry.values})`,
      [randomUUID(), revisionId],
    );
    await assert.rejects(
      db.query(`UPDATE ${entry.table} SET "displayOrder" = -1 WHERE "revisionId" = $1`, [revisionId]),
      { code: '23514' },
    );
    await assert.rejects(
      db.query(
        `INSERT INTO ${entry.table} (id, "revisionId", ${entry.columns}) VALUES ($1, $2, ${entry.values})`,
        [randomUUID(), randomUUID()],
      ),
      { code: '23503' },
    );
  }
  assert.deepEqual((await db.query('SELECT * FROM faculty_profiles ORDER BY id')).rows, before);
  assert.equal(
    (
      await db.query('SELECT count(*)::int AS n FROM faculty_education WHERE "revisionId" = $1', [
        baselines.find((row) => row.facultyId === facultyId)!.id,
      ])
    ).rows[0].n,
    0,
  );
  console.log('PASS structured sections accept entries without changing published content');

  await db.query(
    `UPDATE faculty_profile_revisions SET status = 'SUBMITTED', "submittedById" = $2,
      "submittedAt" = now() WHERE id = $1`,
    [revisionId, userId],
  );
  await assert.rejects(
    db.query(`UPDATE faculty_profile_revisions SET status = 'CHANGES_REQUESTED' WHERE id = $1`, [revisionId]),
    { code: '23514' },
  );
  await db.query('DELETE FROM faculty_profile_revisions WHERE id = $1', [revisionId]);
  for (const entry of entries)
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM ${entry.table}`)).rows[0].n, 0);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM faculty_profile_revisions')).rows[0].n, 2);
  console.log('PASS draft cleanup cascades through all sections and preserves baselines');
} finally {
  await db.query('ROLLBACK');
  await db.query('SET search_path TO public');
  if (created) await db.query(`DROP SCHEMA "${schema}" CASCADE`);
  db.release();
  await pool.end();
}
