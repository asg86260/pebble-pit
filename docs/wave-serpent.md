# Wave: the serpent -- the second half, in the deep

**This document is canon. Subagents: do not redesign; implement.** Where a
number or a name is written here, use it. Where this document is silent, the
design is "The serpent: the second half of the game" at the end of
`DESIGN.md`, which is also canon. If something turns out to be impossible, say
so in your report rather than inventing a different feature.

## What is being optimized

A second half the owner can **play through and review**: every piece exists,
is reachable the way a player reaches it, and is drawn. Numbers are first
guesses (all in `config/`); tuning comes after the review. Where scope has to
give, give on polish of the picture, never on "nothing teleports", never on
the sim being reachable by a player, never on the house rules below.

## House style, and it is not optional

Read `CLAUDE.md`, `ARCHITECTURE.md` and every file you are about to change, in
full, before you write anything. Then match what is there:

- `config.js` owns every number (in `src/config/<file>.js`), `state.js` every
  fact that changes. Modules own behavior. A magic number in a module is a bug.
- Comments say **why**, in plain sentences, in the register of `air.js` or
  `roster.js`. Never restate the line under it. American English.
- Black and white only, flat shapes, no gradients, no textures, on the `P = 6`
  cell grid. `fillRect` takes a top-left.
- Nothing teleports. Every body walks (or swims) to every destination.
- Every new field on `S` goes in one of state.js's three lists.
- No new dependencies.

## The skeleton you start from

The spec branch `wave-serpent` already carries, committed, so every track can
import every other track's exports from its first minute:

| file | what it holds | owner from now |
|---|---|---|
| `src/config/deep.js` | every sim number: geometry, coil, heals/depths, `SERPENT_DEFENSE`, scales, the water, weapon constants, the star | SERPENT |
| `src/config/deepcrew.js`, `deepdraw.js`, `deepboard.js` | empty, one per track, already in the `config.js` barrel and `TUNABLE` | CREW, RENDER, BOARD |
| `src/config/rungs.js` | `LADDERS` entries `punch brawl lance lancehold grenade grenadepace sigil beam curse` | BOARD |
| `src/state.js` | every deep field on `S`, already in `SAVED`/`EPHEMERAL`; `deepBed` (the floor plot) in `SAVED_BY_HAND` | shared, additive |
| `src/jobs.js` | `TYPE`/`JOB` `BRAWL LANCE GRENADE SCRIBE WARLOCK`, `DEEP_JOBS`, `YARD_JOBS` | CREW |
| `src/deep/place.js` | geometry, **implemented**: `deepTop deepFloor deepX0 deepX1 deepRect inDeep mouthX spotX standOf coilAt bellySeg bellyAt nearestSeg` | SERPENT |
| `src/deep/serpent.js` | stubs: `strike clickDeep stageOf woundK healNow litK boundK stepSerpent` | SERPENT |
| `src/deep/scales.js` | stubs: `shed spendScales wireBed stepScales SAVE` (already in `SAVERS`) | SERPENT |
| `src/deep/arms.js` | stubs: `stepBrawler stepLancer stepGrenadier stepScribe stepWarlock stepArms` | SERPENT |
| `src/view.js` | stubs: `inDeep goDeep goUp stepView` | RENDER |
| `src/game.js` | STEPS `view` (after camera), `serpent`, `arms`, `scales` (after rift); `wireBed()` in `settleIntoWorld` | shared, additive |

Read the skeleton's files before you start: the field comments in `state.js`
under "the deep" are part of this spec.

## The shape of the whole, decided here

**Where the deep is.** A world-space rect under the world's bottom edge:
`deepTop() = S.worldH + DEEP_GAP`, `DEEP_H` tall, from `deepX0()` (the pit's
near lip less `DEEP_LEFT`) `DEEP_W` across. Every position in the deep is an
ordinary world position. The shaft is the column at `mouthX()`, from the plank
over the drowned pit (`S.groundY`) down to the deep's floor.

**The two views.** `S.view` is `'yard'` or `'deep'`. The camera and the
pointer read it; **nothing in the sim does** (no step in game.js except `view`
and `camera` may branch on it). In the deep view the camera locks to the deep
rect: `camLockY = deepFloor() - S.viewH` (clamped so the ceiling is on screen
if the window is tall enough) and `camX` clamped to `[deepX0(), deepX1() - viewW]`.

