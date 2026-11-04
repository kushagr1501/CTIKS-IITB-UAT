import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { connect } from 'node:net';
import path from 'node:path';
import pg from 'pg';

const root = path.resolve('/backups');
const mediaRoot = path.resolve('/data/ctiks-media');
const backupIdPattern = /^ctiks-\d{8}T\d{6}Z-[a-f0-9]{8}$/;
const testDatabasePattern = /^ctiks_restore_\d{14}_[a-f0-9]{6}$/;
const day = 24 * 60 * 60 * 1000;
const [operation, selectedId, confirmation] = process.argv.slice(2);
const liveDatabaseUrl = process.env.CTIKS_LIVE_DATABASE_URL ?? process.env.DATABASE_URL;

function backupId() {
  return `ctiks-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}-${randomBytes(4).toString('hex')}`;
}

function retentionCount() {
  const value = Number(process.env.BACKUP_KEEP ?? '14');
  if (!Number.isInteger(value) || value < 1 || value > 365) throw new Error('BACKUP_KEEP must be from 1 to 365.');
  return value;
}

async function runScript(script, args, environment = process.env) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { env: environment, stdio: 'inherit' });
    child.once('error', () => reject(new Error('The database tool could not start.')));
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error('The database tool failed.')));
  });
}

async function fileHash(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

async function copyMedia(source, destination, { live = false } = {}) {
  await mkdir(destination, { recursive: true, mode: live ? 0o755 : 0o700 });
  const files = [];
  async function visit(sourceDirectory, targetDirectory, prefix) {
    for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile()))
        throw new Error('The media folder contains an unsupported file.');
      const from = path.join(sourceDirectory, entry.name);
      const to = path.join(targetDirectory, entry.name);
      const relative = [...prefix, entry.name].join('/');
      if (entry.isDirectory()) {
        await mkdir(to, { mode: live ? 0o755 : 0o700 });
        await visit(from, to, [...prefix, entry.name]);
      } else {
        await copyFile(from, to);
        if (live) await chmod(to, 0o644);
        const { size } = await stat(to);
        files.push({ path: relative, size, sha256: await fileHash(to) });
      }
    }
  }
  await visit(source, destination, []);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function availableBackups() {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() && backupIdPattern.test(entry.name))
    .map((entry) => entry.name).sort().reverse();
}

async function makeBackup({ prune = true, protectedCopy = false } = {}) {
  if (!liveDatabaseUrl) throw new Error('DATABASE_URL is required.');
  const id = backupId();
  const staging = path.join(root, `.incomplete-${id}`);
  const final = path.join(root, id);
  await mkdir(root, { recursive: true, mode: 0o700 });
  await mkdir(staging, { mode: 0o700 });
  try {
    const databaseFile = path.join(staging, 'database.dump');
    await runScript('scripts/backup-restore.mjs', ['backup', '--output', databaseFile],
      { ...process.env, DATABASE_URL: liveDatabaseUrl });
    const databaseBytes = (await stat(databaseFile)).size;
    if (!databaseBytes) throw new Error('The database dump is empty.');
    const databaseSha256 = await fileHash(databaseFile);
    const media = await copyMedia(mediaRoot, path.join(staging, 'media'));
    await writeFile(path.join(staging, 'manifest.json'), JSON.stringify({
      id, createdAt: new Date().toISOString(), databaseBytes, databaseSha256, media,
      protectedCopy,
    }, null, 2), { mode: 0o600 });
    await rename(staging, final);
    console.log(`Backup ready: ${id} (${media.length} media files).`);
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
  if (prune) {
    const keep = retentionCount();
    const ordinaryIds = [];
    for (const backup of await availableBackups()) {
      try {
        const { manifest } = await manifestFor(backup);
        if (!manifest.protectedCopy) ordinaryIds.push(backup);
      } catch {
        console.error(`Unreadable backup retained for manual review: ${backup}`);
      }
    }
    for (const oldId of ordinaryIds.slice(keep)) {
      await rm(path.join(root, oldId), { recursive: true, force: true });
      console.log(`Removed older backup: ${oldId}`);
    }
  }
  return id;
}

async function manifestFor(id) {
  if (!backupIdPattern.test(id ?? '')) throw new Error('Choose a backup ID shown by list.');
  const directory = path.join(root, id);
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (manifest.id !== id || !Array.isArray(manifest.media)) throw new Error('Backup manifest is invalid.');
  return { directory, manifest };
}

async function listBackups() {
  const ids = await availableBackups();
  if (!ids.length) return console.log('No completed backups are available yet.');
  for (const id of ids) {
    try {
      const { manifest } = await manifestFor(id);
      console.log(`${id}  ${manifest.createdAt}  ${manifest.media.length} media files${manifest.protectedCopy ? '  pre-restore safety copy' : ''}`);
    } catch {
      console.log(`${id}  incomplete or unreadable; do not restore`);
    }
  }
}

async function verifyMedia(directory, media) {
  for (const entry of media) {
    if (typeof entry.path !== 'string' || entry.path.startsWith('/') || entry.path.includes('\\') ||
        entry.path.split('/').some((segment) => !segment || segment === '.' || segment === '..') ||
        typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256))
      throw new Error('Backup manifest contains an unsafe media path.');
    const filename = path.join(directory, ...entry.path.split('/'));
    if ((await stat(filename)).size !== entry.size || await fileHash(filename) !== entry.sha256)
      throw new Error('A restored media file failed verification.');
  }
}

