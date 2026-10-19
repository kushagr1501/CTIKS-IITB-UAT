# Backend setup and operation

## First setup on a fresh development database

1. Use Node.js 22.12+ and run `npm ci`.
2. Copy `.env.example` to `.env.local` and supply Neon pooled `DATABASE_URL`,
   direct owner `DIRECT_URL`, a random 32+ character `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL`, and the admin email. Keep credentials out of Git and chat.
3. Start Docker Desktop, run `npm run redis:setup`, then `npm run redis:up`.
   This generates a private Redis password and configures `.env.local`. Alternatively,
   supply your own `REDIS_URL` and a unique `REDIS_NAMESPACE`.
4. Run `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed`.
5. Run `npm run db:restrict`. This creates `ctiks_app`, replaces the runtime
   connection, and moves the owner connection into ignored `.env.migrations.local`.
6. Run `npm run db:verify` and restart the app with `npm run dev`.
7. Open `/login` using the generated credentials in `.private/admin-credentials.txt`.
   Store the generated password safely. You can change it on `/admin/security`.

Seed imports the existing 13 faculty records once. Existing profiles and admin
credentials are not overwritten on reruns. Start new deployments on a deliberately
chosen database; do not apply migrations to an unrelated database.
Once faculty import or deletion is recorded in audit history, seed reruns skip
the original faculty import so deleted profiles are not recreated.

## How requests work

```text
Admin React form
  → /api/admin/... route.ts
    → verify Origin and signed CSRF token for mutations
    → validate Redis-backed session and idle/absolute expiry
    → check the current Neon user and required RBAC permission
    → consume a Redis-backed request limit
    → faculty or audit service
      → validate allowed fields
      → Prisma transaction
        → save faculty change and corresponding audit event together
```

The public People page calls `server/faculty/public.ts` directly on the server.
It only selects public fields from records with `visible: true`. It is dynamic,
so a new request sees current database content. It does not load private account
or audit data. Empty faculty categories are omitted from the public page.

## Server folders

| Folder     | Responsibility                                                                          |
| ---------- | --------------------------------------------------------------------------------------- |
| `database` | One pooled Prisma client with verified TLS                                              |
| `auth`     | Better Auth credential adapter, Argon2id, Redis sessions, permissions, CSRF, throttling |
| `redis`    | Shared Redis connection and safe infrastructure errors                                  |
| `faculty`  | Profile validation, public reads, versioned updates, visibility                         |
| `audit`    | Append-only entries, filters, expiry detection, CSV encoding                            |
| `http`     | Bounded JSON parsing, admin request guard, safe errors                                  |

Authentication uses Better Auth through a restricted set of `/api/auth` routes.
Signup, email changes, role changes, and other unused library endpoints are not
exposed. Role changes are maintenance operations in this phase.
The browser receives session cookies, never a session token in JSON.

`users.emailVerified`, `sessions`, `rate_limits`, and `verifications` do not exist in PostgreSQL.
Temporary authentication challenges use Redis exclusively. Application tables
include `users`, `accounts`, `faculty_profiles`, `audit_events`, `activities`, and
the academic profile tables described in [faculty academic profiles](faculty-profiles.md).
The credential adapter projects a constant `emailVerified: false` only into Better
Auth's internal User shape. It is not stored in Neon or returned by our API. The
`accounts` table also omits `providerId` and `accountId`: the adapter derives
`providerId: 'credential'` and `accountId: userId` for internal library calls.
A unique `userId` permits one password account per user. Identity lookups retain
all user constraints and reject unsupported providers and compound comparisons.
The migration refuses non-password identities or duplicate accounts instead of
discarding them. Existing password hashes are preserved. The
adapter reads provisioned identities and delegates credential changes to Prisma;
user writes, verification, signup, email changes, and social login are unsupported.
This custom adapter is verified through integration tests rather than the stock
Prisma adapter's core-column schema check. Revisit it before enabling other sign-in methods.

