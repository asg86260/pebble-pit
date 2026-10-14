# The drawn game: its rules, as built

What the canvas does, after the visual consistency pass of 2026-10-14
(`docs/audit/visual-2026-10-14/`). A new drawing follows these; a drawing that
cannot is a question for the owner, not an exception made quietly.

## Palette

Black and white are the normal. Purple is the one accent, for anything outside
the normal. The coins keep their own colors. Every tone is a rung of a ramp in
`src/config/palette.js`. A render file writes no color literal other than
`'#000'` and `'#fff'`.

| token | what it is | what it means |
|---|---|---|
| `'#000'` / `'#fff'` | ink and paper | Mass is black; a way through (door, mouth, throat) is white. |
| `GREY` | 11 rungs, paper `#fff` to ink `#000` | How deep the rock was, and what is faded, far, empty or inactive. Rungs 5 to 10 are the dust's `SHADES`. The darkest dust rung is the buildings' `#000`: one black for mass. |
| `PURPLE` | 14 rungs, `#000` to the lit `#b79af2` | Magic and everything outside the normal: the wizards, the deep's light, the foe's state, the heal, the pad's marker, the finale's door. `MAGIC_TONES`, `ABYSS_MAGIC_TONES`, `FINALE_PURPLE*` and `PAD_*ACCENT` are rungs of it. |
| `COIN_TONES.ore / crop / spark` | 4 tones each | What a site gave up: the quarry's blue, the plots' green, the star's red. `COIN` is the one tone a mark is drawn in; `COIN_DARK` is the dark page's (the stylesheet reads both as `--coin-*`). A tonic takes its reagent coin's tone. |
| `ABYSS_TONES` | 12 greys, black to white | The abyss's own: the drowned pit and the rift draw the whole ramp. The deep draws only its kept rungs (below). |
| `SMOG_TINTS`, `AIR_TINTS`, `MUCK_*` | the sky's dirt | Which works dirtied the sky; muck. |

Dark mode is `ink.js`'s map over all of it, by lightness; nothing draws a
dark-page color by hand.

### The deep's palette

