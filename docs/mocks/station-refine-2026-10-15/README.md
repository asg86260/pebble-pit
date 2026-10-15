# Station refine, 2026-10-15

The owner voted option A ("cleaner") of `../station-polish-2026-10-15/` and
said: "lets look at the lectern and the dummy. those can be refined a bit."
This is the mock step. No game code was changed.

`index.html` is self-contained; open it from disk. `snapshot.png` is a
headless shot of it at 2x zoom (the page also has 3x and 4x). There is one card
each for the Mage's lectern and the Assassin's dummy. The Bard's music stand
gets a card too, in case "lectern" meant that one. Each card shows A as voted
and three refined options. Each is drawn before rung 8 and at rung 8, on its
plinth on black. Under the close-ups, each option is drawn at game scale (a
cell is 6 px, 49 cells apart) between its A neighbors in the yard.

All options keep A's register. They use A's shading rule and tones unchanged,
three tones lit from the upper left, one purple class accent (`*`), and the
`R`/`Q`/`K` rung-8 parts. The legend, the shading rule and the tones are in
`../station-polish-2026-10-15/README.md`. A build swaps the chosen rows into
`PROPS_A`'s entry for that station.

## The directions

- **Mage 1:** a slanted reading desk. The book tilts toward you (narrower at
  the top), a lip holds it, and the desk stands on two legs with a stretcher.
- **Mage 2:** a pedestal lectern. One turned column on a stepped foot, a slab
  top, the book open flat with its fanned page edges as a stack (purple at
  rung 8), and the ribbon hanging off the right.
- **Mage 3:** A's lectern with a candle. The book is four cells narrower, and a
  candle stands on the desk's right end. Its flame is the accent in place of
  the ribbon.
- **Assassin 1:** a wooden training dummy. A padded body on a post, a crossbar
  for arms with pegs at the ends, and the dagger in its side.
- **Assassin 2:** a straw-stuffed sack. Straw tufts at the head and wrists, rope
  ties at the neck, wrists and waist, and a target painted on the chest. The
  bull is the accent, so the dagger's pommel is a plain `h` cell.
- **Assassin 3:** A's dummy with the dagger made legible. It sticks straight
  out of the chest: a slit, a bright blade, a crossguard (`Q`), a grip, and the
  pommel as the accent.
- **Bard 1:** the sheet ruled. Four staff lines run across it, with the note
  sitting on one.
- **Bard 2:** a wooden music desk. The sheet is framed in a board, on one
  column with a collar (`Q`, purple at rung 8) and a stepped foot.
- **Bard 3:** a lyre stand. The sheet is held in a lyre-shaped frame whose horns
  flare at the top, on A's column and tripod.

Footprints: the mage options are 16x16 (3 is 16x17), the same as A's 16x16.
The assassin options are 20x18 and the bard options 12x18, the same as A.

The mock cannot show the fighter at the post (a dotted 3x3 square marks where
the body stands), the kits, the scale heaps, the kit marks and pips, the
scaffold, the motes or the light page.

## The rows

The same text as the page's `REFINE` block, ready to paste over the
station's entry in `PROPS_A`. The bottom row stands on the plinth.

### mage

**1.** A slanted reading desk: the book tilts toward you (narrower at the top), a lip holds it, the desk stands on two legs with a stretcher.

```js
mage: { rows: [
  '..HHHHH..HHHHH..',
  '.HHHHHHFFHHHHHH.',
  '.HKKKKHFFHKKKKH.',
  'HHHHHHHFFHHHHHHH',
  'HKKKHHHFFHHHKKKH',
  'HHHHHHHFFHHHHHHH',
  'FFFFFFFFFFFFFFFF',
  '.FFFFFF**FFFFFF.',
  '.FF....**....FF.',
  '.FF....*.....FF.',
  '.FF..........FF.',
  '.FFFFFFFFFFFFFF.',
  '.FF..........FF.',
  '.FF..........FF.',
  '.FF..........FF.',
  'FFFF........FFFF'] },
```

**2.** A pedestal lectern: one turned column on a stepped foot, the book open flat, its fanned page edges showing under it as a stack.

```js
mage: { rows: [
  '..HHHHH..HHHHH..',
  '.HHHHHHHHHHHHHH.',
  'HHKKKHHHHHHKKKHH',
  'HHHHHHHHHHHHHHHH',
  'KKKKKKKFFKKKKKKK',
  '.KKKKKKFFKKKKKK.',
  'FFFFFFFFFFFFF*FF',
  '.....FFFFFF..*..',
  '.......FF....*..',
  '.......FF.......',
  '.......FF.......',
  '......FFFF......',
  '.......FF.......',
  '.......FF.......',
  '.....FFFFFF.....',
  '...FFFFFFFFFF...'] },
```

**3.** A's lectern with a candle: the book is a little narrower, a candle stands on the desk's right end, and its flame is the accent.

