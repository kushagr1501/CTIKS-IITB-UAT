Read this if you are working on administrator screens.

# Administrator screens

Managers own lists and actions; editors render forms. APIs still enforce permissions on the server.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder                 | Role                                   |
| ----------------------------------- | -------------------------------------- |
| `components/FacultyManager.tsx`     | People CRUD and visibility controls.   |
| `components/ActivityManager.tsx`    | Activity list and edit workflow.       |
| `components/ResearchManager.tsx`    | Research form state and save requests. |
| `components/ResearchPhotoField.tsx` | Research image input presentation.     |
| `components/AuditLogViewer.tsx`     | Read-only action history.              |
| `api-client.ts`                     | CSRF-aware browser request helper.     |

## Connections and gotchas

CRUD means create, read, update, delete. Preserve version fields, confirmation dialogs, and error handling. Do
not log form payloads or passwords.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
