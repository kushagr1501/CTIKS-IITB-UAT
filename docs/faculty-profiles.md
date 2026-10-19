# Faculty academic profiles — schema phase

This phase supplies the database foundation. The current admin editor, read-only
faculty dashboard, public People cards and account permissions continue to work
as before. Self-editing, review endpoints and full public profile pages are the
next implementation phase; the schema alone does not enable them.

## One identity, several content revisions

`FacultyProfile` remains the single identity record. Its ID, slug, category,
designation, department, account link, directory position and visibility remain
admin-controlled. Existing professors use their existing record and login.
Creating a login later continues to attach it to that same profile.

`FacultyProfileRevision` holds the editable biography, photograph, website,
public email, research tags/overview, office address and public phone. Every
repeatable academic entry belongs to a revision, not directly to the identity.
This lets a complete draft be edited without changing the published version.
Login email and credential hashes stay in the existing account models.

| Table                       | Purpose                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `faculty_profile_revisions` | Content snapshots, revision numbers, edit version, submission/review metadata                           |
| `faculty_education`         | Qualification/title, institution, description, free-text period                                         |
| `faculty_experience`        | Position/title, organisation, description, free-text period                                             |
| `faculty_courses`           | Course title/code, description, period, CURRENT/PREVIOUS status                                         |
| `faculty_publications`      | Type, title, authors, venue/publisher, year, citation, DOI and URL                                      |
| `faculty_patents`           | Title, inventors, identifier, status, year, description and URL                                         |
| `faculty_students`          | Name, programme, topic, supervision role, period, CURRENT/GRADUATED status and optional graduation year |

Education and experience periods are text, accepting values such as `2018–Present`
or `Autumn 2024`. Every academic collection has its own zero-based display order.
Authors and students are public academic text, not login accounts. Publications
support journal articles, conference papers, books, book chapters and monographs.
Patents are separate. Current/past courses and current/graduated students each
share one table with a status rather than duplicating the same kind of record.

## Planned editing and publication contract

1. Admin creates a minimal identity and optionally provisions its core faculty login.
2. On first edit, clone the accepted content and all children into one DRAFT revision.
3. The professor saves their own draft, using its `version` for optimistic concurrency.
4. Submit freezes that working draft as SUBMITTED for admin review.
5. Admin either requests changes with a note, or approves and publishes.
6. In one transaction, retire the prior PUBLISHED revision as SUPERSEDED, publish
   the new one, update the legacy directory projection, increment the profile
   version and append the audit event. Publishing must not change visibility.

Partial unique indexes allow at most one working revision (DRAFT, SUBMITTED or
CHANGES_REQUESTED) and one PUBLISHED revision per profile. Older snapshots retain
their own academic entries. Revision numbers are unique per profile. Allocate
them inside a transaction with concurrency handling. All child edits also bump
the owning revision version; changing a child must not bypass conflict detection.
Published/superseded content must be read-only in services. These SQL constraints
do not enforce the full transition graph, reviewer role or profile ownership.

The future write service must look up the faculty ID from the signed-in user,
restrict self-editing to linked core faculty, validate allowed fields and URLs,
and use existing CSRF/session checks. Only admins may review, publish or alter
identity/category/visibility/account access. Neither account credentials nor
private revision/review metadata may be selected by public profile queries.
An admin account must not be able to publish through a faculty self-edit endpoint.

## Existing core professors and rollout

Migration `202610190004_faculty_academic_profiles` is additive and transactional.
It copies each existing CORE profile into revision 1 as its accepted baseline,
including hidden profiles and profiles without accounts. It does not change
profile rows, visibility, account links, passwords or existing audit records.
PUBLISHED describes accepted content; it does not make a hidden profile public.
No historical reviewer is invented for these baseline snapshots.

Existing interests are copied verbatim as a transitional fallback. Research tags
start empty; education, courses and other entries start empty. Do not infer
qualifications or split prose into tags automatically. In the future editor,
confirmed tags become the single tag source for both the directory and full
profile; retain legacy interest text only as a fallback until that conversion.

During this schema-only phase the existing profile columns remain the live source.
`sourceProfileVersion` records the version copied into each revision. Before
activating the editor, reconcile any admin edits made since this migration. A
stale baseline must be refreshed through a new snapshot before opening a draft;
never overwrite a professor's working draft. The next phase must integrate both
admin writes and faculty writes before switching public reads to revisions.
New profiles created during the interim may have no revision; initialize them
from their current data when the new workflow is enabled.

First-login password changes and credential delivery are separate application
work. This migration neither forces password resets nor sends credentials.
For future temporary logins, implement first-login enforcement through the auth
workflow before describing that behaviour as available.

## Verification and operation

Run `npm run test:faculty-schema` to apply all migrations in a generated isolated
PostgreSQL schema and exercise backfill, draft isolation, constraints and cascade
cleanup. It requires the migration-owner connection and never edits public data.
Run `npm run db:generate` and `npm run typecheck` after model changes.

Apply with `npm run db:migrate`. The migration grants the existing restricted
`ctiks_app` role access to the new content tables when that role exists.
`npm run db:restrict` also includes those grants for new installations.
Application permissions remain unchanged until the editing phase is implemented.
