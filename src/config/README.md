Read this if you are working on shared configuration in source.

# Shared configuration in source

These are checked-in labels and policies, not machine secrets.

Tool terms: [glossary](../../docs/GLOSSARY.md).

## Open these first

| Path in this folder  | Role                                            |
| -------------------- | ----------------------------------------------- |
| `navigation.ts`      | Public navigation and footer link groups.       |
| `assets.ts`          | Named paths to images.                          |
| `password-policy.ts` | Password length bounds shared by UI and server. |

## Connections and gotchas

Changing an address can affect links across the site. Environment credentials belong in ignored local files,
not this directory.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../docs/CODEBASE_MAP.md) and [Testing](../../docs/TESTING.md).
