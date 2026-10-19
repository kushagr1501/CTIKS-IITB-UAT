import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile, open } from 'node:fs/promises';
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
import { checkFacultyEditor } from './integration/faculty-editor';

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
connection.searchParams.set('sslmode', 'verify-full');
const owner = new pg.Pool({ connectionString: connection.toString(), max: 1 });
const port = 3002;
const origin = `http://127.0.0.1:${port}`;
let server: ChildProcess | undefined;
let database: PrismaClient | undefined;

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await new Promise<void>((done) => {
    server!.once('exit', () => done());
    setTimeout(done, 5000);
  });
}

class BrowserSession {
  cookies = new Map<string, string>();
  acceptCookies(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0];
      const index = pair.indexOf('=');
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }
  async request(
    path: string,
    options: { method?: string; body?: unknown; csrf?: boolean; origin?: string } = {},
  ): Promise<Response> {
    const method = options.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (method !== 'GET' && options.csrf !== false) {
      const csrf = await this.request('/api/auth/csrf');
      assert.equal(csrf.status, 200, 'CSRF token request');
      headers['x-csrf-token'] = (await csrf.json()).token;
    }
    headers.cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    if (method !== 'GET') headers.origin = options.origin ?? origin;
    if (options.body !== undefined) headers['content-type'] = 'application/json';
    const response = await fetch(origin + path, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      redirect: 'manual',
    });
    this.acceptCookies(response);
    return response;
  }
}

async function expectStatus(response: Response, expected: number, label: string) {
  if (response.status !== expected) {
    const body = await response
      .clone()
      .json()
      .catch(() => ({}));
    throw new Error(
      `${label}: expected ${expected}, received ${response.status}. ${body.error ?? body.message ?? ''}`,
    );
  }
  console.log(`PASS ${label}`);
  return response;
}

