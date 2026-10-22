const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

export function trustedOriginsFor(applicationUrl: string, production: boolean) {
  const configured = new URL(applicationUrl);
  const origins = new Set([configured.origin]);

  if (!production && configured.protocol === 'http:' && LOCAL_HOSTS.has(configured.hostname)) {
    const port = configured.port ? `:${configured.port}` : '';
    origins.add(`http://127.0.0.1${port}`);
    origins.add(`http://localhost${port}`);
  }

  return [...origins];
}
