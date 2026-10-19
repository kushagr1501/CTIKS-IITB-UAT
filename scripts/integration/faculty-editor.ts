import assert from 'node:assert/strict';
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { FacultyEditorState } from '../../src/features/faculty/profile-schema';
import { publicCoreProfileQuery } from '../../src/server/faculty/public-profile-query';
type Session = {
  request: (
    path: string,
    options?: { method?: string; body?: unknown; csrf?: boolean; origin?: string },
  ) => Promise<Response>;
};

export async function checkFacultyEditor(
  database: PrismaClient,
  admin: Session,
  faculty: Session,
  anonymous: Session,
  id: string,
  otherId: string,
) {
  const endpoint = '/api/faculty/profile';
  async function result(session: Session, expected: number, options?: Parameters<Session['request']>[1]) {
    const response = await session.request(endpoint, options);
    const body = await response.json();
    assert.equal(response.status, expected, `${options?.method ?? 'GET'} self profile: ${body.error ?? ''}`);
    return body;
  }
  const original = await database.facultyProfile.findUniqueOrThrow({ where: { id } });
  const other = await database.facultyProfile.findUniqueOrThrow({ where: { id: otherId } });
  let state: FacultyEditorState = (await result(faculty, 200)).faculty;
  const input = (action = 'save') => ({
    action,
    profileVersion: state.profileVersion,
    draftVersion: state.draftVersion,
    content: state.content,
  });
  await result(anonymous, 401, { method: 'PUT', body: input() });
  await result(admin, 403, { method: 'PUT', body: input() });
  await result(faculty, 403, { method: 'PUT', csrf: false, body: input() });
  await result(faculty, 403, { method: 'PUT', origin: 'https://untrusted.test', body: input() });
  await result(faculty, 400, { method: 'PUT', body: { ...input(), facultyId: otherId } });
  await result(faculty, 400, {
    method: 'PUT',
    body: { ...input(), content: { ...state.content, visible: true } },
  });

  state.content = {
    ...state.content,
    biography: 'Private draft biography',
    interests: 'Concise directory summary',
    researchTags: ['History', 'Mathematics'],
    researchOverview: 'Faculty research overview',
    officeAddress: 'Room 12',
    publicPhone: '+91 22 1234',
    education: [
      {
        title: 'Fixture qualification',
        institution: 'Fixture institute',
        description: '',
        periodText: '2001',
      },
    ],
    experience: [
      {
        title: 'Fixture position',
        organisation: 'Fixture institute',
        description: '',
        periodText: '2002–present',
      },
    ],
    courses: [
      {
        title: 'Fixture course',
        code: 'TEST 101',
        status: 'CURRENT',
        periodText: 'Autumn 2026',
        description: '',
      },
    ],
    publications: [
      {
        title: 'Fixture publication',
        type: 'JOURNAL_ARTICLE',
        authors: 'Fixture author',
        venue: 'Fixture journal',
        year: 2026,
        citation: '',
        doi: '',
        url: 'https://example.com/paper',
      },
    ],
    patents: [
      {
        title: 'Fixture patent',
        inventors: 'Fixture inventor',
        identifier: 'TEST123',
        status: 'Granted',
        year: 2025,
        description: '',
        url: '',
      },
    ],
    students: [
      {
        name: 'Fixture student',
        programme: 'PhD',
        researchTopic: 'Fixture topic',
        supervisionRole: 'Supervisor',
        periodText: '2026–present',
        status: 'CURRENT',
        graduationYear: null,
        imageUrl: '/assets/iitb-logo.png',
        socialLinks: [
          { platform: 'LINKEDIN', url: 'https://www.linkedin.com/in/fixture-student/' },
          { platform: 'GOOGLE_SCHOLAR', url: 'https://scholar.google.com/citations?user=fixture' },
        ],
      },
    ],
  };
  const firstInput = input();
  state = (await result(faculty, 200, { method: 'PUT', body: firstInput })).faculty;
  assert.ok(state.hasDraft);
  assert.equal(
    (await database.facultyProfile.findUniqueOrThrow({ where: { id } })).biography,
    original.biography,
  );
  assert.deepEqual((await result(faculty, 200)).faculty, state, 'draft survives reload');
  assert.equal(state.content.students[0].imageUrl, '/assets/iitb-logo.png');
  assert.equal(state.content.students[0].socialLinks.length, 2);
  await result(faculty, 409, { method: 'PUT', body: firstInput });
  assert.equal(
    await database.facultyProfileRevision.count({ where: { facultyId: id, status: 'PUBLISHED' } }),
    0,
  );

  // Updating an existing draft removes deleted child rows, preserves ordering, and permits null years.
  state.content.education.push({
    title: 'Second qualification',
    institution: '',
    description: '',
    periodText: '',
  });
  state.content.education.reverse();
  state.content.courses = [];
  state.content.publications[0].year = null;
  state = (await result(faculty, 200, { method: 'PUT', body: input() })).faculty;
  assert.equal(state.content.education[0].title, 'Second qualification');
  assert.equal(state.content.courses.length, 0);
  const saved = await database.facultyProfileRevision.findFirstOrThrow({
    where: { facultyId: id, status: 'DRAFT' },
    include: { education: true, courses: true },
  });
  assert.equal(saved.education.length, 2);
  assert.equal(saved.courses.length, 0);
  assert.equal(saved.education.find((row) => row.title === 'Second qualification')?.displayOrder, 0);

  state = (await result(faculty, 200, { method: 'PUT', body: input('publish') })).faculty;
  assert.equal(state.hasDraft, false);
  const published = await database.facultyProfile.findUniqueOrThrow({ where: { id } });
  assert.equal(published.biography, 'Private draft biography');
  for (const key of [
    'name',
    'slug',
    'designation',
    'department',
    'category',
    'visible',
    'displayOrder',
    'userId',
  ] as const)
    assert.equal(published[key], original[key], key);
  assert.equal(
    await database.facultyProfile.findFirst(publicCoreProfileQuery(original.slug)),
    null,
    'publishing does not expose a hidden profile',
  );
  await database.facultyProfile.update({ where: { id }, data: { visible: true } });
  const publicProfile = await database.facultyProfile.findFirstOrThrow(publicCoreProfileQuery(original.slug));
  assert.equal(publicProfile.revisions[0].education[0].title, 'Second qualification');
  assert.deepEqual(publicProfile.revisions[0].students[0].socialLinks, state.content.students[0].socialLinks);
  const publicHtml = await (await anonymous.request(`/people/${original.slug}`)).text();
  assert.ok(publicHtml.includes('Fixture publication'));
  assert.ok(publicHtml.includes('Room 12'));
  assert.ok(publicHtml.includes('LinkedIn'));
  assert.ok(publicHtml.includes('scholar.google.com/citations?user=fixture'));
  assert.ok(publicHtml.includes('/assets/iitb-logo.png'));
  assert.equal(JSON.stringify(publicProfile).includes('sourceProfileVersion'), false);

  // Public reads continue using the accepted revision while another draft is edited.
  state.content.biography = 'DO NOT LEAK draft';
  state.content.education = [];
  state.content.students[0].imageUrl = '';
  state.content.students[0].socialLinks = [];
  state = (await result(faculty, 200, { method: 'PUT', body: input() })).faculty;
  assert.ok(!(await (await anonymous.request(`/people/${original.slug}`)).text()).includes('DO NOT LEAK'));
  assert.equal(
    (await database.facultyProfile.findFirstOrThrow(publicCoreProfileQuery(original.slug))).revisions[0]
      .students[0].imageUrl,
    '/assets/iitb-logo.png',
    'private photo clear must not change published content',
  );
  const staleDraft = input('publish');
  const concurrent = await Promise.all([
    faculty.request(endpoint, { method: 'PUT', body: input() }),
    faculty.request(endpoint, { method: 'PUT', body: input() }),
  ]);
  // The two requests used the same version; exactly one may commit.
  assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 409]);
  state = (await result(faculty, 200)).faculty;
  await result(faculty, 409, { method: 'PUT', body: staleDraft });
  const acceptedId = await database.facultyProfileRevision.findFirstOrThrow({
    where: { facultyId: id, status: 'PUBLISHED' },
  });
  state = (await result(faculty, 200, { method: 'PUT', body: input('publish') })).faculty;
  const clearedStudent = (
    await database.facultyProfile.findFirstOrThrow(publicCoreProfileQuery(original.slug))
  ).revisions[0].students[0];
  assert.equal(clearedStudent.imageUrl, '');
  assert.deepEqual(clearedStudent.socialLinks, []);
  state.content = {
    ...state.content,
    biography: '',
    interests: '',
    researchTags: [],
    researchOverview: '',
    officeAddress: '',
    publicPhone: '',
    imageUrl: '',
    websiteUrl: '',
    publicEmail: '',
    education: [],
    experience: [],
    courses: [],
    publications: [],
    patents: [],
    students: [],
  };
  state = (await result(faculty, 200, { method: 'PUT', body: input('publish') })).faculty;
  const cleared = await database.facultyProfile.findFirstOrThrow(publicCoreProfileQuery(original.slug));
  assert.equal(cleared.biography, '');
  assert.equal(cleared.revisions[0].education.length, 0);
  assert.equal(cleared.revisions[0].publications.length, 0);
  assert.equal(
    (
      await database.facultyProfileRevision.findUniqueOrThrow({
        where: { id: acceptedId.id },
        include: { education: true },
      })
    ).education.length,
    2,
    'previous published content retained',
  );
  assert.equal(
    (await database.facultyProfileRevision.findUniqueOrThrow({ where: { id: acceptedId.id } })).status,
    'SUPERSEDED',
  );

  // A later admin change blocks publication of an out-of-date draft; discard recovers safely.
  state = (await result(faculty, 200, { method: 'PUT', body: input() })).faculty;
  await database.facultyProfile.update({
    where: { id },
    data: { biography: 'Administrator update', version: { increment: 1 } },
  });
  await result(faculty, 409, { method: 'PUT', body: input('publish') });
  state = (await result(faculty, 200)).faculty;
  await result(faculty, 409, { method: 'PUT', body: input('publish') });
  state = (await result(faculty, 200, { method: 'PUT', body: input('discard') })).faculty;
  assert.equal(state.content.biography, 'Administrator update');
  assert.equal(state.hasDraft, false);
  assert.deepEqual(
    await database.facultyProfile.findUniqueOrThrow({ where: { id: otherId } }),
    other,
    'another professor is untouched',
  );
  const audit = await database.auditEvent.findMany({
    where: {
      targetId: id,
      action: { in: ['FACULTY_DRAFT_SAVED', 'FACULTY_SELF_PUBLISHED', 'FACULTY_DRAFT_DISCARDED'] },
    },
  });
  assert.ok(audit.some((row) => row.action === 'FACULTY_SELF_PUBLISHED'));
  assert.ok(audit.some((row) => row.action === 'FACULTY_DRAFT_DISCARDED'));
  // Restore the test's original directory visibility for subsequent integration checks.
  await database.facultyProfile.update({ where: { id }, data: { visible: original.visible } });
  console.log(
    'PASS faculty self editing: CSRF, ownership, private drafts, immediate publishing, conflict detection, explicit clears, immutable published history, hidden visibility and audit',
  );
}
