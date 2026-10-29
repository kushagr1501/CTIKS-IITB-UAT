Read this if you are working on application source.

# Application source

This folder contains the running website. A component describes a screen; a service performs a server
operation.

Tool terms: [glossary](../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                               |
| ------------------- | -------------------------------------------------- |
| `app/layout.tsx`    | Shared page wrapper and metadata.                  |
| `features`          | UI grouped by user task.                           |
| `components`        | Shared screen elements and browser behavior.       |
| `server`            | Database, login, validation, and audit operations. |
| `config`            | Shared labels, paths, and password policy.         |

## Connections and gotchas

Follow route imports into a feature and service. Keep server code out of browser components.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../docs/CODEBASE_MAP.md) and [Testing](../docs/TESTING.md).
