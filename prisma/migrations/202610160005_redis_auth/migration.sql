-- Transient authentication state now lives in Redis. Existing browsers must log in again.
DROP TABLE sessions;
DROP TABLE rate_limits;
ALTER TABLE users DROP COLUMN "emailVerified";
