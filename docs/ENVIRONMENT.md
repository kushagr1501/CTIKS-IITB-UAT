Read this if setup fails or you need to understand a machine-specific setting.

# Environment reference

An environment variable is a string setting outside source code. A secret is a sensitive value, such as a
password. The tables cover every setting explicitly read or assigned by the tracked application,
configuration, and scripts. Tools also have their own inherited settings; this is not a reference for all Node
or OS variables.

## Files and precedence

- A fresh developer copies `.env.example` to the ignored `.env.local` file.
- Next.js loads environment settings for the app. Values already supplied by the process take precedence over
  file defaults.
- `prisma.config.ts` and `scripts/database.ts` use dotenv, an environment-file reader, in this order:
  `.env.migrations.local`, `.env.local`, `.env`. Existing process variables are retained. Earlier files win
  over later files.
- The integration runner reads `.env.migrations.local`, then `.env.local`.
- `.env.uat.local` is not an automatic application configuration file. The dedicated UAT test wrapper reads it
  explicitly. A new intern should not copy it.
- Duplicate assignments in a single dotenv file use the last value. Redis setup appends the generated URL
  after the empty placeholder.

`DATABASE_URL` is the runtime database connection. `DIRECT_URL` is the connection for migration/provisioning
tasks, often with more privileges. These are deliberately separate so the running website does not need
permission to change database structure.

## Application and authentication

All examples below are placeholders or deliberately local-only values, not live credentials.

| Name                 | Type                                                 | Default                 | Required?                     | Purpose and safe example                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------- | ----------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL URL string                                | None                    | Yes for database reads/writes | Runtime connection. Local example: `postgresql://ctiks_dev:ctiks_dev_local_only@127.0.0.1:15432/ctiks_dev?schema=public`. `schema` selects the PostgreSQL namespace. Non-loopback hosts use verified TLS. |
| `REDIS_URL`          | `redis://` or `rediss://` URL string                 | None                    | Yes for protected operations  | Session and rate-limit connection. Generate with Redis setup; safe shape: `redis://:GENERATED_PASSWORD@127.0.0.1:16379`. `rediss` uses TLS.                                                               |
| `REDIS_NAMESPACE`    | String, letters/digits/underscore/hyphen, 1–80 chars | `ctiks`                 | Optional                      | Prefix separating keys. Example: `ctiks-dev-alex`. The setup helper writes `ctiks`; integration replaces it with a random test namespace.                                                                 |
| `BETTER_AUTH_SECRET` | String, minimum 32 chars                             | None                    | Yes for authentication        | Signs authentication data. Generate a fresh value using Getting started; example description: `GENERATE_64_RANDOM_HEX_CHARACTERS`. Do not reuse the template placeholder.                                 |
| `BETTER_AUTH_URL`    | Absolute URL string                                  | None                    | Yes for authentication        | Browser origin: scheme, host, and port. Local example: `http://127.0.0.1:3000`. Production requires HTTPS.                                                                                                |
| `NODE_ENV`           | Mode string                                          | Set by Next.js commands | Tool-managed                  | Development commands use `development`; production build/start use `production`. Development media routes are unavailable in production. Do not fake this to enable uploads.                              |

## Setup, tests, and development

| Name                     | Type                            | Default                                                      | Required?                                                                | Purpose and safe example                                                                                                                        |
| ------------------------ | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `DIRECT_URL`             | PostgreSQL URL string           | Prisma/setup helpers fall back to `DATABASE_URL` when absent | Required by integration and maintenance scripts that explicitly check it | Migration-owner connection. Local example uses the same local URL as above. Omit it rather than setting an empty string if you intend fallback. |
| `ADMIN_EMAIL`            | Email string                    | `admin@ctiks.local`                                          | Optional for seed                                                        | Initial administrator email. Existing administrators are preserved. Example: `admin@example.org`.                                               |
| `ADMIN_CREDENTIALS_FILE` | Path string                     | `.private/admin-credentials.txt`                             | Optional for seed                                                        | Destination for newly generated credentials. The local seed wrapper overrides it with `.private/local-admin-credentials.txt`.                   |
| `CTIKS_LOCAL_MEDIA_DIR`  | Filesystem path string          | `ctiks-local-media` beside the project directory             | Optional                                                                 | Development upload storage outside the project. Example: `C:/ctiks-dev-media`. Setting it does not enable production uploads.                   |
| `CTIKS_DB_QUERY_TIMING`  | String flag                     | Off unless exactly `1`                                       | Optional                                                                 | Logs table names and query durations, without submitted parameters. The UAT test wrapper enables it.                                            |
| `CTIKS_DEV_WARMUP`       | String flag                     | On unless exactly `0`                                        | Optional                                                                 | Background compilation of main public pages. `0` skips warm-up for a focused UI task.                                                           |
| `PORT`                   | Integer represented as a string | `3000`                                                       | Optional                                                                 | Development server port unless overridden by `--port` or `-p`. The integration runner uses fixed port 3002 independently. Example: `3100`.      |
| `CTIKS_TEST_DIST_DIR`    | Directory string                | `.next`                                                      | Optional, harness-managed                                                | Next.js output directory. Integration sets `.next-integration` so test output is separate from normal development.                              |

The `db:local:migrate` and `db:local:seed` wrappers force the original local database URL regardless of these
configured URLs. Generic `db:migrate` and `db:seed` follow configuration, which is why the walkthrough uses
them for alternate ports.

## Docker settings used by the optional walkthrough

These configure Docker Compose, not the application.

| Name                   | Type             | Default here                         | Required? | Example and purpose                                                                                 |
| ---------------------- | ---------------- | ------------------------------------ | --------- | --------------------------------------------------------------------------------------------------- |
| `COMPOSE_PROJECT_NAME` | String           | `ctiks-web` from `compose.yaml`      | Optional  | `ctiks-intern` creates separately named containers and volumes.                                     |
| `COMPOSE_FILE`         | Path list string | `compose.yaml` discovered by Compose | Optional  | The alternate-port recipe combines it with `.private/ports.yaml`, using the OS path-list separator. |

The Compose file itself sets `POSTGRES_DB=ctiks_dev`, `POSTGRES_USER=ctiks_dev`, and
`POSTGRES_PASSWORD=ctiks_dev_local_only` inside the local PostgreSQL container. Those are development
defaults, not application environment keys to reuse in production. Redis reads its generated password from the
ignored `.private/redis-credentials.conf`.

## Scope limits

No SMTP host/password keys are implemented. There is no OAuth login configuration. IITB VPN/network
restrictions are not an application setting yet. Production storage, service credentials, backups, and network
policies need owner confirmation. Keep real credentials in the deployment environment or ignored local files.

Next: [Getting started](GETTING_STARTED.md), [Testing](TESTING.md), and [backend boundaries](backend.md).
