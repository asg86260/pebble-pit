# Wave: every part of the game stands on its own

**Status: approved by the owner 2026-10-23 (all three calls as recommended).
Steps 1-4 merged. Re-sequenced 2026-10-25 after the trace (owner: both,
speed first) into phase A and phase B below; that order approved
2026-10-25. Step 5 (hot paths) built; step 6 (fixtures) next.**
Once approved this document is canon for the tracks that build it: do not
redesign; implement. Where a name is given, use it.

## Why

The owner, 2026-10-23: "we should be able to isolate each station/feature/chunk
of the game into tests, without needing the whole game. That should be how
we're building our game."

What the suites cost today, measured, not guessed:

- The node tier is ~3,500 test-seconds (1,248 groups in 307 files). One
  typical file (`sky-fan`, 33 s): ~70% is the game simulating, ~18% the
  reload every five game seconds, ~11% the rules every frame. A profile of
  the slowest file (`scenes-stand-acts`, 203 s) has nothing but game code at
  the top: the deep's coil walked (`deep/place.js`, ~15%), `surveyFloor`
  (10%), `countTick` (7%). A check about a ladder simulates the weather, the
  wildlife, the rain and the serpent, because there is no way not to.
- The browser tier is ~790 s a window, a third of it `await sleep()` (229
  calls; the contrast check alone sleeps 1,871 times, 104 s). It is cut into
  shards by count, so they run 29 s to 251 s.
- CI setup installs system packages through apt, which stalled four jobs of
  one run for 5 to 10 minutes on a slow mirror.
- Two of the day's bugs were state held in a module rather than on `S`
  (`riseIn` in `after/union.js`, `wheelOwed` in `input.js`): a new game and a
  reload left it behind, and the checks went red only in some orders. Game
  code holds 352 module-level `let`s in 130 files; each leak found so far got
  its own hand-written reset (`forgetSerpent`, `forgetOwed`, `coldSky`,
  `stopWheel`).

What is kept, because it is right: the game clock (`run(s)`), the rules in
`verify.js` on every frame, the reload check, "buy it like a player", the
save as the fixture. This wave makes them cheap enough to keep everywhere.

## The bargain

A part of the game -- a station, a system, a place -- is built and checked
alone: its own steps, its own facts, its own setup, with the rest of the
yard inert. The whole game is still checked whole, but by a few playthroughs
on a budget, not by every one of 1,248 groups.

What it costs: one declaration a system (the `SYSTEMS` row below), a reset
for any state a module keeps, and moving checks into the tier that fits them.
What it must not break: nothing teleports, every rule watched on every frame
a check runs, reload checked against whatever a check builds.

## The pieces

### 1. A system is a row (`src/systems.js`)

`STEPS` in `game.js` becomes `SYSTEMS`: the same one list in the same order,
each row a part of the game.

```js
{ name: 'crew', step: c => ..., owns: ['workers', 'crew*'], needs: ['piles', 'survey'] }
```

- `owns`: the `S` fields it is the writer of (globs allowed). Every field on
  `S` is owned by exactly one system, or by `core` (the clock, the camera,
  the view).
- `needs`: the systems whose per-frame work it reads. **Derived, not
  guessed**: `tools/node/systems-trace.mjs` plays the scripted playthroughs
  with `S` behind a Proxy, records which step reads and writes which field,
  and prints the graph. `test/systems.test.mjs` holds each row's `needs` to be
  at least what the trace finds, and every `S` field to have one owner.
- `step` is today's step, unchanged. `game.js`'s `step()` walks `SYSTEMS`
  exactly as it walks `STEPS`; the frame order does not move.

### 2. Module state is registered (`src/reset.js`)

```js
export const held = (name, reset) => ...   // a module's state, and how to clear it
export const resetHeld = () => ...         // called by newGame and restore
```

A module that keeps state between frames registers its reset with `held`;
`newGame` and `restore` call `resetHeld()`. The four hand-written resets
fold into it. A pure cache (a path per zoom, a profile keyed by its inputs)
is not state and says so with `// cache:` on its line.
`test/held-state.test.mjs` lists every module-level `let` in `src/` that is
neither registered nor marked: an allowlist that only shrinks, like the
polish bar's gates, starting at whatever is unclassified on the day it lands.

### 3. A part of the game stands alone (`test/sim.mjs`)

```js
const yard = await sim({ systems: ['crew', 'rock'], from: 'bench' });
```

