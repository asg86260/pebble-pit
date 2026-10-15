# Station polish, 2026-10-15

The owner asked for a design pass on the stations: "now that the decoration is
the focus, lets polish them". This is the mock step. No game code was changed.

`index.html` is self-contained; open it from disk. `snapshot.png` is a
headless shot of it at 3x zoom. The page shows every prop as it is on main
today (f4928882), and in two polished directions. Each is drawn before rung 8
and at rung 8, close up. The whole set is also drawn at game scale (a cell is
6 px, stations 49 cells apart).

- **A, cleaner and iconic.** The same silhouettes, tidied up. Each part has
  three tones: a lit top and left edge, the body, and a shadow on the right
  and bottom edges. The thing a class trains with is a step lighter than its
  frame. Each prop carries one small purple class accent.
- **B, richer and more detailed.** A's silhouettes plus a fourth tone (deep
  corners, cast shadows, a wider shadow side on round things). B also adds
  material detail: grain, nails, bolts, staves, straw texture, stitching, a
  ladle, staff lines, a folded page corner, quillons, a two-tailed ribbon.

Both options light the props from the upper left with the grey rungs. They drop
today's purple light along every top edge (`'top'` in `propCells`), so purple is
left for the class accent before rung 8. At rung 8 the accent turns bright, and
the same parts that turn purple today turn purple again, with their shading
kept.

The mock cannot show the fighter at the post (a dotted 3x3 square marks where
the body stands), the kits, the scale heaps, the kit marks and pips, the
scaffold, the motes or the light page. It uses the abyss ramps' raw tones, not
the dark page's mapped ones.

## What a build would change

- `src/deep/props.js`: `PROPS` takes the chosen option's rows, and `propCells`
  takes the shading rule below in place of "one body grey, `'top'` on every top
  edge". The rule needs only the rows, so it stays a pure dealer. `R8_PARTS`
  and `under` go: the rung-8 parts are the `R`/`Q`/`K` materials and the
  `h r d g z` cells, and the accent is `*`.
- `BREW`: the brew row is the `B` cells. Option B's pot is two rows taller,
  with a ladle, so its brew is row 3 (`brew: 3`). The bubble keeps its beat.
- The ramps are roles in the deep palette (G1..G5 = DEEP_GREY rungs 2, 4, 6, 8,
  10; Pa..Pe = DEEP_PURPLE dim, low, mid, glow, bright), so they belong in
  config as named tones and not as hex. G5 (`pale`) is now in a prop, as the lit
  edge. It is still under the kits' white. Check one kit over each prop before
  landing.
- Footprints are within a cell or two of today's. The crate is 14x13 (A) or
  14x14 (B), up from 12x12. B's hexer is 14x14, up from 14x12. B's mage is
  16x17. The bard is 12 wide, up from 10. `propRect` and `plinthRect` read the
  widths from the rows, so the plinths follow.

## Legend

| cell | meaning | before rung 8 | from rung 8 |
|---|---|---|---|
| `H` | the trained-with thing (bag, bell, blade, target, pot) | ramp G5 G4 G3 G2 | same |
| `F` | frame, timber, stand | ramp G4 G3 G2 G1 | same |
| `S` | straw, sacking (B dithers it) | ramp as H | same |
| `R` | rung-8 part, light | H's ramp | Pe Pd Pc Pb |
| `Q` | rung-8 part, dark | F's ramp | Pd Pc Pb Pa |
| `K` | paint, tape, hoops, text | F's ramp | Pe Pd Pc Pb |
| `h` `r` `d` | an R cell's hi, shade, deep by hand | G5 G3 G2 | Pe Pc Pb |
| `g` `z` | a Q cell's hi, shade by hand | G4 G2 | Pd Pb |
| `1`-`5` | a grey by hand | G1..G5 | same |
| `v` `w` | purple by hand | Pd, Pc | same |
| `*` | the class accent | Pc | Pe |
| `+` | appears at rung 8 | nothing | Pe |
| `B` | the brew | Pb | Pc |
| `.` | nothing | | |

