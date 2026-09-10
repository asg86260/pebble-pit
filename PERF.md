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

**Superseded by section 7, which measured it.** Two of the estimates below
were wrong, and they are left standing because which ones were wrong is the
point of keeping them.

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

## 7. The draw

Section 5 above was written off the `beat` EMA and a read of the code, and it
guessed. This is the same page measured properly, at 35d4a4b, with the sim
already down to a tenth of a millisecond — which is what makes the draw the long
pole and worth a section of its own.

**The glass.** Headless shell, software canvas, 800×600 CSS at dpr 1 and zoom
0.833: 480,000 device pixels. That matters, because a third of what is below is
fill rate rather than arithmetic, and fill rate is the number a phone changes.
The four yards, all off seed 7, each built in one synchronous burst so the clock
never moves under it:

- **quiet** — a new game, one body, nothing on the ground.
- **busy** — `__crew(4,4,3,3)`, full sites, currencies granted, ten seconds settled.
- **sky** — the same with all four machines on and forty-five seconds more, ~4,000 motes.
- **cores** — a new game whose pile actually holds four cores and the other three
  finds, restored through a save so the cells are really in it. This is the late
  counter, and it is the yard the other three do not show.

**The instrument.** Old and new drawing alternated *inside one page's frame
loop* — six segments of 300 frames a side, the minimum of each side kept. Two
separate sessions on a machine running five other agents disagree with
themselves by a fifth; interleaved, the yard drifts under both sides equally and
the comparison holds. The numbers are `beat.draw`, the frame's own reading,
which is the instrument section 5 used and the one a phone will have.

| yard | before | after | |
|---|---:|---:|---:|
| quiet | 0.306 | 0.086 | −72% |
| busy 14-body | 0.467 | 0.299 | −36% |
| 14 + four machines, ~4,000 motes | 0.534 | 0.346 | −35% |
| four finds in the pile | 0.460 | 0.253 | −45% |

Every pixel of every one of those frames is unchanged, and the proof is not an
eyeball. Both paths live in the page at once behind a flag, and a check draws
the same yard old, new and old again and hashes all 480,000 pixels of each: the
third draw says the picture is repeatable at all, and the second says it is the
same one. Identical on all four yards, for all four changes.

### 7.1 Where the draw went

Per function, from `performance.now` around every call in `draw()` (throwaway,
reverted). Chrome clamps its clock to 100 µs, so a single frame says nothing;
over 600 frames the rounding is a fair coin and the mean is honest. The
sixty-odd clock reads add about 0.07 ms across the whole row, so read the shares
rather than the total. Busy yard unless marked.

| section | µs/frame | what it is |
|---|---:|---|
| the rock | 101 | ≤840 `fillRect`s, one a cell |
| `drawCount` | 87 | the counter card |
| `drawAir` + `drawAirNear` | 87 | 420 motes, nine filter passes |
| `drawPit` | 28–115 | the pile's blit, plus a search for cores |
| `drawSmog` | 45 (sky) | ~4,000 motes, bucketed and culled |
| `drawRoster` + its counts | 28 | who is where, and their numbers |
| `drawOffers` | 24 | a filled diamond a station |
| `drawWorkers` | 20 | fourteen bodies |
| `drawHouses` | 19 | the settlement |
| `drawGrid` (the whole floor) | 10 | one `drawImage` |
| `press` | 3–5 | two fullscreen fills |
| the other forty calls | ~25 | ≤2 µs each |

Two of section 5's guesses were wrong, and the biggest suspicion was misplaced:

- **The sand grids are not a cost and were never going to be.** painter.js
  already does the whole job — changed rows into a 1px-per-cell scratch canvas,
  one `drawImage` a frame. The floor's 120,000 cells cost 0.010 ms. There is no
  offscreen to build and no dirty-region machinery to borrow off the awake
  columns; it is done.
- **The rock was not "~0.1 ms software; fine".** It was 0.10–0.12 ms and the
  largest single thing in the frame — half of a quiet yard's whole draw.
- **There is no idle frame to skip.** `S.dirty` is the *save* flag, not a
  drawing one, and there is nothing for it to gate: clouds, birds, air, the sky
  and every machine's phase are read off the clock, so a frame that skipped the
  paint would stop the weather. The full clear and repaint is right.

### 7.2 What was done

Four changes, all in render.js, each a contained mechanism.

| | yard it shows on | before | after |
|---|---|---:|---:|
| the rock, a run at a time | quiet | 0.123 | 0.014 |
| the counter's marks, kept | cores | 0.045 | 0.005 |
| the counter's numbers, remembered | cores | 0.041 | ~0 |
| the cores in the pile, remembered | cores | 0.100 | ~0 |