Stands the world (the layout is cheap: ~0.4 s a file), loads a fixture, and
steps only the named systems, their `needs` closed over, and `core`, in
`SYSTEMS` order. `run`, `runUntil`, the `__` handles, `verify` and the
reload check work as in `helpers.mjs` today; a rule about a system not
running is not asked. A part that cannot be stood this way has a `needs` the
trace has not seen, and that is the defect to fix, not a reason to stand
the whole yard.

### 4. Fixtures are saves, built once (`test/fixtures/`)

A named starting yard (`bench`, `quarry`, `deep`, `after-camp`, ...) is
built from its scene in `src/scenes.js` once, saved, and loaded by every
check that starts there. The generated blobs are cached under
`test/fixtures/.gen/` (ignored), keyed by a hash of `src/`, and rebuilt on a
miss; a player's save that a bug came in on stays a committed fixture as
today. The scenes stay the one description of every state, for the shot tool
and the checks alike. A fixture is setup a check is not about: the thing a
check *is* about is still bought, clicked and walked the player's way.

### 5. Four tiers, by what they need

| tier | stands | where | for |
|---|---|---|---|
| unit | nothing: pure functions | `test/unit/` | a ladder's table, a layout, a codec |
| system | one part alone (`sim`) | `test/<part>/` | a station's loop, its board's rows, its save |
| whole | the full game | `test/whole/` | the playthroughs, scenes standing, reload sweeps -- on a budget |
| browser | a page | `src/selftest/` | pointer, DOM, board, canvas only |

`test/` is laid out by part, matching `SYSTEMS` names: `test/crew/`,
`test/after/`, `test/deep/`. A new station arrives with its `SYSTEMS` row and
its `test/<station>/` folder, and the whole tier does not grow to cover it.
The whole tier has a written budget (`test/whole/BUDGET`, seconds on CI) and
a check that goes red past it.

### 6. One way to write a check, both tiers (`src/check/`)

`ok`, `group`, `run`, `runUntil` and a new `until(fn, frames)` -- poll a fact
a frame at a time -- shared by `test/helpers.mjs` and `src/selftest/kit.js`,
which today each write their own. In the browser `until` waits on frames, so
a board opening is waited for, not slept past. `sleep` stays only where real
wall time is the thing checked (a hold, a double-click), on an allowlist
that only shrinks.

### 7. The handles split by part

`src/hooks.js` (1,635 lines) becomes `src/hooks/<part>.js`, each part's setup
handles beside its system; `hooks.js` keeps the frame (`fast`, `verify`,
`newGame`) and re-exports. No handle changes name.

### 8. CI by measured time

- Both tiers write each file's or group's time; `test/times.json` is
  refreshed from main's CI run and the shards are dealt by it (longest first
  into the emptiest shard), the browser's opening group pinned first.
- The browser jobs run in Playwright's own image
  (`mcr.microsoft.com/playwright:v1.55.0-noble`): browser and system packages
  baked in, no apt, no download.
- The contrast checks are split one group a page, so no group is the floor.

### 9. The hot paths

The profile's top three are fixed in the game, which the player gets too:
the coil walk asked again within a frame, `surveyFloor` walking every column
four times a second, `countTick`. Each is profiled before and after on the
same seeded yard (PERF.md, section 0).

## Step 4, measured (2026-10-25)

The trace (`tools/node/systems-trace.mjs`, `test/systems.json`, 479 scenes)
found the frame one knot: every system but six closes over 46-47 of the 66.
Choosing systems cannot isolate a part until the knot comes apart.

It is a long tail, not a few hubs. Cutting a field's edges outright (more
generous than any untangling: a `workers` view still needs every station
that writes into it), the greedy best thirty cuts, measured on the graph:

| cut | median closure | crew / casino / apothecary / rift | afterlife (act 3) |
|---|---|---|---|
| none | 46 | 46 | 46 |
| `workers` | 37 | 37 | 37 |
| + 19 more (`acts`, `after`, `shake`, `grit`, `strips`, ...) | 27 | 27 | 0 |
| + 29 more | 26 | 26 | 0 |

Act 3 comes apart after about twenty cuts. The yard's stations are one
component that thirty cuts leave at 26 of 66. The owner's call (2026-10-25):
**both, speed first** -- phase A takes the speed without isolation; phase B
untangles, measured slice by slice, and stops for the owner if the yard's
parts do not move.

## Order, and what each step can be checked by

Each is its own pull request, green before the next starts. Tracks inside a
step run in parallel where their files are disjoint.

1. **CI by measured time** (8). Measured: shard spread and run wall time.
   *Merged, #11.*
2. **Module state registered** (2). The allowlist lands with every current
   `let` classified; the known leaks fold in; the pad sheet leak in TODO.md
   gets its reset here. *Merged, #12.*
