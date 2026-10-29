Read this if you are working on durable data connection.

# Durable data connection

PostgreSQL stores records. A pool reuses database connections, and Prisma is the generated access layer.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                                            |
| ------------------- | --------------------------------------------------------------- |
| `client.ts`         | Shared client, TLS policy, pool settings, optional timing logs. |

## Connections and gotchas

Use the existing client. Do not create one per request. Migration-owner access differs from restricted runtime
access; never print either connection URL.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
