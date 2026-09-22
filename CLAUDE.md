# Working on Boulder Clicker

Black-and-white pixel clicker. Vite + vanilla ES modules, canvas, no frameworks
and no new dependencies. This file is the working agreement: the things that
have been said more than once, written down so they do not have to be said
again.

Read `ARCHITECTURE.md` before changing anything — it says which file owns what.
Read `TODO.md` before proposing work — every open item carries its diagnosis and
its blocker, so none of it has to be re-derived. `DESIGN.md` carries the
reasoning behind each feature, with sections marked `(built)` or
`(design, not built)`.

**Every bug fix gets a line in `CHANGELOG.md`, under `Unreleased`, in the
same commit as the fix** -- one short sentence, in the player's words, naming
what is fixed, **ending with the check that would go red again, in
parentheses** -- `(test/reload.test.mjs)`. No symptom story, no mechanism;
that goes in the commit message. Never write a version number there;
`npm run release` stamps the heading with the version and the date.
Features get one line each under **New this release** at the top of the
section, nothing longer; their reasoning stays in DESIGN.md. A fix with no check to name is a fix that will
be reported again; a player's save goes in `test/fixtures/` and the check
goes red before the fix is written (see "The save is the fixture").

---

## The loop

**Look first.** Most changes here are *drawing*, and neither test tier can see a
drawing. `node tools/look.mjs <scene> --zoom 4` sets the yard up, runs a second
of it and writes a png to `shots/` in a few seconds. There are ninety
scenes, one for every part of the game — `crew`, `quarry`, `farm`, `rock`,
`yard`, `boards`, `belt`, `rift`, `endgame`, `scrubbing` and the rest; the list
is `SCENES` in `src/scenes.js`, grouped by the part each is about, and
`node tools/look.mjs --list` prints it. Several can be named at once,
comma-separated. It needs a dev server — pass `GAME=http://localhost:<port>/`.
The same list is drawn as buttons on the dev panel's `scenes` tab (backtick) in
a dev build, so a scene written once is a button and a shot the same day. Add a scene rather
than hand-driving the same setup twice.

For the **spot check after a large change**, `scenes.html` is the scene bench:
the game in a frame with every scene down the side -- a filter, `[` and `]`
to step through them, `r` to stand one again, and the scene in the address
(`/scenes.html#endgame`). The frame is staged from boot, so it never touches
the save in the game's own tab.

For anything on a **board**, `cards.html` is the card bench: it draws rows
from plain objects through the real builder and stylesheet, no yard behind
them, so a card at its worst bill is a five-second shot
(`GAME=http://localhost:<port>/cards.html node tools/headless.mjs --shot out.png 1`).
The game itself is `play.html` (`index.html` is the landing page); a `GAME`
naming only the server gets `play.html` appended by the tools.
Use it before `look.mjs` for any change to a card's shape.

For the shelf's **glyphs**, `glyphs.html` is the glyph editor: pick a drawing
(red ones the inventory, `docs/glyphs.md`, names and nobody has drawn), paint
it on the grid, and it is shown at one, three and six times, in its four rung
strokes, and on every row that borrows it with that row's badge. Edits live in
the browser and a dev build reads them, so `shelf.html` and the game show them
on the plank at once; "copy" hands back the line for `GLYPHS` in `glyphs.js`,
which is where a finished drawing goes.

For anything about what a **ladder** costs or is worth, `ladders.html` is the
ladder book: every ladder on every board climbed rung by rung -- bill, work,
from/to -- read off the real rows, with the `TUNABLE` knobs beside it so a first
cost or a unit a rung can be moved and every table re-reads. It copies out what
you changed as config lines.

Iterate against a shot, not against a suite. A four-minute run that cannot tell
you whether a hat is on straight is pure latency.

**Then one test file, if any.** Run the one or two files that cover what you
changed and nothing else. If you cannot name which file would go red, working
that out is the job — it is not a reason to run all of them. Files that merely
live near the change are not covered by "the files covering the change".