Shading for a material cell, lit from the upper left. A cell that is open
water counts as empty. A runs:

1. If the cell above is empty, use the hi tone.
2. If the cells to both the left and right are empty, use the body tone.
3. If only the left is empty, use the hi tone.
4. If the right or the cell below is empty, use the shade tone.
5. Otherwise, use the body tone.

B runs these extra checks:

- Before A's rule: a cell with empty water to its right and below, but not
  above or to its left, takes the deep tone. An `H` or `S` cell sitting under
  another material that is not a rung-8 part takes the shade tone.
- After A's rule finds the body tone: on a run seven or more cells wide, the
  cell second from the right takes the shade tone. `S` cells dither to the
  shade tone where `(2r + 3c) % 5 == 0`.

## The rows

The same text as the page's `props-data` block. The bottom row stands on the
plinth.

### Option A

```js
export const PROPS_A = {
  crate: { rows: [
    '..S..S.S...S..',
    '.SSSSSSSSSSS..',
    'FFFFFFFFFFFFFF',
    'FHHHHHHHHHHFFF',
    'FHHHHHHHHHFFHF',
    'F22222222FF22F',
    'FHHHHHHHFFHHHF',
    'FHHHHHHFFHHHHF',
    'F22222FF22222F',
    'FHHHHFFHHHHHHF',
    'FHHHFFHHHHHHHF',
    'FHHFFHHHHHHHHF',
    'FFFFFFFFFFFFFF'] },
  brawler: { rows: [
    'FFFFFFFFFFFFFF..',
    'FFFFFFFFFFFFFF..',
    'FFFF.......g....',
    'FFF........z....',
    'FF........Q*Q...',
    'FF......KKKKKKK.',
    'FF.....HHHHHHHHH',
    'FF.....KKKKKKKKK',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....HHHHHHHHH',
    'FF.....KKKKKKKKK',
    'FF.....HHHHHHHHH',
    'FF......KKKKKKK.',
    'FFFF............',
    'FFFFFF..........'] },
  sword: { rows: [
    '....**....**........',
    '....RR....RR........',
    '....RR....RR........',
    '...RRRR..RRRR.......',
    '....HH....HH........',
    '....HH....HH........',
    'FFFFHHFFFFHHFFFF..FF',
    'FFFFHHFFFFHHFFFFFFFF',
    'FF..HH....HH......FF',
    'FF..HH....HH......FF',
    'FF..HH....HH......FF',
    'FF..HH....HH......FF',
    'FF...H.....H......FF',
    'FFFFFFFFFFFFFFFFFFFF',
    'FF................FF',
    'FFF..............FFF'] },
  monk: { rows: [
    'FF..................FF',
    'FFFFFFFFFFFFFFFFFFFFFF',
    '.FFFFFFFFFFFFFFFFFFFF.',
    '..FF......gg......FF..',
    '..FF.....RRRR.....FF..',
    '..FF....RRRRRR....FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF...RRRRRRRR...FF..',
    '..FF..RRRRRRRRRR..FF..',
    '..FF.RRRRRRRRRRRR.FF..',
    '..FF......**......FF..',
    '..FF..............FF..',
    '.4FF44444444444444FF4.',
    '33FF33333333333333FF33'] },
  martial: { rows: [
    '..55..........',
    '..RR..........',
    '..RR......55..',
    '.*RR......RR..',
    '**RR......RR..',
    '*.RR..55..RR..',
    '..RR..RR..RR..',
    '..RR..RR..RR..',
    'FFRRFFRRFFRRFF',
    'F.RR..RR..RR.F',
    'F.RR..RR..RR.F',
    'F.RR..RR..RR.F',
    'FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFF',
    'FF..........FF',
    'FF..........FF'] },
  ranger: { rows: [
    '....SSSSS..3....',
    '..SSSSSSSSS.43..',
    '.SSSKKKKKSS4.3..',
    '.SSKSSSSS4SS....',
    'SSKSSSSS4SKSS...',
    'SSKSSS*SSSKSS...',
    'SSKSS***SSKSS...',
    'SSKSSS*SSSKSS...',
    'SSKSSSSSSSKSS...',
    '.SSKSSSSSKSSS...',
    '.SSSKKKKKSSS....',
    '..SSSSSSSSS.....',
    '....SSSSS.......',
    '....F.F.F.......',
    '...F..F..F......',
    '...FFFFFFF......',
    '..F...F...F.....',
    '.F....F....F....'] },
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
    '..HHHHHHHHHH...*....',
    '..HHHHHHHHHH..R.....',
    '..HHHHHHHHHH.R......',
    '...HHHHHHHHRR.......',
    '...HHHHHHHHR........',
    '...KKKKKKKK.........',
    '....HHHHHH..........',
    '......FF............',
    '....FFFFFF..........'] },
  hexer: { brew: 1, rows: [
    '.HHHHHHHHHHHH.',
    '.HBBBBBBBBBBH.',
    'HHHHHHHHHHHHHH',
    'R.HHHHHHHHHH.R',
    'RRHHHHHHHHHHRR',
    '.HHHHHHHHHHHH.',
    '.HHHHHHHHHHHH.',
    '.HHHHHHHHHHHH.',
    '..HHHHHHHHHH..',
    '...HHHHHHHH...',
    '...F..FF..F...',
    '..F...FF...F..'] },
  sapper: { rows: [
    '..........**......',
    '.........4........',
    '......KKKKKK......',
    '.....HHHHHHHH.....',
    '.....KKKKKKKK.....',
    '.....HHHHHHHH.....',
    '.....HHHHHHHH.....',
    '.....KKKKKKKK.....',
    '.....HHHHHHHH.....',
    '......KKKKKK......',
    '.KKKKKK....KKKKKK.',
    'HHHHHHHH..HHHHHHHH',
    'KKKKKKKK..KKKKKKKK',
    'HHHHHHHH..HHHHHHHH',
    'HHHHHHHH..HHHHHHHH',
    'KKKKKKKK..KKKKKKKK',
    'HHHHHHHH..HHHHHHHH',
    '.KKKKKK....KKKKKK.'] },
  mage: { rows: [
    '.HHHHH....HHHHH.',
    'HHHHHHH..HHHHHHH',
    'HKKKKHHFFHHKKKKH',
    'HHHHHHHFFHHHHHHH',
    'HKKKHHHFFHHHKKKH',
    'HHHHHHHFFHHHHHHH',
    'FFFFFFFFFFFFFFFF',
    '.FFFFFF**FFFFFF.',
    '.....FF**FF.....',
    '.......**.......',
    '......FFFF......',
    '.......FF.......',
    '.......FF.......',
    '.......FF.......',
    '....FFFFFFFF....',
    '..FFFFFFFFFFFF..'] },
  bard: { rows: [
    '.HHHHHHHHHH.',
    '.HHHHHKKKHH.',
    '.HHHHHKHKKH.',
    '.HHHHHKHHHH.',
    '.HHHHHKHHHH.',
    '.HHH**KHHHH.',
    '.HHH**HHHHH.',
    '.HHHHHHHHHH.',
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
};
```

