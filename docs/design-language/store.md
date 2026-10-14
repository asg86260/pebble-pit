# The store art

The Steam art follows the drawn game's rules
(`docs/audit/visual-2026-10-14/canvas-rules.md`). `tools/steam-art.mjs`
draws all of it and checks it; `steam/store/README.md` says which file goes
where.

## Color

- Black and white carry everything. The one accent is purple, and the
  capsules do not use it.
- Every tone comes from `src/config`, read by name. No literal color lives in
  `tools/steam-art/`. If the game drops a name the tool reads, the run fails
  and says which name.
  - Paper and ink are `LIGHT_PAPER` and `LIGHT_INK`.
  - The rock and dust use `SHADES`. The rock is shaded through grid.js's own
    `depthShade`, darker the further a cell sits in from the rim, with a step
    of per-grain variation near the rim.
  - The ground hatch is `GROUND_TEXTURE` 2, a mark every `GROUND_TILE`
    cells, at `GROUND_INK` of black.
  - Clouds use `CLOUD_TONE` to `CLOUD_UNDER`, shaded the way weather.js
    shades them: `CLOUD_LIT`, `CLOUD_MID` and `CLOUD_SHADE_REACH`.
  - Birds use `BIRD_TONE`.
  - Icons use `SHELF_INK`: the coin stroke, and ghost for a locked icon.
- The coins keep their colors on the icons, because a coin stroke means the
  same thing it means on the shelf.

## Grid

- There is one cell, `P`. A capsule larger than its picture is drawn at its
  design size and scaled up by a whole number with smoothing off:
  - the hero and the logo are doubled;
  - the others are drawn at 1:1.
- The title's letters are whole multiples of the cell.
- Every fill lands on a whole cell, so the capsules have no antialiased
  pixels. `--check` reports 0% lone pixels.

## The yard's own parts

- **Bodies** are drawn the way drawBody draws them, with `WORKER` and HATS
  from sprites.js. Each one stands on the highest rock cell under its three
  columns. Nothing floats.
- **Nothing is cut.**
  - Clouds, motes, spray and birds keep clear of the title. Nothing paints a
    white box over them.
  - Clouds stay whole inside the frame.
  - The spoil heap goes on whichever side of the rock it fits whole, or is
    left out.

## Achievement icons

- Each icon is the shelf's glyph, drawn as drawGlyph draws it, on a 64-px
  design at six pixels a cell, then scaled 4x to 256. The badge uses the
  shelf's ratio of badge cell to glyph cell.
- A ladder's rungs wear the shelf's rung mark: a column of pips down the
  right edge.
  - Each pip is one of the drawing's cells.
  - The first rung is at the foot.
  - Rungs reached are filled; the rest are rings.
- A locked icon is the unbuilt glyph's ghost edge, pips included.
- No two icons may be the same picture, locked or unlocked. The run hashes
  every file and fails on a repeat.

## Screenshots

- The screenshots are the game itself, captured at 1920x1080 with nothing
  resampled afterward.
  - The device ratio is `2 * P / CELL`, so a world pixel is exactly two device
    pixels.
  - The view is held where the intro holds it, with the ground two thirds of
    the way down.
- The press's scanlines stay. Its vignette, the game's one gradient, is left
  off. Smoothing is pinned off, so the yard's cached tiles are doubled rather
  than filtered.
- The DOM HUD (purse, boards) is real text at a 2.4 ratio, so it is the one
  place with antialiasing.

## Not yet the game's

The title is a private 5x7 face. In the game, the name is DOM monospace text.
One title drawing should live in `src`, used by both the title page and the
capsules. That needs `src`, which this tool does not own.
