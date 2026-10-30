# Docker and database setup

Read this if you are preparing the CTIKS application and PostgreSQL for a server.

## What is included

- `Dockerfile` builds the Next.js application using Node.js 22.23.4 and includes Prisma migration tools.
- `compose.app.yaml` runs the app with existing PostgreSQL and Redis servers.
- `compose.yaml` starts local development PostgreSQL and Redis; its credentials are for development only.
- `prisma/schema.prisma` defines the database models. `prisma/migrations/` contains ordered SQL migrations.

The image does not include database records or uploaded files. Existing data must be transferred separately.

## Configure the server

Install Docker Engine and Docker Compose. Arrange PostgreSQL, Redis, HTTPS and a reverse proxy with the server team.
Copy `.env.production.example` to an untracked `.env.production.local` file in the project directory and set:

```dotenv
DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME?sslmode=verify-full
REDIS_URL=rediss://REDIS_USER:REDIS_PASSWORD@REDIS_HOST:6379
REDIS_NAMESPACE=ctiks
BETTER_AUTH_SECRET=REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG
BETTER_AUTH_URL=https://YOUR_SITE_HOSTNAME
```

Replace all placeholders using values supplied securely by the server team. Use one PostgreSQL account that owns
the target database and its tables. The app verifies PostgreSQL certificates for non-local hosts, so the database needs a trusted certificate.
Keep this file private and out of Git. The authentication URL must be HTTPS in production.

The app binds to `127.0.0.1:3000`; configure the server's HTTPS reverse proxy to reach it. The app Compose file does
not create PostgreSQL, Redis or an upload volume. Production uploads still need implementation.

## Build the application

```bash
docker compose -f compose.app.yaml build
```

Success: the image builds without errors. The build needs access to package registries and fonts.

## Apply migrations

Use the same PostgreSQL account configured in `DATABASE_URL`. Back up the target database first and confirm the
target before applying migrations. The URL must connect directly for migrations. If the website uses a pooled URL,
set `DIRECT_URL` securely in your shell to the direct URL for the same account and database.

```bash
docker compose -f compose.app.yaml run --rm app npm run db:migrate
```

If `DIRECT_URL` is needed, add `-e DIRECT_URL` before `app` in the command. Success: Prisma reports that all
migrations were applied or that none are pending. Do not run the seed command against an existing database without reviewing it.

## Start the application

```bash
docker compose -f compose.app.yaml up -d
docker compose -f compose.app.yaml ps
```

Success: the app container is running. Check the site through the configured HTTPS hostname. Login and content
pages also require working Redis and PostgreSQL connections.

## Local development

Follow [Getting started](GETTING_STARTED.md) for local PostgreSQL, Redis, migrations, seed and the development server.
The local Compose volume preserves PostgreSQL data across container restarts. Removing the volume deletes local data.

## Redis

Redis stores login sessions and rate limits. The app needs `REDIS_URL` with a `redis://` or `rediss://` URL and
uses `REDIS_NAMESPACE` to separate its keys. Ask the server team for an authenticated Redis connection and TLS
where required. The local `redis.conf` and Compose service are development examples, not production defaults.
The Redis service must remain reachable from the application container; do not expose it publicly.

## Existing files and future uploads

The database contains file links, but the images and PDFs are stored separately. To set them up:

1. **Prepare a storage folder.** Make a persistent folder available on the application server. The folder can be on
   a separate storage server if it is mounted on the application server.
2. **Copy the existing files.** Obtain the existing images and PDFs as part of the handover and copy them to that
   folder without changing their filenames. Check for missing files and include the folder in backups.
3. **Connect the folder to Docker.** Once production upload support is implemented, mount IITB's folder into the
   application container. Give the container permission to read and write the folder. The current image runs as
   UID 1000; do not make the folder globally writable. IITB should also monitor that shared storage is mounted.
4. **Test the setup.** Open an existing image and PDF, upload new ones as an authorized user, then restart the
   container and check that the files still open. Test restoring the folder from backup.

**Still to do:** production upload and file-serving support must be implemented and tested. The current upload and
`/api/local-media/` routes work only in local development; copying files or mounting a folder does not enable them.
External HTTPS links should also be checked separately.

## Transfer an existing Neon database

`scripts/transfer-postgres.mjs` exports the source with `pg_dump` and restores it with `pg_restore`. It requires
Node.js, installed dependencies and PostgreSQL client tools whose major version is at least the source server's
version. Give the script a direct Neon source URL and a target-owner URL in the private `SOURCE_DATABASE_URL` and
`TARGET_DATABASE_URL` environment variables. Supply them through your shell or secret manager; don't commit them.
URLs should use a password and standard `sslmode`/`channel_binding` options. The script refuses a target containing
tables and does not copy database roles or grants. Use a new empty target database and back up anything important.

```bash
node scripts/transfer-postgres.mjs --apply
```

Success: `Transfer completed`. The source is read, and the target is restored in a single transaction. Verify the
site using the same target account that performed the restore. This transfers accounts and other database records too;
share credentials and backups privately. Uploaded files remain a separate transfer. Never run migrations or seed
against the new database before this full restore: the target must be empty.

### Database accounts after the transfer

PostgreSQL roles are database login accounts, separate from website administrator and faculty accounts. The transfer
includes website accounts and their stored password hashes, but does **not** copy PostgreSQL roles or permissions.
Use one target PostgreSQL account to restore the backup, run the website and apply migrations. Because the restored
objects are created by that account, it owns them and can use them, including the Research table.

Test both reading and editing after the transfer. Share the Neon source and target connection URLs privately; never
put real connection URLs in Git or in this guide. This single account has broad permissions while the website runs.

Next: [Environment reference](ENVIRONMENT.md) · [Project guide](PROJECT_GUIDE.md)
