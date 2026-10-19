BEGIN;

-- CreateEnum
CREATE TYPE "FacultyRevisionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'PUBLISHED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "FacultyCourseStatus" AS ENUM ('CURRENT', 'PREVIOUS');

-- CreateEnum
CREATE TYPE "FacultyPublicationType" AS ENUM ('JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER', 'RESEARCH_MONOGRAPH');

-- CreateEnum
CREATE TYPE "FacultyStudentStatus" AS ENUM ('CURRENT', 'GRADUATED');

-- CreateTable
CREATE TABLE "faculty_profile_revisions" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "sourceProfileVersion" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "FacultyRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "biography" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "websiteUrl" TEXT NOT NULL DEFAULT '',
    "publicEmail" TEXT NOT NULL DEFAULT '',
    "interests" TEXT NOT NULL DEFAULT '',
    "researchTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "researchOverview" TEXT NOT NULL DEFAULT '',
    "officeAddress" TEXT NOT NULL DEFAULT '',
    "publicPhone" TEXT NOT NULL DEFAULT '',
    "submittedById" TEXT,
    "submittedAt" TIMESTAMPTZ(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "faculty_profile_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_education" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "periodText" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faculty_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_experience" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organisation" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "periodText" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faculty_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_courses" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "periodText" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "status" "FacultyCourseStatus" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faculty_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_publications" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "type" "FacultyPublicationType" NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL DEFAULT '',
    "venue" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "citation" TEXT NOT NULL DEFAULT '',
    "doi" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faculty_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_patents" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inventors" TEXT NOT NULL DEFAULT '',
    "identifier" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faculty_patents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_students" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programme" TEXT NOT NULL DEFAULT '',
    "researchTopic" TEXT NOT NULL DEFAULT '',
    "supervisionRole" TEXT NOT NULL DEFAULT '',
    "periodText" TEXT NOT NULL DEFAULT '',
    "status" "FacultyStudentStatus" NOT NULL,
    "graduationYear" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faculty_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faculty_profile_revisions_status_submittedAt_idx" ON "faculty_profile_revisions"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "faculty_profile_revisions_submittedById_idx" ON "faculty_profile_revisions"("submittedById");

-- CreateIndex
CREATE INDEX "faculty_profile_revisions_reviewedById_idx" ON "faculty_profile_revisions"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profile_revisions_facultyId_revisionNumber_key" ON "faculty_profile_revisions"("facultyId", "revisionNumber");

-- CreateIndex
CREATE INDEX "faculty_education_revisionId_displayOrder_id_idx" ON "faculty_education"("revisionId", "displayOrder", "id");

-- CreateIndex
CREATE INDEX "faculty_experience_revisionId_displayOrder_id_idx" ON "faculty_experience"("revisionId", "displayOrder", "id");

-- CreateIndex
CREATE INDEX "faculty_courses_revisionId_displayOrder_id_idx" ON "faculty_courses"("revisionId", "displayOrder", "id");

-- CreateIndex
CREATE INDEX "faculty_publications_revisionId_displayOrder_id_idx" ON "faculty_publications"("revisionId", "displayOrder", "id");

-- CreateIndex
CREATE INDEX "faculty_patents_revisionId_displayOrder_id_idx" ON "faculty_patents"("revisionId", "displayOrder", "id");

-- CreateIndex
CREATE INDEX "faculty_students_revisionId_displayOrder_id_idx" ON "faculty_students"("revisionId", "displayOrder", "id");

-- AddForeignKey
ALTER TABLE "faculty_profile_revisions" ADD CONSTRAINT "faculty_profile_revisions_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profile_revisions" ADD CONSTRAINT "faculty_profile_revisions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profile_revisions" ADD CONSTRAINT "faculty_profile_revisions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_education" ADD CONSTRAINT "faculty_education_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "faculty_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_experience" ADD CONSTRAINT "faculty_experience_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "faculty_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_courses" ADD CONSTRAINT "faculty_courses_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "faculty_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_publications" ADD CONSTRAINT "faculty_publications_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "faculty_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_patents" ADD CONSTRAINT "faculty_patents_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "faculty_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_students" ADD CONSTRAINT "faculty_students_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "faculty_profile_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A profile may retain older published snapshots, but only one is current.
CREATE UNIQUE INDEX faculty_revision_one_published
  ON faculty_profile_revisions ("facultyId") WHERE status = 'PUBLISHED';
CREATE UNIQUE INDEX faculty_revision_one_working
  ON faculty_profile_revisions ("facultyId")
  WHERE status IN ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED');

ALTER TABLE faculty_profile_revisions
  ADD CONSTRAINT faculty_revision_positive_versions
    CHECK ("revisionNumber" > 0 AND "sourceProfileVersion" > 0 AND version > 0),
  ADD CONSTRAINT faculty_revision_tags_valid
    CHECK (cardinality("researchTags") <= 30
      AND array_position("researchTags", NULL) IS NULL
      AND array_position("researchTags", '') IS NULL),
  ADD CONSTRAINT faculty_revision_publication_metadata
    CHECK ((status IN ('PUBLISHED', 'SUPERSEDED')) = ("publishedAt" IS NOT NULL)),
  ADD CONSTRAINT faculty_revision_submission_metadata
    CHECK (status NOT IN ('SUBMITTED', 'CHANGES_REQUESTED')
      OR ("submittedById" IS NOT NULL AND "submittedAt" IS NOT NULL)),
  ADD CONSTRAINT faculty_revision_review_metadata
    CHECK (status <> 'CHANGES_REQUESTED'
      OR ("reviewedById" IS NOT NULL AND "reviewedAt" IS NOT NULL
        AND char_length(btrim("reviewNote")) > 0));

ALTER TABLE faculty_education ADD CONSTRAINT faculty_education_values_valid
  CHECK ("displayOrder" >= 0 AND char_length(btrim(title)) > 0);
ALTER TABLE faculty_experience ADD CONSTRAINT faculty_experience_values_valid
  CHECK ("displayOrder" >= 0 AND char_length(btrim(title)) > 0);
ALTER TABLE faculty_courses ADD CONSTRAINT faculty_course_values_valid
  CHECK ("displayOrder" >= 0 AND char_length(btrim(title)) > 0);
ALTER TABLE faculty_publications ADD CONSTRAINT faculty_publication_values_valid
  CHECK ("displayOrder" >= 0 AND char_length(btrim(title)) > 0
    AND (year IS NULL OR year BETWEEN 1000 AND 9999));
ALTER TABLE faculty_patents ADD CONSTRAINT faculty_patent_values_valid
  CHECK ("displayOrder" >= 0 AND char_length(btrim(title)) > 0
    AND (year IS NULL OR year BETWEEN 1000 AND 9999));
ALTER TABLE faculty_students ADD CONSTRAINT faculty_student_values_valid
  CHECK ("displayOrder" >= 0 AND char_length(btrim(name)) > 0
    AND ("graduationYear" IS NULL OR (status = 'GRADUATED' AND "graduationYear" BETWEEN 1000 AND 9999)));

-- Baseline snapshots for existing core professors, including hidden profiles and
-- those without a login. Preserve all original rows, identities and credentials.
-- PUBLISHED here means the accepted content baseline; visible still controls access.
-- Keep interests verbatim. The future editor must explicitly confirm research tags.
INSERT INTO faculty_profile_revisions (
  id, "facultyId", "revisionNumber", "sourceProfileVersion", status,
  biography, "imageUrl", "websiteUrl", "publicEmail", interests,
  "publishedAt", "updatedAt"
)
SELECT md5('ctiks-faculty-baseline:' || id)::uuid::text, id, 1, version, 'PUBLISHED',
  biography, "imageUrl", "websiteUrl", "publicEmail", interests,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM faculty_profiles WHERE category = 'CORE';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ctiks_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      faculty_profile_revisions, faculty_education, faculty_experience,
      faculty_courses, faculty_publications, faculty_patents, faculty_students TO ctiks_app;
  END IF;
END $$;

COMMIT;
