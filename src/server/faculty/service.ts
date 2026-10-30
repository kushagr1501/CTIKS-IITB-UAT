import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@/generated/prisma/client';
import { getDatabase } from '@/server/database/client';
import { placeFacultyInCategory, sortFaculty } from '@/features/admin/faculty-order';
import type { FacultyCategory } from '@/features/admin/types';
import { assertPermission, type Actor } from '@/server/auth/session';
import { auditData } from '@/server/audit/write';
import { HttpError } from '@/server/http/errors';
import { hashPassword } from '@/server/auth/passwords';
import { getAuth } from '@/server/auth/config';
import { redisOperation } from '@/server/redis/client';
import {
  facultyCreateSchema,
  facultyUpdateSchema,
  recordIdSchema,
  versionSchema,
  visibilitySchema,
} from './schema';

const loginInclude = { user: { select: { email: true } } } as const;
const orderSelect = { id: true, name: true, category: true, displayOrder: true, version: true } as const;

async function lockFacultyOrder(transaction: Prisma.TransactionClient) {
  // PostgreSQL returns void; Prisma cannot decode that type from a raw query.
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(72184123)::text`;
}

function categoryProfiles(transaction: Prisma.TransactionClient, category: FacultyCategory) {
  return transaction.facultyProfile.findMany({
    where: { category },
    select: orderSelect,
  });
}

async function applyPositions(
  transaction: Prisma.TransactionClient,
  original: Awaited<ReturnType<typeof categoryProfiles>>,
  positions: { id: string; displayOrder: number }[],
  skipId?: string,
) {
  const previous = new Map(original.map((profile) => [profile.id, profile]));
  for (const position of positions) {
    const profile = previous.get(position.id);
    if (!profile || profile.id === skipId || profile.displayOrder === position.displayOrder) continue;
    try {
      await transaction.facultyProfile.update({
        where: { id: profile.id, version: profile.version },
        data: { displayOrder: position.displayOrder, version: { increment: 1 } },
      });
    } catch (error) {
      if (isRecordNotFound(error)) throw new HttpError(409, 'The directory changed. Reload it and try again.');
      throw error;
    }
  }
}
const editableFields = [
  'name',
  'slug',
  'category',
  'designation',
  'department',
  'interests',
  'biography',
  'imageUrl',
  'websiteUrl',
  'publicEmail',
  'displayOrder',
  'visible',
] as const;

function adminProfile(profile: Prisma.FacultyProfileGetPayload<{ include: typeof loginInclude }>) {
  const { user, ...fields } = profile;
  return { ...fields, loginEmail: user?.email ?? null };
}

async function prepareLogin(login?: { email: string; password: string }) {
  if (!login) return null;
  return { id: randomUUID(), email: login.email, passwordHash: await hashPassword(login.password) };
}

async function createLogin(
  transaction: Prisma.TransactionClient,
  name: string,
  login: NonNullable<Awaited<ReturnType<typeof prepareLogin>>>,
) {
  await transaction.user.create({
    data: {
      id: login.id,
      name,
      email: login.email,
      role: 'CORE_FACULTY',
      accounts: { create: { id: randomUUID(), password: login.passwordHash } },
    },
  });
}

async function auditLogin(
  transaction: Prisma.TransactionClient,
  actor: Actor,
  profile: { id: string; name: string },
  email: string,
) {
  await transaction.auditEvent.create({
    data: auditData({
      actor,
      action: 'FACULTY_LOGIN_CREATED',
      targetId: profile.id,
      targetName: profile.name,
      details: { loginEmail: email, role: 'CORE_FACULTY' },
    }),
  });
}

export async function listFaculty(actor: Actor) {
  assertPermission(actor, 'faculty.read');
  const faculty = await getDatabase().facultyProfile.findMany({ include: loginInclude });
  return sortFaculty(faculty.map(adminProfile));
}

export async function createFaculty(actor: Actor, input: unknown) {
  assertPermission(actor, 'faculty.create');
  const { login: credentials, ...data } = facultyCreateSchema.parse(input);
  const login = await prepareLogin(credentials);
  return getDatabase().$transaction(async (transaction) => {
    await lockFacultyOrder(transaction);
    const existing = await categoryProfiles(transaction, data.category);
    const id = randomUUID();
    const displayOrder = existing.length;
    await applyPositions(transaction, existing, placeFacultyInCategory(existing, id));
    if (login) await createLogin(transaction, data.name, login);
    const profile = await transaction.facultyProfile.create({
      data: { ...data, id, displayOrder, userId: login?.id },
      include: loginInclude,
    });
    await transaction.auditEvent.create({
      data: auditData({
        actor,
        action: 'FACULTY_CREATED',
        targetId: profile.id,
        targetName: profile.name,
        after: { ...data, displayOrder },
      }),
    });
    if (login) await auditLogin(transaction, actor, profile, login.email);
    return adminProfile(profile);
  });
}

export async function updateFaculty(actor: Actor, recordId: string, input: unknown) {
  assertPermission(actor, 'faculty.update');
  const id = recordIdSchema.parse(recordId);
  const { version, login: credentials, ...data } = facultyUpdateSchema.parse(input);
  const login = await prepareLogin(credentials);
  return getDatabase().$transaction(async (transaction) => {
    await lockFacultyOrder(transaction);
    const before = await transaction.facultyProfile.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, 'Faculty profile not found.');
    if (login && before.userId) throw new HttpError(409, 'This faculty member already has a login.');
    const oldCategory = await categoryProfiles(transaction, before.category);
    const sameCategory = before.category === data.category;
    const newCategory = sameCategory ? oldCategory : await categoryProfiles(transaction, data.category);
    const ordered = placeFacultyInCategory(newCategory, id, sameCategory ? data.displayOrder : undefined);
    const displayOrder = ordered.find((profile) => profile.id === id)!.displayOrder;
    if (login) await createLogin(transaction, data.name, login);
    let updatedProfile: Prisma.FacultyProfileGetPayload<{ include: typeof loginInclude }>;
    try {
      // Return the updated row from the write instead of issuing a follow-up read.
      updatedProfile = await transaction.facultyProfile.update({
        where: { id, version },
        data: { ...data, displayOrder, ...(login ? { userId: login.id } : {}), version: { increment: 1 } },
        include: loginInclude,
      });
    } catch (error) {
      if (isRecordNotFound(error))
        throw new HttpError(409, 'This profile changed while you were editing. Reload it and try again.');
      throw error;
    }
    if (sameCategory) {
      await applyPositions(transaction, oldCategory, ordered, id);
    } else {
      const remaining = sortFaculty(oldCategory.filter((profile) => profile.id !== id));
      await applyPositions(transaction, oldCategory, remaining.map((profile, displayOrder) => ({ id: profile.id, displayOrder })));
      await applyPositions(transaction, newCategory, ordered, id);
    }
    // Preserve history even if an older value no longer meets current URL policy.
    const publicBefore = Object.fromEntries(editableFields.map((key) => [key, before[key]]));
    await transaction.auditEvent.create({
      data: auditData({
        actor,
        action: 'FACULTY_UPDATED',
        targetId: id,
        targetName: data.name,
        before: publicBefore,
        after: { ...data, displayOrder },
      }),
    });
    if (login) await auditLogin(transaction, actor, { id, name: data.name }, login.email);
    return adminProfile(updatedProfile);
  });
}

export async function setVisibility(actor: Actor, recordId: string, input: unknown) {
  assertPermission(actor, 'faculty.update');
  const id = recordIdSchema.parse(recordId);
  const { version, visible } = visibilitySchema.parse(input);
  return getDatabase().$transaction(async (transaction) => {
    const before = await transaction.facultyProfile.findUnique({ where: { id } });
    if (!before) throw new HttpError(404, 'Faculty profile not found.');
    let updatedProfile: Prisma.FacultyProfileGetPayload<{ include: typeof loginInclude }>;
    try {
      updatedProfile = await transaction.facultyProfile.update({
        where: { id, version },
        data: { visible, version: { increment: 1 } },
        include: loginInclude,
      });
    } catch (error) {
      if (isRecordNotFound(error))
        throw new HttpError(409, 'This profile changed. Reload it before continuing.');
      throw error;
    }
    await transaction.auditEvent.create({
      data: auditData({
        actor,
        action: visible ? 'FACULTY_SHOWN' : 'FACULTY_HIDDEN',
        targetId: id,
        targetName: before.name,
        before: { visible: before.visible },
        after: { visible },
      }),
    });
    return adminProfile(updatedProfile);
  });
}

function isRecordNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2025');
}

export async function getOwnFacultyProfile(actor: Actor) {
  assertPermission(actor, 'faculty.self.read');
  const profile = await getDatabase().facultyProfile.findFirst({
    where: { userId: actor.id, category: 'CORE' },
    select: {
      name: true,
      designation: true,
      department: true,
      interests: true,
      biography: true,
      imageUrl: true,
      websiteUrl: true,
      publicEmail: true,
      visible: true,
    },
  });
  if (!profile) throw new HttpError(403, 'A linked core faculty profile is required.');
  return profile;
}

export async function deleteFaculty(actor: Actor, recordId: string, input: unknown) {
  assertPermission(actor, 'faculty.delete');
  const id = recordIdSchema.parse(recordId);
  const { version } = versionSchema.parse(input);
  return getDatabase().$transaction(
    async (transaction) => {
      await lockFacultyOrder(transaction);
      const profile = await transaction.facultyProfile.findUnique({
        where: { id },
        include: { user: { select: { role: true, email: true } } },
      });
      if (!profile) throw new HttpError(404, 'Faculty profile not found.');
      if (profile.user && (profile.user.role !== 'CORE_FACULTY' || profile.userId === actor.id))
        throw new HttpError(409, 'A profile linked to an administrator account cannot be deleted.');
      const deleted = await transaction.facultyProfile.deleteMany({ where: { id, version } });
      if (deleted.count !== 1) throw new HttpError(409, 'This profile changed. Reload it before deleting.');
      const remaining = await categoryProfiles(transaction, profile.category);
      await applyPositions(transaction, remaining, sortFaculty(remaining).map((person, displayOrder) => ({ id: person.id, displayOrder })));
      if (profile.userId) {
        await transaction.account.deleteMany({ where: { userId: profile.userId } });
        // Preserve the audit identity while freeing the login email for a future new account.
        await transaction.user.update({
          where: { id: profile.userId },
          data: { email: `deleted-${randomUUID()}@accounts.invalid` },
        });
      }
      await transaction.auditEvent.create({
        data: auditData({
          actor,
          action: 'FACULTY_DELETED',
          targetId: id,
          targetName: profile.name,
          before: Object.fromEntries(editableFields.map((field) => [field, profile[field]])),
          details: {
            loginDisabled: Boolean(profile.userId),
            ...(profile.user ? { loginEmail: profile.user.email } : {}),
          },
        }),
      });
      if (profile.userId) {
        // Keep the user identity for immutable historical audit references.
        // Protected requests also recheck the linked profile, closing login/revocation races.
        const context = await getAuth().$context;
        await redisOperation('revoke faculty sessions', () => context.internalAdapter.deleteUserSessions(profile.userId!));
      }
      return { id, name: profile.name };
    },
    { timeout: 15_000 },
  );
}
