import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canSignIn, hasPermission, PERMISSIONS } from '../src/server/auth/permissions';
import { createCsrfToken, isValidCsrfToken } from '../src/server/auth/csrf-token';
import {
  facultyCreateSchema,
  facultySchema,
  facultyUpdateSchema,
  isValidImageUrl,
  visibilitySchema,
  versionSchema,
} from '../src/server/faculty/schema';
import { csvCell, toCsv } from '../src/server/audit/csv';
import { readJson } from '../src/server/http/body';
import { hashPassword, verifyPassword } from '../src/server/auth/passwords';
import { authRequestSchemas, isAuthPath } from '../src/server/auth/request-schema';
import { credentialAccountWhere } from '../src/server/auth/credential-fields';
import { presentAuditEvent } from '../src/features/admin/audit-presentation';
import { localHttpEnabled, trustedOriginsFor } from '../src/server/auth/trusted-origins';

test('local HTTP override only accepts an explicit loopback origin', () => {
  assert.equal(localHttpEnabled('http://localhost:3000', '1'), true);
  assert.equal(localHttpEnabled('http://127.0.0.1:3000', '1'), true);
  assert.equal(localHttpEnabled('http://localhost:3000', undefined), false);
  assert.equal(localHttpEnabled('http://example.com', '1'), false);
  assert.equal(localHttpEnabled('https://localhost:3443', '1'), false);
});

test('development trusts both loopback names while production stays exact', () => {
  assert.deepEqual(trustedOriginsFor('http://127.0.0.1:3000', false), [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ]);
  assert.deepEqual(trustedOriginsFor('http://localhost:3002', false), [
    'http://localhost:3002',
    'http://127.0.0.1:3002',
  ]);
  assert.deepEqual(trustedOriginsFor('https://uat.ctiks.iitb.ac.in', false), [
    'https://uat.ctiks.iitb.ac.in',
  ]);
  assert.deepEqual(trustedOriginsFor('https://ctiks.iitb.ac.in', true), [
    'https://ctiks.iitb.ac.in',
  ]);
});

test('credential identity rejects disjunctions and unsupported provider comparisons', () => {
  assert.equal(credentialAccountWhere([{ field: 'providerId', value: 'google' }]), null);
  assert.throws(() =>
    credentialAccountWhere([
      { field: 'providerId', value: 'credential' },
      { field: 'userId', value: 'another-user', connector: 'OR' },
    ]),
  );
  assert.throws(() =>
    credentialAccountWhere([{ field: 'accountId', value: ['first', 'second'], operator: 'in' }]),
  );
});

test('auth surface prevents signup, privilege fields, removed MFA routes, and unchanged passwords', () => {
  assert.equal(isAuthPath('/sign-up/email'), false);
  assert.equal(isAuthPath('/update-user'), false);
  for (const endpoint of ['/verify-email', '/send-verification-email', '/change-email'])
    assert.equal(isAuthPath(endpoint), false);
  for (const endpoint of ['enable', 'verify-totp', 'verify-backup-code', 'generate-backup-codes'])
    assert.equal(isAuthPath(`/two-factor/${endpoint}`), false);
  assert.equal(
    authRequestSchemas['/sign-in/email'].safeParse({
      email: 'admin@ctiks.local',
      password: 'example-password',
      role: 'ADMIN',
    }).success,
    false,
  );
  assert.equal(
    authRequestSchemas['/change-password'].safeParse({
      currentPassword: 'same-long-password',
      newPassword: 'same-long-password',
      revokeOtherSessions: true,
    }).success,
    false,
  );
});

test('RBAC denies unknown, inherited, and ungranted roles', () => {
  for (const permission of PERMISSIONS) {
    assert.equal(hasPermission('ADMIN', permission), true);
    assert.equal(
      hasPermission('CORE_FACULTY', permission),
      ['faculty.self.read', 'faculty.self.update'].includes(permission),
    );
    for (const role of ['PUBLIC', '__proto__', 'constructor', 'toString', ''])
      assert.equal(hasPermission(role, permission), false);
  }
});

