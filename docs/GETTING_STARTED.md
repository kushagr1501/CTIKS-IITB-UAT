Read this if you want to run the application on your development machine.

# Your first day

Commands use PowerShell. A repository is the folder Git tracks. A clone is your own copy. Ask your mentor for
the reviewed repository location and source version. Definitions for unfamiliar tools are in the
[glossary](GLOSSARY.md).

## 1. Install the tools

| Tool                       | Version guidance                                                                                          | Why                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Node.js and npm            | Prisma accepts Node 20.19.x, 22.12.x or later within 22, or 24+. Tested with Node 26.12.1 and npm 11.4.1. | Node runs server JavaScript. npm installs packages and runs project commands. |
| Git                        | Tested with 2.45.2.windows.1.                                                                             | Tracks and copies source changes.                                             |
| Docker Desktop and Compose | Tested with Docker 29.1.3 and Compose 5.0.1. Start Docker Desktop first.                                  | Runs PostgreSQL and Redis as isolated service processes called containers.    |
| Playwright Chromium        | Install using [Testing](TESTING.md).                                                                      | Browser used by automated tests; not needed just to view the site.            |

```powershell
node --version
npm --version
git --version
docker --version
docker compose version
```

Success: each prints a version. Installing the operating system and these tools was not tested on a new
Windows installation. The clean-clone check used the installed tools listed above.

## 2. Clone and install

Replace `REPOSITORY_LOCATION` with your mentor's URL or local repository path. The published URL is
`https://github.com/kushagr1501/CTIKS-IITB-UAT.git`. It may be behind local work. A commit is a saved source
version; use the version your mentor reviewed, rather than guessing from the newest folder.

```powershell
$repoSource = 'REPOSITORY_LOCATION'
git clone $repoSource ctiks-web
Set-Location ctiks-web
npm ci
```

Success: Git creates the folder and npm exits without error. `npm ci` installs the versions recorded in
`package-lock.json`, the dependency lock file.

## 3. Create local settings

```powershell
Copy-Item .env.example .env.local
node --input-type=module -e "import{readFileSync,writeFileSync}from'node:fs';import{randomBytes}from'node:crypto';const p='.env.local';writeFileSync(p,readFileSync(p,'utf8').replace('generate-a-random-secret-with-at-least-32-characters',randomBytes(32).toString('hex')));console.log('Local auth secret created.');"
npm run redis:setup
```

Success: `Local auth secret created.` and `Local Redis credentials configured. Secrets omitted from logs.` The
secret signs authentication data. Redis setup creates a password file under `.private` and adds its URL to
`.env.local`. These files are ignored by Git. Do not overwrite an existing environment file or copy production
settings. [Environment](ENVIRONMENT.md) explains the values.

## 4. Start the services

Defaults are port 15432 for PostgreSQL and 16379 for Redis. A port is the number used to connect to a service.
If they are occupied, follow the recipe below first.

```powershell
npm run db:local:up
docker compose ps
```

Success: both services show `Up`, then `healthy`. Wait and run the second command again if needed. Docker
volumes retain their data across restarts. The Redis health check confirms password enforcement; signing in
later checks actual access.

### When the default service ports are busy

This optional recipe creates separate container names and storage volumes. It was used for clean-clone
verification so existing developer services could keep running. The `!override` syntax was tested with Compose
5.0.1. Ask your mentor if your Compose version rejects it.

Run this after step 3, then continue with step 4 in the same terminal:

```powershell
@'
services:
  postgres:
    ports: !override
      - '127.0.0.1:15433:5432'
  redis:
    ports: !override
      - '127.0.0.1:16380:6379'
'@ | Set-Content -Encoding utf8 .private/ports.yaml
$env:COMPOSE_PROJECT_NAME = 'ctiks-intern'
$env:COMPOSE_FILE = 'compose.yaml' + [IO.Path]::PathSeparator + '.private/ports.yaml'
node --input-type=module -e "import{readFileSync,writeFileSync}from'node:fs';const p='.env.local';writeFileSync(p,readFileSync(p,'utf8').replaceAll(':15432/',':15433/').replaceAll(':16379',':16380'));console.log('Alternate service ports configured.');"
```

Success: `Alternate service ports configured.` These `COMPOSE_` values affect Docker only. If these ports are
also occupied, ask before stopping someone else's services.

## 5. Prepare the database

Keep the local URLs created above. A migration is a versioned SQL change to the database. A seed creates
initial records so you have something to use.

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

Expected signals:

- Generate: `Generated Prisma Client`, the generated database code.
- Migrate: migrations applied, or `No pending migrations to apply` on later runs.
- Seed: credentials saved to `.private/admin-credentials.txt` on a fresh database. An existing administrator
  is preserved rather than given a new password.

These commands respect your environment URLs. The `db:local:migrate` and `db:local:seed` wrappers always force
the original port 15432 and database name. Do not use those wrappers with the alternate-port recipe.

## 6. Start and sign in

```powershell
npm run dev
```

Success: `Ready`, then `Main pages ready`. Warm-up compiles public pages in advance; the first run can take
longer.

Open **http://127.0.0.1:3000**. Check the homepage and `/people`. Open `.private/admin-credentials.txt` in
your editor, then sign in at `/login`. You should reach `/admin` and be able to open People directory and
Activities. Faculty logins are created through the People directory; seed does not generate passwords for
every teacher. Do not share the credential file.

Stop this terminal's web server with Ctrl+C. Service containers keep running. See [Testing](TESTING.md) for
checks and how to stop services without removing data.

## Troubleshooting

| Symptom                                             | Check and reason                                                                                                                                                     |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL connection refused                       | Start Docker Desktop and use step 4. Match `.env.local` to the selected port.                                                                                        |
| Redis error or `NOAUTH`                             | Run Redis setup before starting containers. A reused container may use another checkout's password. Use an isolated project rather than rotating shared credentials. |
| `Backend environment is incomplete`                 | Check [required settings](ENVIRONMENT.md). Redis URL must not be empty. Auth secret needs at least 32 characters. Restart after changes.                             |
| `EADDRINUSE`                                        | A port is occupied. Use [development server options](TESTING.md#development-server-options) or the service-port recipe above. Ask before stopping an existing app.   |
| Generated Prisma client missing                     | Repeat step 5's generate command. Generated code is deliberately absent from Git.                                                                                    |
| Broken PowerShell npm launcher                      | Substitute `npm.cmd` for `npm` in the same command.                                                                                                                  |
| Type checking cannot find `.next-integration` files | Wait until integration finishes, then check again. Do not run these concurrently.                                                                                    |
| Login fails after URL changes                       | Browser hostname and port must match `BETTER_AUTH_URL`. See [Environment](ENVIRONMENT.md).                                                                           |
| Seed creates no new credential file                 | You reached an already seeded database. Ask for access; do not reset another person's account.                                                                       |

Next: [make your first change](FIRST_CHANGE.md), then read [the codebase map](CODEBASE_MAP.md).