**The palette.** The deep is the inside of the black liquid, so it is drawn
**inverted**: black field, bodies and serpent and scales in white and greys.
Mechanism, decided: the deep's layers draw in the ordinary palette on a
**paper-colored** field, and one final layer, `deep invert`, lays a
`difference` fill of raw white (`raw('#fff')` from ink.js, so dark mode's map
does not touch it) over the deep rect. Inverted in both light and dark mode,
consistently.

**Bodies go down and come up by the route.** The deep is a *way* in
`route.js` (`'deep'`, feet at `deepFloor()`), and the shaft is a *link*
(`{ x: mouthX(), a: 'yard', b: 'deep', name: 'shaft' }`). A deep job's
station is a place on the `'deep'` way, so `retask`/`stepCommute`/`stepRoute`
carry a body down the shaft and back up with no special case. Inside the
liquid (below `abyssLine()` in the pit column, above `deepTop()`) a body is
not drawn: it has gone under, and time passes at swim pace.

**The deep's work is done by the deep's own gang.** A rung or a door bought
on a deep board is built at that station by bodies already down there, never
by the yard's builders: in `works.js` every deep site's `SITE_JOB` is the
station's own job (`altar: JOB.BRAWL`, `well: JOB.LANCE`, `font: JOB.GRENADE`,
`circle: JOB.SCRIBE`, `spire: JOB.WARLOCK`), and the deep sites join a
`DOWN_THERE` set that is treated like `UP_THERE` (never lent a builder). The
door rows are built at the altar by brawlers (`SITE_JOB.deep = JOB.BRAWL`).

**Scales are a plot.** "Anything that piles up is a cell in a plot." The floor
of the deep is `deepBed`, a sand grid (grid.js) `DEEP_W / P` columns by
`DEEP_BED_ROWS` rows, its bottom at `deepFloor()`, with a painter. A scale
knocked off the serpent is a particle in `S.sinking` falling on the deep's
gravity; when it reaches the bed it is `addGrain`ed and counted: **`S.scales`
is the bed's cell count** (`deepBed.n`), kept by the scale code, never set by
anyone else. Spending takes cells off the top of the bed nearest the paying
station and lifts them (`S.lifting`) to it.

**The ladders lead with scales.** `tierRows` gains one option, `lead` (default
`'dust'`): the coin the `dust` column of `LADDERS` is paid in. With
`lead: 'scale'` the bill's first line is `['scale', rungDust(key, level)]` and
each band coin `c` is `max(1, round(amount * DUST_PER.scale / DUST_PER[c]))`
(with `DUST_PER.dust = 1` for this purpose). The deep's bands, for every deep
ladder: band 1 `coins: []`, band 2 `['dust']`, band 3 `['dust', 'shard']`,
band 4 `['dust', 'shard', 'spark']`.

**The story.**

1. **The snatch** fires when `S.rescued && S.drowned`, whichever came second.
   If the rescue came second it plays when the ending sheet ("you saved your
   sqwife") is put down, **in place of the second dance** (the `ending` beat's
   skip does not set `danceUntil` when the pit has drowned). If the drowning
   came second it plays when the `drown` camera beat has finished. Beat key
   `snatch`, owner `yard`, in `BEATS`.
   - Two bodies are taken off the crew for the length of the beat and walked
     as `S.pair` (the reunion's own drawing): `pair[0]` the sqwife, `pair[1]`
     the sqhusband, both from the bodies nearest the pit mouth.
   - They walk to the plank at `mouthX()` and stand at the edge.
   - The serpent rises out of the surface at `mouthX()` (`S.snatch.headY`
     climbing a cell a frame to `SNATCH_RISE` above the surface), takes
     `pair[1]` (`S.snatch.carried = true`), and sinks back under.
   - The surface closes (ripples). `S.snatched = true`; the crew is one fewer
     (`S.crew--`). `pair[0]` goes back into the crew as the rescue's body did,
     **and is put on the deep's first job**: `S.brawlers = 1` (the sqwife goes
     in after him on her own; the player follows her down with a click on the
     surface). This replaces "on the player's first click" in DESIGN.md, which
     this wave updates.
   - A reload mid-beat: the beat replays from the start unless `S.snatched`
     is already true, in which case it finishes from after the take.
