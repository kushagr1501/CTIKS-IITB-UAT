Read this if you are installing CTIKS on the IITB server.

# Production setup: Docker only

CTIKS is a website for people, research, academics and activities. Administrators manage content, and core faculty edit their own profiles. One Docker Compose file runs the website, **one PostgreSQL database**, and Redis. PostgreSQL holds website data; Redis holds login sessions.

You need Git, Docker Engine with Docker Compose, and an HTTPS hostname. You do **not** need to install Node.js, PostgreSQL, Redis, `pg_dump`, or `pg_restore` on the server. Docker images provide them. The supplied database and maintenance images use PostgreSQL 17; check that the Neon source is version 17 or older before transfer.

## 1. Get the repository

```bash
git clone https://github.com/kushagr1501/CTIKS-IITB-UAT.git
cd CTIKS-IITB-UAT
cp env.prod.example env.prod
```

Open **`env.prod`** in the repository root. It is the only private settings file. Set:

| Name | What to enter |
| --- | --- |
| `POSTGRES_PASSWORD` | New long password using letters, numbers, `_` or `-`. Docker builds the database URL from it. |
| `BETTER_AUTH_SECRET` | New random string of at least 32 characters. |
| `BETTER_AUTH_URL` | Final public HTTPS address, such as `https://ctiks.example.edu`. |
| `REDIS_NAMESPACE` | Leave `ctiks` unless another CTIKS installation shares Redis. |
| `ADMIN_EMAIL` | Leave `admin@ctiks.local`. |

Keep `env.prod` private. Git ignores it, and the Docker build excludes it. PostgreSQL and Redis use persistent Docker volumes. The website listens on `127.0.0.1:3000`; configure IITB's HTTPS reverse proxy to forward to it. PostgreSQL listens on `127.0.0.1:15432` for server maintenance only. Redis is available only inside the Docker network.

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

Success: the website, PostgreSQL and Redis show as running. Open the HTTPS site. Check Home, People, Research, Activities and `/login`, then sign in and make a test content edit. For a startup error, check `docker compose --env-file env.prod -f compose.prod.yaml logs --tail=50 app` and the values in `env.prod`.

## 5. Files and backups

PostgreSQL stores image and PDF **paths**, not file bytes. Copy the existing media folder separately and preserve filenames. Current upload and `/api/local-media/` routes are development only; production upload and serving support still needs implementation and testing. A storage mount alone does not enable those routes. Follow [Storage and backups](PRODUCTION_HANDOVER.md).

Next: [Storage and backups](PRODUCTION_HANDOVER.md) · [Production environment](PRODUCTION_ENVIRONMENT.md)