**The budget for full suites, while the work is in flight, is zero.** Not one at
the end, not one before landing. The full suite has exactly one home: **main,
after the merge** — kick off both tiers there in the background, once, and
report what they say. A red result there is a fix on main, not a reason to have
run it earlier.

**One sweep of a tier at a time, on the whole machine.** `npm test` and the
`test:browser*` scripts go through `tools/sweep.mjs`, which refuses (exit 3)
when another sweep of that tier is running and says whose it is. That refusal
is the answer, not an obstacle: run the file or two that cover the change, or
read the running sweep's result when it lands. `--wait` queues behind it for
the one legitimate case, a landing on main behind somebody else's. Never
hand-type the sweep to get around it.

Never re-run a suite on a tree that has already passed it. A fast-forward merge,
a commit, a push, a line-ending fix — none of those change the answer. A
prose-only edit (DESIGN.md, a comment, a commit message) needs no run at all. A
drawing-only edit needs no run either: no test in either tier can see a sprite,
a color or a position, so a green suite is not evidence the change is right. The
shot **is** the check.

A flaky failure gets one targeted re-run of its own file, never another sweep.

**Do not build the thing twice.** For a control or a visual with more than one
reasonable shape, put the options to the user before building one — a shot is
the cheap way to show them. A removal ("scrap X") is a grep-survey-then-delete
job, not an iterate-and-check one.

---

## The two test tiers

`src/game.js` is the simulation frame (no DOM), `src/hooks.js` the dev handles
both tiers share, `src/report.js` the yard's `snapshot()`, `src/main.js` the
browser shell. `src/console.js` hangs the handles and the suite on `window`
behind `import.meta.env.DEV`, so none of it ships.

| tier | what it covers | how |
|---|---|---|
| **node** (`test/*.test.mjs`) | everything about the yard | `node --test test/<file>.test.mjs`; the whole tier is `npm test` — ~100s |
| **browser** (`src/selftest/`) | only pointer, DOM, board and canvas | `node tools/headless.mjs --only <group>` — seconds |

**Never run `node --test` on more than a few files without `--test-concurrency=4`.**
Bare `node --test test/*.test.mjs` spawns one worker per file up to the core
count — sixteen yards at once on this machine, and the CPU pinned at 100% for
the user sitting at it. The npm scripts carry the cap; a hand-typed sweep must
too. `tools/test.mjs` caps the browser shards itself.

New checks about the yard go in the node tier, as their own feature file. Only
checks that need a real pointer, board or canvas go in the browser one.

Every group in the node tier is also a reload check and a rules check
without saying so: `run()` saves and reads the yard back every five game
seconds and asserts nothing teleported (`reloadCheck` in `test/helpers.mjs`),
and `fast` asks every rule in `src/verify.js` after every frame. A check
that goes red on a frame it never mentions is one of those two speaking,
and the fix is in the game, not the check. A run that a mid-run save would
spoil sets `RELOAD=0`. The rules are cheap to add — a rule is the way to
say "this must never be possible", and it is watched by every group at once.

Every group in both tiers starts from a fresh game — never write one that
depends on its neighbor. Never `await sleep()` to wait for the game: turn its
clock with `run(s)` / `runUntil(fn, limit)`, in *game* seconds, so a check is a
fact about the game rather than about how fast the machine is. Wall time is the
slowest single file, so split a file before optimizing anything else.

Other handles:

```
node tools/unresolved.mjs                  # names a module uses but cannot see
node tools/headless.mjs "__state().gw"     # one expression, against the game
node tools/headless.mjs --shard 2/6        # a sixth of the browser groups
node tools/test.mjs                        # the browser groups in parallel
node tools/node/break-perf.mjs [s] [tune]  # the driven endgame yard, frame by frame
node tools/node/carters.mjs [s] [--crew N]  # the carters against fed heaps and finds, a row a scenario
node tools/node/file-times.mjs [name...]   # wall time per node-tier file, slowest first (a sweep: once, on main)
node tools/node/rank-prof.mjs <cpuprofile> # a --cpu-prof ranked by self time
```

