ALTER TYPE "ActivitySection" ADD VALUE IF NOT EXISTS 'CAMPUS_UPDATE';

ALTER TABLE "activities" DROP CONSTRAINT "activities_sections_required";
ALTER TABLE "activities" ADD CONSTRAINT "activities_sections_required"
  CHECK (cardinality("sections") BETWEEN 1 AND 4);
