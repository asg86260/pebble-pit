# The DOM UI's rules, as they mostly stand (2026-10-14)

What the page chrome (held sheet and its pages, boards and cards, story card,
notices, HUD corners, tooltip, landing page) already agrees on, read off
`src/style.css`, `src/shelf.css`, `src/title.css` and a computed-style sweep
of 30 live states (desktop 1280x800, phone 390x844, light and dark). Each
rule says how well it is followed today; the breaks are numbered findings in
`dom.json`. The canvas (src/render) is audited separately.

Adherence: **firm** (no breaks found), **mostly** (a few named breaks),
**loose** (a habit more than a rule).

## Type

| role | today | adherence |
|---|---|---|
| face | `--face` monospace everywhere; CJK fallbacks per `:lang` | firm (CJK sizes uneven, DOM-39) |
| body | 12px, regular | firm: 242 of ~900 measured text nodes are 12px/0 tracking, ~400 are 12px tracked |
| label (names, buttons, card titles) | 12px, uppercase, tracked | mostly: tracking is .1em on boards, .14em on sheets (DOM-09) |
| sentence (notes, story card, index text, record) | lowercase, tracking 0 | mostly: ledger labels, index names, crew-window section and mess tags drop to lowercase where they are labels (DOM-12) |
| page word (held sheet / landing heading) | 17px, .3em, uppercase | firm |
| page title (board) | 12px, .18em, uppercase, 2px rule | mostly: four other heading shapes (DOM-13) |
| section | 12px bold .18em | loose: sign, rule, grey rule or none (DOM-13, DOM-35) |
| small print | 10px | loose: 9.84 / 10 / 10.2 / 10.8 / 11px all in use (DOM-10) |
| display | 14-15px names, 18px code, 34px game name | loose (DOM-11) |
| line-height | 1.4 from body | loose: `font:` shorthands reset it to normal on most overlays (DOM-34) |
| weight | regular; bold only in section signs | loose (DOM-35) |

Tracking values in use: 0, .04, .06, .08, .1, .12, .14, .18, .22, .25, .3,
.34em. A working scale would be four: 0 (sentences), .08-.1 (dense labels),
.14 (buttons), .3 (words).

## Color tokens and meanings

| token | light | dark | meaning | adherence |
|---|---|---|---|---|
| `--paper` | #fff | #1f1f1f | ground of every panel | firm, except `#objective.deep` pins #000 (DOM-41) |
| `--ink` | #000 | #e0e0e0 | text, borders, the inverted state | firm |
| `--ink-2` | #333 | #b9b9b9 | landing secondary text, barrier note | loose (DOM-26) |
| `--ink-4` | #666 | #939393 | muted text (record notes, shelf gains) | loose (DOM-26) |
| `--ink-5` | #8c8c8c | #767676 | disabled, short coin, ledger notes | mostly |
| `--ink-7` | #aaa | #5f5f5f | float shadow, toast note | firm |
| `--ink-8` | #cfcfcf | #434343 | the bill's fill bar | firm |
| coin ore | #2f5fd0 literal | same | ore mark, third ladder band | literal x4, no dark value (DOM-23, DOM-24) |
| coin crop | #2e9e4b literal | same | crop mark, second band | literal x3 |
| coin spark | #d93a25 literal | same | spark mark, fourth band | literal x4 |
| accent | #6f36c9 literal | #a979ef literal | the deep's rails: the ask, the cap | literal x7, one rule missing its dark value (DOM-25) |

