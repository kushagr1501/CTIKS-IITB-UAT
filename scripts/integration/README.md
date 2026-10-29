Read this if you are working on real-service and browser checks.

# Real-service and browser checks

Integration checks use a temporary database schema and Redis namespace. Playwright exercises browser screens.

Tool terms: [glossary](../../docs/GLOSSARY.md).

## Open these first

| Path in this folder      | Role                                                     |
| ------------------------ | -------------------------------------------------------- |
| `../test-integration.ts` | Server lifecycle, sequencing, and final cleanup.         |
| `http-session.ts`        | Cookie and CSRF-aware test requests.                     |
| `migrations.ts`          | Test migration application with guaranteed pool closure. |
| `faculty-directory.ts`   | Directory and visibility checks.                         |
| `faculty-accounts.ts`    | Provisioning, ownership, and faculty access.             |
| `faculty-deletion.ts`    | Rollback, revocation, and identity reuse.                |
| `browser-ui.ts`          | People, Research, autosave, CSV, and publish flows.      |

## Connections and gotchas

Keep test order and fixture ownership clear. The runner port and generated output are shared; do not run two
copies concurrently or type-check while it regenerates files.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../docs/CODEBASE_MAP.md) and [Testing](../../docs/TESTING.md).
