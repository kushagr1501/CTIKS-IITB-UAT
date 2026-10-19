BEGIN;

ALTER TABLE faculty_profile_revisions
  ADD COLUMN name TEXT,
  ADD COLUMN designation TEXT,
  ADD COLUMN department TEXT;

ALTER TABLE faculty_profile_revisions
  ADD CONSTRAINT faculty_revision_name_length CHECK (name IS NULL OR char_length(name) <= 160),
  ADD CONSTRAINT faculty_revision_designation_length CHECK (designation IS NULL OR char_length(designation) <= 160),
  ADD CONSTRAINT faculty_revision_department_length CHECK (department IS NULL OR char_length(department) <= 300);

COMMIT;
