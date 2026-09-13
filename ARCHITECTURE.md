# Where things live

Read this before changing anything. It says which file owns what, so two people
— or two agents — can work at once without meeting in the middle.

## The rule

**Modules own behaviour. `state.js` owns the facts.**

Everything that changes while the game runs is a field on `S` in `state.js`.
Everything that decides how it looks or plays is a constant in `config.js`.
Neither file has any logic in it, so both are cheap to read and rarely a merge
conflict.

If you are adding a feature, you are almost always adding **one file** plus a
field or two on `S` and a constant or two in `config.js`.

## The files

| File | Owns | Safe to change alone? |
|---|---|---|
| `config.js` | every tunable number — a barrel over `src/config/`, one file per feature; add a constant in the feature's file, never here | yes — no logic |
| `state.js` | every mutable fact, plus the two sand grids and every site's rect — and `SAVED` / `SAVED_BY_HAND` / `EPHEMERAL`, which say what a reload keeps | yes — no logic |
| `grid.js` | the falling-sand rules, and nothing that knows what sand is *for* | yes |
| `painter.js` | drawing a sand grid through a scratch canvas | yes |
| `world.js` | where the sites stand; which ground is spoken for | changes coordinates for everyone |
| `rock.js` | making a rock, standing it, hitting it, what comes off | yes |
| `quarry.js` | the open cut, and the crew working its floor | yes |
| `farm.js` | the plots, and farmhands tending them | yes |
| `lab.js` | the research, who works it, and the multipliers it pays out | yes |
| `dust.js` | a chip in the air: where it is aimed and how it flies | yes |
| `pit.js` | the hole: banking, capacity, spending, its paint buffer | yes |
| `core.js` | the thing buried in each rock | yes |
| `crew.js` | the crew — a barrel over `src/crew/`; a worker type is one file there plus a row in the `JOBS` registry (`src/crew/jobs.js`) | yes |
| `air.js` | the dust hanging in the yard: three bands of it, at three distances, and its colour over each site | yes |
| `roster.js` | the crew count and its two buttons under each station | yes |
| `weather.js` | the clouds and the birds, far behind everything | yes |
| `audio.js` | the sound: the only file that names an `AudioContext`. Modules name the event (`sfx('rock-hit', { x, hard, big })`) and it decides what survives the fold window, the ceiling and the voice cap; `SOUNDS` in `config/sound.js` maps each event to its class and a recipe in `RECIPES` (or null: counted, silent), a strike is that recipe rendered sample by sample into a buffer, the same arithmetic as the hit bench, and there is no bed of any kind. The dev panel's `sounds` tab lays the bench's mapping JSON over the table live (`applySounds`). The decision half runs with no context, which is what `test/sound.test.mjs` holds; every number is `SND_*` in `config/sound.js` | yes |
| `upgrades.js` | the economy (`buy`, `rebalance`, lending); the rows themselves are data files in `src/upgrades/` | yes |
| `shop.js` | turning those rows into a board | yes |
| `board.js` | the one menu: where it stands, and the counter above the pit | yes |
| `tween.js` | a count on its way: every number drawn -- the card, a purse, a roster, a price -- is read through `shown(name, value)` and runs to its value instead of jumping | rarely |
| `raise.js` | the call to build the bench: the row it is finished under, and what pressing it does (the button itself is seated by `board.js`) | rarely |
| `hands.js` | what a click, a drag and a flick do | yes |
| `input.js` | events to calls, and nothing else | yes |
| `render.js` | the `LAYERS` list — painting order as data, one entry a line, every draw body in `src/render/` | the **order** of the list is the picture |
| `persist.js` | reading and writing the game; plain fields come off `SAVED` in state.js in one loop, hand-encoded ones stay here | a field in no list is a red test |
| `main.js` | the frame order and the browser's hooks | small; touched by most features |
| `save.js` | the store seam: localStorage on a page, `window.desk` in the shell, and the guard, fallback and migration over both | rarely |
| `crash.js` | a throw: the stopped sheet, the save offered out of it, and the `S.fatal` flag that stops `persist` writing after one | rarely; imported first by `main.js` on purpose |
| `selftest.js` | the order the browser groups run in; the checks themselves are in `selftest/`, one file to a subject | grows with every feature |

## Adding things

**A new upgrade.** One object in `UPGRADES` in `upgrades.js`, one key in
`SECTIONS`. Every field is a function of the current game, so a row never holds a
stale number. Nothing else changes — the board builds itself from the list.

