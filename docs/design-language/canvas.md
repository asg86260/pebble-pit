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
| `ABYSS_TONES` | the deep's own greys | The deep's (on hold with C20; left as it is). |
| `SMOG_TINTS`, `AIR_TINTS`, `MUCK_*` | the sky's dirt | Which works dirtied the sky; muck. |

Dark mode is `ink.js`'s map over all of it, by lightness; nothing draws a
dark-page color by hand.

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
- A large mass of one material deals one cell in `MASS_DEAL` a neighboring tone
  by a stable hash (`dealt` in `render/tone.js`). This covers the muck band, the
  hill's deep core and the star's crust. The cauldrons take the hut's grain.
- Yard buildings are flat ink silhouettes. Whether the deep's props follow is
  C20, on hold.

## Fades

A fade steps down its own ramp, toward the ground it is on, in `FADE_STEPS`
held steps. It never thins with alpha.

- `toned(c, k)` gives a color `k` of the way there, snapped to its ramp.
  `toned(c, k, true)` fades toward black, for the rift's hole and the deep's
  numbers.
- `withTone(g, k, fn)` and `toneOn(g, k)` fade everything a stretch of drawing
  sets. `cellImage().begin(c, r, k)` does the same for a cached picture.
- `globalAlpha` is left only for:
  - the press's scanlines;
  - whole-frame veils (the recede's wash, the crew sight veil);
  - the crew-view fade switch, which is there to see through;
  - the grit's difference patch.

## Motion

- `src/motion.js` holds the curves: `smoothstep`, `outCubic`, `quadInOut`,
  `lerp`, `held(k, steps)` (a floor), `poseAt(table, k)` and `topOf`. No module
  writes its own copy.
- Travel eases. A reaction is a run of held poses.
  - The one drawn hop is `HOP_POSES`: the finale's crowd, a landing, his hop
    against the ribs.
  - The jaw is `JAW_POSES` (shut, ajar, gape) through `jawPose`: the bite, the
    snatch and the roar.
- No flash and no shake.
  - A strike is the bolt itself, with no pane over the window.
  - A strained shield leans a held cell at a time (`SHIELD_LEAN`).
  - Throbs and drifts move in held steps on whole cells.
  - Nothing appears without a fade or a build.
- The press is scanlines only. There is no vignette, because the game draws no
  gradient.
