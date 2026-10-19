BEGIN;

ALTER TABLE faculty_students
  ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "socialLinks" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE faculty_students
  ADD CONSTRAINT faculty_student_photo_url_length CHECK (char_length("imageUrl") <= 2048),
  ADD CONSTRAINT faculty_student_social_links_array CHECK (
    CASE WHEN jsonb_typeof("socialLinks") = 'array'
      THEN jsonb_array_length("socialLinks") <= 8 ELSE false END
  );

COMMIT;
