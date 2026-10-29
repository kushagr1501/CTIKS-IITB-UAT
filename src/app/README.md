Read this if you are working on routes and page wrappers.

# Routes and page wrappers

Next.js maps this folder to routes, which are web addresses. A layout wraps related pages.

Tool terms: [glossary](../../docs/GLOSSARY.md).

## Open these first

| Path in this folder   | Role                                                 |
| --------------------- | ---------------------------------------------------- |
| `layout.tsx`          | Global styles, metadata, and footer.                 |
| `(public)/layout.tsx` | Public header, navigation, and font controls.        |
| `admin/layout.tsx`    | Administrator access and navigation.                 |
| `faculty/page.tsx`    | Own-profile editing entry point.                     |
| `api`                 | HTTP request handlers delegating to server services. |

## Connections and gotchas

page.tsx exposes a page; route.ts handles HTTP requests. Parentheses organize a route group without adding a
URL segment. Brackets mark a value such as a profile slug. Never put secrets in browser components.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../docs/CODEBASE_MAP.md) and [Testing](../../docs/TESTING.md).
