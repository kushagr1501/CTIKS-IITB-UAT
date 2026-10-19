CREATE TYPE "ActivitySection" AS ENUM ('NEWS', 'ANNOUNCEMENT', 'EVENT');

CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sections" "ActivitySection"[] NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "eventStartAt" TIMESTAMPTZ(3),
    "eventEndAt" TIMESTAMPTZ(3),
    "venue" TEXT NOT NULL DEFAULT '',
    "registrationUrl" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "activities_sections_required" CHECK (cardinality("sections") BETWEEN 1 AND 3),
    CONSTRAINT "activities_event_range" CHECK (
      "eventEndAt" IS NULL OR ("eventStartAt" IS NOT NULL AND "eventEndAt" > "eventStartAt")
    )
);
CREATE INDEX "activities_visible_createdAt_id_idx" ON "activities"("visible", "createdAt", "id");
CREATE INDEX "activities_sections_idx" ON "activities" USING GIN ("sections");

-- Existing deployments use a restricted runtime role. Keep audit privileges unchanged.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ctiks_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "activities" TO ctiks_app;
  END IF;
END $$;
