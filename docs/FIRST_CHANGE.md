Read this if you want a small, safe first contribution with a clear success signal.

# Change one footer label

This exercise changes a heading displayed in the footer. It does not add a database field. Start with
[Getting started](GETTING_STARTED.md), including a working local login. A branch is a separate line of source
changes in Git.

## 1. Create a branch

```powershell
git status --short
git switch -c codex/intern-footer-label
```

Success: Git switches to the new branch. The status should be clean apart from known generated files after
starting Next.js. Ask before touching pre-existing work. Run these branch commands once; Contributing uses the
same exercise branch.

## 2. Find the owner

Open `src/config/navigation.ts`. Its `FOOTER_COLUMNS` array supplies headings and links to
`src/components/layout/Footer.tsx`. A component is the React function describing part of the interface. This
configuration is shared by all footer renders.

Find this entry:

```typescript
heading: 'Quick Links',
```

Change only the string to:

```typescript
heading: 'Explore CTIKS',
```

These are excerpts, not complete programs. Do not rename a URL, move an array item, or edit database records.
Changing a label needs no Prisma migration, which is a versioned database structure change.

## 3. View the result

With the development server running, refresh the homepage and scroll to the footer. Expect `Explore CTIKS`,
with the same links underneath it. Also inspect a narrow phone-sized window. Check that the heading and links
remain readable. Use your chosen local port, including 3100 if you followed the conflict recipe.

## 4. Check the code

Stop the development server with Ctrl+C before building, because both use `.next`.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Success: exit zero, 31 passing unit tests, and the build's route list. Known build warnings are described in
[Testing](TESTING.md). Restart the development command from Getting started to inspect the built change again
if needed.

This display-only exercise does not need a new assertion repeating the label. Run the canonical integration
suite from Testing when changing APIs, sessions, validation, CSV imports, autosave, visibility, or database
behavior instead.

## 5. Understand a real failure

The migration-pool regression test is a small example you can read:

```powershell
node --import tsx --test tests/migration-pool.test.ts
```

It should now pass. Before the fix, its message was `close the same pool exactly once`. The expected list
contained one closed pool; the actual list was empty. A pool is reused database connections. The test injected
a query failure and exposed missing cleanup. `finally` now closes it even when processing throws an error.

When a check fails, read the first failure, its file/line, and expected/actual values. Reproduce that specific
check. Do not remove the assertion just to pass.

## 6. Commit only your label

Use the exact-path staging and commit example in [Contributing](CONTRIBUTING.md). Expect a commit containing
only `src/config/navigation.ts`. Do not push during the exercise unless your mentor asks you to share the
branch.

Next: [Contributing](CONTRIBUTING.md), [Testing](TESTING.md), and [Architecture](ARCHITECTURE.md).