try {
  await redis.ping();
  await owner.query(`CREATE SCHEMA "${schema}"`);
  const testPool = new pg.Pool({
    connectionString: connection.toString(),
    max: 1,
    options: `-c search_path=${schema}`,
  });
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
  await testPool.end();
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
  const logFile = await open(resolve('.private/integration-server.log'), 'w');
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
      throw new Error('Integration server stopped. See .private/integration-server.log.');
    try {
      ready = (await fetch(origin + '/login')).ok;
    } catch {
      /* Wait for startup. */
    }
    if (ready) break;
    await new Promise((done) => setTimeout(done, 500));
  }
  assert.ok(ready, 'Integration server did not become ready.');
  const browser = new BrowserSession();
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
  const oldBrowser = new BrowserSession();
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

  const values = {
    name: 'Integration Faculty',
    slug: 'integration-faculty',
    category: 'CORE',
    designation: 'Core Faculty Member',
    department: 'CTIKS',
    interests: 'Mathematics',
    biography: 'Test biography',
    imageUrl: 'https://i.pinimg.com/736x/52/bd/42/photo.jpg',
    websiteUrl: 'https://www.iitb.ac.in/',
    publicEmail: 'faculty@ctiks.local',
    displayOrder: 0,
    visible: false,
  };
  await expectStatus(
    await browser.request('/api/admin/faculty', { method: 'POST', body: { ...values, role: 'ADMIN' } }),
    400,
    'privilege injection rejected',
  );
  await expectStatus(
    await browser.request('/api/admin/faculty', {
      method: 'POST',
      body: { ...values, imageUrl: 'http://127.0.0.1/secret' },
    }),
    400,
    'non-HTTPS image URL rejected',
  );
  await expectStatus(
    await browser.request('/api/admin/faculty', {
      method: 'POST',
      body: values,
      origin: 'https://untrusted.test',
    }),
    403,
    'cross-origin change rejected',
  );
  let profile = (
    await (
      await expectStatus(
        await browser.request('/api/admin/faculty', { method: 'POST', body: values }),
        201,
        'hidden faculty creation',
      )
    ).json()
  ).faculty;
  assert.equal(profile.imageUrl, values.imageUrl, 'images from any HTTPS host can be saved');
  assert.equal(
    (await database.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } })).imageUrl,
    values.imageUrl,
    'external image URL is persisted',
  );
  assert.ok(
    !(await (await browser.request('/people')).text()).includes('Integration Faculty'),
    'hidden faculty must remain private',
  );
  const visibleProfile = { ...values, visible: true, version: profile.version };
  profile = (
    await (
      await expectStatus(
        await browser.request(`/api/admin/faculty/${profile.id}`, { method: 'PATCH', body: visibleProfile }),
        200,
        'make faculty visible using editor',
      )
    ).json()
  ).faculty;
  assert.ok(
    (await (await browser.request('/people')).text()).includes('Integration Faculty'),
    'visible faculty appears on public page',
  );
  await expectStatus(
    await browser.request(`/api/admin/faculty/${profile.id}`, { method: 'PATCH', body: visibleProfile }),
    409,
    'stale edit rejected',
  );
  const cleared = {
    ...values,
    visible: true,
    biography: '',
    imageUrl: '',
    websiteUrl: '',
    publicEmail: '',
    version: profile.version,
  };
  await database.facultyProfile.update({
    where: { id: profile.id },
    data: { imageUrl: 'https://legacy-images.invalid/old.png' },
  });
  profile = (
    await (
      await expectStatus(
        await browser.request(`/api/admin/faculty/${profile.id}`, { method: 'PATCH', body: cleared }),
        200,
        'optional field clearing',
      )
    ).json()
  ).faculty;
  assert.equal(
    (await database.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } })).websiteUrl,
    '',
  );
  assert.equal(
    (await database.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } })).imageUrl,
    '',
    'clearing must also remove legacy image URLs',
  );
  for (const category of ['ADJUNCT', 'ASSOCIATE', 'VISITING']) {
    await expectStatus(
      await browser.request('/api/admin/faculty', {
        method: 'POST',
        body: {
          ...values,
          category,
          slug: category.toLowerCase(),
          name: `Integration ${category}`,
          visible: true,
        },
      }),
      201,
      `${category} category creation`,
    );
  }
  const publicHtml = await (await browser.request('/people')).text();
  for (const name of ['Adjunct Faculty', 'Associate Faculty', 'Visiting Faculty'])
    assert.ok(publicHtml.includes(name));
  const visibleVersion = profile.version;
  await expectStatus(
    await browser.request(`/api/admin/faculty/${profile.id}/visibility`, {
      method: 'PATCH',
      body: { visible: 'false', version: profile.version },
    }),
    400,
    'visibility requires a boolean',
  );
  await expectStatus(
    await browser.request(`/api/admin/faculty/${profile.id}/visibility`, {
      method: 'PATCH',
      csrf: false,
      body: { visible: false, version: profile.version },
    }),
    403,
    'visibility requires CSRF',
  );
  profile = (
    await (
      await expectStatus(
        await browser.request(`/api/admin/faculty/${profile.id}/visibility`, {
          method: 'PATCH',
          body: { visible: false, version: profile.version },
        }),
        200,
        'hide faculty',
      )
    ).json()
  ).faculty;
  assert.equal(profile.visible, false);
  assert.equal(
    (await database.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } })).visible,
    false,
  );
  assert.ok(!(await (await browser.request('/people')).text()).includes('Integration Faculty'));
  const hiddenEdit = {
    ...cleared,
    name: 'Integration Faculty (edited while hidden)',
    version: profile.version,
  };
  profile = (
    await (
      await expectStatus(
        await browser.request(`/api/admin/faculty/${profile.id}`, {
          method: 'PATCH',
          body: { ...hiddenEdit, visible: false },
        }),
        200,
        'hidden faculty remains editable',
      )
    ).json()
  ).faculty;
  assert.equal(profile.visible, false);
  assert.ok(!(await (await browser.request('/people')).text()).includes('Integration Faculty'));
  await expectStatus(
    await browser.request(`/api/admin/faculty/${profile.id}/visibility`, {
      method: 'PATCH',
      body: { visible: true, version: visibleVersion },
    }),
    409,
    'stale visibility change rejected',
  );
  profile = (
    await (
      await expectStatus(
        await browser.request(`/api/admin/faculty/${profile.id}/visibility`, {
          method: 'PATCH',
          body: { visible: true, version: profile.version },
        }),
        200,
        'show faculty directly on website',
      )
    ).json()
  ).faculty;
  assert.equal(profile.visible, true);
  assert.equal(
    (await database.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } })).visible,
    true,
  );
  assert.ok((await (await browser.request('/people')).text()).includes('Integration Faculty'));
  for (const [action, before, after] of [
    ['FACULTY_HIDDEN', true, false],
    ['FACULTY_SHOWN', false, true],
  ] as const) {
    const auditEntry: { before: unknown; after: unknown } = await database.auditEvent.findFirstOrThrow({
      where: { targetId: profile.id, action },
      select: { before: true, after: true },
    });
    assert.deepEqual(auditEntry.before, { visible: before });
    assert.deepEqual(auditEntry.after, { visible: after });
  }
  console.log('PASS hide/show persistence, public directory visibility, hidden edits, and audit values');

  // Faculty provisioning and ownership checks use only this run's temporary schema.
  const facultyEmail = `faculty-${randomBytes(4).toString('hex')}@ctiks.local`;
  const facultyPassword = 'Ab3!x9';
  const accountInput = {
    ...values,
    slug: 'faculty-account',
    name: 'Account Faculty',
    login: { email: facultyEmail, password: facultyPassword },
  };
  const createdAccount = await expectStatus(
    await browser.request('/api/admin/faculty', { method: 'POST', body: accountInput }),
    201,
    'profile and core faculty login created together',
  );
  const accountBody = await createdAccount.json();
  assert.equal(accountBody.faculty.loginEmail, facultyEmail);
  assert.equal(JSON.stringify(accountBody).includes(facultyPassword), false);
  assert.equal(JSON.stringify(accountBody).includes('$argon2'), false);
  const facultyUser = await database.user.findUniqueOrThrow({
    where: { email: facultyEmail },
    include: { accounts: true, facultyProfile: true },
  });
  assert.equal(facultyUser.role, 'CORE_FACULTY');
  assert.equal(facultyUser.facultyProfile?.id, accountBody.faculty.id);
  assert.ok(facultyUser.accounts[0].password?.startsWith('$argon2id$'));
  await expectStatus(
    await browser.request('/api/admin/faculty', {
      method: 'POST',
      body: { ...accountInput, slug: 'duplicate-login' },
    }),
    409,
    'duplicate login email rejected',
  );
  assert.equal(await database.facultyProfile.findUnique({ where: { slug: 'duplicate-login' } }), null);
  await expectStatus(
    await browser.request('/api/admin/faculty', {
      method: 'POST',
      body: { ...accountInput, slug: 'non-core-login', category: 'VISITING' },
    }),
    400,
    'non-core login provisioning rejected',
  );
  const failedEmail = `failed-${randomBytes(4).toString('hex')}@ctiks.local`;
  await expectStatus(
    await browser.request('/api/admin/faculty', {
      method: 'POST',
      body: { ...accountInput, slug: values.slug, login: { email: failedEmail, password: facultyPassword } },
    }),
    409,
    'duplicate profile rolls back its new login',
  );
  assert.equal(await database.user.findUnique({ where: { email: failedEmail } }), null);
  await expectStatus(
    await browser.request(`/api/admin/faculty/${accountBody.faculty.id}`, {
      method: 'PATCH',
      body: { ...accountInput, version: accountBody.faculty.version },
    }),
    409,
    'existing login cannot be replaced through profile editing',
  );
  const facultyBrowser = new BrowserSession();
  const facultyLogin = await expectStatus(
    await facultyBrowser.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: facultyEmail, password: facultyPassword },
    }),
    200,
    'core faculty signs in with a six-character password',
  );
  const facultyLoginBody = await facultyLogin.json();
  assert.equal(facultyLoginBody.user.role, 'CORE_FACULTY');
  await checkActivities(database, browser, new BrowserSession(), facultyBrowser);
  assert.equal('token' in facultyLoginBody, false);
  const ownResponse = await expectStatus(
    await facultyBrowser.request(`/api/faculty/profile?id=${profile.id}`),
    200,
    'faculty profile is selected from session identity, ignoring a supplied other ID',
  );
  const ownProfile = (await ownResponse.json()).faculty;
  assert.equal(ownProfile.identity.name, 'Account Faculty');
  assert.equal('userId' in ownProfile, false);
  assert.equal('loginEmail' in ownProfile, false);
  assert.equal('password' in ownProfile, false);
  for (const endpoint of ['/api/admin/faculty', '/api/admin/audit-logs'])
    await expectStatus(await facultyBrowser.request(endpoint), 403, `faculty denied ${endpoint}`);
  await expectStatus(
    await facultyBrowser.request(`/api/admin/faculty/${profile.id}`, { method: 'PATCH', body: cleared }),
    403,
    'faculty cannot edit another profile',
  );
  await expectStatus(
    await facultyBrowser.request('/api/admin/faculty', { method: 'POST', body: values }),
    403,
    'faculty cannot provision accounts or profiles',
  );
  await expectStatus(
    await facultyBrowser.request('/api/admin/audit-logs/export', { method: 'POST' }),
    403,
    'faculty cannot export audit history',
  );
  const portal = await expectStatus(await facultyBrowser.request('/faculty'), 200, 'faculty portal renders');
  const portalHtml = await portal.text();
  assert.ok(portalHtml.includes('Account Faculty'));
  assert.ok(!portalHtml.includes('Integration Faculty'));
  assert.ok(portalHtml.includes('Submit &amp; publish'));
  await checkFacultyEditor(
    database,
    browser,
    facultyBrowser,
    new BrowserSession(),
    accountBody.faculty.id,
    profile.id,
  );
  await expectStatus(await facultyBrowser.request('/faculty/security'), 200, 'faculty password page renders');
  const redirected = await facultyBrowser.request('/admin/people');
  if (redirected.status === 307) assert.equal(redirected.headers.get('location'), '/faculty');
  else assert.ok((await redirected.text()).includes('NEXT_REDIRECT;replace;/faculty'));
  const changedFacultyPassword = 'Z9!xy2';
  await expectStatus(
    await facultyBrowser.request('/api/auth/change-password', {
      method: 'POST',
      body: { currentPassword: facultyPassword, newPassword: changedFacultyPassword },
    }),
    200,
    'faculty can change their own six-character password',
  );
  // Hiding a public profile does not revoke its faculty login.
  const hiddenAccount = (
    await (
      await browser.request(`/api/admin/faculty/${accountBody.faculty.id}/visibility`, {
        method: 'PATCH',
        body: {
          visible: false,
          version: (
            await database.facultyProfile.findUniqueOrThrow({ where: { id: accountBody.faculty.id } })
          ).version,
        },
      })
    ).json()
  ).faculty;
  assert.equal(hiddenAccount.loginEmail, facultyEmail);
  await expectStatus(
    await facultyBrowser.request('/api/faculty/profile'),
    200,
    'hidden core faculty retains own access',
  );
  await database.facultyProfile.update({
    where: { id: accountBody.faculty.id },
    data: { category: 'VISITING' },
  });
  await expectStatus(
    await facultyBrowser.request('/api/faculty/profile'),
    401,
    'category change revokes faculty access on an existing session',
  );
  await expectStatus(
    await new BrowserSession().request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: facultyEmail, password: changedFacultyPassword },
    }),
    401,
    'faculty without a core profile cannot start a new session',
  );
  const attachEmail = `attached-${randomBytes(4).toString('hex')}@ctiks.local`;
  const attached = await expectStatus(
    await browser.request(`/api/admin/faculty/${profile.id}`, {
      method: 'PATCH',
      body: {
        ...hiddenEdit,
        visible: true,
        version: profile.version,
        login: { email: attachEmail, password: facultyPassword },
      },
    }),
    200,
    'admin can create a login for an existing core faculty profile',
  );
  profile = (await attached.json()).faculty;
  assert.equal(profile.loginEmail, attachEmail);
  const attachedBrowser = new BrowserSession();
  await expectStatus(
    await attachedBrowser.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: attachEmail, password: facultyPassword },
    }),
    200,
    'login attached to an existing profile works',
  );
  assert.equal(
    (await (await attachedBrowser.request('/api/faculty/profile')).json()).faculty.identity.name,
    hiddenEdit.name,
  );
  const loginAudits = await database.auditEvent.findMany({ where: { action: 'FACULTY_LOGIN_CREATED' } });
  assert.equal(loginAudits.length, 2);
  for (const entry of loginAudits) {
    const serialized = JSON.stringify(entry);
    assert.equal(serialized.includes(facultyPassword), false);
    assert.equal(serialized.includes('$argon2'), false);
  }
  console.log(
    'PASS faculty provisioning, transaction rollback, six-character passwords, ownership, role boundaries, and secret-free auditing',
  );

  const deletionPath = `/api/admin/faculty/${profile.id}`;
  const deletionBody = { version: profile.version };
  const attachedUser = await database.user.findUniqueOrThrow({ where: { email: attachEmail } });
  const attachedReferences = JSON.parse(
    (await redis.get(`${keys.prefix}active-sessions-${attachedUser.id}`))!,
  );
  const attachedToken = attachedReferences.at(-1).token;
  const attachedSession = JSON.parse((await storage.get(attachedToken)) as string);
  await expectStatus(
    await new BrowserSession().request(deletionPath, { method: 'DELETE', body: deletionBody }),
    401,
    'anonymous faculty deletion denied',
  );
  await expectStatus(
    await attachedBrowser.request(deletionPath, { method: 'DELETE', body: deletionBody }),
    403,
    'faculty cannot delete their own or another profile',
  );
  await expectStatus(
    await browser.request(deletionPath, { method: 'DELETE', body: deletionBody, csrf: false }),
    403,
    'deletion requires CSRF protection',
  );
  await expectStatus(
    await browser.request(deletionPath, {
      method: 'DELETE',
      body: deletionBody,
      origin: 'https://untrusted.test',
    }),
    403,
    'cross-origin deletion rejected',
  );
  await expectStatus(
    await browser.request(deletionPath, { method: 'DELETE', body: { version: profile.version - 1 } }),
    409,
    'stale delete confirmation cannot remove a modified profile',
  );
  await expectStatus(
    await browser.request(deletionPath, { method: 'DELETE', body: {} }),
    400,
    'deletion requires a record version',
  );
  const adminLinked = await database.facultyProfile.create({
    data: { ...values, category: 'CORE', slug: 'admin-linked', userId: id },
  });
  await expectStatus(
    await browser.request(`/api/admin/faculty/${adminLinked.id}`, {
      method: 'DELETE',
      body: { version: adminLinked.version },
    }),
    409,
    'deletion cannot remove administrator credentials through a linked profile',
  );
  assert.equal(await database.account.count({ where: { userId: id } }), 1);

  // An audit failure must roll back the profile, credentials, and retired email together.
  await database.$executeRawUnsafe(
    `ALTER TABLE "${schema}".audit_events ADD CONSTRAINT test_reject_delete CHECK (action <> 'FACULTY_DELETED')`,
  );
  await expectStatus(
    await browser.request(deletionPath, { method: 'DELETE', body: deletionBody }),
    500,
    'failed deletion audit rolls back the whole database transaction',
  );
  assert.ok(await database.facultyProfile.findUnique({ where: { id: profile.id } }));
  assert.equal(await database.account.count({ where: { userId: attachedUser.id } }), 1);
  assert.equal(
    (await database.user.findUniqueOrThrow({ where: { id: attachedUser.id } })).email,
    attachEmail,
  );
  await expectStatus(
    await attachedBrowser.request('/api/faculty/profile'),
    200,
    'failed deletion preserves faculty access',
  );
  await database.$executeRawUnsafe(`ALTER TABLE "${schema}".audit_events DROP CONSTRAINT test_reject_delete`);

  const deletion = await expectStatus(
    await browser.request(deletionPath, { method: 'DELETE', body: deletionBody }),
    200,
    'admin deletes a faculty profile with a linked login',
  );
  assert.equal((await deletion.json()).deleted.id, profile.id);
  assert.equal(await database.facultyProfile.findUnique({ where: { id: profile.id } }), null);
  assert.equal(await database.account.count({ where: { userId: attachedUser.id } }), 0);
  const retainedIdentity = await database.user.findUniqueOrThrow({ where: { id: attachedUser.id } });
  assert.ok(retainedIdentity.email.endsWith('@accounts.invalid'));
  assert.equal(retainedIdentity.role, 'CORE_FACULTY');
  assert.ok(
    await database.auditEvent.findFirst({ where: { actorId: attachedUser.id, action: 'LOGIN_SUCCESS' } }),
  );
  const deleteAudit = await database.auditEvent.findFirstOrThrow({
    where: { action: 'FACULTY_DELETED', targetId: profile.id },
  });
  assert.equal((deleteAudit.before as { name: string }).name, hiddenEdit.name);
  assert.deepEqual(deleteAudit.details, { loginDisabled: true, loginEmail: attachEmail });
  assert.equal(JSON.stringify(deleteAudit).includes(facultyPassword), false);
  assert.equal(JSON.stringify(deleteAudit).includes('$argon2'), false);
  assert.equal(await redis.get(keys.prefix + attachedToken), null);
  assert.equal(
    await touchSession(redis, schema, attachedToken, new Date(attachedSession.session.expiresAt)),
    false,
  );
  await expectStatus(
    await attachedBrowser.request('/api/faculty/profile'),
    401,
    'deletion revokes existing faculty sessions',
  );
  await expectStatus(
    await new BrowserSession().request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: attachEmail, password: facultyPassword },
    }),
    401,
    'deleted faculty credentials cannot sign in',
  );
  await expectStatus(
    await browser.request(deletionPath, { method: 'DELETE', body: deletionBody }),
    404,
    'repeated deletion reports a missing profile',
  );
  assert.equal(
    await database.auditEvent.count({ where: { action: 'FACULTY_DELETED', targetId: profile.id } }),
    1,
  );
  assert.ok(!(await (await browser.request('/people')).text()).includes(hiddenEdit.name));
  assert.ok(
    !(await (await browser.request('/api/admin/faculty')).json()).faculty.some(
      (entry: { id: string }) => entry.id === profile.id,
    ),
  );

  const recreated = await expectStatus(
    await browser.request('/api/admin/faculty', {
      method: 'POST',
      body: { ...values, login: { email: attachEmail, password: facultyPassword } },
    }),
    201,
    'a deleted profile identifier and login email can be reused for a fresh account',
  );
  const recreatedProfile = (await recreated.json()).faculty;
  assert.notEqual(recreatedProfile.userId, attachedUser.id);
  await expectStatus(
    await attachedBrowser.request('/api/faculty/profile'),
    401,
    'old sessions stay revoked after email reuse',
  );
  await expectStatus(
    await new BrowserSession().request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email: attachEmail, password: facultyPassword },
    }),
    200,
    'new account can sign in after email reuse',
  );
  const noLogin = await database.facultyProfile.findUniqueOrThrow({ where: { slug: 'adjunct' } });
  await expectStatus(
    await browser.request(`/api/admin/faculty/${noLogin.id}`, {
      method: 'DELETE',
      body: { version: noLogin.version },
    }),
    200,
    'faculty without a login can also be deleted',
  );
  assert.equal(await database.facultyProfile.findUnique({ where: { id: noLogin.id } }), null);
  console.log(
    'PASS faculty deletion, request guards, transaction rollback, session revocation, email reuse, and retained audit history',
  );

  await expectStatus(
    await browser.request('/api/admin/audit-logs?from=2026-02-30'),
    400,
    'invalid audit date rejected',
  );
  await expectStatus(
    await browser.request('/api/admin/audit-logs/export', { method: 'POST', csrf: false }),
    403,
    'CSV export requires CSRF',
  );
  const exported = await expectStatus(
    await browser.request('/api/admin/audit-logs/export', { method: 'POST' }),
    200,
    'CSV export',
  );
  assert.ok(exported.headers.get('content-type')?.includes('text/csv'));
  const csv = await exported.text();
  assert.ok(csv.includes('FACULTY_UPDATED'));
  assert.ok(!csv.includes(password), 'password must never appear in audit export');
  assert.ok(await database.auditEvent.findFirst({ where: { action: 'AUDIT_EXPORTED' } }));
  await assert.rejects(
    database.$executeRawUnsafe('UPDATE audit_events SET action = action'),
    'audit updates must be blocked',
  );

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
  await logFile.close();
} finally {
  await stopServer();
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
