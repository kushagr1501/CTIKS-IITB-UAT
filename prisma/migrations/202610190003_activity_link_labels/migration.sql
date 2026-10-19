ALTER TABLE "activities" ADD COLUMN "linkLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "activities" ADD CONSTRAINT "activities_link_label_length"
  CHECK (char_length("linkLabel") <= 60);

-- Retire the category without deleting entries. Keep any other categories;
-- entries previously classified only as campus updates become News.
UPDATE "activities"
SET "sections" = CASE
  WHEN cardinality(array_remove("sections", 'CAMPUS_UPDATE'::"ActivitySection")) = 0
    THEN ARRAY['NEWS']::"ActivitySection"[]
  ELSE array_remove("sections", 'CAMPUS_UPDATE'::"ActivitySection")
END
WHERE 'CAMPUS_UPDATE'::"ActivitySection" = ANY("sections");

ALTER TABLE "activities" DROP CONSTRAINT "activities_sections_required";
ALTER TABLE "activities" ADD CONSTRAINT "activities_sections_required"
  CHECK (cardinality("sections") BETWEEN 1 AND 3
    AND NOT ('CAMPUS_UPDATE'::"ActivitySection" = ANY("sections")));
