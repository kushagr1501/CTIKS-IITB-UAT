Read this if you need the evidence and limits behind the Phase 3 guides.

# Documentation verification: 29 October 2026

The current setup guides were checked against source and exercised in a new clone. This was a clean project
checkout on an existing Windows machine, not a new operating system installation. A clone is a separate Git
copy; a container volume is separate storage for a service. See the [glossary](../GLOSSARY.md).

## Scope and source

- Working repository: the Downloads CTIKS checkout, not the older footer worktree.
- `d169455` adds the migration-pool failure test. It failed before the fix.
- `43a1cbc` closes the pool with `try/finally`. The same test passes afterward.
- `b92f344` contains the initial onboarding guides and the fixed application code. The clean clone used that
  local source because these commits were not pushed.
- No other Phase 2 finding was fixed. Its original findings text remains intact.
- Documentation groups are separate local commits. Nothing was pushed.

## Machine and clean-clone walkthrough

| Item                 | Observed result                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Versions             | Node 26.12.1, npm 11.4.1, Git 2.45.2.windows.1, Docker 29.1.3, Compose 5.0.1.                                                                |
| Clone                | New copy at `C:/Users/skush/AppData/Local/Temp/ctiks-web`; no environment, credential, or dependency files copied from the working checkout. |
| Install              | Fresh `npm ci` installed 654 packages. It reported two moderate dependency advisories; packages and lock file were left unchanged.           |
| Settings             | Copied `.env.example`, generated a new auth secret, ran Redis setup. Secret values were not printed or committed.                            |
| Isolation            | Used the documented `ctiks-intern` Compose project and alternate ports 15433/16380. This created new PostgreSQL and Redis volumes.           |
| Service start        | Both containers healthy. Existing developer containers were left running.                                                                    |
| Database             | Generated Prisma Client; applied all 21 migrations; seeded 13 faculty profiles and a new local administrator.                                |
| Web port             | Default start reported `EADDRINUSE` on occupied port 3000. Updated the auth origin and successfully used documented port 3100.               |
| Browser              | Headless Chromium opened Home and People, signed in with the new generated administrator, and opened People directory and Activities.        |
| Startup alternatives | Normal startup, warm-up disabled, and the Webpack fallback started. Webpack reached its ready signal.                                        |
| Browser install      | The documented Chromium install command exited zero. Browser files were already cached on this machine.                                      |
| Service stop         | The documented stop command stopped only the two `ctiks-intern` containers. Volumes and the clone were retained.                             |

The commands in the current onboarding, contribution, first-change, and testing walkthroughs were executed.
Template values were replaced with this local repository and the documented alternate-port choices. Expected
output in a guide describes a success signal; the failures below are also part of the evidence.

## First-change exercise

The clone used branch `codex/intern-footer-label`. Only the first footer heading in `src/config/navigation.ts`
changed from `Quick Links` to `Explore CTIKS`. The heading and People link were checked at viewport widths
1440 and 390 pixels.

The exact-path staging and commit steps produced clone-only commit `81d0e90`, `ui: clarify footer heading`. It
contains only that configuration file. This tutorial change was not copied into the working repository or
pushed.

## Checks and observed outcomes

| Check                          | Working checkout after pool fix          | Clean clone                                                                       |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Focused pool regression        | Passed                                   | Passed; one test, no database connection opened.                                  |
| Unit suite                     | 30 passed                                | 30 passed.                                                                        |
| ESLint                         | Passed                                   | Passed.                                                                           |
| Type check                     | Passed                                   | Passed, including a final run after integration stopped.                          |
| Production build               | Passed; six existing tracing warnings    | Passed; same six warnings.                                                        |
| Full integration/browser suite | Passed; final success line and exit zero | Two original failures; one later failure and one green retry, as described below. |

The first clean-clone full-suite attempt passed Activities, Research API checks, faculty permissions/drafts,
autosave/CSV browser checks, deletion, audit history, session expiry, and the administrator People browser
workflow. The Research browser save then returned HTTP 503. Its Add research area dialog remained open; the
test expected zero dialogs and found one after 20 seconds.

The server log shows `POST /api/admin/research 503`. Both service containers were healthy when inspected
afterward. The Redis wrapper maps storage-operation errors to 503, but the captured log does not establish the
underlying cause. It is not valid to label this a proven transient network error or a proven Research form
bug.