**The rock, a run at a time.** Shade is depth, and depth runs in bands *across* a
row — a row of a rock is three or four runs of one tone, not forty cells of it.
So a run goes down as one `fillRect` instead of forty, and the tone of a
thickness is looked up once a frame instead of worked out per cell. Eight
hundred calls and eight hundred `cellPos` allocations become a few dozen calls
and none. Measured on the rock alone, 673 cells: 79 µs → 8 µs, against 5 µs for
walking the grid and drawing nothing at all — so what is left is the walk. An
offscreen canvas blitted at 0.7 µs was measured too and not taken: it costs
88 µs to build, the rock changes on every swing, and eight microseconds is
already under everything else in the frame.

**The counter's marks, kept.** A core is an arc with a stroke round it, a spore a
hexagon, a spark an eight-point star, and a filled path costs a hundred times a
`fillRect`. A late yard draws all four every frame and none of them has changed
since the last one was found. The column now lives on a canvas of its own, laid
down whole, and is drawn again only when the card moves or grows or gains a row.

It is *drawn* there rather than copied off the frame, and that is the whole of
the care in it. The first attempt lifted the finished strip off the main canvas
with `drawImage(canvas, …)`, which is a readback: 0.45 ms in a browser with no
card under it, so every camera move — every frame the card's place changes — was
a worse hitch than the thing being fixed. Drawing into the strip instead needed
`drawMark` to take the canvas it draws on, which it now does. Two things keep it
exact: the strip is laid down at whole device pixels and drawn at the same
offset in device pixels, so every mark keeps the fraction of a pixel it would
have been drawn on and nothing is resampled at any device ratio; and it is
filled with the card's own white first, so an opaque strip lands on flat white
and there is no blending to round differently. The digits' column is left out of
it — that is the part that moves — and so is the card's edge, whose outermost
pixels are shared with whatever the yard is doing behind them.

**The counter's numbers, remembered.** `fmt` is `toLocaleString`, and
`toLocaleString` is eight microseconds a call. The card asks it for the same five
numbers sixty times a second: 41 µs a frame, which was the entire remaining cost
of the card once the marks were kept. A dozen-entry map, cleared rather than
grown when it fills, because while a count is running to a new value every frame
is a new number.

**The cores in the pile, remembered.** `drawPitCores` looked in all 43,000 cells
of the hole every frame to find at most a handful — 0.10 ms, and the largest
thing left once the rock and the counter were done. Two facts make it cheap. The
counter knows how many there are to find: the pile holds exactly what you hold
(`seedPitCores`), and every way of spending one takes its cell out in the same
breath as the count, so nought means do not look. And a core that has not moved
is still where it was, so the cells it was last found in are checked first —
`S.cores` reads instead of 43,000, and if every one of them still holds a core
then those are all of them, in the order a fresh search would have found them.
Anything else — a core settling a row, one spent, one arriving — fails the check
and the pile is searched again that frame.

Note what the busy and machine yards above do *not* show: their currencies come
from the dev grant, which raises the count without putting cells in the pile, so
the search comes up short and runs again every frame. No played yard is ever in
that state. The fourth yard is the one that is.

### 7.3 The instrument reads two different things

Everything in 7.1 and 7.2 is `performance.now` around a call, and it took two
sections to notice what that number is. Canvas2D in Chrome is *deferred*: a
`fillRect` records a command and returns, and the pixels are shaded later. So a
clock around a draw call measures how long it took to write the commands down,
and says nothing at all about how long it takes to paint them.

For everything above that was the right number, because everything above was
arithmetic — a search through 43,000 cells, eight hundred allocations,
`toLocaleString` sixty times a second — and arithmetic is all on the recording
side. It is the wrong number for anything that is fill rate, which is exactly
what section 7.1 said the remaining items were.

So the two things left were measured twice: once as before, and once with a
1×1 `getImageData` inside the timed stretch, which forces the whole backlog of
commands to be painted before the clock is read. That second reading is a
rasterized frame, and on this glass — 800×600 CSS, dpr 1, zoom 0.833, 480,000
device pixels, software raster in the headless shell — a busy frame costs 4.84 ms
to paint against the 0.30 ms it costs to record. The recorded number is the one
a phone's own `beat` readout will show; the painted number is the one that
decides whether the phone holds sixty. Both are below.

### 7.4 The air, the press, and the one that was not worth it

**The air, one path a band-and-kind — air.js.** `drawAir` and `drawAirNear` made
nine passes over the whole field to pick out the motes of one band and one kind,
three and a half thousand steps to draw four hundred squares, and then a
`fillRect` each. It is one pass now, dropping every mote into the bucket it
belongs to, and one `fill` a bucket — with the buckets refilled rather than
rebuilt, since the field is the same four hundred motes frame after frame. The
band-then-kind order is untouched, which is what keeps the depth: a near green
mote still goes down over a far grey one.

