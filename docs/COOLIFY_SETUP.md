Read this if you are installing the `prod` branch through Coolify.

# Coolify setup

Coolify runs four long-lived services: `app`, `postgres`, `redis`, and `backup`. A short `bootstrap` job checks the database before the app starts. It imports Neon only when the target is empty, then exits. The app applies pending migrations on startup.

1. Connect the private repository and select branch `prod`. Choose **Docker Compose** as the build strategy and set the Compose file path to `/compose.prod.yaml`.
2. Create two persistent folders on the Docker host: one for media and one for backups. The app needs read/write access to the media folder as UID 1000. Record both absolute host paths.
3. In **Environment Variables → Production**, set `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CTIKS_MEDIA_HOST_DIR`, `CTIKS_BACKUP_HOST_DIR`, and `SOURCE_DATABASE_URL` **before the first deployment**. Use Neon's **direct** URL for `SOURCE_DATABASE_URL`, with literal `&` characters. Use the exact public HTTPS origin for `BETTER_AUTH_URL`. For a test opened only at `http://localhost:3000`, set that URL and `CTIKS_LOCAL_HTTP=1` instead. Do not set `ADMIN_EMAIL` or `ADMIN_INITIAL_PASSWORD` when importing Neon.
4. Deploy. Wait for the `bootstrap` job to log `Transfer completed`, then exit successfully. The app logs should show that Prisma applied pending migrations or found none. If the import fails, the app does not start; check the `bootstrap` logs and correct the source connection before redeploying.
5. Remove `SOURCE_DATABASE_URL` from Coolify and redeploy. The existing target now makes `bootstrap` skip the import. The transfer includes the administrator account and password hash.
6. Copy existing uploaded images and PDFs to the media host folder with their filenames unchanged. Check an existing image and PDF on the website. Then, in the `backup` container terminal, run `node scripts/backup-manager.mjs run` and wait for `Backup ready`.
7. Check Home, People, Activities, and Login. Sign in with the imported administrator account. The PostgreSQL and Redis volumes survive normal redeploys; deleting the Coolify resource can remove them.

Only the values in step 3 need manual entry. There are no database import or migration commands to run in the Coolify terminal. The `DATABASE_URL`, `TARGET_DATABASE_URL`, and Redis URL shown in Coolify come from Compose. Coolify may show the same settings again under Preview deployments; that is not a second production setup.

Next: [Production setup](PRODUCTION_SETUP.md) · [Storage and backups](PRODUCTION_HANDOVER.md)
