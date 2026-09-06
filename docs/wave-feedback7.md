# Wave 7 — feedback7.md

This document is canon. Subagents: do not redesign; implement. Where a number
or a name is written here, use it. A track that finds an item impossible says
so in its report rather than inventing a different feature.

Source: `feedback7.md` (repo root). Items 16 and 27 are design-only this wave —
they land in DESIGN.md as `(design, not built)` sections, written by the
orchestrator, not by any track. Item 10's description text was already updated
by the user; the track finishes the rename sweep.

## Triage

| # | item | track |
|---|---|---|
| 1 | motes band vertically, pop into view | A sky |
| 5 | worker rises into the air mid-cutscene | A sky |
| 13 | pit workers spread too evenly | A sky |
| 14 | buried square tosses cores | A sky |
| 2,3 | shop menus shift on submenu/hover | B ui |
| 4 | replace diamond notifier with building aura | B ui (aura) + seam (diamond removal, orchestrator) |
| 7 | clock icon looks bad | B ui |
| 8 | descriptions hard to read | B ui |
| 15 | construction bar overlaps sprite | B ui |
| 19 | pickaxe rungs: integers, fewer, dearer | B ui |
| 20 | crit power "4 → 4" | B ui |
| 26 | under-staffed station indicator | B ui |
| 6 | workers grossed out by poop | C crew |
| 9 | poop tooltip hidden on the rock | C crew |
| 10 | outhouse → janitor's closet | C crew |
| 11 | 1-cell gap counter vs specialist sprites | C crew |
| 12 | janitor row: no default-worker sprite | C crew |
| 17 | worker tooltip: name, age, job only | C crew |
| 18 | hover pauses a worker, "?" overhead | C crew |
| 21 | hauler-only speed brew | D brew |
| 22 | brews filter to applicable targets | D brew |
| 23 | label under a pot with a brew selected | D brew |
| 24 | shard brews hidden until quarry unlocked | D brew |
| 25 | sparks/wizard potion | D brew |
| 16 | drag-drop worker assignment | design only |
| 27 | construction station | design only |

## Ownership

One owner per file. A track may call another track's existing exports; only the
owner edits the file. `config.js`, `state.js` (the three lists), `render.js`
(`LAYERS`), `selftest.js`, `game.js` (`STAGES`), `main.js` are **additive-only
for everyone**: append your lines in one block under a comment naming your
track, at the stated anchor, and never reorder.

