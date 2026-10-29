Read this if you are working on HTTP request boundaries.

# HTTP request boundaries

HTTP is the browser/server protocol. Guards validate access and request shape before feature work.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder     | Role                                               |
| ----------------------- | -------------------------------------------------- |
| `authorized-handler.ts` | Session, permission, CSRF, and account-rate guard. |
| `body.ts`               | Bounded JSON request parsing.                      |
| `errors.ts`             | Safe centralized HTTP errors.                      |

## Connections and gotchas

CSRF prevents unwanted writes from another site. Preserve Origin checks, size limits, and safe diagnostics. A
UI-hidden button is not an access check.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
