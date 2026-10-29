Read this if you are working on public people presentation.

# Public people presentation

Public profiles render records selected by server visibility rules. A slug is the readable profile identifier
in a URL.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder               | Role                                            |
| --------------------------------- | ----------------------------------------------- |
| `components/FacultyDirectory.tsx` | Public category groups.                         |
| `components/FacultyProfile.tsx`   | Detailed core-faculty content.                  |
| `components/FacultyPortrait.tsx`  | Photo and initials fallback.                    |
| `demo-profile.ts`                 | Development preview content.                    |
| `content.ts`                      | Checked-in original people source used by seed. |

## Connections and gotchas

Editing source content does not automatically overwrite database profiles. Empty public sections are omitted.
Non-core menu entries use their configured external website when available.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