test('faculty sign-in requires a core role and a linked core profile, independent of public visibility', () => {
  assert.equal(canSignIn('ADMIN'), true);
  assert.equal(canSignIn('CORE_FACULTY', 'CORE'), true);
  for (const category of [undefined, null, 'ADJUNCT', 'ASSOCIATE', 'VISITING'])
    assert.equal(canSignIn('CORE_FACULTY', category), false);
  for (const role of ['PUBLIC', '__proto__', 'constructor', '']) assert.equal(canSignIn(role, 'CORE'), false);
});

test('password changes accept 6–128 characters and reject passwords outside those limits', () => {
  const schema = authRequestSchemas['/change-password'];
  for (const newPassword of ['Ab3!x9', 'Ab3!x9Z', 'a'.repeat(128)]) {
    assert.equal(schema.safeParse({ currentPassword: 'current-password', newPassword }).success, true);
  }
  for (const newPassword of ['', 'Ab3!x', 'a'.repeat(129)]) {
    assert.equal(schema.safeParse({ currentPassword: 'current-password', newPassword }).success, false);
  }
  const tooShort = schema.safeParse({ currentPassword: 'current-password', newPassword: 'Ab3!x' });
  assert.equal(tooShort.success, false);
  if (!tooShort.success) assert.equal(tooShort.error.issues[0].message, 'Use at least 6 characters.');
});

test('delete requests require a positive version and reject extra control fields', () => {
  assert.ok(versionSchema.safeParse({ version: 1 }).success);
  for (const input of [
    {},
    { version: 0 },
    { version: -1 },
    { version: '1' },
    { version: 1, userId: 'other' },
    { version: 1, role: 'ADMIN' },
  ])
    assert.equal(versionSchema.safeParse(input).success, false);
});

test('deleted profile audit details retain old values without empty comparison fields', () => {
  const details = presentAuditEvent({
    action: 'FACULTY_DELETED',
    before: { name: 'Prof. Example', visible: false, displayOrder: 0, biography: '' },
    after: null,
    details: { loginDisabled: true },
  });
  assert.equal(details.removed, true);
  assert.equal(details.message, 'Faculty profile permanently deleted.');
  assert.deepEqual(
    details.changes.map((field) => field.field),
    ['name', 'visible', 'displayOrder'],
  );
  assert.equal(details.changes[1].before, 'Hidden');
  assert.equal(details.changes[2].before, '1');
});

test('CSRF tokens are unpredictable and reject edits, bad signatures, and other secrets', () => {
  const token = createCsrfToken('a'.repeat(48));
  assert.notEqual(token, createCsrfToken('a'.repeat(48)));
  assert.equal(isValidCsrfToken(token, 'a'.repeat(48)), true);
  assert.equal(isValidCsrfToken(token, 'b'.repeat(48)), false);
  assert.equal(isValidCsrfToken(token.slice(1), 'a'.repeat(48)), false);
  assert.equal(isValidCsrfToken(token + 'extra', 'a'.repeat(48)), false);
});

test('CSV neutralises spreadsheet formulas without breaking quoting and rows', () => {
  for (const value of [
    '=SUM(1,2)',
    '+formula',
    '-formula',
    '@formula',
    '  =formula',
    '\tformula',
    '\nformula',
  ])
    assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('A "quoted", name'), '"A ""quoted"", name"');
  assert.equal(csvCell(null), '""');
  assert.ok(
    toCsv([
      ['name', 'action'],
      ['Prof. X', 'UPDATED'],
    ]).includes('\r\n"Prof. X","UPDATED"'),
  );
});

