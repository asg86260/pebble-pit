# Where the frame goes

Measured on the node yard at 6be3311, on a machine that was also running five
other agents — so every wall-clock figure here is the minimum of ten
150-frame segments, which is the number the contention cannot inflate, and the
per-function breakdown comes from `--cpu-prof` over 7200 frames, where the
*shares* hold even when the totals wobble. The yard is the standard busy one:
`__crew(4,4,3,3)`, full sites, granted currencies, ten seconds of settling
before the clock starts. The sim is deterministic, so every before/after pair
in here is the same 1800 frames both times.

The headline: **one function is four fifths of the frame, and it is not doing
any of the things a frame is for.**

## 0. What has been taken off this list

Everything in section 3 below is written as it was found; this is what has since
been done about it, measured the same way on the same three yards.

| yard | at 6be3311 | now |
|---|---:|---:|
| empty, no crew | 0.048 | 0.027 |
| busy 14-body | 0.170 | 0.121 |
| 14 + all four machines, ~6,600-mote sky | 0.501 | 0.232 |
| the same, over a sky restored from a save (~9,500 motes) | 4.98 | 2.80 |

The last row is older than the rest of it: the anchor rework in item 2 below
takes a restored sky nearly to nothing, and carries its own measurements.

- **1, `refresh()`** — gone with the mess-layer rework at 415f36c. There is no
  `refresh` any more: `tally()` skips bare ground and memoizes on the tick.
- **3, `dustAbout()`** — done. `floor` keeps a ledger the way the pit does, and
  the four-a-second walk of a hundred and sixty thousand cells is two field
  reads. That is the whole of the empty yard's cost above.
- **4, `unpull()`** — done. A flag set by `pull` and the plume half of
  `stirSmoke`, cleared by the pass that zeroes the offsets.
- **5, `surveyFloor()`** — half done. The total comes off the ledger. The walk
  stays, because the other two things it works out — which strip each grain
  stands on, and where the cells that are not dust are — are genuinely per
  column and no ledger answers them.
- **2, settled sky motes** — done, and the diagnosis in section 3 was wrong.
  The per-mote arithmetic was never the cost. `settleHere` finished a mote's
  climb with `delete m.lean; delete m.y0`, and a `delete` puts an object into
  dictionary mode for good — so **every settled mote in the sky was a hash
  table**, and `place` reads eleven fields off each of them sixty times a
  second. One shape of mote, declared whole in `skyMote`, took `stepSmog` on a
  4,600-mote band from 1.25 ms/frame to 0.098. Alongside it: the slot's four
  derived numbers are worked out once instead of per mote per frame (they were
  two allocations a mote a frame), the band's top and depth and the frame's
  wind are hoisted out of the loop, and a mote past `AGE_STILL` skips the
  stretch, the ease, the fade and its own clock entirely — which is the
  *at rest* case, and it fires on a restored sky but rarely on a working one,
  because rain recycles a machine yard's band long before a mote is 405 seconds
  old.

  A settled mote is now **free**, which is the rest of item 2 and was written
  down here as the redesign that had not been done. Its position is not written
  at all: it is `anchor + f(t)`, where the anchor is the spot it came in at plus
  its slot's share of a stretch, and `f(t)` is the band's sway lane, the sky's
  creep on the wind, the lift, and the top and depth of the band — five numbers
  worked out once a frame and shared by the whole sky. The six places that read
  a mote's position as a field — the rain, the draught, the recycler, the
  pointer, the readouts, the drawing — ask `moteX`/`moteY` instead, and the
  drawing asks only for the motes its own cull leaves on the screen. A mote that
  has finished arriving comes off a list of the ones being stepped, so `place`
  does not iterate it either; it goes back on the list, at exactly the pixel it
  was being drawn at, if a hand or the house takes hold of it.

  Measured the same way, min of ten 150-frame segments, each yard in its own
  process: `stepSmog` over a still band of 6,646 motes went 0.162 → 0.012
  ms/frame, and over 3,958 motes 0.098 → 0.007. The whole frame on a
  6,646-mote yard went 0.257 → 0.090. The machine yard is unchanged
  (~0.20 both ways) and that is the honest limit of it: `AGE_STILL` is 405
  seconds, and rain recycles a working band long before a mote is that old, so
  in a yard with four machines on almost nothing ever reaches rest. The saving
  is the lategame and restored sky, which is where the cost was.