2. **The fight** (below) runs until the fourth stage breaks.
3. **The freeing**: when stage four breaks, `S.serpentStage = 4`,
   `S.serpentFreed = true`. Beat `freed`, owner `yard`: the belly opens (a gap
   the width of a body at `bellyAt(t)`), the sqhusband comes out of it, and he
   is put back on the crew (`S.crew++`) as a body at the belly that swims to
   the floor and is retasked as a spare hand (so he walks the route up the
   shaft to the yard). Then beat `freedsheet`, owner `sheet`: a sheet "you
   saved your sqhusband." with the one button "keep playing", in `play.html`
   beside `#saved` and handled in `ending.js` the same way.
   After freeing, the serpent stays, coiled and healed, stage 4: every weapon
   keeps striking it for scales (`SERPENT_DEFENSE[w][3]`, no heal target), so
   the deep keeps its economy.

**The fight.** `serpentStage` 0..3 is the defense up (0 bare, 1 warded,
2 splitting, 3 fading). Each frame:

- `wound += damage this frame; wound -= healNow() * dt; wound = clamp(wound, 0, depth)`,
  where `depth = SERPENT_WOUND[stage]` and
  `healNow() = SERPENT_HEAL[stage] * (1 - min(SIGIL_CUT_MAX, sigils * SIGIL_HEAL_CUT) - curse%)`,
  with `curse% = min(CURSE_CUT_MAX, rungValue('curse', curseLevel)/100)` and
  `sigils = S.sigils.length`.
- When `wound >= depth`: `serpentStage++`, `wound = 0`, `S.sigils = []` (the
  circles are spent on the defense they held).
- A hit's damage is `dmg * SERPENT_DEFENSE[weapon][stage]`, and in stage 3
  (fading) additionally `* (lit ? 1 : FADE_UNLIT)` for every weapon but
  `beam`, where `lit` is true when at least one wizard's beam is on the coil
  this frame (`S.beams.length > 0`).
- Every hit sheds `min(SCALE_HIT_MAX, max(1, round(done * SCALE_PER_DMG)))`
  scales at the point hit (`shed`). A hit that did nothing sheds nothing.

**The weapons.** Each deep job's `work` step is in `deep/arms.js`. A body works
only when it is at its station on the deep way (arrived; not commuting) --
"through the surface". Values are `rungValue(key, S.<key>Level)`.

| weapon | job | at | what it does |
|---|---|---|---|
| **punching** | click, and `brawler` | anywhere / the altar | A click on the coil (within `COIL_THICK` of a segment) strikes `punch` for `rungValue('punch')`. A brawler swims from the altar up to the nearest segment (its `w.y` rises off the way while it works, back to the way before it leaves), punches `rungValue('brawl')` times a second for `rungValue('punch')` each, and stays at the coil. |
| **lances** | `lancer` | the well | Draws a lance (`LANCE_DRAW_S` at the well), swims toward the coil, throws: the lance flies `LANCE_FLY` s and sticks to the nearest segment (`S.lances`), bleeding `rungValue('lance')` a second as `lance` for `rungValue('lancehold')` s, then dissolves. The lancer swims back to the well for the next. |
| **grenades** | `grenadier` | the font | Holds a grenade (`GRENADE_DRAW_S`), throws it in a slow arc (deep gravity) at the coil; on reaching the coil it bursts: a ring (`S.rings`) that grows to `GRENADE_R` over `GRENADE_RING_S`, striking `grenade` for `rungValue('grenade')` **once per length it crosses** (a length = `COIL_SEGS / SPLIT_LENGTHS` segments in stage 2, the whole coil as one length otherwise). Pace: `rungValue('grenadepace')` a minute. |
| **sigils** | `scribe` | the circle | Draws a circle on the floor under the coil (`SIGIL_DRAW_S` a circle), up to `rungValue('sigil')` circles (`S.sigils`, saved). Does no damage: each held circle cuts the heal (above). |
| **wizards** | `warlock` | the spire | Channels: while at the spire, a beam (`S.beams`) to the nearest segment within `BEAM_REACH`, striking `beam` for `rungValue('beam')` a second, and lighting the coil. `curse` is a ladder on the spire's board that cuts the heal. |
| **the star** | machine | the spire's board | Bought in sparks (`STAR_SPARKS`), `S.starOpen`; three spark rungs (`STAR_TUNE_SPARKS`, `S.starLevel`). Every `STAR_EVERY_S[starLevel]` s a star is called: it falls out of the yard's sky into the pit at `mouthX()` over `STAR_FALL_S` (seen from the yard), goes under, comes down from the deep's ceiling and lands on the coil, striking `star` for `STAR_DMG[starLevel]`. |