**A slow file is profiled, not read.** Every file that has taken minutes here
was a hook doing something a million times -- `__give` past the brim,
`seedPitCores` on a full hole, a snapshot taken every frame -- and from the
source each read as an honest sim run. `node --cpu-prof --test test/<file>`
then `rank-prof.mjs`: one line at forty per cent is the answer, and it is
fixed in the hook or the report, not by shortening the check.

**Buy it like a player.** At least one check per feature must reach the feature
the way a player does — through the shop row, the click, the walk — not by
setting the state with a `__` hook. The hooks are for the setup a check is *not*
about (`__crew`, `__fullSites`, `__grant`, `__levels`); the thing the check *is*
about goes through `__buy`, `__clickLever` or the pointer. The conveyor belt
shipped with four green checks and had never once been bought; done the player's
way, the purchase raised a lever-ask nothing could answer.

**The save is the fixture.** When the user reports emergent misbehavior
("workers are stuck"), ask for their save before building synthetic repros —
`save a copy` on the settings sheet (the save lives in IndexedDB on the web,
so `localStorage.getItem('boulder-clicker/v4')` is empty there; in the node
yard it is still that key). The stuck-yard bug was seven
defects stacked; hours of synthetic scenarios reproduced none of them and the
save reproduced all of them in one load. Load it in the node yard with
`localStorage.setItem('boulder-clicker/v4', raw); yard.restore()`, keep it as
`test/fixtures/*.json` with a check asserting the outcome (see
`test/stuck-yard.test.mjs`), and trace one body per hypothesis with a per-frame
line log — the claim, route and way fields tell the story.

---

## Anything drawn

**Pixels are the ground truth.** When something drawn looks wrong, measure the
rendered pixels; never settle it by reasoning about coordinates. Ask the page
for the object's exact screen position, take a shot, crop tight around that
point, and compare the drawn extent against the expected center. The core glow
took four attempts because every round the arithmetic was proved correct and the
bug was elsewhere in the same function.

Two traps that keep recurring:

- `fillRect(x, y, w, h)` takes a **top-left**, not a center. Passing a center
  puts the shape half its size down and right. This is *the* drawing bug here.
- After several edits to one function, print the live body and read it before
  concluding anything — a fix gets clobbered by a later edit to the same block.

**To read a counter out of a module from a headless page, publish it on
`globalThis` from inside the module.** Do *not* reach it with
`await import('/src/foo.js')`: once the file has been edited, vite serves that
dynamic import with a cache-busting query, so you get a second module instance
while the app keeps the one from page load. Every reading comes back 0 and it
looks like "the code never runs". Strip the `// TEMP` lines before committing.

The sim does not advance on its own under headless rAF — one sim frame is
`window.__fast(1/60)` then `await` one `requestAnimationFrame`. Scene shots are
not byte-deterministic: compare them by looking, never by hash.

For frame cost, run before and after on the same seeded scene, quiet, twice, and
take the minimum (PERF.md section 0). On this machine, with other agents
running, 25–40 ms frames show up on main and on the branch alike — that is
contention, not the game. Profile with `--cpu-prof` and rank by self time before
believing a code-reading guess: the endgame pass's guess was worth a
millisecond, and the real spike was `addGrain` searching the whole floor.

---

## House style

- **`config.js` owns every number. `state.js` owns every fact that changes.**
  Modules own behavior. A magic number in a module is a bug in this codebase.
  Neither of those two files has logic in it, so both are cheap to read and
  rarely a merge conflict.
- **Comments say _why_,** in plain sentences, and are worth more than the code
  they sit over. Look at `air.js` or `roster.js` for the register. Never write a
  comment that restates the line under it.
- **American English** — "center", "color", "behavior", "toward" — in comments,
  prose and commit messages.
- Black and white only, flat shapes, no gradients, no textures. Everything sits
  on the `P = 6` cell grid; half a cell off puts a hairline through the picture.
- **Every new field on `S` goes in one of state.js's three lists** (`SAVED`,
  `SAVED_BY_HAND`, `EPHEMERAL`); `test/persist-roundtrip.test.mjs` is red for a
  field in none of them.
