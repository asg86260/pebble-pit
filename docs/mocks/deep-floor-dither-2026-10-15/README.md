# The deep's floor: a dithering fade (2026-10-15, round 2)

The owner, on round one (`../deep-floor-2026-10-15/`): "It should be a simple
pattern. Like the surface. A dithering fade?"

**Which "surface" this matches.** The yard's ground, under the ground line
(`drawGroundTexture`, render/ground.js): one-cell marks laid on a fixed
repeating rule (`GROUND_TEXTURE = 2`, a diagonal hatch every six cells), not
hashed noise. The pit's liquid surface and the abyss field are hashed
star noise, which is what round one already was, so they are not the
"simple pattern" asked for. The options below take the ground's grammar (a fixed
cell rule, so the same cells every frame, nothing moves) and use it as an
ordered dither that fades the floor from its top course down.

Shot in the real game with `drawDeepFloor` (render/deep.js) edited for the
shot only. Nothing is committed but this folder. Static, on the `P = 6`
lattice, columns keyed to the world cell (`x / P`) so the pattern never slides
with the camera. Only the deep's kept grey rungs are used: 8 lit, 6 stone,
4 ground, 2, and 0 the hole/water black.

- **now**: what ships. A stone (6) top course over flat ground (4).
- **A · Bayer fade**: the top course is stone (6), and over the next six rows
  it dithers through ground (4) into the darker grey (2) on a 4x4 Bayer
  matrix. It reads as a checker band, then a thinning one, then flat 2.
- **B · lit edge + Bayer fade**: A, one row lower, under a solid one-cell lit
  (8) top edge. The floor gets a bright rim against the water, like the
  stations' top edges.
- **C · two-step**: a stone top course, two rows of 50% checker
  stone/ground, two rows of flat ground, then a 75% and a 25% ground-on-black
  dither (two rows each) into black. It is the plainest pattern: only
  checkers and every-other-cell dots.

Only about seven and a half rows of floor show at both 2000x963 and 1200x800
(the floor stands 45 px above the window's bottom), so each fade is fitted
into those rows. Anything below them is never seen.

Files: `<option>-<scene>-<width>x<height>-<theme>.png` is the whole window,
and `...-floor2x.png` is the floor band cropped from the middle at 2x (60 px
over and 45 px under the floor's top). The scenes are `deep-all` (four
stations on the floor) and `crusher` (the bed of scales heaped along it). The
deep is dark on both pages, so light and dark differ only in the page's UI.

## The drawing, per option

All three replace the two fills in `drawDeepFloor` with a cell loop. `GREYS`
is already imported in render/deep.js. A real build would put the row rules
in config (`DEEP_FLOOR_*`) and paint them once into a cached pattern, as
`groundPattern()` does, rather than a fillRect a cell a frame.

```diff
 export function drawDeepFloor() {
   const win = deepWindow();
   const fy = deepFloor(), from = Math.min(win.x0, deepX0() - P * 4), to = Math.max(win.x1, deepX1() + P * 4);
-  ctx.fillStyle = TONE.stone;
-  ctx.fillRect(from, fy, to - from, P);
-  ctx.fillStyle = TONE.ground;
-  ctx.fillRect(from, fy + P, to - from, (GROUND_ROWS - 1) * P);
+  const c0 = Math.floor(from / P), c1 = Math.ceil(to / P);
+  for (let r = 0; r < GROUND_ROWS; r++) for (let c = c0; c < c1; c++) {
+    const g = floorRung(c, r);
+    ctx.fillStyle = g === 0 ? TONE.hole : GREYS[g];
+    ctx.fillRect(c * P, fy + r * P, P, P);
+  }
   ctx.fillStyle = '#000';
 }
+
+const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
+// rung `top` at row 0 down to rung `bottom` at row `rows`, between kept
+// (even) rungs by a 4x4 Bayer threshold
+function fade(c, r, top, bottom, rows) {
+  const L = top - (top - bottom) * Math.min(1, r / rows);
+  const k = Math.max(bottom, Math.min(top - 2, 2 * Math.floor(L / 2)));
+  return BAYER[r & 3][c & 3] < (L - k) / 2 * 16 ? k + 2 : k;
+}
```

**A**

```js
const floorRung = (c, r) => fade(c, r, 6, 2, 6);
```

**B**

```js
const floorRung = (c, r) => (r === 0 ? 8 : fade(c, r - 1, 6, 2, 6));
```

**C** (needs no `fade` or `BAYER`)

```js
function floorRung(c, r) {
  if (r === 0) return 6;                              // stone top course
  if (r <= 2) return (c + r) & 1 ? 6 : 4;             // checker stone/ground
  if (r <= 4) return 4;                               // flat ground
  if (r <= 6) return (c & 1) || (r & 1) ? 4 : 0;      // 75% ground on black
  if (r <= 8) return (c & 1) || (r & 1) ? 0 : 4;      // 25% ground on black
  return 0;
}
```