```js
mage: { rows: [
  '..............*.',
  '.HHHH..HHHH...*.',
  'HHHHHFFHHHHH..1.',
  'HKKKHFFHKKKH.HHH',
  'HHHHHFFHHHHH.HHH',
  'HKKHHFFHHKKH.HHH',
  'HHHHHFFHHHHH.HHH',
  'FFFFFFFFFFFFFFFF',
  '.FFFFFFFFFFFFFF.',
  '......FFFF......',
  '.......FF.......',
  '......FFFF......',
  '.......FF.......',
  '.......FF.......',
  '.......FF.......',
  '....FFFFFFFF....',
  '..FFFFFFFFFFFF..'] },
```

### assassin

**1.** A wooden training dummy: a padded body on a post, a crossbar for arms with pegs at the ends, the dagger stuck in its side.

```js
assassin: { rows: [
  '.......HHHH.........',
  '......HHHHHH........',
  '......HHHHHH........',
  '.......HHHH.........',
  '........FF..........',
  'FFFFFFFFFFFFFFFFFF..',
  'F.....HHHHHH.....F..',
  '.....HHHHHHHH.......',
  '.....HHHHHHHH....*..',
  '.....HHHHHHHH...R...',
  '.....HHHHHHHH.QR....',
  '.....HHHHHHHHR.Q....',
  '.....HHHHHHHH.......',
  '.....KKKKKKKK.......',
  '......HHHHHH........',
  '........FF..........',
  '........FF..........',
  '.....FFFFFFFF.......'] },
```

**2.** A straw-stuffed sack: straw tufts at the head and wrists, rope ties, a target painted on the chest (the bull is the accent), the dagger in its side.

```js
assassin: { rows: [
  '....S.S..S..........',
  '.....SSSS...........',
  '....SSSSSS..........',
  '....SSSSSS..........',
  '.....SSSS...........',
  '......33............',
  'S3SSSSSSSSSS3S......',
  'S3SSSSSSSSSS3S......',
  '..SSSSSSSSSS........',
  '..SSSKKKKSSS...h....',
  '..SSKSSSSKSS..R.....',
  '..SSKS**SKSS.R......',
  '...SKS**SKSRR.......',
  '...SSKKKKSSR........',
  '...33333333.........',
  '....SSSSSS..........',
  '......FF............',
  '....FFFFFF..........'] },
```

**3.** A's post dummy with the dagger made legible: it sticks straight out of the chest, with a slit, a bright blade, a crossguard, a grip and the pommel as the accent.

```js
assassin: { rows: [
  '.....HHHH...........',
  '....HHHHHH..........',
  '....HHHHHH..........',
  '....HHHHHH..........',
  '.....HHHH...........',
  '......33............',
  '3HHHHHHHHHHHH3......',
  '3HHHHHHHHHHHH3......',
  '..HHHHHHHHHH........',
  '..HHHHHHHHHH..Q.....',
  '..HHHHHHHHH2hhQrr*..',
  '..HHHHHHHHHH..Q.....',
  '...HHHHHHHH.........',
  '...HHHHHHHH.........',
  '...KKKKKKKK.........',
  '....HHHHHH..........',
  '......FF............',
  '....FFFFFF..........'] },
```

### bard

**1.** The sheet ruled: four staff lines across it, the note sitting on one, so it reads as music at a glance.

```js
bard: { rows: [
  '.HHHHHHHHHH.',
  '.HKKKKKKKKH.',
  '.HHHHHKHHHH.',
  '.HKKKKKKKKH.',
  '.HHH**KHHHH.',
  '.HKK**KKKKH.',
  '.HHHHHHHHHH.',
  '.HKKKKKKKKH.',
  'FFFFFFFFFFFF',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '....F..F....',
  '...F....F...',
  '..F......F..',
  '.F........F.'] },
```

**2.** A wooden music desk: the sheet framed in a board, one column with a collar (purple at rung 8), a stepped foot.

```js
bard: { rows: [
  'FFFFFFFFFFFF',
  'FHHHHHKKKHHF',
  'FHHHHHKHKKHF',
  'FHHHHHKHHHHF',
  'FHHHHHKHHHHF',
  'FHHH**KHHHHF',
  'FHHH**HHHHHF',
  'FFFFFFFFFFFF',
  '.FFFFFFFFFF.',
  '....FFFF....',
  '.....FF.....',
  '....QQQQ....',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '....FFFF....',
  '..FFFFFFFF..',
  '.FFFFFFFFFF.'] },
```

**3.** A lyre stand: the sheet held in a lyre-shaped frame whose horns flare at the top, on the column and tripod.

```js
bard: { rows: [
  'F..........F',
  'F.HHHHHHHH.F',
  '.FHHHHHKKKF.',
  '.FHHHHHKHKF.',
  '.FHHHHHKHHF.',
  '.FHHH**KHHF.',
  '..FHH**HHF..',
  '...FFFFFF...',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '.....FF.....',
  '....F..F....',
  '...F....F...',
  '..F......F..',
  '.F........F.'] },
```
