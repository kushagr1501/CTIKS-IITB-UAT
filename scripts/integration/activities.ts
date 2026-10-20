import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { ActivityRecord } from '../../src/features/activities/types';

type Session = {
  request: (
    path: string,
    options?: {
      method?: string;
      body?: unknown;
      rawBody?: string;
      contentType?: string;
      csrf?: boolean;
      origin?: string;
    },
  ) => Promise<Response>;
};

export async function checkActivities(
  database: PrismaClient,
  admin: Session,
  anonymous: Session,
  faculty: Session,
) {
  async function response(
    session: Session,
    path: string,
    status: number,
    options?: Parameters<Session['request']>[1],
  ) {
    const result = await session.request(path, options);
    assert.equal(
      result.status,
      status,
      `${options?.method ?? 'GET'} ${path}: ${await result
        .clone()
        .text()
        .then((s) => s.slice(0, result.status === status ? 0 : 400))}`,
    );
    return result;
  }
  const now = Date.now();
  const base = {
    title: 'Integration activity: shared admission notice',
    description: 'Shared public description from the CMS.',
    sections: ['NEWS', 'ANNOUNCEMENT'],
    imageUrl: '/assets/iitb-logo.png',
    eventStartAt: new Date(now + 86_400_000).toISOString(),
    eventEndAt: new Date(now + 90_000_000).toISOString(),
    venue: 'CTIKS seminar room',
    registrationUrl: 'https://ctiks.iitb.ac.in/',
    linkLabel: 'Read the full notice',
    visible: true,
  };
  const endpoint = '/api/admin/activities';
  for (const session of [anonymous, faculty]) {
    const denied = session === anonymous ? 401 : 403;
    await response(session, endpoint, denied);
    await response(session, endpoint, denied, { method: 'POST', body: base });
  }
  await response(admin, endpoint, 415, { method: 'POST' });
  await response(admin, endpoint, 415, {
    method: 'POST',
    rawBody: JSON.stringify(base),
    contentType: 'text/plain',
  });
  await response(admin, endpoint, 400, { method: 'POST', rawBody: '{' });
  await response(admin, endpoint, 405, { method: 'DELETE' });
  await response(admin, endpoint, 403, { method: 'POST', body: base, csrf: false });
  await response(admin, endpoint, 403, { method: 'POST', body: base, origin: 'https://untrusted.test' });
  await response(admin, endpoint, 400, { method: 'POST', body: { ...base, eventEndAt: base.eventStartAt } });
  let activity: ActivityRecord = (
    await (await response(admin, endpoint, 201, { method: 'POST', body: base })).json()
  ).activity;
  const path = `${endpoint}/${activity.id}`;
  const listed = await response(admin, endpoint, 200);
  assert.ok((await listed.json()).activities.some((item: ActivityRecord) => item.id === activity.id));
  assert.equal(activity.linkLabel, base.linkLabel);
  assert.equal(
    (await database.activity.findUniqueOrThrow({ where: { id: activity.id } })).linkLabel,
    base.linkLabel,
  );
  const createdAt = activity.createdAt;
  const missingPath = `${endpoint}/${randomUUID()}`;
  await response(admin, missingPath, 404, { method: 'PATCH', body: { ...base, version: 1 } });
  await response(admin, `${missingPath}/visibility`, 404, {
    method: 'PATCH',
    body: { version: 1, visible: false },
  });
  await response(admin, missingPath, 404, { method: 'DELETE', body: { version: 1 } });
  await response(admin, `${endpoint}/not-a-uuid`, 400, {
    method: 'PATCH',
    body: { ...base, version: 1 },
  });
  for (const publicPath of ['/news', '/announcements', '/activities', '/']) {
    const html = await (await response(anonymous, publicPath, 200)).text();
    assert.ok(html.includes(base.title), publicPath);
    assert.ok(html.includes(base.linkLabel), `${publicPath} uses the custom link label`);
  }
  assert.ok(!(await (await response(anonymous, '/events', 200)).text()).includes(base.title));
  assert.ok((await (await response(admin, '/admin/activities', 200)).text()).includes(base.title));

  // Visibility is enforced for every surface, including search.
  activity = (
    await (
      await response(admin, `${path}/visibility`, 200, {
        method: 'PATCH',
        body: { version: activity.version, visible: false },
      })
    ).json()
  ).activity;
  for (const publicPath of ['/news', '/announcements', '/activities?q=admission', '/']) {
    assert.ok(!(await (await response(anonymous, publicPath, 200)).text()).includes(base.title), publicPath);
  }
  const cleared = {
    ...base,
    imageUrl: '',
    registrationUrl: '',
    linkLabel: '',
    venue: '',
    eventStartAt: null,
    eventEndAt: null,
    visible: false,
  };
  activity = (
    await (
      await response(admin, path, 200, { method: 'PATCH', body: { ...cleared, version: activity.version } })
    ).json()
  ).activity;
  const persisted = await database.activity.findUniqueOrThrow({ where: { id: activity.id } });
  assert.equal(persisted.eventStartAt, null);
  assert.equal(persisted.eventEndAt, null);
  assert.equal(persisted.imageUrl, '');
  assert.equal(persisted.venue, '');
  assert.equal(persisted.registrationUrl, '');
  assert.equal(persisted.linkLabel, '');
  assert.equal(activity.createdAt, createdAt);
  await response(admin, path, 409, { method: 'PATCH', body: { ...base, version: 1 } });
  await response(admin, path, 400, {
    method: 'PATCH',
    body: { ...base, version: activity.version, createdAt },
  });
  activity = (
    await (
      await response(admin, `${path}/visibility`, 200, {
        method: 'PATCH',
        body: { version: activity.version, visible: true },
      })
    ).json()
  ).activity;

  for (const session of [anonymous, faculty]) {
    const denied = session === anonymous ? 401 : 403;
    await response(session, path, denied, { method: 'PATCH', body: { ...base, version: activity.version } });
    await response(session, `${path}/visibility`, denied, {
      method: 'PATCH',
      body: { version: activity.version, visible: false },
    });
    await response(session, path, denied, { method: 'DELETE', body: { version: activity.version } });
  }

  // Build deterministic ordering without depending on millisecond clock resolution.
  const orderingTime = Date.now();
  await database.activity.createMany({
    data: [
      ...[1, 2, 3].map((index) => ({
        ...cleared,
        title: `Integration newer announcement ${index}`,
        visible: true,
        sections: ['ANNOUNCEMENT' as const],
        createdAt: new Date(orderingTime + index * 1000),
      })),
      {
        ...cleared,
        title: 'Integration eligible future event',
        visible: true,
        sections: ['EVENT'],
        createdAt: new Date(orderingTime + 4000),
        eventStartAt: new Date(now + 86_400_000),
      },
      {
        ...cleared,
        title: 'Integration eligible ongoing event',
        visible: true,
        sections: ['EVENT'],
        createdAt: new Date(orderingTime + 5000),
        eventStartAt: new Date(now - 3600_000),
        eventEndAt: new Date(now + 3600_000),
      },
      {
        ...cleared,
        title: 'Integration excluded past event',
        visible: true,
        sections: ['EVENT'],
        createdAt: new Date(orderingTime + 6000),
        eventStartAt: new Date(now - 7200_000),
        eventEndAt: new Date(now - 3600_000),
      },
      {
        ...cleared,
        title: 'Integration excluded undated event',
        visible: true,
        sections: ['EVENT'],
        createdAt: new Date(orderingTime + 7000),
      },
      {
        ...cleared,
        title: 'Integration excluded hidden event',
        visible: false,
        sections: ['EVENT'],
        createdAt: new Date(orderingTime + 8000),
        eventStartAt: new Date(now + 86_400_000),
      },
      {
        ...cleared,
        title: 'Integration excluded started event without end',
        visible: true,
        sections: ['EVENT'],
        createdAt: new Date(orderingTime + 9000),
        eventStartAt: new Date(now - 3600_000),
      },
    ],
  });
  const homepage = await (await response(anonymous, '/', 200)).text();
  for (const title of [
    'Integration newer announcement 3',
    'Integration newer announcement 2',
    'Integration eligible ongoing event',
  ])
    assert.ok(homepage.includes(title), title);
  for (const title of [
    'Integration newer announcement 1',
    'Integration eligible future event',
    'Integration excluded',
    base.title,
  ])
    assert.ok(!homepage.includes(title), title);
  activity = (
    await (
      await response(admin, path, 200, {
        method: 'PATCH',
        body: { ...cleared, visible: true, version: activity.version },
      })
    ).json()
  ).activity;
  assert.ok(
    !(await (await response(anonymous, '/', 200)).text()).includes(base.title),
    'editing does not bump old entries',
  );
  const eventsHtml = await (await response(anonymous, '/events', 200)).text();
  assert.ok(eventsHtml.includes('Integration excluded past event'));
  assert.ok(eventsHtml.includes('Integration excluded undated event'));
  assert.ok(!eventsHtml.includes('Integration excluded hidden event'));
  const searchHtml = await (await response(anonymous, '/news?q=admission', 200)).text();
  assert.ok(searchHtml.includes(base.title));
  assert.ok(
    !(await (await response(anonymous, '/news?q=notfoundtestquery', 200)).text()).includes(base.title),
  );

  await database.activity.createMany({
    data: Array.from({ length: 13 }, (_, index) => ({
      ...cleared,
      visible: true,
      sections: ['NEWS'],
      title: `Pagination fixture ${index}`,
    })),
  });
  const page2 = await (await response(anonymous, '/news?q=Pagination&page=2', 200)).text();
  assert.ok(page2.includes('Pagination fixture'));
  assert.ok(
    !(await (await response(anonymous, '/announcements?q=Pagination', 200)).text()).includes(
      'Pagination fixture',
    ),
  );

  // A failed audit must roll back the public-content write too.
  await database.$executeRawUnsafe(
    "ALTER TABLE audit_events ADD CONSTRAINT integration_reject_activity_delete CHECK (action <> 'ACTIVITY_DELETED')",
  );
  await response(admin, path, 500, { method: 'DELETE', body: { version: activity.version } });
  assert.ok(await database.activity.findUnique({ where: { id: activity.id } }));
  await database.$executeRawUnsafe(
    'ALTER TABLE audit_events DROP CONSTRAINT integration_reject_activity_delete',
  );
  await response(admin, path, 409, { method: 'DELETE', body: { version: activity.version - 1 } });
  await response(admin, path, 200, { method: 'DELETE', body: { version: activity.version } });
  assert.equal(await database.activity.findUnique({ where: { id: activity.id } }), null);
  assert.ok(!(await (await response(anonymous, '/news', 200)).text()).includes(base.title));
  for (const action of [
    'ACTIVITY_CREATED',
    'ACTIVITY_UPDATED',
    'ACTIVITY_HIDDEN',
    'ACTIVITY_SHOWN',
    'ACTIVITY_DELETED',
  ]) {
    assert.ok(await database.auditEvent.findFirst({ where: { targetId: activity.id, action } }), action);
  }
  console.log(
    'PASS Activities CMS: permissions, CSRF, public pages, homepage selection, date/field clearing, stable ordering, visibility, search, pagination, concurrency and audit rollback',
  );
}