Meaning rules that hold: color appears only on coins and the deep's accent;
red is only ever the spark (the dev panel's `#c00` aside); every state is
black/white inversion, never a color. Breaks: the landing slider is browser
blue (DOM-01); the dot texture and scrim are literals per mode (DOM-27).

## Spacing and size

- **Tokens:** `--edge` 8, `--gap` 8, `--pad-s` 3/6, `--pad-m` 8/12, `--pad-l`
  14/24, `--shadow-off` 6, `--sheet-w` 84ch, `--sheet-pad-x` 12, `--rows-gap` 4.
  Used by the floating chrome (toast, objective, raise, modal, tip, skip);
  every button padding is a literal (DOM-16). **loose**
- **Stack gaps:** 4 (lists, card grid), 6 (saves, record, board sheet), 7
  (landing), 10 (held sheet, pairs). **loose** (DOM-15)
- **Borders:** 1px for controls and the reading sheets (held, landing, tip,
  toast); 2px for things floating over the yard (board sheet, modal, purse,
  queue, objective, corner, hop, raise); 3px double for a goal card; 5px plank
  on shelves. **mostly** -- the held sheet and toast are 1px though they float,
  the modal close is 2px though it is a control (DOM-17).
- **Shadow:** `--float-shadow` (6px, ink-7, no blur) under small floating
  chrome. **mostly** -- not under the board sheet, purse, held sheet or tip
  (DOM-18).
- **Radius:** none. **firm** for boxes; pips, the clock and pad glyphs are round
  (DOM-36); the browser focus ring is rounded (DOM-02).
- **Sheet width:** board sheets fit to content up to `--sheet-w`; the landing
  column has a 21em floor; the held sheet has no floor and resizes per page
  (DOM-08).
- **Button height:** 24px (held), 27px (language), 29px (landing), 24px
  minimum for the job steppers. **loose** (DOM-03)

## Components

| component | anatomy today | where it differs |
|---|---|---|
| sheet button | full width, 1px ink, 4px 14px, uppercase .14em, centered | landing: left-aligned, 5px, 29px tall (DOM-03, DOM-04) |
| pair | two buttons, flex 1, 10px gap | feedback's back+send pair is narrower than the sheet (DOM-07) |
| back | last row, full width, 'back' | feedback pair, phone index inner back, crashed none (DOM-07, DOM-42) |
| toggle row | 'name: value' text, no visual state | language inverts, hide-finished goes solid, feedback uses a tick (DOM-05) |
| tick box | 12px box, 1px, 2px inset fill (feedback) | quest glyphs, 7px bill box, 6px cloud square (DOM-06) |
| choice list | rows, chosen row inverted | four paddings/case/border variants (DOM-14) |
| card | name / pips / gain / bill / time / note, 1px, invert on hover | shelf tile, rails row, barrier buy each different (DOM-30, DOM-29) |
| section heading | see Type | four shapes (DOM-13) |
| badge | inverted 0 4px chip | written twice; reversed on shelves (DOM-31) |
| dark chip (toast, mess tag, skip) | ink fill, paper border + ink outline, float shadow | three type treatments (DOM-40) |
| HUD square (corner) | `--fs-size` square, 2px, float shadow | consistent |
| tooltip | 1px, pad-s, uppercase .08em, line-height 1.5 | consistent |

## States

| state | rule today | adherence |
|---|---|---|
| hover | invert (ink ground, paper text), inside `@media (hover: hover)` | mostly: shelf tiles lift instead; delete and hide-finished fade; landing hovers are ungated (DOM-20, DOM-21) |
| on / chosen / open | invert | mostly: toggles say it in words (DOM-05) |
| pressed | invert, phone board cards only | loose (DOM-22) |
| disabled | `--ink-5` text + dashed border | mostly: feedback and rails use opacity .4/.45; landing has no disabled look (DOM-19) |
| can't afford | dashed border, short coin in ink-5, held coins in ink | firm on cards and shelves |
| focus | none; browser default ring; pad marker canvas | loose (DOM-02) |
| new | top-left corner triangle | two sizes (DOM-31) |

## Dark mode and phone

- Dark swaps the seven grey tokens and nothing else; coins, scrim, deep card
  and dot texture are literals (DOM-23, 24, 27, 41). The cards bench has no
  dark mode (DOM-28).
- Phone: boards and the held sheet become bottom sheets with a grip; card
  hover is replaced by `:active`; tracking tightens on boards and controls only
  (DOM-37); landing hovers stick (DOM-21); the landing foot is lopsided
  (DOM-38).

## Not checked

- The desk shell's dialogs: they are native Electron message boxes and file
  pickers (`electron/main.cjs`), drawn by the OS, so none of these rules reach
  them.
- The crashed sheet was staged by unhiding `#crashed` (no hook raises a real
  fatal), so its feedback form under a real crash was not seen.
- The feedback tick's enabled state: the dev build had no save to offer, so
  the tick stayed disabled in every shot.
- Pad focus marker (`#padmark`, a canvas) is the render audit's.
- The landing page in dark was shot with `?dark` on the parent only; the demo
  yard in the frame stayed light, which a real dark preference would not do.
