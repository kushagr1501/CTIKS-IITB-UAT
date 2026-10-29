Read this if you are opening this repository for the first time.

# CTIKS website

This is the website for the Centre for Traditional Indian Knowledge and Skills (CTIKS), IIT Bombay. It
includes public pages, an administrator portal for managing content, and a faculty portal for editing
individual profiles.

## What runs here?

| Tool                   | Meaning and role                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Next.js and React      | Next.js maps web addresses to pages. React builds the interface from reusable components. |
| Node.js and TypeScript | Node runs server JavaScript. TypeScript checks value shapes before the app runs.          |
| PostgreSQL and Prisma  | PostgreSQL stores durable records. Prisma generates code to read and write them.          |
| Redis                  | Stores temporary login sessions and request limits. Protected operations require it.      |
| Zod                    | Checks actual incoming values while the application runs.                                 |

More terms are defined in the [glossary](docs/GLOSSARY.md).

## Quickstart

Use PowerShell, the Windows command shell. Install the prerequisites in
[Getting started](docs/GETTING_STARTED.md) first. Replace `REPOSITORY_LOCATION` with the URL or local path
your mentor provides. Use the reviewed version; unpublished changes may not exist on GitHub yet.

```powershell
$repoSource = 'REPOSITORY_LOCATION'
git clone $repoSource ctiks-web
Set-Location ctiks-web
npm ci
Copy-Item .env.example .env.local
node --input-type=module -e "import{readFileSync,writeFileSync}from'node:fs';import{randomBytes}from'node:crypto';const p='.env.local';writeFileSync(p,readFileSync(p,'utf8').replace('generate-a-random-secret-with-at-least-32-characters',randomBytes(32).toString('hex')));console.log('Local auth secret created.');"
npm run redis:setup
npm run db:local:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Expected signals: npm finishes, Redis setup confirms credentials, Docker starts two services, Prisma reports a
generated client and applied migrations, and seed reports the administrator credential file. The app prints
`Ready` and eventually `Main pages ready`.

Open **http://127.0.0.1:3000**. Open the generated `.private/admin-credentials.txt` locally, then sign in at
`/login`. Never paste that password into a commit, issue, screenshot, or chat.

The example environment uses loopback addresses: services on this computer. The migration and seed commands
read the configured database URLs. Keep the walkthrough on local settings. If service ports are occupied, use
the [alternate-port recipe](docs/GETTING_STARTED.md#when-the-default-service-ports-are-busy) before starting
Docker.

## Check a change

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Success means exit code zero. Tests print a passing summary. The build prints a route list. Six existing
local-media tracing warnings are described in the [Phase 2 report](docs/testing/phase-2-cleanup.md). See
[Testing](docs/TESTING.md) for one canonical full-suite command. Run type checking after integration finishes
because integration regenerates files it reads.

## Where to go next

- [Getting started](docs/GETTING_STARTED.md): setup and troubleshooting.
- [First change](docs/FIRST_CHANGE.md): a guided small UI change.
- [Codebase map](docs/CODEBASE_MAP.md): which files to open.
- [Architecture](docs/ARCHITECTURE.md): how requests reach the database.
- [Contributing](docs/CONTRIBUTING.md): branches, review, and code conventions.
- [Environment](docs/ENVIRONMENT.md): settings and safe examples.
- [Testing](docs/TESTING.md): checks and their limits.
- [Activities](docs/activities.md): dates, filters, images, and PDFs.

Next: [follow the first-day walkthrough](docs/GETTING_STARTED.md).
