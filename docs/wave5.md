# Wave 5 — the scalability refactor, then feedback5.md

**This document is canon. Subagents: do not redesign; implement.** Where a
number or a name is written here, use it. Where a judgment call is not written
here, make the smallest one and report it under "deviations".

What this wave optimizes, in order: **the shared surface shrinks** (a feature
becomes its own files plus registry entries, not seven edits to seven big
files), then **feel** (feedback5's polish items), then **balance**. When two
items collide, the earlier in that list wins.

The wave runs as **two batches, sequential**. Batch 1 is the refactor; it
merges to main first. Batch 2 is feedback5, and every Batch 2 track branches
from the merged, refactored main — the feedback items are built through the new
seams on purpose, as the proof they work.

Base: `main` at the commit that carries this document. Every Batch 1 track
branches from it.

---

## Why (the diagnosis, so nobody re-derives it)

Churn over the last three months concentrates in the files every feature must
edit: `render.js` (181 commits), `config.js` (178), `crew.js` (135),
`selftest.js` (122), `main.js` (93), `upgrades.js` (83), `state.js`/`persist.js`
(79 each). A new station is seven edits across them. The architecture's core
bargain — config owns numbers, state owns facts, one file per behavior — is
sound and is not up for debate; the fix is registries and barrels so the shared
files stop being where features live.

---

# Batch 1 — the refactor

Four tracks, disjoint. **Every track is behavior-preserving**: no number
changes, no drawing changes, no new features. The check for any track is
"shots identical by eye, targeted tests green, `node tools/unresolved.mjs`
clean".

## Track R1 — barrels: config, smog, upgrades

**Owns:** `src/config.js`, `src/config/` (new), `src/smog.js`, `src/smog/`
(new), `src/upgrades.js`, `src/upgrades/` (new).
**Do NOT touch:** render.js, crew.js, game.js, main.js, persist.js, state.js.

1. `config.js` becomes a barrel: constants move to `src/config/<feature>.js`
   files grouped by the feature they tune (crew, sites, sky, apothecary, pit,
   shop, ...; the track picks the grouping and lists it in its report).
   `config.js` re-exports everything, so **no import elsewhere changes**.
   `TUNABLE` and every `export let` binding stay live — a dev-panel slider must
   still change the game in the same frame; verify one slider by hand in the
   report. Tunables stay `export let` in their new homes and the barrel
   re-exports the *binding* (use `export { x } from ...`, never copy into a
   `const`).
2. `smog.js` splits along its own section comments into `src/smog/vents.js`
   (what goes up), `draught.js`, `sky.js` (how the sky is arranged, motes),
   `house.js` (the scrubbing house), `craft.js` (what the craft take),
   `rain.js`. `smog.js` is the barrel; exported names unchanged.
3. `upgrades.js`: the `UPGRADES` row objects move to `src/upgrades/rows-<section>.js`
   data files feeding the one exported list, in the same order. The economy
   logic (`rebalance`, `restaff`, `assign`, `hire`, `buy`, `take`) stays in
   `upgrades.js`. Exported API unchanged.

**Tests:** no new behavior, so no new test file. Run
`node --test test/apothecary.test.mjs` and one smog/sky-covering file, plus
`node tools/unresolved.mjs`. Shots: `yard,quarry,scrubbing` before and after.

## Track R2 — persist that cannot fail silently

**Owns:** `src/persist.js`, `src/state.js`, `test/persist-roundtrip.test.mjs`
(new).
**Do NOT touch:** everything else.

1. `state.js` gains `SAVED`: the list of `S` field names that survive a reload,
   declared next to the facts it already owns (still no logic — it is a list).
   Fields needing hand-written encode/decode (the grids, the pit, the rift
   holdings, rng) are named in a second list, `SAVED_BY_HAND`, and keep their
   code in `persist.js`. Every field currently written by `persist()` lands in
   exactly one list; the plain-copy ones are then written/read by one loop.
   Keep the existing comments — move each to the field's line in `SAVED`.
2. New check, `test/persist-roundtrip.test.mjs`: build a yard, mutate every
   `SAVED` field to a sentinel, save, restore into a fresh yard, diff. Also
   assert every enumerable field on `S` is in `SAVED`, `SAVED_BY_HAND`, or a
   third explicit `EPHEMERAL` list — so a *new* field that is in none of them
   is a red test, not a silent player-data loss.
3. Existing fixtures (`test/fixtures/*.json`, `test/stuck-yard.test.mjs`) must
   still load — the save format on disk does not change.

**Tests:** `node --test test/persist-roundtrip.test.mjs test/stuck-yard.test.mjs`.

## Track R3 — painting order becomes data

**Owns:** `src/render.js`, `src/render/` (every file in it).
**Do NOT touch:** everything else.

1. Finish the split already started: every draw body remaining in `render.js`
   moves to a file in `src/render/`, joining the sixteen there.
2. `render.js` becomes the ordered layer list plus the loop: an array of
   `{ name, draw, when? }` entries, in today's exact painting order, each
   `draw` imported from `src/render/`. The order must read top-to-bottom as
   the painting order — that order is the whole trick, and this makes it
   reviewable instead of buried in a call sequence. Existing conditionals
   around draw calls become the entry's `when`.
3. No pixel changes. Prove it with before/after shots of
   `yard,crew,endgame,scrubbing,rift,boards` compared by eye, and say so in the
   report.

**Tests:** the browser canvas group only:
`node tools/headless.mjs --only view` (plus whatever group covers canvas), not
the node tier — nothing about the yard changed.

## Track R4 — the job registry and the step list

**Owns:** `src/crew.js`, `src/crew/` (every file in it), `src/game.js`,
`src/main.js`.
**Do NOT touch:** render.js, upgrades.js (call its exports freely).

1. `src/crew/jobs.js` (new): a `JOBS` registry,
   `{ type: { factory, step, want } }`, one entry per worker type. `syncWorkers`'
   `want` map, the `FACTORY` switch, and the per-type step branches derive from
   it. Adding a job becomes one file in `src/crew/` plus one registry line.
   (Draw shapes stay where render owns them — the registry does not reach into
   painting.)
2. `crew.js` splits along its section comments into `src/crew/` files
   (builders, the hole, the commute, idle and strolling, shoveling, hats and
   falls, the per-frame body step). `crew.js` is the barrel; exported names
   unchanged. `dance.js`, `kitwalk.js`, `pointer.js`, `records.js`,
   `tenders.js` already there are left as they are.
3. The per-frame sim order in `game.js` becomes an ordered `STEPS` list of
   `{ name, step }`, same shape as R3's layers, in today's exact order.
   `main.js` keeps its three-beat frame untouched.
4. Behavior-preserving: `node tools/node/break-perf.mjs` quiet, twice, before
   and after, minimum compared — paste both numbers in the report.

**Tests:** `node --test test/stuck-yard.test.mjs` plus the one or two crew
files. Shots: `crew,yard`.

## Batch 1 ownership summary

| track | owns | do NOT touch |
|---|---|---|
| R1 | config.js + config/, smog.js + smog/, upgrades.js + upgrades/ | everything else |
| R2 | persist.js, state.js, test/persist-roundtrip.test.mjs | everything else |
| R3 | render.js, render/* | everything else |
| R4 | crew.js, crew/*, game.js, main.js | everything else |

No shared files in Batch 1 at all — that is the point. A track needing a change
outside its list reports the need; it does not make the edit.

---

# Batch 2 — feedback5.md, built on the new seams

Branches from main after Batch 1 merges. Four tracks.

## The 21 items, triaged

Numbers are the order in `feedback5.md`.

| # | item | verdict | track |
|---|---|---|---|
| 1 | shacks read meager; personalize each to its station | build (decided: personalize) | **F2** |
| 2 | no `S` for seconds anywhere — use the clock icon | build | **F3** |
| 3 | clock icon gets two hands | build | **F3** |
| 4 | rung pips bigger / darker | build | **F3** |
| 5 | outhouse upgrade moves into a new janitor-closet shop menu | build | **F3** |
| 6 | worker potion buff looks odd while walking (direction/speed dependent) | **bug** | **F4** |
| 7 | a second apothecary pot is rendered and brews simultaneously | build | **F1** |
| 8 | remove the station crates | build | **F2** |
| 9 | stations get padding between them | build | **F2** |
| 10 | the sun station moves next to the wizard tower | build | **F2** |
| 11 | upgrade: apo workers carry 2/3/4 potions | build | **F1** |
| 12 | only the carry tonic applies to haulers; the other tonics do not | build | **F1** |
| 13 | per-potion inventory; bookshelf with a shelf per tonic, count badges | build | **F1** |
| 14 | per-potion upgrades | build (decided: **hybrid** — potency per-potion; carry and brew-speed stay global) | **F1** |
| 15 | remove the black hole upgrades from the tower — it is not a bought thing | build | **F4** |
| 16 | a stats menu: each resource's per-second rate | build | **F3** |
| 17 | apothecary main building holds the upgrades; each pot chooses its brew | build | **F1** |
| 18 | brew animation differs per potion (colors); order: hut, shelves, pots | build | **F1** |
| 19 | crit effect amplified — extra particles, shockwave, stacked | build | **F4** |
| 20 | black hole inhales faster, catches everything thrown in, looks awesome | build | **F4** |
| 21 | dance celebration: just jump up and down, faster | build | **F4** |

## Track F1 — the apothecary rework (items 7, 11, 12, 13, 14, 17, 18)

**Owns:** `src/apothecary.js`, `src/render/apothecary.js`,
`src/config/apothecary.js`, `src/upgrades/rows-apothecary.js`,
`test/wave5-apothecary.test.mjs` (new).
**Additive-only:** `state.js` (new fields + `SAVED` lines), render layer list
(its own entries), `selftest/` anchors.
**Do NOT touch:** other tracks' files; crew.js internals (call exports).

The shape, decided:

1. **The station becomes hut → shelves → pots, left to right** (item 18's
   order). The hut is the main building: it holds the upgrade rows and the
   board target. Pots stand to its right; the bookshelf between them.
2. **Pots are individual** (items 7, 17): buying `another pot` stands a second
   drawn pot. Each pot has its own brew setting — clicking a pot cycles (or
   opens the existing tonic picker for) *that* pot's tonic. Two pots brew two
   tonics simultaneously; the existing "tonics stack, one of each kind" rule
   already on main is the cap on what can be up at once.
3. **Inventory is per tonic** (item 13): brewed doses go to the shelf for
   their tonic; switching a pot's brew does not discard stock. The shelf is
   drawn as a bookshelf, one shelf per tonic, with a number badge per shelf.
   New `S` fields for per-tonic stock, in `SAVED`, migrating the old single
   count into the currently-brewing tonic's shelf on load.
4. **Hybrid ladders** (item 14): potency rungs become per-tonic rows (one
   ladder each); carry and brew-speed stay single global ladders. Priced by
   the existing rung curve; the per-tonic rows live in the hut's section.
5. **Carry 2/3/4** (item 11): a three-rung global ladder on the stirrer's
   dose-carrying, using the existing carry mechanics.
6. **Haulers take only the carry tonic** (item 12): the other tonics' buffs
   skip bodies whose job is hauling; the carry tonic applies. Say it in the
   rows' hover text.
7. **Brew animation per tonic** (item 18): the plume/flame already runs a
   color per tonic on main — extend so each pot's animation reads as its own
   tonic while brewing.

**Player-path checks** (the rule stands: at least one check per feature reaches
it through `__buy`/the pointer, not a `__` hook): buy the second pot, set two
different tonics, run until both shelves hold stock, switch a pot's tonic and
assert the shelf keeps its backlog; buy a per-tonic potency rung and assert only
that tonic's effect moved; assert a hauler under a non-carry tonic shows no buff.

## Track F2 — the yard's furniture (items 1, 8, 9, 10)

**Owns:** `src/world.js`, `src/render/sites.js`, `src/render/stations.js`,
`src/house.js` (shack drawing), `test/wave5-yard.test.mjs` (new).
**Additive-only:** `src/config/sites.js` (spacing constants), layer list.
**Do NOT touch:** apothecary files (F1 owns that station's look).

1. **Station padding** (item 9): one derived spacing rule in `world.js`'s
   `layout` — a `STATION_GAP` constant in config applied between every pair of
   neighboring sites. One number, not per-site nudges (fix the system, not the
   instance). Everything sits on the `P = 6` grid.
2. **Sun next to the tower** (item 10): the sun station's layout slot moves
   adjacent to the wizard tower, on the tower's far side. Walking distances
   change; nothing teleports — bodies already en route just walk further.
3. **Crates go** (item 8): remove the station crates
   (`CRATE_H`/`CRATED` and their drawing). Grep-survey-then-delete; anything
   that referenced crate height for placement derives from the station box
   instead.
4. **Shacks personalized** (item 1): each station's shack gets one
   station-flavored detail and a touch more presence — quarry: a timber beam
   over the door; farm: a trough; lab: a small flue; scrub house: a vent;
   apothecary: leave to F1's hut. Flat black-and-white shapes on the P grid, no
   textures. Iterate by shot; put a `shacks` scene in `tools/look.mjs` if none
   fits.

## Track F3 — boards, icons, and the stats menu (items 2, 3, 4, 5, 16)

**Owns:** `src/board.js`, `src/shop.js`, `src/sprites.js` (the clock icon),
`src/style.css`, `src/upgrades/rows-janitor.js` (new),
`src/stats.js` (new), `src/render/counter.js`,
`test/wave5-boards.test.mjs` (new).
**Additive-only:** `src/config/boards.js`, layer list, `selftest/boards.js`
anchors.

1. **Clock icon everywhere `s`/`S` marks seconds** (item 2): every board row,
   hover and counter that prints a literal seconds suffix uses the clock glyph
   instead. Grep for the formatting helpers, fix the helper, not the call
   sites.
2. **Two hands on the clock** (item 3): redraw the icon sprite with an hour and
   a minute hand. Shot the board to check it reads at size.
3. **Rung pips** (item 4): bigger and darker — one constant each in config, not
   per-board tweaks.
4. **Janitor closet menu** (item 5): a new shop section `closet` holding the
   outhouse upgrade row (and the janitor rows that already exist, if they live
   loose); the row moves, its cost and effect unchanged. Board builds itself
   from the list, so this is a section key plus row moves.
5. **Stats menu** (item 16): a new board listing each currency's per-second
   rate, measured, not predicted: a rolling window (30 game-seconds) over
   actual gains, one row per currency with its mark. `src/stats.js` owns the
   measuring (a step-list entry) and the board row data; drawn like the other
   boards. Rates update live while the board is open.

## Track F4 — effects and the black hole (items 6, 15, 19, 20, 21)

**Owns:** `src/pit.js` (the rift's pull and look), `src/tower.js` (removing
the black-hole rows' plumbing), `src/upgrades/rows-tower.js` (removing the
rows), `src/render/effects.js`, `src/render/cores.js` (`drawRift`),
`src/crew/dance.js`, the buff-mark drawing in `src/render/crew.js`,
`test/wave5-effects.test.mjs` (new).
**Additive-only:** `src/config/effects.js`, layer list.
**Do NOT touch:** apothecary brewing (F1); the buff *drawing on the body* is
F4's, the buff *economy* is F1's.

1. **Buff mark stable while walking** (item 6): the mark's cells must not
   depend on facing or speed — anchor the mark to the body's box, not to a
   stride-phase or velocity-derived offset. Verify by shot at both walk
   directions and at idle.
2. **Black hole upgrades removed** (item 15): the tower's black-hole rungs go;
   refund nothing (the rows simply vanish); any level already bought collapses
   into the new always-on behavior. `persist` keeps reading old saves that
   carry the field.
3. **Black hole inhales** (item 20): pull rate raised so everything thrown
   into the pit is caught — nothing settles on the pit floor while the rift is
   open. Numbers in `src/config/effects.js`, found with the dev panel, listed
   in the report. And it should *look* like a black hole: a darker core,
   pulled streaks along the infall, a slow lensing wobble — flat
   black-and-white shapes only, iterate by `rift` shots.
4. **Crits amplified** (item 19): stack the existing crit effect with extra
   particles and one expanding shockwave ring; scale with the crit's size.
   Still readable at a glance, still black-and-white.
5. **Dance jumps** (item 21): the celebration becomes straight vertical jumps
   at a lively rate (no arc, no shuffle), tuned by shot.

## Batch 2 shared-file rules

`state.js` (+ its `SAVED` list), the layer list in `render.js`, the `STEPS`
list in `game.js`, `selftest.js` group order and `tools/look.mjs` `SCENES` are
shared and **additive-only**: one block or one line per track, under a comment
naming the track, at the anchor the file's shape implies. Conflicts there are
expected and cheap; I resolve them. Each track adds constants only in its own
`src/config/<track>.js` file — that is what Batch 1 bought us.

---

## Harness facts (both batches; each cost a launch cycle once)

- Launch each track with `Agent({ isolation: "worktree", ... })`. Each agent's
  **first** command: `git fetch origin && git reset --hard origin/<spec-branch>`
  (Batch 2: the post-merge main) so it builds from canon, not the harness base.
- A worktree has no `node_modules`: start vite as
  `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <assigned> --strictPort`,
  confirm it serves *your* checkout
  (`curl -s localhost:<port>/src/<your file> | grep <your symbol>`), use a
  distinct `CDP_PORT`. Assigned ports: R1/F1 5191, R2/F2 5192, R3/F3 5193,
  R4/F4 5194. **Never 5183.**
- Run tests in the **foreground**. Backgrounding a test run ends your turn.
- Tear down your server before reporting; verify the port is dead.
- Push to your named branch (`wave5-r1`…`wave5-f4`); the merge happens from
  there.
- Report shape: deliverables one line each; files touched; the **pasted
  output** of every verification run; shots taken (paths); what you decided
  that this document did not; anything you believe is wrong with the design
  you implemented anyway.

## Merge and close (mine, not a track's)

Batch 1: merge R2, R1, R3, R4 in that order; re-shot `yard,crew,endgame,
scrubbing,rift,boards` against pre-wave shots; kick off both full tiers on
main once, in the background. Batch 2: merge F2, F1, F3, F4; wire any seam
left open; full tiers on main once; then Phase-6 it like a player — open the
boards, brew two tonics, throw a pile into the rift, crit, dance. Punch list
fixed inline on main. Close by updating ARCHITECTURE.md (the registry seams),
DESIGN.md (apothecary rework section moves to `(built)`; hybrid ladders
reasoning), TODO.md, and memory.
