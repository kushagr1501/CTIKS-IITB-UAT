BEGIN;

-- Preserve the existing public directory exactly: drafts and archived profiles stay hidden.
ALTER TABLE faculty_profiles ADD COLUMN visible BOOLEAN NOT NULL DEFAULT false;
UPDATE faculty_profiles SET visible = (status = 'PUBLISHED' AND "archivedAt" IS NULL);

DROP INDEX "faculty_profiles_status_archivedAt_category_displayOrder_idx";
ALTER TABLE faculty_profiles DROP COLUMN status, DROP COLUMN "archivedAt";
DROP TYPE "PublicationStatus";
CREATE INDEX "faculty_profiles_visible_category_displayOrder_idx"
  ON faculty_profiles(visible, category, "displayOrder");

COMMIT;
