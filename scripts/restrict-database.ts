import { config, parse } from 'dotenv';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';

config({ path: ['.env.migrations.local', '.env.local'], quiet: true });
const file = '.env.local';
const values = parse(await readFile(file));
const ownerConnection = process.env.DIRECT_URL;
if (!ownerConnection) throw new Error('A migration-owner connection is required for provisioning.');
const ownerUrl = new URL(ownerConnection);
ownerUrl.searchParams.set('sslmode', 'verify-full');
const pool = new pg.Pool({ connectionString: ownerUrl.toString(), max: 1 });

try {
  const role = 'ctiks_app';
  const exists = await pool.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
  if (exists.rowCount) {
    if (new URL(values.DATABASE_URL).username === role)
      console.log('Restricted application role already configured.');
    else throw new Error('The application role already exists; refusing to reset its password.');
  } else {
    const password = randomBytes(32).toString('hex');
    // The identifier is a constant and the password is generated hexadecimal.
    await pool.query(`CREATE ROLE ctiks_app WITH LOGIN PASSWORD '${password}'`);
    await pool.query('GRANT USAGE ON SCHEMA public TO ctiks_app');
    await pool.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await pool.query('GRANT SELECT ON users, accounts TO ctiks_app');
    await pool.query('GRANT UPDATE ("updatedAt") ON users TO ctiks_app');
    await pool.query('GRANT UPDATE ("password", "updatedAt") ON accounts TO ctiks_app');
    await pool.query('GRANT SELECT, INSERT, UPDATE ON faculty_profiles TO ctiks_app');
    await pool.query('GRANT SELECT, INSERT ON audit_events TO ctiks_app');
    const applicationUrl = new URL(values.DATABASE_URL);
    applicationUrl.username = role;
    applicationUrl.password = password;
    applicationUrl.searchParams.set('sslmode', 'verify-full');
    values.DATABASE_URL = applicationUrl.toString();
    await writeFile('.env.migrations.local', `DIRECT_URL=${JSON.stringify(ownerUrl.toString())}\n`, {
      mode: 0o600,
    });
    delete values.DIRECT_URL;
    await writeFile(
      file,
      Object.entries(values)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join('\n') + '\n',
      { mode: 0o600 },
    );
    console.log(
      'Runtime uses a restricted database role. Migration-owner credentials are in .env.migrations.local only.',
    );
  }
  // Account provisioning is now available through the administrator's faculty form.
  // Reapply these grants on existing installations without rotating credentials.
  await pool.query('GRANT INSERT ON users, accounts TO ctiks_app');
  await pool.query('GRANT DELETE ON faculty_profiles, accounts TO ctiks_app');
  await pool.query('GRANT UPDATE (email) ON users TO ctiks_app');
  await pool.query('GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO ctiks_app');
  console.log('Faculty account provisioning and deletion privileges are configured.');
} finally {
  await pool.end();
}
