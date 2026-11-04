Read this if you are installing the `prod` branch through Coolify.

# Coolify setup

Coolify runs the same four services as Docker Compose: `app`, `postgres`, `redis`, and `backup`. The `backup` image also runs the one-time Neon import. There is no separate `tools` container to configure.

1. Connect the private repository and select branch `prod`. Choose **Docker Compose** as the build strategy and set the Compose file path to `/compose.prod.yaml`.
2. Create two persistent folders on the Docker host: one for media and one for backups. The app needs read/write access to the media folder as UID 1000. Record both absolute host paths.
3. In **Environment Variables → Production**, set `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CTIKS_MEDIA_HOST_DIR`, and `CTIKS_BACKUP_HOST_DIR`. Use the exact public HTTPS origin for `BETTER_AUTH_URL`. For a test opened only at `http://localhost:3000`, set that URL and `CTIKS_LOCAL_HTTP=1` instead. Do not set `ADMIN_EMAIL` or `ADMIN_INITIAL_PASSWORD` when importing Neon.
4. Deploy. The app may show an error until its empty database receives the Neon data. The backup container waits for the import before making its first backup. Open its **Terminal** after PostgreSQL is healthy.
5. Temporarily add `SOURCE_DATABASE_URL` to the Production variables. Use Neon's **direct** database URL, not the pooler URL. Paste it on one line with literal `&` characters, save, and redeploy so the backup container receives it. In that container's terminal, run:

   ```bash
   node scripts/transfer-postgres.mjs --apply
   ```

   Wait for `Transfer completed`. The target must be empty. Then remove `SOURCE_DATABASE_URL` from Coolify and redeploy. The transfer includes the existing administrator account and password hash.
6. Open the **Terminal** for the `app` container and run `npm run db:migrate`. Wait for `All migrations have been successfully applied` or `No pending migrations to apply`.
7. Copy existing uploaded images and PDFs to the media host folder with their filenames unchanged. Check an existing image and PDF on the website. Then, in the `backup` container terminal, run `node scripts/backup-manager.mjs run` and wait for `Backup ready`.
8. Check Home, People, Activities, and Login. Sign in with the imported administrator account. The PostgreSQL and Redis volumes survive normal redeploys; deleting the Coolify resource can remove them.

Only the values in step 3 and the temporary Neon URL need manual entry. The `DATABASE_URL`, `TARGET_DATABASE_URL`, and Redis URL shown in Coolify come from Compose. Coolify may show the same settings again under Preview deployments; that is not a second production setup.

Next: [Production setup](PRODUCTION_SETUP.md) · [Storage and backups](PRODUCTION_HANDOVER.md)