One unchanged retry passed Activities, Research API checks, and faculty service checks. It stopped in
`scripts/integration/browser-ui.ts` at `page.clock.pauseAt(new Date())`, with
`Cannot fast-forward to the past`. This is a browser test clock failure. Its timing cause was not repaired in
this scope.

Neither failed clean-clone run produced a success marker. They must not be reported as a green full suite.
There was no third retry and no test expectation was weakened.

Evidence remains in ignored local files:

- Working checkout: `.private/phase3-pool-integration.log` and `.private/phase3-pool-build.log`.
- Clean clone: `.private/documentation-build.log`, `.private/documentation-integration.log`, and
  `.private/documentation-integration-retry.log`.
- The integration server log is overwritten per run. The latest copy describes the retry.

## Follow-up investigation and clean-clone runs

The two earlier failures above remain historical results. The original failing
server log was overwritten by its retry, and the Redis wrapper suppresses the
underlying exception. The current code has one application-generated 503 path:
`redisOperation`, used by the session and account rate-limit checks. This narrows
the original response to that guard, but cannot identify which Redis operation or
underlying error failed. It does not prove an application defect or a setup error.

The working checkout used localhost port 16379; the earlier clean clone used 16380. In each, the URL password matched that checkout's Redis configuration, and
no inherited REDIS_URL override was present. Both containers subsequently passed
authenticated PING and were healthy. This confirms current connectivity, not what
happened at the time of the original 503. No setup or application change was
justified by the available evidence.

Commit `f9a4b0d` addresses the clock failure. The browser's clock can advance
while a Node-supplied current time travels to it. The test now pauses one minute
in the future, while keeping the existing manual-save and autosave assertions.
Targeted ESLint and all 30 unit tests passed.

A new clone at `C:/Users/skush/AppData/Local/Temp/ctiks-phase3-followup` used
fresh dependencies, environment settings, a separate Compose project and volumes,
PostgreSQL port 15434 and Redis port 16381. Its source included the clock fix.

1. First full run: exit 1. Faculty manual-save and autosave browser checks passed.
   After the Research page loaded, its Add area click did not produce the expected
   dialog within 20 seconds. The captured log does not establish why.
2. Second full run: exit 0, including the faculty and Research browser checks and
   the final line `All integration checks passed in an isolated temporary schema.`

The green retry does not explain the earlier 503 or the failed dialog click. No
assertions were removed or weakened. Each run's output and server log are retained
in the new clone under `.private/followup-1.log`, `.private/followup-1-server.log`,
`.private/followup-2.log`, and `.private/followup-2-server.log`.

## Additional Research investigation

In an isolated local clone, a browser test deliberately held JavaScript requests
while loading the Research admin page. The Add area button was visible and
enabled before React attached its handler; clicking it did not open the dialog.
After JavaScript loaded and the handler was attached, clicking opened the dialog.
This confirms an early-interaction gap that can affect users with slow loading.
It is a plausible explanation for the earlier test failure, but the earlier run
did not capture hydration state, so its exact cause is still unproven.

With the same isolated services, an authenticated Research request returned 200
before Redis was stopped. After stopping Redis it returned 500, not the earlier 503. Redis was restarted afterward. This experiment confirms that a complete
Redis outage is not sufficient evidence for the earlier 503's specific cause.
The original exception remains unavailable; at the time, the application discarded
the underlying error inside `redisOperation`. The follow-up below added safe
diagnostics and preserved individual integration server logs.

The demonstrated early-click gap was addressed in the follow-up below with a browser test
that delays hydration. The earlier 503 and the observed 500 during a complete
Redis outage should also be investigated separately. No production database or
existing developer Redis instance was stopped for these experiments.

## Hydration and diagnostics follow-up

Research Add area is disabled until React attaches its handlers. The same pattern
was found and guarded on Research row actions; People add, edit, visibility and
delete; Activities add, edit, visibility and delete; and Audit log detail actions.
Other non-dialog controls were not changed. The Playwright test delays scripts,
checks the disabled Research button, then checks the dialog opens after hydration.
The pre-existing browser assertions remain in place.

Redis guard failures now log a fixed operation name and a safe message. Recognized
messages are retained; connection details and unfamiliar messages are redacted to
avoid logging credentials or user data. The HTTP 503 response is unchanged. This
does not identify the cause of the original incident. Each integration server log
now has a unique filename and its path is printed in that run's output.

