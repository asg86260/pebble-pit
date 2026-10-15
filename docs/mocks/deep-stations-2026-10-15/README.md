# The deep's stations blend together: diagnosis and three options (2026-10-15)

The owner: "we should also take another revision on the abyss stations and
their decorations. they kind of blend together."

Every option below was shot in the real game (main at 678f4c22) with a
temporary scratch edit, then reverted. No game code is changed by this
folder. The shots are not animated. The props' top edges (the light from
above) are already steady.

## Files

| file | what |
|---|---|
| `<opt>-deep-seven-2000.png`, `<opt>-deep-seven-1200.png` | all seven slots taken, full window at 2000x963 / 1200x800 |
| `<opt>-deep-all-2000.png`, `<opt>-deep-all-1200.png` | four stations, full window |
| `<opt>-row-2x.png` | the deep-seven station row at 2000x963, cropped and doubled |
| `<opt>-party-props-{a,b,c}-2x.png` | the prop scenes at 1200x800, cropped and doubled (every class, rung 0/4/8) |

`<opt>` is `today`, `A`, `B` or `C`.

## Diagnosis (measured)

Tones were sampled from `today-deep-seven-2000.png`. Geometry was read off
`place.js` in the page.

- **The dome is the floor's tone.** Dome wall `#26262c` is rung 4 (`ground`).
  The floor band is the same rung 4. So each dome reads as a mound of the floor,
  not as a thing standing on it.
- **Prop, plinth and pods share two greys.** The prop body is rung 6 (`stone`,
  `#42424a`) and so is the plinth body. The pods' hull is 4 and their rim is 6.
  The station row and the pods use the same pair of greys, so they read as one
  material.
- **The prop sits two kept rungs over its backdrop.** The rung 6 prop on the rung
  4 dome is about a 1.4:1 lightness step. The prop's top edge is purple 7 and
  the dome's top edge is purple 5, both dim purples. The props are open
  frames (gallows, rack, easel, stand), so their holes fill with dome grey.
  That leaves them as thin rung 6 lines on rung 4 murk.
- **The brightest grey in a station is its base.** The plinth's top course is
  rung 8 (`#6e6e78`), lighter than the prop. The eye lands on the slab, and the
  slab runs straight into the prop, which is the same rung 6 as the plinth body.
- **Spacing is not the problem.** The slot pitch is 49 cells (294 px). Domes are
  21–27 cells wide, and 22–28 cells of black water separate neighboring domes.
  No silhouettes overlap and no prop crosses its own dome. What blends is the
  inside of a station (dome / prop / plinth / floor), plus seven identical
  grey humps in a row. The only high-contrast marks are the white fighter, the
  status chips and the light scale bed heaped at each dome's foot. Those carry
  the eye instead of the class's prop.

## Option A: tone separation (`A-*.png`)

Each part of a station gets its own kept grey, and a black keyline separates the
prop from the dome:

- dome wall rung 2, darker than the floor so it reads as a recess; its rim purple 7 is now the only lit top edge
- prop body rung 8 with no purple top, the brightest grey in the station
- plinth rung 6 flat, between the dome and the prop
- a black cell all round the prop silhouette, its holes included, so the prop is cut out of the dome

Result: every class's prop reads as a pale object on a dark niche. The
purple accents at rung 8 still show. Cost: rung 2 is a kept grey with no role
name in `DEEP_GREY`, so a build would add one (say `shade: 2`). The keyline
is one more pass a frame per prop; a build would paint it into `propImage`.

```diff
 src/config/deepdraw.js
-export const PLINTH_TONES = { top: DEEP_GREY.lit, body: DEEP_GREY.stone };
+export const PLINTH_TONES = { top: DEEP_GREY.stone, body: DEEP_GREY.stone };
-export const DOME_TONES = { wall: DEEP_GREY.ground, edge: DEEP_PURPLE.low };
+export const DOME_TONES = { wall: 2, edge: DEEP_PURPLE.mid };
 src/deep/props.js
-export const PROP_INK = { body: DEEP_GREY.stone, ...
+export const PROP_INK = { body: DEEP_GREY.lit, ...
-    else if (open(c, r - 1)) out.push([c, r, 'top', 0]);
+    else if (open(c, r - 1)) out.push([c, r, 'g', PROP_INK.body]);
 src/render/deep.js  drawProp(), before the drawImage:
+  // a black keyline a cell wide round the prop, holes included
+  const ink = new Set(propCells(p.key, lit).map(([c, r]) => c + ',' + r));
+  ctx.fillStyle = TONE.hole;
+  for each empty cell (bar the row under the prop) 8-touching ink: ctx.fillRect(p.x + c * P, p.y + r * P, P, P);
```

## Option B: the dome as an outline (`B-*.png`)

The dome is only its one-cell rim (rung 4 walls, purple 5 arch), with black
water inside. The props were already inside their dome's footprint
(`domeRect` spans the stand plus the fighter's reach). They now stand on
black, in front of nothing, as rung 6 with their purple tops.

Result: the most "glass bell" look, and the lightest change. Cost: the dome
was what hid the scale bed behind each station. With it hollow, the heaped
scales show through inside the bell (see the sapper and hexer in
`B-row-2x.png`) and crowd the prop again. A build would need the bed kept
out of the domes' footprint or a dark fill kept low inside. The props'
contrast against black is good, but they are still the plinth's grey.

```diff
 src/render/deep.js  domeImage(), in the cell loop:
     if (!inside(c, y)) continue;
+    // the dome is its rim only, a cell wide; the water shows inside
+    if (inside(c - 1, y) && inside(c + 1, y) && inside(c, y - 1)) continue;
```

## Option C: one big signature prop, no dome (`C-*.png`)

The dome goes. Each class keeps its one prop, drawn at twice the size, so
the prop is the station's shape. Tones are left as today.

Result: each station reads by silhouette from across the deep, since a bell,
a target, a lectern and a keg stack are all different shapes. Stations get
clear black water between them. Cost, and what the shot cannot show
honestly: the mock doubles each pixel, so the props sit on a two-cell
grid and look blocky. A build would redraw `PROPS` at the new size, one
cell a pixel (about twice the rows). The bigger `propRect` widens the
stand, the click area and the scaffold. The scale bed is no longer hidden
behind anything, and the doubled purple top edges get heavy (`C-row-2x.png`).

```diff
 src/deep/place.js  propRect()
-  const w = rows[0].length * P, h = rows.length * P;
+  const w = rows[0].length * P * 2, h = rows.length * P * 2;
 src/render/deep.js
-  ctx.drawImage(propImage(p.key, lit, light), p.x, p.y);
+  ctx.drawImage(propImage(p.key, lit, light), p.x, p.y, p.w, p.h);
-    ctx.fillRect(p.x + c * P, p.y + r * P, P, P);          // the brew
+    ctx.fillRect(p.x + c * 2 * P, p.y + r * 2 * P, 2 * P, 2 * P);
-    if (d.x <= x1 && d.x + d.w >= x0) drawDome(st);
+    (no dome drawn)
```

## Combinations worth asking about

A and B both work on the dome and would combine (an outlined niche with a
keylined pale prop). A's tone roles also carry over to C's bigger props.