**The doors.** Rows in `STATIONS` (stations.js), with deep `stand` rects from
`standOf(key)`, and door rows sold on the **altar** board:

| station | board flag | open flag | `after` | `needs` | door bill |
|---|---|---|---|---|---|
| `altar` | `altarBoardOpen` | `S.snatched` | `[]` | -- | none; stands from the snatch |
| `well` | `wellBoardOpen` | `wellOpen` | `['altar']` | `serpentStage >= 1` | 150 scale, 20000 dust |
| `font` | `fontBoardOpen` | `fontOpen` | `['well']` | `serpentStage >= 2` | 600 scale, 60000 dust, 3000 shard |
| `circle` | `circleBoardOpen` | `circleOpen` | `['well']` | `serpentStage >= 2` | 600 scale, 60000 dust, 8000 spore |
| `spire` | `spireBoardOpen` | `spireOpen` | `['font', 'circle']` | `serpentStage >= 3` | 2500 scale, 150000 dust, 6000 shard, 200 spark |

Door bills are constants in `config/deepboard.js`. Buying a door opens the
station and staffs its door (`staffDoor(job)`), exactly as `site()` does.

**The boards.** Each station has one board. Sections and rows:

- **altar**: `brawlers` (the roster section), `the fist`: `punch`, `brawl`
  ladders; `the deep`: the four door rows.
- **well**: `lancers`; `the lance`: `lance`, `lancehold`.
- **font**: `grenadiers`; `the grenade`: `grenade`, `grenadepace`.
- **circle**: `scribes`; `the circle`: `sigil`.
- **spire**: `abyssal wizards`; `the spire`: `beam`, `curse`; `the star`: the
  star machine row, then its three-rung spark row.

**The crew's caps** (`capOfBare`, constants in `config/deepcrew.js`):
brawlers `S.snatched ? 12 : 0`, lancers `wellOpen ? 12 : 0`, grenadiers
`fontOpen ? 8 : 0`, scribes `circleOpen ? 4 : 0`, warlocks `spireOpen ? 6 : 0`.
Bodies are put on and taken off with the roster's `+`/`-` under each deep
station (posts at the deep's floor).

## The seams (the contract between tracks)

Every export named in "The skeleton" keeps its signature. A track may add
exports to a file it owns; it may not change or remove a skeleton export. The
fields on `S` are the ones in state.js; a track that needs another adds it in
**its own block** at the end of the deep block in `S` (just above
`noticeboard:`), under a comment naming the track, and in one of the three
lists in one block at the end of that list.

Seams wired **after the merge by the lead, not by any track**:

- the JOBS registry rows' `work` → `deep/arms.js` `step*` (CREW registers the
  rows with `work: () => {}` and a `// SEAM` comment);
- `freed` beat's trigger reads `S.serpentFreed` (SERPENT sets it; CREW reads
  it -- this one needs no wiring, it is a field);
- input's coil click → `clickDeep` (RENDER calls the skeleton export; nothing
  to wire);
- the counter's scale line and the purse read `S.scales` (a field).

## Ownership

| Track | Owns outright |
|---|---|
| **SERPENT** | `src/deep/place.js`, `src/deep/serpent.js`, `src/deep/scales.js`, `src/deep/arms.js`, `src/config/deep.js`, `test/serpent.test.mjs`, `test/deep-arms.test.mjs` |
| **CREW** | `src/jobs.js`, `src/crew/**`, `src/crew.js`, `src/route.js`, `src/staffing.js`, `src/levels.js`, `src/roster.js`, `src/beats.js`, `src/snatch.js` (new), `src/intro.js`, `src/ending.js`, `src/core.js`, `src/config/deepcrew.js`, `test/snatch.test.mjs`, `test/deep-crew.test.mjs` |
| **BOARD** | `src/deep/rows.js` (new), `src/upgrades.js`, `src/upgrades/**`, `src/words.js`, `src/shop.js`, `src/board.js`, `src/stations.js`, `src/works.js`, `src/income.js`, `src/render/counter.js`, `src/style.css`, `src/config/rungs.js`, `src/config/deepboard.js`, `src/config/boards.js`, `cards.html`, `glyphs.html`, `ladders.html`, `shelf.html`, `test/shop-rows.mjs`, `test/deep-board.test.mjs` |
| **RENDER** | `src/view.js`, `src/render.js`, `src/render/**` (not `counter.js`), `src/world.js` (the camera functions only), `src/input.js`, `src/ink.js`, `src/air.js`, `src/weather.js`, `src/config/deepdraw.js`, `src/scenes.js`, `src/selftest/deep.js` (new), `test/deep-view.test.mjs` |

