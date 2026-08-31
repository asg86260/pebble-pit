# Still to do

Three items left from `feedback.md` / `feedback2.md`, plus a diagnosed
jitter regression (item 5) and one piece of housekeeping. Items 1 (dust into the cut) and 3 (dust leniency) are done and
kept below for the record. Everything else in both files is done and on main.

Each entry says what the thing actually is, what was found when it was looked
into, and what is blocking it — so none of this has to be re-derived.

---

## 1. Dust should fall into the quarry, and be fetched from it — DONE

**Status:** done. The cut has its own sand grid, wired into the mouth, the
ladder, the drawing, the save and the reports.

**What it turned out to be, against the plan above.** A `ceiling` could not
say "no dust below the dig line" — a ceiling counts rows up from the bottom of
the *plot*, and the bottom of the plot is the deepest the cut will ever go, so
a ceiling would let dust stand at the bottom of a hole nobody had dug and hang
rock over it. So the rock still to come out is *in* the grid instead, as cells
(`ROCK_CELL`, config.js): every column starts full of it from the plot's own
floor up to wherever the dig has reached, a swing removes exactly the one cell
under it, and the ordinary sand rules do the rest — dust that was resting on
top simply has nothing under it on the next pass. `src/grid.js` gained one
optional hook for it, `fixed(c, r)`, so `settle` never reads a piece of
standing rock as a grain with somewhere to fall or slide into a shallower
neighbour's open air.

- `cut` in state.js: sized once at the deepest the cut can ever be worked to
  (`QUARRY_BENCH_MAX` benches), not grown a row at a time — a bench bought
  mid-dig only adds more permanent floor under a column's *current* target, it
  never moves a row a grain is already resting in.
- `quarry.js`: `wireCut` builds it, `layCut`/`digCell`/`tipCut`/`resetCut`
  keep the rock level with `quarryCells`, `cutTop` is the surface a body or a
  route reads (the dust's own top, not the bare rock under it — `stepQuarrier`
  and `ways().cut.at` in route.js both read it now).
- `game.js`'s chip loop intercepts a chip over the open mouth (`overCutMouth`,
  world.js) the way it already did for the pit; `blocked()` lost the one
  clause that used to bar the mouth outright. The one edge case — a chip still
  in the air the instant `fillQuarry` refills the whole column solid — falls
  back to landing on the ordinary ground rather than being lost.
- `crew.js`: a hauler routes down the one ladder for a claim on the cut's own
  dust, `downTheCut` mirroring `downTheHole`'s shape (a route rather than a
  walk, `claim`/`booked`/`carry` rather than a second bookkeeping scheme), and
  a claim is per-column via `cutTaken` the same way muck's is. Only a hauler
  ever calls `nearestCutDust`, which is what satisfies `nearestMuck`'s rule
  that only a body able to descend may claim a column it cannot stand on.
