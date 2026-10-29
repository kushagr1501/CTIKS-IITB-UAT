Read this if you are working on server operations.

# Server operations

Services carry out operations. Zod validates actual inputs, and Prisma provides generated database operations.

Tool terms: [glossary](../../docs/GLOSSARY.md).

## Open these first

| Path in this folder          | Role                                              |
| ---------------------------- | ------------------------------------------------- |
| `http/authorized-handler.ts` | Protected HTTP request guard.                     |
| `http/errors.ts`             | Safe shared error responses.                      |
| `auth`                       | Identity, sessions, permissions, and CSRF checks. |
| `faculty`                    | Directory writes and own-profile revisions.       |
| `activities`                 | Activity writes and public filtering.             |
| `research`                   | Research card persistence.                        |
| `audit`                      | Retained action history and export.               |
| `database/client.ts`         | Shared PostgreSQL connection client.              |
| `redis/client.ts`            | Temporary-session store connection.               |

## Connections and gotchas

Treat authentication, transactions, and audit writes as reviewed boundaries. server-only prevents accidental
browser imports; do not bypass it.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../docs/CODEBASE_MAP.md) and [Testing](../../docs/TESTING.md).
