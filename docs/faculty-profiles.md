# Faculty academic profiles

Core professors sign in at `/login` with their existing faculty account and edit
all academic content at `/faculty`. **Submit & publish** makes changes live
immediately, without administrator review. **Save draft** keeps unfinished edits
private. Existing accounts and imported content are reused; no password reset or
new account is required.

## Editable content

- Biography, photograph URL, personal website and public email.
- Short directory research summary, research tags and research overview.
- Education and work experience, with free-text dates or periods.
- Current and previous teaching.
- Journal articles, conference papers, books, book chapters and monographs.
- Patents, current/graduated students, office address and public phone.
- Optional student photo URLs and social/academic links, shown on public student cards.

Repeatable entries can be added, edited, removed and reordered. Empty optional
fields and empty collections explicitly clear content when submitted. Links use
HTTPS; photographs also accept existing `/assets/` paths. Student photos use URL
inputs and load lazily with an initials fallback if an image fails. Uploading
new files and downloadable attachments are not implemented. Login email is
separate from public email.

Each student can have one link per supported platform: personal website,
LinkedIn, Google Scholar, ORCID, ResearchGate, GitHub, X and Instagram. The
editor offers platform choices, editable URL inputs and individual remove
buttons. Empty optional photos and empty link arrays explicitly clear prior
values. Photo/link data stays inside revision snapshots, so drafts remain
private and accepted history retains its own values.

Name, slug, category, designation, department, account access, directory order
and visibility remain administrator-controlled. Publishing a hidden profile does
not make it visible. Every faculty request resolves ownership from the live
session user and linked CORE profile; clients cannot supply a target profile ID.
Faculty cannot access another professor's editor or administrative APIs.

## API and persistence

`GET /api/faculty/profile` returns an explicit editor DTO: public identity,
profile/draft versions and editable content. It never returns account hashes,
other faculty records or review metadata. An existing private draft takes
precedence over published content. A new profile without revisions starts with
its current basic fields and empty academic collections.

`PUT /api/faculty/profile` accepts a strict full-content payload:

```json
{
  "action": "save | publish | discard",
  "profileVersion": 1,
  "draftVersion": null,
  "content": { "...": "all editable content fields" }
}
```

The shared validation contract is `src/features/faculty/profile-schema.ts`.
Requests require an authenticated linked core faculty account, the
`faculty.self.update` permission, a trusted Origin and a signed CSRF token.
Bodies are bounded to 1 MiB; field lengths and collection sizes are bounded.
Unknown identity, account, review and child ownership fields are rejected.

Saving creates or updates one DRAFT revision and its academic children in a
serializable transaction. Publishing atomically supersedes the previous
PUBLISHED revision, publishes the working revision, updates the root directory
projection, increments its version and records an audit event. Accepted history
and its child records are retained. Failed writes roll back together.

Both root and draft versions prevent stale tabs from overwriting newer edits.
A draft whose source profile was changed by an administrator must be discarded
and restarted from current content. Discard also checks both versions and is
explicitly confirmed in the UI. Submitted legacy review records are blocked for
administrator handling; this editor does not create review submissions.

The database retains the existing revision statuses and partial unique indexes:
at most one working revision and one PUBLISHED revision per faculty profile.
Migration `202610190005_student_photo_social_links` adds optional `imageUrl` and
bounded JSON `socialLinks` fields to student rows, defaulting to an empty URL and
empty array. It preserves existing students and requires no new permissions.

## Public pages

Visible CORE cards open `/people/[slug]`. The directory and profile introduction
read current basic fields; academic sections select only the PUBLISHED revision.
Public queries never select drafts, accounts or private revision metadata.
These reads are dynamic; a new request sees committed submissions. Public links
from the editor open a fresh tab. Missing sections display `Not added yet.`.
There is no sample-data substitution on actual pages.

All core professors share the existing CTIKS layout. Section navigation appears
on desktop and is hidden on mobile/tablet. Teaching and students are grouped by
status, and publications by type. Non-core directory behavior is unchanged.

## Tables and rollout

`FacultyProfile` is the existing identity and account link.
`FacultyProfileRevision` owns the biography, photo, website, public email,
directory interests, research tags/overview and contact details. Academic rows
belong to revisions in `faculty_education`, `faculty_experience`,
`faculty_courses`, `faculty_publications`, `faculty_patents` and
`faculty_students`.

Core faculty can edit their name, designation and department in the same private
draft as the rest of their profile. Publishing updates those public identity
fields with the revision; the profile URL, account linkage and visibility remain
administrator-managed. Migration `202610200001_faculty_editable_identity` adds
nullable revision values so existing published profiles and drafts keep their
current identity until edited.

Migration `202610190004_faculty_academic_profiles` copied existing CORE profiles
into accepted baseline revisions, including hidden profiles and those without
accounts. It preserved passwords, identity, visibility and audit history. The
restricted runtime role already has access to the academic tables. New
installations use `npm run db:migrate` and `npm run db:restrict`.

Legacy directory interests are preserved verbatim; the editor does not infer
research tags by splitting prose. The editor labels this field “Short description
on faculty card” and explains where it appears. Detailed research tags remain
separate so cards can remain brief.

## Verification

`npm test` covers validation and permission boundaries. `npm run test:integration`
uses an isolated temporary PostgreSQL schema, Redis namespace and local server
to exercise the actual faculty API, drafts, publishing, ownership, CSRF,
concurrent edits, explicit clears, accepted history, hidden profiles and audit.
It does not edit real faculty accounts or profiles.

`npm run test:faculty-schema` additionally verifies migrations and SQL constraints.
Credential delivery and first-login password enforcement remain separate work;
this editor neither emails credentials nor forces password changes.
