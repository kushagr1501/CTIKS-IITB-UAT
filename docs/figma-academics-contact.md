Read this if you need the historical design, content, or test record for this area.

> Historical record: statements and commands below describe the original review, not the current setup
> instructions. Start with the current onboarding guides. Terms are defined in the [glossary](GLOSSARY.md).

# Academics and Contact Us design implementation

Source: the user's editable Figma copy, file `XeX5FFrRMtBNHUd8kK1ZeV`.

| Route            | Figma frame                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `/academics`     | `1192:2725` — Academics                                                      |
| `/academics/phd` | `1207:3371` — Ph.D. Programme                                                |
| `/academics/msc` | `3208:1990` — M.Sc. Programme (updated source copied into the editable file) |
| `/contact-us`    | `1181:1816` — Contact Us                                                     |

The routes use the existing public layout, header, navigation, colour tokens, and fonts. The shared footer now
implements Footer Design 3 (`1176:1580`) and is rendered once in the root layout across public, login, and
account pages.

The footer retains Design 3's layout and artwork at the user's requested compact scale: 1120px maximum panel
width, 112px desktop logos, 14px navigation links, and reduced padding. Desktop height is approximately 394px
instead of 601px.

Following the user's sizing feedback, the page bodies use a more compact scale: 1120px content width, smaller
typography and buttons, and reduced panel padding and section gaps. The top banners retain their original
design, including the 500px Academics/Contact banners and 400px programme banners.

## Assets

New images and SVG exports are local under `public/assets/figma/`. No temporary Figma URLs are used at
runtime. The academics hero, paper texture, Ph.D. photograph, and M.Sc. photograph reuse existing files:
downloaded Figma exports were confirmed to have identical SHA-256 hashes to `hero-backdrop.png`,
`paper-texture.png`, `programme-phd.png`, and `programme-outreach.png`, respectively.

## Behaviour and content

- The M.Sc. Explore Programme button now opens `/academics/msc`.
- The updated CTIKS section from source file `dYKMiHZZheHKoLj8nFZ54N` was copied into the editable file as
  section `3208:6`; the original section is preserved. The supplied source link selects Professor Details; the
  M.Sc. Programme frame was located within the same updated CTIKS section.
- The MSc page follows frame `3208:1990`: breadcrumbs, admissions announcement, four highlights, both
  discipline panels, application steps, and applicant information. Admissions remain “Coming soon”; the design
  specifies a January 2027 notification and academic year 2027–28. No application or unpublished brochure URL
  is invented.
- New MSc SVGs are local in `public/assets/figma/`. Existing assets are reused where their SHA-256 hashes
  match the updated Figma exports exactly.
- The Ph.D. card opens `/academics/phd`; Academics remains the active navigation item on that nested route.
- Ph.D. specialisation sections use keyboard-accessible native disclosure controls. All six sections contain
  the qualifying degrees, additional requirements, desirable background, and research areas supplied directly
  by the user.
- Contact email opens a mail client. The map opens IIT Bombay in Google Maps.
- The phone number `+91-22-2576-XXXX` is a placeholder in the design and remains plain text. Admission dates
  and other programme copy follow the design, not a live admissions feed.
- The Research link opens `/research`, implemented from the research design in frame `3213:2`. It includes all
  eight original research areas and local images. Six available detail destinations link to the original CTIKS
  website; AI and Music have no detail destination on the source page and show “Details coming soon”.

## Verification

M.Sc. addition: `npm run typecheck`, `npm run lint`, and the production build passed. The build needed
execution outside the sandbox after a Windows EPERM directory-creation failure. The preview returned HTTP 200;
desktop and 390px mobile checks confirmed all page images load, correct icon geometry, and no horizontal
overflow. The Academics M.Sc. action is an enabled link to `/academics/msc`.

Reviewed the three routes in the running browser at desktop and 390px mobile widths; checked image loading and
dimensions, horizontal overflow, disabled M.Sc. action, Ph.D. navigation, and accordion interaction. The
header is shared with the existing site; Footer Design 3 is shared through the root layout.

`npm run typecheck`, `npm run lint`, and `npm run build` passed. The production build required execution
outside the sandbox after the sandbox denied creation of a Next.js output directory.

Next: [current codebase map](CODEBASE_MAP.md).