- Drawn (`drawCut` in render.js, after `drawQuarry`'s white fill), saved and
  restored (`persist.js`, the same run-length pattern as the floor, paired
  with `quarryCells` — which was never saved before this and now is, since an
  unsaved dig depth made a saved cut meaningless), reported (`cutDust` in
  report.js), verified (rule 7 in verify.js now watches the cut's ledger too;
  rules 1 and 2 needed nothing, being written generically against `ways()`
  already). Two dev hooks, `__digCut` and `__pileCut`, for tests and the
  console.
- `test/cut-dust.test.mjs`: a chip over the mouth lands in the cut and not a
  pile; a hauler is seen on the cut's own way and banks a load; `fillQuarry`
  loses nothing, even when a few grains miss the quarry's own pile strip and
  land elsewhere on the ground; no grain ever sits at or below rock still
  standing; a closed quarry works exactly as it always did.

---

## 2. The upgrade system feels disjointed

**Status:** real, and blocked on agreeing a rule rather than on any code.

**What is actually wrong.** There is no rule saying what a board is *for*, so
"where does this row go" has been answered per row. The lab was defined as "the
only place a multiplier lives" rather than by what it is *about*, so it grew one
row per station rate: "quarry speed" in the lab sits next to "speed" on the
quarry's own board, and both move the same multiplier.

**The proposed rule.** A row is exactly one of three kinds, and each kind has
exactly one home:

1. **A rung** — a finite ladder (`RUNGS = 5`) on a number one station owns. It
   lives on the board of the building that owns that number. The rock and the
   crew own no building, so their rungs are on the bench under "the rock" and
   "the crew". A number has ONE ladder: a second tier is upper rungs priced in
   the next coin — which is what `pick` already does, billed in shard + dust —
   never a second row somewhere else.
2. **A place** — bought once, opens something. The bench.
3. **A spell or a piece of research** — the tower or the lab.

**Before doing anything:** produce the full table of every existing row, which
board it is on today, and where it lands under the rule. Agree that table first.
Moving rows silently would rearrange a shop the player has learned.

---

## 3. Dust in front of the rock pile, and off the left end of the yard — DONE

**Status:** done. Two leniency changes, landed together.

**The apron opens.** `blocked()` (`src/world.js`) no longer bars the rock's
clearance, only its footprint — `pastRock`, the renamed and narrowed
`pastApron`. The first attempt broke three things by freeing the whole apron at
once; each now has its own fix instead of being begged off:

1. Grains still cannot come to rest **under the boulder** — `pastRock` covers
   the footprint only, not a hand's width either side, so the ground the rock
   stands on stays barred.
2. The **heap-side clearance the spoil heap stands off from** is untouched: the
   heap's near end still comes from `rockLeft()`/`SITES`, never from wherever
   dust happens to be lying, so it cannot creep up against the boulder.
3. `clearApron()` (`src/rock.js`) no longer shovels the footprint's leftover
   dust into the nearest column — it throws each grain as a `spawnSpoil` chip,
   the arc a miner's spoil takes, so a new boulder's sweepings land out along
   the heap instead of stacking a wall against it. `bankCeiling`
   (`src/world.js`) treats the footprint edge as the cliff the clearance ramps
   away from, so the seam reads as a low scatter shading into the heap.

**The far left opens.** Ground left of `yardLeft()` now takes the ordinary
`LOOSE_DEEP` scatter out to the edge of the world instead of being barred.
Birds mint dust over it (`weather.js`'s `holdsDust` now checks the floor's
world bounds, not `yardLeft`). Haulers still do not walk out there:
`nearestDust`/`nearestMark` (`src/crew.js`) clamp their near end at
`yardLeft()`, so a claim is never booked on a column no body can stand on to
work off.

**LOOSE_DEEP** became a `let` and a row in `config.js`'s `TUNABLE` table, since
it now caps a great deal more ground than it used to.

Covered by three new groups in `test/ground.test.mjs`: "dust let go off the end
of the yard lies where it fell", "dust lies on the ground in front of the
hill", and "a rock landing throws the dust off its footprint rather than
shovelling it". Confirmed by eye with `node tools/look.mjs apron`.

---

## 4. The scrubber balloon

**Status:** designed, not built. Last, because it is the largest.

A balloon that rides the haze band instead of a shed that drags the haze to it:
a worker boards it, it takes haze in and drops muck below, a recycler upgrade
turns that to dust, and several can be deployed for a faster sky.

**Shape of it.** A new `src/balloon.js` owning the craft; `smog.js` keeps owning
the air. A balloon is a station that *moves*: `{ x, y, dir, riding }` in
`S.balloons` — an array of craft, not a count — with `x` in world pixels, moved
in **whole pixels** and never snapped to the lattice, exactly as the tractor is.
Its cruising height is derived from the same `bandTop()`/`bandLow()` pair the
motes use, so the band and the balloon cannot disagree.

**The hard parts, in order:** how a body boards it without teleporting; what
becomes of the existing scrubbing house and its saved state; how it wires into
the pile-full mark. Build it in stages that each leave the game playable.

---

## 5. Workers jitter on the rock's flank during a muck clear-up

**Status:** diagnosed to one commit and one mechanism; the obvious fixes are
measured and both trade it for a worse regression. Needs one more question
answered before it can land.

**The symptom.** During and after a rain, bodies shovelling the hill bounce at
its flank -- ease up a few pixels a frame, snap down 8-10px, repeat, about three
times a second. Measured with a climb-then-drop counter (ease up >= 2px, then
down >= 12px from the high point): ~26 cycles/min before the offending commit,
~195-264 after, ~560 with the ram running.

**The commit.** `bed9ba5` ("A claim on a mess keeps its elbows out, to the very
last cell"). Bisected: 26 cycles/min at `bed9ba5~1`, 195 at `bed9ba5`.

**The mechanism.** That commit made a body releasing a finished muck column
`return false` for one frame ("a finished column is let go and the next one
picked a FRAME later"), so that the re-pick happens against a claim book that no
longer carries the body's own elbows. But `return false` hands the body back to
its *own job* for that frame, and the job re-plants and re-aims it -- on the
rock that is `plant`/`standOn`/target logic snapping y -- and next frame muck
duty takes it back. Once per swept column, several columns a second across a
gang, is the jitter.

**Two fixes tried, both measured, both rejected.**
1. *Hold the body in muck duty for the release frame* (`return true`): jitter
   drops to 16/min -- and the janitors' clearing rate collapses. The sky-house
   check "a yard with the post staffed is a yard being kept up with" goes from
   15 poop left (HEAD) to 95.
2. *Re-pick in the same breath, scrubbing only the body's own elbows from the
   frame's book*: jitter 18/min -- same collapse, 82 left. Every other body's
   claim was preserved exactly, so the slowdown is not about spacing.

**The open question, which is the blocker:** why does the one-frame fallthrough
to the body's own job *double* the janitors' clearing rate in that check? The
janitor's own step (`janitorWork`) only loiters -- it sweeps nothing -- so the
dropout frame should cost, not pay. Until that is understood, any fix that
removes the dropout frame will fail the same check for the same unknown reason.
Suspect: some second cleaning path runs only when `takeMess` yields, or the
elbow bookkeeping interacts with `elbowMuck`'s spacing in a way the claim book
does not show. Answer that first; the fix will then be a few lines in
`takeMess` (src/crew.js, the release branch).

**Repro.** Seed 20250830; open sites, loo, 2 miners + 2 haulers + 2 janitors;
relay 3 cells of muck across the rock's columns every 5s; count climb-then-drop
cycles over 60s of frames. The counter and the scenario are five lines each --
they lived in a scratch script, not the repo.

---

## Housekeeping: two tests fail at random

Neither is a game bug, but they are why the suite looks untrustworthy — and an
untrustworthy suite is most of why iterating feels slow.

- `test/rock.test.mjs`, "the one underneath is covered by the rock" — roughly
  1 run in 6, and it fails alone as well as under load. It watches 400 frames
  and asserts a body says something during them; the window is timing-sensitive.
- `src/selftest.js`, "a body is thrown rather than dropped" — fails only under
  full-suite load, on a different assertion each time. It drives a real pointer
  with real `sleep()`s, which get squeezed when the machine is busy.

Both want the same treatment: assert the thing that must be true rather than
the thing that happened to be true in a fixed window.
