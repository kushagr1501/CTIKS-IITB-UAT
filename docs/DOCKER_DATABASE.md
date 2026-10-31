Read this if you need to locate the CTIKS production Docker and database files.

# Production files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Builds the website with Node.js 22.23.4. |
| `Dockerfile.tools` | Builds the Node.js and PostgreSQL 18 client image for transfers, daily backups and restore checks. |
| `compose.prod.yaml` | Starts the website, one PostgreSQL database, Redis and daily backups; runs maintenance commands. |
| `env.prod.example` | Template for the one private `env.prod` settings file. |
| `prisma/schema.prisma` | Current database models. |
| `prisma/migrations/` | Ordered schema changes applied after transfer or on a new database. |
| `scripts/transfer-postgres.mjs` | Copies Neon into the empty `ctiks` database. |
| `scripts/backup-restore.mjs` | Database dump and restore used by the backup manager. |
| `scripts/backup-manager.mjs` | Daily database and media backups, listing, optional restore checks, and selected-ID live restore. |

All server commands and success signals are in [Production setup](PRODUCTION_SETUP.md). The existing `compose.yaml` and `.env.example` are for developer work and are not part of the IITB handover.

Next: [Production setup](PRODUCTION_SETUP.md) · [Production environment](PRODUCTION_ENVIRONMENT.md)
