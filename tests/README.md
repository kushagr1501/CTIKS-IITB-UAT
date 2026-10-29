Read this if you are working on focused code checks.

# Focused code checks

Unit tests check small behaviors using the Node.js test runner. A regression test guards against a defect
returning.

Tool terms: [glossary](../docs/GLOSSARY.md).

## Open these first

| Path in this folder       | Role                                                    |
| ------------------------- | ------------------------------------------------------- |
| `activities.test.ts`      | Input validation and India-time dates.                  |
| `activity-search.test.ts` | Debounced search scheduling.                            |
| `faculty-content.test.ts` | Academic content rules and ownership fields.            |
| `security.test.ts`        | Permissions, CSRF, credentials, and safe serialization. |
| `migration-pool.test.ts`  | Injected migration failure must close its pool.         |

## Connections and gotchas

Most checks need no services. The migration-pool test replaces query/end methods and opens no connection. Real
HTTP and browser flows live under scripts/integration.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../docs/CODEBASE_MAP.md) and [Testing](../docs/TESTING.md).
