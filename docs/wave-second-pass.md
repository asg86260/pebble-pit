# Wave: the second pass, seams 2 and 8

**This document is canon. Subagents: do not redesign; implement.** Where a
name or a rule is written here, use it. Where a judgment call is not
written here, make the smallest one and report it under "decided".

Two tracks, disjoint, built in parallel:

- **U** -- seam 2 of "The second pass" (DESIGN.md): `upgrades.js` is four
  modules; split it so the sim never imports the shop.
- **B** -- seam 8, "Beats and gates: one table each" (DESIGN.md): the
  beats machine. The gates table is *not* in this wave; it lands with
  seam 4 afterward.

Base: branch `worktree-beats-gates-design` on origin, at the commit that
carries this document. Every track's first command is
`git fetch origin && git reset --hard origin/worktree-beats-gates-design`.

Neither track changes what the game does. U is a pure move; B replaces
three machines with one that plays the same beats. The test for both is
the same suite green and the same shots.

House rules that apply, from CLAUDE.md: comments say why, to the register
of the comment pass (`docs/wave-comments.md`: keep what derives the
logic, no history); American English; every new field on `S` goes in one
of the three lists in state.js; run only the files that cover the change,
in the foreground, with `--test-concurrency=4` when more than a few; never
`npm test`; never point anything at port 5183; tear down any server you
start; commit and push to your branch before reporting.

---

## Track U: `upgrades.js` is four modules

### What exists

`src/upgrades.js` (639 lines after the comment pass) holds four things,
and 44 files import it. The sim -- everything under `src/crew/`, the
stations, `game.js`, `dust.js`, `hands.js`, `rock.js` -- imports it for the
first two only, and that is what drags 72 modules into one import cycle
(`tools`-style check below). Seam 1 hit that cycle: removing one unused
import changed the evaluation order and a row read at load threw a TDZ.

### The four modules

Move, do not rewrite. Each function keeps its name, its body and its
comment; only the file changes.

**`src/levels.js`** -- what every ladder and every station is worth now.
Pure functions of `S`, config, kit.js, machines.js, world.js and
balloon.js. Everything a body or a station asks:
`swing`, `capacity`, `rungCost` and `DUST_PER` (re-exported from
`upgrades/price.js` as today), `mineRate`, `mineMs`, `rockhandRate`,
`rockhandMs`, `haulCap`, `haulSpeed`, `scoopMs`, `commutePace`,
`homePace`, `pickCount`, `rockhandBite`, `hats`, `worn`, `loose`,
`spareKit`, `capOf` (and its private `capOfBare`), `roomAt`, `handsOf`,
`kitCap`, `kitFull`, `gangWorth`, `machineRate`, and `TRADE_OF`/`JOB_OF`
re-exported from kit.js as today.
**levels.js must not import upgrades.js, shop.js, board.js, crew.js or
works.js.** If a function here needs one of those, say so in the report
and leave that function in upgrades.js.

**`src/staffing.js`** -- the crew's counts: `JOBS`, `spareHands`, `idle`,
`restaff`, `stripKit`, `rebalance` (with its private `nearestLendable`),
`hire`, `assign` (with its private `forgive`). These call `syncWorkers`
(crew.js) and `busyBuilderSites`/`siteX` (works.js); that is allowed.
`hire` and `assign` today end with `buildShop()`, which is the shop's
business: **move that call to the callers** (`roster.js`, `crewboard.js`,
`hooks.js`, and any other UI caller -- list them in the report) so
staffing.js does not import shop.js. A caller in the sim (not the UI)
that calls `hire`/`assign` does not get a `buildShop()`; name it if you
find one.

**`src/words.js`** -- how a board says a number: `MARK`, `purse`, `UNITS`,
`unitText`, `num`, `gainText` (with its private `gainAmount`), `priceText`,
`leftText`, `ordinal`. Imports `fmt` from board.js as today, `maxed` from
upgrades.js (it is about rows). If that import is a cycle that bites,
move `rungOf`/`rungsOf`/`maxed`/`folds` into words.js too and say so.

**`src/upgrades.js`** keeps what is about rows and buying: `rungOf`,
`rungsOf`, `maxed`, `folds`, `chained`, `HOUSE_ROW`, `UPGRADES`,
`SECTIONS`, `lodgers`, `openSections`, `canAfford`, `unseenSection`,
`benchMark`, `markSectionsSeen`, `take`, `billOf`, `building`, `inLine`,
`lineAt`, `canPay`, `buy`. It imports the three new files.

**For one commit, upgrades.js re-exports everything that moved**
(`export { mineMs, haulCap, ... } from './levels.js'` and the same for the
other two), so the split cannot break an importer. Then repoint every
importer in the tree at the new file for each name it uses, **except the
files track B owns** (below), which keep importing from upgrades.js. The
re-exports stay in upgrades.js until B lands; the integrator removes them.

