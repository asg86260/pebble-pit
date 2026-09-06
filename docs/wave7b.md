# Wave 7b — the last two: hand-assignment and the build yard

This document is canon. Subagents: do not redesign; implement. The reasoning
lives in DESIGN.md ("Workers assigned by hand" and "The build yard", both
signed off 2026-09-06); this file is the build order. A track that finds an
item impossible says so in its report rather than inventing a different
feature.

Two tracks, disjoint ownership. `config.js` barrel, `state.js` (three lists),
`render.js` (`LAYERS`), `game.js` (`STEPS`), `selftest.js` are additive-only
for both — one block each, commented `// wave7b-<track>`.

| track | owns | do NOT touch |
|---|---|---|
| E assign | new `src/crew/assign.js`, `src/crew/pointer.js`, `src/crew/kitwalk.js`, `src/render/aura.js`, `src/config/aura.js`, `test/wave7b-assign.test.mjs` | `src/works.js`, `src/upgrades.js`, `src/roster.js`, `src/crew/muster.js`, `src/crew/builders.js`, `src/input.js`, everything of F |
| F build | new `src/buildbench.js`, new `src/upgrades/rows-buildbench.js`, `src/works.js`, `src/crew/builders.js`, `src/crew/muster.js`, `src/upgrades.js`, `src/roster.js`, `src/world.js`, `src/config/build.js`, `src/config/sites.js`, `src/render/rise.js`, `src/render/buildsites.js`, `src/render/bars.js`, `src/render/stations.js` (drawBuildBench may live beside drawLab), `test/wave7b-build.test.mjs` | `src/crew/pointer.js`, `src/crew/kitwalk.js`, `src/render/aura.js`, `src/hands.js`, `src/input.js`, everything of E |

Neither track edits `src/input.js` — E's hook rides inside `drop()` in
pointer.js, which input.js already calls on both release paths.

---

## Track E — workers assigned by hand (feedback7 item 16)

The counters and their buttons STAY. This ships alongside them; nothing is
removed this wave.

**E1 — the drop target map.** In `src/crew/assign.js`, build
`dropTargets()`: the roster's stations that are standing and shown, as
`{key, job, rect}` — job from the same table `render/pilemarks.js` uses
(`JOB_AT`'s shape: quarry, farm, scrub, tower, lab, apothecary, outhouse,
school), rect from `standRect(key)` (board.js export) padded by
`ASSIGN_PAD = P * 2` on every side (new, `src/config/aura.js`, tunable).
Plus one more target: the rock — `{key: 'rock', job: JOB.ROCKHAND}` over the
boulder's box — because rockhands are hired by count too. No target for
haulers (they are the remainder, `rebalance()`'s to give).

**E2 — the drop means retrain.** In `drop(w)` (`crew/pointer.js`), before the
throw physics: if the body's center is inside a target's rect, and the job is
not the body's own, and `roomAt(job) >= 1` (upgrades.js export — call it,
don't reimplement), then instead of the throw:
- move the ask the way `joinJob` in `kitwalk.js` does — decrement the old
  job's `S[...]` (never below 0; a hauler's needs no decrement, haulers are
  derived), `w.type = TYPE_OF[job]`, increment `S[job]`, then
  `rebalance(); syncWorkers();`
- then `retask(w, w.type)` so the body walks its own retraining — old hat
  down, new hat on at the kit stand, then in through the door. No teleports:
  the count moves at the drop (that is what the buttons do today), the body
  walks.
Export the shared move from `kitwalk.js` (promote `joinJob` to an export and
call it) rather than copying its body. A drop anywhere else, or onto a full
or invalid target, is exactly today's throw.

**E3 — the target reads before you commit.** In `render/aura.js`, factor the
ring-drawing body out of `drawAuras` into `auraRing(rect, phase)` and draw a
steady (non-breathing, fully bright) ring around the target rect while a
lifted body is over it — `assign.js` exports `holdTarget()` (the target under
`S.mouse` while `lifted()`, else null) and aura.js draws it in the same
LAYERS pass. A full station (`roomAt < 1`) shows no ring — no ring, no deal,
one rule.

**E4 — checks** (`test/wave7b-assign.test.mjs`, node tier, fresh game per
group, `run()`/`runUntil()`):
- lift a miner, set its position over the farm, `drop()` — the asks move
  (miners −1, farmhands +1), the body walks (never jumps) to the farm's kit
  and ends up working it; reached like a player where possible (`__crew` for
  setup, the drop through the real `drop()`).
