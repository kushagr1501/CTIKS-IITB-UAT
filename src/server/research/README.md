Read this if you are working on research card persistence.

# Research card persistence

This service owns stored research areas. Related professors are stored as names in the current contract.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                                  |
| ------------------- | ----------------------------------------------------- |
| `schema.ts`         | Title, image, professor-name, and version validation. |
| `service.ts`        | CRUD, visibility, public reads, and audit writes.     |

## Connections and gotchas

Keep hidden entries out of public queries. Changing names to foreign keys would be a schema/API design change,
not a cleanup.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