The bench works the same list out loud: `canAfford` and `unseenSection` in
`upgrades.js` are what decide whether the call to build one goes up (`raise.js`)
and which mark it then wears, so a new row or a new section is picked up without
touching them.

**A new job for the crew.** One file in `src/crew/` for the work, one row in
the `JOBS` registry in `src/crew/jobs.js` (`factory`, `want`, `step`), the words
in `src/jobs.js`, the count on `S` and in `SAVED`, a shape in `drawWorkers`.
`syncWorkers` and `FACTORY` read the registry, so nothing else changes.
`S.haulers` is never assigned anywhere but `rebalance()` — it is whatever is
left over once every job has taken its share.

**A new plot of sand** — a farm plot, say. `grid.js` takes any object of
the shape documented at the top of it, with optional hooks:

```
blocked(c)                    columns dust may not settle in
ceiling(c)                    how high a column may stand
onPut(c, r)                   told about every cell written
repose                        heaps stand up instead of spreading flat
spillsInto(x), spillsAt, spill(x, y, v)    where a heap topples over an edge
painter                       a makePainter(), with its mark as the onPut
```

That is four lines and an object, not another copy of the sand rules. See
`wireGround` in `main.js` and `wirePit` in `pit.js` for the two that exist.

**Any grid big enough to matter needs two things**, and both are easy to forget
because the game is fine without them until it suddenly is not:

- a **painter**, or it is drawn a grain at a time
- **`settleSome(b, SETTLE_BUDGET)`** rather than `settle(b)`, or the sand rules
  walk every cell every frame

The ground holds a hundred thousand cells and the pit a million. Walking either
one every frame was, measured, the most expensive thing in the game — a heaped
yard put the frame over budget on its own. Settled in bands the cost is flat
whatever is lying about, and the sand slumps a beat behind itself, which nobody
can see.

**A new site.** Four of them went in this way and it held up every time:

1. a distance from the rock and its own tuning numbers in `config.js`
2. its rect and its state in `state.js`, its placement in `layout` in `world.js`
3. one new file for the behaviour
4. a hire row via `crew({...})` in `upgrades.js`, and an unlock row priced in cores
5. a `draw` in `render.js`, in painting order, and a step in `main.js`
6. its fields in `persist.js` — nothing warns you if you forget
7. checks in `selftest/`, in the file for the subject

Sites are placed by their distance from the rock, so adding one moves nothing
else. Unlocking one should `lookAt()` it: it is several cores and a row in a
menu, and the thing bought is off the left of the screen.

**Anything that piles up is a cell in a plot.** Dust, shards, spores, sparks and
cores are all values in the same grids, told apart by `isDust` and by the mark
drawn on them. Do not give a new one a physics of its own: it was tried, and the
rules the two systems did not share — the ceiling, the lattice, the angle of
repose — were each a bug, found one at a time.

**A new currency.** A line in `MARK` and one in `purse` in `upgrades.js`, a
branch in `buy`, a mark in the stylesheet, a shape in `render.js`, and a row on
the counter. Five exist; each has exactly one job, which is the rule worth
keeping.

## Two things to be careful of

**Painting order is the whole trick** in `render.js`, and since wave 5 it is
one list — `LAYERS`, an entry a line, read top to bottom as the painting order.
The ground line goes down first so the rock stands in front of it; the crew and
the spoil go over the rock; the pit is blitted from its own scratch canvas
rather than drawn a grain at a time. Moving a line in that list is a visual
change, not a tidy-up; a new feature adds its entry at the right depth.

**Every new field on `S` goes in one of state.js's three lists** — `SAVED`
(a plain copy), `SAVED_BY_HAND` (its code in `persist.js`), or `EPHEMERAL`
(thrown away on purpose). `test/persist-roundtrip.test.mjs` goes red for a
field in none of them, which is the warning persist.js used to owe you.

## The scenes

`scenes.js` is the one list of scenes: every part of the game stood up fresh
from the `__` handles, keyed by name, each saying which part it is about
(`ABOUT`) and why it is set up the way it is. Two things read it and neither
keeps a list of its own: `tools/look.mjs` shoots one by name through
`window.__scene`, and `scenesheet.js` -- imported from main.js's dev block,
beside `dev.js` -- draws a button per scene under a heading per part on the
dev panel's `scenes` tab (`devPane` in dev.js hands out a tab by name; the
panel is `yard`, `dials`, `scenes`, `frame`). A scene never touches the
player's save: the first press keeps the store's blob aside, `S.staged` stops
`persist()` writing, and `my yard` on the tab puts it back. Nothing of it
ships.

