# Still to do

## The balloons draw the haze in -- BUILT (2026-09-22)

"The balloons draw the haze in" in DESIGN.md. The cloud threads are cut: tied
to clouds that scroll slower than the ground, they slid and switched clouds on
every scroll. A working balloon now gathers murk-colored cells into its box
from above and the sides, kept relative to the craft (`craftair.js`), thicker
the dirtier the sky. Clouds are no longer paled.

Open work only. Each item carries its diagnosis and its blocker, so none of it
has to be re-derived. What was built is in DESIGN.md (the `(built)` sections)
and CHANGELOG.md; the old entries are in git history (this file before
2026-09-22 carried every one of them).

---

## Defects

### The shoveller's elbow stalls a cell short (2026-09-21)

`test/janitor.test.mjs`, "a shoveller with somebody in its elbow moves off
the spot": with the other body pinned on top of it, the janitor is nudged two
cells (12 px) and never takes the third to be clear of an 18 px body.
`elbowMuck` is a third of a pixel a frame and `shovelAt` snaps to whole cells
toward the claim, and under the seed the cloud rework moved the run to, the
snap settles at two. Not a timing matter -- eight seconds does not get the
third cell. Red on main until the elbow is looked at.

### Five movers still write `y` as a position (2026-09-08)

A mover that sets `w.y = walkY(...)` outright is a teleport whenever the body
is not already on that line. `route.js` names the class at the foot of
`climbTo`: "Fix the mover, not the law of walking." Still in the code:

```
src/crew/tenders.js:75, 90     src/apothecary.js:327, 352
src/balloon.js:244, 248        src/intro.js:123, 502
```

Not one sweep, deliberately: the tenders' and the balloon's cases are bodies
going through doors and up into baskets, where "the ground under it" is not the
question. Each wants a look on its own, with a shot, and probably a check per
mover.

Same hunt: a body joining the dance out of a walk runs `w.y = stand(w)` that
frame (`jig` in crew/dance.js), and `w.foot` is re-taken from the new y on the
same frame -- measured up to seventeen pixels of snap. Only when the beat starts
while the crew are commuting, which `dance.test.mjs` does not arrange.

### A knocked-off hat is not saved (2026-09-14)

`w.hatOff` (crew/pointer.js, stepped in crew/step.js and crew/kitwalk.js) is on
no saver, so a body sent to pick one up after a refresh finds nothing there.
Save it as a fact of the yard, the way a loose core is.

### Workers jitter on the rock's flank during a muck clear-up

Bodies shovelling the hill after a rain ease up a few pixels, snap down 8-10,
about three times a second (~130 cycles/min since the stuck-yard fixes; 26
before `bed9ba5`).

**Mechanism.** `bed9ba5` made a body releasing a finished muck column `return
false` for one frame so the re-pick happens against a claim book without its
own elbows. That hands the body back to its own job for the frame, which
re-plants it on the rock (`plant`/`standOn`), and muck duty takes it back next
frame.

**Blocker.** Both fixes tried -- hold the body in muck duty for the release
frame, or re-pick in the same breath -- drop the jitter to ~17/min and collapse
the janitors' clearing rate (the sky-house check goes from 15 poop left to
80-95). Why the one-frame fallthrough *doubles* clearing is not understood;
`janitorWork` only loiters. Answer that first; the fix is then a few lines in
`takeMess`'s release branch.

Repro: seed 20250830; open sites, loo, 2 miners + 2 haulers + 2 janitors; relay
3 cells of muck across the rock's columns every 5 s; count climb-then-drop
cycles (up >= 2 px, then down >= 12 px from the high point) over 60 s.

### `addGrain` on bare ground has no region (2026-09-09)

The region lookup returns `null` for bare yard, the same value as "no region",
so `inRegion` is always true and the search runs to `b.cols` -- it can walk
into a neighbor's strip, which is a teleport. Neither perf-gate yard hits it.

### The sim is camera-dependent (2026-09-09)

The sky's motes spend the shared seeded RNG at *screen* positions, so two camera
placements draw different numbers (the intro's thrown grain lands on frame 1180
against 1195). The clean rain already draws from a `stream()` of its own; the
motes want the same. Until then no check can assert frame-exact timing across a
camera change.

### A body assigned to a closed quarry stands in the ground (2026-09-08)

`capOfBare` (levels.js) answers off `benches()` and `plotCount()`, which count
what a quarry or farm *would* hold, so a shut station reports room and
`assignJob` fills it; the body stands a body-height under the ground line with
no working under it. Both ways in are shut (`__crew` and `__assign` open the
place first; a shut station has no board), so no route reaches it today.

The real fix is a gate in `capOfBare` on `S.quarryOpen` / `S.farmOpen`. It was
built and backed out: it moves bodies in every check that staffed a station
before opening one (`dance`, `reload`, `sky-fan` went red, none about
staffing). Do it deliberately, reading the fallout a check at a time; expect
`__crew`'s station-open lines to move above `rebalance()`.