| track | owns | do NOT touch |
|---|---|---|
| A sky | `src/smog/vents.js`, `src/smog/sky.js`, `src/smog/band.js`, `src/smog/layer.js`, `src/render/smog.js`, `src/intro.js`, `src/crew/dance.js`, `src/crew/body.js`, `src/core.js`, `src/render/cores.js`, `src/config/sky.js`, `src/config/intro.js`, `test/wave7-sky.test.mjs` | everything of B, C, D; `src/crew/step.js`; `src/input.js` |
| B ui | `src/board.js`, `src/shop.js`, `src/style.css`, `src/upgrades.js`, `src/upgrades/rows-rock.js`, `src/upgrades/rows-luck.js`, `src/crit.js`, `src/config/crits.js`, `src/config/rocks.js`, `src/render/bars.js`, `src/render/pilemarks.js`, new `src/render/aura.js`, `test/wave7-ui.test.mjs` | `src/render/crew.js` (diamond removal is the orchestrator's, post-merge); `src/input.js`; `src/roster.js` |
| C crew | `src/crew/step.js`, `src/crew/pointer.js`, `src/crew/nature.js`, `src/render/crew.js`, `src/roster.js`, `src/crewboard.js`, `src/input.js`, `src/kit.js`, `src/outhouse.js`, `src/upgrades/rows-outhouse.js`, `src/config/crew.js`, `test/wave7-crew.test.mjs` | `src/intro.js`, `src/crew/dance.js`, `src/crew/body.js` (track A); `src/board.js`, `src/shop.js`, `src/style.css` (track B) |
| D brew | `src/apothecary.js`, `src/config/apothecary.js`, `src/render/apothecary.js`, `src/potpick.js`, `test/wave7-brew.test.mjs` | everything else except additive-only anchors |

New constants go in your own `src/config/<feature>.js` file (the barrel
`config.js` re-exports it already). New `S` fields go in exactly one of
`SAVED` / `SAVED_BY_HAND` / `EPHEMERAL` — `test/persist-roundtrip.test.mjs` is
red otherwise. New LAYERS entries: append at the depth stated per item, one
line, commented with `// wave7-<track>`.

---

## Track A — sky, intro, pit

**A1 (item 1) — motes fade in, and the plume stops reading as a vertical band.**
- In `skyMote()` (`src/smog/vents.js`) birth `fade: 0`, not `1`; step `fade`
  up by `secs / (PUFF_FADE / 1000)` in `stepPuffs` exactly the way `place()`
  in `sky.js` already does, clamped at 1. Every mote everywhere fades in;
  nothing pops.
- Widen the climb, not the sky: raise birth scatter from `* P * 3` to
  `* P * 8`, and give each puff a per-mote lateral wander — add
  `PUFF_WANDER = 14` (px/s amplitude, `src/config/sky.js`, tunable) and apply
  `p.x += Math.sin(p.seed + t * 0.7) * PUFF_WANDER * dt` (seed per mote at
  birth) on top of the existing lean. Verify with
  `node tools/look.mjs rift --zoom 4` (or the scene that shows machine smoke):
  the plume should read as a cone that dissolves, not a column.

**A2 (item 5) — nobody rises during the first-rock cutscene.**
- Root cause: `meet()` latches `w.foot` from `w.y` and `jig()` moves `w.y`
  off it; a body latched mid-walk (or under the cutscene camera move) floats.
- Fix: during the reunion (`S.boulderNo === 1` meet/part window), workers do
  not `jig()`; they `duck()` clear of the meeting zone exactly as they duck a
  falling rock — reuse `duck(w, zone)` in `src/crew/body.js` with the zone
  centered on the buried square's `buriedAt()`. Only the reunion pair walks;
  everyone else steps aside and stands. Keep the dance for ordinary
  celebrations. Guard `jig()` so a body with `w.walking` never latches
  `w.foot` (that guard is correct always, not just in the intro).

**A3 (item 13) — pit spacing gets variance.**
- In `nearestMuck()` (`src/smog/layer.js`), keep the one-body-one-patch
  reservation but break the regularity: give each claim a per-worker jitter —
  scan from `colAt(wx) + jitter` where `jitter` is a stable per-body offset in
  `[-MUCK_ELBOW, +MUCK_ELBOW]` (derive from a hash of the worker's id/name,
  not `rand()` per frame), and vary the reserved stride per claim between
  `MUCK_ELBOW - 1` and `MUCK_ELBOW + 2` from the same hash. No teleporting, no
  broken reservations: `test/wave7-sky.test.mjs` asserts two bodies never hold
  the same column.

**A4 (item 14) — the buried square tosses cores.**
- Once cores exist (`S.cores > 0` or a core has ever been banked — use
  `S.coreBuried === false && S.boulderNo > 1` plus `S.coreItem` present), the
  buried square in `src/intro.js` reacts to a core resting near `buriedAt()`:
  when `S.coreItem` comes to rest within `P * 12` of the square, the square
  walks to it (it is a position — animate `S.buried.x` toward the core at
  `DUCK_PACE`; it never pops), picks it up (clear `S.coreItem`, brief hold,
  say-mark), and tosses it toward `coreHome()` using `aim()` from `src/dust.js`
  the way `dropCore()` does. Must not fight `core.js:129`'s re-launch or a
  full pit (`bankCore` returning false → the core just lands, square gives
  up). Small, watchable, cause-and-effect.

## Track B — shop and boards UI

**B1 (items 2, 3) — the board stops shifting.**
- Give `.panel .sheet` a `min-width: 34ch` in `src/style.css` so row-note
  churn stops resizing the sheet.
- In `board.js`, `place()` must seat the panel off the **main board's** width
  only: measure the board element excluding the crew flyout, so opening a
  submenu never moves the board. The flyout flips/stacks around a fixed board.
- In `shop.js`, hover-driven `say*` changes must not set `moved` when only
  text content changed within the same width — cheapest correct rule: after
  `remeasure()`, only re-seat when the measured width actually changed.

**B2 (item 4) — aura, not diamond.**
- New file `src/render/aura.js`: `drawAuras(ctx)` — for each station in
  `STATIONS` (`board.js`) where `hasOffer(key)` is true, and for the bench via
  `benchMark()`, draw a soft pulsing outline around the building's box
  (`siteBox` from `works.js` / `markAnchor` geometry): a 1-px white rectangle
  inset-outset breathing on a ~1.6 s cycle, dashed (4-px dashes marching
  slowly), black-and-white only, no gradients, aligned to the `P` grid.
- One LAYERS line in `render.js`, directly **below** the entry that draws
  pile marks (auras sit behind marks), commented `// wave7-ui`.
- Do NOT remove the diamond in `render/crew.js` — the orchestrator deletes
  `drawOffers`'s diamond after merge (file belongs to track C this wave).

**B3 (item 7) — redraw the clock glyph.**
- Rebuild `.clock` in `style.css`: crisp 1-px ring on the em grid, hands at
  right angles (9:00), centered with explicit width/height in px multiples of
  the font pixel, no subpixel offsets. Check it at 100% and 125% browser zoom
  in a screenshot before calling it done.

**B4 (item 8) — readable descriptions.**
- `.rows .note`: `opacity: .72` (from .5), `font-size: .9em` (from .82),
  `line-height: 1.35`. Keep `max-width: 46ch`. Hover stays brighter than
  rest state.

**B5 (item 15) — bar clears the sprite.**
- In `render/bars.js`, raise `BAR_CLEAR` from `P * 4` to `P * 7` and make
  `barSpot()` sit the bar above the **rising building's current top**
  (`risingPlace` height), not the ground line, so it never overlaps at any
  progress. Verify with a shot of a build in progress.

**B6 (item 19) — pickaxe: 3 integer rungs, much dearer.**
- `rockhandBite(lvl)` in `upgrades.js` returns `1 + lvl` (bite in px: 1, 2,
  3, 4) and the row's rung count becomes 3 (level 0–3). Set
  `ROCKHAND_RUNGS = 3` in `src/config/rocks.js` and use it in the row and the
  bite; stop using the shared `RUNGS` for this ladder.
- Price: multiply the bases in `rows-rock.js`'s `rungCost` calls by 8
  (spore 5 → 40, dust 300 → 2400) with the same growth.
- Clamp `S.rockhandPickLevel` on load to the new max (a saved level 5 becomes
  3) — one line where the row reads the level, not a persist.js edit.

**B7 (item 20) — no rung repeats a value.**
- `critMult(lvl)` in `crit.js` becomes `CRIT_MULT_MIN + lvl`, and the
  `critmult` ladder's rung count becomes `CRIT_MULT_MAX - CRIT_MULT_MIN`
  (3 → 6 in 3 rungs). Set that in `config/crits.js`. Costs per rung ×2 to
  compensate for fewer rungs. `critEV`/`critFor` keep working unchanged.

**B8 (item 26) — under-staffed mark.**
- Add slot `'short'` to `SLOTS` in `render/pilemarks.js` and draw a small
  hollow body outline (a P-grid stick figure, 1-px, same size as the warning
  triangle) at `markAt(key, 'short')` for every station whose job has
  headcount 0 while the station is open and has capacity
  (`S[job] === 0 && capOf(job) > 0`, via existing `upgrades.js` exports).
  Tooltip text `'nobody works here'` — expose a `shortMarkAt(key)` the same
  shape as `pileMarkAt` so track C's `input.js` (or the orchestrator post-
  merge) can wire the tip; do not edit `input.js` yourself.

