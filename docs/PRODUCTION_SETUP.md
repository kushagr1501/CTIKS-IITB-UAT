Read this if you are installing CTIKS on the IITB server.

# Production setup: Docker only

CTIKS is a website for people, research, academics and activities. Administrators manage content, and core faculty edit their own profiles. One Docker Compose file runs the website, **one PostgreSQL database**, and Redis. PostgreSQL holds website data; Redis holds login sessions.

You need Git and Docker Engine with Docker Compose for a local test. Hosting the site also requires an HTTPS hostname. You do **not** need to install Node.js, PostgreSQL, Redis, `pg_dump`, or `pg_restore` on the server. Docker images provide them. The supplied database and maintenance images use PostgreSQL 18, matching the current Neon source.

This Compose file uses a new `postgres-data-v18` volume. It does not open or delete an older PostgreSQL 17 volume. If this host already has data in a PostgreSQL 17 volume that you need, back it up and plan a database migration before starting this stack; changing the image version alone does not upgrade its data.

## 1. Get the repository

```bash
git clone --branch prod --single-branch https://github.com/kushagr1501/CTIKS-IITB-UAT.git
cd CTIKS-IITB-UAT
cp env.prod.example env.prod
```

Open **`env.prod`** in the repository root. It is the only private settings file. Set:

| Name | What to enter |
| --- | --- |
| `POSTGRES_PASSWORD` | New long password using letters, numbers, `_` or `-`. Docker builds the database URL from it. |
| `BETTER_AUTH_SECRET` | New random string of at least 32 characters. |
| `BETTER_AUTH_URL` | Leave `http://localhost:3000` for a local Docker test. Before hosting, change it to the public HTTPS address, such as `https://ctiks.example.edu`. |
| `CTIKS_LOCAL_HTTP` | Leave `1` for a local Docker test. It applies only to `localhost` or `127.0.0.1`; an HTTPS address uses secure cookies regardless of this value. |
| `CTIKS_MEDIA_HOST_DIR` | Defaults to `/data/ctiks-media` on the Docker host. Change it if IITB uses another persistent storage path. |
| `CTIKS_BACKUP_HOST_DIR` | Defaults to `/data/ctiks-backups` on the Docker host. Change it if IITB uses another persistent backup path. |

Create both the media and backup host directories before starting Docker. Grant the app container user (UID 1000) read and write access to media; restrict backup-folder access to operators. Keep `env.prod` private. Git ignores it, and the Docker build excludes it. PostgreSQL and Redis use persistent Docker volumes. The website listens on `127.0.0.1:3000`; on the hosting server, configure an HTTPS reverse proxy to forward to it. PostgreSQL listens on `127.0.0.1:15432` for server maintenance only. Redis is available only inside the Docker network. When you change `BETTER_AUTH_URL`, recreate the app container so it reads the new value.

## 2. Choose the database content

For this handover, copy the existing Neon database. Before the first startup, add `SOURCE_DATABASE_URL` to **`env.prod`**. Use the **direct Neon URL**, with no `-pooler` in the hostname. Keep it private. The target is the one `ctiks` PostgreSQL container configured by Compose; do not set another target URL.

The short `bootstrap` job imports Neon only if the target database is empty. It then exits. The app waits for it and applies pending Prisma migrations before starting the website. The import includes the existing administrator account and password hash. If the import fails, the app will not start. An installation without Neon needs a separate admin provisioning plan.

## 3. Build and start

```bash
docker compose --env-file env.prod -f compose.prod.yaml build
docker compose --env-file env.prod -f compose.prod.yaml up -d
docker compose --env-file env.prod -f compose.prod.yaml ps
```

Success: `bootstrap` exits with code 0 after logging `Transfer completed`; `app`, PostgreSQL, Redis and `backup` run. Check the logs:

```bash
docker compose --env-file env.prod -f compose.prod.yaml logs --tail=30 bootstrap app
```

The app log should say migrations were applied or none are pending. Remove `SOURCE_DATABASE_URL` from `env.prod` after the import succeeds, then run `docker compose --env-file env.prod -f compose.prod.yaml up -d --force-recreate bootstrap app` so the temporary Neon credential is removed from the container. The next `bootstrap` run logs `Existing PostgreSQL data found; Neon import skipped.`

Open `http://localhost:3000` for a local Docker test, or the configured HTTPS address when hosted. Check Home, People, Research, Activities and `/login`, then sign in and make a test content edit. Check for `Backup ready` with `docker compose --env-file env.prod -f compose.prod.yaml logs --tail=30 backup`. For a startup error, check the `bootstrap` and `app` logs and the values in `env.prod`.

## 5. Files and backups

PostgreSQL stores image and PDF **paths**, not file bytes. Create the directory set by `CTIKS_MEDIA_HOST_DIR` before starting Compose, give the container user (UID 1000) read and write access, and copy existing media files into it with filenames unchanged. The app mounts this folder and serves `/api/local-media/` files from it. Test an existing image and PDF, a new upload, and a container restart. Follow [Storage and backups](PRODUCTION_HANDOVER.md).

Next: [Storage and backups](PRODUCTION_HANDOVER.md) · [Production environment](PRODUCTION_ENVIRONMENT.md)
