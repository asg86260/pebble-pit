# Wave 6 — feedback6.md

This document is canon. Subagents: do not redesign; implement. Where a number or
a name is written here, use it. A track that finds an item impossible says so in
its report rather than inventing a different feature.

Source: `feedback6.md` (10 items). Two tracks with disjoint file ownership.
Optimizing for: the yard *feeling* right in the morning — walks, storms and
layout the user can look at. Cut tuning polish before cutting mechanisms.

---

## Track A — sim & crew (branch `wave6-sim`)

Items 1, 2, 6, 9, 10.

### A1. Training grounds worker assignment (item 1)

The school currently has no trade — its works are done by builders
(`SITE_JOB.school = JOB.BUILD`, `src/works.js:53`). Add a **teacher** trade so
the training grounds gets a post on the boards and a body through the door.

Deliverables, in lockstep (miss one and `syncWorkers` stands the body down on
the frame it is made — CLAUDE.md "Nothing teleports"):

1. `TYPE.TEACHER` / `JOB.TEACH` pair in `src/jobs.js`.
2. `S.teachers` count field, added to the correct list in `state.js` (SAVED),
   in one block at the end under a `// wave6-sim` comment.
3. A `JOBS` registry row in `src/crew/jobs.js` with `factory` / `want` / `step`.
   `want` = `S.teachers`, capped by school built. The teacher's `step`: walk to
   the school, stand inside; while a teacher is through the door
   (`ARRIVED` predicate in `src/crew/muster.js`), school works (trade training,
   wizard hats) run; with no teacher present they stall. Output depends on the
   body through the door, never on the assigned count.
4. `ARRIVED.teachers` predicate in `src/crew/muster.js`.
5. Include the job in `upgrades.js:278`'s `JOBS` list and add a `capOfBare`
   case (`upgrades.js:358-421`): cap = 1 while the school stands, 0 before.
6. `POSTS` entry in `src/roster.js` so the boards show the post.
7. Keep `SITE_JOB.school = JOB.BUILD` for *constructing* the school itself;
   the teacher gates the school's *outputs* (training works), not its build.
   Concretely: in `stepWorks` (or the school work rows), school training works
   accrue only while a teacher is arrived.
8. No new station art, so no new pile strip or per-cell work is needed.

Check (node tier, `test/wave6-sim.test.mjs`): buy the school like a player
(`__buy('unlockschool')` and run it to done), assign a teacher through the
boards path, start `train a wizard`, assert it progresses only while the
teacher is through the door.

### A2. Farm/quarry upgrades pull a body to the shack (item 2)

Today `SITE_JOB.farm/quarry` credit upgrade work to the station's own gang,
who keep producing while the bar fills (`src/works.js:39-40`,
`busyBuilderSites` skips staffed sites). Required behavior: when a farm or
quarry upgrade is bought, **one member of that station's gang stops producing,
walks to the station's shed (`farmShed()` / `quarryShed()`, `src/world.js:73-80`),
stands there for the duration, and the work accrues only while they are there.**

Implementation (keep the gang, don't flip to `JOB.BUILD` — the user asked for
*a worker that stops working*, i.e. a visible cost at the station):

- In `stepWorks`/`handsAt`, a farm/quarry site with an open work claims one
  gang body: mark it (e.g. `w.onBuild = id` on the work or a flag on the body),
  route it to the shed rect, and while marked its `stepQuarrier`/`stepFarmhand`
  production step is skipped.
- Work credit = 1 while the marked body is at the shed, 0 otherwise (existing
  `Math.min(1, there)` cap stays).
- When the work completes, the flag clears and the body walks back to its post.
  No teleports either direction.
- A one-body gang still works: the station's production simply stops during
  the upgrade. That is the intended bargain.

Check: buy a quarry upgrade like a player with a 3-body quarry gang; assert
exactly one body ends up in the shed rect, quarry output drops accordingly,
the bar only advances while it is there, and the body returns after.

### A6. Belt progress bar position (item 6)

The belt row's bar falls through `siteBox`'s guess and lands on `beltFrom()`,
inside the boulder (`src/works.js:260-261`, `src/dust.js:143`). Fix the
system, not the instance: give machine rows real boxes. Add `belt` (and the
other yard machines that share the fall-through) to the `YARD_ROW_SITE`-style
mapping in `src/works.js` with a box spanning `beltFrom()`…`beltReach()`, so
`barSpot` centers the bar between the rock's right edge and the pit edge.
Verify with a shot (`node tools/look.mjs belt --zoom 4`), pixels not
arithmetic.

### A9. Double wizard progress bar (item 9)

Two draws of the same work: generic `work bars` (`src/render/bars.js:72`) plus
`drawTowerBar` (`src/render/tower.js:206`). Delete the `'tower bar'` entry
from `LAYERS` in `src/render.js` (one-line removal) and delete
`drawTowerBar`/`towerBarAt`. Add `tower: () => towerSpire()` (or the tower
box) to `BUILDING_OF` in `src/render/bars.js` so the one generic bar hangs
over the spire. Shot the tower while training to confirm one bar.

