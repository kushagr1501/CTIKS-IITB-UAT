# CTIKS — Homepage (React)

Homepage for the Centre for Traditional Indian Knowledge and Skills, IIT Bombay,
built from the Figma frame `CITKS` (`node-id=9:215`).

Stack: React 18 + JavaScript + Tailwind CSS 3 + Vite.

## First run

```bash
npm install
npm run fetch:assets   # do this before npm run dev — see below
npm run dev
```

## Assets — read this first

`npm run fetch:assets` downloads all 22 exported images and SVGs from Figma into
`public/assets/`. **The Figma export URLs expire roughly 7 days after
2026-09-10.** After that the script fails and the assets have to be re-exported
from the file. Once downloaded, commit `public/assets/` — nothing at runtime
touches Figma.

Until the fetch runs, the page renders with correct layout, colour and type but
broken image slots.

## Structure

```
src/
  assets/assets.js          asset registry (local path + origin URL)
  data/homepage.js          all copy and link targets — swap for a CMS later
  components/
    ui/                     Button, Chip, SectionHeading
    layout/                 Header, Nav, Footer
    sections/               Hero, Programmes, UpcomingEvents, Announcements
  pages/Home.jsx            page composition
```

## Design tokens

Defined once in `tailwind.config.js` under `theme.extend`, not repeated as hex
literals in components.

| Token          | Hex       | Role                          |
| -------------- | --------- | ----------------------------- |
| `ctiks-cream`  | `#fff7ed` | Page ground                   |
| `ctiks-sand`   | `#ffe8c8` | Nav band, announcement cards  |
| `ctiks-gold`   | `#ffcb65` | Hero motto, accent band       |
| `ctiks-rule`   | `#f9c531` | Footer top rule               |
| `ctiks-red`    | `#aa1313` | Primary                       |
| `ctiks-maroon` | `#820d0d` | Masthead title                |
| `ctiks-clay`   | `#a88f6e` | Hero base under the photo     |

Type roles: `font-display` (Red Rose), `font-body` (Montserrat), `font-deva`
(Laila, for ज्ञानमयं तपः), `font-motto` (Cormorant italic), `font-link`
(Open Sans, footer only).

## Deliberate departures from the Figma file

The file is a flat 1440 px composition with absolute positioning throughout.
This build changes that where fidelity is unaffected:

- **Flow, not offsets.** Sections stack; nothing is positioned by `top:` value.
  The page is responsive down to mobile, which the file does not specify — the
  breakpoints are my reading of the desktop intent, so check them.
- **Deduplicated components.** The action button is drawn six times in the file;
  it is one `<Button>` with three variants here. The three programme blocks are
  one `<ProgrammeBlock>` fed by data. Announcement rows likewise.
- **Copy corrections.** The file has "Indian Knowledge  and Skill" (double space,
  singular) in the masthead but "Skills" in the footer, and lowercases the start
  of the Areas of Interest sentence. Masthead is left as designed; the sentence
  is sentence-cased. Flag if the masthead should read "Skills".
- **Accessibility floor.** Visible keyboard focus, `prefers-reduced-motion`
  respected, decorative images marked `aria-hidden`, real landmarks and heading
  order. None of this is specified in the file.

## Known gaps

- The Activities dropdown renders its chevron but has no menu — the file does
  not design the open state.
- Links point at path strings. Wire to a router when routing is decided.
- Only the homepage exists.
