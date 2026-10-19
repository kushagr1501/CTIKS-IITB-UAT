import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { getDatabase } from '@/server/database/client';
import { assertPermission, type Actor } from '@/server/auth/session';
import { HttpError } from '@/server/http/errors';
import { auditData } from '@/server/audit/write';
import { readStudentSocialLinks } from '@/features/faculty/student-schema';
import {
  facultyContentRequestSchema,
  type AcademicContent,
  type FacultyEditorState,
} from '@/features/faculty/profile-schema';

export const academicInclude = {
  education: { orderBy: { displayOrder: 'asc' as const } },
  experience: { orderBy: { displayOrder: 'asc' as const } },
  courses: { orderBy: { displayOrder: 'asc' as const } },
  publications: { orderBy: { displayOrder: 'asc' as const } },
  patents: { orderBy: { displayOrder: 'asc' as const } },
  students: { orderBy: { displayOrder: 'asc' as const } },
} as const;
type Revision = Prisma.FacultyProfileRevisionGetPayload<{ include: typeof academicInclude }>;
type Profile = Prisma.FacultyProfileGetPayload<object>;
const workingStates = ['DRAFT', 'CHANGES_REQUESTED', 'SUBMITTED'] as const;
function ownActor(actor: Actor) {
  assertPermission(actor, 'faculty.self.read');
  if (actor.role !== 'CORE_FACULTY') throw new HttpError(403, 'A linked core faculty account is required.');
}
async function ownProfile(tx: Prisma.TransactionClient, actor: Actor) {
  ownActor(actor);
  const profile = await tx.facultyProfile.findFirst({ where: { userId: actor.id, category: 'CORE' } });
  if (!profile) throw new HttpError(403, 'A linked core faculty profile is required.');
  return profile;
}
function contentOf(profile: Profile, revision?: Revision | null, draft = false): AcademicContent {
  const basics = draft && revision ? revision : profile;
  // Explicitly project editable fields; never send account or review metadata.
  return {
    name: draft && revision ? (revision.name ?? profile.name) : profile.name,
    designation: draft && revision ? (revision.designation ?? profile.designation) : profile.designation,
    department: draft && revision ? (revision.department ?? profile.department) : profile.department,
    biography: basics.biography,
    imageUrl: basics.imageUrl,
    websiteUrl: basics.websiteUrl,
    publicEmail: basics.publicEmail,
    interests: basics.interests,
    researchTags: revision?.researchTags ?? [],
    researchOverview: revision?.researchOverview ?? '',
    officeAddress: revision?.officeAddress ?? '',
    publicPhone: revision?.publicPhone ?? '',
    education:
      revision?.education.map(({ title, institution, description, periodText }) => ({
        title,
        institution,
        description,
        periodText,
      })) ?? [],
    experience:
      revision?.experience.map(({ title, organisation, description, periodText }) => ({
        title,
        organisation,
        description,
        periodText,
      })) ?? [],
    courses:
      revision?.courses.map(({ title, code, description, periodText, status }) => ({
        title,
        code,
        description,
        periodText,
        status,
      })) ?? [],
    publications:
      revision?.publications.map(({ title, type, authors, venue, year, citation, doi, url }) => ({
        title,
        type,
        authors,
        venue,
        year,
        citation,
        doi,
        url,
      })) ?? [],
    patents:
      revision?.patents.map(({ title, inventors, identifier, status, year, description, url }) => ({
        title,
        inventors,
        identifier,
        status,
        year,
        description,
        url,
      })) ?? [],
    students:
      revision?.students.map(
        ({
          name,
          programme,
          researchTopic,
          supervisionRole,
          periodText,
          status,
          graduationYear,
          imageUrl,
          socialLinks,
        }) => ({
          name,
          programme,
          researchTopic,
          supervisionRole,
          periodText,
          status,
          graduationYear,
          imageUrl,
          socialLinks: readStudentSocialLinks(socialLinks),
        }),
      ) ?? [],
  };
}
function editorState(profile: Profile, revision?: Revision | null, draft = false): FacultyEditorState {
  return {
    identity: {
      name: profile.name,
      slug: profile.slug,
      designation: profile.designation,
      department: profile.department,
      visible: profile.visible,
    },
    profileVersion: profile.version,
    draftVersion: draft ? (revision?.version ?? null) : null,
    hasDraft: draft,
    content: contentOf(profile, revision, draft),
  };
}
export async function getOwnFacultyEditor(actor: Actor) {
  ownActor(actor);
  return getDatabase().$transaction(async (tx) => {
    const profile = await ownProfile(tx, actor);
    const draft = await tx.facultyProfileRevision.findFirst({
      where: { facultyId: profile.id, status: { in: [...workingStates] } },
      include: academicInclude,
    });
    if (draft?.status === 'SUBMITTED')
      throw new HttpError(409, 'A submitted profile is awaiting review. Contact the administrator.');
    const revision =
      draft ??
      (await tx.facultyProfileRevision.findFirst({
        where: { facultyId: profile.id, status: 'PUBLISHED' },
        include: academicInclude,
      }));
    return editorState(profile, revision, Boolean(draft));
  });
}
function ordered<T>(items: T[]) {
  return items.map((item, displayOrder) => ({ ...item, displayOrder }));
}
function revisionData(content: AcademicContent) {
  const { education, experience, courses, publications, patents, students, ...scalars } = content;
  return {
    ...scalars,
    education: { create: ordered(education) },
    experience: { create: ordered(experience) },
    courses: { create: ordered(courses) },
    publications: { create: ordered(publications) },
    patents: { create: ordered(patents) },
    students: { create: ordered(students) },
  };
}

