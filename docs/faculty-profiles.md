Read this if you are changing core faculty editing or public academic profiles.

# Faculty academic profiles

Core faculty sign in at `/login` and edit their own linked profile at `/faculty`. A draft is private working
content. Submit & publish updates the current profile immediately; there is no required administrator review
step. Public visibility is separate and remains controlled by the administrator.

## Ownership and editable content

The server resolves the profile from the signed-in user, not a browser-supplied ID. Faculty can edit their
displayed name, designation, department, biography, photo, website, public email, research
summary/tags/overview, office address, and phone. They also edit education, teaching, experience,
publications, patents, and students.

Slug (URL identifier), faculty category, login provisioning, directory order, and public visibility remain
administrator-controlled. Login email is different from public contact email. Faculty cannot edit another
person's profile or access administrator lists/audit history.

Hiding a core profile does not remove the owner's access. Moving the linked profile away from Core Faculty
prevents faculty sign-in/access. Publishing a hidden profile shows a notice and does not make it visible to
the public.

## Draft, autosave, and publishing

Autosave waits for a 1.5-second pause in changes. This debounce resets when typing continues. A pending
research-tag input must first be added to the selected tags. The editor avoids overlapping save operations and
reports validation or session errors. Refreshing after a successful draft save reloads the saved content. Text
still waiting for the timer or a failed save has not reached the database.

Save draft performs an explicit private save. Discard draft removes saved working content and reloads the
current profile after confirmation. Submit & publish makes valid content current immediately and retains the
previous published snapshot as superseded history. Empty strings/arrays explicitly clear optional content.

## Persistence and counters

A revision is a stored academic content snapshot. Its child tables contain ordered education, experience,
course, publication, patent, and student rows. The main `faculty_profiles` record stores directory
identity/visibility and the live summary.

| Value                        | Meaning                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `revisionNumber`             | Sequence identifying a content revision for one faculty profile. |
| `draftVersion`               | Counter detecting changes to that working revision.              |
| `profileVersion` in requests | Main profile counter the browser last loaded.                    |
| `version` on the profile     | Persisted counter detecting stale profile updates.               |

There is no current `sourceProfileVersion` column. Do not reintroduce it from an old screenshot. A stale
request returns HTTP 409 rather than overwriting newer work. Publishing/discarding and revision children are
tested through the real transaction worker in `src/server/faculty/editor.ts`.

## CSV imports

CSV means comma-separated text. Publications and patents each offer a downloadable CSV template and import
control. Keep the template columns in their order. The publication Type header includes Journal article,
Conference paper, Book, Book chapter, and Research monograph. A simple `Type` header is also accepted.

The importer checks quoting, column order/count, types, years, URLs, and entry limits. A preview names the
file and checked entries. Confirmation appends them; cancellation or an invalid file leaves existing rows
intact. Existing entries are not replaced automatically. Blank publication Type defaults to Journal article. A
CSV file is limited to 5 MB; resulting collections permit 500 publications or 100 patents, including existing
rows. Quoted commas and line breaks are supported.

## Media

HTTPS URLs and existing site images remain supported. The development upload controls require development mode
and a local database. Profile and student photos are available for core faculty; PDF upload paths for
publications/patents are currently restricted to the Vijayaraghavan M. Chariar profile. The server checks
ownership and file signatures; the browser filename is not treated as a trusted path.

Publishing/saving asks the server to clean up unused local media in batches. Do not turn this into
unconditional file deletion: a file may still be referenced by a saved draft or published revision.
Development media is not a production storage service, and a private draft does not make a linked public file
URL private.

Public publication/patent entries show attachment actions when a URL is present. Empty academic sections are
omitted from the public profile. Student rows distinguish Current and Graduated status; directory categories
such as Doctoral Students are a separate People-directory concept.

## Open these files

`src/features/faculty/FacultyProfileEditor.tsx` owns state and saves. `FacultyEditorActions.tsx` and
`faculty-text-field.tsx` render extracted UI pieces. `AcademicCsvImport.tsx` handles templates/preview.
`profile-schema.ts` uses Zod, a runtime validator. Server requests reach `src/server/faculty/editor.ts`.
`src/server/faculty/public-profile-query.ts` selects public fields from published content and excludes
login/draft/audit information.

The full suite covers manual save, autosave timing/reload, CSV preview/cancel/errors, imports, publish,
ownership, conflicts, explicit clearing, and retained history.

Next: [Testing](TESTING.md), [Architecture](ARCHITECTURE.md), and
[module notes](../src/features/faculty/README.md).
