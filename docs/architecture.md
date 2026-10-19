# Architecture

## Request and rendering flow

```text
URL
  → src/app/layout.tsx                     HTML, global CSS, default metadata
    → src/app/(public)/layout.tsx          Shared public layout
      → Header + Nav
      → route page.tsx                    Section composition and page metadata
        → features/<feature>/components/  Page-specific presentation
          → content.ts                    Current static content
          → shared components/ui/         Reusable presentation
      → Footer
```

`(public)` is a route group: it organises files without adding a URL segment.
The root layout stays small. Public pages use `(public)/layout.tsx`, while
`app/admin/layout.tsx` supplies authenticated administration navigation. Login
is outside the protected admin layout so it can be reached before authentication.
The root body tolerates attributes injected by browser extensions before hydration.
This is scoped to the body element; descendant hydration checks remain enabled.

## Folder conventions

- Keep `page.tsx` focused on page metadata and arranging sections.
- Keep page-specific code in `features/home`, `features/about`, or `features/people`.
- Keep feature content and its types together in `content.ts` and `types.ts`.
- Promote a component to `components/ui` only when it is useful across features.
- Use `@/` imports across folders and relative imports within one feature.
- Import concrete files directly. Avoid barrel files and duplicate re-export wrappers.
- Keep backend modules in `server/`, with authentication, permissions,
  faculty persistence, and auditing separated by responsibility. Keep database
  credentials and code out of client components.

The header, navigation, and footer have one shared implementation. The homepage
alone includes `ConnectWithUs`, so the layout does not need a pathname-dependent
footer or duplicated page wrappers.

## Server and client boundaries

Components are Server Components unless they explicitly use `'use client'`.
The current public pages can be prerendered and include their content in HTML.

Only these components need browser behaviour:

| Component         | Reason                                                    |
| ----------------- | --------------------------------------------------------- |
| `Nav`             | Current route, mobile menu state, resize handling         |
| `SmoothScroll`    | Lenis animation and reduced-motion preference             |
| `Reveal`          | Programme entrance animation through IntersectionObserver |
| `FacultyPortrait` | Image-load failure and initials fallback                  |

`ProgrammeBlock` passes server-rendered content into `Reveal`. Faculty cards
remain server-rendered while only their portraits handle image-error state.
Do not mark a whole page as client-side to support one interactive child.

Next.js `Link` handles internal navigation; there is no custom history router.
External faculty websites remain ordinary links opening in a separate tab.
Smooth scrolling releases its animation frame and Lenis instance on cleanup,
and respects reduced motion. Programme text remains visible without JavaScript.

## Adding a public page

1. Create `src/app/(public)/<route>/page.tsx` and export its metadata.
2. Place its sections and content in the matching feature folder.
3. Add or update the link in `src/config/navigation.ts`.
4. Run lint, type checking, and the production build.
5. Check direct navigation, links, browser back/forward, and mobile layout.

Unimplemented routes return the root `not-found.tsx`. The `/about` alias is
configured as a permanent redirect in `next.config.ts`.

## Deployment and future backend

Use a supported Node.js runtime on the IITB server. Build with `npm run build`
and serve with `npm start`; this is not a static-export deployment. The current
public pages are prerendered, and future server endpoints can use the same app.

Neon PostgreSQL, Prisma, server-side sessions, RBAC, faculty management, and
read-only audit logs with CSV export are implemented. `app/api/` contains thin
HTTP handlers; `server/` contains authentication, validation, and data operations.
Admin form components live in `features/admin/`. The public People route fetches
visible faculty through a server-only query; Home and About remain static.

Read [backend.md](backend.md) for setup, security boundaries, and test commands.
Faculty accounts, individual profile pages, and IITB network restrictions remain
separate future work.
