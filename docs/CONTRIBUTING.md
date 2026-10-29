Read this if you are preparing a change for another developer to review.

# Contributing

A branch is a named line of changes. A commit records a change. A pull request (PR) asks teammates to review
it before merging. See [Getting started](GETTING_STARTED.md) before changing code and
[First change](FIRST_CHANGE.md) for a worked example.

## Keep work small

Start from the reviewed source version supplied by your mentor. These examples use the `codex/` branch prefix
used for this workspace's tasks. Your mentor may assign a different branch. Do not assume the remote branch
protection settings.

```powershell
git status --short
git switch -c codex/intern-footer-label
```

Success: a clean status before you begin, then Git confirms the new branch. If you see another person's
changes, stop and agree ownership before staging them.

Change one behavior or one module at a time. For a cleanup, preserve APIs, data formats, settings, and
database schema. Record suspected bugs separately rather than quietly fixing them in the same patch.

## Code conventions

| Convention                     | Why                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript              | Catch uncertain value shapes before execution. Avoid using `any` to silence an error.                                                    |
| Zod validation on the server   | Browser input is untrusted. Zod checks real values at runtime; TypeScript cannot do this after compilation.                              |
| Central HTTP errors            | Use the existing `HttpError`/`errorResponse` patterns. Keep database details, SQL parameters, and secrets out of responses and logs.     |
| Direct imports                 | Import concrete files. Use `@/` across folders and relative imports inside a feature. Avoid new barrel re-export files.                  |
| Small server/client boundaries | Browser components manage interaction; services own access checks and database writes. Never import a database client into browser UI.   |
| Existing styling               | Reuse Tailwind utility classes or a nearby CSS Module, a component-scoped stylesheet. Do not add a styling framework for one screen.     |
| Existing formatter             | Prettier uses single quotes, trailing commas, and a 110-character print width. Keep formatting-only changes separate from logic changes. |
| Why-comments                   | Explain constraints, security decisions, or unusual behavior. Avoid comments that simply repeat a statement.                             |

The installed Next.js guides under `node_modules/next/dist/docs` are required reading before changing
framework conventions. See `AGENTS.md` at the root. Do not edit generated Prisma or Next.js files; regenerate
them through the setup commands.

## Checks and commits

Run the checks selected in [Testing](TESTING.md). Use the full integration suite for protected writes, access
control, draft/publish behavior, and persisted content. Run type checking after integration finishes. Inspect
the affected screen at desktop and mobile widths even when all automated checks pass.

For the example from First change:

```powershell
git diff --check
git diff --stat
git add -- src/config/navigation.ts
git diff --cached
git commit -m "ui: clarify footer heading"
```

Success: no whitespace errors, only your intended file staged, and a commit hash. `--cached` means the changes
staged for the next commit. Stage exact paths rather than adding unrelated local files. Messages should name
the result, such as `fix(tests): close migration pool after failure` or `docs: explain local setup`. There is
no commit-message enforcement configured by these docs.

Never commit `.env.local`, `.env.migrations.local`, `.private`, passwords, generated code, or build output. Do
not publish a branch unless the task authorizes it. Ask your mentor which review process and destination
branch to use.

## PR checklist

- [ ] Explain the problem and the resulting behavior in plain language.
- [ ] Keep the diff focused and separate formatting-only changes.
- [ ] Record which checks ran, their results, and any known warnings.
- [ ] Include a screenshot for a visible change and say which widths you checked.
- [ ] Preserve access guards, request validation, stale-version checks, and audit writes.
- [ ] For a database change, obtain review of the migration and data/backfill plan.
- [ ] Update the relevant docs and verify links and copy-paste commands.
- [ ] List anything you could not verify. A build is not proof of live deployment.
- [ ] Confirm no secrets or unrelated local changes are staged.

Next: [First change](FIRST_CHANGE.md), [Testing](TESTING.md), and [Codebase map](CODEBASE_MAP.md).
