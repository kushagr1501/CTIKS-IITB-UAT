import { spawn } from 'node:child_process';
import { open, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const [operation, ...args] = process.argv.slice(2);
const pathFlag = operation === 'backup' ? '--output' : '--file';
const pathIndex = args.indexOf(pathFlag);
const file = pathIndex >= 0 ? args[pathIndex + 1] : undefined;
const url = process.env.DATABASE_URL;

if (!url || !file || !['backup', 'restore'].includes(operation) ||
    (operation === 'restore' && !args.includes('--apply'))) {
  console.error('Usage: DATABASE_URL=... node scripts/backup-restore.mjs backup --output FILE');
  console.error('   or: DATABASE_URL=... node scripts/backup-restore.mjs restore --file FILE --apply');
  process.exit(1);
}

function connectionEnvironment(connection) {
  const parsed = new URL(connection);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('Invalid database URL.');
  const environment = {
    ...process.env,
    PGHOST: parsed.hostname,
    PGPORT: parsed.port || '5432',
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: decodeURIComponent(parsed.pathname.slice(1)),
  };
  delete environment.DATABASE_URL;
  if (parsed.searchParams.has('sslmode')) environment.PGSSLMODE = parsed.searchParams.get('sslmode');
  if (parsed.searchParams.has('channel_binding')) environment.PGCHANNELBINDING = parsed.searchParams.get('channel_binding');
  return environment;
}

async function run(command, commandArgs, environment) {
  await new Promise((success, failure) => {
    const child = spawn(command, commandArgs, { env: environment, stdio: ['ignore', 'ignore', 'pipe'] });
    // PostgreSQL errors may include connection details. Keep them out of logs.
    child.stderr.resume();
    child.once('error', () => failure(new Error(`${command} could not start.`)));
    child.once('close', (code) => code === 0 ? success() : failure(new Error(`${command} failed (exit ${code}).`)));
  });
}

const filename = resolve(file);
try {
  const environment = connectionEnvironment(url);
  if (operation === 'backup') {
    // Reserve the name before pg_dump runs, so an existing backup is never overwritten.
    const handle = await open(filename, 'wx', 0o600);
    await handle.close();
    try {
      await run('pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--file', filename], environment);
    } catch (error) {
      await rm(filename, { force: true });
      throw error;
    }
    console.log(`Backup created: ${filename}`);
  } else {
    if (!(await stat(filename)).isFile()) throw new Error('Backup path is not a file.');
    await run('pg_restore', ['--list', filename], environment);
    const pool = new pg.Pool({ connectionString: url });
    try {
      const result = await pool.query(`SELECT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
          AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      ) AS occupied`);
      if (result.rows[0].occupied) throw new Error('Target database is not empty. Nothing was restored.');
    } finally {
      await pool.end();
    }
    await run('pg_restore', [
      '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges',
      '--dbname', environment.PGDATABASE, filename,
    ], environment);
    console.log('Restore completed. Verify the data and site before switching traffic.');
  }
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
    console.error('Backup file already exists. Choose a new filename.');
  } else {
    const safe = error instanceof Error && /^(Target database|Backup path|pg_dump|pg_restore|Invalid database)/.test(error.message);
    console.error(safe ? error.message : 'Backup or restore failed. Check the target, file, and database access.');
  }
  process.exitCode = 1;
}
