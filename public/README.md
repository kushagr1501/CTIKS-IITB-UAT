Read this if you are working on static files served by path.

# Static files served by path

A static asset is served as a file rather than produced by a database query.

Tool terms: [glossary](../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                              |
| ------------------- | ------------------------------------------------- |
| `assets`            | Logos, illustrations, and exported design assets. |
| `fonts`             | Locally served fonts.                             |

## Connections and gotchas

Use /assets/... or /fonts/... URLs, without the public prefix. Do not put private files or mutable production
uploads here. Development uploads are stored outside the project.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../docs/CODEBASE_MAP.md) and [Testing](../docs/TESTING.md).
