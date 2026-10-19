# Activities CMS

## Workflow

Open **Administration → Activities → Add activity**. Enter a title and one
description, select News, Announcements and/or Events, then save. Visible is
selected by default. Hidden entries are editable and never appear publicly.
The creation date is automatic. There is no separate publication date or expiry.

Optional fields: image URL, venue, HTTPS link URL, link label, start date
and time, end date and time. Date/time pairs are entered in IST and converted to
UTC before saving to PostgreSQL `timestamptz` columns. End must be after start.
Clear both inputs in a pair to remove that timestamp; clear text inputs to remove
optional text/links. No detail view is required: public cards show the description.

## Public display

- `/activities` lists all visible entries. `/news`, `/announcements`, `/events`
  filter the same records by section. Each has search and 12 entries per page.
- Entries sort by `createdAt DESC, id DESC`; updates preserve creation order.
- The public list follows the Activities design: paper background, compact patterned
  banner, category counts, keyword search, and optional thumbnail and metadata.
  Long descriptions expand in place with Read Full / Read Less. Counts include
  all matching visible entries across pages; a multi-category entry counts once
  in All and once in each of its categories. Search is retained when changing tabs.
- Keyword search waits 350 ms after the last keystroke. Enter searches immediately;
  composed text waits until composition finishes. Navigation and unmount cancel
  the pending timer. Matching pending requests are deduplicated, and searches
  replace the current URL without adding history entries or retaining a page number.
  Counts are memoized only within the current request and reused for pagination,
  leaving two database queries per listing request and no persistent result cache.
- Homepage Upcoming events selects the newest visible Event with a start and
  either an end after now, or no end and a start at/after now. Ongoing events
  remain eligible until their end. Undated and completed events remain in the
  public Events listing, but not in the homepage panel.
- Homepage Recent announcements selects the two newest visible Announcements.
- No activity data is duplicated in homepage content. Public pages read the
  database per request; admin mutations also revalidate affected routes.
- A supplied link uses its editable label (for example Register, More info,
  View notification, or Apply now), defaulting to More info when blank. The same
  label appears on homepage links. Labels are plain text up to 60 characters;
  clearing the label restores the default, and clearing the URL hides the action.
  Homepage cards link to their listing when no URL is supplied.
- Date, Time (IST), and Location appear as separate labelled metadata groups.
  Undated entries show Posted on with the creation date.
- Old `/eventspage` links redirect to `/events`.

## Persistence and access

`Activity` is one table, using a PostgreSQL enum array for sections. `version`
is internal optimistic concurrency control: stale edits/deletions return 409.
All mutations require admin activity permissions, the existing session and CSRF
guards, and a transaction that also writes an audit record. Audit history remains
after deletion. CORE_FACULTY has no activity administration permission.

Migration: `202610190001_activities`. It creates the enum, table, indexes and
constraints, and grants CRUD to `ctiks_app` if that runtime role exists. Fresh
provisioning also grants access via `db:restrict`. Existing content is untouched.
Run `npm run db:migrate` and `npm run db:generate`, then restart the app.

Migration `202610190003_activity_link_labels` adds the persisted link label and
retires Campus Updates from the CMS and website. Any old campus-only entries
become News; entries with other categories keep those categories. No entries are
deleted. The database retains the old enum value for migration compatibility,
but a constraint prevents using it. `/campus-updates` redirects to `/activities`.

## Verification

`npm test` covers input/date/time and access policy rules. `npm run test:integration`
uses an isolated random database schema and Redis namespace to test the API,
public listings, homepage selection, visibility, clearing fields, ordering,
concurrency, and audit rollback. It never seeds sample activities into the live
application schema.