- **Painting order in `render.js` is the whole trick.** It is the `LAYERS`
  list now; moving an entry is a visual change, not a tidy-up.
- `dev.js` (backtick opens it) is the panel most of these numbers were actually
  found with. A new knob is one `export let` in `config.js` plus one line in
  `TUNABLE`.

### Fix the system, not the instance

When something is wrong in one place, ask whether the mechanism can be right
everywhere instead of patching that place. A menu row's text once overlapped its
price; the fix offered was a per-key CSS width, in a file that already held nine
hand-cut column widths and two per-key exceptions — the same bug patched five
times. A guessed constant cannot be right about content nobody has written yet,
so every guess is a future bug with a name on it.

Prefer a measured or derived value over a tuned one (`max-content` and subgrid
over em widths; a rule asserted directly over a threshold on a noisy statistic).
When two things cannot share a mechanism, that mismatch is usually the real
defect. Say which premise made the old workaround necessary, and whether it
still holds.

### Nothing teleports

Every body walks to every destination. Nothing pops in, nothing pops out,
nothing appears where it is wanted. The whole game is watchable cause and
effect; a number that changes without a body crossing the yard breaks the one
thing that makes the place read as a works with people in it rather than a
spreadsheet with a picture on top.

Adding a station requires two things, neither optional:

1. Add the job to the `want` map in `syncWorkers` (`crew.js`). A job missing
   from there has a count on the boards and no bodies in the yard — `room[w.type]`
   comes back undefined and every body of that type is stood down on the frame
   it is made.
2. Make the station's output depend on bodies **through the door** (`inScrub()`,
   `inLab()`), never on the assigned count, or the walk is decoration.

### Systems a new station joins unasked

These are a given, not a follow-up request:

- **The pile-full mark.** A station with a strip in `S.piles` gets a warning
  triangle from `drawPileMarks`, placed by `pileMarkAt`, with the tooltip in
  `input.js`. `pileMarkAt` derives the spot from the station or the strip, so a
  new station is covered automatically — but check it.
- **Per-cell variation.** No flat fills. Sky motes pick a tone from their kind's
  palette in `SMOG_TINTS` plus an `ink` weight; ground dust uses `shadeNear` in
  `grid.js`, or `depthShade` where the darkness means something. One tone across
  a heap or a band reads as printed paint, not as material.

---

## Design before code

For anything larger than a fix, **write the design down and stop for approval
before writing implementation code.** The design lands in `DESIGN.md` (the
`(design, not built)` sections are the convention), plus a short status entry in
`TODO.md`, committed on its own and presented for approval.

The designs here carry the reasoning — the bargain a feature strikes, what it
costs the player, which rule it must not break — and that is the part worth
arguing about. Code written before that is settled is code written against the
wrong bargain, and the features here are big enough that finding out afterward
is expensive. Ask the two or three calls that genuinely change the shape of the
work up front; do not survey every option.

---

## Worktrees, servers and waves

- **Port 5183 is the user's own game and its save. Never point anything at it.**
  Tests run against 5184 (`bun run dev:test`).
- **Your own worktree, always.** Never enter or `cd` into an existing worktree
  another agent created. If cwd is already under `.claude/worktrees/` but the
  tree holds uncommitted changes you did not make, do not build on it — say so
  and make a fresh one. "Already isolated" does not mean "yours".
- **A worktree has no `node_modules` of its own.** Start its server with the
  root's binary, on a port nobody else is using:
  `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <n> --strictPort`.
  Confirm it is serving *this* checkout before trusting a run
  (`curl -s localhost:<n>/src/<changed file> | grep <new symbol>`), then point
  the suite at it with `GAME=http://localhost:<n>/` and a distinct `CDP_PORT`.
- **Tear down every server or background process you started** before reporting
  done, and verify the port is dead. Leave alone anything that was already
  running. A stale server from another checkout silently answers on the port the
  browser suite targets, so it reports passes for code that was never tested.
- **Landing work:** the `worktree-to-main` skill — ExitWorktree, then
  fast-forward main in the shared checkout.

### Waves

