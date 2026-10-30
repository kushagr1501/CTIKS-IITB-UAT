-- Existing profiles can share a position. Give each category consecutive positions
-- while preserving the previous order and the existing name/id tie-breakers.
WITH ranked AS (
  SELECT id,
    (ROW_NUMBER() OVER (PARTITION BY category ORDER BY "displayOrder", name, id) - 1)::integer AS position
  FROM faculty_profiles
)
UPDATE faculty_profiles AS profile
SET "displayOrder" = ranked.position,
    version = profile.version + 1,
    "updatedAt" = CURRENT_TIMESTAMP
FROM ranked
WHERE profile.id = ranked.id AND profile."displayOrder" <> ranked.position;