**Do NOT touch another track's files.** You may *call* anything exported.

### Shared files, additive-only

`src/state.js`, `src/hooks.js`, `src/game.js`, `src/main.js`, `src/persist.js`,
`src/verify.js`, `src/selftest.js`, `play.html`:

- **state.js**: your block as above. Nothing else.
- **hooks.js**: one block at the **end of the file**, `// --- wave serpent: <TRACK> ---`,
  adding `HANDLES.__x = ...` lines (the `HANDLES.__motion` precedent). Hooks
  that must exist, each by its owner:
  - SERPENT: `__serpent({ stage, wound })` (set the fight for a setup),
    `__scales(n)` (lay `n` scales on the bed), `__deepState()` (a snapshot:
    stage, wound, heal, scales, lances, rings, beams, sigils, starFall).
  - CREW: `__snatch()` (make both facts true -- `__rift()` and the rescue done
    -- so the snatch is due), `__deepCrew({ brawlers, lancers, grenadiers, scribes, warlocks })`.
    Also: zero the deep jobs in `__crew`, add the deep level fields to `__levels`,
    and add deep jobs' places to `__assign`'s `PLACE_OF` -- these three are edits
    to existing hooks and are CREW's (hooks.js's `crew`, `levels`, `assign`
    functions only).
  - BOARD: the new boards in `boards()` and their rows in `everyRow()` (edits
    to those two functions only), `scales` in `__grant`.
  - RENDER: `__view(v)` (`'yard'`/`'deep'`, instant, for scenes).
- **game.js / main.js / persist.js**: one line each where needed, no
  reordering. `persist.js`: CREW adds a `SNATCH` saver if it needs one.
- **verify.js**: SERPENT adds rules, in one block at the end of the rule list:
  the wound is never below 0 nor above its stage's depth; the stage never
  goes back; no body is on the deep way before `S.snatched`;
  `S.scales === deepBed.n`.
- **play.html**: BOARD adds the five boards' DOM (copy the farm board's);
  CREW adds `#freed` beside `#saved`. One block each.

## The tracks

### Track SERPENT -- the fight, the scales, the weapons

1. `place.js`: keep the skeleton's geometry; refine only if needed and keep
   every export's meaning.
2. `serpent.js`: the fight exactly as "The fight" above. `stepSerpent(c)` does
   heal, break and the freeing flags. `strike` returns the damage done and
   sheds scales. `clickDeep(x, y)`: if the point is within `COIL_THICK` of a
   segment (`nearestSeg`), strike `punch` for `rungValue('punch', S.punchLevel)`
   and return true. `litK`, `boundK` as named (for the drawing).
3. `scales.js`: the bed plot (`wireBed` lays `deepBed` under the deep: `x =
   deepX0()`, bottom at `deepFloor()`, `cols = DEEP_W / P`, `rows =
   DEEP_BED_ROWS`, a `makePainter`, `settleSome` each frame); `shed` spawns
   `S.sinking` particles moving on `DEEP_GRAV`, `DEEP_DRAG` and the current
   (`DEEP_CURRENT` a sine of `DEEP_CURRENT_MS`); landing = `addGrain` and
   `S.scales = deepBed.n`, `S.seenScale = true`; `spendScales` takes cells off
   the bed's top nearest `toX` and pushes `S.lifting` flecks that rise to
   `(toX, toY)` and are gone there; `SAVE` writes and reads the bed the way
   `persist.js` codes the pit (heights per column is enough: every cell is a
   scale, one shade speckle dealt again on read).
4. `arms.js`: the five job steps and `stepArms`, exactly as the weapons table.
   A body's work fields (`w.goal`, `w.phase`, timers) must survive a reload
   the way `KEEPS` (crew/records.js) saves them: read CREW's `KEEPS` and use
   only fields it keeps, or `goal` values a fresh arrival re-initializes from.
   Positions to swim to are the station (`spotX`), and the coil (`coilAt`).
   A body in the deep that is working may move off the way in y (rising to
   the coil); set `w.y` back to the way's feet before its step returns
   control when it stops working. The star is SERPENT's, in `stepArms`.
