# Still to do

Open work only. Each item carries its diagnosis and its blocker, so none of it
has to be re-derived. What was built is in DESIGN.md (the `(built)` sections)
and CHANGELOG.md; the old entries are in git history.

## Acts 3 and 4

### Act 3's faith shrine -- PATH A LANDED, FAITH NOT COUNTED (2026-11-12)

The shrine stands from the act's first frame; its prayer ladder (four rungs
on its board) is carried, then hammered up by the builders, each rung a new
look (render/after/stations.js, `LOOKS`). The faith ring over it is drawn
full and beating, the faithful drawn kneeling, the ghost hand tapping over
the ring. Open, all because faith has no count in the sim yet:

- The ring is always full. The review's fill mode (a demo cycle 0.3 to 0.7,
  sped by the rung) went with the other options; the rung's worth was
  `AFTER_PRAYER_MULT = [1, 2, 3, 4, 6]`, the faith one prayer adds, and
  comes back with the count. In fill mode the arc jumped once as a rung
  landed (the multiple changed the fill rate under a running clock); a
  counted fill reads the count, so the jump has nowhere to happen.
- The ghost hand invites a click that collects nothing: there is no click
  on the ring and nothing to collect into.
- The six faithful are drawn in place, not walked there (breaks "nothing
  teleports"): members should walk to kneel at the shrine's door, and the
  prayers come only from those through it.

Blocker: the owner's design for faith as a counted coin.

### Act 3's stair and act 2's abyssal sword -- DESIGNED, AWAITING APPROVAL (2026-11-09)

DESIGN.md, "The stair and the abyssal sword". Act 3's line builds a stair to
God instead of winning a crowd share; faith is rebel renamed; act 2 gets a
building (the reliquary) whose ladder strengthens the party; the serpent
grows mightier by level, its level 25 drops an abyssal fang forged into a
sword that is carried up and stabs God, unmasking him. The stair is to be
redone on the yard's shared construction (works.js), as act 3's stations and
the mansion now are; the audit of copied systems deferred it. The mock on
`review-stair-build` is not that. Blocker: the owner's approval and the four
open calls at the end of the section. God's crowd redraw (review-godcrowd,
rounds 1-2) is parked.

### Act 3 work on branches, not on main (2026-11-09)

- **`clouds-build`** (38f4e29f): act 3's clouds move as one body and stand
  as one sky.
- **The God's-crowd ground fix** (f7e0b54a, on `review-godcrowd` and the
  faith and stair review branches): the cloud path runs to the camera's last
  window, so a wide window never looks past the place's end. Worth landing
  alone.

Blocker: someone lands each, or drops it.

### A dialog system -- BUILT, THE LINES OPEN (2026-11-01)

DESIGN.md, "A dialog system (design, approved)" is on main (src/dialog.js,
`S.heard`). God's six opening lines at `meet-god` are the owner's own words
(script D from the review bench, `act-meet-god-1`..`-6`). Open: the lines
carry the owner's effect marks (`^ * ~ _`), which main has no renderer for
(the mock was `dialog-sauce` on a3-review-both), so they show as typed; the
other premise lines in "The first use" are still unwritten.

### Acts 3 and 4: the afterlife and hell -- PLAYABLE BEHIND SWITCHES, CALLS OPEN (2026-11-11)

DESIGN.md, "Acts 3 and 4: the afterlife and hell". Act 3 is built on main
on the shared systems (grove, saw mill, construction, crowd, the flat sky)
and act 4's loop on placeholder art; both stay behind `AFTERLIFE_ON` /
`HELL_ON`, which no released build sets. Open:
- **The owner's calls 3-8** ("The calls for the owner"): one defeat in
  heaven or two; Satan in hell or gone, five barriers or four, the cage
  worked or a cutscene; what the dead can do on the surface and when the
  yard's boards reopen; who gets their lives back; how it ships; the ending
  and a tail.
- **Lifespans and lineage**, the ground both acts stand on, are not built.
- **Act 4**: the hifi mocks to replace every drawing, a tuning pass on
  config/hell.js, and the placeholder sources (black water, builders, the
  stair, flux).