The deep is capped (the owner's B4, `docs/mocks/deep-background-2026-10-14.html`):
six greys and five purples, every other rung of `ABYSS_TONES` and
`ABYSS_MAGIC_TONES`, plus white, plus the scales' own coin greys. Nothing else
is drawn there. The rungs and their roles are `config/deepdraw.js`:

| `DEEP_GREY` | rung | for |
|---|---|---|
| `hole` | 0 | a way through: the portal's mouth, the furnace's door, a keyline |
| `water` | 2 | the one flat water, top to floor; the one grey kept over black, so a hole in it reads as a hole |
| `ground` | 4 | the floor, the domes, a pod's hull, the furnace's mortar, the faintest mark a creature dims to |
| `stone` | 6 | the props, the plinths, the furnace's brick, the floor's top course |
| `lit` | 8 | the plinths' top course, a porthole, a rim |
| `pale` | 10 | the hide's light side, the fire's grey |
| `white` | 11 | what is made or held: kits, bodies, the serpent's hide, the fire's heart |

| `DEEP_PURPLE` | rung | for |
|---|---|---|
| `dim` | 3 | the far stream, the giant, the focus lines, the faintest star and silt |
| `low` | 5 | a dome's top edge, silt |
| `mid` | 7 | silt, the unlit brew's bubble |
| `glow` | 9 | a rung-8 part, the lit brew, a glyph's stroke over a deep station |
| `bright` | 11 | the accent, the heal, the foe's statuses |

- The deep's ramps (`GREYS`, `PURPLES` in `render/deeptones.js`) are indexed by
  abyss rung and hold only kept tones: a grey rung the deep drops is the kept
  one under it, a purple the nearest kept. A drawer stepping down a ramp by
  index stays on the cap. `greyAt`, `purpleAt` and `dimmed` never go under the
  ground's grey or the dimmest purple: a dimmed thing is a fainter mark, not a
  hole in the water.
- What is built is a flat one-rung silhouette (props, domes, plinths, floor,
  pods, furnace), its top edges lit by `DEEP_BREATH`, the purple light from
  above stepping `low, mid, glow, mid`, a held rung at a time.
- The water is one flat tone; the field keeps only its stars, all purple, and
  a star under the dimmest purple is not drawn. No veil.
- Text in the deep is the number font, or for a word (a status's name)
  `crispText` (`render/crisptext.js`): its smoothing snapped to the deep's own
  greys over the ground it stands on.
- Anything laid between device pixels -- a body, a kit, a scale, a glyph stack
  -- is snapped to them (`fillOnPixels`, `onPixel` in `render/frame.js`;
  `drawBody`'s square): at a zoom that is not whole, an edge laid between
  pixels is a blend of two inks.
- A fade in the deep is opacity, as in the yard (Fades, below): outside the
  cap. A scene holding the deep washes it as it washes the yard.
- The browser's `deep palette` group (`src/selftest/deeppalette.js`) stands the
  deep's scenes, at the window's fit and pulled in, and names any color on the
  glass the cap does not hold, and the layer that drew it. It reads the frame
  at full ink (globalAlpha held at 1 for the frame it reads), so whatever is
  mid-fade is checked as drawn and the fade itself is exempt.

## Grid

- `P = 6`. Every fill is whole cells at a cell-snapped origin
  (`Math.round(x / P) * P`). A gap between marks is a skipped cell.
- Eaves, lips and caps are a whole cell (`SHACK_EAVE = P`) or none.
- Far things are on the same cell, darker or paler; depth is tone, not a finer
  grid.
- Screen-space marks have their own pixel, always whole:
  - the coin marks are `COIN_MARKS` (`glyphs.js`, 5x5) at 2 screen px;
  - numbers are `NUM_FONT` at `NUM_FONT_PX` = 2 screen px.
- Smoothing is off on the yard's context, re-pinned after every resize
  (`world.js`).

## Marks

- **Coins.** `COIN_MARKS` holds a square of dust, the quarry's triangle, the
  plots' hexagon and the spark's plus. The spark is a plus everywhere: the
  counter, the casino's feet, the badge and the DOM. `drawCoin` in
  `render/marks.js` draws them. No vector paths for marks.
- **Numbers.** Every count drawn on the canvas uses `writeCount`
  (`render/numfont.js`): the pixel face keyed in one font pixel of paper. That
  covers the corner counter, the roster, the kit stands and the stock. The
  fight's numbers keep their grey drop line.
- **The warning.** The pile-full mark is the hollow triangle with a bar and a
  dot (`warning` in `render/pilemarks.js`), as it was before the pass: the
  bitmap at `P / 3` was tried and read worse.

## Line

- The thinnest line in the world is `P / 3` (2 px). 1 px is only for
  screen-space rims.
- A rule lies inside its box, never centered on the edge: `rule()` in
  `render/marks.js`, or `strokeRect(x + 1, y + 1, w - 2, h - 2)` at
  `lineWidth = 2`.
- No `ctx.arc` and no diagonal stroke in the world. Rings and slopes are cells:
  `cell()`, the bridge's and the belt's steps. The written exceptions: the
  rift's round stars and its rim, and the casino lever's arm, a stroke along
  its swing, which reads better as a moving thing than as stepped cells.

## Variation

- Material is never one tone. Dust carries a shade per grain and the rock is
  depth-shaded.
- The muck band, the hill's deep core, the star's crust and the cauldrons stay
  flat: a hash-dealt grain through them was tried and read worse.
- Yard buildings are flat ink silhouettes, and so is what is built in the
  deep: one rung each, its top edges lit (the deep's palette, above). The deep's
  only texture is its stars and its silt.

## Fades

Fading by opacity is an animation effect, not a color: it is outside the
palette rules, the deep's cap included. A thing coming or going fades
smoothly with `globalAlpha`, and the tones it passes through mid-fade are not
palette tones and need not be. The palette rules are about what is drawn at
full ink. Stepping a fade down a ramp in held tones was tried and read worse;
the smooth fade stays. A scene holding the deep washes it as it washes the
yard.

## Motion

- `src/motion.js` holds the curves: `smoothstep`, `outCubic`, `quadInOut`,
  `lerp`, `held(k, steps)` (a floor), `poseAt(table, k)` and `topOf`. No module
  writes its own copy.
- Travel eases. A reaction is a run of held poses.
  - The one drawn hop is `HOP_POSES`: the finale's crowd, a landing, his hop
    against the ribs.
  - The jaw is `JAW_POSES` (shut, ajar, gape) through `jawPose`: the bite, the
    snatch and the roar.
- No shake. The strike's flash is the one flash, and it is kept for effect:
  a dark pane over the frame for `BOLT_FLASH_S` with the bolt white on top
  (`drawFlash`), never in the deep.
  - A strained shield leans a held cell at a time (`SHIELD_LEAN`).
  - Drifts move in held steps on whole cells; a throb of opacity (the sink's warning) is a fade, and smooth.
  - Nothing appears without a fade or a build; a fade is a smooth one.
- The press is scanlines only. There is no vignette, because the game draws no
  gradient.