## Track C — crew interaction

**C1 (item 6) — grossed out by poop.**
- New stage in `STAGES` in `crew/step.js`, inserted directly after the
  `relieve` stage (never above the celebration stage): a walking worker whose
  next step lands on a poop column (`poopCols()` + `muckFloor` from
  `src/smog.js`) stops for `GROSS_MS = 1200` ms, says a new `'yuck'` mark, then
  steps around it (offset one column sideways, the `duck` pattern — but do not
  edit `body.js`; a local sidestep in the stage is fine). Cooldown
  `GROSS_COOLDOWN_MS = 8000` per worker so a crowd doesn't gridlock. Constants
  in `src/config/crew.js`, tunable.
- `'yuck'` branch in `drawSaying` (`render/crew.js`): tiny wavy stink squiggle
  or scrunched face — 1-px white marks, P-grid.

**C2 (item 9) — poop tooltip wins over the rock.**
- In `whatIsAt()` (`input.js`), test `messAt(x, y)` **before**
  `overBoulder()`. Nothing else reorders.

**C3 (item 10) — janitor's closet.**
- Display-string sweep: every user-facing "outhouse" becomes "janitor's
  closet" — row name `'build the janitor's closet'`, board title, tooltips,
  crew card words. Internal keys, DOM ids (`#looshop`), `S.*` field names,
  BOARDS keys, save fields all stay — rename display strings only.

**C4 (items 11, 12) — roster row layout.**
- In `roster.js` `boxes(p)`: put `P` (one cell) of clear space between the
  worker-counter sprite group and the specialist sprite group.
- Specialist display: show the default-worker body only when the job has a
  real trade (`TRADE_OF[p.job]` in `kit.js`), mirroring the wizard's special
  case — the janitor row shows just the hatted worker and its count.