### The check

`tools/cycles.mjs` (new, in this track): Tarjan over `src/**/*.js` import
edges (`import ... from './x.js'` and `export ... from`), printing the
strongly-connected groups by size and the members of the largest. On the
base it prints one group of 72. After the split it must print **no group
containing any of** `src/crew/*.js`, `src/quarry.js`, `src/farm.js`,
`src/rock.js`, `src/dust.js`, `src/tower.js`, `src/apothecary.js`,
`src/scrubhouse.js`, `src/hands.js`, `src/game.js` together with
`src/upgrades.js`, `src/shop.js` or `src/board.js`. Paste the before and
after output in the report. If a sim file is still in a group with the
shop, say which import edge keeps it there and leave it; do not invent a
setter to break it.

`node tools/unresolved.mjs` clean of anything new. `node --check` on
every file touched. Then, in the foreground,
`node --test --test-concurrency=4` over: `test/jobs.test.mjs`,
`test/kit.test.mjs`, `test/machines.test.mjs`, `test/crew.test.mjs`,
`test/roster.test.mjs` (if it exists; else the file whose name says
roster), `test/shop-coverage-*.test.mjs`, `test/persist-roundtrip.test.mjs`,
`test/route.test.mjs`, `test/house.test.mjs` (if it exists). Paste the
summary lines. The browser tier: start a server on a free port (see
CLAUDE.md, "A worktree has no node_modules"), run
`node tools/headless.mjs --only boards` and `--only work` against it with
a distinct `CDP_PORT`, paste the last line of each, and tear the server
down.

### Owns / does not touch

Owns: `src/upgrades.js`, the three new files, `tools/cycles.mjs`, and the
**import lines only** of every file that imports upgrades.js, except:
`src/intro.js`, `src/cutscene.js`, `src/ending.js`, `src/skip.js`,
`src/persist.js`, `src/state.js`, `src/verify.js`, `src/game.js` (its
import line of upgrades.js stays as is), `src/hooks.js`, `src/report.js`,
`src/scenes.js`, `test/**` other than running them, `DESIGN.md`,
`TODO.md`, `CHANGELOG.md`. Those are B's or the integrator's.

Additive-only: `ARCHITECTURE.md` -- one paragraph under "The files" naming
the four modules and the rule (the sim imports levels.js and staffing.js;
only the boards import upgrades.js).

Branch: `second-pass-U`. Commit title: `Split upgrades.js: levels,
staffing, words, and the rows`.

---

## Track B: the beats machine

### What exists

Read "Beats and gates: one table each" in DESIGN.md, the section "The
beats machine", before anything else; it is the design and this is only
the build order. Then read `src/intro.js`, `src/cutscene.js`,
`src/ending.js`, `src/skip.js` whole, and the `intro`, `cutscene`,
`reunion`, `skip`, `buried`, `under` entries of `STEPS` in `src/game.js`.

### The build

1. **`src/beats.js`**, new: `BEATS`, the registry, one row a beat in the
   order they may play, each `{ key, owns, when, enter, step, skip,
   next }` exactly as the design writes it. Rows: `leave`, `chat`, `fall`,
   `down`, `up`, `show` (owns `yard`); `meet`, `part` (owns `yard`);
   `rescue` (owns `yard`); `tear`, `drown` (owns `camera`); `props`,
   `net`, `arch`, `dome` (owns `camera`); `ending` (owns `sheet`). Plus:
   `stepBeats(t)` (the one `STEPS` entry: watch every not-done row's
   `when` in table order, run the running beats' `step`, mark done,
   follow `next`); `skipBeat(t)`; `ownsYard()`, `ownsCamera()`,
   `ownsSheet()` (the predicates the rest of the game asks --
   `introHolds` and `cutsceneRunning` today); `beatDone(key)`;
   `beatRunning(key)`.
   The bodies of `enter`/`step`/`skip` are today's functions in intro.js,
   cutscene.js and ending.js, called from the rows; move them into
   beats.js only where a function is nothing but the phase's step. What
   is about drawing bodies, the camera arithmetic, or the sheet stays in
   its file and is called. Two beats may run at once only with different
   owners; `stepBeats` refuses to start a beat whose owner is held.
2. **`S.beat`** (running keys, by owner: `{ yard: key|null, camera:
   key|null, sheet: key|null }`, `SAVED_BY_HAND`) and **`S.beatsDone`**
   (an array of keys in state.js, since the lists save plain values;
   `SAVED`). Remove `S.intro`, `S.cine`, `S.cineOwed`, `S.introDone`,
   `S.reunionDone`, `S.storyTold`, `S.storyDanced` from state.js and every
   reader; `S.buried` and `S.rescued` stay. `persist-roundtrip` must be
   green: every field is in one list.