// Export the transaction worker so isolated database tests exercise the real write path.
export async function writeOwnFacultyContent(tx: Prisma.TransactionClient, actor: Actor, input: unknown) {
  ownActor(actor);
  assertPermission(actor, 'faculty.self.update');
  const request = facultyContentRequestSchema.parse(input);
  const profile = await ownProfile(tx, actor);
  if (profile.version !== request.profileVersion)
    throw new HttpError(
      409,
      'The administrator or another session changed this profile. Reload before saving.',
    );
  const working = await tx.facultyProfileRevision.findFirst({
    where: { facultyId: profile.id, status: { in: [...workingStates] } },
  });
  if (working?.status === 'SUBMITTED') throw new HttpError(409, 'Submitted content cannot be edited.');
  if ((working?.version ?? null) !== request.draftVersion)
    throw new HttpError(409, 'This draft changed in another tab. Reload before saving.');
  if (request.action === 'discard') {
    if (!working) throw new HttpError(409, 'There is no saved draft to discard.');
    const removed = await tx.facultyProfileRevision.deleteMany({
      where: { id: working.id, version: working.version, status: { in: ['DRAFT', 'CHANGES_REQUESTED'] } },
    });
    if (removed.count !== 1) throw new HttpError(409, 'This draft changed. Reload before discarding.');
    await tx.auditEvent.create({
      data: auditData({
        actor,
        action: 'FACULTY_DRAFT_DISCARDED',
        targetId: profile.id,
        targetName: profile.name,
        before: { revisionNumber: working.revisionNumber, draftVersion: working.version },
      }),
    });
    const published = await tx.facultyProfileRevision.findFirst({
      where: { facultyId: profile.id, status: 'PUBLISHED' },
      include: academicInclude,
    });
    return editorState(profile, published);
  }
  if (working && working.sourceProfileVersion !== profile.version)
    throw new HttpError(
      409,
      'The administrator changed the profile after this draft was saved. Reload, then discard the draft to start from the current profile.',
    );
  let revision: Revision;
  if (working) {
    const locked = await tx.facultyProfileRevision.updateMany({
      where: { id: working.id, version: working.version, status: { in: ['DRAFT', 'CHANGES_REQUESTED'] } },
      data: { version: { increment: 1 } },
    });
    if (locked.count !== 1) throw new HttpError(409, 'The draft changed. Reload before saving.');
    await tx.facultyEducation.deleteMany({ where: { revisionId: working.id } });
    await tx.facultyExperience.deleteMany({ where: { revisionId: working.id } });
    await tx.facultyCourse.deleteMany({ where: { revisionId: working.id } });
    await tx.facultyPublication.deleteMany({ where: { revisionId: working.id } });
    await tx.facultyPatent.deleteMany({ where: { revisionId: working.id } });
    await tx.facultyStudent.deleteMany({ where: { revisionId: working.id } });
    revision = await tx.facultyProfileRevision.update({
      where: { id: working.id },
      data: {
        ...revisionData(request.content),
        status: 'DRAFT',
        reviewNote: '',
        reviewedAt: null,
        reviewedById: null,
      },
      include: academicInclude,
    });
  } else {
    const highest = await tx.facultyProfileRevision.aggregate({
      where: { facultyId: profile.id },
      _max: { revisionNumber: true },
    });
    revision = await tx.facultyProfileRevision.create({
      data: {
        facultyId: profile.id,
        sourceProfileVersion: profile.version,
        revisionNumber: (highest._max.revisionNumber ?? 0) + 1,
        status: 'DRAFT',
        ...revisionData(request.content),
      },
      include: academicInclude,
    });
  }
  let updated = profile;
  if (request.action === 'publish') {
    const changed = await tx.facultyProfile.updateMany({
      where: { id: profile.id, userId: actor.id, category: 'CORE', version: profile.version },
      data: {
        name: request.content.name,
        designation: request.content.designation,
        department: request.content.department,
        biography: request.content.biography,
        imageUrl: request.content.imageUrl,
        websiteUrl: request.content.websiteUrl,
        publicEmail: request.content.publicEmail,
        interests: request.content.interests,
        version: { increment: 1 },
      },
    });
    if (changed.count !== 1) throw new HttpError(409, 'This profile changed. Reload before publishing.');
    await tx.facultyProfileRevision.updateMany({
      where: { facultyId: profile.id, status: 'PUBLISHED' },
      data: { status: 'SUPERSEDED' },
    });
    revision = await tx.facultyProfileRevision.update({
      where: { id: revision.id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), sourceProfileVersion: profile.version + 1 },
      include: academicInclude,
    });
    updated = await tx.facultyProfile.findUniqueOrThrow({ where: { id: profile.id } });
  }
  await tx.auditEvent.create({
    data: auditData({
      actor,
      action: request.action === 'publish' ? 'FACULTY_SELF_PUBLISHED' : 'FACULTY_DRAFT_SAVED',
      targetId: profile.id,
      targetName: request.content.name,
      before: { profileVersion: profile.version, draftVersion: working?.version ?? null },
      after: {
        profileVersion: updated.version,
        revisionId: revision.id,
        revisionNumber: revision.revisionNumber,
        draftVersion: revision.version,
      },
      details: { ownProfileOnly: true, immediatelyPublished: request.action === 'publish' },
    }),
  });
  return editorState(updated, revision, request.action === 'save');
}
export async function saveOwnFacultyContent(actor: Actor, input: unknown) {
  try {
    return await getDatabase().$transaction((tx) => writeOwnFacultyContent(tx, actor, input), {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['P2034', 'P2002'].includes(String(error.code))
    )
      throw new HttpError(409, 'Another session changed this profile. Reload before saving.');
    throw error;
  }
}
