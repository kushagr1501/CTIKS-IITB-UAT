Read this if you changed code or want to understand what a passing check proves.

# Testing

A unit test checks a focused piece of code. An integration test checks interactions with real services.
Playwright controls a real browser. A characterization test records existing behavior before refactoring; a
regression test protects a fixed bug. See the [glossary](GLOSSARY.md) for more terms.

## Choose the check

| Change                                                                        | Checks and success signal                                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type or import changes                                                        | Type check: exit zero with no diagnostics.                                                                                                        |
| Code conventions                                                              | ESLint: exit zero. It is a code rule checker, not a behavior test.                                                                                |
| Date, schema, permission, or CSV helper logic                                 | Unit tests: all tests pass.                                                                                                                       |
| API, auth, persistence, drafts, autosave, CSV import, visibility, or deletion | Full integration suite: final success line and exit zero.                                                                                         |
| UI text or CSS only                                                           | Lint/type/build as relevant, then inspect the changed screen at desktop and mobile widths. Do not add a test that merely repeats a literal label. |
| Packaging and route compilation                                               | Production build: route list and exit zero. A successful build does not prove production hosting works.                                           |

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Current unit summary: 30 passing tests after the migration-pool regression fix. The build currently emits six
known local-media filesystem tracing warnings. These remain logged; do not suppress them as part of an
unrelated change.

## One canonical full-suite command

Finish [Getting started](GETTING_STARTED.md) first. `DIRECT_URL` must point to a local database account able
to create/drop test schemas, and `REDIS_URL` must work. The local template already supplies the local owner
URL. You do not need Neon.

Install the browser once:

```powershell
npx playwright install chromium
```

Success: browser installation completes, or the browser is already available. Then use this one command:

```powershell
npm run test:integration
```

Success: `All integration checks passed in an isolated temporary schema.` and exit zero. The runner prints
PASS lines for its checks; they contain multiple assertions.

A fresh clone passed the full suite with exit zero after the clock fix. Earlier clean-clone runs failed on a
Research save (503), the browser clock, and a Research dialog that did not open. The clock fix is in place;
the two Research failures remain unexplained. See the [verification record](testing/documentation-verification.md)
for every run and the limits of the investigation.

`test:browser` is an alias for the same full runner. Running it as well repeats the database setup, API
checks, and browser checks. There is currently no separate API-only switch. Use `test:integration` once as the
canonical full suite.

### What isolation means

The runner creates a random `ctiks_test_...` PostgreSQL schema, a database namespace, and a matching Redis key
prefix. It applies migrations there, starts a test server on port 3002, and creates temporary accounts. It
removes its schema and keys in cleanup. The ordinary application schema is not seeded with test activities.

It uses `.next-integration` for generated server output. Do not run another copy of this suite at the same
time: the port and build directory are shared. Do not run type checking while integration is regenerating
route types. Run it after. Logs and the success marker are under `.private/integration-server.log` and
`.private/integration-result.json`. A marker from an old run does not prove a new run passed.

The standard TypeScript configuration covers application source and generated route types, not all
scripts/tests. Broader script checking was performed during Phase 2 through a read-only TypeScript API check;
changing the configuration is still a separate task. Do not interpret normal typecheck as full script
coverage.

## Focused failure-path check

The migration-pool test stubs the query method, so it opens no database connection. It injects a query error,
checks error identity, and checks the same pool closes once.

```powershell
node --import tsx --test tests/migration-pool.test.ts
```

Success: one passing test. Before the fix it failed with `close the same pool exactly once`, expected one
closed pool, actual empty list. That was evidence of a resource leak; the fix puts pool closure in `finally`.

## Development server options

If port 3000 is occupied, update the auth origin and start a different web port:

```powershell
node --input-type=module -e "import{readFileSync,writeFileSync}from'node:fs';const p='.env.local';writeFileSync(p,readFileSync(p,'utf8').replace('http://127.0.0.1:3000','http://127.0.0.1:3100'));console.log('Auth URL updated for port 3100.');"
npm run dev -- --port 3100
```

Success: server on port 3100; open `http://127.0.0.1:3100/login`. The generated credential file may still
print the original 3000 address; use the chosen URL with its email/password. This does not change the
password.

To skip background page warm-up in a fresh terminal:

```powershell
$env:CTIKS_DEV_WARMUP = '0'
npm run dev -- --port 3100
```

Success: the server starts without the background warm-up messages. Stop any server already using that port
before starting this alternative. For a bundler-specific issue, the project also has a Webpack fallback:

```powershell
npm run dev:webpack -- --port 3100
```

Success: Next.js reports Webpack and a ready server. Keep the same auth URL. These are alternative starts, not
three servers to run together.

## Stop services without removing data

After Ctrl+C stops your web server, this stops the current Compose project's services:

```powershell
docker compose stop postgres redis
```

Success: the two containers stop; named volumes remain. Keep the same `COMPOSE_` values when using the
isolated recipe. Do not remove volumes just to resolve an error.

## Reading a failure

Find the first failed assertion, its file/line, and expected versus actual values. Check service availability
before debugging business logic. Reproduce with the smallest relevant check. Fix code or a stale expectation
only after understanding the intended behavior; do not weaken a test to turn it green.

Current browser tests freeze the clock for manual-save checks and explicitly advance it for the 1.5-second
autosave test. They also wait for page resources before clicking. These avoid testing a race against
hydration, when React attaches handlers.

UAT and database-role maintenance scripts are outside this first-day workflow. Their source is listed in
[Codebase map](CODEBASE_MAP.md); do not run them against remote data without the owner's instructions.

Next: [First change](FIRST_CHANGE.md), [Contributing](CONTRIBUTING.md), and
[verification record](testing/documentation-verification.md).
