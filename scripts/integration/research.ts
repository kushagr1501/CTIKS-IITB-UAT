import assert from 'node:assert/strict';
import type { PrismaClient } from '../../src/generated/prisma/client';

type Session = {
  request: (
    path: string,
    options?: {
      method?: string;
      body?: unknown;
      csrf?: boolean;
    },
  ) => Promise<Response>;
};

async function expectStatus(
  session: Session,
  path: string,
  status: number,
  options?: Parameters<Session['request']>[1],
) {
  const response = await session.request(path, options);
  assert.equal(
    response.status,
    status,
    `${options?.method ?? 'GET'} ${path}: ${(await response.clone().text()).slice(0, 400)}`,
  );
  return response;
}

export async function checkResearch(
  database: PrismaClient,
  admin: Session,
  anonymous: Session,
  faculty: Session,
) {
  const endpoint = '/api/admin/research';
  const initial = await (await expectStatus(admin, endpoint, 200)).json();
  assert.equal(initial.areas.length, 8, 'migration keeps all existing research cards');
  assert.equal(initial.areas[0].title, 'Indian Mathematics & Astronomy');
  for (const [session, status] of [
    [anonymous, 401],
    [faculty, 403],
  ] as const) {
    await expectStatus(session, endpoint, status);
    await expectStatus(session, endpoint, status, { method: 'POST', body: {} });
  }

  const base = {
    title: 'Integration research area',
    description: 'Research content from the database.',
    imageUrl: '/assets/research/mathematics.webp',
    professorNames: ['Prof. Example'],
    displayOrder: 99,
    visible: false,
  };
  await expectStatus(admin, endpoint, 403, { method: 'POST', body: base, csrf: false });
  await expectStatus(admin, endpoint, 400, {
    method: 'POST',
    body: { ...base, imageUrl: 'javascript:alert(1)' },
  });
  await expectStatus(admin, endpoint, 400, {
    method: 'POST',
    body: { ...base, professorNames: ['Prof. Example', 'Prof. Example'] },
  });
  const created = (await (await expectStatus(admin, endpoint, 201, { method: 'POST', body: base })).json())
    .area;
  assert.equal(created.visible, false);
  assert.equal(created.version, 1);
  assert.equal(await database.researchArea.count({ where: { id: created.id } }), 1);
  assert.ok(!(await (await expectStatus(anonymous, '/research', 200)).text()).includes(base.title));

  const visibilityPath = `${endpoint}/${created.id}/visibility`;
  const shown = (
    await (
      await expectStatus(admin, visibilityPath, 200, {
        method: 'PATCH',
        body: { version: created.version, visible: true },
      })
    ).json()
  ).area;
  assert.equal(shown.version, 2);
  assert.ok((await (await expectStatus(anonymous, '/research', 200)).text()).includes(base.title));
  await expectStatus(admin, `${endpoint}/${created.id}`, 409, {
    method: 'PATCH',
    body: { ...base, version: created.version },
  });

  const changedTitle = 'Updated integration research area';
  const updated = (
    await (
      await expectStatus(admin, `${endpoint}/${created.id}`, 200, {
        method: 'PATCH',
        body: { ...base, title: changedTitle, visible: true, version: shown.version },
      })
    ).json()
  ).area;
  assert.equal(updated.version, 3);
  const publicPage = await (await expectStatus(anonymous, '/research', 200)).text();
  assert.ok(publicPage.includes(changedTitle));
  assert.ok(!publicPage.includes(base.title));
  await expectStatus(admin, `${endpoint}/${created.id}`, 409, {
    method: 'DELETE',
    body: { version: shown.version },
  });
  await expectStatus(admin, `${endpoint}/${created.id}`, 200, {
    method: 'DELETE',
    body: { version: updated.version },
  });
  assert.ok(!(await (await expectStatus(anonymous, '/research', 200)).text()).includes(changedTitle));
  assert.equal(await database.researchArea.count({ where: { id: created.id } }), 0);
  assert.equal(
    await database.auditEvent.count({ where: { targetId: created.id, action: { startsWith: 'RESEARCH_' } } }),
    4,
  );
  console.log(
    'PASS Research migration, RBAC, validation, visibility, stale versions, public rendering, delete, and audit',
  );
}
