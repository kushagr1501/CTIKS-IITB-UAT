import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

export async function applyTestMigrations(connectionString: string, schema: string): Promise<void> {
  const testPool = new pg.Pool({
    connectionString: connectionString,
    max: 1,
    options: `-c search_path=${schema}`,
  });
  try {
    const migrations = (await readdir(resolve('prisma/migrations')))
      .filter((name) => /^\d+_/.test(name))
      .sort();
    for (const migration of migrations) {
      const visibilityCases = migration.endsWith('_faculty_visibility')
        ? [
            { id: randomUUID(), status: 'PUBLISHED', archivedAt: null, visible: true },
            { id: randomUUID(), status: 'DRAFT', archivedAt: null, visible: false },
            { id: randomUUID(), status: 'PUBLISHED', archivedAt: new Date(), visible: false },
            { id: randomUUID(), status: 'DRAFT', archivedAt: new Date(), visible: false },
          ]
        : [];
      for (const entry of visibilityCases)
        await testPool.query(
          `INSERT INTO faculty_profiles
          (id, slug, name, category, department, interests, status, "archivedAt", "updatedAt")
         VALUES ($1, $1, 'Migration fixture', 'CORE', 'CTIKS', '', $2::"PublicationStatus", $3, now())`,
          [entry.id, entry.status, entry.archivedAt],
        );
      const sql = await readFile(resolve(`prisma/migrations/${migration}/migration.sql`), 'utf8');
      await testPool.query(sql);
      if (visibilityCases.length) {
        const { rows } = await testPool.query('SELECT id, visible FROM faculty_profiles');
        for (const entry of visibilityCases)
          assert.equal(rows.find((row) => row.id === entry.id)?.visible, entry.visible);
        await testPool.query('DELETE FROM faculty_profiles WHERE id = ANY($1::text[])', [
          visibilityCases.map((entry) => entry.id),
        ]);
        console.log('PASS visibility migration preserves published, draft, and archived profile visibility');
      }
    }
  } finally {
    await testPool.end();
  }
}
