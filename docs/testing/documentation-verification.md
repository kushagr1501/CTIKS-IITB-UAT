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

| Check                          | Working checkout after pool fix          | Clean clone                                              |
| ------------------------------ | ---------------------------------------- | -------------------------------------------------------- |
| Focused pool regression        | Passed                                   | Passed; one test, no database connection opened.         |
| Unit suite                     | 30 passed                                | 30 passed.                                               |
| ESLint                         | Passed                                   | Passed.                                                  |
| Type check                     | Passed                                   | Passed, including a final run after integration stopped. |
| Production build               | Passed; six existing tracing warnings    | Passed; same six warnings.                               |
| Full integration/browser suite | Passed; final success line and exit zero | Two attempts failed as described below.                  |

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
- The two clean-clone full-suite failures need a separate investigation.
- The install's dependency advisories were not remediated in this documentation task.
- Database-role maintenance tools were read, not run. Their forced TLS and current Research grants need review
  before deployment; they are not the local setup path.
- Previous credentials in Git history need owner review. Removing them from a current guide does not rotate
  accounts or erase history.
- No fresh Windows/Linux installation, IITB server deployment, reverse proxy, certificate setup, SMTP
  delivery, campus/VPN access policy, production upload storage, backup restoration, or production load
  measurement was tested.
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
