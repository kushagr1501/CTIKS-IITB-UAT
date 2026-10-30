import assert from 'node:assert/strict';
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { FacultyRecord, FacultyValues } from '../../src/features/admin/types';
import { type BrowserSession, expectStatus } from './http-session';

export async function checkFacultyDirectory(database: PrismaClient, browser: BrowserSession) {
  const values: FacultyValues = {
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
  let profile: FacultyRecord = (
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
  const secondProfile: FacultyRecord = (
    await (
      await expectStatus(
        await browser.request('/api/admin/faculty', {
          method: 'POST',
          body: { ...values, name: 'Second Integration Faculty', slug: 'second-integration-faculty' },
        }),
        201,
        'new faculty appends despite an old client sending order zero',
      )
    ).json()
  ).faculty;
  assert.equal(secondProfile.displayOrder, 1);
  profile = (
    await (
      await expectStatus(
        await browser.request(`/api/admin/faculty/${profile.id}`, {
          method: 'PATCH',
          body: { ...values, displayOrder: 1, version: profile.version },
        }),
        200,
        'moving the first faculty member to second position',
      )
    ).json()
  ).faculty;
  assert.equal(profile.displayOrder, 1);
  const shifted = await database.facultyProfile.findUniqueOrThrow({ where: { id: secondProfile.id } });
  assert.equal(shifted.displayOrder, 0);
  assert.ok(shifted.version > secondProfile.version, 'shifted profiles receive a new version');
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

  return { values, cleared, hiddenEdit, profile };
}

export type FacultyDirectoryFixture = Awaited<ReturnType<typeof checkFacultyDirectory>>;