Five sequential full-suite runs used a fresh clone at
`C:/Users/skush/AppData/Local/Temp/ctiks-hydration-five`, with separate local
PostgreSQL and Redis containers. All five passed with exit zero and the success
line, including the delayed-hydration test. Paths below are relative to that clone:

- Run 1 : exit=0 success=True Integration server log: .private/integration-server-ctiks_test_2e43e588f564.log output=.private/five-run-1.log
- Run 2 : exit=0 success=True Integration server log: .private/integration-server-ctiks_test_a0b04cb98b0a.log output=.private/five-run-2.log
- Run 3 : exit=0 success=True Integration server log: .private/integration-server-ctiks_test_fe988a31ebe7.log output=.private/five-run-3.log
- Run 4 : exit=0 success=True Integration server log: .private/integration-server-ctiks_test_994fbf2369e0.log output=.private/five-run-4.log
- Run 5 : exit=0 success=True Integration server log: .private/integration-server-ctiks_test_448133aa5822.log output=.private/five-run-5.log

Unit tests passed (31), as did lint and type checking. A direct injected Redis
failure check confirmed the 503 response and redacted a simulated connection URL.
The original 503's underlying exception and the original failed click's exact
cause are still unknown. A complete Redis outage previously returned 500 and
remains a separate finding.

## Documentation checks

All current reference claims were traced to source, configuration, package metadata, or the installed Next.js
guides. Environment names were checked against application reads, script reads/assignments, and the
environment schema. Tool-inherited settings are explicitly outside the environment reference's scope.

Local Markdown links, heading anchors, opening/closing navigation, line counts, and module-file references
were checked. The 51 Markdown files have 189 valid local links/anchors; the longest has 183 lines. The module
tables name 115 existing paths. The architecture file was renamed from lowercase to `ARCHITECTURE.md`; its
content was updated. No source or documentation file was removed. Suspected orphan notes are in
[Codebase map](../CODEBASE_MAP.md).

## Remaining findings and review limits

- All other [Phase 2 findings](phase-2-cleanup.md) remain open and unchanged.
- The original Redis-backed 503 and the later Research dialog failure still need investigation.
- The install's dependency advisories were not remediated in this documentation task.
- Database-role maintenance tools were read, not run. Their forced TLS and current Research grants need review
  before deployment; they are not the local setup path.
- **Low — Credentials in Git history:** UAT admin password in history, repo private, single owner; rotate before adding collaborators.
  Editing the current guide does not revoke the password or erase history.
- No fresh Windows/Linux installation, IITB server deployment, reverse proxy, certificate setup, production
  upload storage, backup restoration, or production load measurement was tested.
- No remote UAT, import/publish/restore, or database-role provisioning commands were run. Historical reports
  retain old command records; those are not current walkthroughs and were not all repeated. Historical
  content-source and font-download provenance were retained as records, not independently re-collected.
- The Mermaid diagram's source was reviewed against code; its visual rendering in every Markdown viewer was
  not tested. Named human module reviewers are not recorded in the repository and must be assigned by the
  team.
- GitHub may still be behind these local commits. No push, PR, or deployment was performed.

## Coverage checklist

| Deliverable                            | Status                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Root README and quickstart             | Exists; walkthrough exercised.                                              |
| Getting started and troubleshooting    | Exists; clean clone and port-conflict path exercised.                       |
| Architecture, diagram, real edit trace | Exists; source checked; diagram rendering needs review.                     |
| Codebase map and risk notes            | Exists; source checked.                                                     |
| Contributing and PR checklist          | Exists; local branch/stage/commit exercise completed.                       |
| First change                           | Exists; tutorial completed in clone.                                        |
| Environment reference                  | Exists; explicit project keys checked; deployment values need owner review. |
| Testing and overlapping command note   | Exists; successes and failures both recorded.                               |
| Glossary                               | Exists; linked throughout current guides.                                   |
| Major-directory module notes           | Exists; 28 new notes; human reviewer assignment needs review.               |
| Activities/backend/faculty references  | Exists; outdated behavior descriptions corrected.                           |
| Missing requested document             | None.                                                                       |

Next: [Getting started](../GETTING_STARTED.md), [Testing](../TESTING.md), and
[Phase 2 findings](phase-2-cleanup.md).
