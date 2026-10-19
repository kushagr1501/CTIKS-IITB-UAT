# Nagendra Pavana — sourced faculty content

**Historical collection — superseded.** This broader import was rolled back at
the user's request. Use the [reviewed replacement](../reviewed-2026-10-19/README.md)
for current Neon content restricted to the specified teacher website.

Collected 19 October 2026 for the existing `nagendra-pavana` profile.
Structured data and entry-level sources are in [content.json](content.json).

## Sources

- [User-supplied teacher profile](https://www.sanskritfromhome.org/teacher-profile/Dr.-Nagendra-Pavana-18984714)
- [Same publisher's public teacher data](https://www.sanskritfromhome.org/api/homepagetutor.php), matching tutor ID **18984714** only.
- [CVV 2023–24 prospectus](https://www.cvv.ac.in/wp-content/uploads/2023/07/Prospectus-2023-24-Dt-26-06-2023.pdf)
- [IIM Bangalore book record](https://research.iimb.ac.in/books/12/)
- [PHI Learning publisher record](https://www.phindia.com/Books/BookDetail/9789391818203/INTRODUCTION-TO-INDIAN-KNOWLEDGE-SYSTEM-MAHADEVAN-BHAT-NAGENDRA)
- CVV course listings for [Indian Knowledge Systems – 1](https://lms.cvv.ac.in/learning/course/info.php?id=89), [Kāvyaṁ alaṅkāraśca](https://lms.cvv.ac.in/learning/course/info.php?id=15), and [Prauḍhamanoramā – 2](https://lms.cvv.ac.in/learning/course/info.php?id=459).

## Collected content

- Factual biography and six research-interest labels.
- Ph.D. in Vyākaraṇa and M.A. (Vidvat Uttama), both at Karnataka Samskrit
  University, Bengaluru. Graduation dates are unavailable.
- CVV appointment as listed in the historical prospectus and Sanskrit e-learning
  work with Vyoma. No undated relative duration is converted into a date range.
- Three courses in teaching history; no current semester assumed.
- One co-authored book, *Introduction to Indian Knowledge System: Concepts and
  Applications*, PHI Learning, 2022. Author order follows PHI Learning:
  B. Mahadevan, Vinayak Rajat Bhat, Nagendra Pavana R.N.

## Missing or uncertain

The visible teacher profile contains placeholder text; none of it is imported.
Its publisher's matching teacher data contains the actual biography. That source
also describes traditional study at Om Shantidhama Gurukulam, Arsha Gurukula,
and Dattashrama. These are not presented as additional university degrees.

The biography is undated and refers to a CVV appointment and an IIT Bombay
project. Those statements do not establish a current 2026 appointment or project.
The site's existing CTIKS identity, portrait, personal website, account and order
are preserved.

Current teaching, student lists, patents, current office address, phone and email
are unconfirmed and stay empty. Empty sections use the site's existing
“Not added yet.” presentation. No dummy records are inserted.

## Import

Run `node --import tsx scripts/import-collected-faculty.ts` for validation and a
dry run; add `--apply` to publish both collections. The import preserves the
previous published revisions and records provenance in audit history. Identical
reruns are no-ops, and later academic edits or working drafts block replacement.