- **Every word** of the connective beats (plain labels in locales/en.ftl).

### The yard's fences stand on their neighbors -- FOUND, NOT FIXED (2026-11-10)

A building going up is fenced three cells either side (fence.js), and the
fence has never been on the map. Claimed there, the no-overlap rule went red
in two groups: the ram's fence posts stand on the shack (build-throughput,
"a backlog over every site"), and the pods' on the deep's first station
(deep-works, deep-build-reload). Act 3 claims its fences and seats each post
clear of its neighbors (`FENCE_CLAIMED`, `fenceOf`); the yard and the deep
join by adding their place to `FENCE_CLAIMED`, which moves their posts in
the same way -- a visible change to the yard's fences, so it is a review
before it is a fix. Blocker: the owner's call on the look.

---

## Engine and shared pieces

### One place engine for every act -- ON MAIN, TWO SEAMS LEFT (2026-11-11)

DESIGN.md, "One place engine". All seven steps are on main: stations with
`place`, render layers by place, one buy, hell's boards, one body engine,
construction through works.js, one save reader; and the audits of copied
systems after them (act bodies, clicks, the yard's sky on the cloud renderer,
the small folds, act 3's construction, the mansion). The one camera is in
(`frameAfter` is gone). Left:
- **Act 3's stair** on the shared construction (see its entry above).
- **The pad's focus stops** (stops.js, `gestureStops`) were left by the
  clicks audit for their own audit; the pad's carry is still the yard's only.

### Shared pieces and checks, after the place engine -- AGREED, QUEUED (2026-10-20)

The owner agreed these on 2026-10-20, from what went wrong in act 3. The
cloud renderer, mocks in the real game (review.html) and a play check for
each place (src/selftest/playcheck.js) are built. Left:

1. **One sprite-and-layer primitive for "art on the grid, motion smooth"**
   (CLAUDE.md). 86 files snap positions to the grid by hand
   (`Math.round(x * P)` and kin). A shared helper draws a shape on its own
   grid once, caches it, and places it at a fractional position; a parallax
   layer is the same at a rate. Blocked on: nothing.
2. **Hit areas from the drawing.** A thing's click area comes from where it
   was drawn, not a separate box table, so a camera change cannot leave
   clicks behind the art. Blocked on: nothing.
3. **One crowd renderer.** God's crowd (`render/aftercrowd.js`) and the
   union's (`render/after/unioncrowd.js`) are separate; one renderer with
   rows, growth direction, tones and fill/empty rules serves both. Blocked
   on: nothing.
4. **Fades as the only way in or out.** One shared appear/leave on the
   canvas that every new thing uses, so a pop like act 3's sign plant cannot
   happen by accident (src/fade.js is the sheets' only).
5. **A jitter check on every scene with motion.** `tools/jitter-check.mjs`
   is built; nothing runs it across the scenes yet.

### The yard joins the conservation rule (2026-10-28)

"One resource system for every act" is built (DESIGN.md, `(built)`). Its one
rule (verify.js, rule 23: a unit appears or vanishes only at a named source or
sink, src/flow.js and src/conserve.js) covers act 3 and the deep's scales. The
yard does not yet: its units -- grains, finds, shards -- are made and unmade at
doors nobody has named (rock spoil, the rind, the farm, the meteor, the casino's
pay, the quarry's dig), so counting them against the rule would be red across the
node tier on the first frame. Each door is one `source` or `sink` call and its
kind one entry in `CENSUS_KINDS`; the grains are cells of `floor`, in the hand
and in `S.chips` already, and a hauler's `w.load` is cells. Blocker: someone
walks the yard's doors (`grep -rn "addGrain\|put(floor" src`) and names each, a
kind at a time, starting with the finds. Hell has no goods yet and joins when it
does.

### Rethink the reduced-motion option -- PARKED BY THE OWNER (2026-10-28)

The ram's cutter wheel is drawn to stop under reduced motion (`drawRam` /
`bore` in `src/render/machines.js`, `RAM_SPIN_*` in
`src/config/machines.js`), so with the option on "limit" the game looks
broken. The owner: "we should re think our reduce motion option, cause it
does not work well and is very unclear. thats for later though". What
"limit" turns off is not said anywhere a player sees, and it freezes pieces
that read as broken rather than calm. Blocker: a design (what each motion
level keeps and drops, and how the option says so) and the owner's
approval; parked by the owner for later.

---

## Tests and CI

### Every part of the game stands on its own -- PHASE A APPROVED, BUILDING (2026-10-25)

docs/wave-tests.md. Merged: step 1 (CI shards by measured time, #11), step 2
(every module-level let held/cache/page/saved, src/reset.js, #12), step 3
(src/check.js, frame waits, 232 sleeps to 11, #13), step 4's trace
(`tools/node/systems-trace.mjs`, `test/systems.json`, #14).

The trace found the frame one knot (every system but six closes over 46-47
of 66), and a long tail rather than a few hubs: cutting the best thirty
fields' edges outright leaves crew, casino, apothecary and rift at 26; only
act 3 comes apart. The owner chose "both, speed first" (2026-10-25). Phase A,
speed without isolation, target the slowest node shard from 7.4 min to under
4: hot paths (coil walk, `surveyFloor`, `countTick`), fixtures from
`src/scenes.js`, a unit tier for pure checks, hooks split. Phase B: `SYSTEMS`
rows with a closure ratchet, each station owning its bodies and the beats
asking through an interface, `sim` with act 3 first, and a stop rule (the
yard's parts under 15 of 66 after that slice, or back to the owner). The
owner approved that order 2026-10-25. Phase A step 5 (hot paths) is built,
and carried on 2026-10-26 (a column's top off a ledger, the deep's creatures
walked on from a kept moment). Step 6 (fixtures) was measured and buys almost
nothing as written: the setup is cheap and the time is in the frames a check
is about (docs/wave-tests.md, step 6). Its new shape waits on the owner.
Nothing of phase B is built.

### A pad check leaks in behind the sheet groups -- FOUND, NOT FIXED (2026-10-22)

`src/selftest/pad.js`, "pad: Menu holds the yard, the sheet is walked, B
lets it go", fails when run straight after the other "sheet" groups
(`node tools/headless.mjs --only sheet`), at 800x600 and 1400x900, and
passes alone, in the full suite and in every CI shard: an earlier group
leaves something (an open sheet, a focus, a held pad) that a fresh game does
not reset. Not seen in any order CI runs. Next: bisect the sheet groups that
run before it, then reset what leaks in `newRun`, not in the check.

---

## Defects

### A tray capped mid-pay holds the hand forever -- FOUND, NOT FIXED (2026-10-20)

`src/casino.js`: a pay grain that finds no cell sets `tray.capped`, which
holds the next bin (`stepDrop`, `!chuteOpen()`). Only `trayOut` clears it,
and `trayOut` returns while `trayHolds()` -- which is true for the whole pay
stage -- so a tray that fills during a pay never empties and the hand never
settles. Not seen in play: one hand lays at most a brim a kind (`shownFor`),
under the tray's 108 x 20; it needs a previous hand's pile still standing.
Seen in test/hauler-in-hole.test.mjs, whose forced-full tray has to be let
go by hand. Fix: uncap when the pay stage holds on it, or let `trayOut` run
while the bins wait on the chute.

### A stirrer stood 21px over the yard -- SEEN, MAY BE FIXED (2026-10-16)

With the meeting's digger sent as the sqhusband rather than the nearest body
(`sendDigger(true)` in `startMeet`, intro.js), test/scenes-stand-d.test.mjs
went red on the `everything` scene after its reload: "a body is standing on
nothing: wick (stirrer) ... has its feet 21px over the yard". The digger was
changed back. 76dd8cdb (2026-10-26) made a stirrer standing at its pot follow
the ground, which may be this hole; the repro has not been re-run. Repro: put
`sendDigger(true)` back in `startMeet` and run that one file.

### `wayAt` and `onBridge` still read the ground line to a pixel (2026-10-14)

`inWorking` now uses `HOLE_DEPTH` (config/crew.js: the furthest a body's own
sway and swing carry its feet below its footing), but `wayAt` (route.js, a
body inside a working's span) and `onBridge` (crew/dance.js) still ask
`feet > S.groundY + 1`, which the same bob crosses. A body mid-bob at ground
level over a span, e.g. the bridge deck over the cut, reads as in the cut.
8e16327f measured it as rare (drop zones never reach a mouth). Blocker: both
steer routing everywhere, so it is its own change with its own check, like
test/hole-depth.test.mjs.

---

## The deep and the serpent

### Endless serpent -- BUILT, THE WALL OPEN (2026-10-13)

"Endless serpent (built)" in DESIGN.md. Open:
- **The wall**: measured on the old loop at level 3 for seven stations at
  rung 8 (the constrict stops breaking at 4), far under the level-25
  notice; the fight is now the constrict alone, so re-measure it there
  (`tools/node/deep-pace.mjs --stood 7 --wall`) before moving the notices.

### The serpent hardens against its strongest foes -- BUILT, TUNING OPEN (2026-10-07)

"The serpent hardens against its strongest foes" in DESIGN.md. Open:
- **The barrier's flare sits under where the charge hit the hide**: the
  Sapper's charge still flies to the hide, not to the barrier under it.
- **A fang's station's first four rungs ask 500k dust each**
  (`FANG_RUNG_DUST`, 2026-10-07), and the depths measured again on it:
  5970 / 5070 / 5560 / 5670 / 9210. Unforced, four parties free him in 71
  to 94 minutes; of their twenty phases fifteen run 12 to 25 minutes. Left:
  a party whose first fighter reached rung 7 in a long first phase breaks
  the second in 3 minutes (its depth is under the first's, since the
  second resists that fighter), and one party's last two run 28 and 23.

### The serpent heals whole: a phase is a window -- BUILT, TUNING OPEN (2026-10-04)

"The serpent heals whole: a phase is a window" in DESIGN.md. Open:
- **The driven runs** (`speedrun.mjs --fight --hand 2`, 2026-10-07, yard
  buying off). The rungs' dust climbs gently now (100k to 2.5M, the yard
  banking about 145k a minute), and the depths are the median party's best
  window 17.5 minutes into each phase (`--paced 17.5`, eight parties, the
  strongest and weakest dropped). Unforced, four parties all free him about
  71 minutes after the portal; the Mage-first party's phases run 15 / 14 /
  14 / 17 / 12 minutes, but a phase still falls in 2 to 4 minutes when the
  next station's first cheap rungs land just short of its depth, and the
  cloak's phase then runs 28 to 38.
- **The meal scenes** commit their creature and run on; the shot no longer
  pins the moment once it has turned.

### The serpent eats to heal -- BUILT (2026-09-30; the constrict 2026-10-15)

"The serpent eats to heal" in DESIGN.md. Open:
- **The swallow's swell** is small at the game's scale.
- **A small window often has nobody on the glass**, so the bolts reach off
  screen and the orb is hauled in from there (as the rule says).
- **A meal through the kill** plays out on a dying head, healing nothing.

### A phase has a mechanic and a class answers it -- BUILT, TUNING OPEN (2026-09-28)

"A phase has a mechanic and a class answers it" in DESIGN.md. Open:
- **The answers are capstones**, so the warded phase's surge is mostly
  unanswered at the pace the model plays. A rung-4 answer, or a later
  surge, if that reads as unfair.
- **The lash's bump reads as a dip** at the belly's girth; a deeper
  `LASH_H` if it wants to read as a whip.

### The deep is paced by its purse -- BUILT, TUNING OPEN (2026-09-28)

"The deep is paced by its purse" in DESIGN.md; the model is
`tools/node/deep-pace.mjs`. Heals 8 / 86 / 176 / 238, depths 32k / 73k /
191k / 350k. Open:
- **The model's hour**: 4 scales a second banked, two clicks a second, and
  each class's move worth a guessed multiple of its hit (`MOVE` in the
  tool). Bills in dust, ore and sparks, build time and the fang's carry are
  left out.
- **The banked rate is the load-bearing guess.** Four gatherers bank about
  5 a second off a thick floor, falling to 3; 3 a second makes it 71
  minutes, 5 makes it 52.
- **A party halved in one stage walls there.** Sword, Assassin and Sapper
  all take half in the split; that party reaches the fourth stage at 50
  minutes and frees him at 70.

### Fighters in slots -- BUILT, TUNING OPEN (2026-09-28)

DESIGN.md, "A fighter branches at rung 4". Open: whether rung 4's jump (a
whole class at once) is too big a step in the ladder book.

### The deep's bench -- DESIGNED, AWAITING THE VOTE (2026-09-24)

"The deep's bench" in DESIGN.md; mocks `docs/mocks/deep-bench-2026-09-24.html`
and `docs/mocks/deep-bench/`. The altar's board sells the brawlers' two
ladders and all four doors. Blocked on the owner's calls: (a) a deep bench
holding the doors (a1 beside the pods, recommended, or a2 under the portal;
standing from the snatch or raised with its first door) or (b) the altar
redrawn generic; and which drawing (A, B, C or b1, b2, b3). No game code yet.

### The deep's crew at rest -- BUILT, TUNING OPEN (2026-09-23)

"The deep's crew at rest" in DESIGN.md. Open: **the landing silt is the
builders' grit**, drawn by `difference`, so it shows as bright white flecks
on the dark floor, brighter than the bed.

---

## Release, store and language

### Steamworks and the paid build -- AWAITING THE OWNER (2026-10-12)

"Three builds", "Controller support" and "Who you are" in DESIGN.md. Open:
- **App ids**: none exist. `APPS` in electron/steam.cjs is null for both
  (placeholders); the release workflow needs the repository variables and
  secrets listed at the top of release.yml before its Steam jobs run, and
  `ITCH_FULL_TARGET` before the paid page gets a push. Nothing has been
  uploaded through SteamPipe yet, so the jobs are unproven.
- **The serpent ships only in the paid build**: `SERPENT_ON`
  (src/config/deep.js) is `VITE_FULL=1`, and no paid build has shipped.
  CHANGELOG.md's "Held back" lines move under Unreleased in the release that
  first ships one.
- **Steam Input**: electron/steam-input/controller_neptune.vdf is the Deck's
  default config, unproven: there is no app id to upload it under. Its
  binding names are from the published format, not from a Steamworks export.
- **Steam achievements** are wired (src/achievements.js): the owner creates
  the 49 in Steamworks from `node tools/steam-achievements.mjs`, writes their
  text and draws their icons; ACH_GOTOUT's display name is "complete act 1"
  and ACH_FREED's "complete act 2", by hand on the dashboard.
- **Mac**: the Steam build has no mac depot until the mac app is notarized.

### Feedback form -- SHIPPED IN v0.6.0, NOT PROVEN END TO END (2026-10-16)

"Feedback form (built)" in DESIGN.md; the worker is live at
`https://pebble-feedback.graham-things.com`. Open: **one report from a
released build** -- one from the itch page and one from a desk app, a save
ticked, each seen to land in D1 and in the inbox. Every check so far stubs
the network.

### Localization, phase two -- PICKER BUILT, LAUNCH ENGLISH ONLY (2026-10-13)

"Localization phase two (design, part built)" in DESIGN.md. Built: the
language table (locales/languages.json, only English `ready`), the
`language` preference and the default chain with `desk.language()`, the
CJK faces cut at build (tools/fonts.mjs), `--face`/`--track` and `FACE`,
the shell's words through the file, the picker (a page off both settings
pages) with its words, test/l10n-locales and l10n-default. All eight other
languages are drafted (machine, to locales/STYLE.md) and unreviewed.
**The owner's call (2026-10-13): launch English only; a language goes
`ready`, and is ticked on Steam, only after one native reader has looked at
its file** -- no paid translators. Readers are found by asking players (the
feedback form and the store page). Open, in order:
- **A native reader a language.** Blocked on finding them. A language goes
  `ready` when its file is approved and its overflow survey is clean; the
  guard then holds it complete.
- **The `-who` lines and the role word** are deferred by the owner ("lets
  not worry about other languages"). Until a language writes them it keeps
  its older line (lang.js, `msgOr`), so the other eight still say wife or
  husband whatever role was chosen and never say a name; the `ward-*`
  labels show in English there.
- **The CJK look** is decided, "as today" with bold headings, and not
  built: `--track` under `:lang(zh|ja|ko)` stays 1, and the
  `TODO(mock vote)` notes in src/style.css go with the build. It only shows
  once a CJK language is `ready`, so it waits on that.
- **Check on a packaged Windows build** that `app.getPreferredSystemLanguages()`
  reports the system's list, not `en-US`.
- **The owner's calls still open** (DESIGN.md's list): which Spanish the
  one `es` file is written in, the casino's sign (icons recommended, from a
  mock), whether the title has its own CJK name, and whether Steam's
  achievement names are translated with the rest.
- The rest of the section: measure (`long`/`wide`, `l10nfit`), sync, the
  sign, numbers and `list-sep`, the objective card's cap, Steam's ticks.

---

## Sound and music

### The yard's sound set, by lanes -- BUILT, NOT LISTENED TO IN THE GAME (2026-10-18)

DESIGN.md, "The yard's sound set, by lanes". Open: the owner's ear on every
lane (the review page and `shots/sound/endgame-lanes.ogg`), the levels of the
takes against the tuned recipes, and the rest of the beats list (farm, stir,
weather, the deep, the story, acts 3-4). `node tools/node/sound-audition.mjs`
is the check for every round.

### The score and the music bench -- BENCH BUILT, GAME PLAYBACK DESIGNED, AWAITING THE OWNER'S EAR (2026-10-17)

DESIGN.md, "The score, and the bench it is written on": `music.html`, the
preview, Surge live, the render and chords first are on main. Next: "The
score in the game, and the menu filter" (DESIGN.md), the in-game playback
(one loop a place, its own slider). Blocked on two by-ear picks: which of the
three crushed sketches is the yard, and how deep the menus sink it
(shots/music/menu-filter-demo.ogg); then the go-ahead. loopMIDI must be
installed by hand for the live switch. The effects chain is built; open on
it: pedalboard's Limiter seems to raise the mix to 0 dBFS whatever its
threshold (the render's report, 2026-10-17), so the master limits about
3 dB harder than it needs to -- a by-ear call on `MASTER_GAIN_DB` in
tools/music/mix.py.

---

## Balance calls, waiting on a decision

### The sphere's numbers (built 2026-09-22, measured 2026-09-23)

`SPHERE_BILL`, `SPHERE_WORK` and `SPHERE_TUNE_WORK` are first guesses; the
owner has looked at the figures and is content. Measured in a node yard with
the game's own books (`airSides`): the sphere banks ~2,460 sparks a minute
untuned and ~4,170 tuned against ~450 for a ring of three, and puts up about
1.5 haze a second of its own -- less than a tiller, and well inside what
three bottom-rung balloons take down. What limits it is carrying: its sparks
land under the tower, and twelve haulers with no forklifts move 30-70 a
minute, so without forklifts it stands idle on a full sky pile. Left as is
(the owner's call): forklifts are its companion. If it reads badly in play,
gating the row on owning a forklift is the one-line answer.

### The balloons: the clog, the fleet, the reading

The craft flies, crewed, and pulls from the clouds. Left:

- **The clog.** A craft drops wherever it is and nothing stops it. The design:
  it clogs on the column beneath it and clears by moving on, with the pile-full
  mark on the mast when every craft is stalled. Settled (2026-10-14): count only the balloons' own loads, never weather muck (test/rain-muck-filter.test.mjs holds it).
- **The fleet.** Lanes not looked at with two in the sky; each craft walks the
  whole sky list on its own. Fine for one, wasteful for three.
- **The reading.** Nothing on the board says whether a craft is up, crewed or
  tied to its mast.

### Numbers nobody has played

- The grind pass's re-measure: the quarry/lab doors may sit heavy (bot: 200 min /
  5.3 h); verify quarry occupancy on a real save before touching shard supply;
  the machines' shard legs if the endgame reads as a wait. Read
  `docs/critics-2026-09-10.md` before any balance work; the bot matrix has not
  been re-run since.
- The shield prices (`PROP_COST`, `NET_COST`, `ARCH_COST`) as tolls, and whether
  the pinned corner sits lower on a phone.
- `LIFT_FOUL`, against a fully bought air filter.
- The sky: murk depth, the hand-foul rate, the first storm's feel; the swelled
  clouds read faintly in the base tones (a tone deepening with the swell is the
  one-line option).
- The janitors' roombas: `ROOMBA_BIN` (24), `ROOMBA_PACE` (2.5x a walk) and
  `ROOMBA_TIP_MS` are first guesses on the dev panel; the soot (`MACHINE_FOUL`
  a grain) is unmeasured against the air filter.

---

## Approved or designed, not built

- **The noticeboard** (approved 2026-09-10). DESIGN.md, "The noticeboard, and
  the record on it": forty-two notices, recognition only, the books move onto
  its second sheet. Thresholds are dev-panel questions. Wave-sized: catalog,
  board, site row, witnesses. Sheet: `docs/noticeboard-catalog.html`.
- **The gust front** (`windAt(t, x)`, so a gust crosses the yard). Blocked on
  every caller needing an honest `x`, and `report.js` has none.
- **The apothecary:** shard, spore and core still leave the hole without a
  flight to the station (dust arcs); a second independent tonic rather than a
  second pot of the same one.

---

## Drawing and listening

- **The index's drawings**: 26 entries in src/config/index.js have
  `glyph: null` and show no picture (muck, poop, birds, pollution, the hole,
  the rift, the bench, the crews, the sqwife, the serpent and the rest); each
  wants one in glyphs.html. DESIGN.md's list of the undrawn is older than the
  table and names entries that have since gone. The `i` key has no line on
  the controls page, which the landing page shares and where there is no
  index to open; the owner's words if it gets one.
- **The serpent's glyphs**: the fifteen deep rows and the hop's five arrows
  borrow drawings (`GLYPH_OF` in glyphs.js); they want their own in the glyph
  editor.
- The forklift (`drawLiftBox`, render/crew.js) and its `lift` shelf glyph are
  first sketches; want a pass in `glyphs.html` and a shot.
- The farm shed, the quarry shed and the bench share one silhouette at 1x. One
  feature of three cells or more apiece: a pit-prop A-frame roof on the quarry's,
  a lean-to with the trough on the farm's, an anvil or vice on the bench. Shoot
  the options before drawing one.
- The casino: the spark bin's fanfare and the converting bins' blinking feet
  are not drawn.
- The roomba's suck is silent (`roomba-suck` maps to null in `SOUNDS`).
- The queue: a big dust refund is one `bankDust` a grain in one frame, untimed.

---

## Not yet played or watched

Each of these is built and checked, and nobody has seen it in play; the
numbers named are first guesses until someone has.

- **A pad held in hand**: every check drives a stand-in pad; the glide,
  `PAD_HAND_SPEED` and `PAD_REPEAT_*` (config/pad.js).
- **The constrict** (the fifth phase): depth 9,000 and the orb's 15% are the
  model's.
- **The serpent's phase depths** 4300 / 9400 / 6700 / 5100 (deep-pace's,
  four fighters).
- **The serpent's meal**: the timings are the mock's.
- **A whole turn of a phase's mechanic** (scenes `phase-surge`,
  `phase-surging`, `phase-taut`, `phase-lash`, `phase-sink`).
- **The resists' fading switch** (the plates flicker in `RESIST_WARN_S`
  before it).
- **The deep's purse-paced hour**, and a rung-8 party's floor under the shed
  (`SCALE_PER_DECADE`).
- **The deep's crew at rest with forty bodies down there** (`DEEP_REST_*`;
  the `deep-rest` scene is six gatherers).
- **The story's objective line** through a whole game.
- **The roombas through a front**: after a heavy rain the bins fill in a
  patch or two and the trips home are most of the work.
- **Cloud saves' `behind` card** and *take it* / *keep this one*: node checks
  only, no browser check, never clicked by hand.
- **The casino's audio**: nobody has listened.
- **The music bench's preview patterns and the render's mix**: nobody has
  listened.
- **A refund's grains flying** on a real window.
