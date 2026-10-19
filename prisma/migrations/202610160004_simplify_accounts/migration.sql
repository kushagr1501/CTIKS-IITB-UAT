-- Remove account controls that are outside the current login workflow.
ALTER TABLE users
  DROP COLUMN active,
  DROP COLUMN "passwordChangeRequired",
  DROP COLUMN "twoFactorEnabled";

ALTER TABLE sessions DROP COLUMN "mfaVerified";
DROP TABLE two_factors;
