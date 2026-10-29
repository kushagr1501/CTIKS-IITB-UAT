Read this if you are working on temporary store connection.

# Temporary store connection

Redis holds sessions and request counters. It does not replace PostgreSQL profile data.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `client.ts`         | Connection, namespace prefix, and infrastructure error handling. |

## Connections and gotchas

An unavailable session store must not make a protected request succeed. Avoid key cleanup outside the exact
test namespace.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
