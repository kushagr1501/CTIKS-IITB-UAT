Read this if you need the historical design, content, or test record for this area.

> Historical record: statements and commands below describe the original review, not the current setup
> instructions. Start with the current onboarding guides. Terms are defined in the
> [glossary](../../GLOSSARY.md).

# Reviewed replacement for the two user-specified faculty sources

This collection replaces the earlier imports on 19 October 2026. The earlier IIT Delhi CV collection and the
broader Nagendra source collection are historical records, **not the current import payload**.

## Scope and evidence

- [Chariar's specified IIT Bombay website](https://vm-chariariitb.joyisyou.com/): rendered homepage, research
  overview, publication category cards, JoyLab doctoral scholar list, co-learning pages and five linked patent
  certificates.
- [Nagendra Pavana's specified teacher profile](https://www.sanskritfromhome.org/teacher-profile/Dr.-Nagendra-Pavana-18984714):
  the exact
  [teacher endpoint used by that page](https://www.sanskritfromhome.org/api/tutor_details.php?tutor_id=18984714)
  and the same site's course filter for teacher **18984714**. The source HTML contains placeholder text; the
  successful endpoint response contains the real profile. No placeholder content is used.

Every imported academic entry includes a `sourceUrl` in its JSON payload. The database audit record links the
source collection and review notes. Rendered source snapshots, downloaded certificates and the complete
pre-rollback database snapshot are retained locally under ignored `.private/reviewed-faculty/`.

The collections are faithful to reviewed source statements; they are not a guarantee that every website
statement is independently certified or current. No dummy entries, inferred graduation years, guessed semester
assignments or general platform support contact details are imported.

## Chariar

[Import payload](vijayaraghavan-m-chariar.json):

- Four education entries and eighteen listed academic/professional positions.
- IIT Bombay appointment, personal website, `vmchariar@iitb.ac.in`, office phone and Room 414 C address from
  the requested website.
- Ninety-six publication entries transcribed from visible category cards. This is the accepted subset of the
  site's bibliography, not a certified complete bibliography of the faculty member's work.
- Five granted patents, using the titles, numbers and grant dates on the linked certificates. Inventor names
  are empty where the certificate did not state them, rather than inferred from the patentee or a filename.
- Four named doctoral scholars explicitly listed on JoyLab. No research topics, start dates or graduates are
  copied from the rejected earlier CV collection.
- No current or previous course delivery is assumed. [Five course plans](chariar-course-plans.json) are
  retained for review; a plan alone does not establish a teaching assignment.

The dated homepage timeline lists IIT Bombay from 2026 and IIT Delhi through 2026. The undated bio modal still
gives IIT Delhi as current; that stale modal contact block is not used. Ph.D. year and earlier positions
follow the requested site, without mixing in the earlier IIT Delhi CV.

[Withheld publication records](withheld-chariar-publications.json) explain all twenty-six exclusions: eight
pending/under-review records, conflicting or cross-listed repeated titles, and two publisher-confirmed
retracted works. The retractions were checked against publisher notices, not inferred from titles:

- [Technical-debt computing paper: publisher retraction](https://onlinelibrary.wiley.com/doi/10.1155/2023/9783131)
- [Lung-disease classification paper: publisher status](https://onlinelibrary.wiley.com/doi/10.1155/2022/9036457)

These notices are used only for exclusions; they do not supply additional faculty profile content. Retraction
status is not a conclusion about an individual author's conduct. The site still lists some granted patents as
old pending applications; certificate-backed grants take precedence and are not duplicated.

## Nagendra Pavana

[Import payload](nagendra-pavana.json):

- Two university qualifications, the traditional Vyākaraṇa-Ratna examination title, and three explicitly named
  gurukula study entries. Traditional training is labelled as study, not as an additional university degree.
- Exact thesis title and supervisor from the source teacher record.
- Undated work history at Chinmaya Vishwavidyapeeth and Vyoma. Relative durations in the source are not turned
  into current 2026 claims.
- Three completed, pre-recorded Sanskrit learning resources explicitly associated with teacher ID 18984714. No
  current live teaching is inferred.
- No publications, patents, students, office address, teacher email or phone: these are not supplied by the
  specified source. Earlier externally researched book/article/contact entries are not carried over.

## Safe database workflow

The restore first replaced active imported data with a new published copy of each original empty baseline;
previous versions were retained. It checked that active content still matched the recorded import and rejected
concurrent edits/drafts.

```sh
node --import tsx scripts/restore-faculty-before-source-import.ts
node --import tsx scripts/restore-faculty-before-source-import.ts --apply
node --import tsx scripts/publish-reviewed-faculty.ts
node --import tsx scripts/publish-reviewed-faculty.ts --apply
```

The publisher accepts only these two slugs, their exact requested source URLs and their own source hosts. It
requires the recorded restored baseline, preserves accounts/portraits/order/visibility, publishes both
profiles in one transaction, checks actual child-row counts and verifies unrelated faculty are unchanged.
Identical reruns are no-ops. Later edits or a different payload require review.

Next: [current codebase map](../../CODEBASE_MAP.md).
