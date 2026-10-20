BEGIN;

ALTER TABLE faculty_students
  ADD COLUMN biography TEXT NOT NULL DEFAULT '';

ALTER TABLE faculty_students
  ADD CONSTRAINT faculty_students_biography_length CHECK (char_length(biography) <= 5000);

COMMIT;
