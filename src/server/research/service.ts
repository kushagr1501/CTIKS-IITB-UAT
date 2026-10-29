import 'server-only';
import type { ResearchArea } from '@/generated/prisma/client';
import { getDatabase } from '@/server/database/client';
import { assertPermission, type Actor } from '@/server/auth/session';
import { auditData } from '@/server/audit/write';
import { HttpError } from '@/server/http/errors';
import {
  researchCreateSchema,
  researchIdSchema,
  researchUpdateSchema,
  researchVersionSchema,
  researchVisibilitySchema,
} from './schema';

const order = [{ displayOrder: 'asc' as const }, { createdAt: 'asc' as const }, { id: 'asc' as const }];

export function serializeResearchArea(area: ResearchArea) {
  return { ...area, createdAt: area.createdAt.toISOString(), updatedAt: area.updatedAt.toISOString() };
}

function snapshot(area: ResearchArea) {
  const { title, description, imageUrl, professorNames, displayOrder, visible } = area;
  return { title, description, imageUrl, professorNames, displayOrder, visible };
}

export async function listResearchAreas(actor: Actor) {
  assertPermission(actor, 'research.read');
  return (await getDatabase().researchArea.findMany({ orderBy: order })).map(serializeResearchArea);
}

export async function listPublicResearchAreas() {
  return getDatabase().researchArea.findMany({ where: { visible: true }, orderBy: order });
}

export async function createResearchArea(actor: Actor, input: unknown) {
  assertPermission(actor, 'research.create');
  const data = researchCreateSchema.parse(input);
  return getDatabase().$transaction(async (tx) => {
    const area = await tx.researchArea.create({ data });
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: 'RESEARCH_CREATED',
        targetId: area.id,
        targetName: area.title,
        after: snapshot(area),
      }),
    });
    return serializeResearchArea(area);
  });
}

function notFound(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2025');
}

export async function updateResearchArea(
  actor: Actor,
  recordId: string,
  input: unknown,
  visibilityOnly = false,
) {
  assertPermission(actor, 'research.update');
  const id = researchIdSchema.parse(recordId);
  const { version, ...data } = visibilityOnly
    ? researchVisibilitySchema.parse(input)
    : researchUpdateSchema.parse(input);
  return getDatabase().$transaction(async (tx) => {
    const before = await tx.researchArea.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, 'Research area not found.');
    let area: ResearchArea;
    try {
      area = await tx.researchArea.update({
        where: { id, version },
        data: { ...data, version: { increment: 1 } },
      });
    } catch (error) {
      if (notFound(error))
        throw new HttpError(409, 'This research area changed. Refresh the list before editing.');
      throw error;
    }
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: visibilityOnly ? (area.visible ? 'RESEARCH_SHOWN' : 'RESEARCH_HIDDEN') : 'RESEARCH_UPDATED',
        targetId: id,
        targetName: area.title,
        before: snapshot(before),
        after: snapshot(area),
      }),
    });
    return serializeResearchArea(area);
  });
}

export async function deleteResearchArea(actor: Actor, recordId: string, input: unknown) {
  assertPermission(actor, 'research.delete');
  const id = researchIdSchema.parse(recordId);
  const { version } = researchVersionSchema.parse(input);
  return getDatabase().$transaction(async (tx) => {
    const before = await tx.researchArea.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, 'Research area not found.');
    const result = await tx.researchArea.deleteMany({ where: { id, version } });
    if (result.count !== 1)
      throw new HttpError(409, 'This research area changed. Refresh the list before deleting.');
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: 'RESEARCH_DELETED',
        targetId: id,
        targetName: before.title,
        before: snapshot(before),
      }),
    });
    return { id };
  });
}
