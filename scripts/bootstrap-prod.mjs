import { spawn } from 'node:child_process';
import pg from 'pg';

const target = process.env.TARGET_DATABASE_URL;
const source = process.env.SOURCE_DATABASE_URL;

if (!target) {
  console.error('TARGET_DATABASE_URL is required for production setup.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: target });
try {
  await client.connect();
  const result = await client.query(`SELECT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
  ) AS occupied`);
  if (result.rows[0].occupied) {
    console.log('Existing PostgreSQL data found; Neon import skipped.');
  } else {
    if (!source) throw new Error('The database is empty. Set SOURCE_DATABASE_URL to import Neon before starting the site.');
    await client.end();
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/transfer-postgres.mjs', '--apply'], {
        stdio: 'inherit',
        env: process.env,
      });
      child.once('error', () => reject(new Error('The Neon import could not start.')));
      child.once('close', (code) => code === 0 ? resolve() : reject(new Error('The Neon import failed.')));
    });
  }
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith('The database is empty.')
    ? error.message : 'Database setup failed. Check the PostgreSQL and Neon connections.');
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
