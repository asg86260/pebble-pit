# A review of the systems

Written after a session spent chasing five reported bugs. The point of it is
that all five turned out to be the same bug, and the same bug is still sitting
under a dozen other things that have not gone wrong *yet*.

The pattern, stated once:

> **A rule about the world gets written down in the place that first needed it,
> and then re-derived by hand everywhere else that needs it.** Nothing holds the
> copies level. The copy that gets forgotten is the one you see on screen.

Every entry below is an instance of that, and the fix is always the same shape:
name the rule, give it one home, and make everything else *ask* rather than
*know*.

---

## Part 1 — what the five bugs actually were

Not five bugs. Five symptoms of four missing systems.

### "Hats aren't always displayed, and workers don't always take them on and off"

A hat was **four facts kept in four files**:

| fact | lived in |
|---|---|
| which trade owns it | `TRADE_OF` — upgrades.js |
| which jobs fetch one | `KIT_JOBS` — crew.js |
| what shape it is | `KIT_MARK` — roster.js |
| how tall it stands on a stand | `HAT_TALL` — render.js |

The janitor's cap was in exactly one of those. So it existed only because
`drawWorkers` had a branch that drew it by name, and no other part of the game
believed in it — not the roster, not the errand, not the count.

And the count was wrong in a way that could not be seen. `worn(job)` was counted
off `JOB_OF[w.type]` — the job a body is *on*. Move somebody from the rock to
carrying and they keep the helmet on their head for the length of the walk back,
but `JOB_OF` now says hauler, so the rock counted nobody wearing its kit and put
a helmet it did not have out on the stand for the next body along. **One helmet,
two heads, and a count that said everything was fine.**

The tidy path (`retask`) did queue a walk to hand the hat in. But a queued walk
is a list of legs, and a list of legs is abandoned the moment a rock falls, a
mess lands, or you pick the body up and shake it. The leaving rule cannot only
live in the thing that gets interrupted.

### "Dust appears on the ground when you shake somebody"

`shakeHeld` called `addGrain(floor, w.x + WORKER / 2, blocked)`. The grains were
**painted into the floor grid, fully settled**, at the body's column — regardless
of how high you were holding it or how hard you were waving it.

The game already had the right thing and had had it for a long time. Every other
loose object in the yard is a *chip*: a shade with a position and a velocity,
falling under gravity, landing where it meets the ground. A miner's spoil is one.
A hauler's tip is one. The load a stood-down body drops is one.

This is the purest example of the pattern in the whole codebase: **a general
system existed, was in scope, and a one-off was written next to it.**

### "Quarry workers climb out the sides"

The walk-to-the-ladder-then-climb sequence was written out by hand **four times**:

- in `stepCommute`, for a body reassigned off the quarry
- in `stepQuarrier`, as the `to` → `down` states
- in `stepQuarrier` again, as the `up` state
- in `stepQuarrier` a third time, in the pile-full branch

…and a fifth partial copy as the hand-written `upTop` guard before the muck
branch. Plus `downTheHole` — an entirely separate five-state machine
(`to`/`down`/`dig`/`cross`/`up` with a `w.side`) doing the same job for the pit.

None of those knew about each other, and none of the *other* dozen places that
move a body knew about any of them. "Depending on what they're doing they climb
out the sides" is precisely the shape of that: the rule held on the paths that
remembered it.

### "The janitor walks over the rock pile instead of in front of it"

Two separate causes, both the pattern.

`walkY` — the ground line and the bridge — was the surface for everybody, and
`landing` — the rock's face — was the surface for miners, chosen by **job title**:

```js
const stand = w => climbTo(w, w.type === 'miner' ? landing(w) : walkY(...));
```

So a fact about *the world* (how high the ground is here) was kept in a fact
about *a person* (what they do for a living). Every path that moved a body had to
know which of the two applied, and the ones that forgot walked bodies through
solid rock — measured at 120px inside the hill, buried well over their own
height, for the whole width of the footprint.

And nothing at all knew a heap was there. `onSite` held out the rock, the quarry
and the plots — three quite different reasons wearing one name — and then
`workSpot` made the rock an exception again, which is two rules cancelling. Heaps
were in neither, so a body sent to clear a mess on a full heap stood at the
height of the ground *in the middle of it*.

### "The celebration is wonky as fuck — they vibrate instead of dance"

Three moves. Two of them drew nothing.

`drawBody` is a symmetric filled square and `drawHat` takes no facing, so
**`w.dir` and `w.face` are rendered nowhere.** The `spin` move flipped `w.dir`
twice a second and the screen did not change a pixel.

`step` moved `JIG_STEP * 0.06` pixels **per frame, with no frame time in it** —
about a thirtieth of a walking pace, and slower the better your display.

What was left was a square changing height on the spot at 2.6 beats a second.
That is the definition of vibrating, and that is what it looked like.

The deeper flaw is that **nothing wrote down what a body can express.** The
answer is short — an x and a y, in whole cells — and had it been written down
anywhere, nobody would have built two of three moves out of a facing that is
never drawn.

---

## Part 2 — what still has the same fault

These have not misbehaved yet. They are the same shape as the five that did.

### 1. The pit still has its own way out — HIGH

`downTheHole` in crew.js is a five-state machine with its own ladder discipline,
its own `w.side`, and its own crossing rule. It now sits beside a routing system
that does all of that generically, and the pit's ladders are *already* in the
links table. Two systems, one job, and the pit's copy is the one that will drift.

**Fix:** delete it; the pit becomes two links and a way, which it already is.

### 2. Two climbers, one cached foot — HIGH

