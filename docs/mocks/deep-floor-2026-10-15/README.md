# The deep's floor: texture options (2026-10-15)

The owner: "add a texture to the abyss floor instead of just a solid gray
block." Shot in the real game, with the floor's drawing (`drawDeepFloor`,
render/deep.js) edited for the shot only and not committed. Every cell is
picked by a hash of its world cell, so nothing moves or swims with the
camera, and every tone is one of the deep's kept greys (0, 2, 4, 6, 8, 10) or
purples (3, 5). The top course stays the stone grey, a rung over the ground,
so the floor still has an edge against the water.

- **now**: what ships today. A stone-grey top course over flat ground grey.
- **A · speckle**: one cell in four goes to a neighboring grey (mostly the
  darker grey 2, some stone 6), like the yard's ground. A few top-course
  cells drop to ground so the edge reads less ruled.
- **B · strata**: a lit-speckled top course, a half-stone row under it, then
  ground grey that turns to the darker grey (2) a few rows down. The band edge
  wanders a cell up or down in three-cell runs, and a thin ground-grey seam
  sits lower down. Only about seven rows of floor show on screen, so the
  darkening reads as two bands.
- **C · rubble**: flat ground with scattered stones two or three cells wide
  (one or two high) in stone grey, each with a dark shadow cell row under it,
  and a few dark pits between.
- **D · silt and scales**: A's speckle plus dim purple flecks (purple 3, a few
  purple 5), about one cell in twenty-five, under the top two rows.

Files: `<option>-<scene>-<width>x<height>-<theme>.png` is the whole window,
and `...-floor2x.png` the floor band cropped from its middle at 2x. The scenes
are `deep-all` (four stations on the floor) and `crusher` (the bed of scales
heaped along the floor). The deep is dark on both pages, so the light and dark
shots differ only in the page's UI.
