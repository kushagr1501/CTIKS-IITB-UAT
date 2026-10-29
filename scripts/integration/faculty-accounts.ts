import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { FacultyRecord } from '../../src/features/admin/types';
import { BrowserSession, expectStatus } from './http-session';
import type { FacultyDirectoryFixture } from './faculty-directory';
import { checkFacultyEditor } from './faculty-editor';
import { checkProfessorEditorUi } from './browser-ui';

export async function createFacultyAccount(
  database: PrismaClient,
  browser: BrowserSession,
  values: FacultyDirectoryFixture['values'],
) {
  const origin = browser.origin;
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
  const accountBody: { faculty: FacultyRecord } = await createdAccount.json();
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
  const facultyBrowser = new BrowserSession(origin);
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
  return { facultyEmail, facultyPassword, accountBody, facultyBrowser, facultyLoginBody };
}

export type FacultyAccountFixture = Awaited<ReturnType<typeof createFacultyAccount>>;

export async function checkFacultyAccess(
  database: PrismaClient,
  browser: BrowserSession,
  directory: FacultyDirectoryFixture,
  account: FacultyAccountFixture,
) {
  const origin = browser.origin;
  const { values, cleared, hiddenEdit } = directory;
  let profile = directory.profile;
  const { facultyEmail, facultyPassword, accountBody, facultyBrowser, facultyLoginBody } = account;
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
    new BrowserSession(origin),
    accountBody.faculty.id,
    profile.id,
  );
  await checkProfessorEditorUi(facultyBrowser, origin);
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
    await new BrowserSession(origin).request('/api/auth/sign-in/email', {
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
  const attachedBrowser = new BrowserSession(origin);
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

  return { profile, attachEmail, attachedBrowser };
}

export type FacultyAccessFixture = Awaited<ReturnType<typeof checkFacultyAccess>>;
