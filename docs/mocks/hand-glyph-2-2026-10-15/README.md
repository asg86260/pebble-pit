# A pointing hand for the orb, second pass (mock, 2026-10-15)

The owner said round one (`../hand-glyph-2026-10-15/`) "all look a bit odd".
This round draws four new hands. It is a mock: nothing in the game changed,
and the in-game shots come from a scratch patch to `drawOrb`
(`src/render/serpent.js`) that was reverted.

## Why round one read odd

- **The hand was a cap with a stem.** Each drawing was widest at the top and
  had a rounded top edge, with a thin finger hanging under it. Pointing down,
  that reads as a mushroom, an umbrella or a jellyfish, not a hand. A real
  hand pointing down comes out of a narrow wrist and is widest at the
  knuckles, near the bottom. Every option here has a straight, narrow wrist
  or cuff on top.
- **There was no thumb.** In A and C the "thumb" was one diagonal pixel
  inside the palm, which looked like a stray. In B and D it was missing. Here
  the thumb is its own lobe on the left: an outlined bump in E and F, and in
  G and H a lobe with a one-cell gap between it and the finger.
- **The knuckles read as teeth.** Round one's curled fingers were stubs
  hanging level under the palm. Here they are three bumps that step up toward
  the pinky (middle lowest, then ring, then pinky), with one-cell dividers and
  notches under them. Long dividers read as drips, so these stop after one
  cell.
- **The outline disappeared in the deep.** A black line on the deep's black
  ground is invisible, so the white fill becomes a blob with black cuts in it
  (see `game-E-blackline.png`). E and F use the deep's purple
  (`PURPLES[WHITE-2]`) for their line in the deep, and black on a page.

## Options

All four point down. One cell is `P`, 6 px at 1x.

- **E · classic cursor, cleaned (10x10).** The old-OS hand cursor flipped to
  point down. It has a black 1-cell outline and a white fill, a 1-cell index
  finger 4 cells long, a thumb lobe on the left and three stepped knuckles.
  Its line is purple in the deep.
- **F · cursor with a cuff (10x10).** The same hand with a 3-row cuff in place
  of the wrist: a grey band on a page, a purple band in a purple frame in the
  deep. To fit in 10 rows the palm is one row shorter than E's.
- **G · solid silhouette (8x9).** One ink with no inner lines. The thumb, the
  finger and the knuckles are separated by one-cell gaps, so the thumb stays
  crisp. It is black on white. On the dark page and in the deep it is white
  with a 1-cell black keyline (every empty cell touching ink, as
  `drawChooseMark` does).
- **H · minimal (5x7).** One ink with no outline, the same weight as today's
  arrow. It has a 1-cell finger 3 cells long, a thumb split off by a gap and
  one knuckle notch. It is white in the deep.

The tap is the same for all four: the hand holds still for 0.6 s, then drops
one whole cell for 0.2 s (the press) and comes back up. The GIFs are those
two frames, timed that way.

## What the in-game shots show, and what they cannot

- The scene is `phase-orb`, cropped around the orb at 3x, frozen with
  `__still`. In the patch, the fingertip sits 1 cell above the orb's hp bar at
  rest and touches the bar on the press. The finger is centered on the orb.
- In this frame, every option clears the hp bar. The tops of E and F (10
  rows) touch the underside of the coil. G (9 rows) leaves a gap and H
  (7 rows) leaves more. When the coil sags lower or the orb rises, a 10-row
  hand runs into the coil sooner than the others do. It still draws on top,
  because `orb` comes after `serpent` in `LAYERS`.
- Only one page theme was shot. The deep is dark under both themes, so the
  two would look the same (round one showed this).
- `glyph-*` sheets are plain shapes on flat grounds, not the game. The deep
  ground there is `#0a0a0c`, sampled from round one.

## Files

- `overview.png`: all four side by side, at 1x and 4x, on white, on black and
  in the deep.
- `glyph-<E|F|G|H>.png`: one drawing at 1x, 3x and 6x on white, black and the
  deep. `glyph-<opt>-tap.gif` is the same sheet tapping.
- `game-all.png`: today's arrow and then every option on the orb, at rest.
- `game-<opt>.png` and `game-<opt>-tap.gif`: one option on the orb, at rest
  and tapping. `today` is the current arrow, frozen in its up pose and then
  its down pose. `E-blackline` and `F-blackline` show the black line in the
  deep, for comparison only.

## The rows (top row first; drop into `GLYPHS` / config)

Key: `#` is the line (or the ink for G and H), `o` is the white fill, `+` is
the cuff band, `.` is empty.

```js
E: ['..#####...', '..#ooo#...', '.#ooooo##.', '#o#ooooo##', '#o#oooooo#', '.##o#o#o#.', '..#o##.#..', '..#o#.....', '..#o#.....', '...#......']
F: ['.#######..', '.#+++++#..', '.#######..', '#ooooooo#.', '#o#ooooo##', '.##o#o#o#.', '..#o##.#..', '..#o#.....', '..#o#.....', '...#......']
G: ['..##....', '.####...', '######..', '#.#####.', '#.######', '..#.#.#.', '..#.....', '..#.....', '..#.....']   // + 1-cell keyline on dark grounds
H: ['..##.', '.###.', '#####', '#.###', '#.#.#', '..#..', '..#..']
```

The fingertip is the single ink cell in the bottom row: column 3 for E and F,
and column 2 for G and H.

Tones in the scratch patch for the deep: line `PURPLES[WHITE-2]` (E and F),
fill `GREYS[WHITE]`, cuff band `PURPLES[WHITE]`, ink `GREYS[WHITE]` (G and H),
keyline `GREYS[0]`.
