# Vijayaraghavan M. Chariar — sourced faculty content

**Historical collection — superseded.** This import was rolled back at the user's
request. Use the [reviewed replacement](../reviewed-2026-10-19/README.md) for the
current Neon content and the requested IIT Bombay website sources.

Collected 19 October 2026 for the existing `vijayaraghavan-m-chariar` profile.
The machine-readable collection is [content.json](content.json). Each academic
entry records its source URL and CV page. Biography and research descriptions
are concise editorial paraphrases.

Primary sources:

- [Faculty website](https://web.iitd.ac.in/~chariarv/)
- [Detailed CV, 24 pages](https://web.iitd.ac.in/~chariarv/static/media/chariarCvLatest.50276a32668237920975.pdf)
- [Research overview](https://web.iitd.ac.in/~chariarv/research/overview)
- [IIT Delhi library record for Health Co-design for Community Well-being](https://library.iitd.ac.in/faculty-author-books/1266/)

## Collected content

- Four education entries and four academic positions.
- Nineteen courses in teaching history; no current semester assumed.
- Thirty-one selected publications: nine journal entries, eleven books/reports/
  edited volumes, six book chapters and five conference presentations. This is
  **not the complete bibliography**. Forthcoming and ambiguous entries are withheld.
- Five patent records: two granted patents and three application records.
- Twenty-one awarded students: fourteen Ph.D. and seven B.Tech./M.Des./M.Sc.
- Nine Ph.D. students explicitly listed as ongoing and six awaiting viva or
  with submitted theses, retaining the CV's status labels. These statuses are
  source-reported, not independently reconfirmed enrolment records.

## Review required

The website gives Ph.D. year 1998 and the CV gives 1999; the displayed year is
empty. The CV calls the field Experimental Materials Science, while the homepage
uses Experimental Solid State Physics. Earlier employment dates also conflict;
disputed roles/end dates are omitted. Details are in `reviewNotes` in the JSON.

Patent application number `202111049455` is assigned to two different titles
and filing dates in the CV. Both entries are withheld. Two further in-process
patent descriptions without confirmed application numbers are also withheld.

The linked sources describe an IIT Delhi appointment. This import preserves
the site's existing CTIKS designation and department rather than changing an
appointment based on a third-party date assumption. The IIT Delhi public email
is sourced, but its office address and phone are not imported as an IIT Bombay
office. The existing portrait, personal website link, account, category,
visibility and directory order stay unchanged.

## Import

Run `node --import tsx scripts/import-collected-faculty.ts` to validate and dry-run
both reviewed faculty collections; add `--apply` to publish. The importer only
fills the two original baseline profiles, rejects working drafts/later academic
edits, retains prior published revisions, and records sources and review notes in
audit history. Repeating identical content is a no-op. No sample data is used.