5. `test/serpent.test.mjs` (node tier): a fresh `__snatch` yard; the wound
   rises under clicks on the coil, closes when nothing strikes; a strike rate
   under the heal never opens it and one over does; each stage breaks at its
   depth, in order, never backward; a weapon that answers a stage does more
   than one that glances (compare `strike('punch')` and `strike('lance')` in
   stage 1); stage 3 unlit vs lit; the fourth break sets `serpentFreed`;
   scales shed by a hit land on the bed and `S.scales` counts them only on
   landing; spending lifts them off. A cold reload in stage 2 with a wound
   comes back with both.
6. `test/deep-arms.test.mjs`: with `__deepCrew` and stations open by setting
   the flags (the hooks are for the setup the check is not about), each
   weapon's body works only once it has arrived; a lance sticks, bleeds and
   dissolves; a grenade's ring hits each length once in stage 2; sigils cut
   the heal and are spent on the break; a beam lights the coil; a called star
   is seen falling in the yard's sky before it lands in the deep.

### Track CREW -- the bodies, the shaft, the snatch, the freeing

1. **Jobs.** A `JOBS` registry row for each deep type (`src/crew/jobs.js`),
   factories placing a new body on the deep way at its station, `work:
   () => {}` with `// SEAM: deep/arms.js step*`. `handStationX` lines. The
   `want` map covers them (syncWorkers reads the registry). `staffing.js`
   `JOBS` gains the five. `capOfBare` lines per "The crew's caps".
2. **The shaft.** A `'deep'` way in `route.js` `ways()` (feet at
   `deepFloor()`, from `deepX0()` to `deepX1()`), and the `shaft` link at
   `mouthX()` between `'yard'` and `'deep'`, climbed at `SHAFT_PACE` (config)
   times the body's pace. A deep job's station way is `'deep'` (a way
   override for the deep types wherever the route picks a destination way
   from x alone). A body retasked from a deep job to a yard job walks the
   shaft up; from yard to deep, down. Drowned pit only: before `S.drowned`
   the link does not exist. **A body is never moved in one frame by more than
   its pace allows**, shaft included.
3. **Roster posts** under each deep station, at the deep's floor.
4. **The snatch**: `src/snatch.js` and the `snatch` row in `BEATS`, per "The
   story". `S.snatch = { phase, at, headY, carried }` while it plays (`phase`
   one of `'walk' 'rise' 'take' 'sink' 'close'`; `headY` the world y of the
   top of the serpent's head; `carried` true once it holds him) -- RENDER
   draws from exactly these fields. Constants (`SNATCH_RISE`, the phase
   lengths) in `config/deepcrew.js`. `ending` beat's skip: no dance when the
   pit has drowned. The skip key (space) skips the snatch the way it skips
   the rescue: the take still happens, the walk is cut.
5. **The freeing**: `freed` and `freedsheet` beats per "The story"; `#freed`
   in `play.html`, handled in `ending.js` like `#saved`.
