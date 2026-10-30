import { randomUUID } from 'node:crypto';
import pg from 'pg';
import argon2 from 'argon2';


const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_INITIAL_PASSWORD;
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 6 || !databaseUrl) {
  console.error('Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD (at least 6 characters) in env.prod.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
try {
  const existingAdmins = await pool.query('SELECT id, email FROM users WHERE role = $1', ['ADMIN']);
  if (existingAdmins.rows.some((admin) => admin.email.toLowerCase() !== email)) {
    throw new Error('An administrator with a different email already exists. Resolve that account before provisioning.');
  }

  const existingUser = await pool.query('SELECT id, role FROM users WHERE lower(email) = $1', [email]);
  if (existingUser.rows.length && existingUser.rows[0].role !== 'ADMIN') {
    throw new Error('The configured email belongs to a non-admin account.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let userId = existingUser.rows[0]?.id;
    if (!userId) {
      userId = randomUUID();
      await client.query(
        'INSERT INTO users (id, name, email, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [userId, 'CTIKS Administrator', email, 'ADMIN'],
      );
    }
    const credential = await client.query('SELECT id FROM accounts WHERE "userId" = $1', [userId]);
    if (credential.rows.length) {
      await client.query('UPDATE accounts SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2', [passwordHash, userId]);
    } else {
      await client.query(
        'INSERT INTO accounts (id, "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())',
        [randomUUID(), userId, passwordHash],
      );
    }
    await client.query(
      'INSERT INTO audit_events (id, "actorId", "actorEmail", "actorName", action, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      [randomUUID(), userId, email, 'CTIKS Administrator', 'ADMIN_PASSWORD_PROVISIONED'],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  console.log('Administrator credential provisioned. Remove ADMIN_INITIAL_PASSWORD from env.prod now.');
} catch (error) {
  console.error(error instanceof Error && /^(An administrator|The configured email)/.test(error.message)
    ? error.message : 'Administrator provisioning failed. Check the database, migrations, and account state.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