3. **persist.js**: on read, an old save's flags fold into `beatsDone` --
   `introDone` marks `leave` through `show`; `reunionDone` marks `meet`
   and `part`; `storyTold` marks `ending`; `rescued` marks `rescue`; a
   `cineOwed` name marks nothing and is set as the running camera beat
   (today's rule: replay over the event as it stands). Dated in the
   comment (`2026-09-15`), one paragraph, under the file's existing
   migration register. The derivations persist.js does today
   (`introDone || crew > 0`, `reunionDone ?? boulderNo > 1`,
   `storyTold`/`storyDanced` from `rescued`) are kept as the same
   derivations into the set.
4. **game.js** `STEPS`: the `cutscene`, `reunion`, `intro`, `skip` entries
   become one `beats` entry where `cutscene` stands (before `camera`; the
   comment there says why). `under` and `buried` stay as they are. `skip`
   stays if skip.js still needs a step for the held space bar; read
   skip.js and decide, and say what you decided.
5. **verify.js**: one rule -- no owner holds two beats, every running
   key is a row in `BEATS`, and a running key is not in `beatsDone`.
6. **hooks.js / report.js / scenes.js / dev.js**: every reader of the
   removed fields reads the new ones (`report.js` prints `beat` and
   `beatsDone`; scenes that set `S.introDone = true` set the done keys;
   hooks that skip the intro call `skipBeat`). `grep -rn` for each removed
   name until it is clean, including `src/selftest/`.
7. **`test/beats.test.mjs`**, new, in the node tier, buy-it-like-a-player:
   (a) a fresh yard plays the opening through and every one of its keys is
   in `beatsDone` exactly once, and a save taken mid-`chat`, reloaded,
   finishes it once; (b) `skipBeat` on each of `chat`, `part`, `rescue`
   lands the fact the beat was about (the rock down, the pair parted, the
   body out); (c) with the dome answering a rock while a body is under it,
   `rescue` (yard) and `dome` (camera) run together and the verify rule
   holds every frame; (d) a save from before the machine (a plain object
   with `introDone: true, reunionDone: true, storyTold: true`) loads with
   the right keys done and plays no beat.
8. A line in `CHANGELOG.md` only if you fix something a player could see;
   this wave should not need one. `DESIGN.md`: the section's heading gets
   `(built)` and an "as built" paragraph naming what you decided.

### The check

`node --check` on every file touched. In the foreground,
`node --test --test-concurrency=4` over: `test/beats.test.mjs`, every
`test/intro*.test.mjs`, every `test/cutscene*.test.mjs` and
`test/endgame*.test.mjs`, `test/shield.test.mjs`, `test/skip*.test.mjs` if
any, `test/persist-roundtrip.test.mjs`, `test/reload*.test.mjs` if any,
`test/stuck-yard.test.mjs` and `test/pit-edge-stuck.test.mjs` (fixtures
from old saves). Paste the summary lines. Then one shot each of the
`intro`, `rift`, `endgame` and one shield `!` scene through
`node tools/look.mjs` against a server on a free port (see CLAUDE.md),
look at them, and say in the report what each shows; tear the server
down.

### Owns / does not touch

Owns: `src/beats.js` (new), `src/intro.js`, `src/cutscene.js`,
`src/ending.js`, `src/skip.js`, `src/state.js`, `src/persist.js`,
`src/verify.js`, `src/game.js`, `src/hooks.js`, `src/report.js`,
`src/scenes.js`, `src/dev.js`, `src/selftest/**` (readers of the removed
fields only), `test/beats.test.mjs`, `DESIGN.md` (the one section),
`TODO.md` (the one entry). Import lines from `./upgrades.js` in these
files stay pointed at upgrades.js; the integrator repoints them.

Does not touch: `src/upgrades.js`, `src/shop.js`, `src/board.js`,
`src/crew/**`, any station file, `src/shield.js` beyond reading it
(if `shield.js` must call `ownsYard()` where it read `S.intro`, that one
import line is yours; say so).

Branch: `second-pass-B`. Commit title: `The beats machine: one registry
for the opening, the cutscenes and the ending`.

---

## Report

Fixed shape, nothing else:

1. Deliverables, one line each.
2. Files touched.
3. The pasted output: the test summary lines; for U the two `cycles.mjs`
   printouts; for B what each of the four shots shows.
4. Decided: what you had to decide that this document did not say.
5. Wrong: anything you believe is wrong with the design that you
   implemented anyway.
