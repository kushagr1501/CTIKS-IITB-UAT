import assert from 'node:assert/strict';
import type { PrismaClient } from '../../src/generated/prisma/client';
import { type BrowserSession, expectStatus } from './http-session';

export async function checkAudit(
  database: PrismaClient,
  browser: BrowserSession,
  password: string,
): Promise<void> {
  await expectStatus(
    await browser.request('/api/admin/audit-logs?from=2026-02-30'),
    400,
    'invalid audit date rejected',
  );
  await expectStatus(
    await browser.request('/api/admin/audit-logs?from=2026-02-20&to=2026-02-19'),
    400,
    'reversed audit date range rejected',
  );
  await expectStatus(
    await browser.request('/api/admin/audit-logs?page=100001'),
    400,
    'audit pagination upper bound enforced',
  );
  await expectStatus(
    await browser.request('/api/admin/audit-logs?actor=%27%20OR%201%3D1%20--'),
    200,
    'audit filter treats SQL-like input as data',
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
}