6. `test/snatch.test.mjs`: the snatch plays when drowned-then-rescued and
   when rescued-then-drowned; once only (not again after a reload); the crew
   is one fewer; afterward one brawler exists and walks the shaft down (its
   y passes the shaft, frame by frame, never jumping more than a pace); the
   freeing (set `S.serpentStage = 4; S.serpentFreed = true` -- the fight is
   not this check's subject) puts him back and he walks up the shaft to the
   yard; the sheet plays. `test/deep-crew.test.mjs`: `+` under a deep station
   sends a yard body down the shaft to it; `-` brings it back up; the caps
   hold; a reload with a body in the deep brings it back in the deep.

### Track BOARD -- the coin, the doors, the ladders, the boards

1. **The scale currency**, every point of ARCHITECTURE.md "A new currency":
   `MARK`/`purse` (words.js), `take` spends through `spendScales(n, toX, toY)`
   (the paying station's stand), `tintOf`, `SHELF_INK`, `DUST_PER.scale =
   DUST_PER_SCALE`, `COIN_FROM.scale = { open: () => S.snatched, needs: 'needs a scale' }`,
   the stylesheet mark (a small white crescent-edged square: design it on the
   card bench), the purse by an open board, the counter line (render/counter.js;
   a scale is not a grain of the pit: draw its mark from the stylesheet
   shape's pixels, not a CELL shade), `income.js` `COINS`.
2. **`tierRows` `lead`** exactly as "The ladders lead with scales".
3. **The deep's rows**, in `src/deep/rows.js`, `registerRows`ed: every ladder
   in "The boards" through `tierRows` with `named` bands and `lead: 'scale'`,
   sites the station keys; the four door rows (as `site()` builds them, but
   billed per the doors table and sold on the altar); the star machine row
   and its three-rung spark row (`MACHINE_TUNE_SPARKS`'s precedent, `tuneRow`
   in machines.js). Roster sections per "The boards".
4. **Stations and boards**: the five `STATIONS` rows; the boards in
   `board.js`/`shop.js`/`play.html` and the stubs in the four bench pages; the
   board flags are already in state.js.
5. **works.js**: `SITE_JOB` for `altar well font circle spire deep`, and
   `DOWN_THERE` per "The deep's work is done by the deep's own gang".
6. `test/shop-rows.mjs`: a line for every new row (the coverage files walk
   them: hidden before the gate, shown after, bought, cold reload). Reach
   them with `__snatch()`, `__serpent({ stage })`, `__deepCrew(...)` and the
   open flags. **`__snatch`, `__serpent` and `__deepCrew` do not exist in your
   worktree** -- write the lines against those names (they are in this spec)
   and run the coverage with local stand-ins in a scratch copy if you must;
   say so in your report. `test/deep-board.test.mjs`: a punch rung is bought
   through `__buy` and paid in scales off the bed; band 2 adds dust; a door
   is hidden before its stage and shown after; the counter and the purse show
   the scales.

### Track RENDER -- the look, the view, the pointer

1. **The view** (`view.js`): `goDeep()` / `goUp()` start the glide
   (`S.viewTo`, `S.viewFade` rising over `VIEW_GLIDE_S`): the camera zooms
   toward the surface at `mouthX()`, the frame goes black, the camera is
   moved to the other half under the black, and it fades back in. Under
   reduced motion, the two framings one then the other. `stepView` runs the
   glide and, while `S.view === 'deep'`, holds the deep camera ("The two
   views"). `world.js`'s `clampCam` honors the deep clamp.
2. **The pointer** (`input.js`): after the snatch (`S.snatched`), a click on
   the drowned surface (`S.drowned`, over the pit's columns, `y` above
   `abyssLine() + P*6` and below the plank) calls `goDeep()`. In the deep, a
   click on the ceiling band (the top `DEEP_CEILING` of the deep rect) calls
   `goUp()`; any other click calls `clickDeep(x, y)` first, and falls through
   to the ordinary handling only if it returned false. The hover label over
   the surface says "the abyss -- click to go down" once the snatch has
   played; the ceiling "the surface -- click to go up". Station hover/boards
   in the deep work through `stationAt` exactly as in the yard (BOARD adds the
   rows).
3. **The drawing**, as LAYERS entries (`src/render/deep.js` and friends):
   - When `S.view === 'deep'` and no glide is running, `draw()` skips every
     yard layer and draws only the layers named in a `DEEP` set, plus the
     brackets and screen layers. When in the yard, the deep's layers are
     skipped. During the glide, both as the camera needs.
   - **The deep's sky**: the ceiling is the underside of the pit's surface --
     the same swell (`swellAt` in render/cores.js; export it) seen from
     below, across the deep's width, with the pale of the yard showing
     through at the shaft (`mouthX()`), the one light.
   - **The water**: the flowing interference the abyss already draws,
     everywhere, faint; `S.deepMotes` (silt hanging, flecks shed from the
     serpent, the churn off a burst), each kind its own tones and an `ink`
     weight like `SMOG_TINTS`; motes drift on the deep's current. Motes are
     drawing only: stepped in the render module's own step, never in the sim.
   - **The serpent**: the coil from `coilAt` (thick, segmented, swaying); the
     sqhusband's square silhouette in the belly (`bellyAt`) until freed; the
     wound as a **gap in the coil** at the belly that opens with `woundK()`,
     him more visible through it the deeper it is; each stage's look: warded
     (a shimmer of interference over the scales), splitting (`SPLIT_LENGTHS`
     lengths with gaps between them, each writhing on its own phase), fading
     (the coil drawn at a low ink except where a beam lights it).
   - **The weapons**: brawlers' punches, lances (a black-water shaft) flying
     and stuck, grenades and their rings, sigils on the floor (circles with
     marks), beams (the interference drawn as a line), the star falling
     through the yard's sky and then the deep. All in the abyss's own
     vocabulary: interference, ripples, no glow, no gradient.
   - **Swimmers**: bodies on the `'deep'` way drawn with a swim pose (a bob
     and a lean along the curve), not the walk; bodies inside the shaft span
     not drawn; working bodies at `w.y` off the way drawn where they are.
   - **The scales**: the bed through its painter, `S.sinking` and
     `S.lifting` drawn as scale marks.
   - **The deep's stations**: altar, well, font, circle, spire -- drawn at
     `standOf(key)` in the house's flat style, each recognizable.
   - **The snatch** in the yard: the serpent's head and neck rising out of
     the surface at `mouthX()` from `S.snatch` (`headY`, `carried`), the
     sqhusband in its jaws once `carried`.
   - **`deep invert`** last, as "The palette".
4. **Scenes** in `scenes.js` (about: a new `ABOUT` entry `'the deep'`):
   `snatch` (mid-rise), `deep` (fresh deep, the sqwife at the coil), `deep-warded`,
   `deep-split`, `deep-fading`, `deep-arms` (every weapon at work), `deep-freed`,
   `deep-glide` (mid-glide). Use `__snatch`, `__serpent`, `__deepCrew`,
   `__view` -- **only `__view` exists in your worktree**; set the rest up with
   direct `S` writes in a local helper inside `scenes.js` marked
   `// SEAM: replace with __snatch/__serpent/__deepCrew`, so the scenes work
   today and are rewired at the merge.
5. Shots: `node tools/look.mjs deep,deep-warded,deep-split,deep-fading,deep-arms,snatch --zoom 3`
   and look at every one. The shot is the check for the drawing.
6. `test/deep-view.test.mjs` (node): `goDeep()` then running the clock puts
   `S.view === 'deep'` and the camera inside the deep rect; `goUp()` returns;
   the sim's state after N seconds is identical whichever view it ran in
   (run the same seeded yard twice, once from each view, and compare
   `__deepState()`-like fields you can read directly: `serpentWound`,
   `scales`, `S.workers` positions). `src/selftest/deep.js` (browser group
   `deep`, registered at the end of `selftest.js`'s group list): a real
   click on the surface after `S.snatched` goes down; a click on the
   ceiling comes up.

## Verification, for every track

Your worktree has no `node_modules`; run the root's binaries. Your dev server,
if you need one, on **your** port, never 5183 and never 5184:

| track | dev port | CDP_PORT |
|---|---|---|
| SERPENT | 5241 | 9241 |
| CREW | 5242 | 9242 |
| BOARD | 5243 | 9243 |
| RENDER | 5244 | 9244 |

```
"C:/git/boulder-clicker/node_modules/.bin/vite" --port <n> --strictPort   # background; kill it before you report
node --test --test-concurrency=4 test/<your file>.test.mjs               # foreground, always
node tools/unresolved.mjs
```

Run **your own test files**, plus the existing files that cover what you
touched (named below), and nothing else. **No full sweeps** (`npm test`,
`test:browser*`): the full suite runs once on main after the merge.

- SERPENT: `test/serpent.test.mjs`, `test/deep-arms.test.mjs`, `test/persist-roundtrip.test.mjs`.
- CREW: `test/snatch.test.mjs`, `test/deep-crew.test.mjs`, `test/beats.test.mjs`,
  `test/cutscene.test.mjs`, `test/rift.test.mjs`, `test/persist-roundtrip.test.mjs`,
  and whichever route/commute test file exists for what you changed there.
- BOARD: `test/deep-board.test.mjs`, `test/shop-coverage-1.test.mjs`,
  `test/shop-coverage-2.test.mjs` (see item 6 about the missing hooks),
  `test/ladders.test.mjs`, `test/persist-roundtrip.test.mjs`.
- RENDER: `test/deep-view.test.mjs`, `test/scenes.test.mjs`, the browser
  group `node tools/headless.mjs --only deep` against your server, and the
  shots.

**Tests run in the foreground.** An agent that backgrounds a test and "waits"
ends its turn and is stopped.

## Commits and report

Commit to your branch as you go (small commits, the house's commit-message
register, ending with the `Co-Authored-By` line), and **push your branch to
origin after every commit** (`git push -u origin HEAD:wave-serpent-<track>`,
track in lower case). Your report, in this order:

1. Deliverables, one line each, done or not done.
2. Files touched.
3. **The actual output** of each test run named above -- pasted, not summarized.
4. What you had to decide that this document did not decide for you.
5. Anything you believe is wrong with the design, which you implemented anyway.
6. Every `// SEAM` you left, with file:line.
