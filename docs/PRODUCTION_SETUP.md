Read this if you are installing CTIKS on the IITB server.

# Production setup: Docker only

CTIKS is a website for people, research, academics and activities. Administrators manage content, and core faculty edit their own profiles. One Docker Compose file runs the website, **one PostgreSQL database**, and Redis. PostgreSQL holds website data; Redis holds login sessions.

You need Git and Docker Engine with Docker Compose for a local test. Hosting the site also requires an HTTPS hostname. You do **not** need to install Node.js, PostgreSQL, Redis, `pg_dump`, or `pg_restore` on the server. Docker images provide them. The supplied database and maintenance images use PostgreSQL 17; check that the Neon source is version 17 or older before transfer.

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
| `REDIS_NAMESPACE` | Leave `ctiks` unless another CTIKS installation shares Redis. |
| `ADMIN_EMAIL` | Leave `admin@ctiks.local`. |
| `CTIKS_MEDIA_HOST_DIR` | Existing host folder for uploaded images and PDFs. The example `../ctiks-media` is beside the repository; use IITB's persistent storage path on the server. |
| `CTIKS_BACKUP_HOST_DIR` | Existing host folder for database and media backups. The example `../ctiks-backups` is beside the repository; use the server's persistent backup path. |
| `BACKUP_KEEP` | `14` keeps the latest 14 routine backups. Pre-restore safety copies are kept separately. |

Create both the media and backup host directories before starting Docker. Grant the app container user (UID 1000) read and write access to media; restrict backup-folder access to operators. Keep `env.prod` private. Git ignores it, and the Docker build excludes it. PostgreSQL and Redis use persistent Docker volumes. The website listens on `127.0.0.1:3000`; on the hosting server, configure an HTTPS reverse proxy to forward to it. PostgreSQL listens on `127.0.0.1:15432` for server maintenance only. Redis is available only inside the Docker network. When you change `BETTER_AUTH_URL`, recreate the app container so it reads the new value.

## 2. Choose the database content

### Copy the existing Neon database

First start the empty PostgreSQL container:

```bash
docker compose --env-file env.prod -f compose.prod.yaml up -d postgres
```

Success: `docker compose --env-file env.prod -f compose.prod.yaml ps` shows PostgreSQL healthy. Temporarily add `SOURCE_DATABASE_URL` to **`env.prod`**. Use the **direct Neon URL**, with no `-pooler` in the hostname. Keep it private.

The **target** is already set in `compose.prod.yaml` as `postgresql://ctiks:<POSTGRES_PASSWORD>@postgres:5432/ctiks`. It is the same PostgreSQL database the website will use. Do not set a second target database or run migrations before this full transfer.

```bash
docker compose --env-file env.prod -f compose.prod.yaml build tools
docker compose --env-file env.prod -f compose.prod.yaml run --rm tools scripts/transfer-postgres.mjs --apply
```

Success: `Transfer completed`. This copies the schema, content, website accounts and password hashes. The script refuses a target that already contains tables. Remove `SOURCE_DATABASE_URL` from `env.prod` immediately afterward. The transfer does **not** copy image/PDF files, Redis sessions or PostgreSQL server roles. See [Storage and backups](PRODUCTION_HANDOVER.md).

If you want a new empty website instead, skip this transfer. Step 3 creates the tables.

## 3. Build, migrate and set the admin password

```bash
docker compose --env-file env.prod -f compose.prod.yaml build app
docker compose --env-file env.prod -f compose.prod.yaml run --rm app npm run db:migrate
```

Success: the image builds and Prisma applies migrations or says none are pending. If Neon was transferred, this applies only migrations newer than the source data.

Temporarily add `ADMIN_INITIAL_PASSWORD` to **`env.prod`** using the password in the private handover. Then run:

```bash
docker compose --env-file env.prod -f compose.prod.yaml run --rm app npm run admin:provision
```

Success: `Administrator credential provisioned`. This creates `admin@ctiks.local` on an empty database or sets its password after a Neon transfer. It refuses a different existing administrator. Remove `ADMIN_INITIAL_PASSWORD` from `env.prod` immediately. Change the password after first sign-in.

## 4. Start and verify the site

```bash
docker compose --env-file env.prod -f compose.prod.yaml up -d
docker compose --env-file env.prod -f compose.prod.yaml ps
```

Success: the website, PostgreSQL, Redis and backup service show as running. Open `http://localhost:3000` for a local Docker test, or the configured HTTPS address when hosted. Check Home, People, Research, Activities and `/login`, then sign in and make a test content edit. Check for `Backup ready` with `docker compose --env-file env.prod -f compose.prod.yaml logs --tail=30 backup`. For a startup error, check `docker compose --env-file env.prod -f compose.prod.yaml logs --tail=50 app` and the values in `env.prod`.

## 5. Files and backups

PostgreSQL stores image and PDF **paths**, not file bytes. Create the directory set by `CTIKS_MEDIA_HOST_DIR` before starting Compose, give the container user (UID 1000) read and write access, and copy existing media files into it with filenames unchanged. The app mounts this folder and serves `/api/local-media/` files from it. Test an existing image and PDF, a new upload, and a container restart. Follow [Storage and backups](PRODUCTION_HANDOVER.md).

Next: [Storage and backups](PRODUCTION_HANDOVER.md) · [Production environment](PRODUCTION_ENVIRONMENT.md)
