# Production handover

Read this if you are deploying and operating the CTIKS website on the IITB server.

## Deploy the website

1. Provide Docker, PostgreSQL, Redis, and an HTTPS hostname on the server. Obtain the private
   repository and the database and Redis connection details through an approved channel.
2. Follow [Docker and database setup](DOCKER_DATABASE.md) to create `.env.production.local` and build the image.
   Keep the environment file private. `compose.app.yaml` listens on `127.0.0.1:3000`.
3. Choose the data source. For an existing Neon database, restore it into a new empty PostgreSQL database using
   the transfer instructions in the setup guide. For a new installation, apply the migrations in that guide.
   Do not apply migrations or seed before a full transfer into an empty database.
4. Start the app using the Compose instructions. Open the HTTPS site and check Home, People, Research, Activities
   and Login. Sign in as an administrator and check a normal content edit with an agreed test record.
5. Configure and test backups for PostgreSQL and, separately, uploaded files. Monitor PostgreSQL, Redis, the app
   and the reverse proxy. Production file uploads and serving are not yet implemented; see the setup guide.

The container build and public page checks have been tested locally with an isolated database. Deployment on the
IITB server, HTTPS, external Redis, file storage and a production admin login still require server-side verification.

## Back up PostgreSQL

Use PostgreSQL client tools (`pg_dump` and `pg_restore`) compatible with the server version: `pg_dump` must be at
least as new as the source PostgreSQL server. Use a direct database connection with permission to read all required
tables. Arrange connection settings through your server's secret manager or a protected PostgreSQL service/password
file; do not place credentials in commands, logs or Git. Set the standard libpq environment variables `PGHOST`,
`PGPORT`, `PGUSER`, `PGDATABASE`, `PGSSLMODE` and, when needed, `PGPASSFILE` before running the commands.

Run the repository's backup script on the operations host (Node.js dependencies and PostgreSQL client tools must
be installed there). Set `DATABASE_URL` privately to the direct URL for the database being backed up. Choose a
private backup folder and a unique name:

```bash
node scripts/backup-restore.mjs backup --output /PRIVATE/BACKUPS/ctiks-backup.dump
pg_restore --list ctiks-backup.dump
```

Use the same full backup path for `pg_restore --list`. Success: the script reports `Backup created`, and the
second command lists the archive contents. The script refuses to overwrite an existing backup. The dump contains website
accounts and password hashes; restrict access and store copies securely. It does not contain uploaded image or PDF
files, Redis sessions, PostgreSQL roles or their grants. Back up uploaded files separately.

## Restore a backup

1. Create a **new, empty** target database and set the libpq connection variables for that target. Keep the current
   production database untouched while testing the restore. The target PostgreSQL version must support the backup.
2. Set `DATABASE_URL` to the **new empty target database**, then run:

   ```bash
   node scripts/backup-restore.mjs restore --file /PRIVATE/BACKUPS/ctiks-backup.dump --apply
   ```

3. Success: the script reports `Restore completed`. It refuses a non-empty target and restores in one database
   transaction. Check the restored records and test the application against the restored
   database before switching traffic. The account running the restore owns the restored objects; use the agreed
   account and configure any needed access. Restore the separately backed-up files and test their links once
   production file serving has been implemented.

This restore does not replace an existing database. Schedule and regularly test backups and restores according to
IITB's policy. Switch production to a restored database only after coordinating downtime and verifying the data.

## Initial administrator access

If the Neon database is transferred, existing website accounts and password hashes are included. Obtain the
administrator email and current password **privately** from the existing owner or password manager. They are not in
this repository. Sign in, then change the password at `/admin/security`.
The copied login instruction in a seed credential file may say localhost; use the actual HTTPS hostname instead.

For a new, empty installation with no existing admin, the seed command can create an administrator with a random
password, but it also imports initial faculty content. Review `scripts/seed.ts` first. Apply migrations and set
`ADMIN_EMAIL` in your shell. Prepare a private server directory writable by container UID 1000, and substitute its
absolute path below. Do not use this command on an existing database merely to recover credentials.

```bash
docker compose -f compose.app.yaml run --rm -e ADMIN_EMAIL --volume /PRIVATE/SERVER/DIRECTORY:/app/.private app npm run db:seed
```

On a new database, the command writes `admin-credentials.txt` in that server directory. Success: the command reports
that the admin was created and the credentials file was saved. Obtain it through an approved private channel, then
change the password. If an administrator already exists, the seed does not reset their password. Without the mounted
private directory, credentials written inside the one-off container would be lost when it is removed.

Next: [Docker and database setup](DOCKER_DATABASE.md) · [Environment reference](ENVIRONMENT.md)
