# Constrict beam: solid-beam options (mock, 2026-10-15)

The owner asked for the constriction beam to be one solid beam. Today the
constrict and the meal both draw three jagged bolts from the comb's lit tips
to the orb (`drawBolts` in `src/render/serpent.js`): fourteen jagged steps,
white every third step, and a new shape every sixth of a second.

These are **real-game shots**. `drawBolts` was swapped out on a scratch
branch, picked per shot by a global, and then reverted. No game code is
committed here. Every option is steady (the `shape` argument is ignored), sits
on the P = 6 cell grid, and fades by opacity only (the meal's gulp fade still
comes through `ctx.globalAlpha`).

| option | what it is |
|---|---|
| **now** | today's three jagged bolts, for comparison |
| **A** | one straight beam, 2 cells thick, bright purple with a white 1-cell core, from the middle crest tip to the orb |
| **B** | three straight beams, 1 cell thick, steady bright purple, from the first, middle and last lit crest tips |
| **C** | one beam that tapers toward the orb: 3 cells at the comb (darker kept purple edges, white core), then 2, then the white core alone |
| **D** | A with a brighter stretch, a quarter of the beam long, running down it toward the orb every 0.8 s; the rest sits at half opacity. Opacity only, no tone cycling |

## Files

All crops are 2x nearest-neighbor, cropped around the comb and the orb. Each
row of stills is one scene instance, so the five options in a row show
exactly the same frame.

- `phase-orb-cast-0-<opt>.png`: the fight's constrict on a fighter, the
  moment the beam leaves the comb.
- `phase-orb-cast-0.25-<opt>.png`: the same, a quarter second on.
- `meal-bolts-0-<opt>.png`: the meal, the beam off the lit comb onto the
  creature's orb.
- `meal-reel-0-<opt>.png`: the meal, the orb being hauled in on the beam.
- `meal-reel-<opt>.gif`: 2 s of meal-reel at 15 fps (frame-exact, every
  option shot from the same run), from the reel into the gulp.
- `sheet.png`: contact sheet. Rows are phase-orb-cast, meal-bolts and
  meal-reel. Columns are now, A, B, C and D.

The fight is shot in `phase-orb-cast` rather than `phase-orb`. The fight
draws its bolts only for the first `ORB_BOLT_S` (0.5 s) of the orb, and
`phase-orb` stands 2 s in, so no beam is drawn there in any option. In the
fight the orb is right under the head, so the beam is short. The meal is
where the options differ most.

What the shots cannot show: the fight's beam lasts only half a second, so how
it lands at play speed is only visible in the game. The GIF crop is fixed
while the camera pans slightly, so the head drifts in the frame.

## Drawing code

One shared helper stamps P-sized cells along the straight line from the comb
to the orb, once per "pass". A pass gives an offset across the beam (or none)
as a function of how far along it is (u, 0 at the comb, 1 at the orb):

```diff
+function beamStamp(x0, y0, x1, y1, passes, alphaAt) {
+  const len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
+  const a0 = ctx.globalAlpha, steps = Math.ceil(len / (P / 2));
+  for (const pass of passes) {
+    for (let s = 0; s <= steps; s++) {
+      const u = s / steps, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
+      const o = pass.at(u);
+      if (o == null) continue;
+      ctx.globalAlpha = a0 * (alphaAt ? alphaAt(u) : 1);
+      ctx.fillStyle = pass.ink;
+      ctx.fillRect(snap(x + nx * o - P / 2), snap(y + ny * o - P / 2), P, P);
+    }
+  }
+  ctx.globalAlpha = a0;
+}
 function drawBolts(c, shape) {
   if (!crestTips.length) return;
+  const mid = crestTips[Math.floor(crestTips.length / 2)];
+  const purple = PURPLES[WHITE], white = GREYS[WHITE], dark = PURPLES[WHITE - 2];
-  for (let n = 0; n < ORB_BOLTS; n++) { ... the jagged run ... }
+  <one of the bodies below>
 }
```

**A**: two cells thick, a white core:
```diff
+  beamStamp(mid.x, mid.y, c.x, c.y, [
+    { ink: purple, at: () => -P / 2 }, { ink: purple, at: () => P / 2 }, { ink: white, at: () => 0 },
+  ]);
```

**B**: three one-cell beams off the first, middle and last tips:
```diff
+  for (let n = 0; n < ORB_BOLTS; n++) {
+    const from = crestTips[Math.round(n * (crestTips.length - 1) / Math.max(1, ORB_BOLTS - 1))];
+    beamStamp(from.x, from.y, c.x, c.y, [{ ink: purple, at: () => 0 }]);
+  }
```

**C**: 3 cells, then 2, then 1, with a white core and darker edges:
```diff
+  beamStamp(mid.x, mid.y, c.x, c.y, [
+    { ink: dark, at: u => (u < 0.4 ? -P : u < 0.75 ? -P / 2 : null) },
+    { ink: dark, at: u => (u < 0.4 ? P : null) },
+    { ink: white, at: () => 0 },
+  ]);
```

**D**: A, with a brighter stretch running toward the orb:
```diff
+  const head = (now() / 1000 / 0.8) % 1;                // one run every 0.8 s
+  const alphaAt = u => { const d = ((head - u) % 1 + 1) % 1; return d < 0.25 ? 1 : 0.5; };
+  beamStamp(mid.x, mid.y, c.x, c.y, [
+    { ink: purple, at: () => -P / 2 }, { ink: purple, at: () => P / 2 }, { ink: white, at: () => 0 },
+  ], alphaAt);
```

If an option is chosen, its 0.8 s, 0.25, 0.5 and the taper's 0.4 and 0.75
would become `config/deep.js` constants, and the comment over `drawBolts`
(and its name) would be rewritten.
