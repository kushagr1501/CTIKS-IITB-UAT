import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { getDatabase } from '@/server/database/client';

export type AuditActor = { id: string; email: string; name: string };
export type AuditInput = {
  actor?: AuditActor;
  action: string;
  targetId?: string;
  targetName?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  details?: Prisma.InputJsonValue;
  deduplicationKey?: string;
};

export function auditData({ actor, ...event }: AuditInput) {
  return { ...event, actorId: actor?.id, actorEmail: actor?.email, actorName: actor?.name };
}

export async function writeAudit(event: AuditInput) {
  await getDatabase().auditEvent.createMany({ data: [auditData(event)], skipDuplicates: true });
}
