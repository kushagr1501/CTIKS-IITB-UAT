Read this if you are changing the Activities editor, public lists, or homepage panels.

# Activities

An activity is one stored item shown as News, Announcements, Events, or a combination of those types. The
administrator edits it at `/admin/activities`. A past/upcoming state is a time filter, not a fourth category
or another stored copy.

## Editor fields

| Field                   | Meaning                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Title and description   | Required public text. Long descriptions expand in the list.                                     |
| Sections                | One or more of News, Announcements, Events. Each item is saved once.                            |
| Image URL               | Optional HTTPS image or existing `/assets/` image.                                              |
| Supporting PDF URL      | Optional HTTPS document URL. The server does not fetch it to prove the remote content is a PDF. |
| Start/end date and time | Optional schedule, entered in India time. Dates without times are supported.                    |
| Venue                   | Optional location text.                                                                         |
| Link URL and label      | Optional HTTPS action link; blank label means More info.                                        |
| Visible                 | Whether public pages may select the item. Hidden entries remain editable.                       |

Dates are converted from India time to UTC, a shared timestamp reference, before storage in PostgreSQL. The
`eventHasTime` field preserves whether times were given. If a start time is supplied, an end date/time is
required. End must follow start. Dates without times are allowed. An end date needs a start date. Clearing
schedule inputs removes the schedule; clearing optional strings removes their stored values.

In development with a local database, the editor also supports manual image and PDF uploads. Image signatures
must match JPEG, PNG, or WebP and be at most 8 MB; PDFs must have a PDF signature and be at most 25 MB. A
selected upload replaces the corresponding URL on save. Image clicks open an enlarged poster view. Files are
outside the source directory; their returned paths are stored in records. This local facility is not enabled
for production hosting.

## Public lists and time filters

- `/activities` shows all types. `/news`, `/announcements`, and `/events` select a type.
- Type pills show counts for the selected search and time filter. A multi-type item counts once in All and
  once in each selected type.
- Upcoming / Past / All is the separate time filter. It applies to every type. Undated items appear in All,
  not Upcoming/Past.
- Events defaults to Upcoming. If no upcoming item matches and the user did not explicitly select a time
  filter, it falls back to Past when past items exist. The page explains this fallback. News, Announcements,
  and All activities default to All.
- An explicit `?time=upcoming` does not trigger that fallback. `/past-events` redirects to
  `/events?time=past`; `/campus-updates` redirects to `/activities`.
- Listing order is creation date descending, then ID descending, with 12 entries per page. Editing an item
  does not make its creation date newer.
- Search waits for a 350 ms typing pause; Enter flushes it immediately. This is a debounce, meaning delayed
  work resets while the user is still typing. Search updates the URL, removes an old page number, and
  preserves an explicit time filter.

The time filter uses stored timestamps, not a stored Past flag. An end timestamp at or before now is past. A
timed start without an end is a legacy case: it becomes past after its start. A date-only start without an end
uses a 24-hour cutoff. The exact date-only boundary is inclusive on the homepage and exclusive in the upcoming
listing. That known difference is preserved, not silently corrected here.

## Homepage selection

Upcoming events includes visible eligible events, sorted by start ascending and then ID ascending, with up to
12 records. Ongoing events with a future end remain eligible. It is not a single newest-created event. Recent
announcements selects the two newest visible announcements by creation date and ID. Both panels read the same
database content as the public lists.

## Server boundary and data

Open `ActivityEditor.tsx` and `ActivityManager.tsx` for the UI. UI means the visible interface. Follow their
requests into `src/app/api/admin/activities`, then `src/server/activities/schema.ts`, `service.ts`, and
`public.ts`. Zod validates real request values. A transaction commits content and its audit history together.
The `version` counter rejects a stale edit with HTTP 409. Mutations require a session, permission, and CSRF
protection; hiding a button is not enough.

The `activities` table contains the sections array, schedule, image/document URLs, link data, visibility, and
version. Supporting-document and optional-time columns arrived through the two 28 October migrations. The
retired Campus Updates enum value remains only for migration compatibility; requests cannot select it.

## Verify a change

Use the unit and canonical full-suite commands in [Testing](TESTING.md). The integration suite checks
permissions, dates/clearing, public lists, homepage selection, search, pagination, stale edits, visibility,
and audit rollback. A real image's visual quality still needs browser inspection.

Next: [Testing](TESTING.md), [Environment](ENVIRONMENT.md), and
[module notes](../src/features/activities/README.md).