async function verifiedBackup(id) {
  const { directory, manifest } = await manifestFor(id);
  const databaseFile = path.join(directory, 'database.dump');
  if ((await stat(databaseFile)).size !== manifest.databaseBytes ||
      await fileHash(databaseFile) !== manifest.databaseSha256)
    throw new Error('The database dump failed verification.');
  await verifyMedia(path.join(directory, 'media'), manifest.media);
  return { directory, manifest, databaseFile };
}

async function restoreTest(id) {
  const { directory, manifest, databaseFile } = await verifiedBackup(id);
  const source = liveDatabaseUrl;
  if (!source) throw new Error('DATABASE_URL is required.');
  const databaseName = `ctiks_restore_${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}_${randomBytes(3).toString('hex')}`;
  if (!testDatabasePattern.test(databaseName)) throw new Error('Invalid test database name.');
  const restoredUrl = new URL(source);
  restoredUrl.pathname = `/${databaseName}`;
  const testDirectory = path.join(root, 'restore-checks', databaseName);
  const admin = new pg.Client({ connectionString: source });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.end();
  }
  try {
    await runScript('scripts/backup-restore.mjs', [
      'restore', '--file', databaseFile, '--apply',
    ], { ...process.env, DATABASE_URL: restoredUrl.toString() });
    const testMedia = path.join(testDirectory, 'media');
    await copyMedia(path.join(directory, 'media'), testMedia);
    await verifyMedia(testMedia, manifest.media);
    const client = new pg.Client({ connectionString: restoredUrl.toString() });
    await client.connect();
    let tables;
    try {
      const result = await client.query(`SELECT count(*)::int AS total FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')`);
      tables = result.rows[0].total;
    } finally {
      await client.end();
    }
    if (!tables) throw new Error('The restored database has no tables.');
    console.log(`Restore check ready: ${databaseName}; ${tables} tables; ${manifest.media.length} verified media files.`);
    console.log(`Restored media copy: ${testMedia}`);
    console.log('The live ctiks database and media folder were not changed.');
  } catch (error) {
    await rm(testDirectory, { recursive: true, force: true });
    const cleanup = new pg.Client({ connectionString: source });
    await cleanup.connect();
    try {
      await cleanup.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    } finally {
      await cleanup.end();
    }
    throw error;
  }
}

async function cleanupTest(databaseName) {
  if (!testDatabasePattern.test(databaseName ?? ''))
    throw new Error('Choose a ctiks_restore database name reported by restore-test.');
  if (!liveDatabaseUrl) throw new Error('DATABASE_URL is required.');
  const client = new pg.Client({ connectionString: liveDatabaseUrl });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  } finally {
    await client.end();
  }
  await rm(path.join(root, 'restore-checks', databaseName), { recursive: true, force: true });
  console.log(`Removed restore check: ${databaseName}. The live ctiks database was not changed.`);
}

async function replaceLiveMedia(source) {
  for (const entry of await readdir(mediaRoot))
    await rm(path.join(mediaRoot, entry), { recursive: true, force: true });
  await copyMedia(source, mediaRoot, { live: true });
}

