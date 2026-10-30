Read this if you are working on developer and maintenance tools.

# Developer and maintenance tools

Scripts automate setup, checks, and data maintenance. Some mutate persistent data.

Tool terms: [glossary](../docs/GLOSSARY.md).

## Open these first

| Path in this folder   | Role                                              |
| --------------------- | ------------------------------------------------- |
| `dev.mjs`             | Development startup and page warm-up.             |
| `setup-env.mjs`       | Creates local settings with a fresh auth secret.  |
| `local-database.mjs`  | Wrappers forcing the original local database URL. |
| `setup-redis.ts`      | Creates ignored local Redis credentials.          |
| `seed.ts`             | Initial admin and sample profile import.          |
| `test-integration.ts` | Full-suite setup, sequencing, and teardown.       |
| `integration`         | Focused API and browser check modules.            |

## Connections and gotchas

Run the documented walkthrough, not every script. Import, publish, restrict-database, and restore tools need
an owner-approved target. DIRECT_URL can point to remote data.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../docs/CODEBASE_MAP.md) and [Testing](../docs/TESTING.md).