### A10. Wizard base strength (item 10)

Wizards are not pre-upgraded; the base numbers just feel maxed (`WIZ_MS =
1100`, floor 120; crits ×3 at 10% from level 0). Retune in
`src/config/tower.js` / `src/config/crits.js`:

- `WIZ_MS`: 1100 → **2600** (a bolt every 2.6 s at level 0; the 5-rung speed
  ladder now ends near ~850 ms, so every rung is felt).
- Keep `wizBite()` base at 1.
- Crits scale with investment instead of arriving free: `CRIT_CHANCE_MIN`
  0.10 → **0.04** (leave `CRIT_CHANCE_MAX` and the mult ladder alone).

These are config-only edits; update any test that asserts the old constants.

### Track A ownership

- **Owns:** `src/jobs.js`, `src/crew/**`, `src/works.js`, `src/roster.js`,
  `src/upgrades.js`, `src/upgrades/**`, `src/wizard.js`, `src/tower.js`,
  `src/farm.js`, `src/quarry.js`, `src/render/bars.js`, `src/render/tower.js`,
  `src/config/tower.js`, `src/config/crits.js`, `src/config/crew.js`,
  `src/config/build.js`, `test/wave6-sim.test.mjs` (new), and existing crew/
  works/ladder/machines tests it must update.
- **Shared, additive/one-block only:** `src/state.js` (field lists),
  `src/render.js` (only the `'tower bar'` line removal), `src/hooks.js`,
  `src/dev.js` TUNABLE lines.
- **Do NOT touch:** `src/smog/**`, `src/render/smog.js`, `src/render/sites.js`,
  `src/render/counter.js`, `src/config/sky.js`, `src/config/sites.js`,
  `src/world.js`, `src/weather.js`, `src/rift.js`, `tools/look.mjs`,
  `test/sky-*.test.mjs`, `test/wave6-sky.test.mjs`.

---

## Track B — sky & layout (branch `wave6-sky`)

Items 3, 4, 5, 7, 8.

### B4. Haze: total pool, not bands over machines (item 4)

`S.haze` already *is* the total (`reckon()`, `src/smog/vents.js:116`). The
banding comes from `homeX` anchoring each settled mote to `fromX` (the stack
that made it) inside a window that takes ~7 minutes to widen
(`src/smog/sky.js:73-92`, `SMOG_SPREAD_*`). Rewrite:

- A settled mote's across-position is **uniform over the whole band span**:
  `x = span.left + m.su * span.width` (the golden-ratio `su` from `nextSlot()`
  already gives even coverage). Delete `fromX` anchoring, `spreadAt`, and the
  age-based widening (`SMOG_SPREAD_MIN/RATE/MAX` go away; leave a tombstone
  comment in `config/sky.js`).
- Puffs still rise from their stack (the visible cause), but instead of flying
  to a slot: a puff climbs, thins and **fades out** over `PLUME_LIFE`/
  `PLUME_THIN`; when it expires, its mote **fades in** at its slot position in
  the band over `SMOG_SINK`. Full fades, no popping (established vfx taste).
- Keep sway lanes, creep, gust lift, per-mote `give` — the band should still
  breathe, it just shouldn't remember which machine made it.
