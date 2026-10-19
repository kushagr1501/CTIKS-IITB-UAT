import assert from 'node:assert/strict';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local', quiet: true });
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL first.');
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('sslmode', 'verify-full');
const pool = new pg.Pool({ connectionString: url.toString(), max: 1 });

try {
  const {
    rows: [privileges],
  } = await pool.query(`SELECT current_user AS role,
    has_table_privilege(current_user, 'audit_events', 'SELECT') AS audit_read,
    has_table_privilege(current_user, 'audit_events', 'INSERT') AS audit_insert,
    has_table_privilege(current_user, 'audit_events', 'UPDATE') AS audit_update,
    has_table_privilege(current_user, 'audit_events', 'DELETE') AS audit_delete,
    has_table_privilege(current_user, 'audit_events', 'TRUNCATE') AS audit_truncate,
    has_column_privilege(current_user, 'users', 'role', 'UPDATE') AS role_update,
    has_table_privilege(current_user, 'users', 'INSERT') AS user_insert,
    has_table_privilege(current_user, 'accounts', 'INSERT') AS account_insert,
    has_table_privilege(current_user, 'faculty_profiles', 'DELETE') AS faculty_delete,
    has_table_privilege(current_user, 'accounts', 'DELETE') AS account_delete,
    has_table_privilege(current_user, 'activities', 'SELECT') AS activity_read,
    has_table_privilege(current_user, 'activities', 'INSERT') AS activity_insert,
    has_table_privilege(current_user, 'activities', 'UPDATE') AS activity_update,
    has_table_privilege(current_user, 'activities', 'DELETE') AS activity_delete,
    has_table_privilege(current_user, 'users', 'DELETE') AS user_delete,
    has_column_privilege(current_user, 'users', 'email', 'UPDATE') AS email_update,
    has_schema_privilege(current_user, 'public', 'CREATE') AS schema_create`);
  assert.equal(privileges.role, 'ctiks_app');
  assert.equal(privileges.audit_read, true);
  assert.equal(privileges.audit_insert, true);
  assert.equal(privileges.user_insert, true);
  assert.equal(privileges.account_insert, true);
  assert.equal(privileges.faculty_delete, true);
  assert.equal(privileges.account_delete, true);
  assert.equal(privileges.email_update, true);
  for (const key of ['activity_read', 'activity_insert', 'activity_update', 'activity_delete'])
    assert.equal(privileges[key], true, key);
  for (const key of [
    'audit_update',
    'audit_delete',
    'audit_truncate',
    'role_update',
    'schema_create',
    'user_delete',
  ])
    assert.equal(privileges[key], false, key);
  const removedColumns = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'
       AND column_name = ANY($1::text[])`,
    [['active', 'passwordChangeRequired', 'twoFactorEnabled', 'emailVerified']],
  );
  assert.equal(removedColumns.rowCount, 0, 'unused account fields must be removed');
  const removedAccountColumns = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'accounts'
       AND column_name = ANY($1::text[])`,
    [['providerId', 'accountId']],
  );
  assert.equal(removedAccountColumns.rowCount, 0, 'provider identity fields must be derived internally');
  const facultyVisibility = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'faculty_profiles'
       AND column_name IN ('status', 'archivedAt', 'visible')`,
  );
  assert.deepEqual(facultyVisibility.rows, [{ column_name: 'visible', data_type: 'boolean' }]);
  const {
    rows: [removedMfa],
  } = await pool.query("SELECT to_regclass('public.two_factors') AS table_name");
  assert.equal(removedMfa.table_name, null, 'unused authenticator table must be removed');
  const {
    rows: [transient],
  } = await pool.query(
    "SELECT to_regclass('public.sessions') AS sessions, to_regclass('public.rate_limits') AS rate_limits, to_regclass('public.verifications') AS verifications",
  );
  assert.equal(transient.sessions, null, 'sessions must live in Redis');
  assert.equal(transient.rate_limits, null, 'rate counters must live in Redis');
  assert.equal(transient.verifications, null, 'authentication challenges must live in Redis');
  const {
    rows: [counts],
  } = await pool.query(
    "SELECT (SELECT count(*) FROM faculty_profiles)::int AS faculty, (SELECT count(*) FROM users WHERE role = 'ADMIN')::int AS admins",
  );
  console.log(
    JSON.stringify({
      restrictedRuntimeRole: true,
      auditChangesBlocked: true,
      roleUpdatesBlocked: true,
      simplifiedAccounts: true,
      simpleFacultyVisibility: true,
      ...counts,
    }),
  );
} finally {
  await pool.end();
}