`climbTo` (crew.js) eases feet toward a surface and caches the answer in
`w.foot`. `climbToward` (route.js) does the same thing without the cache. They
are kept honest by one line in `stepRoute` that writes `w.foot` back. That line
is exactly the kind of hand-kept agreement this whole review is about.

**Fix:** one climber, owned by the surface system, with the cache inside it.

### 3. Feet cannot keep up with a sheer face — MEDIUM

Measured after the change: a body walking into a vertical rock face is briefly up
to **24px inside it** (it was 120px). `climbTo` eases at the walking pace and a
half, which carries any slope up to about sixty degrees and cannot carry a wall.

**Fix:** a wall is not a slope. Either a body stops at the foot of one and climbs
it as a climb, or a face steeper than the ease can carry is not walkable and the
route goes round. Both are one rule in one place; neither is a constant.

### 4. The crew loop is one 600-line `for` — HIGH

One loop over every worker, with per-type branches whose *order* is load-bearing.
The file's own comments document this: the tender check "used to sit below all of
them… and was fatal for the miner because its branch `continue`s on every path",
so the ram was bought and never took a bite. Adding a job means finding the right
place among a dozen `continue`s.

**Fix:** the shared concerns are a pipeline every body goes through in a stated
order — held, falling, dizzy, kit, relieved, held-up-by-a-rock, mess, work — and
a job is one row with one `work` function. The order becomes a list you can read
instead of a property of where you happened to paste a branch.

### 5. Facing is state nothing draws — MEDIUM

`w.face` and `w.dir` are set in eight places and drawn in exactly one (which way
a cart trails). Any behaviour built on facing is invisible, and one already was.

**Fix:** either give a body a drawable front, or delete the field and let the
cart read its direction of travel. Keeping unrenderable state is how the spin
happened.

### 6. Adding a tunable knob takes four edits — MEDIUM

config.js is ~1900 lines. A knob needs: the `export let`, a row in the dev-panel
list, a `case` in the getter switch, and a `case` in the setter switch. Four
places, hand-kept, no error if you miss one — you get a slider that reads a stale
value.

**Fix:** one table per knob (`{ key, label, min, max, step, value }`), and the
getter and setter read it. The three duplicate lists collapse into the table.

### 7. Muck and poop are two arrays with one set of operations (fixed) — was MEDIUM

`slumpMess` loops `[muckCols(), poopCols()]`. `dropMuckAt` takes a `kind` and
picks one. `sweepMuckAt` has a rule about which a given pair of hands may shift.
The two are the same thing with different ownership.

**Fix:** one layer with a `kind` per cell, and ownership as a property of the
kind. This is exactly the shape `KIT` now has.

### 8. Hand-invalidated module caches (fixed) — was MEDIUM

smog.js keeps `siteAt`, `allLeft`, `yardLeft`, `poopTotal`, `yardPoop` as
module-level `let`s refreshed by a `refresh()` that must be called at the right
time and nulled at the right time. `siteAt` is, as of this session, **dead — still
assigned every refresh and read by nothing.** That is the failure mode: a cache
nobody can see the lifetime of.

**Fix:** derive on demand, or make the cache a memo keyed on the thing it depends
on. Never a bare `let` plus a discipline.

### 9. Two hook tables (fixed this session, worth recording) — was HIGH

console.js and `tools/node/yard.mjs` each kept a hand-written list of the same
`__` handles. A hook added to one existed in one suite and not the other. This
bit *this session*: two new checks failed with `__surface is not a function`,
which had nothing to do with what they were checking. Now one `HANDLES` table,
spread by both.

### 10. The browser suite is one 3,874-line file — MEDIUM

`src/selftest.js` is the largest file in the project and holds every browser
check. Running one thing means `--only <substring>`. The node tier is 22 small
files and is much better to work in.

**Fix:** the node tier already shows the shape. Split by subject.

### 11. `report.js` snapshot is a single ~5KB line — LOW

Adding a field is easy; reading the file is not, and neither is a diff of it.
Cosmetic, but it is the file every check reads through.

---

## Part 3 — the rule to hold the line with

Three questions, and they would have caught all five:

1. **Does this fact already have a home?** Before adding a table keyed by job,
   kind or station, look for the table that is already keyed that way. The kit
   had four. The hats had one home and three copies.

2. **Does a general system already do this?** Before writing movement, falling,
   settling or spawning, look for the one that exists. `spawnChip` was in scope
   when `addGrain` was written next to it.

3. **Can this be seen?** Before building behaviour on a field, check something
   draws it. `w.dir` drew nothing, and a third of the dance was built on it.

And one habit worth keeping: **the checks should state rules about the world, not
behaviours of one body.** `test/route.test.mjs` asserts that the cut is joined to
the rest of the world in exactly one place. That check holds for jobs nobody has
written yet, which is the only kind of check that stops this pattern coming back.

---

## Postscript — the suite earning its keep

Worth recording, because it is the counter-example to everything above.

The new routing cached a body's path when the walk began and then walked it to
the end. That is wrong in a yard where the destination moves: the head of the
ladder shifts as the cut is dug and filled in, and a body handed a new errand
mid-walk has a new place to be. What it did was carry on to where the target
*used to be*, arrive, and call that arriving.

Nothing looked wrong. It was caught by `frame-rate.test.mjs` — a check that says
only *a walk is a distance over a time, whatever the frame rate* — because the
overshoot depended on where the frame boundaries happened to fall, so the same
walk came out 192px at thirty frames a second and 217px at sixty.

That check knows nothing about routes, ladders or quarries. It states a rule
about the world, and a system that broke the rule failed it the same hour it was
written. That is the whole argument for Part 3.
