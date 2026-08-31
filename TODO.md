# Still to do

Three items left from `feedback.md` / `feedback2.md`, plus one piece of
housekeeping. One further item (dust leniency) is done and kept below for the
record. Everything else in both files is done and on main.

Each entry says what the thing actually is, what was found when it was looked
into, and what is blocking it — so none of this has to be re-derived.

---

## 1. Dust should fall into the quarry, and be fetched from it

**Status:** real, not started. The biggest of the four.

**What is actually wrong.** The cut is not a space a grain can occupy. It is
modelled as a depth-per-column dig, not as a plot of sand, so there is no cell
inside it for dust to sit in — which is why `blocked()` has to bar the mouth
outright (a grain over an opening is a grain lying on nothing), and why the
hauler's search is written against the one ground grid there is.

**The plan.** Give the cut its own sand grid, the way the pit has one, and let
the existing machinery find it:

- `src/state.js`, beside `pit`: `export const cut = { x, y, cols, rows, p: P,
  grid: null, painter: null, n: 0 }`.
- Size it in the layout pass beside the other sites: `cut.x = quarry.x`,
  `cut.cols = quarry.w / P`, `cut.rows = quarryDepth() / P`, `cut.y = S.groundY`.
- Cap each column by how deep that column has actually been dug —
  `cut.ceiling = c => max(0, (dugTopY(...) - S.groundY) / P)` — so dust cannot
  sit in rock nobody has taken out yet.
- Then the hauler search and `pileAt`-style lookups need to see the cut as
  somewhere dust can be, and the fetch trip has to go **down the ladder**.
  Nobody teleports: the walk down is a real walk, the same as `downTheHole`
  is for the pit.

**Watch for.** `downTheHole` is written around a hauler's `claim`/`booked`/
`carry` fields; the quarry version wants the same shape rather than a second
way of doing it. And whatever is added must respect the pit-mouth rule already
in `nearestMuck` — only a body that can descend may claim a column it cannot
stand on.

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
