# The Mage's candelabra, 2026-10-15

The owner said: "lets actually just have it be a candelabra instead of book."
This is the mock step. No game code was changed.

`index.html` is self-contained; open it from disk. It uses the same drawing
code, palette and shading rule as `docs/mocks/station-round3-2026-10-15/`.
`snapshot.png` is a headless shot of it at 2x (the page also has 3x and 4x).
The card shows today's lectern (`PROPS.mage`, read from `src/deep/props.js`
at 791ef2ec) and four candelabras. Each is drawn before rung 8 and at rung 8,
on its plinth on black. Under the close-ups, each is drawn at game scale
(a cell is 6 px, 49 cells apart) between the Sapper and the Bard as they are
today.

## The directions

- **1:** a tall three-branch floor candelabra. Three candles stand on cups
  above a cross-arm, on a shaft with two knops and a footed base.
- **2:** a five-branch candelabra, stepped. A tall center candle, a middle
  pair and a low outer pair each stand on a cup, and the arms gather into one
  bar over the shaft.
- **3:** a small three-candle candelabra standing on a little side table that
  has a stretcher.
- **4:** a tall single-shaft floor candle stand. One thick candle with wax
  drips stands in a shallow tray, drips hang off the rim, and the shaft has a
  knop and a footed base.

Every option is 16x17, the same as today, and none has two rounded halves.
They keep A's register: three grey tones lit from the upper left, with A's
shading rule unchanged. The flames (`*`) are the one purple accent before
rung 8, and they are small and still. At rung 8 the `R` cups (on 4, the drips)
and the `K` knops (on 3, the base) turn purple too. A candelabra is open
metalwork, so all four read lighter than their full-bodied neighbors; 3, with
its table, carries the most weight.

The mock cannot show the fighter at the post (a dotted 3x3 square marks where
the body stands), the kits, the scale heaps, the kit marks and pips, the
scaffold, the motes or the light page.

## The rows

These are the same text as the page's `REFINE` block, ready to paste over the
`mage` entry in `PROPS` (`src/deep/props.js`). The bottom row stands on the
plinth.

**1.** Tall three-branch floor candelabra: three candles on cups, a cross-arm, a shaft with two knops, a footed base. Cups and knops turn purple at rung 8.

```js
mage: { rows: [
  '.*.....*.....*..',
  '.**....**....**.',
  '.HH....HH....HH.',
  '.HH....HH....HH.',
  'RRRR..RRRR..RRRR',
  '.FF....FF....FF.',
  '.FF....FF....FF.',
  '..FFFFFFFFFFFF..',
  '.......FF.......',
  '......KKKK......',
  '.......FF.......',
  '.......FF.......',
  '.......FF.......',
  '......KKKK......',
  '.......FF.......',
  '.....FFFFFF.....',
  '...FFF.FF.FFF...'] },
```

**2.** Five-branch, stepped: a tall center candle, a middle pair, a low outer pair, each on its cup, the arms gathered into one bar over the shaft.

```js
mage: { rows: [
  '.......*........',
  '.......**.......',
  '....*..HH..*....',
  '....*..HH..*....',
  '.*..H..HH..H..*.',
  '.*..H.RRRR.H..*.',
  '.H.RRR.FF.RRR.H.',
  'RRR.F..FF..F.RRR',
  '.F..F..FF..F..F.',
  '.FF.F..FF..F.FF.',
  '..FFFFFFFFFFFF..',
  '.......FF.......',
  '......KKKK......',
  '.......FF.......',
  '.......FF.......',
  '.....FFFFFF.....',
  '...FFF.FF.FFF...'] },
```

**3.** A small three-candle candelabra on a little side table with a stretcher; its cups and base turn purple at rung 8.

```js
mage: { rows: [
  '.......*........',
  '...*...**...*...',
  '...*...HH...*...',
  '...H...HH...H...',
  '...H..RRRR..H...',
  '..RRR..FF..RRR..',
  '...F...FF...F...',
  '...FFFFFFFFFF...',
  '.......FF.......',
  '.....KKKKKK.....',
  'FFFFFFFFFFFFFFFF',
  '.FFFFFFFFFFFFFF.',
  '.FF..........FF.',
  '.FF..........FF.',
  '.FFFFFFFFFFFFFF.',
  '.FF..........FF.',
  'FFF..........FFF'] },
```

**4.** Tall single-shaft floor candle stand: one thick candle with wax drips standing in a shallow tray, drips hanging off the rim, a knop and a footed base. Drips and knop turn purple at rung 8.

```js
mage: { rows: [
  '.......*........',
  '.......**.......',
  '......HHHH......',
  '......RHHH......',
  '......RHHR......',
  '......HHHR......',
  '..F...HHHH...F..',
  '..FFFFFFFFFFFF..',
  '...FFFFFFFFFF...',
  '...R...FF...R...',
  '.......FF.......',
  '......KKKK......',
  '.......FF.......',
  '.......FF.......',
  '.......FF.......',
  '.....FFFFFF.....',
  '...FF..FF..FF...'] },
```