**C5 (item 17) — slim worker card.**
- `card(w)` in `crewboard.js` returns exactly: name, age, current job
  (`doing(w)`). Delete favorite/heading/tallies/carrying from the hover card.
  If `selftest/crew.js` asserts the old card, update that check to the new
  shape (that file's card checks become yours for this wave).

**C6 (item 18) — hover pauses a worker.**
- In `crew/pointer.js`, export `hoverAt(x, y)` that `input.js` calls on
  pointermove: the worker under the cursor gets `w.pauseUntil = now +
  HOVER_PAUSE_MS` (`= 900`, config/crew.js, tunable) refreshed while hovered.
- New early stage in `step.js` (below celebration, above walking): a worker
  with `pauseUntil > now` stands still and says mark `'?'`; add the `'?'`
  branch to `drawSaying`. Pausing must not drop cargo or break a claim.
- `w.pauseUntil` is EPHEMERAL (it is per-frame hover state; if it must live
  on `S` at all, prefer plain worker-field, which persist already handles —
  check how `w.looUntil` is treated and match it).

## Track D — apothecary

**D1 (item 22 first — it shapes the rest) — brews declare their targets.**
- Each `TONICS` row gains `jobs: [...]` (JOB keys it applies to). stew (work)
  and brace (crit): every job **except** HAUL. strong (carry): HAUL and
  QUARRY (whoever carries). `takesTonic(w, t)` becomes a membership test on
  `t.jobs`. The `potprefer` dial only offers jobs the tonic can take.

**D2 (item 21) — hauler speed brew.**
- New tonic `swift` — name `'speed brew'`, `kind: 'pace'`, `jobs: [HAUL]`,
  reagent `'spore'`, base `TONIC_SWIFT_PACE = 0.25` (+25% haul speed at
  potency 0, scaling with the same rung curve as the others). Reader
  `paceBoost(w)` beside `workBoost`/`carryBoost`; apply it in the one place
  hauler speed is computed — if that is `haulSpeed()` in `upgrades.js` (not
  yours), export `paceBoost` and note the one-line call for the orchestrator
  to wire post-merge rather than editing `upgrades.js`.

**D3 (item 25) — wizard potion.**
- New tonic `gleam` — name `'gleam brew'`, `kind: 'spark'`, `jobs: [WIZARD]`,
  reagent `'shard'`, base `TONIC_GLEAM_SPARK = 0.20`: a dosed wizard yields
  +20% sparks (potency-scaled). Reader `sparkBoost(w)`; if the spark payout
  line lives outside your files, export the reader and report the wiring line
  for the orchestrator.

**D4 (item 24) — shard brews gated on the quarry.**
- Any tonic with `reagent: 'shard'` is hidden from the pot picker and its
  potency row hidden (`show: () => S.quarryOpen`) until the quarry is open.

**D5 (item 23) — pot labels.**
- Under each pot with a brew selected, draw the tonic's `short` name in small
  screen-space text, the exact `drawStockCount(screenAt)` pattern in
  `render/apothecary.js`, centered under `potX(i)`. One LAYERS/counts hook if
  needed, additive.
- Migration: new tonic keys must survive an old save — extend
  `migrateApothecary()`; default potency 0, stock 0.

---

## Verification, per track

- Dev server: start your own from the repo root binary,
  `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <pick 5190+track#> --strictPort`,
  confirm it serves *your* worktree (`curl -s localhost:<n>/src/<your file> |
  grep <your new symbol>`), never touch port 5183. Tear it down before
  reporting and verify the port is dead.
- Anything drawn: `GAME=http://localhost:<n>/ node tools/look.mjs <scene> --zoom 4`
  and read the shot. Pixels are the ground truth; `fillRect` takes a top-left.
- One node test file per track (named in your ownership row), run alone:
  `node --test test/wave7-<track>.test.mjs`. Buy like a player: at least one
  check per feature reaches it through `__buy`/the pointer, not a `__` hook.
- Run tests in the **foreground**. Never run the full suite.
- Commit early and often to your branch, push each commit
  (`git push -u origin wave7-<track>`), and report: deliverables one line
  each, files touched, pasted test output, judgment calls the spec left open,
  anything you believe is wrong with the design you implemented anyway.

## Seams the orchestrator wires post-merge

- Delete the diamond in `drawOffers` (`render/crew.js`) once B's aura is in.
- Tooltip for B8's `shortMarkAt` in `input.js` (C owns input.js this wave).
- D2/D3 one-line boost calls in `upgrades.js` / wizard payout if D reports
  them unwired.
- DESIGN.md sections for items 16 and 27, `(design, not built)`.
