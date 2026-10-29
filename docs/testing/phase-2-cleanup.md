Read this if you need the historical Phase 2 findings and their verified follow-up.

# Phase 2: structure and performance review

Reviewed on 29 October 2026 in the Downloads CTIKS checkout, after Phase 1 and
the footer update. Application behavior, public imports, API contracts, database
schemas, configuration keys, and dependencies were preserved.

## Completed changes

Commit `4a43c6b` splits the integration runner along the existing test boundaries.
The runner decreased from 1,085 to 383 lines. Setup, server lifetime, test order,
Redis namespace cleanup, and schema teardown remain in the runner.

| File under `scripts/integration/` | Responsibility                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `http-session.ts`                 | Cookie handling, CSRF-aware requests, and response status assertions                        |
| `migrations.ts`                   | Applying migrations to the generated test schema and checking visibility migration fixtures |
| `faculty-directory.ts`            | Directory validation, visibility, ordering, clearing, and audit checks                      |
| `faculty-accounts.ts`             | Login provisioning, faculty permissions, and ownership checks                               |
| `faculty-deletion.ts`             | Deletion guards, rollback, session revocation, and email reuse                              |
| `audit.ts`                        | Audit filters, export, and immutable history checks                                         |

The CLI entry point and package scripts are unchanged. The HTTP session helper
receives the same origin explicitly instead of capturing it from the runner.
Fixtures return the values needed by later checks; no new test framework or
application abstraction was introduced.

## Verification

| Check                           | Result                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                 | Passed; the same six filesystem tracing warnings remain                                                                           |
| `npm run lint`                  | Passed                                                                                                                            |
| `npm run typecheck`             | Passed, run after integration generation finished                                                                                 |
| `npm test`                      | All 29 tests passed                                                                                                               |
| `npm run test:integration`      | Passed before and after extraction in isolated local schemas                                                                      |
| Integration assertion inventory | All 172 original runner assertion/status calls and their literal messages retained                                                |
| Integration execution sequence  | All 94 PASS lines matched the baseline in the same order                                                                          |
| Additional script type check    | TypeScript API check included the integration runner and helpers; no diagnostics, including unused-symbol checks after extraction |
| Formatting and diff checks      | Passed for the changed files                                                                                                      |

A static import scan covered 224 workspace TypeScript, TSX, and MJS files under
`src`, `scripts`, and `tests`, excluding the generated Prisma client. It found no
cycles and no code files over 500 lines. This scan covers resolvable static
imports, including type imports; it does not prove the absence of dependencies
introduced through computed paths, external tools, or filesystem loading.
Migration files and content imported through filesystem paths were retained.

## Findings

These are review findings, not changes made by this batch. Performance impact
has not been benchmarked under production load.

| Priority | Finding                                                                                                                                                | Why it was left unchanged / suggested follow-up                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Medium   | Six build warnings report broad filesystem tracing in the local-media code.                                                                            | Audit the actual production package and its contents before narrowing tracing. Package inclusion changes need deployment verification.                           |
| Medium   | Audit list/export requests process up to 200 queued session expiries, with sequential audit writes and Redis acknowledgements.                         | A backlog can add request latency. Batching or background processing needs failure/retry tests and a decision about when expiry records become visible.          |
| Medium   | The migration test pool is closed only after successful migration processing.                                                                          | A migration exception can skip closing it. This was also true before extraction. Add a failure-path characterization test before changing resource cleanup.      |
| Low      | Normal `typecheck` excludes scripts and tests. Its included generated integration route types can also disappear while a test server regenerates them. | Broader checking was performed without changing configuration. Consider a separate script/test type-check configuration and sequential CI commands.              |
| Low      | `test:browser` and `test:integration` invoke the same full runner.                                                                                     | Running both repeats schema setup, server startup, and browser work. Document one full-suite command; a separate API-only mode would change the test interface.  |
| Low      | Research professor resolution searches the visible people list for each name.                                                                          | Current datasets are small. A future index must preserve the first-match behavior for duplicate names and should have characterization tests before replacement. |

The faculty overview performs a fixed collection of ORM operations per profile;
the inspected code does not issue a database query for every displayed child row.
Its count and preview queries were left unchanged. Combining them would need
query profiling and result-equivalence tests. Development startup uses synchronous
filesystem checks, but these are startup checks rather than request handlers.

## Additional high-priority finding

**HIGH — Credentials committed in Git history:** the current guide no longer contains
them, but removing a value from the latest file does not remove it from history or
revoke access. The environment owner should identify affected accounts and rotate
the credentials through an approved private process. Do not copy values into issues,
logs, or chat. Repository-history remediation requires an owner decision.

## Deferred documentation work

The README and architecture/backend guides already exist. The Phase 3 work still
includes correcting outdated descriptions, adding a contributing guide and a
complete environment reference, and documenting module ownership. This report
records the Phase 2 work and does not replace those guides.

## Migration-pool follow-up

The historical pool-leak finding above was reproduced by the failure-path test
in commit `d169455`. Commit `43a1cbc` added `try/finally`; the same error is retained
and the pool closes exactly once. Unit tests and the full suite passed in the
working checkout after the fix. All other Phase 2 findings remain unchanged.
Later clean-clone verification exposed separate failures recorded in the
[documentation verification](documentation-verification.md).

Next: [current testing guide](../TESTING.md) and [documentation verification](documentation-verification.md).
