Read this if you operate CTIKS after the Docker setup.

# Storage and backups

Start with [Production setup](PRODUCTION_SETUP.md). All commands below use the same `compose.prod.yaml` and private `env.prod` file. The `backup` image also runs one-time maintenance commands.

## Existing images and PDFs

The database has image and PDF **paths**, not file bytes. Compose uses `/data/ctiks-media` on the Docker host by default. Create that directory before starting Compose, or set `CTIKS_MEDIA_HOST_DIR` in `env.prod` to another existing persistent host directory. The app container runs as UID 1000, so grant that user read and write access without making the folder globally writable. Copy existing `ctiks-local-media` files into this directory, preserving filenames; external HTTPS links remain external. Check an existing image and PDF and a new upload before launch.

## Daily backups

When Docker starts, the `backup` container saves the database and uploaded files once. It then saves them every 24 hours. If a backup fails, it tries again after one hour. Login sessions in Redis are not included.

By default the copies live in `/data/ctiks-backups` on the Docker host. To use a different location, set this in `env.prod`:

```env
CTIKS_BACKUP_HOST_DIR=/mnt/iitb-storage/ctiks-backups
```

`CTIKS_BACKUP_HOST_DIR` is the folder **on the Docker host**, just like `CTIKS_MEDIA_HOST_DIR`. Create the folder before starting Docker. If you change this path later, copy the existing backup sets to the new folder first.

The backup container keeps the latest **14 routine backup sets**. After a 15th succeeds, the oldest routine set is removed. Pre-restore safety copies are kept separately. An operator can change the `BACKUP_KEEP` value in `compose.prod.yaml` if a different limit is needed. Each set contains `database.dump`, `media/` (images and PDFs), and `manifest.json` (a file used to check the backup).

Check that the first backup succeeded:

```bash
docker compose --env-file env.prod -f compose.prod.yaml logs --tail=30 backup
docker compose --env-file env.prod -f compose.prod.yaml run --rm backup scripts/backup-manager.mjs list
```

Success: the log says `Backup ready`, and `list` shows a backup ID such as `ctiks-20261031T120000Z-1a2b3c4d`. To make an extra backup now:

```bash
docker compose --env-file env.prod -f compose.prod.yaml run --rm backup scripts/backup-manager.mjs run
```

Keep the folder set by `CTIKS_BACKUP_HOST_DIR` private and copy completed sets to protected storage **off this server**. Keeping 14 local sets is not a substitute for an off-server copy. The database and media are copied one after another; edits made during a backup may not be perfectly synchronized, so test restores regularly.

## Restore a chosen backup to the live site

Each backup ID represents one saved database and media set. Restoring an older ID replaces the current website content with that saved version. Schedule downtime and run these commands from the repository folder:

1. List the backups and copy the ID you want:

```bash
docker compose --env-file env.prod -f compose.prod.yaml run --rm backup scripts/backup-manager.mjs list
```

2. Stop the website and automatic backups:

```bash
docker compose --env-file env.prod -f compose.prod.yaml stop app backup
```

3. Replace `BACKUP_ID` with the chosen ID. This checks the backup, saves the current state as a protected safety copy, then restores its database **and** uploaded files:

```bash
docker compose --env-file env.prod -f compose.prod.yaml run --rm backup scripts/backup-manager.mjs restore-live BACKUP_ID --apply
```

4. **Only after** `Live restore completed`, apply any database migrations added since that backup:

```bash
docker compose --env-file env.prod -f compose.prod.yaml run --rm app npm run db:migrate
```

5. Restart and check the website:

```bash
docker compose --env-file env.prod -f compose.prod.yaml up -d app backup
```

If step 3 fails, keep the site stopped and investigate. The command attempts to put the original data back; it prints the safety backup ID for recovery. Safety copies are not removed by `BACKUP_KEEP`; review and remove them manually when no longer needed. Redis login sessions are not restored.

An optional `restore-test BACKUP_ID` checks a backup in a temporary database without changing the live site.

Next: [Production setup](PRODUCTION_SETUP.md) · [Production environment](PRODUCTION_ENVIRONMENT.md)
