# Wave 3 — feedback3.md

**This document is canon. Subagents: do not redesign; implement.** Where a
number or a name is written here, use it. Where a judgment call is not written
here, make the smallest one and report it under "deviations".

What this wave optimizes, in order: **feel** (the yard should read as a place
where work happens), then **bugs that a player hits**, then **balance**. When
two items collide, the earlier in that list wins.

Base: `main` at `2d28fa7`. Every track branches from the commit that carries
this document.

---

## The 24 items, triaged

Numbers are the order in `feedback3.md`.

| # | item | verdict | track |
|---|---|---|---|
| 1 | hover label on every object (dust, house, sparks, food, bird, poop…) | build | **D** |
| 2 | bench workers climb up and jump about while working | build | **B** |
| 3 | only one worker on upgrades, not all spare hands | build | **B** |
| 4 | building a house takes time, not instant | build | **C** |
| 5 | drop the `s` on the seconds | build | **A** |
| 6 | remove the janitor submenu text | build | **A** |
| 7 | under-construction site: tape, barriers, dust while building | build | **C** |
| 8 | closet starts at 1 janitor; an upgrade takes it to 2 | build | **A** |
| 9 | refresh mid-upgrade gets stuck; workers do not resume | **bug** | **C** |
| 10 | worker speed too slow at the start | tune | **A** |
| 11 | farm upgrades affordable the moment the farm opens | tune | **A** |
| 12 | miner pickaxe scales too fast for the crew to keep up | tune | **A** |
| 13 | the lab should cost a core | build | **A** |
| 14 | workers carry dust from pit to station instead of it flying | **spike** | — |
| 15 | a carried core loses its energy waves | **bug** | **C** |
| 16 | lob the core high into the pit rather than dropping it | build | **B** |
| 17 | resource requirements on higher upgrades (10 houses → food, 15 → green/blue) | **spike** | — |
| 18 | quarry rows and blue-priced rows visible before the quarry exists | **bug** | **A** |
| 19 | place buildings dynamically in build order | build | **C** (last) |
| 20 | janitors blocked by idle workers, never reach the poop | **bug** | **B** |
| 21 | the whole house structure is the menu's target | build | **D** |
| 22 | a small building on the farm and the quarry to hold their boards | build | **C** |
| 23 | farm at full width from the start, plots empty until bought | build | **C** |

Two items are **spikes**: written up below, not built this wave. They change
the economy's shape and want a signed-off design first, the way the rift did.

---

## Ownership

Partitioned by **file**, not by theme. Each track has an *owns* list and a *do
not touch* list, and they are disjoint. A track may **call** another track's
existing exports freely; only the owner **edits** a file.

| track | owns (edit freely) | additive-only | do NOT touch |
|---|---|---|---|
| **A** economy & fixes | `src/config.js`, `src/upgrades.js`, `src/lab.js`, `src/quarry.js` (show-gates only), `src/farm.js` (show-gates only), `src/roster.js`, `src/kit.js` | `src/state.js`, `src/persist.js` | crew.js, render.js, works.js, world.js, board.js, input.js |
| **B** crew | `src/crew.js`, `src/core.js`, `src/dust.js` | `src/state.js`, `src/config.js` (new constants at the END of the file only) | render.js, upgrades.js, works.js, world.js, board.js, input.js |
| **C** buildings | `src/works.js`, `src/render.js`, `src/world.js`, `src/house.js`, `src/persist.js` (the works/order fields) | `src/state.js`, `src/config.js` (new constants at the END only) | crew.js, upgrades.js (except the one `house` row, see C1), board.js, input.js |
| **D** tooltips & menu target | `src/input.js`, `src/board.js`, `src/crewboard.js` | `src/config.js` (END only) | everything else |

`src/state.js` and `src/config.js` are shared and **additive-only** for
everyone: add fields or constants, never rename, move or delete one. Two tracks
adding constants at the end of config.js will conflict trivially at merge and
that is expected; I resolve it.

**Tests:** each track writes its own file and touches no other track's:
`test/wave3-economy.test.mjs` (A), `test/wave3-crew.test.mjs` (B),
`test/wave3-buildings.test.mjs` (C), `test/wave3-tooltips.test.mjs` (D).
Existing tests may be *edited* only where an item deliberately changes the
behavior they assert, and every such edit is listed in the report.

