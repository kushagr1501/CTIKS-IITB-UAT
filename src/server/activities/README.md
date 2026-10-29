Read this if you are working on activity persistence and filtering.

# Activity persistence and filtering

Zod validates activity requests. Services store changes and audit them together.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                            |
| ------------------- | ----------------------------------------------- |
| `schema.ts`         | Fields, link policy, and date/time rules.       |
| `service.ts`        | Administrator writes and version checks.        |
| `public.ts`         | Public listing, counts, and homepage selection. |
| `revalidate.ts`     | Public paths affected by writes.                |

## Connections and gotchas

Time is a filter, not a stored Past category. Do not silently unify the logged exact-cutoff difference between
listing and homepage queries.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
