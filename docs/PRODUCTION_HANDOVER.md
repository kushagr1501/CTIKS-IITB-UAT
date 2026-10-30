Read this if you operate CTIKS after the Docker setup.

# Storage and backups

Start with [Production setup](PRODUCTION_SETUP.md). All commands below use the same `compose.prod.yaml` and private `env.prod` file. The `tools` service is a temporary maintenance container; it does not stay running.

## Existing images and PDFs

The database has image and PDF **paths**, not file bytes. Copy the existing `ctiks-local-media` folder separately and preserve filenames. External HTTPS links remain external. Keep the copied files in backed-up persistent storage.

**Launch limitation:** production uploads and `/api/local-media/` serving are not implemented yet. A Docker mount alone will not make existing local-media URLs or new uploads work. Implement and test production storage, upload and serving before relying on these links. Check an existing image and PDF, upload new ones, restart the app container, and check again.

## Back up the database

The backup is written to the repository's ignored `backups/` folder on the server. Create a unique filename each time:

```bash
docker compose --env-file env.prod -f compose.prod.yaml build tools
docker compose --env-file env.prod -f compose.prod.yaml run --rm tools scripts/backup-restore.mjs backup --output /backups/ctiks-YYYY-MM-DD.dump
```

Success: `Backup created`. The script refuses to overwrite a file. `backups/` is ignored by Git but still needs restricted access and an off-server copy. Back up the media folder separately. A database backup does not contain image/PDF bytes or Redis sessions.

## Test a restore

Create a separate, empty database **inside the same PostgreSQL container**:

```bash
docker compose --env-file env.prod -f compose.prod.yaml exec -T postgres createdb -U ctiks ctiks_restore_check
```

Temporarily add `RESTORE_DATABASE_NAME=ctiks_restore_check` to `env.prod`. The `tools` container will use that database while the website continues to use `ctiks`. Then run:

```bash
docker compose --env-file env.prod -f compose.prod.yaml run --rm tools scripts/backup-restore.mjs restore --file /backups/ctiks-YYYY-MM-DD.dump --apply
```

Success: `Restore completed`. Remove `RESTORE_DATABASE_NAME` from `env.prod` afterward. The restore refuses a database with tables. Check the restored records and separately restored media files. This does not replace the live database. IITB should schedule, retain and regularly test both database and file backups.

Next: [Production setup](PRODUCTION_SETUP.md) · [Production environment](PRODUCTION_ENVIRONMENT.md)