### Two tests fail at random

- `test/rock.test.mjs`, "the one underneath is covered by the rock" -- about 1
  run in 6, alone as well as under load. It watches 400 frames and asserts a
  body says something; the window is timing-sensitive.
- Browser, "a body is thrown rather than dropped" -- only under full-suite load,
  a different assertion each time. Real pointer, real `sleep()`s.

Both want to assert what must be true rather than what happened in a window.

### Small

- `tools/node/costs.mjs` fails before it writes (`rungsOf is not a function`;
  it moved to `src/words.js`), so `docs/upgrade-costs.html` is stale and still
  says "scrubbing house".
- `wayAt` answers `rock` for a body under a rock still 620 px up, and
  `verify.js`'s `deepest` measures it against the airborne `rockTopY`. Falls run
  42 frames against `BURIED_FRAMES` = 60, so it never fires; `rockDown()` in
  rock.js is the exemption if it ever does.
- `upTop` survives at two station-errand predicates with a 1 px fragility (a
  false negative costs one frame of an errand).

---

## Balance calls, waiting on a decision

### Rain muck clogs the air filter

`clogged()` counts every grain of muck on the filter's strip (`outletMuck`,
smog/band.js), and the rain drops muck everywhere, so a sky bad enough to rain
stops the filter exactly when it is needed. For changing it: the clog was
written about *what the filter makes*, and weather muck is not that. Against: a
yard buried in muck stops every works, and no exception is the simpler rule. If
it changes, muck has to carry where it came from (a field on the layer, since
`MESS` does not record it). The balloon's clog below is the same question.

### The balloons: the clog, the fleet, the reading

The craft flies, crewed, and pulls from the clouds. Left:

- **The clog.** A craft drops wherever it is and nothing stops it. The design:
  it clogs on the column beneath it and clears by moving on, with the pile-full
  mark on the mast when every craft is stalled. Settle the rain-muck call first.
- **The fleet.** Lanes not looked at with two in the sky; each craft walks the
  whole sky list on its own. Fine for one, wasteful for three.
- **The reading.** Nothing on the board says whether a craft is up, crewed or
  tied to its mast.

### The builder bottleneck (2026-09-08)

"The one bench carries two ladders' worth of waiting" in DESIGN.md. A
representative backlog (2,332 worker-seconds) did not clear in 2,000 game
seconds at the top of both builder ladders; builders did useful work ~37% of the
time. Not root-caused, roughly 4x what the ladders predict, and only with
several works competing. Instrument `handsAt('yard')` against builder
positions -- walking, `slotFor` thrash, or `stepWorks`'s accounting -- before
touching `src/config/build.js`.

### Numbers nobody has played

- The grind pass's re-measure: the quarry/lab doors may sit heavy (bot: 200 min /
  5.3 h); verify quarry occupancy on a real save before touching shard supply;
  the machines' shard legs if the endgame reads as a wait. Read
  `docs/critics-2026-09-10.md` before any balance work; the bot matrix has not
  been re-run since.
- The shield prices (`PROP_COST`, `NET_COST`, `ARCH_COST`) as tolls, and whether
  the pinned corner sits lower on a phone.
- `LIFT_FOUL`, against a fully bought air filter.
- The sky: murk depth, the hand-foul rate, the first storm's feel; the swelled
  clouds read faintly in the base tones (a tone deepening with the swell is the
  one-line option).

---

## Approved or designed, not built

- **The noticeboard** (approved 2026-09-10). DESIGN.md, "The noticeboard, and
  the record on it": forty-two notices, recognition only, the books move onto
  its second sheet. Thresholds are dev-panel questions. Wave-sized: catalog,
  board, site row, witnesses. Sheet: `docs/noticeboard-catalog.html`.
- **The gust front** (`windAt(t, x)`, so a gust crosses the yard). Blocked on
  every caller needing an honest `x`, and `report.js` has none.
- **The apothecary:** shard, spore and core still leave the hole without a
  flight to the station (dust arcs); a second independent tonic rather than a
  second pot of the same one.

---

## Drawing and listening

- The forklift (`drawLiftBox`, render/crew.js) and its `lift` shelf glyph are
  first sketches; want a pass in `glyphs.html` and a shot.
- The farm shed, the quarry shed and the bench share one silhouette at 1x. One
  feature of three cells or more apiece: a pit-prop A-frame roof on the quarry's,
  a lean-to with the trough on the farm's, an anvil or vice on the bench. Shoot
  the options before drawing one.
- The casino: nobody has listened to its audio; the spark bin's fanfare and the
  converting bins' blinking feet are not drawn.
- The queue: nobody has watched a refund's grains fly on a real window, and a
  big dust refund is one `bankDust` a grain in one frame, untimed.
