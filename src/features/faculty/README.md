Read this if you are working on own-profile editing.

# Own-profile editing

Core faculty edit their own content. Autosave saves a private draft after typing pauses; publishing is
separate.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder        | Role                                            |
| -------------------------- | ----------------------------------------------- |
| `FacultyProfileEditor.tsx` | State, save requests, autosave, and cleanup.    |
| `FacultyEditorActions.tsx` | Status and action bar presentation.             |
| `faculty-text-field.tsx`   | Text field rendering.                           |
| `AcademicEntries.tsx`      | Repeatable academic rows.                       |
| `AcademicCsvImport.tsx`    | CSV templates, preview, validation, and import. |
| `profile-schema.ts`        | Runtime academic content validation.            |

## Connections and gotchas

Keep the 1.5-second debounce, version counters, and private-draft semantics intact. CSV appends rows only
after confirmation. Media upload is development-only; PDF uploads are currently restricted to the
Vijayaraghavan M. Chariar profile.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
