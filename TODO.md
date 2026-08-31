# Still to do

Three items left from `feedback.md` / `feedback2.md`, plus one piece of
housekeeping. Everything else in both files is done and on main.

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

## 3. Dust in front of the rock pile — ATTEMPTED AND BACKED OUT

**Status:** blocked on one question. Do not retry without answering it.

**The question:** *which strip is meant* — the yard side you are looking at
(between the bench and the rock), or the gap between the rock and its own spoil
heap? They need opposite changes.

**What happened when the apron was freed.** Deleting `if (pastApron(x) < 0)
return true;` from `blocked()` broke three separate things, in this order:

1. Grains came to rest **under the boulder** — a grain about to be inside a
   rock. `pastApron` covers the rock *plus* a hand's width either side, so
   freeing all of it frees the ground the rock stands on.
2. The **heap-side clearance is what the spoil heap stands off from**. Freeing
   it let the heap creep up against the boulder.
3. `clearApron()` sweeps whatever lies in the apron into the nearest column that
   will take it — which is the first column of the rock's own spoil heap —
   **every time a rock is made**. That column then stood twelve cells against
   the boulder: exactly the sheer wall `bankCeiling` exists to prevent.

**The conclusion.** The apron is not incidentally bare. It is the clearance
three separate rules are written against, and making dust lie there means
deciding what those three rules say instead. That is a design decision, not a
one-line change.

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
