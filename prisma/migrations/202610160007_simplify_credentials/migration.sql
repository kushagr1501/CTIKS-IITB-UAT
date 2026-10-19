-- Only provisioned password accounts are supported. Refuse to discard other identities.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM accounts WHERE "providerId" <> 'credential' OR "accountId" <> "userId") THEN
    RAISE EXCEPTION 'Non-credential accounts require a separate migration';
  END IF;
  IF EXISTS (SELECT 1 FROM accounts GROUP BY "userId" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Each user must have only one password account';
  END IF;
END;
$$;

DROP INDEX "accounts_providerId_accountId_key";
DROP INDEX "accounts_userId_idx";
ALTER TABLE accounts DROP COLUMN "providerId", DROP COLUMN "accountId";
CREATE UNIQUE INDEX "accounts_userId_key" ON accounts("userId");