- a drop over a station with no room changes nothing.
- a drop on open ground changes nothing (today's throw still happens).
- `rebalance()` still owns haulers: after any drop, `S.haulers` is the
  remainder.

Touch is out of scope (there is no touch lift today); say so in the report,
don't build one.

## Track F — the build yard (feedback7 item 27)

The bargain (DESIGN.md): after the construction bench exists, new buildings
are raised by a builder who walks to the site; before it exists, builds work
exactly as they do today. Rungs and machine ladders stay instant — only
`kind: 'building'` (and `machine`) works change hands.

**F1 — the buildbench site.** A small work bench standing next to the bench:
slot key `buildbench` in `src/config/sites.js` beside the bench's slot, rect
`S.buildbench` + `S.buildbenchOpen` in state.js (SAVED), seated in
`seatSites()` (world.js), drawn (a trestle like the bench with a hammer lying
on it, `P`-grid, black) via a `drawBuildBench` in `render/stations.js` and
one LAYERS line at the bench's depth. Unlock row
`src/upgrades/rows-buildbench.js` through the `site()` helper: key
`unlockbuildbench`, name `'build the work bench'`, priced `cores: 2`,
`show` once the second building unlock is affordable-ish (`S.boulderNo >= 2`).
The buildbench itself raises the way buildings do today (it is the last
free-standing build).

**F2 — the builder becomes a post.** Once `S.buildbenchOpen`:
- `rebalance()` stops deriving `S.builders` from `BUILD_GANG ×
  busyBuilderSites()`; `S.builders` becomes an ask like any job, capped by
  `buildPosts()` (new, in `buildbench.js`: `1 + S.buildPostLevel`).
- a `POSTS` row in roster.js at the buildbench (`show: () =>
  S.buildbenchOpen`), so the player hires builders with the buttons (and,
  after track E, by dropping a body on it — the buildbench is *not* in E's
  target table this wave; report it as the known seam).
- before `S.buildbenchOpen`, everything works exactly as today — the derived
  gang, the lent bodies. One `if`, not a migration.
- `JOB_AT` in pilemarks gets no entry (F does not own that file); note it in
  the report as the orchestrator's one-liner if the under-staffed mark should
  cover the buildbench.

**F3 — builds wait for hands.** `stepWorks` already pays out by
`handsAt(site)`; keep that. What changes: with the buildbench open, a body
only counts toward a `building`/`machine` work if it is a builder
(`w.type === TYPE.BUILD`) — the lent-body clause stops applying to those
sites. A queued build (no builder free) stands fenced with its bar empty —
which `stalled()` already says; make sure the fencing and the bar draw for a
work at `done: 0` with nobody on it.

**F4 — more than one build at once.** `src/render/rise.js` currently assumes
one rising place (`risingPlace()` singular, off the head of
`S.works['yard']`). Make it per-work: `risingPlaces()` returns every
`building` work's place, `withRise` takes the progress of *its* work
(progress by key, `works.js`'s `leftAt`/`progressAt` per key — add
`progressOfKey(site, key)` if needed). Builders spread themselves via the
existing `siteFor` least-crowded rule; with `buildPosts() >= 2` and two
builders, two buildings rise at once. The ladder: rung row `buildposts` in
`rows-buildbench.js`, `S.buildPostLevel` 0..2, priced in sparks
(`rungCost(40, ...)` shape — sparks are the machines' currency and this is
plant), each rung +1 concurrent build and +1 builder cap. `BUILD_GANG` and
its dev row are deleted; its pace meaning returns as a `buildpace` rung
(same file, spore/dust, `BUILD_PACE_STEP = 1.35` per rung, 3 rungs) applied
in `stepWorks`' effort for builder-manned sites.

**F5 — the door predicate.** `inBuildSite(w)` in `builders.js` (a builder
standing inside its work's fenced box) — output already depends on presence
via `handsAt`; keep it that way and export the predicate for checks.

**F6 — checks** (`test/wave7b-build.test.mjs`):
- before the buildbench: buy a building unlock, run — it rises exactly as
  today (regression guard).
- after buying the buildbench (through `__buy`, like a player) with zero
  builders assigned: a bought building unlock fences its site and its bar
  stays empty until a builder is assigned; assign one, the body walks there,
  progress moves only while it is present.
- two builds + one post: they finish in sequence; buy a `buildposts` rung and
  a second builder: both progress at once.
- persist-roundtrip stays green for every new field.

---

## Verification, both tracks

Same rules as `docs/wave-feedback7.md`: own vite server from the repo root
binary on 5196 (E) / 5197 (F) `--strictPort`, confirm it serves your
worktree, never 5183; shots via `tools/look.mjs` for anything drawn (E: the
target ring under a held body — add a scene; F: two rising buildings — extend
the `build` scene family); one named test file each, run alone, foreground;
no full suites; tear the server down and verify the port dead. Commit early
and often to `wave7b-assign` / `wave7b-build`, push each commit, report in
the house shape (deliverables, files, pasted test output, judgment calls,
disagreements implemented anyway).

## Seams the orchestrator wires post-merge

- The buildbench as a drop target in E's table (needs F's rect + E's file).
- `JOB_AT`/under-staffed mark coverage for the buildbench, if wanted.
- DESIGN.md `(built)` flips and TODO.md status.
