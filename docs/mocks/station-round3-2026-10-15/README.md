# Station round three, 2026-10-15

The owner said: "lets look at the stations a bit, the default station is a bit
wonky, and the lectern still reads like an ass." This is the mock step. No
game code was changed.

`index.html` is self-contained; open it from disk. `snapshot.png` is a headless
shot of it at 2x zoom (the page also has 3x and 4x). There are two cards, one
for the crate (the unclassed station's prop, `PROPS.crate`) and one for the
Mage's lectern (`PROPS.mage`, the version with the candle). Each card shows
today's prop, read straight from `src/deep/props.js` at f96610d2, and four
options. Each is drawn before rung 8 and at rung 8, on its plinth on black.
Under the close-ups, each option is drawn at game scale (a cell is 6 px, 49
cells apart) between its neighbors as they are today.

## What is wonky about the crate

The brace does not run corner to corner. It stops two cells short of the
bottom-left corner and clots into a three-wide block at the top right, which
traps one lone board cell. The planks are uneven (2, 2 and 3 rows). The straw
sits left of center, and the lid's bare right end pokes out past it. Together
these make the box look skewed. All of it shows in the in-game 3x shot of
`party-props-a`.

## What reads wrong about the lectern

Today the open book is two round-cornered pages that meet at a dark
full-height seam. That reads as a cleft between two round lobes. No option
here has two rounded halves meeting at a center seam.

## The directions

- **Crate 1:** squared up. The brace runs exactly corner to corner at 45
  degrees, there are three even planks, and the straw is centered and level
  (14x15).
- **Crate 2:** no brace. Three even planks sit between doubled corner posts,
  and the straw is centered. It is the quietest box (14x15).
- **Crate 3:** turned a little. The lid's back edge and the shaded right side
  show, so it reads as a box. The planks are even and there is no brace
  (14x13).
- **Crate 4:** X-braced. Both diagonals run corner to corner and cross at the
  middle plank. There are three even planks, and the box is symmetric about its
  center (14x15).
- **Mage 1:** a tilted book, seen at an angle. The left page is a narrow strip
  curling up, the right page is large and square, and the spine sits off
  center.
- **Mage 2:** square pages with an unbroken top. The top edge is flat and the
  corners are square. The spine is a thin line that stops short of the top,
  and a page-stack edge shows under the book.
- **Mage 3:** a closed tome lying on the desk. It is a thick shut book with its
  striped page block facing you and a clasp (`R`) across it. The candle moves
  to the left end.
- **Mage 4:** a scroll on the stand. The rolled top has rod knobs poking out,
  and the sheet hangs over the desk's front edge with text lines on it. The
  candle stays on the right.

Footprints: today's crate is 14x13, and the options are 14x13 or 14x15. Every
mage option is 16x17, the same as today. The mage options keep A's register:
three tones lit from the upper left, A's shading rule unchanged, and the candle
flame as the one purple accent (`*`). Their `K` text lines and Mage 3's `R`
clasp turn purple at rung 8. The crate has no class, so as today it has no
accent and no rung-8 parts.

The mock cannot show the fighter at the post (a dotted 3x3 square marks where
the body stands), the kits, the scale heaps, the kit marks and pips, the
scaffold, the motes or the light page.

## The rows

These are the same text as the page's `REFINE` block, ready to paste over the
station's entry in `PROPS` (`src/deep/props.js`). The bottom row stands on the
plinth.

### crate

**1.** Squared up: the brace runs exactly corner to corner at 45 degrees, three even planks, the straw centered and level.

```js
crate: { rows: [
  '..S..S..S..S..',
  '.SSSSSSSSSSSS.',
  'FFFFFFFFFFFFFF',
  'FHHHHHHHHHHFFF',
  'FHHHHHHHHHFFHF',
  'FHHHHHHHHFFHHF',
  'F2222222FF222F',
  'FHHHHHHFFHHHHF',
  'FHHHHHFFHHHHHF',
  'FHHHHFFHHHHHHF',
  'F222FF2222222F',
  'FHHFFHHHHHHHHF',
  'FHFFHHHHHHHHHF',
  'FFFHHHHHHHHHHF',
  'FFFFFFFFFFFFFF'] },
```

**2.** No brace: three even planks between doubled corner posts, the straw centered. The quietest box.

```js
crate: { rows: [
  '..S..S..S..S..',
  '.SSSSSSSSSSSS.',
  'FFFFFFFFFFFFFF',
  'FFHHHHHHHHHHFF',
  'FFHHHHHHHHHHFF',
  'FFHHHHHHHHHHFF',
  'FF2222222222FF',
  'FFHHHHHHHHHHFF',
  'FFHHHHHHHHHHFF',
  'FFHHHHHHHHHHFF',
  'FF2222222222FF',
  'FFHHHHHHHHHHFF',
  'FFHHHHHHHHHHFF',
  'FFHHHHHHHHHHFF',
  'FFFFFFFFFFFFFF'] },
```

**3.** Turned a little: the lid's back edge and the shaded right side show, so it reads as a box; even planks, no brace.

```js
crate: { rows: [
  '...S..S..S..S.',
  '..SSSSSSSSSSS.',
  '.FFFFFFFFFFFFF',
  'FFFFFFFFFFFF3F',
  'FHHHHHHHHHF33F',
  'FHHHHHHHHHF33F',
  'F222222222F33F',
  'FHHHHHHHHHF33F',
  'FHHHHHHHHHF33F',
  'F222222222F33F',
  'FHHHHHHHHHF33F',
  'FHHHHHHHHHF3F.',
  'FFFFFFFFFFFF..'] },
```

**4.** X-braced: both diagonals corner to corner, crossing at the middle plank, three even planks, symmetric about the center.

```js
crate: { rows: [
  '..S..S..S..S..',
  '.SSSSSSSSSSSS.',
  'FFFFFFFFFFFFFF',
  'FFFHHHHHHHHFFF',
  'FHFFHHHHHHFFHF',
  'FHHFFHHHHFFHHF',
  'F222FF22FF222F',
  'FHHHHFFFFHHHHF',
  'FHHHHHFFHHHHHF',
  'FHHHHFFFFHHHHF',
  'F222FF22FF222F',
  'FHHFFHHHHFFHHF',
  'FHFFHHHHHHFFHF',
  'FFFHHHHHHHHFFF',
  'FFFFFFFFFFFFFF'] },
```

### mage

**1.** Tilted book: seen at an angle, the left page a narrow strip curling up, the right page large and square; the spine sits off-center.

```js
mage: { rows: [
  '..............*.',
  'HH............*.',
  'HHHFHHHHHHHH..1.',
  'HHHFHKKKKKKH.HHH',
  'HKKFHHHHHHHH.HHH',
  'HHHFHKKKKHHH.HHH',
  'HKKFHHHHHHHH.HHH',
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

**2.** Square pages, unbroken top: flat top edge and square corners, the spine a thin line that stops short of the top, a page-stack edge under it.

```js
mage: { rows: [
  '..............*.',
  'HHHHHHHHHHH...*.',
  'HKKKKHKKKKH...1.',
  'HHHHH3HHHHH..HHH',
  'HKKKH3HKKKH..HHH',
  'HHHHH3HHHHH..HHH',
  '33333333333..HHH',
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

**3.** A closed tome lying on the desk: a thick shut book, its striped page block facing you, a clasp across it; the candle moves to the left end.

```js
mage: { rows: [
  '.*..............',
  '.*..............',
  '.1...HHHHHHHHHH.',
  'HHH.HHHHHHHHRHHH',
  'HHH.H5555555R55H',
  'HHH.HKKKKKKKRKKH',
  'HHH.HHHHHHHHHHHH',
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

**4.** A scroll on the stand: a rolled top with its rod knobs poking out, the sheet hanging over the desk's front edge with text lines; candle at the right.

```js
mage: { rows: [
  '..............*.',
  'FHHHHHHHHHHF..*.',
  '.3333333333...1.',
  '.HHHHHHHHHH..HHH',
  '.HKKKKKKKKH..HHH',
  '.HHHHHHHHHH..HHH',
  '.HKKKKKHHHH..HHH',
  'FHHHHHHHHHHFFFFF',
  '.HKKKKKKKHHFFFF.',
  '.3333333333.....',
  '.......FF.......',
  '......FFFF......',
  '.......FF.......',
  '.......FF.......',
  '.......FF.......',
  '....FFFFFFFF....',
  '..FFFFFFFFFFFF..'] },
```
