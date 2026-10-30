Read this if you need the server access boundaries after local setup works.

# Backend boundaries

The backend is the server code under `src/server`. A service carries out an operation; a route is the address
handling its HTTP request. See the [Architecture](ARCHITECTURE.md) for a real edit traced through both.

## Local setup versus deployment

Use [Getting started](GETTING_STARTED.md) for the tested local setup. It uses PostgreSQL and Redis containers,
a generated administrator password, and local URLs. Neon is a hosted PostgreSQL service used by the existing
UAT environment; it is not required for an intern's machine. UAT means user acceptance testing.

The deployment still requires a Node.js process, persistent database and Redis connections, HTTPS, secrets,
backups, and an agreed upload storage arrangement.

## Identity and permissions

A session is temporary login state. Better Auth handles credential authentication through the restricted
routes in `src/app/api/auth/[...all]/route.ts`. Passwords use Argon2id hashes, a one-way representation rather
than plain text.

Users and password hashes are stored in PostgreSQL. Redis stores sessions, active session indexes, temporary
authentication data, and rate-limit counters. A rate limit caps repeated requests. Redis failure denies
protected operations instead of accepting an unvalidated cookie.

- `ADMIN` manages People, Activities, Research, and audit access.
- `CORE_FACULTY` can edit their own linked core profile and change their password.
- Role and public faculty category are separate. Hiding a core profile does not disable its owner's login.
  Changing its category away from Core Faculty does.
- Sessions expire after eight hours, or after 30 minutes without a protected request. Leaving a page open is
  not the same as making an authenticated request.
- Password changes are voluntary and revoke other browser sessions.

The current role and linked profile are checked again on protected requests. The browser gets an HttpOnly
cookie, which browser JavaScript cannot read as a plain token. Production cookies require HTTPS. Cookie policy
and Origin checks are in the auth modules, not in a hidden UI button.

## Write requests

A protected write needs a valid session, permission, and CSRF token. CSRF means cross-site request forgery: a
write triggered from another site without the user's intent. The guard verifies the request Origin and a
signed token sent in a header. Zod then checks real input values. Unknown control fields are rejected by
strict schemas.

Services use version counters to detect stale edits. HTTP 409 is a conflict, not permission to overwrite the
newer record. Optional empty fields explicitly clear stored content. Content changes and audit records are
written in the same database transaction, so a failed audit write can roll back the content change.

Audit logs retain historical account/content actions. The runtime role should have read/insert access to audit
history, not update/delete access. Database owners can still perform privileged maintenance; this is not
tamper-proof storage against an owner. Expired session history is recorded when queued metadata is processed,
so detection time can be later than the actual timeout.

## Maintenance boundary

`scripts/restrict-database.ts` provisions a restricted runtime role; a database role is an identity with
granted database permissions. `scripts/verify-database.ts` checks expected privileges. These tools force
verified TLS and are not part of the plain local-container walkthrough. They were read, not executed against
IITB or Neon during documentation verification. Their grants need owner review for the current schema before
deployment, including the Research table.

Import, publish, restore, UAT, and role-provisioning scripts can target persistent remote data through
`DIRECT_URL`. A new intern should not run them without explicit owner instructions. The safe defaults and
setting precedence are in [Environment](ENVIRONMENT.md).

## Media and operations

Database records store file URLs/paths, not the image/PDF bytes. Existing local media handling requires
development mode and a local database. Files live outside the source/build directory. It is not a production
storage integration. Never put sensitive documents in a public URL or assume a private draft makes its linked
development file a private storage object.

Production database migration, TLS certificates, backup restore, monitoring, and server access remain
infrastructure-owner decisions. A pushed commit or passing build does not verify
those decisions.

Next: [Environment](ENVIRONMENT.md), [Testing](TESTING.md), and [Codebase map](CODEBASE_MAP.md).
