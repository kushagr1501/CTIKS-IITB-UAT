Read this if you are working on homepage sections.

# Homepage sections

The homepage combines checked-in introduction/programme content with database-backed activities.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder             | Role                                    |
| ------------------------------- | --------------------------------------- |
| `content.ts`                    | Static introduction and programme data. |
| `components/Programmes.tsx`     | Programme section composition.          |
| `components/UpcomingEvents.tsx` | Upcoming event cards.                   |
| `components/Announcements.tsx`  | Recent announcement cards.              |

## Connections and gotchas

Do not duplicate activity records in content.ts. Server queries select homepage activity data. A successful
build does not validate event dates or live hosting.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
