# API edge testing and latency snapshot — 20 October 2026

## Result

The API integration suite passed against a randomly named PostgreSQL schema and Redis namespace. The harness seeded a separate administrator and core-faculty account, ran authenticated HTTP requests and Playwright UI flows, then removed the temporary schema and Redis keys. It did not write to the live faculty profiles. The final run recorded 270 API responses: 170×200, 8×201, 15×400, 24×401, 24×403, 7×404, 1×405, 14×409, 4×415, 1×429 and 2×500. The two 500s were deliberately induced audit-write failures; the tests verified that each corresponding content deletion rolled back. No unexpected failure remained.

Validation also passed: `npm run typecheck`, all 28 unit tests, ESLint on the changed integration files, and `npm run test:browser`.

## Endpoint and edge coverage

| Endpoint                               | Methods exercised             | Main cases                                                                                                                                                              |
| -------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/csrf`                       | GET                           | Token and cookie setup used for mutating requests                                                                                                                       |
| `/api/auth/[...all]`                   | POST; GET                     | Sign-in/out, password change, CSRF enforcement, bad credentials, throttling, disabled signup/MFA, unavailable session-read path, session revocation and expiry          |
| `/api/admin/activities`                | GET, POST; unsupported DELETE | Admin list/create, anonymous/faculty denial, missing or wrong content type, malformed JSON, invalid date range, untrusted origin, missing CSRF                          |
| `/api/admin/activities/:id`            | PATCH, DELETE                 | Field clearing, stale version, invalid/missing IDs, forbidden roles, failed-audit rollback, delete and repeat delete                                                    |
| `/api/admin/activities/:id/visibility` | PATCH                         | Hide/show, visibility filtering, stale version and role denial                                                                                                          |
| `/api/admin/faculty`                   | GET, POST                     | Core/adjunct/associate/visiting creation, duplicate slug/email, malformed/privilege fields, login creation rollback and role rules                                      |
| `/api/admin/faculty/:id`               | PATCH, DELETE                 | Update, stale version, account-link protection, no-login deletion, deletion rollback, session revocation and safe email reuse                                           |
| `/api/admin/faculty/:id/visibility`    | PATCH                         | Boolean validation, CSRF, hide/show persistence, hidden edits and stale version                                                                                         |
| `/api/admin/audit-logs`                | GET                           | Permissions, invalid/reversed dates, page limit and SQL-like filter text                                                                                                |
| `/api/admin/audit-logs/export`         | POST                          | Permissions, CSRF, CSV content and secret exclusion                                                                                                                     |
| `/api/faculty/profile`                 | GET, PUT                      | Own-record selection, admin/anonymous denial, malformed body/content type, injection attempts, drafts, publish, discard, concurrent versions, explicit clears and audit |

The suite also exercised both admin and faculty browser screens with Playwright, including faculty create/edit/show/hide/delete and professor draft/edit/publish flows. Unit tests cover body byte limits, URL safety, schema boundaries, and CSV formula neutralization.

## Measured response times

These are successful API responses from the integration run. Times include the development server and the test’s direct database connection; `app p50` is Next’s logged application-code portion. Small per-endpoint sample counts make p95 a rough upper observation, not a stable service-level percentile.

| Endpoint                                     | Samples | Total p50 |       Total p95 / max | Application-code p50 |
| -------------------------------------------- | ------: | --------: | --------------------: | -------------------: |
| `GET /api/auth/csrf`                         |     115 |     24 ms |        84 ms / 562 ms |                20 ms |
| `POST /api/auth/sign-in/email`               |       8 |  1,897 ms |   2,200 ms / 2,200 ms |             1,894 ms |
| `POST /api/auth/change-password`             |       2 |  4,600 ms |   5,500 ms / 5,500 ms |             4,600 ms |
| `GET /api/admin/faculty`                     |       3 |  1,137 ms |   2,200 ms / 2,200 ms |             1,112 ms |
| `POST /api/admin/faculty`                    |       7 |  2,200 ms |   3,700 ms / 3,700 ms |             2,200 ms |
| `PATCH /api/admin/faculty/:id`               |       5 |  2,800 ms |   5,400 ms / 5,400 ms |             2,700 ms |
| `PATCH /api/admin/faculty/:id/visibility`    |       5 |  2,600 ms |   3,900 ms / 3,900 ms |             2,600 ms |
| `GET /api/admin/activities`                  |       1 |    875 ms |       875 ms / 875 ms |               871 ms |
| `POST /api/admin/activities`                 |       1 |  1,625 ms |   1,625 ms / 1,625 ms |             1,620 ms |
| `PATCH /api/admin/activities/:id`            |       2 |  2,300 ms |   2,500 ms / 2,500 ms |             2,300 ms |
| `PATCH /api/admin/activities/:id/visibility` |       2 |  2,100 ms |   2,300 ms / 2,300 ms |             2,100 ms |
| `GET /api/admin/audit-logs`                  |       1 |  2,800 ms |   2,800 ms / 2,800 ms |             2,800 ms |
| `POST /api/admin/audit-logs/export`          |       1 |  1,392 ms |   1,392 ms / 1,392 ms |             1,389 ms |
| `GET /api/faculty/profile`                   |       7 |  4,900 ms |   5,200 ms / 5,200 ms |             4,900 ms |
| `GET /api/faculty/profile?id=…`              |       1 |  6,100 ms |   6,100 ms / 6,100 ms |             5,900 ms |
| `PUT /api/faculty/profile`                   |      11 |  6,900 ms | 10,400 ms / 10,400 ms |             6,900 ms |

**Latency verdict:** CSRF generation is in a healthy range. Most database-backed API calls are not yet okay: successful read/write medians span roughly 0.9–6.9 seconds, and faculty saves peak at 10.4 seconds in this development run. These figures are not a production benchmark: the isolated test server was wired to `DIRECT_URL`, Next development compilation adds cold-start cost, and test load was sequential. Application-code time remains high even after Next compilation for profile edits, so the remote database round trips are the primary optimization target to measure next.

## Improvement order

1. **Benchmark the deployed connection path.** Measure a warmed production build with the runtime `DATABASE_URL` and Redis in their deployed regions. Keep `DIRECT_URL` for migrations. Confirm the application and database compute are geographically close before changing pool sizes.
2. **Add per-operation database spans.** Record transaction wait, query count, and query duration for faculty saves, admin profile edits, and audit reads. The current access log separates Next time from application time but cannot distinguish query wait, Redis, Argon2, and application work.
3. **Reduce profile-save round trips.** `writeOwnFacultyContent` currently replaces six child collections with separate deletes, nested creates, and a full relation reload inside a serializable transaction. Batch child mutations where practical and avoid returning/reloading fields the editor does not need. Preserve version checks, atomic audit writes and draft/published isolation.
4. **Trim admin write transactions.** Activity and faculty update flows read the old row, update it, read it again, and write audit data. Keep the old snapshot required by audit, but consider an optimistic `UPDATE … RETURNING` path to avoid the second read. Keep audit and record mutations atomic.
5. **Avoid doing expired-session sweep work on every audit-page read.** The audit list currently checks Redis and writes queued expiry events before its paginated queries. Measure queue size and sweep time; batch or move this work to a bounded background process if it becomes a frequent source of latency.
6. **Recheck query plans and existing indexes with realistic data volume.** The current integration fixture is small and cannot prove production index adequacy. Use `EXPLAIN (ANALYZE, BUFFERS)` against safe staging data before adding indexes or changing pagination.

Do not raise pool sizes or weaken serializable writes based only on this development-run snapshot. Re-measure the deployed pooled path first, then compare before/after p50 and p95 under representative concurrent load.

## Local PostgreSQL follow-up

After switching local development to PostgreSQL in Docker, the isolated integration suite passed against a temporary local schema. The current development-server log recorded these successful responses:

| Endpoint | Samples | Total p50 | Total p95 / max | Application-code p50 |
| --- | ---: | ---: | ---: | ---: |
| `GET /api/admin/faculty` | 3 | 42 ms | 90 ms / 90 ms | 30 ms |
| `POST /api/admin/faculty` | 7 | 70 ms | 156 ms / 156 ms | 67 ms |
| `PATCH /api/admin/faculty/:id` | 5 | 112 ms | 1,881 ms / 1,881 ms | 82 ms |
| `PATCH /api/admin/faculty/:id/visibility` | 5 | 63 ms | 105 ms / 105 ms | 54 ms |
| `GET /api/admin/activities` | 1 | 48 ms | 48 ms / 48 ms | 46 ms |
| `PATCH /api/admin/activities/:id` | 2 | 46 ms | 88 ms / 88 ms | 44 ms |
| `PATCH /api/admin/activities/:id/visibility` | 2 | 57 ms | 164 ms / 164 ms | 54 ms |
| `GET /api/faculty/profile` | 7 | 73 ms | 375 ms / 375 ms | 70 ms |
| `PUT /api/faculty/profile` | 11 | 125 ms | 369 ms / 369 ms | 122 ms |

The 1,881 ms faculty update was a cold Next.js route compile (1,412 ms in Next.js and 468 ms in application code); subsequent calls to that route were 70–168 ms total. These local results show the development experience after removing Neon network round trips. They are not a controlled before/after benchmark against the earlier Neon run: server warm-up, route compilation, and the database location also changed. Do not claim the same latency on Neon UAT from these figures.

Admin faculty edits, visibility changes, and activity edits now use the updated row returned by the version-checked write instead of issuing a follow-up read. The original row remains available for the audit diff, and optimistic concurrency errors still return 409. The integration suite passed stale-edit, stale-visibility, audit rollback, professor permissions, faculty draft/publish, admin CRUD, and browser UI checks against local PostgreSQL and isolated Redis keys.

The remaining largest improvement opportunity is the professor profile save transaction, which replaces six child collections and reloads relations. Before changing its semantics or transaction isolation, collect Neon UAT traces with query count and per-query timing; local PostgreSQL does not expose the network cost that UAT will see.

## Neon isolated integration run

Ran `npm run test:uat` on 20 October 2026. The harness used the Neon direct connection only to create a random `ctiks_test_<12 hex>` schema, applied migrations there, ran API and Playwright checks, then dropped that schema. Redis keys used the same random namespace. The UAT `public` schema was not used for fixture writes. All integration checks passed, including professor draft/reload/publish/conflict cases, admin CRUD, permissions, audit rollback, session expiry, and both browser UI flows.

The API server ran locally in Next development mode and connected directly to the Neon cluster in `us-east-2`; this is not the deployed UAT application's pooled connection path. Across 11 successful `PUT /api/faculty/profile` requests, total latency was **6.5 s median, 9.7 s p95/max**. The application-code portion had the same 6.5 s median, while Next route overhead was only a few milliseconds once compiled. Successful requests emitted **14–37 Prisma query events (26 median)**. Stale/conflict requests correctly returned 409 and were not included in successful-save latency.

The opt-in query log records only relation/table names and Prisma's duration field, never SQL parameters. A representative save logged 15 events: the six academic relation writes appeared in order as education, experience, courses, publications, patents, and students. Their emitted duration values rose from about 249 ms to 1,498 ms, while simple surrounding statements were about 247–251 ms. The increasing values show accumulated latency through the serial relation-write sequence; do not sum them as independent statement times. This run establishes that repeated database operations dominate the save time, but exact per-statement server execution time would require database-side tracing or explicit statement spans.

### Professor-save optimization follow-up

The save transaction now replaces all six ordered child collections in one parameterized PostgreSQL statement. It also updates an existing revision with one version-qualified write and returns the already validated submitted content instead of reading all six relations back. Serializable isolation, the profile and draft version checks, immutable published revisions, atomic audit writes, and 409 conflict responses remain in place.

The complete isolated suite was rerun against a new random Neon schema and passed, including API draft/reload/publish/conflict cases and both professor and administrator Playwright flows. Across the same 11 successful `PUT /api/faculty/profile` requests, the new result was **3.0 s median and 4.0 s p95/max**, with **8–14 query events (10 median)** when grouped by request boundaries. Compared with the earlier run, median latency fell from 6.5 s to 3.0 s (about **54%**) and median query events fell from 26 to 10 (about **62%**).

The local PostgreSQL run improved from **125 ms median / 369 ms max** to **53 ms median / 152 ms max** for the same successful profile-save requests. These timings still include a local Next development server. The Neon timing still crosses from this machine to `us-east-2` through the direct owner connection, so it is evidence of the round-trip reduction rather than a forecast for the deployed pooled UAT path.

### What to improve next

1. **Benchmark from the deployed UAT region using pooled `DATABASE_URL`.** This run used the direct owner URL from a local development server because the harness needs schema-creation rights. Capture the same request against the deployed UAT app before estimating user-visible latency gains.
2. **Keep the endpoint and query spans.** `CTIKS_DB_QUERY_TIMING=1` enables table-only Prisma query timing; normal dev and UAT requests leave it disabled. Add explicit spans around each profile-save phase if per-statement timing is needed without collecting SQL or personal data.
