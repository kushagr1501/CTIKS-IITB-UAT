Read this if you are working on shared interface code.

# Shared interface code

React components are reusable functions describing visible interface elements.

Tool terms: [glossary](../../docs/GLOSSARY.md).

## Open these first

| Path in this folder       | Role                                     |
| ------------------------- | ---------------------------------------- |
| `layout/Footer.tsx`       | Footer markup shared by the application. |
| `layout/Nav.tsx`          | Public navigation and nested menus.      |
| `ui`                      | Small shared presentation components.    |
| `providers`               | Browser motion and scrolling behavior.   |

## Connections and gotchas

A CSS Module is a component-scoped stylesheet. Keep visual-only edits focused; shared layout changes affect
many routes.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../docs/CODEBASE_MAP.md) and [Testing](../../docs/TESTING.md).