Both calls together, minimum of eight segments of 200, interleaved:

| yard | motes | before | after | |
|---|---:|---:|---:|---:|
| quiet | 95 | 0.0345 | 0.0065 | −81% |
| busy 14-body | 307 | 0.126 | 0.020 | −84% |
| 14 + four machines | 314 | 0.111 | 0.020 | −82% |
| the field at its cap | 420 | 0.149 | 0.028 | −81% |

Rasterized, the same busy field reads 0.11 → 0.07 ms: most of what came off was
the walk rather than the paint, which is what the shape of the fix predicts.

Every pixel is the same, on the quiet, busy, machine and capped-field yards, old
/ new / old, hashing all 480,000. The hash was shown to be live on the air
specifically first — emptying the field changes it and putting the field back
restores it — because a proof that cannot fail is not a proof.

Note *why* it can be batched at all: every tint in `AIR_TINTS` is opaque. A path
holding two overlapping squares of one opaque color puts down exactly what two
overlapping fills would. That is not true of a translucent one, and it is not
true of the offers below.

**The press, laid down once — press.js.** Two fullscreen fills, a tiled pattern
and an eight-stop radial gradient, over every device pixel, every frame, for a
look that never changes: the two amounts are constants and neither reads
anything in the yard. So both are now shaded once onto a sheet the size of the
canvas, rebuilt only on a resize, and dropped over the finished picture as one
image.

Recorded, this is invisible and slightly *worse* — 0.0005 ms to write two fills
down, 0.001 to write a `drawImage`. Painted, at 480,000 pixels:

| | rasterized frame | the pass itself |
|---|---:|---:|
| both fills, as it was | 4.84 | 4.32 |
| scanlines alone | 1.84 | 1.33 |
| the vignette alone | 3.49 | 2.98 |
| the sheet | 0.80 | 0.30 |

That is the whole of section 7.1's remaining fill rate, and it was reading as
"0.003–0.005 ms, the cheapest line in the table" because the clock was on the
wrong side of the deferral.

This is the one change in section 7 that is **not** bit-identical, and it cannot
be: two black layers blended into the frame one after the other round to eight
bits twice, and the same two mixed into a sheet and blended once round
differently. 137,419 of 1,440,000 color channels come out one step of 255 away,
two at the very most, on a filter whose whole amplitude is fourteen steps.
Nothing the yard draws is touched — this is the last pass over a finished frame,
and it is a look laid over the picture rather than any part of it. Caching only
the vignette, to keep the scanlines exact, was tried: it is no more exact (the
same rounding, on more pixels) and 2.11 ms against 0.80.

Gating the look off on a small device was considered and is against the grain:
`DEVICE_PIXELS` in config.js already caps the canvas at nine million and scales
`S.dpr` down to hold it (world.js `resize`), so the cap — not a switch — is how
this game has always answered a device with more pixels than it can paint. Nine
million is nineteen times the glass measured here, and it is the worst this pass
will ever be asked to do.

**`drawOffers`, measured and left alone.** Five diamonds a frame, and section 7.1
put them at 0.024 ms. Measured on their own they are 0.006, and drawing all five
into one path and filling once saves 0.0007 — under a tenth of the smallest
thing worth a mechanism, let alone a mark canvas with an invalidation rule to get
wrong. It is also not pixel-identical: several subpaths filled in one call are
antialiased differently at the edges from the same shapes filled one at a time,
which is worth knowing on its own, because it is the reason the air could be
batched and this could not have been done the same way for anything translucent.

### 7.5 What is left on the draw side

1. **`drawSmog`, 0.045 ms with 4,000 motes — smog.js.** Already bucketed and
   culled, and cheap for what it is. The Map, the key strings and the point
   arrays it builds per frame are the only fat on it. If it is ever worth doing,
   the air's buckets above are the shape.
2. **Nothing else measures.** Below `drawSmog` the largest line in 7.1 is the
   roster at 0.028 ms, and everything under it is a handful of microseconds.

And the honest limit of all of it: this is 480,000 pixels, and the two readings
in 7.3 diverge by a factor of sixteen on it. Everything that is arithmetic — the
rock, the counter, the pile, the air's walk — is fixed whatever the device. What
is fill rate grows with the pixel count up to the nine-million cap, which is
nineteen times this glass: the press's 0.30 ms goes with it, and so does
whatever share of the remaining 0.50 is paint rather than arithmetic. The `beat`
readout in the dev panel reads the recording side only, so it will not show any
of that; a phone to hand still would.

## 4. The endgame yard (2026-09-01)