## 1. The frame budget

The busy yard costs ~0.80 ms/frame bare, ~0.89 under the profiler. Broken down
by the subsystems `step()` calls (inclusive time, profiler run):

| function | ms/frame | % of frame | O(what) |
|---|---:|---:|---|
| `stepSmog` — smog.js | 0.711 | 80.3% | O(floor.cols × ways()) — see below |
| `updateWorkers` — crew.js | 0.060 | 6.7% | O(bodies), ~4.5 µs a body |
| `stepAir` — air.js | 0.053 | 6.0% | O(AIR≤420) + a full-grid count every 400 ms |
| `surveyFloor` — game.js | 0.036 | 4.1% | O(cells=120k) every 250 ms, amortized |
| `step` itself | 0.010 | 1.1% | flat |
| `settleSome` — grid.js | 0.004 | 0.4% | budgeted; free on an idle grid |
| `stepHouse` — house.js | 0.003 | 0.4% | flat |
| `stepRecords` — crew.js | 0.001 | 0.1% | O(bodies) |
| `slumpMess` — smog.js | 0.001 | 0.1% | throttled to 5/s |
| everything else (~20 stepX) | ~0.005 | 0.6% | all ≤0.001 each |

That accounts for the whole 0.885 ms the profiler saw under `step()`. The two
dozen small systems — weather, rock, breaks, lab, casino, tower, meteor, core,
intro, house, scrub, camera, shake — are collectively half a percent. The frame
is `stepSmog`, and `stepSmog` is `refresh()`.

**What `refresh()` actually does.** At the top of every frame it walks all 1337
floor columns and asks `onSite(c)` of each — even the empty ones, because the
poop tally is added before the `if (!v) continue`. `onSite` calls
`footing(x)` with its default argument, and the default is `all = ways()` — so
**a fresh `ways()` object is built per column per frame**: ~80,000 allocations
a second, each one calling `rockSpan()` and wrapping four closures. `footing`
then calls `standTop`, which probes `pitTop`/`dugTopY` four times per working.
The caller chain in the profile is unambiguous:

    ways      0.245 ms/f  <- footing <- onSite <- refresh <- stepSmog
    pitTop    0.223 ms/f  <- standTop <- footing <- onSite <- refresh
    footing   0.193 ms/f  <- onSite <- refresh <- stepSmog

**Measured fix.** A throwaway patch that (a) hoists one `ways()` per `refresh`
and passes it down, and (b) skips columns with no mess before asking `onSite`,
was applied and reverted here. Same 1800 frames, min-of-segments:

| yard | before | after |
|---|---:|---:|
| empty, no crew | 0.892 | 0.051 |
| busy 14-body | 0.757 | 0.096 |
| 14 + all four machines | 1.720 | 0.695 |

Seven times faster, and semantics preserved exactly (the skipped columns
contribute zero to every tally). Note the empty yard: the settle fix made idle
*grids* free, but `refresh` never idles — a yard with nobody in it and nothing
on it still pays 0.9 ms/frame today.

## 2. Scaling

- **Bodies: linear, and small.** `updateWorkers` is 0.012 ms at 2 bodies,
  0.064 at 14, 0.183 at 40 — ~4.5 µs a body a frame. Everything else is flat in
  crew size; total frame cost barely moves from 2 bodies to 40 because the
  `refresh` constant drowns the slope.
- **World size: the real axis.** `refresh` (per column), `surveyFloor` (per
  cell), and `dustAbout`'s `count(floor)+count(pit)` (per cell) all scale with
  the 1337×90 floor and 600×71 pit. These are the costs a wider world raises.
