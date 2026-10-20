import 'server-only';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@/generated/prisma/client';
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
          biography,
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
          biography,
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

function editorStateFromContent(
  profile: Profile,
  revision: Pick<Revision, 'version'>,
  content: AcademicContent,
  draft: boolean,
): FacultyEditorState {
  return {
    identity: {
      name: profile.name,
      slug: profile.slug,
      designation: profile.designation,
      department: profile.department,
      visible: profile.visible,
    },
    profileVersion: profile.version,
    draftVersion: draft ? revision.version : null,
    hasDraft: draft,
    content,
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
function revisionData(content: AcademicContent) {
  return {
    name: content.name,
    designation: content.designation,
    department: content.department,
    biography: content.biography,
    imageUrl: content.imageUrl,
    websiteUrl: content.websiteUrl,
    publicEmail: content.publicEmail,
    interests: content.interests,
    researchTags: content.researchTags,
    researchOverview: content.researchOverview,
    officeAddress: content.officeAddress,
    publicPhone: content.publicPhone,
  };
}

function childRows<T extends object>(revisionId: string, items: T[]) {
  return items.map((item, displayOrder) => ({ id: randomUUID(), revisionId, ...item, displayOrder }));
}

/**
 * Replace all ordered revision children in one PostgreSQL round trip.
 *
 * The profile editor validates every value before this function runs. JSON is
 * still passed as query parameters (never interpolated into SQL), while the
 * explicit record shapes keep the database constraints and enum types active.
 */
async function replaceRevisionChildren(
  tx: Prisma.TransactionClient,
  revisionId: string,
  content: AcademicContent,
) {
  const education = childRows(revisionId, content.education);
  const experience = childRows(revisionId, content.experience);
  const courses = childRows(revisionId, content.courses);
  const publications = childRows(revisionId, content.publications);
  const patents = childRows(revisionId, content.patents);
  const students = childRows(revisionId, content.students);

  await tx.$queryRaw(Prisma.sql`
    WITH
    deleted_education AS (
      DELETE FROM "faculty_education" WHERE "revisionId" = ${revisionId}
    ),
    deleted_experience AS (
      DELETE FROM "faculty_experience" WHERE "revisionId" = ${revisionId}
    ),
    deleted_courses AS (
      DELETE FROM "faculty_courses" WHERE "revisionId" = ${revisionId}
    ),
    deleted_publications AS (
      DELETE FROM "faculty_publications" WHERE "revisionId" = ${revisionId}
    ),
    deleted_patents AS (
      DELETE FROM "faculty_patents" WHERE "revisionId" = ${revisionId}
    ),
    deleted_students AS (
      DELETE FROM "faculty_students" WHERE "revisionId" = ${revisionId}
    ),
    inserted_education AS (
      INSERT INTO "faculty_education"
        ("id", "revisionId", "title", "institution", "description", "periodText", "displayOrder")
      SELECT row."id", row."revisionId", row."title", row."institution", row."description",
        row."periodText", row."displayOrder"
      FROM jsonb_to_recordset(${JSON.stringify(education)}::jsonb) AS row(
        "id" text, "revisionId" text, "title" text, "institution" text,
        "description" text, "periodText" text, "displayOrder" integer
      )
    ),
    inserted_experience AS (
      INSERT INTO "faculty_experience"
        ("id", "revisionId", "title", "organisation", "description", "periodText", "displayOrder")
      SELECT row."id", row."revisionId", row."title", row."organisation", row."description",
        row."periodText", row."displayOrder"
      FROM jsonb_to_recordset(${JSON.stringify(experience)}::jsonb) AS row(
        "id" text, "revisionId" text, "title" text, "organisation" text,
        "description" text, "periodText" text, "displayOrder" integer
      )
    ),
    inserted_courses AS (
      INSERT INTO "faculty_courses"
        ("id", "revisionId", "title", "code", "periodText", "description", "status", "displayOrder")
      SELECT row."id", row."revisionId", row."title", row."code", row."periodText", row."description",
        row."status"::"FacultyCourseStatus", row."displayOrder"
      FROM jsonb_to_recordset(${JSON.stringify(courses)}::jsonb) AS row(
        "id" text, "revisionId" text, "title" text, "code" text, "periodText" text,
        "description" text, "status" text, "displayOrder" integer
      )
    ),
    inserted_publications AS (
      INSERT INTO "faculty_publications"
        ("id", "revisionId", "type", "title", "authors", "venue", "year", "citation", "doi", "url", "displayOrder")
      SELECT row."id", row."revisionId", row."type"::"FacultyPublicationType", row."title",
        row."authors", row."venue", row."year", row."citation", row."doi", row."url", row."displayOrder"
      FROM jsonb_to_recordset(${JSON.stringify(publications)}::jsonb) AS row(
        "id" text, "revisionId" text, "type" text, "title" text, "authors" text, "venue" text,
        "year" integer, "citation" text, "doi" text, "url" text, "displayOrder" integer
      )
    ),
    inserted_patents AS (
      INSERT INTO "faculty_patents"
        ("id", "revisionId", "title", "inventors", "identifier", "status", "year", "description", "url", "displayOrder")
      SELECT row."id", row."revisionId", row."title", row."inventors", row."identifier", row."status",
        row."year", row."description", row."url", row."displayOrder"
      FROM jsonb_to_recordset(${JSON.stringify(patents)}::jsonb) AS row(
        "id" text, "revisionId" text, "title" text, "inventors" text, "identifier" text,
        "status" text, "year" integer, "description" text, "url" text, "displayOrder" integer
      )
    ),
    inserted_students AS (
      INSERT INTO "faculty_students"
        ("id", "revisionId", "name", "programme", "biography", "researchTopic", "supervisionRole",
          "periodText", "status", "graduationYear", "imageUrl", "socialLinks", "displayOrder")
      SELECT row."id", row."revisionId", row."name", row."programme", row."biography", row."researchTopic",
        row."supervisionRole", row."periodText", row."status"::"FacultyStudentStatus", row."graduationYear",
        row."imageUrl", row."socialLinks", row."displayOrder"
      FROM jsonb_to_recordset(${JSON.stringify(students)}::jsonb) AS row(
        "id" text, "revisionId" text, "name" text, "programme" text, "biography" text,
        "researchTopic" text, "supervisionRole" text, "periodText" text, "status" text,
        "graduationYear" integer, "imageUrl" text, "socialLinks" jsonb, "displayOrder" integer
      )
    )
    SELECT 1
  `);
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
  let revision: Prisma.FacultyProfileRevisionGetPayload<object>;
  if (working) {
    revision = await tx.facultyProfileRevision.update({
      where: {
        id: working.id,
        version: working.version,
        status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
      },
      data: {
        ...revisionData(request.content),
        version: { increment: 1 },
        status: 'DRAFT',
        reviewNote: '',
        reviewedAt: null,
        reviewedById: null,
      },
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
    });
  }
  await replaceRevisionChildren(tx, revision.id, request.content);
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
    });
    updated = {
      ...profile,
      name: request.content.name,
      designation: request.content.designation,
      department: request.content.department,
      biography: request.content.biography,
      imageUrl: request.content.imageUrl,
      websiteUrl: request.content.websiteUrl,
      publicEmail: request.content.publicEmail,
      interests: request.content.interests,
      version: profile.version + 1,
    };
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
  return editorStateFromContent(updated, revision, request.content, request.action === 'save');
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
      ['P2034', 'P2002', 'P2025'].includes(String(error.code))
    )
      throw new HttpError(409, 'Another session changed this profile. Reload before saving.');
    throw error;
  }
}
