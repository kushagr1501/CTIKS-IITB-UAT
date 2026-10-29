Read this if you are working on identity and access checks.

# Identity and access checks

Authentication identifies the user; authorization checks what they can do. Redis sessions represent temporary
login state.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                            |
| ------------------- | ----------------------------------------------- |
| `config.ts`         | Better Auth configuration and password adapter. |
| `session.ts`        | Current user and permission checks.             |
| `page-access.ts`    | Protected-page redirects.                       |
| `csrf.ts`           | Origin and signed write-token checks.           |
| `redis-storage.ts`  | Session lifecycle and expiry metadata.          |
| `permissions.ts`    | Role permission map.                            |

## Connections and gotchas

Review every change here. OAuth, public signup, and mail-based recovery are not enabled. Do not weaken expiry
or ownership checks to make a test pass.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
