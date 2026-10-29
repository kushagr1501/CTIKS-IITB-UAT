Read this if you are working on database structure and history.

# Database structure and history

Prisma schema models define record shapes. Migrations are ordered SQL changes to installed databases.

Tool terms: [glossary](../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                 |
| ------------------- | ------------------------------------ |
| `schema.prisma`     | Current model definitions.           |
| `migrations`        | Ordered SQL changes and constraints. |

## Connections and gotchas

Do not edit an applied migration to fix one machine. Generate Prisma Client through setup; src/generated is
output, not source. Database changes require mentor review and rollback planning.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../docs/CODEBASE_MAP.md) and [Testing](../docs/TESTING.md).
