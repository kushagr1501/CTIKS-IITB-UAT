import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, writeFile, open } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/server/auth/passwords';
import { Redis } from 'ioredis';
import { createAuthStorage, authKeys, touchSession } from '../src/server/auth/redis-storage';
import { credentialAdapter } from '../src/server/auth/credential-adapter';
import { checkActivities } from './integration/activities';
import { checkResearch } from './integration/research';
import { checkAdminFacultyUi, checkAdminResearchUi } from './integration/browser-ui';
import { BrowserSession, expectStatus } from './integration/http-session';
import { applyTestMigrations } from './integration/migrations';
import { checkFacultyDirectory } from './integration/faculty-directory';
import { createFacultyAccount, checkFacultyAccess } from './integration/faculty-accounts';
import { checkFacultyDeletion } from './integration/faculty-deletion';
import { checkAudit } from './integration/audit';

config({ path: ['.env.migrations.local', '.env.local'], quiet: true });
if (!process.env.DIRECT_URL)
  throw new Error('Integration tests require migration-owner access in .env.migrations.local.');
const schema = `ctiks_test_${randomBytes(6).toString('hex')}`;
assert.match(schema, /^ctiks_test_[a-f0-9]{12}$/);
if (!process.env.REDIS_URL) throw new Error('Configure local Redis before integration tests.');
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
redis.on('error', () => {});
const storage = createAuthStorage(redis, schema);
const keys = authKeys(schema);
const connection = new URL(process.env.DIRECT_URL);
if (!['localhost', '127.0.0.1'].includes(connection.hostname))
  connection.searchParams.set('sslmode', 'verify-full');
const owner = new pg.Pool({ connectionString: connection.toString(), max: 1 });
const port = 3002;
const origin = `http://127.0.0.1:${port}`;
let server: ChildProcess | undefined;
let database: PrismaClient | undefined;
let logFile: FileHandle | undefined;

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await new Promise<void>((done) => {
    server!.once('exit', () => done());
    setTimeout(done, 5000);
  });
}

