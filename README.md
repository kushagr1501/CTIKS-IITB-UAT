# CTIKS IIT Bombay — UAT

Website and administration portal for the Centre for Traditional Indian Knowledge
and Skills, IIT Bombay. Built with Next.js 16, React 19, TypeScript, Tailwind CSS,
Prisma/PostgreSQL, Better Auth, and Redis.

## Local setup

Use Node.js 22.12+ and Docker Desktop (or an existing Redis service).

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`. Configure PostgreSQL runtime and migration
   connections, a random authentication secret, the site URL, and the admin email.
3. Run `npm run redis:setup` and `npm run redis:up`, or configure your own Redis URL.
4. Run `npm run db:generate` and `npm run db:migrate` against the intended database.
5. For a fresh deployment, follow [backend setup](docs/backend.md) to seed the
   initial administrator/faculty records and provision the restricted database role.
6. Run `npm run dev` and open http://127.0.0.1:3000.

The dev and build commands generate the Prisma client automatically. Generated
administrator credentials are stored locally in `.private/admin-credentials.txt`.
Environment files, credentials, generated clients, build output, and temporary
previews are excluded from Git. Only `.env.example` belongs in the repository.

## Project structure

- `src/app/` — public pages, administration/faculty portals, and API routes.
- `src/features/` — feature components, content, forms, and presentation helpers.
- `src/components/` — shared layout and UI components.
- `src/server/` — authentication, database access, validation, permissions, and auditing.
- `prisma/` — database schema and versioned migrations.
- `public/assets/` — local website images and design assets.
- `scripts/` — database/Redis setup and isolated integration checks.
- `tests/` — unit tests.
- `docs/` — architecture, backend operation, and Activities CMS documentation.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run test:integration` additionally requires PostgreSQL migration-owner access
and Redis. It creates and removes a random test schema and Redis namespace; see
[backend setup](docs/backend.md). It does not seed activities into the application's
live schema.

## Production

Configure the deployment's environment and persistent services, apply migrations
with `npm run db:migrate`, then run `npm run build` and `npm start`. Hosting,
backups, HTTPS, and institute SMTP/storage provisioning are deployment concerns.
Pushing this repository does not deploy the site or copy database contents.

See [architecture](docs/architecture.md) and [Activities CMS](docs/activities.md).
