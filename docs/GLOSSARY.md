Read this if a word in the setup guide or a code review is unfamiliar.

# Project glossary

| Term                                  | Meaning here                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTIKS                                 | Centre for Traditional Indian Knowledge and Skills, IIT Bombay.                                                                                          |
| Repository / clone                    | A Git-tracked project, and a local copy of it.                                                                                                           |
| Commit / branch / pull request (PR)   | A saved change, a named line of changes, and a request for teammates to review changes before merging.                                                   |
| Dependency / lock file                | A package the project uses; `package-lock.json` records its installed versions.                                                                          |
| Node.js / npm                         | Server JavaScript runtime; package installer and command runner.                                                                                         |
| React / component                     | Interface library; a reusable function describing part of a screen.                                                                                      |
| Next.js / App Router                  | Web framework; its folder-based system for finding pages and HTTP handlers.                                                                              |
| Route                                 | A web address handled by the app, such as `/people`.                                                                                                     |
| Route group / dynamic segment         | An organizing folder like `(public)` that adds no URL segment; a route value like `[slug]`.                                                              |
| Slug                                  | Readable URL identifier, such as `vijayaraghavan-m-chariar`.                                                                                             |
| Layout / metadata                     | Shared page wrapper; titles and descriptions used by the browser.                                                                                        |
| Server / Client Component             | React code rendered on the server; code that can also handle browser events and state. A `'use client'` file starts a client boundary.                   |
| Hydration                             | React connecting browser handlers to the HTML sent by the server.                                                                                        |
| Feature UI                            | Screen and form code grouped by user feature under `src/features`.                                                                                       |
| API / HTTP / endpoint                 | A request contract; the web request protocol; an address that handles requests.                                                                          |
| GET / POST / PATCH / PUT / DELETE     | HTTP methods used to read, create, edit, save profile content, and delete records.                                                                       |
| Service                               | Server code that carries out a feature operation.                                                                                                        |
| TypeScript / strict mode              | JavaScript with compile-time shape checks; settings that reject ambiguous types.                                                                         |
| Zod / validation                      | Runtime data-checking library; rejecting invalid actual values.                                                                                          |
| PostgreSQL                            | Database storing profiles, activities, research, accounts, and audit history.                                                                            |
| Database schema / Prisma schema       | A PostgreSQL namespace such as `public`; the model definitions in `prisma/schema.prisma`. These are different meanings of schema.                        |
| Prisma / Prisma Client                | Database toolkit; generated code used for database operations.                                                                                           |
| Migration / seed                      | Versioned SQL change; initial data creation. Neither means deleting all database data.                                                                   |
| ORM                                   | Object-relational mapper: code expressing database operations through model objects. Here it is Prisma.                                                  |
| Pool / transaction / rollback         | Reused connections; writes committed together; undoing those writes after failure.                                                                       |
| Redis / namespace                     | Temporary key-value store; a prefix separating test and application keys.                                                                                |
| Session / cookie                      | Server-side login state; browser data identifying it.                                                                                                    |
| Authentication / authorization / RBAC | Checking who signed in; checking permissions; permissions based on roles.                                                                                |
| CSRF / Origin                         | Cross-site request forgery, an unwanted write from another site; the scheme, host, and port identifying the request source.                              |
| Argon2id / hash                       | Password hashing algorithm; one-way representation instead of a stored plain password.                                                                   |
| Rate limit / TTL                      | Request cap during a time window; time remaining before temporary data expires.                                                                          |
| Audit log                             | Retained account and content action history, not an editable news feed.                                                                                  |
| Draft / published / visible           | Private profile work; content submitted to the current profile; whether an administrator permits public display.                                         |
| Revision / version / conflict         | Stored profile snapshot; counter detecting stale changes; rejection of a request with an old counter.                                                    |
| Debounce / autosave                   | Waiting for typing to pause; saving a private draft after the current 1.5-second delay.                                                                  |
| CSV / BOM                             | Comma-separated text used for imports; optional text-file encoding marker.                                                                               |
| Unit / integration / Playwright test  | Focused code check; check involving services and HTTP; automated browser interaction.                                                                    |
| Characterization / regression test    | Records existing behavior before refactoring; guards against a defect returning.                                                                         |
| Stub / mock / fixture                 | Controlled replacement in a test; replacement recording calls; prepared test data/services.                                                              |
| Container / image / volume / Compose  | Isolated service process; its packaged filesystem; durable service data; tool starting the defined services.                                             |
| Port / loopback                       | Service connection number; a local address such as `127.0.0.1`.                                                                                          |
| Environment variable / secret         | Machine-specific setting; sensitive password or signing key.                                                                                             |
| Build / runtime / generated file      | Preparing deployment output; running the app; a file created by tools.                                                                                   |
| TLS / HTTPS / SMTP / VPN              | Encrypted transport; encrypted web traffic; email delivery protocol; private network connection. SMTP and IITB VPN restrictions are not integrated here. |
| Reverse proxy / deployment / UAT      | Front server forwarding requests; installing a release; user acceptance testing in a separate environment.                                               |
| Neon                                  | Hosted PostgreSQL provider used by existing UAT. Local development does not require it.                                                                  |
| Tailwind / CSS Module / Lenis         | Utility-class styling; component-scoped CSS; public smooth-scroll library.                                                                               |
| ESLint / Prettier                     | Code rule checker; code formatter. Passing them does not prove a browser flow works.                                                                     |
| Tracing warning / N+1                 | Warning about files included in server output; an extra database query for every list item.                                                              |

## Additional terms

- **URL / ID / OS:** a web address; an identifier; operating system.
- **JSON / SQL:** text representing structured values; the language used to query relational databases.
- **Pagination / alias:** splitting results into pages; another name for the same command or operation.
- **Git staging:** selecting changes for the next commit. This differs from a staging deployment for review.
- **Optimistic concurrency:** rejecting an old version counter so a save cannot silently overwrite a newer
  edit.

- **CRUD:** create, read, update, and delete records.
- **UTC / India time:** a shared timestamp reference; the editor uses the Asia/Kolkata time zone, UTC plus 5
  hours 30 minutes.
- **Better Auth / OAuth:** this project's authentication library; delegated sign-in through another provider,
  which is disabled here.
- **HttpOnly:** a cookie flag that prevents browser JavaScript from reading the cookie.
- **dotenv / precedence:** the environment-file reader used by scripts; the rule deciding which setting wins.
- **Bundler / Webpack:** a tool combining source modules into runnable output; the alternative development
  bundler.
- **Barrel / re-export:** a file exposing imports from other files; forwarding an exported value through
  another module.
- **Warm-up / tracing:** compiling pages before they are requested; finding files needed in server output.
- **Fixture / backfill:** prepared test data; populating existing records after a schema change.
- **CLI / CI:** command-line interface; automated checks run by a shared integration system.

Next: [Getting started](GETTING_STARTED.md), [Architecture](ARCHITECTURE.md), or [Testing](TESTING.md).