- **Sky motes: the machine tax.** With the jaw, ram, tiller and belt all on,
  the sky fills to ~4400 settled motes (cap is 8750) and the frame doubles:
  `place()` alone goes to ~0.47 ms/frame, plus `stepPuffs` 0.06, `unpull` 0.07,
  and the loop bodies attributed to `stepSmog` itself ~0.2. Every settled mote
  gets full positional arithmetic (drift, sink easing, sway lane, draught
  offsets, wraparound) every frame, for ever. This is the one cost that grows
  as a run gets long and dirty — exactly the lategame a phone will be in.
- **Flat:** settleSome (budgeted), all the station steppers, weather, records,
  breaks.

## 3. Ranked opportunities

Ownership note: crew.js/route.js, smog.js, and config.js/dev.js are in other
hands today. The `refresh` fix is smog.js-owned; it is written down here so
whoever holds that file can take it, because nothing else on this list is a
tenth of it.

1. **`refresh()`: one `ways()` a frame, and only the dirty columns.**
   Measured 0.66–1.0 ms/frame saved (7× on the whole sim). Effort S — two
   lines and a parameter thread. Risk: low; tallies provably unchanged, though
   `onSite`'s answer must stay per-frame fresh (it is — `ways()` is rebuilt
   each call of `refresh`). Owner: **smog.js (taken today)**. This also buys
   the test suite back: the node checks run ~3,100 guaranteed sim-seconds of
   `run()` plus caps, at ~48 ms of wall per sim-second today and ~8 ms after.

2. **Settled sky motes: stop doing full kinematics on 4400 stationary specks.**
   ~0.5–0.9 ms/frame in a machine-heavy or lategame yard, nothing in a clean
   one. A settled mote's position is slot + sway-lane + slow drift; the sway is
   already computed per lane (12 lanes), so the per-mote work could collapse to
   the drift accumulation, or the settled band could be stepped at slump cadence
   rather than frame cadence. Effort M. Risk: medium — rain, the recycler and
   the draught all read mote positions. Owner: **smog.js (taken today)**.

3. **`dustAbout()`: stop recounting what the pit already counts, and give the
   floor the same ledger.** `count(floor) + count(pit)` walks 163k cells every
   400 ms — a ~1.2 ms *spike* (a missed 60fps frame on a phone, four times a
   second, in perpetuity), 0.048 ms/frame amortized. The pit half is free
   today: `pit.n` is maintained by `put()`, repaired by `recount` after every
   wholesale write, and checked against the cells by verify.js rule 7. The
   floor half is not — verify.js records that `floor.n` was deliberately left
   undefined because "a second copy drifts" — so the honest fix is to wire
   `floor.n` the way the pit's is (set it at wiring, `recount` after
   `clearFloor`/restore) and extend rule 7 to cover it, which is exactly the
   drift alarm that made the pit's ledger safe to trust. Effort S. Risk: low
   with the verifier extended, and the verifier is the point. Owner:
   **air.js + grid wiring (free)**.

4. **`unpull()`: walk the sky only when a draught has touched it.** Every
   frame the house is not scrubbing, `unpull` walks all of SKY to check two
   fields that are almost always zero. A dirty flag set by `pull()` makes the
   common case free. ~0.07 ms/frame with a full sky. Effort S. Owner:
   **smog.js (taken today)**.

5. **`surveyFloor()`: walk the columns' surfaces, not every cell.** 120k cells
   four times a second is a ~0.54 ms spike per call, 0.036 amortized. The
   grains-per-column number could come from per-column heights or the kept `n`;
   the marks (non-dust cells) are the part that genuinely needs looking at,
   and those could be tracked on put/take instead of rediscovered. Effort M.
   Risk: medium — `S.pileFull` and the marks feed drawing and crew decisions.
   Owner: **game.js/world.js (free)**.

