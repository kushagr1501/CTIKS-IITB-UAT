import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';

const { SOURCE_DATABASE_URL: source, TARGET_DATABASE_URL: target } = process.env;
if (!source || !target || !process.argv.includes('--apply')) {
  console.error('Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL, then run with --apply. The target must be empty.');
  process.exit(1);
}

function destination(value) {
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database URL.');
  return `${url.hostname.replace('-pooler.', '.')}:${url.port || '5432'}${url.pathname}`;
}

async function execute(command, args, databaseUrl) {
  const url = new URL(databaseUrl);
  const environment = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)) };
  delete environment.SOURCE_DATABASE_URL;
  delete environment.TARGET_DATABASE_URL;
  if (url.searchParams.has('sslmode')) environment.PGSSLMODE = url.searchParams.get('sslmode');
  if (url.searchParams.has('channel_binding')) environment.PGCHANNELBINDING = url.searchParams.get('channel_binding');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    // Do not print database tools' errors: connection messages can contain credentials.
    child.stderr.resume();
    child.once('error', reject);
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} failed (exit ${code}).`)));
  });
}

let temp;
const pool = new pg.Pool({ connectionString: target });
try {
  if (destination(source) === destination(target)) throw new Error('Source and target must be different databases.');
  const result = await pool.query(`SELECT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
  ) AS occupied`);
  if (result.rows[0].occupied) throw new Error('Target database is not empty. Nothing was imported.');
  await pool.end();
  temp = await mkdtemp(join(tmpdir(), 'ctiks-transfer-'));
  const dump = join(temp, 'database.dump');
  console.log('Exporting the source database to a temporary archive...');
  await execute('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--file', dump], source);
  console.log('Restoring into the empty target database...');
  await execute('pg_restore', ['--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges', '--dbname', decodeURIComponent(new URL(target).pathname.slice(1)), dump], target);
  console.log('Transfer completed. Verify the restored site using the target database account.');
} catch (error) {
  console.error(error instanceof Error && /^(Source and target|Target database|Invalid database|pg_dump failed|pg_restore failed)/.test(error.message)
    ? error.message : 'Transfer failed. Check database access and PostgreSQL client tools.');
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
  if (temp) await rm(temp, { recursive: true, force: true });
}