- `moteX/moteY`, the `render/smog.js` cull, `smog/rain.js`'s `settled`,
  `fillTo` restores, and `books.js` (`clumpiness`, `skyBins`, `skyX`) all
  follow. `clumpiness` should now assert near-uniform bins — tighten it, and
  update `test/sky-muck.test.mjs`, `test/sky-readout.test.mjs` ("a speck off a
  swing…" moves to: the speck joins the band, position uniform),
  `test/sky-air.test.mjs`.
- Verify with the haze ladder shots `sky0…sky3` — the band must read as an
  even ceiling at every level, no plumes-turned-pillars.

### B5. Storm-shaped rain (item 5)

Today: no darkening, ramp-then-flat, brim sky drains in ~9 s
(`RAIN_PER_S 2925`). Muck total is duration-independent
(`muck ≈ motes × RAIN_MARK`), so lengthening the storm does not raise muck —
leave `RAIN_MARK` and `MUCK_MAX` alone.

- **Duration:** `RAIN_PER_S` 2925 → **650** (brim sky ≈ 40 s; light skies
  proportionally shorter).
- **Shape:** replace the `on = min(1, rainFor/RAIN_RAMP)²` ramp with a
  storm envelope on the drain rate: drizzle at 20% for the first **6 s**
  (`RAIN_DRIZZLE_S = 6`, new tunable), smoothstep up to 100%, then taper —
  when the remaining marked motes fall below **25%** of the marked count,
  scale the rate down with the remaining fraction (smoothstep to ~10%), so
  the shower trails off instead of cutting. "A shower ends clean"
  (`test/sky-readout.test.mjs`) must still hold: every marked mote is gone at
  the end.
- **Pre-storm darkness:** new `drawStormPress` layer inserted in `LAYERS`
  immediately after `'smog'` (one line), living in a new `src/render/storm.js`
  (Track B owns it). Darkness is a translucent band wash driven by a new
  `S.storming` ramp: when the break roll succeeds, do not start the rain at
  once — set a **brew-up of `STORM_BREW_S = 20`** game seconds during which
  the wash ramps from 0 to `STORM_INK_MAX = 0.35`, then the drizzle begins;
  the wash fades back out over the taper. Black and white only — the wash is
  black at low alpha, flat, no gradients. New constants in `src/config/sky.js`
  under a `// wave6-sky` block, each one a `TUNABLE` line for dev.js.
- Add a `rain` scene to `tools/look.mjs` (fill sky, force break via hook, run
  to mid-storm) so this is shootable; shots at brew-up, drizzle, peak, taper.

### B3. Station spacing (item 3)

Spacing runs 120–330 px from one `STATION_GAP` because each slot bakes in
heap standoffs and *future* max width (`placeSites`, `src/world.js:241-311`).
Fix the system: the walk should space **current visible extents**, not
reserved futures.

- Reserve growth on the side away from the walk (or re-seat on growth —
  stations already re-seat via `seatSites()`), so the gap between what is
  *drawn* today is `STATION_GAP` everywhere, heaps included: a site's slot =
  current drawn width + its pile strip, then one `STATION_GAP`.
- Growth (farm plots, apothecary pots) triggers a re-walk (`placeSites` is
  already re-runnable; bodies walk to the new seats — nothing teleports). If a
  full re-walk on growth proves disruptive, reserving future width on the
  far side only is the acceptable fallback — report which shipped.
- Verify with `node tools/look.mjs yard,shacks --zoom 2` — even rhythm
  left to right.

### B7. Resources card over the rift (item 7)

The card anchors at `pit.x + P*4, groundY - P*3` (screen space,
`src/render/counter.js:72-73`) — nearly on top of the rift
(`rift.x ≈ pit.x + 5% pit width`, `rift.y = groundY - 90 - 18`). When the
camera is at the pit (card unclamped from the left edge), seat the card
**centered above the rift**: `x = riftCenter().x - wide/2` (clamped to
screen), `y = rift.y - card height - P*2`, both via the existing screen-space
transform. When the camera is over the yard (card pinned to `EDGE`), keep the
current behavior. Shot both camera positions.

### B8. Shack doorways to regulation size (item 8)

Shed doors are 2×3 cells; every other door in the game is `DOOR_W 4 ×
DOOR_H 4` (`src/config/crew.js:122-123`). In `drawShed`
(`src/render/sites.js:185-199`): door = `DOOR_W` wide × 4 courses tall,
centered, foot of the wall (fits: shed is 6P wide, 8P tall). This is a
"couple design passes" item: produce **two variants** (plain regulation
door; regulation door + P/2 lintel shadow under the eave), shoot both with
the `shacks` scene, ship the one that reads better at zoom 2, and put both
shots in the report so the user can overrule in the morning.

### Track B ownership

- **Owns:** `src/smog/**`, `src/render/smog.js`, `src/render/storm.js` (new),
  `src/render/sites.js`, `src/render/counter.js`, `src/config/sky.js`,
  `src/config/sites.js`, `src/world.js`, `src/weather.js`, `src/rift.js`,
  `tools/look.mjs` (new scenes), `test/sky-*.test.mjs`,
  `test/wave6-sky.test.mjs` (new).
- **Shared, additive/one-block only:** `src/state.js` (any new `S` field into
  its list, one block, `// wave6-sky`), `src/render.js` (only the one
  `drawStormPress` insertion after `'smog'`), `src/hooks.js` (a `__storm`
  force-break hook if needed), `src/dev.js` TUNABLE lines.
- **Do NOT touch:** `src/jobs.js`, `src/crew/**`, `src/works.js`,
  `src/roster.js`, `src/upgrades.js`, `src/upgrades/**`, `src/wizard.js`,
  `src/tower.js`, `src/farm.js`, `src/quarry.js`, `src/render/bars.js`,
  `src/render/tower.js`, `src/config/tower.js`, `src/config/crits.js`,
  `test/wave6-sim.test.mjs`.

---

## Both tracks

- Work only in your own worktree/branch. First command:
  `git fetch origin && git reset --hard origin/worktree-wave6-spec`.
- Dev server: root binary, own port —
  `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <5191 A / 5192 B> --strictPort`,
  confirm it serves your checkout
  (`curl -s localhost:<port>/src/<changed file> | grep <new symbol>`), distinct
  `CDP_PORT` (9231 A / 9232 B). **Never port 5183.** Tear the server down
  before reporting and verify the port is dead.
- Run tests **in the foreground**, targeted files only — never the full suite.
- At least one check per feature reaches it like a player (`__buy`, the
  boards, the pointer), not via `__` state hooks.
- American English; every number into config; comments say why; P = 6 grid.
- Commit to your branch when green and **push it**
  (`git push -u origin <branch>`).
- Report: deliverables one line each; files touched; pasted test output;
  shot filenames; judgment calls the doc did not make; anything you believe
  is wrong with this design that you implemented anyway.
