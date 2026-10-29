import assert from 'node:assert/strict';
import type { Redis } from 'ioredis';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { touchSession, type createAuthStorage, type authKeys } from '../../src/server/auth/redis-storage';
import { BrowserSession, expectStatus } from './http-session';
import type { FacultyDirectoryFixture } from './faculty-directory';
import type { FacultyAccountFixture, FacultyAccessFixture } from './faculty-accounts';

type DeletionContext = {
  redis: Redis;
  storage: ReturnType<typeof createAuthStorage>;
  keys: ReturnType<typeof authKeys>;
  schema: string;
  id: string;
};

export async function checkFacultyDeletion(
  database: PrismaClient,
  browser: BrowserSession,
  context: DeletionContext,
  directory: FacultyDirectoryFixture,
  account: FacultyAccountFixture,
  access: FacultyAccessFixture,
): Promise<void> {
  const origin = browser.origin;
  const { redis, storage, keys, schema, id } = context;
  const { values, hiddenEdit } = directory;
  const { facultyPassword } = account;
  const { profile, attachEmail, attachedBrowser } = access;
  const deletionPath = `/api/admin/faculty/${profile.id}`;
  const deletionBody = { version: profile.version };
  const attachedUser = await database.user.findUniqueOrThrow({ where: { email: attachEmail } });
  const attachedReferences = JSON.parse(
    (await redis.get(`${keys.prefix}active-sessions-${attachedUser.id}`))!,
  );
  const attachedToken = attachedReferences.at(-1).token;
  const attachedSession = JSON.parse((await storage.get(attachedToken)) as string);
  await expectStatus(
    await new BrowserSession(origin).request(deletionPath, { method: 'DELETE', body: deletionBody }),
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
    await new BrowserSession(origin).request('/api/auth/sign-in/email', {
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
    await new BrowserSession(origin).request('/api/auth/sign-in/email', {
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
}
