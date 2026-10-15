# A pointing hand in place of the "click this" arrow (mock, 2026-10-15)

What the owner asked for: a hand with its index finger out, pointing at the thing
to click (the constrict's orb first), instead of the arrow.

This is a mock. Nothing in the game has changed. The in-game shots come
from a scratch patch to `drawOrb` that was never committed.

## Where the game draws a "click this" mark today

| where | file:line | today's drawing | points |
|---|---|---|---|
| the constrict's orb (click it to crack it) | `src/render/serpent.js:664-667` (`drawOrb`), `ORB_ARROW_S`/`ORB_ARROW_UP` in `src/config/deep.js:278` | white 5x3 arrow made from cell offsets, bobbing up 1 cell every 0.4 s | down |
| the portal's way down, in the yard | `src/render/shaftway.js:20,61` (`LEFT`, `drawYardArrow`), `SHAFT_ARROW_*` in `src/config/deepdraw.js:119-131` | 3x5 chevron, light abyss tone, sine bob of 1 cell | left, at the portal |
| the portal's way up, in the deep | `src/render/shaftway.js:19,66` (`UP`, `drawDeepArrow`) | 5x3 chevron, deep white | up |
| a station whose Recruit waits on its first pick | `src/render/deep.js:385-414` (`chooseMarkAt`, `drawChooseMark`), `CHOOSE_MARK` in `src/config/deepdraw.js:599` | 7x5 white chevron on a dark keyline, held 1-cell bob every 600 ms | down |
| stations a held body can be dropped on | `src/render/aura.js:280-291` (`drawAuras`), `DROP_MARK_*` in `src/config/aura.js:83` | black 3+1 cell arrow, sine bob | down |
| a worker you just asked for by name | `src/render/crew.js:353-371` (`ARROW`, `drawPointed`) | black 5x3 arrow over the head, sine bob | down (marks a body; does not ask for a click) |

These are not click hints and are left alone: the pad's focus brackets
(`src/render/padmark.js`), the "Inspired" chevrons (`src/render/arms.js:204`),
and the DOM "raise" call (`src/board.js:305`), which is text.

If a hand goes everywhere: the orb, the Recruit mark and the drop marks all
point **down**. The two shaft arrows need a hand pointing **left** (yard) and
**up** (deep). Those are the same drawing turned. Turned 90 degrees, the
thumb ends up on the top edge, which still reads. The drop mark and the
worker mark are 1 to 3 cells today, so a hand there is a much bigger mark.

## Options

All four point down, on the `P` cell grid. Today's arrow is 5x3. Each option
comes in a base size and a size up (`+`).

- **A · classic glove.** The cursor hand: white glove with a black outline,
  curled fingers as stubs. Base 9x11, size up 13x13. In the deep the outline
  is the deep's purple.
- **B · silhouette.** One solid ink with no inner lines and a 1-cell keyline
  around it in the other tone. Black on the light page, white on the dark
  page, the deep's bright purple on a black keyline in the deep. Base 7x9,
  size up 9x12.
- **C · chunky two-tone with a cuff.** The glove with a separate cuff band in
  a second tone (grey, or purple in the deep) and shaded finger stubs. Base
  10x11, size up 12x14.
- **D · tiny icon.** Single ink with no outline, the same weight as today's
  arrow. Base 5x7 (the arrow's width), size up 7x9.

### The tap (all options)

The hand holds still for 0.6 s, then drops one whole cell (a press) for
0.2 s and comes back up. The cycle is 0.8 s, with held poses and no smooth
bob. It replaces the arrow's 0.4 s up-and-down. The GIFs are those two
frames.

## Files

- `overview.png`: all eight drawings at 6x on white, on black and in the deep.
- `glyph-<opt>.png`: one drawing at 1x, 3x and 6x (one cell = 6 px at 1x),
  on white, on black and in the deep. `glyph-<opt>-tap.gif` is the same
  sheet tapping.
- `game-light-all.png`, `game-dark-all.png`: the `phase-orb` scene cropped
  around the orb at 3x, with today's arrow first and then each option.
  `game-<theme>-<opt>.png` is one crop. `game-<theme>-<opt>-tap.gif` is that
  crop tapping.
- `plus` in a file name means the size-up version (`A+` and so on).

What the shots show and what they cannot:
- The deep is dark under both page themes, so the light and dark game shots
  look almost the same. The light and dark difference only shows on the
  `glyph-*` sheets.
- In the constrict the coil passes right over the orb. Any hand taller than
  about 7 cells reaches up into the coil. It still draws on top, because
  `orb` comes after `serpent` in `LAYERS`. When the orb has risen, the
  serpent's health bar can cover the top of a tall hand. Today's 3-row
  arrow clears both. D, and B at base size, are the only options that stay
  mostly clear.
- The scratch patch puts the fingertip 1 cell above the orb's hp bar, with
  the finger centered on the orb.

## The rows (top row first; drop into `GLYPHS` / config)

Key: `#` is line or ink, `o` is the glove's body, `+` is the second tone,
`.` is empty. B and D are one ink. B also gets a 1-cell keyline painted
around it (every empty cell touching ink, the way `drawChooseMark` does).

```js
A:  ['..######.', '..#ooooo#', '.#oooooo#', '#ooooooo#', '#o#ooooo#', '##o#o#o##', '.#o#o###.', '.#o###...', '.#o#.....', '.#o#.....', '..#......']
A+: ['...#########.', '...#ooooooo#.', '..#oooooooo#.', '.#ooooooooo#.', '#ooo#ooooooo#', '#oo#oooooooo#', '###oo#oo#oo#.', '..#oo#oo####.', '..#oo####....', '..#oo#.......', '..#oo#.......', '..#oo#.......', '...##........']
B:  ['..####.', '.######', '#######', '#######', '.######', '.##.##.', '.##....', '.##....', '.##....']
B+: ['...#####.', '..#######', '.########', '#########', '#########', '.########', '.##.####.', '.##..##..', '.##......', '.##......', '.##......', '.##......']
C:  ['.########.', '.#++++++#.', '.########.', '.#oooooo#.', '#oooooooo#', '#o#oooooo#', '##oo+o+o#.', '.#oo####..', '.#oo#.....', '.#oo#.....', '..##......']
C+: ['.##########.', '.#++++++++#.', '.#++++++++#.', '.##########.', '.#oooooooo#.', '#oooooooooo#', '#ooo#ooooo#.', '#oo#oooooo#.', '###oo+oo+o#.', '..#oo#####..', '..#oo#......', '..#oo#......', '..#oo#......', '...##.......']
D:  ['..###', '.####', '#####', '.#.##', '.#...', '.#...', '.#...']
D+: ['..#####', '.######', '#######', '.#.####', '.#..##.', '.#.....', '.#.....', '.#.....', '.#.....']
```

The fingertip is in the bottom row, at column 2 for A and C, column 3 for
A+ and C+ (a 2-wide finger, columns 3-4), and column 1 for B, B+, D and D+
(B's finger is columns 1-2).

Deep tones in the scratch patch: line `PURPLES[WHITE-2]`, body `GREYS[WHITE]`,
second tone `PURPLES[WHITE]`, keyline `GREYS[0]`.
