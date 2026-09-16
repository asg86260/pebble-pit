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

---

## Track S: a station is a row in a table, and the gates are its columns

Seam 4 of "The second pass" plus "The gates table" from "Beats and gates:
one table each" (DESIGN.md). Runs after U and B landed (main at `de1f1f1`
or later). Base: `worktree-stations-gates` on origin.

### What exists

`board.js` answers "which station" with `STATIONS` (a list of keys),
`standing(which)` (a hand-written switch over thirteen `S.<place>Open`
booleans), `standAt` (a rect a station), twelve `near<Station>` functions
chained by hand in `input.js` (twice), and forty-odd `which === '...'`
branches. Each `unlock*` row's `show` (or sticky `once`) is a private
predicate; `shieldOpened` in shield.js reads a `BEFORE` map. The table
those predicates encode is written out in DESIGN.md ("What there is
today", the door table). `upgrades/site.js`'s `site({...})` is the one
place a door row is built.

### The build

1. **`src/stations.js`**, new: `STATIONS`, one row a station, in yard
   order, `{ key, open: () => bool, stand: () => rect, board: key,
   after: [keys], needs: () => bool, sticky: bool }`. `open` reads the
   boolean that exists today (`S.quarryOpen`; the bench's is `S.seenBench`,
   the books' `S.banked > 0`, the house's `S.crew > 0`); `stand` is today's
   `standAt` getter for that key; `after`/`needs`/`sticky` are the door
   table in DESIGN.md, row for row -- where DESIGN.md's table and a row's
   current `show` disagree, the row's current `show` is the truth and the
   report says so. Shields are rows too (`props`, `net`, `arch`, `dome`),
   with `open: () => shieldDone(kind)` and no `stand`. The rift and the
   meteor are not stations; leave them out.
   Readers: `station(key)`, `open(key)`, `offered(key)` =
   `!open(key) && after.every(open) && needs()` held once true when
   `sticky` (today's `revealed` in shop.js does the holding; keep using
   it), `standRect(key)`, `nearStation(key, x, y)` (today's `near` plus
   the per-station special cases -- read the twelve and keep each one's
   rule, as a field on the row if it needs one, e.g. the quarry's shed and
   the house's padding), `stationAt(x, y)` (the first row whose
   `nearStation` says yes, in yard order -- which is what the two `||`
   chains in input.js compute), `shieldBefore(kind)` for shield.js.
2. **board.js**: `STATIONS`, `standing`, `standAt`, `standRect`,
   `stationFoot` and the twelve `near*` exports become thin reads of
   stations.js or go, and every `which === '...'` branch that only picks a
   flag or a rect reads the row instead. Branches that do something
   station-specific (a board's own build call) stay as they are; count
   what is left and say the number.
3. **input.js**: the two `||` chains become `stationAt(x, y)`; the
   `which ===` ladder at ~line 316 reads the table.
4. **upgrades/site.js**: `site({...})` takes `key` and reads
   `offered(key)` for `show`/`once` (sticky rows use `once`, as today);
   the `open` and `once`/`show` arguments go. Every `rows-*.js` door row
   drops its private predicate. The shield rows in `rows-shields.js` read
   `offered` too. `shieldOpened` in shield.js becomes
   `open(shieldBefore(kind))` and `BEFORE` goes.
5. **The thirteen booleans stay** on `S` this wave; `open()` is the one
   reader. (Turning them into one set is a save-shape change and waits for
   the save floor.)
6. **`test/gates.test.mjs`**, new, node tier: (a) the table is acyclic
   and every `after` key is a row; (b) every `unlock*` row and every
   shield row's `show()` equals `offered(key)` for that row, on a fresh
   yard and again with every door open (`__fullSites`); (c) for each door
   with an `after`, a yard that meets `needs` but has an `after` door shut
   is not offered it -- buy it like a player: `__grant` the coins, `run`,
   read `__rows().find(r => r.key === 'unlock' + key).shown`; (d)
   `stationAt(x, y)` over each standing station's `stand` rect returns
   that station and nowhere else returns a station.
7. `ARCHITECTURE.md`: "A new site" (the 7-step list) gains "a row in
   `STATIONS`" and loses the steps the row now covers; say which.
   DESIGN.md: the gates heading gets `(built)` and an "as built"
   paragraph; TODO.md's entry likewise. No CHANGELOG line unless a player
   could see a change (there should be none).

### The check

`node --check` on every file touched. Foreground, `--test-concurrency=4`:
`test/gates.test.mjs`, `test/door-chain.test.mjs`, `test/shop-coverage-1`
and `-2`, `test/shield.test.mjs`, `test/boards.test.mjs`,
`test/door-notes.test.mjs`, `test/persist-roundtrip.test.mjs`. Paste the
summary lines. Browser, against a server on a free port with a distinct
`CDP_PORT`: `--only boards`, `--only stations`, `--only places`,
`--only input`; paste the last line of each; tear the server down and say
the port is dead. One shot of the `boards` scene through `look.mjs`, and
say what it shows.

Known red on main, not yours: `test/machines.test.mjs` "a jaw pays a dig
exactly what a gang would".

### Owns / does not touch

Owns: `src/stations.js` (new), `src/board.js`, `src/input.js`,
`src/shield.js`, `src/upgrades/site.js`, `src/upgrades/rows-*.js`,
`src/tower.js` (its door row only), `src/casino.js`/`src/apothecary.js`/
`src/quarry.js`/`src/farm.js`/`src/scrubhouse.js`/`src/outhouse.js`/
`src/shack.js` (their door rows only, if any live there), `test/gates.test.mjs`,
`ARCHITECTURE.md`, `DESIGN.md` (the one section), `TODO.md` (the one
entry). Does not touch: `src/state.js`, `src/persist.js`, `src/beats.js`,
`src/game.js`, `src/hooks.js` (read `__rows` etc.; if a hook must change,
say so and make the one-line change), `src/world.js`.

Branch: `second-pass-S`. Commit title: `A station is a row in a table,
and the gates are its columns`.

---

## Track I: invalidation is not a thing every line does

Seam 6 of "The second pass" (DESIGN.md). Base: `worktree-invalidation` on
origin. Nothing the player sees changes.

### What exists, measured

- `S.dirty = true` is written on 216 lines across the tree. It gates one
  thing: `persist()` (persist.js), which `main.js` already calls on a
  one-second interval and on `visibilitychange`/`pagehide`. One `persist()`
  on a busy yard costs 1.5 ms. The flag saves nothing but the serialize in
  a yard where nothing moved -- and in play something moves every frame.
- `buildShop()` is called from 51 lines. `buildBoard` (shop.js) already
  returns without touching the DOM unless a board's row set changed, and
  the open board is already rebuilt every frame by the shell. The 51 calls
  buy same-frame freshness, which only two things need: a dev hook that
  reads a board straight after a press (`__buy` then `__rows`), and a
  pointer press on a board whose DOM must answer on that frame.
- Those calls are what keep the sim inside the import ring with the shop:
  `pit.js`, `hands.js`, `casino.js`, `intro.js`, `staffing.js`-adjacent
  callers import `buildShop` from shop.js. `node tools/cycles.mjs --path
  src/quarry.js src/shop.js` names each chain.

### The build

1. **`S.dirty` goes.** Remove the field from state.js (it is in
   `EPHEMERAL`), every `S.dirty = true` line, and the `!S.dirty` gate in
   `persist()`. `persist()` keeps its other gates (`fatal`, `staged`,
   `yielded`/tab ownership) and keeps `S.unsaved`. hooks.js's `reload`
   drops its two `S.dirty = true`. If a line was `{ ...; S.dirty = true; }`
   and is now an empty block or a bare `if`, tidy it. A comment that only
   said "and it is saved" goes with the line.
2. **`buildShop()` leaves the sim.** Add `S.shopStale` (boolean,
   `EPHEMERAL`). Every `buildShop()` call in a file that is not
   `main.js`, `shop.js`, `board.js`, `input.js`, `roster.js`, `settings.js`,
   `hooks.js`, `dev.js` or `src/selftest/**` becomes `S.shopStale = true`
   -- or nothing, where the open board's per-frame rebuild already covers
   it (a purchase that changes a row set: the frame will see it). The
   frame drains the flag: in `main.js`, right after `step()` and before the
   draw, `if (S.shopStale) { S.shopStale = false; buildShop(); }`. The
   shell files above may keep calling `buildShop()` directly where a press
   must answer on the same frame; say which calls you kept and why.
   `hooks.js`: `__buy`, `__rows`, `__build`, `__reload` and any hook the
   checks read a board through drain the flag themselves (call
   `buildShop()` first), so a node check that presses then reads sees the
   board it would see in the browser a frame later.
3. **The imports follow.** After 2, no file outside the shell list imports
   `buildShop`. Run `node tools/cycles.mjs` before and after and paste
   both; the goal is that no file under `src/crew/`, and none of
   `quarry.js`, `farm.js`, `rock.js`, `dust.js`, `tower.js`,
   `apothecary.js`, `scrubhouse.js`, `hands.js`, `pit.js`, `casino.js`,
   `levels.js`, `staffing.js`, `game.js` is in a group with `shop.js` or
   `board.js`. If one still is, `--path` names the edge; report it and
   leave it unless it is another `buildShop`/`standRect`-shaped UI call,
   in which case treat it the same way (`crew/assign.js` reads `standRect`
   from board.js -- it now lives in stations.js; repoint it).
4. **`test/invalidation.test.mjs`**, new, node tier: (a) a yard with the
   bench open, a rung bought through `__buy`, `__rows` shows the next rung
   on the same call; (b) a work landing by itself (start a build, `run`
   until it lands, no hook in between) shows on `__rows` after one `run`
   of a frame; (c) `persist()` writes when nothing has changed and the
   blob round-trips (`persist-roundtrip` already covers the shape; this
   covers that the gate is gone). Also: `test/persist-roundtrip.test.mjs`
   is green with `dirty` gone and `shopStale` in `EPHEMERAL`.
5. DESIGN.md: seam 6's paragraph in "The second pass" gets an "as built"
   line; TODO.md's entry says seam 6 built. `ARCHITECTURE.md`: one
   sentence under "The files" for shop.js: the boards rebuild themselves
   on the frame; nothing in the sim calls the shop. No CHANGELOG line.

### The check

`node --check` on every file touched. Foreground, `--test-concurrency=4`:
`test/invalidation.test.mjs`, `test/persist-roundtrip.test.mjs`,
`test/shop-coverage-1` and `-2`, `test/jobs.test.mjs`,
`test/machines.test.mjs`, `test/casino.test.mjs` (or the file about the
handful), `test/beats.test.mjs`, `test/reload.test.mjs`,
`test/stuck-yard.test.mjs`. Paste the summary lines. Browser, against a
server on a free port with a distinct `CDP_PORT`: `--only boards`,
`--only "tap"`, `--only "grow on what they give up"`, `--only casino`;
paste the last line of each; tear the server down and say the port is
dead. One shot of the `boards` scene and one of the `casino` scene through
`look.mjs`; say what each shows.

### Owns / does not touch

Owns: every file with a `S.dirty = true` or `buildShop()` line (the edit
on each is that line), `src/main.js` (the drain), `src/state.js` (the two
list edits), `src/persist.js` (the gate), `src/hooks.js`,
`src/crew/assign.js` (the `standRect` import), `test/invalidation.test.mjs`,
`ARCHITECTURE.md`, `DESIGN.md` and `TODO.md` (the one paragraph each).
Does not touch: `src/stations.js`, `src/beats.js`, `src/upgrades.js`
beyond its `buildShop`/`dirty` lines, anything in `src/render/`.

Branch: `second-pass-I`. Commit title: `The boards rebuild themselves and
the save runs on the clock: nothing in the sim says so`.

---

## Track M: the save floor, and migrations as files

Seam 3 of "The second pass" (DESIGN.md), approved by the owner
2026-09-16 with one shape added: **every migration is its own dated
file, and archiving one is deleting the file.** Base:
`worktree-save-floor` on origin, after track I has landed (both edit
persist.js).

### The floor

**A save this game reads was written by v0.1.1 (2026-09-12, the first
public build) or later.** Every such save carries `build` (`{ version,
hash, date }`, written by `blob()` since wave-desk-sound); a dev build's
stamp is `{ version: '', hash: 'dev', date: '' }` and counts as above the
floor. A save with no `build` at all is below the floor: `load` in
save.js puts it aside under `BROKEN_KEY` exactly as an unreadable blob is
today, `S.broken` says so, and the sheet offers it back as a file -- no
new UI, the path that exists. Nothing is ever silently discarded.

### The shape

1. **`src/migrations/`**, new. One file a migration, named by its date
   and its subject: `2026-09-12-harness-and-boots.js`,
   `2026-09-15-beats.js`, `2026-09-15-three-brews.js`, and so on. Each
   exports one thing:
   ```
   export default {
     since: '2026-09-15',        // the day the shape changed
     says: 'the six story flags became the set of beats',
     apply(s) { ... }            // the raw save object, in place; returns nothing
   };
   ```
   `apply` reads the old fields off `s` and writes the new ones, on the
   raw object, before `restore()` reads a single field. It is the
   paragraph persist.js has today for that migration, moved whole, with
   its comment (to the comment register: what it folds and why, no
   story). It may import config for a constant; it imports nothing that
   evaluates the yard.
2. **`src/migrations/index.js`**: `MIGRATIONS`, the files in date order,
   and `migrate(s)`: runs every `apply` in order and stamps `s.saveV`
   (below). Archiving a migration is deleting its file and its line
   here; the head comment says so, and says the rule for when: a
   migration may go once every save it could apply to is below the floor.
3. **`saveV`**: `blob()` writes `saveV: SAVE_V` (a config constant,
   `config/saves.js`, today `1`). `migrate` skips any migration whose
   `since` is not after the save's own `build.date`... no: dates are the
   wrong key for a dev build with no date. **`saveV` is the key.** A save
   with no `saveV` is "everything before today" and gets every migration
   in the list; a migration written from today on carries `v: N` (the
   `SAVE_V` it raises the save to) and runs only on saves whose `saveV`
   is below it. So the list is: the migrations from 2026-09-12 to today,
   all with `v: 1`, and every future one with `v: 2, 3, ...`. Write this
   rule into the index's head comment.
4. **persist.js**: `restore()` calls `migrate(s)` once, right after
   `load()`, and then reads today's shape and nothing else. Every "a
   save from before X" branch goes: either it is below the floor (the
   renames -- miners, spelunkers, labbers, scrubbers, rifters, cave;
   `OLD_TYPE`, `OLD_JOB`; `research`/`research2`; `hatShelf`; `labDone`;
   the clock-stamped `wonAt`; `mult` and the `lab*` works; `coreLoose`
   guessing; `scholars`; anything else whose commit is before
   2026-09-12 -- `git log -S` the field to date it) and is deleted, or it
   is on or after the floor and moves to a migration file. The two lines
   that derive a flag from a count (`introDone || crew > 0` and the
   like) are migrations too. `migrateApothecary` in apothecary.js
   becomes `2026-09-15-three-brews.js`; `noticeMigrated` and its
   catch-up become `2026-09-1x-notices.js` if on or after the floor,
   else go. `restore()` after this is today's fields only; say its
   length before and after.
5. **state.js**: the retired fields go -- `brewLevel`, `doseCarryLevel`,
   `potPrefer`, `mult`, `scholars`, `noticeMigrated`, `labLeft` if still
   there, and any other field whose only reader was a migration. Every
   removed field leaves the three lists. `persist-roundtrip` is the
   check.
6. **The fixtures**: every file in `test/fixtures/` with no `build`
   stamp (`player-yard.json`, `stuck-yard.json`, `shack-stall.json` at
   least) is loaded ONCE by the tree as it stands before your deletions
   (the base commit: `git stash` is not allowed; use `git worktree`-free
   means -- `git archive origin/worktree-save-floor | tar -x -C
   <tmp>` and run there), saved by `persist()`, and the blob written back
   over the fixture in today's shape with a `build` stamp. The checks
   that read those fixtures must stay green and must still assert what
   they assert (read each; if a check's premise was the old shape, say
   so). Commit the re-saved fixtures in their own commit, first.
7. **`test/save-floor.test.mjs`**, new, node tier: (a) a save with no
   `build` is refused: after `restore()` the yard is fresh, `S.broken`
   is true, and the blob is under `BROKEN_KEY` byte for byte; (b) a save
   with a dev stamp and no `saveV` loads and gets every migration (build
   one from a fresh yard's blob, strip `saveV`, set the pre-migration
   fields for two of the migrations, restore, assert the new fields); (c)
   a save with `saveV: SAVE_V` gets no migration (a migration with a
   counter in a test-only list, or `migrate` returning the list it ran);
   (d) `MIGRATIONS` is in date order and every `v` is `<= SAVE_V`.
8. `docs/saves.md`, new, short: the floor, the `saveV` rule, how to add a
   migration (one file, one line), how to archive one, and the date of
   the floor. `ARCHITECTURE.md` gains a line for `src/migrations/`.
   DESIGN.md: seam 3's paragraph gets "as built"; TODO.md's entry says
   seam 3 built. CHANGELOG.md, under **New this release**: one line --
   saves from before the first public build are no longer read, and are
   offered back as a file.

### The check

`node --check` on every file. Foreground, `--test-concurrency=4`:
`test/save-floor.test.mjs`, `test/persist-roundtrip.test.mjs`,
`test/reload.test.mjs`, `test/stuck-yard.test.mjs`,
`test/pit-edge-stuck.test.mjs`, `test/shack-stall.test.mjs` (if it
exists; else whichever check reads that fixture), `test/beats.test.mjs`,
`test/three-brews.test.mjs`, `test/apothecary.test.mjs`,
`test/save-import.test.mjs`, `test/jobs.test.mjs`. Paste the summary
lines. Browser, against a server on a free port with a distinct
`CDP_PORT`: `--only "saves page"`, `--only settings`, `--only "load a
save"` (whichever groups exist about the sheet's save/load); paste the
last lines; tear the server down and say the port is dead.

### Owns / does not touch

Owns: `src/migrations/**` (new), `src/config/saves.js` (new),
`src/persist.js`, `src/save.js`, `src/state.js`, `src/apothecary.js`
(`migrateApothecary` and its callers only), `src/notices.js` (the
catch-up only), `src/report.js` (fields that go), `src/hooks.js` (fields
that go), `src/selftest/**` (readers of fields that go), `test/**`
(fixtures and readers of fields that go), `docs/saves.md`,
`ARCHITECTURE.md`, `DESIGN.md`, `TODO.md`, `CHANGELOG.md` (the lines
named). Does not touch: anything under `src/render/`, `src/crew/`,
`src/stations.js`, `src/beats.js` (import `BEATS` if the beats migration
needs the key list).

Branch: `second-pass-M`. Commit title (the second commit; the fixtures'
re-save is the first): `The save floor is the first public build, and
every migration is a file`.
