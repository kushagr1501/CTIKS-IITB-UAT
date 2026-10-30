# CTIKS website: IITB handover

Read this if you are setting up the CTIKS website on a new server.

**Source:** https://github.com/kushagr1501/CTIKS-IITB-UAT

This guide covers the application, PostgreSQL data, Redis, file storage, deployment, backups, and first login. The repository does not contain live passwords or uploaded files. Obtain those through the agreed private handover channel.

## 1. What you need

- Access to the GitHub repository and a server with Docker Engine and Docker Compose.
- One PostgreSQL database and one reachable Redis service. Use one PostgreSQL account that owns the application database and its tables.
- An HTTPS hostname and a reverse proxy that forwards to the app on `127.0.0.1:3000`.
- For a Neon data transfer or backups: Node.js, `npm`, `pg_dump`, and `pg_restore` on the operations host. The PostgreSQL client tools must be at least as new as the source server.
- A separate, backed-up storage folder for existing images and PDFs.

The Docker image uses Node.js 22.23.4. The repository's package lock installs the application dependencies.

## 2. Get the source and set private configuration

```bash
git clone https://github.com/kushagr1501/CTIKS-IITB-UAT.git
cd CTIKS-IITB-UAT
cp .env.production.example .env.production.local
```

Edit `.env.production.local` on the server. Replace every placeholder with the real database and Redis URLs, a random `BETTER_AUTH_SECRET` of at least 32 characters, and the HTTPS `BETTER_AUTH_URL`. `REDIS_NAMESPACE` can remain `ctiks`. If the database uses a pooled connection, set `DIRECT_URL` privately to its direct connection for migrations. Do not commit this file or paste connection URLs into tickets.

The key files are `Dockerfile`, `compose.app.yaml`, `.env.production.example`, `prisma/schema.prisma`, and `prisma/migrations/`. `compose.yaml` is for local development services; it is not the server deployment file.

## 3. Prepare PostgreSQL: choose one path

**A. Keep the existing Neon content.** Create a new, empty target PostgreSQL database. On the operations host, run `npm ci`, supply `SOURCE_DATABASE_URL` (a direct Neon URL) and `TARGET_DATABASE_URL` (the new database) privately, then run:

```bash
node scripts/transfer-postgres.mjs --apply
```

Success: `Transfer completed`. This copies the schema, website accounts, and records. It does not copy PostgreSQL roles, grants, Redis sessions, or uploaded files. Do **not** migrate or seed the target before this transfer; the script refuses a database containing tables. Use the target database URL in `.env.production.local` afterward.

**B. Start with an empty website.** Point `.env.production.local` to the new PostgreSQL database, build the app (step 4), then apply the checked-in migrations:

```bash
docker compose -f compose.app.yaml run --rm app npm run db:migrate
```

Success: Prisma reports applied migrations or says none are pending. The schema is in `prisma/schema.prisma`; each change is in `prisma/migrations/`. This path does not bring over Neon content. For a first administrator, follow the seed instructions in [Production handover](PRODUCTION_HANDOVER.md#initial-administrator-access). The seed creates a **random** password; the supplied existing password is not installed by this step.

## 4. Build and start the website

```bash
docker compose -f compose.app.yaml build
docker compose -f compose.app.yaml up -d
docker compose -f compose.app.yaml ps
```

Success: the build finishes and `ps` shows the app running. Configure HTTPS at the reverse proxy and forward to `127.0.0.1:3000`. Open Home, People, Research, Activities, and `/login` on the HTTPS hostname. Confirm an admin can sign in and make a test edit. The app needs working PostgreSQL and Redis connections for login and content management.

## 5. Redis and environment reference

Redis holds login sessions and rate limits. Set `REDIS_URL` to an authenticated `redis://` or `rediss://` URL reachable from the container; use TLS where the server requires it. Do not expose Redis to the public internet. `compose.app.yaml` expects an external Redis service and does not start one.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by the app and migration/backup commands |
| `DIRECT_URL` | Optional direct PostgreSQL connection for migrations when `DATABASE_URL` is pooled |
| `REDIS_URL` | Redis connection for sessions and rate limits |
| `REDIS_NAMESPACE` | Prefix for this app's Redis keys; defaults to `ctiks` |
| `BETTER_AUTH_SECRET` | Private signing secret, at least 32 characters |
| `BETTER_AUTH_URL` | Public HTTPS origin of this website |

Use [.env.production.example](../.env.production.example) as the template. The full reference is in [Environment](ENVIRONMENT.md).

## 6. Existing files and future uploads

Database rows store URLs for images and PDFs; the database transfer does not include file bytes. Copy the existing local media folder from the current development machine (normally `ctiks-local-media` beside the project, or the configured `CTIKS_LOCAL_MEDIA_DIR`) to a persistent, backed-up server folder. Preserve filenames because stored `/api/local-media/...` URLs use them. Check any external HTTPS media links separately.

**Production uploads and `/api/local-media/` serving are not implemented yet.** The current endpoints work only in development. A storage mount alone will not make them work. Before relying on local files in production, implement and test production upload and serving against the persistent folder, preserve existing URLs, and verify files survive a container replacement. IITB must choose the host storage path, mount, permissions, and backup schedule. See [Docker and database setup](DOCKER_DATABASE.md#existing-files-and-future-uploads).

## 7. Back up and restore

The repository includes **manual** database backup and restore commands. It does not schedule backups. On the operations host, install Node dependencies and PostgreSQL client tools. Supply the direct `DATABASE_URL` privately. Use a private directory and a new filename for every backup:

```bash
node scripts/backup-restore.mjs backup --output /PRIVATE/BACKUPS/ctiks-YYYY-MM-DD.dump
pg_restore --list /PRIVATE/BACKUPS/ctiks-YYYY-MM-DD.dump
```

Success: `Backup created`; `pg_restore --list` lists archive contents. The script refuses to overwrite an existing file. Back up the media folder separately; a database dump contains paths, not files. Protect dumps because they contain account data and password hashes.

To test a restore, create a **new, empty** PostgreSQL database, set `DATABASE_URL` to that target, then run:

```bash
node scripts/backup-restore.mjs restore --file /PRIVATE/BACKUPS/ctiks-YYYY-MM-DD.dump --apply
```

Success: `Restore completed`. The script refuses a target with tables. Check the restored site and its media files before any production cutover. IITB must set the schedule, retention, secure storage, and regular restore tests.

## 8. First administrator login and final checks

For a Neon transfer, website accounts and their password hashes come with the data. Get the existing administrator email and password privately, visit `https://YOUR_SITE_HOSTNAME/login`, and change the password at `/admin/security` after sign-in. A fresh seed creates a different random password in the private credentials file; it does not set the existing password supplied with this handover. The existing credentials have not been verified against the final IITB database.

Before launch, verify the HTTPS site, PostgreSQL edits, Redis-backed login, existing images/PDFs, new uploads once implemented, a database restore, and a separate media restore. Keep the server's private environment file, credentials, backups, and source database URL out of Git.

Next: [Docker and database setup](DOCKER_DATABASE.md) · [Production handover](PRODUCTION_HANDOVER.md) · [Environment](ENVIRONMENT.md)
