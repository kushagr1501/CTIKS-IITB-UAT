Read this if you are working on public activity lists.

# Public activity lists

Activities are news, announcements, or events. Past/upcoming is a time filter rather than another content
category.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder              | Role                                             |
| -------------------------------- | ------------------------------------------------ |
| `components/ActivityListing.tsx` | Type/time filters, counts, paging, and fallback. |
| `components/ActivityPoster.tsx`  | Clickable image and enlarged view.               |
| `search.ts`                      | Search URL and 350 ms debounce.                  |
| `dates.ts`                       | India-time form and display conversion.          |
| `types.ts`                       | Shared activity field shapes and paths.          |

## Connections and gotchas

Server queries live in src/server/activities. Preserve date-only versus timed behavior. Undated content
appears in All. See the Activities guide for the exact boundary caveat.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