try {
  await redis.ping();
  await owner.query(`CREATE SCHEMA "${schema}"`);
  await applyTestMigrations(connection.toString(), schema);
  database = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: connection.toString(), max: 2, options: `-c search_path=${schema}` },
      { schema },
    ),
    log: [],
  });
  const id = randomUUID();
  let password = randomBytes(24).toString('base64url');
  const email = `integration-${randomBytes(4).toString('hex')}@ctiks.local`;
  await database.user.create({
    data: {
      id,
      name: 'Integration Administrator',
      email,
      role: 'ADMIN',
      accounts: {
        create: {
          id: randomUUID(),
          password: await hashPassword(password),
        },
      },
    },
  });

  const accountColumns = await database.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = 'accounts' AND column_name IN ('providerId', 'accountId')`,
  );
  assert.equal(accountColumns.length, 0, 'provider identity columns are absent');
  await assert.rejects(database.account.create({ data: { id: randomUUID(), userId: id } }), {
    code: 'P2002',
  });
  const accountReader = credentialAdapter(database)({
    user: { additionalFields: { role: { type: 'string', input: false, defaultValue: 'CORE_FACULTY' } } },
  });
  const credential = await accountReader.findOne<{ userId: string; providerId: string; accountId: string }>({
    model: 'account',
    where: [
      { field: 'providerId', value: 'credential' },
      { field: 'accountId', value: id },
    ],
  });
  assert.equal(credential?.userId, id);
  assert.equal(credential?.providerId, 'credential');
  assert.equal(credential?.accountId, id);
  assert.equal(
    await accountReader.findOne({
      model: 'account',
      where: [
        { field: 'providerId', value: 'google' },
        { field: 'accountId', value: id },
      ],
    }),
    null,
    'a different provider must not select a password account',
  );
  assert.equal(
    await accountReader.findOne({
      model: 'account',
      where: [
        { field: 'userId', value: 'another-user' },
        { field: 'accountId', value: id },
      ],
    }),
    null,
    'translating account identity must preserve the user ownership condition',
  );
  console.log('PASS minimal credential schema and account ownership checks');

  connection.searchParams.set('schema', schema);
  await mkdir(resolve('.private'), { recursive: true });
  const logPath = `.private/integration-server-${schema}.log`;
  logFile = await open(resolve(logPath), 'wx');
  console.log(`Integration server log: ${logPath}`);
  server = spawn(
    process.execPath,
    [
      resolve('node_modules/next/dist/bin/next'),
      'dev',
      '--webpack',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        DATABASE_URL: connection.toString(),
        DIRECT_URL: '',
        BETTER_AUTH_URL: origin,
        BETTER_AUTH_SECRET: randomBytes(48).toString('base64url'),
        CTIKS_TEST_DIST_DIR: '.next-integration',
        REDIS_NAMESPACE: schema,
      },
      stdio: ['ignore', logFile.fd, logFile.fd],
      windowsHide: true,
    },
  );
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Integration server stopped. See ${logPath}.`);
    try {
      ready = (await fetch(origin + '/login')).ok;
    } catch {
      /* Wait for startup. */
    }
    if (ready) break;
    await new Promise((done) => setTimeout(done, 500));
  }
  assert.ok(ready, 'Integration server did not become ready.');
  const browser = new BrowserSession(origin);
  async function latestSession() {
    const references = JSON.parse((await redis.get(`${keys.prefix}active-sessions-${id}`))!);
    const token: string = references.at(-1).token;
    return { token, value: JSON.parse((await storage.get(token)) as string) };
  }
  await expectStatus(await browser.request('/api/admin/faculty'), 401, 'anonymous faculty access denied');
  await expectStatus(await browser.request('/api/admin/audit-logs'), 401, 'anonymous audit access denied');
  await expectStatus(
    await browser.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email, password },
      csrf: false,
    }),
    403,
    'login requires CSRF token',
  );
  await expectStatus(
    await browser.request('/api/auth/sign-up/email', { method: 'POST', body: { email, password } }),
    404,
    'public signup unavailable',
  );
  await expectStatus(
    await browser.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email, password: 'wrong-password' },
    }),
    401,
    'incorrect password rejected',
  );
  const login = await expectStatus(
    await browser.request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }),
    200,
    'admin login',
  );
  assert.ok(
    login.headers
      .getSetCookie()
      .some((cookie) => /httponly/i.test(cookie) && /samesite=strict/i.test(cookie)),
  );
  const loginData = await login.json();
  assert.equal('token' in loginData, false, 'session token must not be exposed to JavaScript');
  assert.equal('emailVerified' in loginData.user, false, 'email verification is absent from the API');
  const authSession = await expectStatus(
    await browser.request('/api/auth/get-session'),
    404,
    'unneeded session-read endpoint remains unavailable',
  );
  assert.equal((await authSession.json()).error, 'Not found.');
  const transientTables = await database.$queryRawUnsafe<
    { sessions: string | null; rate_limits: string | null; verifications: string | null }[]
  >(
    `SELECT to_regclass('${schema}.sessions')::text AS sessions, to_regclass('${schema}.rate_limits')::text AS rate_limits, to_regclass('${schema}.verifications')::text AS verifications`,
  );
  assert.equal(transientTables[0].sessions, null);
  assert.equal(transientTables[0].rate_limits, null);
  assert.equal(transientTables[0].verifications, null);
  const userColumns = await database.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = 'users' AND column_name = 'emailVerified'`,
  );
  assert.equal(userColumns.length, 0, 'email verification column is absent');
  const initialSession = await latestSession();
  const initialTtl = await redis.ttl(keys.prefix + initialSession.token);
  assert.ok(initialTtl > 0 && initialTtl <= 30 * 60, 'Redis enforces the idle expiry');
  await expectStatus(
    await browser.request('/api/admin/faculty'),
    200,
    'admin can manage faculty immediately after login',
  );
  await expectStatus(
    await browser.request('/api/auth/two-factor/enable', { method: 'POST', body: { password } }),
    404,
    'removed authenticator endpoint is unavailable',
  );
  const oldBrowser = new BrowserSession(origin);
  await expectStatus(
    await oldBrowser.request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }),
    200,
    'second browser login',
  );
  const secondSession = await latestSession();
  const newPassword = randomBytes(24).toString('base64url');
  await expectStatus(
    await browser.request('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword: password, newPassword, revokeOtherSessions: true },
    }),
    200,
    'voluntary password change',
  );
  await expectStatus(
    await oldBrowser.request('/api/admin/faculty'),
    401,
    'password change revokes other browser sessions',
  );
  assert.equal(
    await touchSession(redis, schema, secondSession.token, new Date(secondSession.value.session.expiresAt)),
    false,
    'an in-flight request must not recreate a revoked session',
  );
  assert.equal(await redis.get(keys.prefix + secondSession.token), null);
  await expectStatus(
    await oldBrowser.request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }),
    401,
    'previous password no longer works',
  );
  password = newPassword;
  await expectStatus(
    await browser.request('/api/admin/faculty'),
    200,
    'current browser retains access after password change',
  );
  await database.user.update({ where: { id }, data: { role: 'CORE_FACULTY' } });
  await expectStatus(
    await browser.request('/api/admin/faculty'),
    403,
    'role downgrade is enforced on existing session',
  );
  await database.user.update({ where: { id }, data: { role: 'ADMIN' } });

  const directory = await checkFacultyDirectory(database, browser);

  const account = await createFacultyAccount(database, browser, directory.values);
  await checkActivities(database, browser, new BrowserSession(origin), account.facultyBrowser);
  await checkResearch(database, browser, new BrowserSession(origin), account.facultyBrowser);
  const access = await checkFacultyAccess(database, browser, directory, account);

  await checkFacultyDeletion(
    database,
    browser,
    { redis, storage, keys, schema, id },
    directory,
    account,
    access,
  );

  await checkAudit(database, browser, password);

  await expectStatus(
    await browser.request('/api/auth/sign-out', { method: 'POST', body: {} }),
    200,
    'logout',
  );
  await expectStatus(await browser.request('/api/admin/faculty'), 401, 'logout revokes access');
  await expectStatus(
    await browser.request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }),
    200,
    'password login after logout',
  );
  const idleSession = await latestSession();
  idleSession.value.session.lastActiveAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
  await storage.set(idleSession.token, JSON.stringify(idleSession.value));
  await expectStatus(await browser.request('/api/admin/faculty'), 401, 'idle session expires');
  assert.ok(await database.auditEvent.findFirst({ where: { action: 'LOGOUT' } }));
  await expectStatus(
    await browser.request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }),
    200,
    'password login after idle expiry',
  );
  await expectStatus(
    await browser.request('/api/admin/audit-logs'),
    200,
    'expired Redis session is recorded in Neon',
  );
  assert.ok(await database.auditEvent.findFirst({ where: { action: 'SESSION_EXPIRED' } }));
  const absoluteSession = await latestSession();
  absoluteSession.value.session.expiresAt = new Date(Date.now() - 1000).toISOString();
  await storage.set(absoluteSession.token, JSON.stringify(absoluteSession.value));
  await expectStatus(await browser.request('/api/admin/faculty'), 401, 'absolute session expiry');

  // Run UI CRUD after audit-history assertions so its expected test events remain isolated.
  await expectStatus(
    await browser.request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } }),
    200,
    'admin login for browser UI checks',
  );
  await checkAdminFacultyUi(browser, origin);
  await checkAdminResearchUi(browser, origin);

  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await browser.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email, password: 'incorrect-again' },
    });
    if (response.status === 429) {
      console.log('PASS Redis-backed login rate limit');
      break;
    }
    if (attempt === 11) throw new Error('Login attempt limit was not enforced.');
  }
  await writeFile(
    resolve('.private/integration-result.json'),
    JSON.stringify({ passed: true, verifiedAt: new Date().toISOString() }, null, 2),
  );
  console.log('All integration checks passed in an isolated temporary schema.');
} finally {
  await stopServer();
  await logFile?.close();
  await database?.$disconnect();
  // Remove only this run's random namespace, never shared application keys.
  try {
    if (redis.status === 'ready') {
      for await (const batch of redis.scanStream({ match: `${schema}:*`, count: 100 })) {
        if (batch.length) await redis.del(...batch);
      }
    }
  } finally {
    redis.disconnect();
    // Only the generated test namespace is removable; never drop public or a supplied name.
    assert.match(schema, /^ctiks_test_[a-f0-9]{12}$/);
    try {
      await owner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await owner.end();
    }
  }
}
