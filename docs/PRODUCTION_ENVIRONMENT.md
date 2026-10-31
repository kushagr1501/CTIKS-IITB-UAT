Read this if you need to set or change the CTIKS production values.

# The `env.prod` file

Copy `env.prod.example` to **`env.prod`** in the repository root. Edit only the copy. It is ignored by Git and excluded from Docker builds. Pass it to every production Compose command with `--env-file env.prod`.

| Setting | When needed | Meaning |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Always | New, long URL-safe password for the one PostgreSQL container. Compose builds the app and maintenance database URLs from it. |
| `BETTER_AUTH_SECRET` | Always | New private random string, at least 32 characters. |
| `BETTER_AUTH_URL` | Always | `http://localhost:3000` for a Docker test on the same computer. Set this to the public HTTPS origin when hosting the site. The browser address must match it. |
| `CTIKS_LOCAL_HTTP` | Local Docker test only | Leave `1` for a loopback HTTP test. It cannot enable HTTP for a public hostname; with an HTTPS URL it has no effect. |
| `REDIS_NAMESPACE` | Optional | Redis key prefix; `ctiks` is the default. |
| `ADMIN_EMAIL` | Admin setup | `admin@ctiks.local`. |
| `CTIKS_MEDIA_HOST_DIR` | Always | Existing host directory for uploaded images and PDFs. Docker mounts it at `/data/ctiks-media`; the daily backup service copies it with the database dump. Keep an off-server copy too. |
| `CTIKS_BACKUP_HOST_DIR` | Always | Existing host directory for backup sets. Example: `../ctiks-backups` beside the repository, or an absolute persistent path on the server. |
| `BACKUP_KEEP` | Optional | Number of routine backup sets to keep in that folder. `14` keeps the latest 14; pre-restore safety copies are retained separately. |
| `SOURCE_DATABASE_URL` | Neon transfer only | Direct Neon source URL. Add it before transfer, remove it afterward. |
| `ADMIN_INITIAL_PASSWORD` | Admin setup only | Initial password from the private handover. Remove after provisioning. |
| `RESTORE_DATABASE_NAME` | Manual maintenance only | Overrides the database selected by the `tools` container. The optional `restore-test` command creates its own test database and does not need this setting. Leave it out of normal `env.prod`. |

The Neon **source** comes from `SOURCE_DATABASE_URL` in `env.prod`. The **target** is the `ctiks` PostgreSQL container configured in `compose.prod.yaml` from `POSTGRES_PASSWORD`. Both are accessed by the temporary `tools` container. The website uses only the target after transfer.

The Compose network keeps Redis private. The PostgreSQL host port is bound to loopback for server maintenance; it is not publicly exposed. The app's `CTIKS_INTERNAL_POSTGRES=1` setting allows its private container connection without cloud TLS. Do not set it for an external database.

Next: [Production setup](PRODUCTION_SETUP.md) · [Storage and backups](PRODUCTION_HANDOVER.md)