3. **One check API, frame waits** (6). The browser tier's sleep total, from
   the run summary's `cost`, falls; the sleep allowlist lands. *Merged, #13.*
4. **The trace** (1, measured). `systems-trace.mjs` and `test/systems.json`.
   *Merged, #14.* `SYSTEMS` rows and `sim` move to phase B.

### Phase A: speed without isolation

The target, checked on main's `tests` run: **the slowest node shard from
7.4 min to under 4**, and the whole run from ~7.5 min to under 5. Every
group still stands the whole game; the tiers in phase A are unit, whole and
browser (piece 5's system tier and `test/<part>/` folders are phase B's).

5. **Hot paths** (9). The deep's coil walk asked again within a frame
   (`deep/place.js`), `surveyFloor` walking every column four times a
   second, `countTick` (`game.js`). Each profiled before and after on the
   same seeded yard (PERF.md, section 0); the player gets the frames too.
   First, because every later step is measured against the game's own cost.
   *Built 2026-10-25:* the coil walked once a frame, not once a rebuild, and
   only as far as a fighter asks; `surveyFloor` off a column ledger
   (`columnsOf`, rule 7); the deep bed's brim read off its top rows. Every
   answer identical to before, checked side by side over 2.5M asks. A frame
   of act 3 with the deep fighting 0.48 to 0.22 ms; `scenes-stand-acts`
   185 to 119 s, each run alone on this machine. Rule 7 walks a grid once
   for all its ledgers. (`countTick` was `surveyFloor` inlined.) Checks:
   `lineWalks` in test/deep-alloc.test.mjs, the survey's cells in
   test/perf-gate.test.mjs.
6. **Fixtures** (4). A named starting yard is built from its scene in
   `src/scenes.js`, saved, cached under `test/fixtures/.gen/` keyed by a hash
   of `src/`, and loaded by every check that starts there. Files move onto
   fixtures slowest first by `test/times.json`: a file that plays twenty game
   minutes to reach the deep loads `deep` instead. The thing a check is about
   is still bought, clicked and walked.
7. **The unit tier** (5, its first row). Checks whose subject is a pure
   function -- a ladder's table, a layout, a codec, a placement -- move to
   `test/unit/` and stand nothing. Found by reading the slowest files for
   checks that never call `run`.
8. **Handles split** (7). `src/hooks.js` into `src/hooks/<part>.js`; no
   handle changes name.

Phase A is done when main's run meets the target, or when step 8 lands and
it does not -- then the measured shard times go to the owner before phase B.

### Phase B: untangling, a slice at a time

9. **`SYSTEMS` rows** (1). `STEPS` becomes `SYSTEMS`, same order, with
   `owns`; `test/systems.test.mjs` lands as a **ratchet**: each system's
   closure, from the committed `test/systems.json`, may only shrink, like
   the polish bar's gates.
10. **The first slice: bodies and beats.** Each station keeps its own bodies
    and `S.workers` becomes a view read by the systems that want everybody
    (draw, the reload check, the roster); the beats ask the rock, camera,
    crew and works through an interface instead of writing their fields.
    Re-traced after (the full trace is ~33 min: a scene subset while
    working, the whole trace once on CI or overnight).
11. **`sim` and act 3.** `test/sim.mjs` (piece 3) lands with act 3's mill as
    its first part, the one the graph says comes apart.
12. **The stop rule.** After slice 10, the closures of crew, casino,
    apothecary and rift go to the owner. If they are not under 15 of 66,
    phase B stops there: the ratchet and act 3's `sim` stay, and the yard is
    checked whole, on fixtures. If they are, the bench and the deep's pods
    move onto `sim` and the move by part (5) goes on, each part its own
    track, with the whole tier's 6-minute budget (call 3) its target.

ARCHITECTURE.md and CLAUDE.md are updated as each lands: "adding a station"
becomes "a `SYSTEMS` row, its facts, its config, its `test/<station>/`" when
phase B reaches it.

## Calls for the owner

1. **Isolation by choosing systems, on the one `S`.** A part runs alone
   because only its systems step, not because it has its own state object.
   The alternative -- `S` passed into every system as an instance -- is the
   purer shape and a rewrite of every module. Recommended: choose systems.
2. **`test/` reorganized by part.** 307 files move into folders over step 5.
   Big diffs, but each part's move is one pull request. Recommended: yes.
3. **The whole tier on a budget.** Proposed: 6 minutes of CI time, split
   across its shards. The playthroughs and scene sweeps stay; new whole-game
   checks need room made for them.
