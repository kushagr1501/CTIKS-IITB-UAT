Read this if you are working on retained action history.

# Retained action history

Audit records describe account and content actions. Runtime database access must not permit normal edits to
their history.

Tool terms: [glossary](../../../docs/GLOSSARY.md).

## Open these first

| Path in this folder | Role                                             |
| ------------------- | ------------------------------------------------ |
| `write.ts`          | Safe audit record construction and writes.       |
| `service.ts`        | Pagination, export, and queued expiry recording. |
| `csv.ts`            | CSV encoding and spreadsheet-formula protection. |

## Connections and gotchas

Do not remove an audit write from a content transaction. Expiry processing acknowledges Redis only after a
successful database write; batching needs failure/retry review.

These notes describe code responsibility. Ask your mentor for the human reviewer assigned to this area; the
repository does not name one.

Next: [Codebase map](../../../docs/CODEBASE_MAP.md) and [Testing](../../../docs/TESTING.md).