6. **`nearestMuck()`: bound the ring search.** O(cols) per unassigned body per
   frame while mess exists — 0.025 ms/frame on the busy yard, worse with a big
   idle crew and a far-off mess. It walks d = 0..1337 in single columns even
   when the nearest muck is 800 columns away. Effort M (skip runs of empty
   columns, or precompute a nearest-muck-per-column in `refresh`'s one pass).
   Owner: **smog.js/crew.js (both taken today)**.

## 4. The three cheapest wins

1. `refresh()` — one `ways()`, skip clean columns. 0.7–1.0 ms/frame, ~2 lines.
2. `dustAbout()` — `floor.n + pit.n` instead of two full-grid counts. Kills a
   1.2 ms four-a-second spike, one line, already verified by the suite.
3. `unpull()` — dirty flag. Small, but it is the pattern the sky needs anyway.

Together, measured: the busy yard drops from ~0.8 to ~0.1 ms/frame, the empty
yard to ~0.05, and the machines-on yard from ~1.7 to ~0.7 (the remainder being
item 2's per-mote work). The node suite's sim tax drops in proportion — the
files that pay the most are janitor (576 guaranteed sim-seconds), jobs (379),
sky-readout (309), sky-muck (241), crew (233), sky-house (228), route (192),
and sky-work (189 plus by far the largest `runUntil` caps): in all of them the
driver is the flat per-frame sim cost, not the scenarios.

## 5. The draw side (estimates marked)

Measured in the real page (headless shell, software canvas, 800×600) off the
`beat` EMA main.js already keeps: on the busy yard, **step 2.5 ms, draw 0.51 ms,
hud 0.06 ms** — and with all four machines on and a 5,670-mote sky, **step
3.05 ms, draw 1.12 ms, hud 0.07, worst frame 6.5 ms and it was a step**. The
sim, not the drawing, is the long pole even in a browser with no GPU; a full
sky doubles the draw but the mote batching (below) holds it near a millisecond.

Read against the classic sins, the render path is largely already fixed:

- The floor and pit grids go through painter.js — dirty-rect updates into a
  1px-per-cell scratch canvas, one `drawImage` each per frame. Not a cost.
- `drawSmog` buckets motes by tint and ink and culls to the viewport before
  drawing; the comment on it records the 22 ms → 1.5 ms path-vs-fillRect
  lesson already learned. It does allocate a Map, key strings and point arrays
  per frame (estimate: harmless at current counts, worth flattening only if
  profiling a phone says so).
- The rock is per-cell `fillRect` (≤840 cells) but batches `fillStyle` by
  depth band. Estimate ~0.1 ms software; fine.
- `drawAir` makes 9 passes (3 bands × 3 kinds) over all 420 motes to avoid
  fillStyle churn. O(9n) filter passes; estimate <0.1 ms, fine.
- The full-canvas clear + repaint each frame is the model everything above
  assumes; not worth touching.

The phone risk on the draw side is not any one call — it is total overdraw at
device resolution, which none of this measures. When there is a phone to hand,
the `beat` readout in the dev panel is the instrument; it already splits
step/draw/hud and keeps the five-second worst.

## 6. Do not bother

- **`settleSome` / the grids.** Budgeted, event-woken, ~0.004 ms/frame busy
  and zero idle. The settle fix did its job.
- **The two dozen small steppers.** Weather, rock, breaks, lab, smoke, casino,
  table, intro, buried, house, core, meteor, summon, sparkle, tower, scrub,
  camera, shake, paid, boards, piles, plots: ≤0.001 ms each, ~0.005 together.
  A session spent in any of them recovers nothing.
- **`slumpMess` / `staffSheds` / `sampleAir`.** Already throttled; already
  cheap.
- **report.js `snapshot`.** Not called by `step()` at all — it only runs when
  a check or the dev panel asks. Its cost lands on the suite, not the player,
  and the suite's cost is the sim (see above), not the reporting.
- **`muckCols`/`poopCols`.** They look like per-frame array builders; they are
  lazily-built persistent arrays, rebuilt only on resize.
- **`stepAir`'s per-mote loop.** 420 motes of simple arithmetic; the expensive
  part of `stepAir` was always the count it triggers (item 3 above), not the
  motes.
- **hud.** 0.06 ms in the page. It is throttled already and it shows.