### Option B

```js
export const PROPS_B = {
  crate: { rows: [
    '..S....S...S..',
    '..SS.S.SS.SS..',
    '.SSS3SSSS3SSS.',
    '5FFFFFFFFFFFF5',
    'FHH3HHHHHHHFFF',
    'FHHHHHH3HHFFHF',
    'F11111111FF11F',
    'FHH3HHHHFFHHHF',
    'FHHHHHHFFH3HHF',
    'F11111FF11111F',
    'FHHHHFFHHH3HHF',
    'FH3HFFHHHHHHHF',
    'FHHFFHHHH3HHHF',
    '5FFFFFFFFFFFF5'] },
  brawler: { rows: [
    'FFFFFFFFFFFFFF..',
    'FFFF2FFFFF2FFF..',
    'FFF5.......g....',
    'FFF........z....',
    'FF........Q*Q...',
    'FF......KKKKKKK.',
    'FF.....H55HHHH33',
    'FF.....KKKKKKKKK',
    'FF.....H5HHHHH33',
    'FF.....H5HHHHH33',
    'FF.....HHHHHHH33',
    'FF.....HHHHHHH32',
    'FF.....HHHHHHH32',
    'FF.....KKKKKKKKK',
    'FF.....HHHHHH332',
    'FF......KKKKKKK.',
    'FFFF............',
    'FFFFFF..........'] },
  sword: { rows: [
    '....**....**........',
    '....Rr....Rr........',
    '....rR....rR........',
    '...RRRR..RRRR.......',
    '...rHHr..rHHr.......',
    '....H3....H3........',
    'FFFFHHFFFFHHFFFF..FF',
    'F5FFHHFF5FHHFFFF115F',
    'FF..H3....H3......FF',
    'FF..HH....HH......FF',
    'FF..H3....H3......FF',
    'FF..HH....HH......FF',
    'FF...H.....H......FF',
    'F5FFFFFFFFFFFFFFFF5F',
    'FF................FF',
    'FFF..............FFF'] },
  monk: { rows: [
    '4F..................F4',
    'FFFFFFFFFFFFFFFFFFFFFF',
    '.FF2FFFFFFFFFFFFFF2FF.',
    '..FF......gz......FF..',
    '..FF.....hhRr.....FF..',
    '..FF....hhRRRr....FF..',
    '..FF...RhRRRRrr...FF..',
    '..FF...RhRRRRrr...FF..',
    '..FF...RhRRRRrr...FF..',
    '..FF...RhRRRRrd...FF..',
    '..FF..rrrrrrrrrd..FF..',
    '..FF.RhhRRRRRRRrd.FF..',
    '..FF......**......FF..',
    '..FF......33......FF..',
    '.4FF43434343434343FF4.',
    '34FF34343434343434FF34'] },
  martial: { rows: [
    '..55..........',
    '..Rr..........',
    '..RR......55..',
    '.*rr......Rr..',
    '**RR......RR..',
    '*+RR..55..rr..',
    '+.rr..Rr..RR..',
    '..RR..RR..RR..',
    '5FRRFFrrFFRRF5',
    'F.RR..RR..RR.F',
    'F.Rr..RR..Rr.F',
    'F.RR..rR..RR.F',
    'FFFFFFFFFFFFFF',
    'F2FFFF2FFFF2FF',
    'FF..........FF',
    'FFF........FFF'] },
  ranger: { rows: [
    '....SSSSS..3....',
    '..SSSSSSSSS.43..',
    '.SSSKKKKKSS4.3..',
    '.SSKSSSSS4SS....',
    'SSKSSSSS4SKSS...',
    'SSKSSS*SSSKSS...',
    'SSKSS*h*SSKSS...',
    'SSKSSS*SSSKSS...',
    'SSKSSSSSSSKSS...',
    '.SSKSSSSSKSSS...',
    '.SSSKKKKKSSS....',
    '..SSSSSSSSS.....',
    '....SSSSS.......',
    '....F.F.F.......',
    '...F..F..F......',
    '...F22F22F......',
    '..F...F...F.....',
    '.FF...F...FF....'] },
  assassin: { rows: [
    '.....HHHH...........',
    '....HHHHHH..........',
    '....H3HH3H..........',
    '....HHHHHH..........',
    '.....H33H...........',
    '......22............',
    'S3HHHHHHHHHH3S......',
    'S3HHHHHHHHHH3S......',
    '..HHHHHHHHHH........',
    '..HHHH33HHHH...*....',
    '..HHH3HH3HHH..R.....',
    '..HHH3HH3HHH.R......',
    '...HHH33HHHRR.......',
    '...HHHHHHHHR........',
    '...KKKhhKKKK........',
    '....HHHHHH..........',
    '......FF............',
    '....FFFFFF..........'] },
  hexer: { brew: 3, rows: [
    '............R.',
    '...........R..',
    '.HHHHHHHHHRHH.',
    '.HBBBBBBBRBBH.',
    'HH3HHHH3HHHH3H',
    'R.HHHHHHHHHH.R',
    'RRH5HHHHHHH3RR',
    '.H55HHHHHHH33.',
    '.H5HHHHHHHH32.',
    '.HHHHHHHHHH32.',
    '..HHHHHHHH32..',
    '...HHHHH322...',
    '...F..FF..F...',
    '..F...FF...F..'] },
  sapper: { rows: [
    '...........*......',
    '.........4*+......',
    '......KKKKKK......',
    '.....HH3HH3HH.....',
    '.....KKKKKKKK.....',
    '.....HH3HH3HH.....',
    '.....HH32H3HH.....',
    '.....KKKKKKKK.....',
    '.....HH3HH3HH.....',
    '......KKKKKK......',
    '.KKKKKK....KKKKKK.',
    'HH3HH3HH..HH3HH3HH',
    'KKKKKKKK..KKKKKKKK',
    'HH3HH3HH..HH3HH3HH',
    'HH3HH3HH..HH32H3HH',
    'KKKKKKKK..KKKKKKKK',
    'HH3HH3HH..HH3HH3HH',
    '.KKKKKK....KKKKKK.'] },
  mage: { rows: [
    '.HHHHH....HHHHH.',
    'HHHHHHH..HHHHHHH',
    'HKKKKHHFFHHKKKHH',
    'HHHHHHHFFHHHHHHH',
    'HKKKHHHFFHKKKKHH',
    'HKKKKKHFFHHHHHHH',
    '3333333FF3333333',
    'FFFFFFFFFFFFFFFF',
    '.FFFFFF**FFFFFF.',
    '.....FF**FF.....',
    '.......**.......',
    '......FFFF......',
    '.......FF.......',
    '......FFFF......',
    '.......FF.......',
    '....FFFFFFFF....',
    '..FF2FFFFFF2FF..'] },
  bard: { rows: [
    '.HHHHHHHH3..',
    '.HHHHHKKKH3.',
    '.3333K3KK33.',
    '.HHHHHKHHHH.',
    '.33333K3333.',
    '.HHH**KHHHH.',
    '.333**33333.',
    'FHHHHHHHHHHF',
    'FFFFFFFFFFFF',
    '.....FF.....',
    '.....FF.....',
    '....FFFF....',
    '.....FF.....',
    '.....FF.....',
    '....F..F....',
    '...F....F...',
    '..F......F..',
    '.FF......FF.'] },
};
```