async function appIsListening() {
  return new Promise((resolve) => {
    const socket = connect({ host: 'app', port: 3000 });
    socket.setTimeout(1500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}

async function restoreLive(id) {
  if (confirmation !== '--apply') throw new Error('Use restore-live BACKUP_ID --apply.');
  if (!liveDatabaseUrl || new URL(liveDatabaseUrl).pathname !== '/ctiks')
    throw new Error('Live restore requires the ctiks database.');
  const { directory, manifest, databaseFile } = await verifiedBackup(id);
  if (await appIsListening()) throw new Error('Stop the app and backup containers before restoring.');

  const adminUrl = new URL(liveDatabaseUrl);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = randomBytes(3).toString('hex');
  const stageName = `ctiks_restore_${stamp}_${suffix}`;
  const previousName = `ctiks_previous_${stamp}_${suffix}`;
  let safetyId;
  let stageCreated = false;
  let mediaChanged = false;
  let liveLocked = false;
  let previousRenamed = false;
  let stageRenamed = false;
  try {
    const active = await admin.query(
      "SELECT count(*)::int AS total FROM pg_stat_activity WHERE datname = 'ctiks'");
    if (active.rows[0].total) throw new Error('Stop the app and backup containers before restoring.');

    safetyId = await makeBackup({ prune: false, protectedCopy: true });
    console.log(`Current state saved first as backup: ${safetyId}`);
    await admin.query(`CREATE DATABASE "${stageName}"`);
    stageCreated = true;
    const stageUrl = new URL(liveDatabaseUrl);
    stageUrl.pathname = `/${stageName}`;
    await runScript('scripts/backup-restore.mjs',
      ['restore', '--file', databaseFile, '--apply'],
      { ...process.env, DATABASE_URL: stageUrl.toString() });
    const stage = new pg.Client({ connectionString: stageUrl.toString() });
    await stage.connect();
    try {
      const result = await stage.query(
        "SELECT count(*)::int AS total FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p')");
      if (!result.rows[0].total) throw new Error('The restored database has no tables.');
    } finally {
      await stage.end();
    }

    mediaChanged = true;
    await replaceLiveMedia(path.join(directory, 'media'));
    await verifyMedia(mediaRoot, manifest.media);
    const stillActive = await admin.query(
      "SELECT count(*)::int AS total FROM pg_stat_activity WHERE datname = 'ctiks'");
    if (stillActive.rows[0].total) throw new Error('Stop the app and backup containers before restoring.');
    await admin.query('ALTER DATABASE "ctiks" WITH ALLOW_CONNECTIONS false');
    liveLocked = true;
    await admin.query(`ALTER DATABASE "ctiks" RENAME TO "${previousName}"`);
    previousRenamed = true;
    await admin.query(`ALTER DATABASE "${stageName}" RENAME TO "ctiks"`);
    stageRenamed = true;
    await admin.query(`DROP DATABASE "${previousName}"`);
    console.log(`Live restore completed from ${id}; ${manifest.media.length} media files.`);
    console.log(`Previous live state is saved as backup: ${safetyId}`);
    console.log('Start the app and backup containers, then verify the website.');
  } catch (error) {
    const rollbackErrors = [];
    try {
      if (stageRenamed) await admin.query(`ALTER DATABASE "ctiks" RENAME TO "${stageName}"`);
      if (previousRenamed) await admin.query(`ALTER DATABASE "${previousName}" RENAME TO "ctiks"`);
      if (liveLocked) await admin.query('ALTER DATABASE "ctiks" WITH ALLOW_CONNECTIONS true');
    } catch {
      rollbackErrors.push('database');
    }
    try {
      if (mediaChanged && safetyId)
        await replaceLiveMedia(path.join(root, safetyId, 'media'));
    } catch {
      rollbackErrors.push('media');
    }
    try {
      if (!rollbackErrors.length && stageCreated)
        await admin.query(`DROP DATABASE IF EXISTS "${stageName}" WITH (FORCE)`);
    } catch {
      rollbackErrors.push('staging database');
    }
    if (safetyId) console.error(`Safety backup retained: ${safetyId}.`);
    if (rollbackErrors.length)
      throw new Error(`Live restore failed; automatic rollback failed for ${rollbackErrors.join(' and ')}. Keep the site stopped.`);
    throw error;
  } finally {
    await admin.end();
  }
}

async function serve() {
  for (;;) {
    let delay = day;
    try {
      const database = new pg.Client({ connectionString: liveDatabaseUrl });
      let ready;
      try {
        await database.connect();
        const result = await database.query(
          "SELECT to_regclass('public.activities') IS NOT NULL AND to_regclass('public.users') IS NOT NULL AS ready");
        ready = result.rows[0].ready;
      } finally {
        await database.end().catch(() => {});
      }
      if (ready) await makeBackup();
      else {
        console.log('Waiting for database import before the first automatic backup.');
        delay = 60 * 1000;
      }
    } catch {
      console.error('Automatic backup failed; retrying in one hour. Check database, media storage and backup disk.');
      delay = 60 * 60 * 1000;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

try {
  if (operation === 'serve') await serve();
  else if (operation === 'run') await makeBackup();
  else if (operation === 'list') await listBackups();
  else if (operation === 'restore-test') await restoreTest(selectedId);
  else if (operation === 'cleanup-test') await cleanupTest(selectedId);
  else if (operation === 'restore-live') await restoreLive(selectedId);
  else throw new Error('Use serve, run, list, restore-test BACKUP_ID, cleanup-test TEST_DATABASE, or restore-live BACKUP_ID --apply.');
} catch (error) {
  const message = error instanceof Error ? error.message : '';
  const safe = /^(BACKUP_KEEP|Choose a backup ID|Choose a ctiks_restore|Backup manifest|A restored media|The restored database|The media folder|Invalid test database|The database dump|Use serve|Use restore-live|Live restore requires|Stop the app|Live restore failed)/.test(message);
  console.error(safe ? message : 'Backup operation failed. Check the backup container and storage.');
  process.exitCode = 1;
}
