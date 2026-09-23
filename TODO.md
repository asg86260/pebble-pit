# Still to do

## The air filter is the balloons' shed -- BUILT (2026-09-22)

"The air filter is the balloons' shed" in DESIGN.md. The shed filters nothing:
no body inside, no spout or heap. It keeps the gauge and the board; the
balloons do all the cleaning, and buying one sends a spare hand to ride it.

## The balloons ride the clouds -- BUILT (2026-09-22)

"The balloons ride the clouds" in DESIGN.md. A row of moorings beside the
dial, like the pots, inside a wider filter footprint; riders commute straight
to their own post. Aloft, a balloon lives in the clouds' parallax and travels
from cloud to cloud between the sheets, drawing each in. Because where it is
in the sky depends on the view, its work is a clock of its own: the pull is
the fan's as now, the catch is carried home to the post and thrown on the
filter's heap, and the trips up and down take a fixed time.

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

### `inWorking` reads the ground line to a pixel again (2026-09-22)

`onYard` is `!inWorking`, and since b58041ac `inWorking` answers true for any
feet more than a pixel under the ground line -- the tolerance 8e16327f took out
of the dance's duck because the idle bob crosses it (a body mid-bob sits about
1.17px low). The duck, the commute's duck, the fall rule and the quarry's and
farm's muck errands all ask it. b58041ac wanted a body under the ground with no
working under it (the cut moved on a re-walk) read as down a hole; the fix is a
depth that means that, not a pixel. Blocker: `inWorking` is asked across the
yard, so it moves bodies in checks that are not about it.

---

## Balance calls, waiting on a decision

### The sphere's numbers (built 2026-09-22)

`SPHERE_BILL`, `SPHERE_WORK` and `SPHERE_TUNE_WORK` are first guesses. Its
yield is derived (the ring's
topped rate times `MACHINE_GAIN`), and a closed sphere brims the sky pile
within a minute in the `sphere` scene, so the haulers set its real pace;
worth a playbot run on spark income before and after, and on what the
three-hat cap costs a yard that used to train more.

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

- **The forklifts drive themselves** (approved 2026-09-22, building).
  DESIGN.md, "The forklifts drive themselves": a forklift becomes its own
  body (`TYPE.LIFT`, not crew) that hauls by the haulers' loop with nobody
  aboard and parks at the bench's stand when idle; old saves' worn forklifts
  come off their carters. The bulk of the work is every crew-walking system
  saying whether it means people. Plus two ladders, forklift load and speed.
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
