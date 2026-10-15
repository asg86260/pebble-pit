# The default station, away from the crate, 2026-10-15

The owner said: "lets get away from the crate. lets try something else
generic." This is the mock step. No game code was changed.

`index.html` is self-contained; open it from disk. `snapshot.png` is a headless
shot of it at 2x zoom (the page also has 3x and 4x). It uses the same drawing
code, palette and A shading rule as `docs/mocks/station-round3-2026-10-15/`.
Today's props are read from the live `PROPS` in `src/deep/props.js` (at
4475a25b, main at 791ef2ec).

The page shows today's crate and six replacements. Each one says "a station
waiting for a class" without belonging to any class, and none looks like the
ten class props. Each is drawn at the chosen zoom twice: once standing on its
plinth, and once going up inside the scaffold. The scaffold is derived from
that option's footprint the way `drawScaffold` (render/deep.js) derives it
today, with the prop as a faint ghost for reference. Below that is a strip at
game scale for each: Brawler, the default, Swordsman and Mage, then one slot
going up inside the default's scaffold.

## The directions

1. **Bench** (14x13): a plain trestle bench with a folded blanket on it,
   somewhere to sit and wait, with nothing on it that says a trade.
2. **Anvil** (14x13): an anvil on a stump, horn to the left and a
   bark-streaked stump under it, the yard's workbench before anyone has a
   craft.
3. **Notice** (14x13): a notice board on two posts under a little cap, with one
   blank, dog-eared sheet pinned to it: the posting nobody has answered yet.
4. **Tent** (14x13): a pitched tent, poles crossed at the top and the flap open
   on a dark mouth: a camp made, its owner not arrived.
5. **Cairn** (14x12): a cairn of stacked stones in three courses offset like
   brickwork, a marker that says someone will stand here.
6. **Flag** (14x15): a blank swallowtail flag on a pole, flying toward the
   post, its colors still to be painted, the pole set in a foot.

Every option keeps A's clean register: three greys lit from the upper left, A's
shading rule unchanged, and no accent and no rung-8 parts, because the default
has no class. All are 14 wide, like the crate. The flag is two cells taller
and the cairn one shorter. The scaffold's posts stand SCAFFOLD_OVER cells over
the taller of the prop and the post, so the flag's scaffold stands two cells
taller than today's and the cairn's one shorter.

The mock cannot show the fighter at the post (a dotted 3x3 square marks where
the body stands), the kits, the scale heaps, the motes, the pointing hand over
an unchosen station or the light page.

## The rows

These are ready to paste over `crate` in `PROPS` (`src/deep/props.js`). The
bottom row stands on the plinth. If the key is renamed, see "What a swap
touches" below.

**1. Bench**

```js
crate: { rows: [
  '...SSSSSSSS...',
  '..SSSSSSSSSS..',
  '..S44444444S..',
  '..SSSSSSSSSS..',
  'FFFFFFFFFFFFFF',
  'F222222222222F',
  '.FF........FF.',
  '.FF........FF.',
  '.FFFFFFFFFFFF.',
  '.FF........FF.',
  '.FF........FF.',
  '.FF........FF.',
  'FFF........FFF'] },
```

**2. Anvil**

```js
crate: { rows: [
  '..HHHHHHHHHHH.',
  'HHHHHHHHHHHHH.',
  '..HHHHHHHHHHH.',
  '.....HHHHHH...',
  '.....HHHHHH...',
  '....HHHHHHHH..',
  '.FFFFFFFFFFFF.',
  '.FF2FFFFF2FFF.',
  '.FF2FFFFF2FFF.',
  '.FFFF2FFFF2FF.',
  '.FFFF2FFFF2FF.',
  '.FF2FFFFFFFFF.',
  'FFFFFFFFFFFFFF'] },
```

**3. Notice**

```js
crate: { rows: [
  'FFFFFFFFFFFFFF',
  '.FFFFFFFFFFFF.',
  '.F2222222222F.',
  '.F22SS55SS22F.',
  '.F22SSSSSS22F.',
  '.F22SSSSSS22F.',
  '.F22SSSSSS22F.',
  '.F22SSSSS422F.',
  '.F2222222222F.',
  '.FFFFFFFFFFFF.',
  '..FF......FF..',
  '..FF......FF..',
  '..FF......FF..'] },
```

**4. Tent**

```js
crate: { rows: [
  '....F....F....',
  '.....F..F.....',
  '......FF......',
  '.....SSSS.....',
  '.....SSSS.....',
  '....SSSSSS....',
  '....SSSSSS....',
  '...SSS11SSS...',
  '...SS1111SS...',
  '..SSS1111SSS..',
  '..SS111111SS..',
  '.SSS111111SSS.',
  'FSSS111111SSSF'] },
```

**5. Cairn**

```js
crate: { rows: [
  '......HHH.....',
  '.....HHHHH....',
  '.....HHHHH....',
  '......HHH.....',
  '...HHHH.HHHH..',
  '..HHHHH.HHHHH.',
  '..HHHHH.HHHHH.',
  '...HHH...HHH..',
  '.HHHH.HHHH.HHH',
  'HHHHH.HHHH.HHH',
  'HHHHH.HHHH.HHH',
  'HHHHH.HHHH.HHH'] },
```

**6. Flag**

```js
crate: { rows: [
  '.HH...........',
  '.FFSSSSS4SSSSS',
  '.FFSSSSS4SSSSS',
  '.FFSSSSS4SSSS.',
  '.FFSSSSS4SSS..',
  '.FFSSSSS4SSSS.',
  '.FFSSSSS4SSSSS',
  '.FFSSSSS4SSSSS',
  '.FF...........',
  '.FF...........',
  '.FF...........',
  '.FF...........',
  '.FF...........',
  'FFFF..........',
  'FFFFF.........'] },
```

## What a swap touches

- **The unclassed station** (`propKey` in `src/deep/props.js`), from rung 1
  to the last rung before the fork.
- **The build's scaffold.** A station still going up has no class, so
  `standOfStation` (`src/deep/place.js`) reads its ground off the default's
  rows, and `drawScaffold` (`src/render/deep.js`) stands its posts
  SCAFFOLD_OVER cells over that. A taller or shorter default makes every
  scaffold taller or shorter. The comment on `SCAFFOLD_OVER` in
  `src/config/deepdraw.js` says "the crate it will be".
- **The same ground for everything else that reads it**: the pointer's hit
  box for the station's board, where the works stack, and the pointing hand
  over an unchosen station (`chooseMarkAt`, CHOOSE_MARK_UP cells over the
  ground's top).
- **Tests and scenes that name the key**: `test/props.test.mjs` (a new
  station "stands beside the crate, cell for cell", and the
  every-prop-keeps-clear-of-the-next-slot check, which is fine at 14 wide);
  `party-props-a` and its `say` text in `src/scenes.js`.
- **Not affected**: `GLYPHS.crate` in `src/glyphs.js` (the shelf's fallback
  glyph, also worn by the bench station and by `hop.js` and `deep/rails.js`)
  is a separate drawing that shares only the name. No finale or cutscene uses
  `PROPS.crate`.