**A live warning.** Another agent is committing to `main` every few minutes,
mostly in `crew.js`, `smog.js`, `render.js` and `wizard.js`. Tracks B and C are
in the blast zone. Commit small and often; expect a merge.

---

## Track A — economy & fixes

*Intent:* the numbers a new player meets in the first half hour are wrong in
known ways, and four rows are simply misfiled. None of this needs new
machinery.

**A1 (#5).** In `priceText` (upgrades.js ~1262) the time price reads `12s`.
Make it `12`. Keep ` min` for minutes.

**A2 (#6).** The janitor's post on the house board carries a line of text under
it that the other posts do not. Find it (start at `roster.js` around the
janitor's post and `crewboard.js`'s label tables) and remove it; the post
should read as the plain two lines every other post has.

**A3 (#8).** `LOO_POSTS` becomes `1`. Add a row `loopost` — name **"a second
cap"** — on the outhouse's board (the board the closet already has), priced
**6 shards** (dust follows from `DUST_PER`), `show` once the closet is open and
there is one post, `buy` sets `S.looPosts = 2`. `kit.js`'s janitor stock reads
`S.looPosts ?? LOO_POSTS`. Save/restore/reset `looPosts` (persist.js, additive).
A save from before this field arrives with `2`, not `1`: nobody loses a cap
they had.

**A4 (#10).** Worker speed at the start. `HAUL_BASE` 1.4 → **1.8**,
`COMMUTE_PACE` 3.9 → **4.6**. Both are TUNABLE already; leave them so.

**A5 (#11).** The farm's first rows should not be affordable the moment the
farm opens. `PLOT_COST` 90 → **260**, and the `tend` row's first-rung cost ×3.
Report the resulting first three bills.

**A6 (#12).** The miner's pick out-scales the crew. The `minerpick` ladder
(`minerPickLevel`, the miners' bite) currently multiplies too steeply; cap the
per-rung gain so that **five rungs is ×2.2 total, not more**. Where the number
lives is yours to find (start at `minerBite` / `MINER_*` in config.js). Report
before/after bite at rungs 0, 3, 5.

**A7 (#13).** `unlocklab` is priced in dust alone. Every *place* costs cores
(DESIGN.md, Economy: "cores buy places, and only places"). Bill it
`[['core', 2], ['dust', LAB_DUST]]` through the same `site(...)` helper the
other places use.

**A8 (#18).** Gating. Rows priced in shards or spores, and any row about the
quarry, must not appear until that coin has been seen: audit every row's
`show` on every board (bench, lab, school, quarry, farm, tower, scrub) and add
`S.seenShard` / `S.seenSpore` / `S.quarryOpen` to the ones that lack it. The
reported case: open the lab before the quarry and the lab's quarry-speed row
and the shard-priced rows are on the board. Write the audit as a test that
walks every row on a fresh yard with the lab open and nothing else, and
asserts nothing shard-, spore- or quarry-related is shown.

**Verification:** `node --test test/wave3-economy.test.mjs`, then
`node --test test/bills.test.mjs test/boards.test.mjs test/lab.test.mjs test/kit.test.mjs test/farm.test.mjs test/machines.test.mjs`.
All green.

---

## Track B — crew

*Intent:* the yard should look like people doing things. Three of these are
about a body's *behavior*; one is a real bug.

**B1 (#3).** `BUILD_GANG` 3 → **1**. One body walks over and builds; the rest
stay on their jobs. Check `test/works.test.mjs` still passes — if it asserts a
gang of three, change the assertion and say so.

**B2 (#2).** A builder at the bench (any `site: 'bench'` work, and the yard's
`builders` at a `site: 'yard'` work) does not stand still. Give the builder a
**work jig**: while `handsAt(site) > 0` and the body is `at`, it climbs onto
the bench (its feet on the bench's top edge, `bench.y`) and hops in place on a
1.4 s beat, a cell high, with a lunge at the bottom of each hop — reuse the
dance's `hop` move machinery (`MOVES`, `jig`, `startMove`) rather than writing
a new animator. A body building a *building* out on the yard does the same
hop on the ground beside the site. It does no work while mid-air; the work
rate is unchanged.

**B3 (#16).** A body banking a core should **lob** it: at the lip, the core
leaves the body's hands on an arc that peaks about 90 world px above the lip
and lands in the pile at the same column `bankDust` would have used. Reuse the
`S.paid`-style flight object (see `fly()` in game.js) or the existing
core-drop physics in `core.js` — whichever is smaller. The core is banked
(counted) when it *lands*, not when it leaves the hand.

**B4 (#20).** Janitors are blocked by idle bodies and never reach the mess.
Reproduce it first: on a yard with several idle haulers standing between the
closet and a patch of poop, a janitor sent to the patch stalls. Then fix the
cause — most likely the idle elbow (`elbowIdle` / `ROAM_ELBOW`) shoving the
janitor back, or the roam's guard giving its step back. A janitor on an errand
has right of way: idle bodies step aside for it, not the reverse. Write the
repro as the test.

**Verification:** `node --test test/wave3-crew.test.mjs`, then
`node --test test/crew.test.mjs test/works.test.mjs test/dance.test.mjs test/janitor.test.mjs test/route.test.mjs test/stuck-yard.test.mjs`.
All green. Take one shot with `node tools/look.mjs crew` on a running dev
server (start it on a port nobody is using: `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <n> --strictPort`, `GAME=http://localhost:<n>/`) and attach the path.

---

## Track C — buildings

*Intent:* buildings should go up, not appear. The machinery (`works.js`) exists
and was landed this week; these items extend it and fix its one known bug.

**C1 (#4).** The `house` row (upgrades.js ~663) is the one purchase on the
bench that is still instant. Make it `kind: 'building', site: 'yard'` with
`at` = the settlement's next house position (ask `house.js`; add an export if
there is none), so a house goes up over `workFor` seconds with a builder at it
before the body appears. This is the one edit to `upgrades.js` this track
makes; A owns the rest of that file.

**C2 (#9) — the bug.** Reload while a work is in progress: the work is saved
(`S.works` in persist.js) but the *builders* are not re-dispatched, so the
site stalls for ever. On restore, after the crew is rebuilt, call the same
thing a build starting calls (`setStaff` → `rebalance(); syncWorkers()`), so
spare hands walk back out to every busy site. Test: start a build, `__reload`,
run 30 s, assert `progressAt(site)` advanced.

**C3 (#7).** A busy site is *visibly* a building site. While `busyAt(site)`:
two striped barrier posts (2 cells wide, 5 tall, alternating black/white
bands) either side of the site's footprint, a tape line between them at head
height (a dashed 1-cell line), and a puff of dust every 1.5 s from the
builder's position (reuse `puff.js`). Gone the frame the work lands.

**C4 (#15).** A body carrying a core (`w.hasCore`) draws the core without its
glow. `drawWorkers` draws the core over the body's head with `drawMark`; draw
`drawCoreGlow` at the same point first, the way `drawCore` does for one lying
on the ground.

**C5 (#22).** The farm and the quarry are the two stations with no building to
hold their board. Give each a **small shed** on its left edge: `FARM_SHED_W =
P*6`, `FARM_SHED_H = P*7`; same for the quarry. Seat them in `placeSites` as
part of the station's own footprint (the station's `w()` grows by the shed and
its gap — do not shrink the plots or the cut). Draw them in the house style
(black outline, white inside, a door). Their board anchor: the shed's rect, so
the board stands over the shed (D owns the hit-test; you only export the rect
as `farmShed()` / `quarryShed()`).

**C6 (#23).** The farm is laid out at `FARM_PLOTS_MAX` width from the first
frame. Unbought plots are drawn as bare fence posts with no furrow; bought
ones as today. `plotCount()` keeps meaning "bought"; add `plotSlots()` =
`FARM_PLOTS_MAX` for the layout. Nothing about which plots are *worked*
changes.

**C7 (#19) — last, and only if C1–C6 are green.** Buildings placed in the
order they are bought, not in a fixed order. `placeSites` walks `SITES` in a
fixed list; instead walk them in `S.buildOrder` (a saved list of site keys, in
purchase order), with unbought sites appended in the fixed order so the ground
they will need is still reserved. A save with no `buildOrder` gets the fixed
order, so nothing existing moves. **Do not start this until C1–C6 are
committed and green; if it is not clean by then, stop and report it as not
done rather than shipping a half.**

**Verification:** `node --test test/wave3-buildings.test.mjs`, then
`node --test test/works.test.mjs test/sites.test.mjs test/farm.test.mjs test/home.test.mjs test/pit.test.mjs test/golden.test.mjs`.
All green. Shots: `node tools/look.mjs farm,quarry,yard` on your own server;
attach the paths. C3 and C5 are *drawing* — look at them before you call them
done (a green suite cannot see a barrier).

---

## Track D — tooltips & menu target

*Intent:* the yard names nothing. A player should be able to hover anything
and be told what it is, in a word.

**D1 (#1).** A hover label on every object. `input.js` already has
`askedAbout` and `board.js` has `showTipAt` (the "pile is full" tip). Build a
**hover registry**: a function `whatIsAt(wx, wy)` in `input.js` returning a
short label or null, asked on mouse move (throttled to every 4th frame) and
shown with `showTipAt` for as long as the cursor stays; cleared on leave. The
labels, exactly, lowercase:

| thing | label | how to hit it |
|---|---|---|
| a grain on the ground or in the pit | `dust` | cell under the cursor is dust |
| a shard / spore / spark in a pile | `shard` / `spore` / `spark` | cell kind |
| a core | `core` | `coreItem` or a core cell |
| a body | its job: `miner`, `hauler`, `quarrier`, `farmhand`, `labber`, `scrubber`, `rifter`, `janitor`, `wizard`, `builder` | body rect |
| a house | `house` | `houseRect()` |
| every building | its name as the board calls it: `the bench`, `the quarry`, `the farm`, `the lab`, `the school`, `the scrubbing house`, `the tower`, `the casino`, `the closet`, `the rift` | its rect |
| the rock | `rock` | rock footprint |
| a machine | `the drill` / `the ram` / `the tiller` / `the belt` | `specOf(key).at()` rect |
| a bird | `bird` | `BIRDS` |
| poop / muck on the ground | `poop` / `muck` | muck cell |
| the pot on the table | `pot` | table rect |
| a balloon | `balloon` | craft rect |
| a food item / crop on a plot | `food` | plot with crop |

If a thing on this list has no cheap hit-test today, give it one; if a thing is
not on this list, it gets no label — do not invent more. No label while a
board is open over the same spot.

**D2 (#21).** The house board opens from the *house*, and today only a strip of
it is the target. Make the whole structure — `houseRect()`, all of it,
including the roof — the hit target for both hover and click. If `houseRect()`
is smaller than what is drawn, fix the rect rather than the drawing.

**Verification:** `node --test test/wave3-tooltips.test.mjs` — assert
`whatIsAt` on a placed grain, a body, a building, and empty sky. Then
`node --test test/boards.test.mjs`. Then the browser tier for the page
half: `GAME=http://localhost:<n>/ CDP_PORT=<m> node tools/headless.mjs` —
the count must not drop below what `main` gives (378/380 at the base commit;
the two failures there are the other agent's and are not yours).

---

## Spikes — written, not built

### #14 — dust carried to the station, not flown

*What is asked:* when you buy a rung, the dust that pays for it leaves the pile
and arcs across the yard to the bench. Instead, haulers should carry it.

*What it costs:* a purchase becomes a *delivery*. The row is pressed, the dust
is reserved (counter drops, pile does not), haulers walk loads from the pit to
the site, and the work starts when the last load lands. That is `works.js`'s
model exactly — time is a price — extended to *materials*. It makes every
purchase slower by a walk, which is the point and also the risk: an early game
with three haulers would spend half its time ferrying dust to the bench for
eight-dust rungs.

*Shape if built:* a reservation (`S.owed[site]`) that haulers treat as a claim
like a column of dust; the pile's `spend` becomes "lift a load into a body's
hands" rather than "lift a load into the air"; `works.start` waits on
`owed === 0`. Rungs under some floor (say 50 dust) stay flown, so the early
game keeps its pace and the delivery is a late-game texture.

*Decision needed:* whether it applies to everything or only to buildings and
machines. **Recommend buildings and machines only** — that is where the
delivery reads as building something, and rungs keep the snap they have.

### #17 — later rungs cost the other grounds

*What is asked:* the farm feels pointless because opening it unlocks a ladder
for bodies you already have. Instead: past a threshold, ladders start asking
for the farm's and the quarry's coins — after 10 houses rungs cost food, after
15 they cost green and blue.

*What it does:* it turns the stations into *suppliers* for the rest of the
yard rather than islands each with its own ladder. Today the only cross-coin
pricing is `pick` (shard + dust) and the machines. This generalizes that:
`billOf` already adds dust to every row from `DUST_PER`; the mirror is a
`TIER_COIN` table — `{ 10: 'spore', 15: 'shard' }` keyed on `S.crew` — that
adds a second coin to every *rung* once the crew is that big, at
`rungCost / DUST_PER[coin]` of it. One table, no per-row edits, and the school
and the farm become things you *need* rather than things you visit.

*Risk:* a yard that has not opened the farm at 10 houses is stuck on every
rung until it does. That is the intended pressure, but the row has to *say*
why it is unaffordable (the coin's mark, greyed) rather than just going dark.

*Decision needed:* the thresholds, and whether "food" is a new coin or the
spore. **Recommend spore is food** — a fifth coin is a fifth mark, a fifth
pile and a fifth ledger, for a distinction the player never needs to make.

Both spikes go into DESIGN.md as "(design, not built)" sections on sign-off,
the way the shields and the balloon did.

---

# Wave 3.1 — feedback4.md

**This section is canon. Implement; do not redesign.** Five follow-ups on the
wave above, all in the buildings/works area. One agent, one track, one branch
(`wave3b`), based on `main` at `ff8b408` (wave 3 landed).

Owns: `src/render.js`, `src/works.js`, `src/world.js`, `src/board.js`,
`src/input.js`, `src/crew.js` (the builder's stages only), `src/persist.js`
(buildOrder only). Additive-only: `src/state.js`, `src/config.js` (end of file).
Test file: `test/wave31-buildings.test.mjs`. Existing tests may be edited only
where an item deliberately changes what they assert — list each edit.

| # | item | what to do |
|---|---|---|
| 1 | the shacks by the quarry and the farm should be the station's **main target**, not the station itself | D split `standAt` (where you stand to open a board) from `boardAt` (where the sheet stands). Make the shed the *whole* answer for those two stations: hover target, click target, the place a body walks to open it, and the anchor. `standRect('farm')`/`standRect('quarry')` return the shed. Two browser checks used `standRect('quarry')` to find the mouth — update them to ask for the mouth by name, not through `standRect`. (The item says "quarry/lab"; the lab already has its own building and its own door, so read it as the two sheds.) |
| 2 | bench timed upgrades should **not** get the construction ornament | C3 draws barriers for every `busyAt(site)`. Restrict `drawBuildSites` to works whose row `kind` is `'building'` or `'machine'` — a rung being worked at the bench (`site: 'bench'`, `kind: 'rung'`) shows no posts, no tape, no puff. |
| 3 | a building under construction **rises out of the ground** as it is built; when it lands, a puff and a screen shake | While `busyAt(site)` for a `kind: 'building'` work, draw the building clipped to `progressAt(site)` of its height, rising from the ground line (`ctx.save(); ctx.beginPath(); ctx.rect(x, groundY - h * p, w, h * p); ctx.clip();` around the building's own draw). Nothing is drawn above the clip. The frame the work lands: one `puff.js` puff at the building's middle-top and a shake — reuse `S.shake`/`shake()` in hooks.js/world.js at half the rock-fall strength (find the constant the rock uses and halve it; add `BUILD_SHAKE` at the end of config.js). Buildings that are already standing are unaffected. |
| 4 | workers **still** need an animation while a building is constructed | B2 added the builder's hop and claims it runs at yard sites too. The user sees none. Reproduce first: buy a building on a fresh yard, film the builder for 10 s at 1/60, and assert its `y` varies (see `test/dance.test.mjs` for filming). If it does not hop, find why (`stepBuilder`'s `at` gating, `handsAt` at yard sites, the jig being reset by the walk) and fix it. If it does hop but is invisible, the hop is too small — raise `BUILD_HOP_H` to 2 cells and make the lunge visible. Take a shot and read it. |
| 5 | buildings are **not** in the order they are purchased | C7 reorders only sites in `S.buildOrder`, which is filled as works *land*, and a save from before has none. Reproduce: fresh yard, buy the farm then the quarry, then a second fresh yard, quarry then farm — assert the x-order follows purchase order in both. Then load `test/fixtures/stuck-yard.json` and assert its layout is unchanged. If purchase order is not honored on a fresh yard, the bug is real — likely the order being recorded on *landing* rather than on *purchase*, so two builds started close together land in the fixed order; record it at purchase (`works.start`). |

Verification: `node --test test/wave31-buildings.test.mjs`, then
`node --test test/wave3-buildings.test.mjs test/wave3-tooltips.test.mjs test/works.test.mjs test/sites.test.mjs test/boards.test.mjs test/farm.test.mjs`,
then the browser tier (base on `ff8b408`: 379/381; the two failures are the
other agent's). Shots for #3 and #4 with `tools/look.mjs`, read before done.

### 3.1 amendment — item 6: a body sent to build drops to the ground line

Reported: "when a miner goes to work on the bench, he teleports to ground level
first." Real, and it is the yard's oldest rule broken — nobody teleports.

Where it is: `stepBuilder`'s walking branch (crew.js) does `w.y = stand(w)` on
every frame of the walk. `stand` is `climbTo(w, surfaceUnder(w))`, and a miner
that has just been retasked off the hill no longer reads as being *on* the
hill, so `surfaceUnder` answers with the yard's ground line — a drop of the
whole height of the rock. `climbTo` has a wall rule facing **up** (a rise
steeper than a walk is climbed, the step given back) and, deliberately, none
facing **down**; its ease moves a share of the remaining distance each frame,
so a hundred-pixel drop is mostly gone in one frame. That reads as a teleport
because it is one.

Fix it the way the yard fixes every other "get from here to there": a body
sent to build **routes** off the hill and walks, rather than having the ground
under it reassigned. `downTheHole`/`keepTo`+`stepRoute` are the pattern; a
builder is no more special than a hauler crossing the pit. Do NOT fix it by
adding a downward wall rule to `climbTo` — the comment there records that being
tried and failing seven checks, because walks legitimately stride down ramps
and lips all over the yard.

Reproduce first, filmed a frame at a time: put a miner on a tall rock, buy
something that needs a builder, and assert the body's `y` never moves more than
a cell in one frame between the rock and the bench. That assertion is the test.

### 3.1 amendment — item 7: the house's building site is the reserved plot, not the block

Reported: "the construction for the house is way too wide at the start of the
game. the construction should hug the width of the existing buildings."

Where it is: `siteFoot('yard')` in render.js looks the work's row up in
`YARD_ROW_SITE` and returns `S.placed[key]` — the ground **reserved** by
`placeSites` for that site at its full grown size. For every other yard row
that is right: a lab is a lab-sized building the day it goes up. The house is
not. The settlement is a stack of cubes that grows a room at a time
(`cubes()`/`houseRect()` in crewboard.js), so at the start of a game the block
is one or two rooms wide against a plot reserved for a whole street — and the
barriers stand out at the edges of ground nothing is standing on.

Fix: for the `house` row specifically, `siteFoot` returns the block's own rect
(`houseRect()`), widened by the one room about to be added rather than by the
whole reserved plot. The other yard rows keep the reserved footprint. The rule
to write in the comment: **the tape goes round what is being built, not round
the ground it was promised.**

Check it at both ends: a fresh yard with two rooms (the barrier hugs the block,
a couple of cells clear either side) and a settlement of a dozen (it still
hugs, and does not sit inside the block). A shot of each; a suite cannot see
this.
