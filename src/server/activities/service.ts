import 'server-only';
import type { Activity } from '@/generated/prisma/client';
import { getDatabase } from '@/server/database/client';
import { assertPermission, type Actor } from '@/server/auth/session';
import { auditData } from '@/server/audit/write';
import { HttpError } from '@/server/http/errors';
import { recordIdSchema, versionSchema, visibilitySchema } from '@/server/faculty/schema';
import { activityCreateSchema, activityUpdateSchema } from './schema';
import { isActivitySection } from '@/features/activities/types';

export function serializeActivity(activity: Activity) {
  return {
    ...activity,
    sections: activity.sections.filter(isActivitySection),
    eventStartAt: activity.eventStartAt?.toISOString() ?? null,
    eventEndAt: activity.eventEndAt?.toISOString() ?? null,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  };
}

function snapshot(activity: Activity) {
  const value = serializeActivity(activity);
  return {
    title: value.title,
    description: value.description,
    sections: value.sections,
    imageUrl: value.imageUrl,
    eventStartAt: value.eventStartAt,
    eventEndAt: value.eventEndAt,
    venue: value.venue,
    registrationUrl: value.registrationUrl,
    linkLabel: value.linkLabel,
    visible: value.visible,
  };
}

export async function listActivities(actor: Actor) {
  assertPermission(actor, 'activity.read');
  return (await getDatabase().activity.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })).map(
    serializeActivity,
  );
}

export async function createActivity(actor: Actor, input: unknown) {
  assertPermission(actor, 'activity.create');
  const data = activityCreateSchema.parse(input);
  return getDatabase().$transaction(async (tx) => {
    const activity = await tx.activity.create({ data });
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: 'ACTIVITY_CREATED',
        targetId: activity.id,
        targetName: activity.title,
        after: snapshot(activity),
      }),
    });
    return serializeActivity(activity);
  });
}

export async function updateActivity(actor: Actor, recordId: string, input: unknown, visibilityOnly = false) {
  assertPermission(actor, 'activity.update');
  const id = recordIdSchema.parse(recordId);
  const { version, ...data } = visibilityOnly
    ? visibilitySchema.parse(input)
    : activityUpdateSchema.parse(input);
  return getDatabase().$transaction(async (tx) => {
    const before = await tx.activity.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, 'Activity not found.');
    const result = await tx.activity.updateMany({
      where: { id, version },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count !== 1)
      throw new HttpError(409, 'This activity changed. Reload the list before editing again.');
    const after = await tx.activity.findUniqueOrThrow({ where: { id } });
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: visibilityOnly ? (after.visible ? 'ACTIVITY_SHOWN' : 'ACTIVITY_HIDDEN') : 'ACTIVITY_UPDATED',
        targetId: id,
        targetName: after.title,
        before: snapshot(before),
        after: snapshot(after),
      }),
    });
    return serializeActivity(after);
  });
}

export async function deleteActivity(actor: Actor, recordId: string, input: unknown) {
  assertPermission(actor, 'activity.delete');
  const id = recordIdSchema.parse(recordId);
  const { version } = versionSchema.parse(input);
  return getDatabase().$transaction(async (tx) => {
    const before = await tx.activity.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, 'Activity not found.');
    const result = await tx.activity.deleteMany({ where: { id, version } });
    if (result.count !== 1) throw new HttpError(409, 'This activity changed. Reload it before deleting.');
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: 'ACTIVITY_DELETED',
        targetId: id,
        targetName: before.title,
        before: snapshot(before),
      }),
    });
    return { id, title: before.title };
  });
}
