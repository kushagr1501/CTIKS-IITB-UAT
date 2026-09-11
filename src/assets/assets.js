/**
 * CTIKS asset registry.
 *
 * `remote` points at the Figma MCP export URL. Those URLs EXPIRE ~7 DAYS after
 * export (exported 2026-09-10), so they are recorded here only so the exact
 * bytes can be pulled down once. Run `npm run fetch:assets` to download every
 * file into `public/assets/`; the app itself only ever reads `path`.
 */

const A = (file, remote) => ({ path: `/assets/${file}`, file, remote });

export const ASSETS = {
  // Raster
  iitbLogo:          A('iitb-logo.png',           'https://www.figma.com/api/mcp/asset/83cbed44-3765-4c26-beff-7f0f4cb6652c.png'),
  ctiksLogo:         A('ctiks-logo.png',          'https://www.figma.com/api/mcp/asset/dfeb602f-ef58-4206-9d6b-ceb43f89a03d.png'),
  heroBackdrop:      A('hero-backdrop.png',       'https://www.figma.com/api/mcp/asset/8baf2d04-d825-44ee-b048-2e339fd4c990.png'),
  paperTexture:      A('paper-texture.png',       'https://www.figma.com/api/mcp/asset/15c73945-4667-4204-9cbb-9eff11445566.png'),
  programmePhd:      A('programme-phd.png',       'https://www.figma.com/api/mcp/asset/015805fa-d1b5-42cd-aa28-0ebb0acc4b41.png'),
  programmeOutreach: A('programme-outreach.png',  'https://www.figma.com/api/mcp/asset/abb03db8-9b7d-4bd9-a29d-23c1a5e652cd.png'),
  programmeAreas:    A('programme-areas.png',     'https://www.figma.com/api/mcp/asset/6b5ebc75-fa9b-447c-a141-e9df4ab9da98.png'),
  eventsBackdrop:    A('events-backdrop.png',     'https://www.figma.com/api/mcp/asset/446a90e9-a979-4657-8ff0-0581f6d720f7.png'),
  aboutHeroBackdrop: A('about-hero-backdrop.png', 'https://www.figma.com/api/mcp/asset/10eefd27-f495-48c1-83cd-1614d8e89f9b.png'),
  aboutLogoEmblem:   A('about-logo-emblem.png',   'https://www.figma.com/api/mcp/asset/27da834b-258a-47ae-8355-a48874298062.png'),

  // Vector
  iitbPill:              A('iitb-pill.svg',           'https://www.figma.com/api/mcp/asset/4104635c-33c2-440e-95e9-c239c881cb20.svg'),
  chevronDown:           A('chevron-down.svg',        'https://www.figma.com/api/mcp/asset/31020585-a94d-406b-bdad-d5b7163f0b66.svg'),
  buttonGold:            A('button-gold.svg',         'https://www.figma.com/api/mcp/asset/d6c52555-8a6d-4deb-b981-f017320652f6.svg'),
  buttonRed:             A('button-red.svg',          'https://www.figma.com/api/mcp/asset/f5c2081d-63f2-4298-b44c-f90e9e875501.svg'),
  arrowRed:              A('arrow-red.svg',           'https://www.figma.com/api/mcp/asset/9afa5f1b-c8b6-48f0-bdcd-f4a7d0b2fb87.svg'),
  arrowWhite:            A('arrow-white.svg',         'https://www.figma.com/api/mcp/asset/0326b5ab-6294-484e-a5ef-2e2831969b4a.svg'),
  arrowSand:             A('arrow-sand.svg',          'https://www.figma.com/api/mcp/asset/3e8baada-84c7-4801-93d3-3ebfcec8c162.svg'),
  ruleVertical:          A('rule-vertical.svg',       'https://www.figma.com/api/mcp/asset/5cb59df2-1745-4fd1-bb66-78008febe8c5.svg'),
  ruleShort:             A('rule-short.svg',          'https://www.figma.com/api/mcp/asset/2eda91a9-1818-42a5-93c3-a0b5d3d1c79d.svg'),
  iconCalendar:          A('icon-calendar.svg',       'https://www.figma.com/api/mcp/asset/70afafdf-c978-4b70-828f-36668a91564d.svg'),
  iconClock:             A('icon-clock.svg',          'https://www.figma.com/api/mcp/asset/33158840-29f0-47e9-b849-48162223de80.svg'),
  iconEvents:            A('icon-events.svg',         'https://www.figma.com/api/mcp/asset/2af9bfbf-fb9e-4595-8a4f-0973e56c5efb.svg'),
  iconAnnouncements:     A('icon-announcements.svg',  'https://www.figma.com/api/mcp/asset/a9184049-94f1-41e7-b822-c2b693636dc0.svg'),
  eventsPanel:           A('events-panel.svg',        'https://www.figma.com/api/mcp/asset/6ce7aa01-ca64-49c7-b662-e3d6c61eae9c.svg'),
  aboutHeroIcon:         A('about-hero-icon.svg',     'https://www.figma.com/api/mcp/asset/ba5b6f83-2303-4786-ad49-44515140f798.svg'),
  dividerLine:           A('divider-line.svg',        'https://www.figma.com/api/mcp/asset/cd7af379-708b-4f27-bfc2-417d4ebfc6a6.svg'),
  dividerOrnament:       A('divider-ornament.svg',    'https://www.figma.com/api/mcp/asset/e8394738-4b47-4c64-ba9e-e7c12cb84326.svg'),
  mottoCardDivider:      A('motto-card-divider.svg',  'https://www.figma.com/api/mcp/asset/6b4af03b-78a0-41fb-8d39-14d8468ebca3.svg'),
  visionBackgroundVector: A('vision-bg-vector.svg',   'https://www.figma.com/api/mcp/asset/8baea172-a989-490b-a888-f14007207f50.svg'),
  footerImage:           A('footer_img.png',          ''),
};

export const ASSET_LIST = Object.values(ASSETS);