## Permissions and faculty editing

`ADMIN` has `faculty.read`, `faculty.create`, `faculty.update`, `faculty.delete`,
`faculty.self.read`, `faculty.self.update`, `audit.read`, and `audit.export`. `CORE_FACULTY` has
`faculty.self.read` and `faculty.self.update`. Unknown roles are denied by default.
Account roles and faculty categories are independent.

The admin faculty editor can optionally provision a login for a new or existing
core faculty profile. The write request includes `login: { email, password }`.
The server normalizes the login email, validates a 6–128 character password,
hardcodes the `CORE_FACULTY` role, and stores an Argon2id hash. Account creation,
profile linking, and audit records commit in the same transaction. Duplicate
emails, stale versions, and duplicate profiles roll everything back. Existing
logins cannot be overwritten through profile editing. Public and login emails
are separate. Non-core profiles cannot receive new logins.

The admin can generate a six-character initial password in the form or enter a
longer one. After success, credentials are displayed from browser memory in a
one-time popup, with a copy button. They are cleared when that popup closes;
passwords are never returned by the API, stored in browser storage, or included
in audit snapshots. There is no automatic email delivery or forced password change.

Both roles use `/login`. The client sends admin users to `/admin` and core
faculty users to `/faculty`. Faculty can edit and publish their own linked profile through
`GET`/`PUT /api/faculty/profile` and change their password at `/faculty/security`.
Profile selection uses the session user ID, not a supplied faculty ID. Faculty
cannot edit other profiles, create accounts, read admin lists, or read/export audit logs. Own submissions publish immediately; optional drafts stay private. See [faculty profiles](faculty-profiles.md).
Session creation and every protected request recheck the current role and linked
profile category. Changing a linked profile away from Core Faculty removes login
access; hiding the profile from the public website does not.

For existing installations, rerun `npm run db:restrict` once to grant the runtime
role INSERT on users and accounts, DELETE on faculty profiles and accounts, and
email UPDATE for retiring deleted identities. No new tables or columns are
required. Role updates, user deletion, and audit modification remain blocked.

The faculty directory has a Delete button with a confirmation popup. Deletion is
permanent and requires `faculty.delete`, Origin/CSRF validation, and a matching
record version through `DELETE /api/admin/faculty/:id` with `{ version }`.
The transaction removes the profile and linked password credentials, retires the
login email to an internal random address, and appends a `FACULTY_DELETED` event
containing only the profile snapshot and login metadata. The user identity stays
to preserve historical audit references. The original email can be reused by a
new account with a new user ID. Administrator-linked profiles cannot be deleted.
Linked Redis sessions are revoked before commit; protected requests also require
a current linked core profile, so an in-flight login cannot retain access after
deletion. A stale version or failed audit write leaves the profile and credentials
unchanged. Redis or commit failures can revoke sessions even if the database
transaction rolls back; the user can sign in again if their profile remains.

Faculty updates submit the full editable record and its version. Empty optional
fields clear existing values. A stale version returns 409 without overwriting
another editor's changes. Profiles have one boolean `visible` field: Visible
appears on the website, Hidden does not. All profiles remain editable in the
same admin list. Initial loads and saved updates share the same category, display
order, name, and ID sorting rule. Visibility changes preserve the profile's position.
`PATCH /api/admin/faculty/:id/visibility` accepts `{ visible, version }`
and saves the change and audit event together using `faculty.update` permission.
Directory visibility is independent of academic revision drafts. Existing published,
unarchived records become Visible during migration; all others become Hidden.
Historical audit snapshots remain unchanged. Image URLs allow local `/assets/`
paths or HTTPS URLs from any host. No image-domain allowlist is applied. The backend never
fetches arbitrary image URLs. Biographies are plain text rendered by React.

## Session and authentication policy