### The shading rule and the tones, as the mock runs them

```js
// --- the tones, and the shading rule ----------------------------------------
const G = ['#000000', '#121216', '#26262c', '#42424a', '#6e6e78', '#b4b4c0'];
const PU = { a: '#1b112c', b: '#2d1d47', c: '#412465', d: '#5c2ba6', e: '#9b5de5' };
const RAMP = {
  H: [G[5], G[4], G[3], G[2]], F: [G[4], G[3], G[2], G[1]], S: [G[5], G[4], G[3], G[2]],
  R: [G[5], G[4], G[3], G[2]], Q: [G[4], G[3], G[2], G[1]], K: [G[4], G[3], G[2], G[1]],
  R8: [PU.e, PU.d, PU.c, PU.b], Q8: [PU.d, PU.c, PU.b, PU.a], K8: [PU.e, PU.d, PU.c, PU.b]
};
const MAT = new Set(['H', 'F', 'S', 'R', 'Q', 'K']);
const PART = new Set(['R', 'Q', 'K']);

// Tone index into a material's ramp (0 hi, 1 body, 2 shade, 3 deep) for the
// cell at (r, c), lit from the upper left. A: edges against open water only.
// B: also a deep corner, a cast shadow under another material, a wider
// shadow side on anything seven or more cells across, and straw dithered.
function shadeIndex(rows, r, c, style) {
  const at = (rr, cc) => (rows[rr] && rows[rr][cc]) || '.';
  const m = at(r, c), empty = ch => ch === '.' || ch === '+';
  const up = empty(at(r - 1, c)), lf = empty(at(r, c - 1)), rt = empty(at(r, c + 1)), dn = empty(at(r + 1, c));
  if (style === 'B') {
    const above = at(r - 1, c);
    if (rt && dn && !up && !lf) return 3;
    if (!up && (m === 'H' || m === 'S') && MAT.has(above) && above !== m && !PART.has(above)) return 2;
  }
  if (up) return 0;
  if (lf && rt) return 1;
  if (lf) return 0;
  if (rt || dn) return 2;
  if (style === 'B') {
    let a = c, b = c;
    while (!empty(at(r, a - 1))) a--;
    while (!empty(at(r, b + 1))) b++;
    if (b - a + 1 >= 7 && (m === 'H' || m === 'R' || m === 'S') && empty(at(r, c + 2))) return 2;
    if (m === 'S' && (r * 2 + c * 3) % 5 === 0) return 2;
  }
  return 1;
}

// Every cell of an option's prop as [col, row, color], `lit` from rung 8.
function cellsOf(opt, lit, style) {
  const out = [], rows = opt.rows;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    let col = null;
    if (MAT.has(ch)) {
      const ramp = lit && PART.has(ch) ? RAMP[ch + '8'] : RAMP[ch];
      col = ramp[shadeIndex(rows, r, c, style)];
    } else if (ch >= '1' && ch <= '5') col = G[+ch];
    else if (ch === 'h') col = lit ? PU.e : G[5];
    else if (ch === 'r') col = lit ? PU.c : G[3];
    else if (ch === 'd') col = lit ? PU.b : G[2];
    else if (ch === 'g') col = lit ? PU.d : G[4];
    else if (ch === 'z') col = lit ? PU.b : G[2];
    else if (ch === 'v') col = PU.d;
    else if (ch === 'w') col = PU.c;
    else if (ch === '*') col = lit ? PU.e : PU.c;
    else if (ch === '+') col = lit ? PU.e : null;
    else if (ch === 'B') col = lit ? PU.c : PU.b;
    if (col) out.push([c, r, col]);
  }));
  return out;
}

// Today's cells (src/deep/props.js propCells): one body grey, the purple
// light along every top edge, the rung-8 parts and accent.
function todayCells(key, lit) {
  const p = TODAY[key], parts = lit ? TODAY_R8[key] || [] : [], out = [];
  const open = (c, r) => (p.rows[r] && p.rows[r][c] || '.') === '.';
  p.rows.forEach((row, r) => [...row].forEach((ch0, c) => {
    let ch = ch0;
    if (ch === '*') { if (lit) { out.push([c, r, PU.e]); return; } ch = p.under; }
    if (ch === '.') return;
    if (parts.includes(ch)) out.push([c, r, PU.d]);
    else if (open(c, r - 1)) out.push([c, r, PU.c]);
    else out.push([c, r, G[4]]);
  }));
  return out;
}

// The hexer's brew (props.js BREW): a bubble over the surface on a
// 1.8 s beat, a cell every 0.2 s for 1.2 s, in one of four lanes from column 5.
const BREW = { pace: 0.9, period: 1.8, life: 1.2, step: 0.2, lane0: 5, lanes: 4 };
function bubble(row, lit, t, todayStyle) {
  const k = (t * BREW.pace) % BREW.period;
  if (k >= BREW.life) return null;
  const c = BREW.lane0 + Math.floor(t / BREW.period) % BREW.lanes, r = row - 1 - Math.floor(k / BREW.step);
  return [c, r, lit ? PU.d : (todayStyle ? G[3] : PU.c)];
}
```