## The desk

`electron/` is the desktop shell, and the rule is that the renderer is the web
build, unchanged, plus one adapter: nothing under `electron/` imports from
`src/`, and nothing in `src/` reaches the shell except `save.js` (the store
seam) and `settings.js` (the two dialog branches). `main.cjs` opens one window
and answers five IPC calls; `preload.cjs` puts those five on `window.desk` --
`read`, `write`, `exportTo`, `importFrom`, `version` -- and nothing else
crosses, no path included; `store.cjs` is the save on disk, plain Node so
`test/desk-store.test.mjs` can point it at a temp directory. It keeps
`current.json` beside `last-good.json` under `userData/saves/`: a write goes to
a temp file and is renamed over, and the save that was `current` before is
promoted to `last-good` only after the new one has been read back whole.

Running it: `VITE_DEV_SERVER_URL=http://localhost:5183/ bun run desk` opens the
shell against the dev server (any port; 5183 is the user's own game); `bun run
desk` alone loads `dist/`, so `bun run build` first. `bun run desk:build`
builds `dist/` and packages it into `release/` with electron-builder (the
`build` block in package.json; `tools/desk-build.mjs` stamps the day as the
version the tool insists on, since the project keeps no version number), and
`tools/publish.mjs` builds and pushes `dist/` to itch's `html` channel with
butler (the game played on the page), or with `--desktop` the portable from
`release/` -- it refuses to run without `ITCH_TARGET`.
`dist/build.json` is written by `vite build` so `desk.version()` and the page's
`__BUILD__` stamp are one build.

## The dev panel

`dev.js` is a panel of buttons and sliders over the top right of the yard:
backtick opens and closes it, and it remembers which. Crew by job, currencies,
sites, which boulder, running the clock on a few seconds at a time, and sliders
for the numbers most worth arguing with -- the zoom, the slope of a pile, what a
pile holds, every pace in the game.

It exists because most of the numbers here were found by sitting with the game
and pushing them about, not by working them out. The tunable ones are `export
let` in `config.js` rather than `const`, and modules import the binding rather
than a copy, so moving a slider changes the game in the same frame. `TUNABLE`
lists them and the panel builds itself from that list, so a new knob is one line
in `config.js`.

It is loaded behind `import.meta.env.DEV`, which is a constant at build time, so
a build drops the import, the file, and the whole tunable list with it. Checked:
`devrow`, `dev-open` and `TUNABLE` appear nowhere in `dist`.

## Checking your work

```
node tools/unresolved.mjs     # names a module uses but cannot see
node tools/headless.mjs       # runs __test() in a headless browser, no install
node tools/headless.mjs "window.__test('quarry')"    # one group, seconds not minutes
node tools/listen.mjs         # every voice through audio.js to shots/sound/*.wav, measured
```

**Checks run the clock rather than sit through it.** `clock.js` is the only thing
in the game that knows the time, and `__fast(seconds)` turns its handle by hand:
twenty seconds of yard in a few milliseconds, and the same twenty seconds every
run. `run(s)` and `runUntil(fn, limit)` in the suite are the two ways to use it,
and the limit is in *game* seconds, so a check is a fact about the game rather
than about how fast the machine is. Anything that waits on the DOM or on a real
pointer still sleeps; nothing else should.

That is worth more than the speed. Sleeping checks were failing about half of
all runs, and every one of those failures was the same real bug wearing a
different hat. `__test()` reports its slowest
groups; when one of them grows, it is almost always a check sitting through
something the game does slowly on purpose — a walk the length of the world, a
plot ripening, a wizard floating the length of the sky. `__place(type, x)` stands a body
where it is needed and `__levels({...})` buys the pace, which is how those get
back under a few seconds without testing anything less.

Then open the game and run `__test()` in the console — 143 checks covering the
layout on seven screen sizes, mining, the crew, every site, the pit, spending,
touch, saving and both boards. It resets the save first, so run it on a game you
do not mind losing.

Dev hooks: `__state() __give(n) __spend(n) __grant({shards,spores,cores})
__crew(miners,workers,quarriers,farmhands,labbers,wizards) __levels({...})
__lab() __meteor() __wizardHat(n) __brew() __board(name) __jump(n) __next()
__drop() __pile(x,n)
__clearFloor()`.

**Balance by measuring, and measure a plausible game.** `__levels()` and
`__crew()` exist for that. A measurement taken on a fresh save reads as ten to
fifty minutes a rock, because nothing has been bought, and will send you off
rewriting the wrong thing.
