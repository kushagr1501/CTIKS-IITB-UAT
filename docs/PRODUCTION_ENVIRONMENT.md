Read this if you need to set or change the CTIKS production values.

# The `env.prod` file

Copy `env.prod.example` to **`env.prod`** in the repository root. Edit only the copy. It is ignored by Git and excluded from Docker builds. Pass it to every production Compose command with `--env-file env.prod`.

| Setting | When needed | Meaning |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | Always | New, long URL-safe password for the one PostgreSQL container. Compose builds the app and maintenance database URLs from it. |
| `BETTER_AUTH_SECRET` | Always | New private random string, at least 32 characters. |
| `BETTER_AUTH_URL` | Always | Public HTTPS origin of the website. |
| `REDIS_NAMESPACE` | Optional | Redis key prefix; `ctiks` is the default. |
| `ADMIN_EMAIL` | Admin setup | `admin@ctiks.local`. |
| `CTIKS_MEDIA_HOST_DIR` | Always | Existing host directory for uploaded images and PDFs. Docker mounts it at `/data/ctiks-media` in the app. Back it up separately. |
| `SOURCE_DATABASE_URL` | Neon transfer only | Direct Neon source URL. Add it before transfer, remove it afterward. |
| `ADMIN_INITIAL_PASSWORD` | Admin setup only | Initial password from the private handover. Remove after provisioning. |
| `RESTORE_DATABASE_NAME` | Restore test only | Name of an empty test database, such as `ctiks_restore_check`. Remove after the test. |

The Neon **source** comes from `SOURCE_DATABASE_URL` in `env.prod`. The **target** is the `ctiks` PostgreSQL container configured in `compose.prod.yaml` from `POSTGRES_PASSWORD`. Both are accessed by the temporary `tools` container. The website uses only the target after transfer.

The Compose network keeps Redis private. The PostgreSQL host port is bound to loopback for server maintenance; it is not publicly exposed. The app's `CTIKS_INTERNAL_POSTGRES=1` setting allows its private container connection without cloud TLS. Do not set it for an external database.

Next: [Production setup](PRODUCTION_SETUP.md) · [Storage and backups](PRODUCTION_HANDOVER.md)