A large change is partitioned into tracks with **disjoint file ownership** and
built by parallel subagents. `docs/wave-crew.md` and `docs/wave-feedback3.md`
are the two worked precedents; copy their shape:

- The spec document is **canon**: "do not redesign; implement". Where a number
  or a name is written, use it. A track that finds an item impossible says so in
  its report rather than inventing a different feature.
- An ownership table with *owns* / *additive-only* / *do not touch*, disjoint. A
  track may **call** another track's existing exports freely; only the owner
  edits a file.
- `config.js`, `main.js` and `selftest.js` are shared and additive-only —
  constants appended in one block at the end of the file under a comment naming
  the track, new checks inserted at a named anchor and nowhere else. Conflicts
  there are expected, and keeping each edit to one block is what makes the merge
  cheap.
- Named checks with their exact insertion anchors, decided in the spec.
- A fixed report shape: deliverables one line each, files touched, the **actual
  pasted output** of the test run, what the agent had to decide that the
  document did not, and anything it believes is wrong with the design that it
  implemented anyway.

Two harness facts, each of which cost a full launch cycle:

- **A subagent inherits the parent session's worktree pin.** Read/Edit/Write
  cross the boundary but every Bash command is refused, so the agent cannot run
  tests or git. Launch wave agents with `Agent({ isolation: "worktree", ... })`
  and make each one's *first* command
  `git fetch origin && git reset --hard origin/<spec-branch>`, so it starts from
  the committed spec rather than from the harness's base ref. Have each push to
  a distinct branch and merge from there. Pre-creating worktrees with
  `git worktree add` is wasted effort under this harness.
- **Tell agents to run tests in the foreground.** An agent that launches a test
  with `run_in_background` and then "waits" ends its turn and is stopped.

---

## Decided, do not relitigate

- **Sparks (red, ✚) are the machines' currency, end to end.** They buy every
  machine, every rung of each machine's three-rung ladder, and they tear and
  widen the rift. The machines' ladders were endless and are not since
  2026-09-22: `MACHINE_TUNE_SPARKS` is a written table, the row carries pips
  and an end like every other row, and the rift's throughput is the endless
  red sink (DESIGN.md, "A machine's ladder ends"). The paint store in DESIGN.md is a *secondary* plan for the
  same resource, not the primary sink. The pit press (`packpile`) is cut.
- **The sky is beatable, but only if you invest.** A yard running all three
  machines should still rain on you if you ignore the scrubbing house, and
  should come under control once you buy into it. Balance goes through the fan
  ladder and the scrubbing house — no new plant or greenery sink, and no
  fully-invested yard that goes permanently clean. An upgrade that quietly
  cleaned the sky would be a number you buy once and never think about again;
  the sky is meant to stay a live decision.
- **A ladder is two rungs a coin, on every board -- eight rungs, the same
  eight everywhere.** One card; `TIER_BAND` rungs to a band (two, since
  2026-09-14; `LADDER` is eight -- never write the number, write the
  constant), the bill deepening band by band in the order the yard hands out
  its coins: **dust only, then dust and crops, then dust, crops and ore, then
  crops, ore and a spark.** Never the core: nine exist and they open places.
  The first rungs are cheap and dust-only so an early yard can buy them; the
  ladder gets dear in the coins the station has started spending, and the last
  band is the spark's on the bench as at the grounds -- on the same card,
  climbing the same field, never a card of its own. **Every ladder is a
  written table** (`LADDERS` in `config/rungs.js`: a value for the foot and
  one a rung, in the row's own unit, and a dust cost a rung -- carry 1, 2, 3,
  4, 6, 8, 10, 12, 15); no
  unit-a-rung constants, no base-and-top, no first-cost-and-rate (DESIGN.md,
  "A rung is a step up"). The ladder book edits it a rung at a time.
  The tower's and the machines' spark ladders are outside this rule by the
  decision above -- they are short written tables of their own, not `tierRows`
  bands, but they do end and they do carry pips. Build every new ladder through `tierRows` with `named`
  bands; a flat row with one bill from rung one is the old shape and a bug.
  See DESIGN.md, "Every ladder is sold in bands".
