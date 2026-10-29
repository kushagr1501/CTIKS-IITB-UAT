Read this if you are working on profile persistence.

# Profile persistence

Services write directory data and faculty-owned academic revisions. A revision is a stored content snapshot.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder       | Role                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `service.ts`              | Administrator CRUD, linked logins, visibility, and auditing. |
| `editor.ts`               | Own-profile drafts, publish, and media ownership checks.     |
| `schema.ts`               | Directory request validation.                                |
| `public.ts`               | Visibility-filtered public reads.                            |
| `public-profile-query.ts` | Shared published-profile query shape.                        |

## Connections and gotchas

Preserve actor ownership, version conflicts, transaction boundaries, and immutable published history. Public
email and login email are different fields.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
