import 'server-only';
import { z } from 'zod';
import { getDatabase } from '@/server/database/client';
import { assertPermission, type Actor } from '@/server/auth/session';
import { getRedis, redisPrefix, redisOperation } from '@/server/redis/client';
import { pendingSessionExpiries, acknowledgeSessionExpiry } from '@/server/auth/redis-storage';
import { HttpError } from '@/server/http/errors';
import { writeAudit } from './write';
import { toCsv } from './csv';

const dateFilter = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  })
  .optional();

const filtersSchema = z.object({
  actor: z.string().max(200).optional(),
  action: z.string().max(80).optional(),
  target: z.string().max(200).optional(),
  from: dateFilter,
  to: dateFilter,
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

function filtersFrom(search: URLSearchParams) {
  const filters = filtersSchema.parse(Object.fromEntries([...search].filter(([, value]) => value !== '')));
  if (filters.from && filters.to && filters.from > filters.to)
    throw new HttpError(400, 'The start date must precede the end date.');
  // The admin UI labels date filters as India time, independent of host timezone.
  const from = filters.from ? new Date(`${filters.from}T00:00:00+05:30`) : undefined;
  const to = filters.to
    ? new Date(new Date(`${filters.to}T00:00:00+05:30`).getTime() + 86_400_000)
    : undefined;
  return {
    filters,
    where: {
      ...(filters.actor
        ? {
            OR: [
              { actorEmail: { contains: filters.actor, mode: 'insensitive' as const } },
              { actorName: { contains: filters.actor, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.target ? { targetName: { contains: filters.target, mode: 'insensitive' as const } } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    },
  };
}

async function recordExpiredSessions() {
  const expired = await redisOperation(() => pendingSessionExpiries(getRedis(), redisPrefix()));
  for (const { id, raw, record } of expired) {
    await writeAudit({
      actor: record.actor,
      action: 'SESSION_EXPIRED',
      deduplicationKey: `expired:${id}`,
      details: {
        detectedAt: new Date().toISOString(),
        lastActivityAt: record.lastActivityAt,
        expiredAt: new Date(record.deadline).toISOString(),
      },
    });
    // A failed Neon write leaves this queued; retries cannot duplicate its event.
    await redisOperation(() => acknowledgeSessionExpiry(getRedis(), redisPrefix(), id, raw));
  }
}

export async function listAuditEvents(actor: Actor, search: URLSearchParams) {
  assertPermission(actor, 'audit.read');
  await recordExpiredSessions();
  const { filters, where } = filtersFrom(search);
  const database = getDatabase();
  const [events, total] = await Promise.all([
    database.auditEvent.findMany({
      where,
      include: { actor: { select: { email: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * 50,
      take: 50,
    }),
    database.auditEvent.count({ where }),
  ]);
  return {
    events: events.map(({ actor: currentActor, ...event }) => ({
      ...event,
      currentActorEmail: currentActor?.email.trim() ?? null,
    })),
    total,
    page: filters.page,
    pageSize: 50,
  };
}

export async function exportAuditEvents(actor: Actor, search: URLSearchParams) {
  assertPermission(actor, 'audit.export');
  await recordExpiredSessions();
  const { filters, where } = filtersFrom(search);
  const events = await getDatabase().auditEvent.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 10001,
  });
  if (events.length > 10000)
    throw new HttpError(400, 'Choose a smaller date range to export up to 10,000 entries.');
  await writeAudit({ actor, action: 'AUDIT_EXPORTED', details: { filters, rowCount: events.length } });
  return toCsv([
    [
      'Timestamp (UTC)',
      'Actor email',
      'Actor name',
      'Action',
      'Affected entry',
      'Entry ID',
      'Before',
      'After',
      'What changed',
    ],
    ...events.map((event) => [
      event.createdAt.toISOString(),
      event.actorEmail,
      event.actorName,
      event.action,
      event.targetName,
      event.targetId,
      event.before ? JSON.stringify(event.before) : '',
      event.after ? JSON.stringify(event.after) : '',
      event.details ? JSON.stringify(event.details) : '',
    ]),
  ]);
}