test('image URLs accept HTTPS images from any host and existing local assets', () => {
  for (const value of [
    '',
    '/assets/faculty/portrait.jpg',
    'https://images.iitb.ac.in/photo.webp',
    'https://i.pinimg.com/736x/52/bd/42/photo.jpg',
    'https://images.example.org:8443/photo.jpg',
  ])
    assert.equal(isValidImageUrl(value), true);
  for (const value of [
    'javascript:alert(1)',
    'http://images.iitb.ac.in/photo.jpg',
    'https://user:pass@images.iitb.ac.in/photo.jpg',
    'data:text/html,<script>alert(1)</script>',
    '/assets/../secret.png',
    '//evil.test/photo.png',
  ])
    assert.equal(isValidImageUrl(value), false);
});

test('faculty input rejects privilege injection and supports clearing optional fields', () => {
  const schema = facultySchema;
  const input = {
    name: 'Prof. Example',
    slug: 'prof-example',
    category: 'CORE',
    designation: '',
    department: 'CTIKS',
    interests: '',
    biography: '',
    imageUrl: '',
    websiteUrl: '',
    publicEmail: '',
    displayOrder: 0,
    visible: false,
  };
  assert.ok(schema.safeParse(input).success);
  assert.equal(schema.safeParse({ ...input, visible: 'false' }).success, false);
  assert.equal(schema.safeParse({ ...input, status: 'PUBLISHED' }).success, false);
  assert.ok(visibilitySchema.safeParse({ visible: true, version: 1 }).success);
  assert.equal(visibilitySchema.safeParse({ visible: 'false', version: 1 }).success, false);
  assert.equal(visibilitySchema.safeParse({ visible: true, version: 1, role: 'ADMIN' }).success, false);
  assert.equal(schema.safeParse({ ...input, role: 'ADMIN' }).success, false);
  assert.equal(schema.safeParse({ ...input, userId: 'another-account' }).success, false);
  assert.equal(schema.safeParse({ ...input, displayOrder: -1 }).success, false);
  assert.equal(schema.safeParse({ ...input, websiteUrl: 'javascript:alert(1)' }).success, false);

  const login = { email: ' Core.Faculty@ctiks.local ', password: 'Ab3!x9' };
  const newFaculty = Object.fromEntries(Object.entries(input).filter(([field]) => field !== 'displayOrder'));
  const provisioned = facultyCreateSchema.parse({ ...newFaculty, login });
  assert.equal(provisioned.login?.email, 'core.faculty@ctiks.local');
  assert.equal(provisioned.login?.password, login.password);
  assert.equal(Object.hasOwn(facultyCreateSchema.parse({ ...input, login }), 'displayOrder'), false);
  assert.equal(facultyUpdateSchema.safeParse({ ...input, version: 1, login }).success, true);
  for (const category of ['ADJUNCT', 'ASSOCIATE', 'VISITING'])
    assert.equal(facultyCreateSchema.safeParse({ ...newFaculty, category, login }).success, false);
  for (const badLogin of [
    { ...login, role: 'ADMIN' },
    { ...login, userId: 'another-user' },
    { ...login, password: 'short' },
    { ...login, password: 'a'.repeat(129) },
    { ...login, email: 'invalid' },
  ])
    assert.equal(facultyCreateSchema.safeParse({ ...newFaculty, login: badLogin }).success, false);
});

test('request body limits apply to actual bytes as well as declared length', async () => {
  const oversized = new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(100) }),
  });
  await assert.rejects(readJson(oversized, 50), { status: 413 });
  const invalid = new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad',
  });
  await assert.rejects(readJson(invalid), { status: 400 });
});

test('passwords use salted Argon2id hashes and reject incorrect passwords', async () => {
  const password = 'Ab3!x9';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.ok(first.startsWith('$argon2id$'));
  assert.notEqual(first, second);
  assert.equal(await verifyPassword({ hash: first, password }), true);
  assert.equal(await verifyPassword({ hash: first, password: 'wrong-password' }), false);
  assert.equal(await verifyPassword({ hash: 'not-a-hash', password }), false);
});
