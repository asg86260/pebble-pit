# The page chrome: its rules, as built

What the DOM UI does (the held sheet and its pages, the landing page's column,
boards and cards, shelves, the story card, notices, the windows), after the
visual consistency pass of 2026-10-14 (`docs/audit/visual-2026-10-14/`). Every
token is on `:root` in `src/style.css`; a rule names a token, never a value. A
new piece of chrome follows these; one that cannot is a question for the owner.

## Color

- Black and white are the normal; purple is the one accent, for anything outside it. `--paper`, `--ink`, `--accent`.
- The ends are named apart from their use, so a box can ink itself the other way without a cycle: `--c-paper`, `--c-ink` (`#objective.deep`, every section sign).
- Greys are steps from ink to paper, by tenths: `--ink-2`, `--ink-4` (muted words), `--ink-5` (disabled, short), `--ink-7`, `--ink-8` (a bill's fill). The three words are set in (-2, -4, -5) are each at least WCAG AA's 4.5:1 on their own paper, light and dark; -7 and -8 are edges and fills, never words on the paper.
- Color appears only on coins and the accent: `--coin-ore`, `--coin-crop`, `--coin-spark` are `COIN` / `COIN_DARK` in `src/config/palette.js`; `--accent` is a rung of `PURPLE`. `test/ui-tokens.test.mjs` holds the stylesheet equal to the palette.
- Dark mode swaps the tokens under `html.dark` and nothing else; a dark coin or accent keeps 3:1 on dark paper.
- The page's dot texture is one value a mode: `--dots`. The scrim is shade, not ink, and stays dark in both modes.
- Every state is black/white inversion, never a color.

## Type

- One face: `--face` (the language's own face is added after the mono under `:lang`). Never a `font:` shorthand on a component: it resets the line height; set `font-size`.
- Six sizes: `--fs-small` 12 (small print, notes: the floor, told from the body by its grey and case, not its size), `--fs-body` 12 (everything), `--fs-note` 13 (the line under a notice's or an achievement's name), `--fs-name` 14 (a display name: the toast, an index entry, a goal), `--fs-word` 17 (a page's word, a pairing code); `--fs-title` 34 is the game's name alone.
- No word on any page is under 12px (`TEXT_FLOOR`), and every word is at AA against what it stands on (`TEXT_AA`; 3:1 for 24px, or 18.66px bold). `src/selftest/textaa.js` reads every page, desk and phone, light and dark.
- Four trackings, always times `--track`: `calc(var(--track-s) * var(--track))`. `--track-0` sentences, `--track-s` .08 labels, `--track-m` .14 buttons and titles, `--track-l` .3 words. Pictures (pips, codes) keep plain numbers.
- `--track` is the one knob: a phone sets it to .6, so every tracking tightens at once.
- Two line heights: `--lh-text` 1.4 for words, `--lh-chip` 1 for a one-line chip (a sign, a tag, a shelf).
- Case is set on the component: a label is upper case and tracked (`--track-s` or more), a sentence is lower case at `--track-0`. Names, buttons, statuses, list rows and ledger labels are labels; notes, quotations, an entry's text and a shelf tile's gain (a quantity, read as written) are sentences.
- Bold is for the section level only. Page titles, names and toasts are regular.
- A CJK name among Latin ones (the language list, the landing foot) is set at `--fs-small`, the capitals' height.
- Separators in a setting's label: a colon for a toggle (`dark: off`, press to flip), a middle dot for a door (`language · english`, opens a page). The words are the owner's.

## Headings

- Two levels. A page title: regular, `--track-m`, upper, a 2px rule under it (a board's `.page .title`, a window's `.modalhead`).
- A section: bold, `--track-m`, upper, a sign -- a plate of the page inked the other way (`.rows .sect`, the shelves' and the ledger's). The held sheet's `.word` is the page's name, not a heading level.
- A badge (`.badge`) is the words' ink as a block with the numeral in paper; on a sign it inverts by itself.

## Spacing

- Two stack gaps: `--gap-s` 4 between the rows of one list, `--gap-m` 8 between controls (`--gap` is the same 8).
- Paddings: `--pad-s` (3/6: tips, tags, small controls), `--pad-m` (8/12: floating cards, the cloud box), `--pad-l` (14/24: the held sheet), `--pad-btn` (3/12: a sheet button and a list row), `--pad-card` (6/8: a card on a board).
- Glass edges: `--edge` 8 for the game's chrome; the landing column and its foot stand `--title-edge` 20 in, both sides.
- The held sheet is one width on every page, `--held-w` 36em (its content box); the window alone narrows it, and a phone's sheet is the glass. The landing column is never narrower than `--col-w` 21em.
- A 2px border floats over the yard and casts `--float-shadow` (6px, the ink at `--shadow-ink` 20% so the yard shows through, no blur): boards, the purse, windows, the queue, the story card, corner squares, the build buttons. A 1px border is a control, a line inside a panel, or a reading sheet (held sheet, landing column, tooltip, toast).

## Components

- Sheet button (`.held button`, `.col button`): the sheet's width, `--pad-btn`, `--track-m`, upper, centered, 1px ink, paper ground; one height everywhere.
- A page's foot is the sheet's width: back alone, or back and the page's action as a `.pair` (two buttons, `flex: 1`, `--gap-m`). The index's back is the page's back, retargeted to the list while an entry is pushed over it on a phone.
- List of choices (index names, languages, saves, a dial's popover): rows at `--pad-btn`, `--track-s`, upper, the chosen one inverted; rows keep their borders on a sheet and drop them inside a frame of their own.
- Toggle: says its state in its words (`dark: off`, `hide finished`); no other mark.
- Tick box (`.tickbox`): in em, so it rides its text; 1px box in the text's color, filled inside a 1px margin when on. The feedback form, the quest list, the shield's bill, the landing's cloud line.
- Card (a thing you can buy), one anatomy: name, gain, price tag, pips, state. On a board the card is a 1px box with the name top-left, pips top-right, gain under, the bill on the last line. On a shelf the tile stacks glyph, name, gain and a boxed tag, pips down its right edge. The rails' row is a card whose price is the shelf's tag box. A goal card on a board wears the 3px double rule; on a shelf the goal is framed as heavy as a plank.
- A card's words are never cut and never run under its pips: a gain wraps; only a name too long for its line is clipped.
- The new mark is one corner triangle, `5em/6`, top-left; a tile stands it in from its edge (`--new-x`, `--new-y`).
- Dark chip (toast, mess tags, skip): ink ground, paper border, ink outline, the float shadow; labels at `--fs-body`, upper, `--track-s`; the toast's name is the one at `--fs-name`.
- Radius: none. The only round shapes are the ladder pips, the clock mark and a pad's face-button glyphs.

## States

- Hover is inversion, inside `@media (hover: hover)` everywhere, so a tap never leaves it stuck. The one exception is a shelf tile, which lifts on a plate.
- Pressed (`:active`) is inversion for every button on every device; a control inverted at rest goes to paper; a shelf tile stands up as on hover.
- Chosen, on and open are inversion.
- Disabled: `--ink-5` and a dashed edge, for every control; never opacity.
- Can't afford: a card or tag goes dashed, the coin short in `--ink-5` and the ones held in ink.
- Focus: the pad's marker -- corner brackets of whole 3px cells a cell clear of the control, in the pad's own `PAD_ACCENT` on a one-cell `PAD_HALO` halo (turned for the dark page by `ink.js`, as the pad's are) that stops at the control's edge (`src/focusmark.js`, through `padglide.js`'s `bracketCells`). The browser's ring is never drawn; a text box is marked as soon as it is in use; with a pad in hand the pad's marker is the one drawn.