Every machine standing, the ram twelve rungs up its ladder with the drive
heart, the belt the same, the tower up, the rift fourteen widenings up. Measured
with `tools/node/break-perf.mjs`, which steps the node yard a frame at a time
and times each one; `YARD=file:///.../tools/node/yard.mjs` points it at another
checkout so a before and an after are the same seeded scene. Thirty seconds,
two runs each, the worse shown, quiet machine.

| frame   | before  | after   |
|---------|--------:|--------:|
| median  | 0.47 ms | 0.30 ms |
| 90th    | 1.73 ms | 1.07 ms |
| 99th    | 4.38 ms | 2.03 ms |
| worst   | 7.53 ms | 3.66 ms |

What it was, in the order the profile gave it, is written up under `## The
endgame pass` in DESIGN.md: a chip landing on a strip at its ceiling searched
the whole floor for a column with room (the spike); `boulderAlive` scanned the
rock grid for every caller every frame; `quarryShape` built a string key per
call; the machines were called once per beat rather than once per frame; and
the rift counted the hole's dust by walking it. The break itself was a
millisecond and was left alone.

On a machine running other things the same script shows frames of forty
milliseconds on both checkouts. That is the machine. The rule in section 0 --
take the minimum, not the mean -- is what makes the table above worth anything.

## 8. The gate (2026-09-09)

`test/perf-gate.test.mjs` steps the busy yard from the top of this file and the
endgame yard from section 4 three hundred frames each and reads three counters
after every frame, published on `globalThis.__perf` from inside the modules
that do the work (a dynamic import after an edit is a second module instance
and always reads zero -- CLAUDE.md, "Anything drawn"). `ways` is how many times
`ways()` in route.js was built that frame: the set of surfaces a body can walk
is worked out from the yard rather than kept, and section 3 item 1 is the pass
that took `refresh` from one build per column to one a frame -- one a frame is
the rule the gate asserts. `grainCols` is how many columns `addGrain` in
grid.js asked whether they had room, and `grains` is how many grains it dropped
in, so the first reads as a per-grain figure: section 4's spike was one grain
searching six hundred columns of ninety rows, and the fix keeps a grain inside
the ground it landed on. The ceiling is derived from the yard on the frame it
is checked, not typed in -- the larger of the widest strip in `S.piles` in
columns (a heaped grain may spread the length of its own strip and no further)
and `2 * BARRED_REACH + 1` (a grain over barred ground walks that far out on
both sides) -- and the assertion is `grainCols <= grains * ceiling` per frame,
written as a product so a frame with no grains is a frame with no search. Both
counts are exact and the sim is seeded, so two runs of the file say the same
numbers: on the day it landed, the busy yard's worst frame was 161 columns over
7 grains against a ceiling of 193 a grain, and the endgame yard's was 3 over 1.
The `ways` rule was red the day it landed -- 53 builds a frame on the busy yard
and 79 on the endgame one, one per body per `wayAt` from `inWorking` and
`surfaceUnder` -- and it was left red rather than loosened; see the check.

It counts rather than times because a millisecond here is a fact about the
machine at least as much as about the game. Section 0's rule -- take the
minimum of ten segments, never the mean -- exists because this machine runs
other agents, and forty-millisecond frames turn up on main and on a branch
alike when it is loaded; a wall-clock ceiling generous enough never to fire
under that is too generous to notice the busy yard going from 0.12 back to
0.80. A count is the same number quiet or loaded, on this machine or a phone,
and it is the thing the two big passes actually changed: not how long the work
took but how much of it there was. That is also the house rule -- assert the
rule directly rather than a threshold on a noisy statistic -- applied to the
frame. The gate says nothing about the draw, the sky or anything section 7
measured; it pins the two regressions that have already happened once, which
is the only kind a gate can be honest about.

When a legitimate change needs the ceiling moved, move the derivation and not
the number. The grain ceiling is read off `S.piles` and `BARRED_REACH`, so a
wider strip or a longer barred walk raises it on its own; a new search that is
neither -- a grain allowed to cross into a neighbor's strip, say -- is a new
rule about where dust may go, and the honest change is to state that rule in
the ceiling's comment in the check and derive the new bound from it, never to
multiply the old one by a slack factor. The `ways` rule has no number to move:
if a change genuinely needs a second build a frame, the change is to `ways()`
itself -- memoize it on the frame, or thread the one build through the callers
that ask for it by default argument (`wayAt`, `footing`, `route`, `wayOver`)
-- and the gate stays at one. A red gate is a finding to write into this file
with the frame it spiked on and what the yard was doing, the way section 4 was
written, and the fix is on main; it is never a reason to loosen the check on
the branch that made it red.