- Passwords are salted Argon2id hashes; new passwords require 6–128 characters.
  The form, API validation, and authentication library share `config/password-policy.ts`.
- Password changes are voluntary and revoke other browser sessions.
- Sessions expire after eight hours and after 30 minutes without a protected
  request. Reading an open page without making requests does not refresh the timer.
- Cookies are HttpOnly and SameSite=Strict; production cookies require HTTPS.
- The application origin must exactly match `BETTER_AUTH_URL`, including the port.
- CSRF cookies are signed, and writes require the matching custom header plus Origin.
- Persistent limits apply per login identifier and globally; forwarded IP headers
  are not trusted in this phase. Edge throttling and trusted-proxy setup belong
  to the IITB deployment work.

Sessions, active-session indexes, and counters use namespaced Redis keys. Role
checks always reload the user from Neon so an existing Redis snapshot cannot
retain revoked permissions. Idle refresh is atomic and cannot recreate a session
deleted by logout or password rotation. Redis unavailability denies protected
operations; it does not fall back to accepting an unvalidated cookie.

The local Compose service binds only `127.0.0.1:16379`, requires a generated password,
uses a named volume and AOF persistence, and caps data memory at 128 MB with
`noeviction`. Its container has a 256 MB limit. Credentials are mounted from an
ignored private file. Never expose this Redis port publicly. `redis:down` stops the
service without deleting its volume. This Compose file currently runs local Redis;
it is not the final IITB application deployment bundle.

## Audit history

Successful and failed login activity, logout, security changes, session expiry,
faculty changes, and CSV exports are recorded. Failed attempts contain the
submitted identifier, which is not proof of a person's identity. Passwords
and session tokens are excluded.

Audit entries cannot be updated/deleted by the runtime database role. A database
trigger also rejects row updates/deletes. Database owners remain capable of
maintenance, so this is not a claim of tamper-proof storage against a database
administrator. Faculty changes are atomic with their audit entries; authentication
events are recorded around the authentication library's own transactions.

Idle/expired Redis sessions are rejected on access. Expiry metadata is queued
in Redis and copied to audit history when viewing/exporting logs, in bounded batches.
It is acknowledged only after Neon accepts the deduplicated event. Expiry entries
can therefore be detected after the actual timeout; they do not show exactly
when someone stopped using the site. Session revocation is distinct from logout.
If Redis data is lost, users must log in again and unprocessed expiry metadata
can be lost. Existing Neon audit history is unaffected.

The admin page shows paginated history without filter controls. Activity detail popups
show only changed fields with readable previous/new values and plain-language
activity information. Full before/after snapshots remain stored and included in CSV exports.
On-screen times
and API date filters use Asia/Kolkata. CSV timestamps use UTC, and
cells are escaped against spreadsheet formulas. Exports are bounded to 10,000
records; API date filters can narrow larger histories. Raw audit retention and
backup retention must be agreed with IITB before production.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run test:integration
npm run db:verify
npm run build
```

Integration tests require running Redis and use a generated `ctiks_test_<random>`
schema in the development Neon database, an equally isolated Redis key namespace,
and a separate app server on port 3002. They do not
modify the real admin or faculty records. The namespace is dropped in cleanup.
They need owner access and should only run against development infrastructure.
Only their generated schema and key prefix are removed during cleanup; Redis is
never flushed. Logs/results are in ignored `.private/`; generated test build files are ignored.

## Production preparation

Use a supported Node.js runtime, set the real HTTPS `BETTER_AUTH_URL`, and configure
the runtime with `.env.local` values only. Do not give the running app the migration
owner connection or deploy `.private/`. Apply migrations separately using the
owner environment. Deploy `npm run build` output and run `npm start` under the
IITB process manager.

IITB VPN restrictions, trusted reverse-proxy configuration, backups and restore
checks, retention, and deployment-specific monitoring still need implementation
or operational configuration before public production use. Public signup and
email reset delivery are not enabled in this release.
