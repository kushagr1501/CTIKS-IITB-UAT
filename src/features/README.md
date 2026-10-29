Read this if you are working on feature UI boundaries.

# Feature UI boundaries

A feature groups the screens and form helpers for one user task.

Tool terms: [glossary](../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                            |
| ------------------- | ----------------------------------------------- |
| `admin`             | Administrator management screens.               |
| `faculty`           | Own-profile editing, CSV imports, and autosave. |
| `activities`        | Public news, announcements, and events.         |
| `research`          | Public research cards.                          |
| `academics`         | Programme content and presentation.             |
| `people`            | Directory and individual profile presentation.  |

## Connections and gotchas

Home and About have their own folders too. The UI is not the security boundary: every protected request still
needs server validation and permissions.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../docs/CODEBASE_MAP.md) and [Testing](../../docs/TESTING.md).
