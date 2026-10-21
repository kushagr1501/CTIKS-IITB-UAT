BEGIN;

ALTER TABLE "faculty_profile_revisions"
  DROP CONSTRAINT IF EXISTS "faculty_revision_positive_versions";

ALTER TABLE "faculty_profile_revisions"
  DROP COLUMN IF EXISTS "sourceProfileVersion";

ALTER TABLE "faculty_profile_revisions"
  RENAME COLUMN "version" TO "draftVersion";

ALTER TABLE "faculty_profile_revisions"
  ADD CONSTRAINT "faculty_revision_positive_versions"
  CHECK ("revisionNumber" > 0 AND "draftVersion" > 0);

COMMIT;
