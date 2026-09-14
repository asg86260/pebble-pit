# Still to do

## A rung is a step up, not a step along -- BUILT (2026-09-14)

"A rung is a step up, not a step along" at the end of DESIGN.md, with an
as-built note. Every ladder is four rungs, dust → +spore → +shard → +spark
(never the core); every count reads a written list in `config/rungs.js`,
a knob a rung in the ladder book. The lists shipped with first guesses
(`CARRY_PX` 1, 2, 4, 6, 10; `PICK_PX` 1, 2, 4, 8, 12; …) and the fourth
rung's bills are steep in spores at the top of the price curve -- both are
the ladder book's to settle on a played yard. The builders' 37% and the
attended wait are untouched and still open.

## A ladder is a rung a coin, the spark rung on the card -- BUILT (2026-09-14)

"The spark band is the top of the ladder, not a card beside it" at the end
of DESIGN.md, with an as-built note. `TIER_BAND` is one; the grounds'
research cards are the fourth rung of their ladders; every count's unit
doubled so no top moved. Worth a real play: three presses to a ladder is the
shortest they have been, and each is a whole coin's step. The builders' 37%
and the attended wait are untouched and still open.

## The hole's count and its pile disagree by a few cells (2026-09-14)

`capacityAt` (pit.js) says the hole holds 37,566; the pile's own search
(`addGrain`) refuses the 37,556th grain. Eleven cells the count credits that no
column ever gets -- `heapCeiling` hands out fractional ceilings and the count
takes `Math.ceil` of them, while `roomFor` asks `r < ceiling`, so a ceiling of
47.0000001 is a row on the books and not in the ground. Small, but it is the
"physically full one grain before the counter agreed" class of bug pit.js
already documents once: `pitFull()` is the count, so the lip can stand throwing
dust at a hole the search has already refused. Found because `__grant` sized
its handout by the count and the last grains tore the rift (the hook now drops
the tear it starts; the count is still wrong). Fix is one rounding rule shared
by both: settle whether a fractional ceiling rounds up or down, and have the
count and `roomFor` both say it.

## The school comes down: kit is sold where it is worn -- BUILT (2026-09-14)

"The school comes down" in DESIGN.md, with an as-built note. The training
grounds is gone; each kit row is on its station's board (breaker at the
shack, blaster at the quarry, grower at the farm, carter on the bench beside
the belt), made at the station by whoever works there, and opened by the
shield that spent that station's coin (props, net, arch). Worth watching on
a real yard: the blaster and the drill now land behind the arch's four
hundred shards, which is later than before -- intended, but a balance call
to revisit if the cut's machine feels out of reach. A save with hats on the
old shelf puts them on the stand on load, once.

## A ladder is six rungs -- BUILT (2026-09-14)

"A ladder is six rungs, and its length is one number" at the end of
DESIGN.md. A tester found nine trips to the board per ladder tedious; the
fix is `TIER_BAND` 3 -> 2 (six rungs, two a card), with rates easing to the
same tops and counts keeping a whole unit a rung, so the count ladders' tops
come down to between their five-rung and nine-rung figures. Built as one
constant; see the as-built note. Worth a real play to feel whether six is
right, since the per-ladder build total fell by about two thirds. The
builders' 37% utilization ("The builder-throughput tuning pass") is
untouched and still open, and the attended wait (a rung in flight refuses
the next press) is a separate, smaller question the design names.

## The shields are the spine -- BUILT (2026-09-14)

"The shields are the spine" in DESIGN.md. Each failed shield opens the next
station -- props the farm, net the quarry, arch the tower, then the dome --
so the arc is the tree rather than a section on the bench; the jack is cut.
The shield on offer is drawn as a goal card at the top of the bench, and any
card can be pinned to the top-right corner of the game (`S.pinned`), the
goal pinning itself once, on arrival. All three stages landed the same day.
Left to play: the shield prices (`PROP_COST`, `NET_COST`, `ARCH_COST`) as
tolls on the way to each station, and whether the corner wants to sit lower
on a phone. The jack is gone; a save with `'jack'` in `shieldsDone` loads
clean.

## The landing page -- BUILT (2026-09-14)

"The landing page" in DESIGN.md, with an as-built note. `index.html` is the
landing page and `play.html` the game; the picture is `play.html?demo` in a
frame (a staged yard, chrome hidden, reading layers off, camera pushed
right by `TITLE_COLUMN`); the column reads the store directly, and the
record's names moved to `catalog.js` so it can. Worth a look on a real
window: the demo yard at 1440x900 and wider (the crew is small, and the
house sits at the column's edge), and whether the desk's `quit` on the
landing page wants to be `play`-sized. The Electron shell has not been
launched on the new entry page.

## Save slots and the title page -- BUILT (2026-09-13)

"Save slots and the title page" in DESIGN.md, with an as-built note. Three numbered
slots, each its own autosaving yard (profiles, not snapshots -- decided);
slot 1 is every existing save under its existing key, so nothing migrates.
A `saves` page on the held sheet lists them by what they hold (`rock 12 ·
7 crew · 5 days ago`); stepping into an empty one is the new game, the
reset erases only the slot you are in. Keys, the tab owner, `.prev` and
`.broken` all follow the slot; the desk gets `slot-n.json` beside
`current.json`. And a title page: the game opens held on the sheet's
second front (`pebble pit`, `play`, then saves / achievements / settings /
quit); the settings move behind one word; achievements are per yard
because `S.won` is in the save. `__reset`/`__seed` let the hold go so no
check or scene stalls.

Worth a look on a real yard: the title over a played yard at full window
size, and whether `title page` on the held front earns its place or is one
button too many. The desk has not been run with the slot argument threaded
through the bridge -- the store and the adapter are checked in node, the
IPC seam is not.

## The cut is worked in pockets -- BUILT (2026-09-13)

"The cut is worked in pockets" in DESIGN.md, with an as-built note. A swing
takes a three-cell pocket on a 2.6 s beat at pace nought (the ladder
shortens it to 520 ms at rung nine, floor 400 ms), a body works a run of
pockets along its course, and a blaster's swing is a double pocket that
fires the crit's ring. Cut time to the rung is unchanged and pinned by
`test/cut-pockets.test.mjs`. The vertical shafts from the same report were
real and are fixed in the same change: a swing's extra cells (a crit's on
main, a pocket's here) were taken from the nearest undug column at any
depth, which after the first was the same neighbor one deeper.

Worth a look on a real yard: whether 2.6 s reads as slow work or as
standing about, and whether a blaster's ring at power 1 carries from the
usual camera distance. Both are on the dev panel (`CUT_BEAT_MS`,
`CUT_BLAST_POWER`).

## Quarriers float out of the cut after a refresh -- FIXED (2026-09-13)

The player's save was the fixture (`test/fixtures/quarry-rim-refresh.json`,
`test/quarry-rim.test.mjs`). The gang floated up out of the cut and walked
off across the yard -- one clear to the far left -- before coming back.

The cause: `seat`, the spot in the cut a descending body is walking to, is a
live target and is not in `KEEPS`, so it is not saved. A save that catches a
quarrier mid-descent (`goal: 'down'`) restores it with the factory's
`seat: 0` -- the left edge of the world -- and the down leg walked it there,
the width of the yard, before anything corrected it. It never reproduced in
my synthetic saves because those caught the gang already seated and digging
(`goal: 'work'`), not on the way in; a nearly-finished deep cut like the
player's spends much of its time climbing in and out, so a save is far more
likely to land on a descent. The fix is one line: a seat outside the cut's
walls is no seat, and the down leg derives a real one (`seatX`).

Landed with it, from the same report: a working quarrier restored over the
mouth stands on the cut's floor under its own x rather than on the bank;
a body already on the floor told `to`/`down` just works (`inCut`); and the
approach along the top is a walk, not the shuffle. Checks in
`test/cut-station.test.mjs` and `test/quarry-rim.test.mjs`.

## A toast when an achievement lands -- BUILT (2026-09-12)

DESIGN.md, "The noticeboard, and the record on it" > "Amendment -- a toast
when one lands". The original design's "no toast, no banner" is reversed for
the record and for nothing else: one card, the record's own shape, centered
at the top edge for `TOAST_MS`, one at a time in landing order. Decided on
the sheet: it is a button that holds the game on the achievements page, and
the tick and the walk (designed, never built) are dropped for good. Silent
for the veteran catch-up, on restore and reset (`hushNotices`), and while a
cutscene has the camera. `src/toast.js`; `wonShown` in `EPHEMERAL`;
`TOAST_MS` / `TOAST_GAP_MS` on the dev panel; four browser groups in
`src/selftest/settings.js`.

Worth a look on a real yard: whether four seconds is right, and whether a
card fading out over the tower's sky reads as a card or as smog.

## Every ladder sold in bands -- BUILT (2026-09-12)

DESIGN.md "Every ladder is sold in bands (built)". `tierRows` generalized
(band count off the table, multiplier band opt-in, `tierCost` over the
ladder's own length); the apothecary's, bench's, crew's, shack's and fan's
ladders rewritten as band tables; `LADDER` (nine) replaces `RUNGS` (five)
everywhere but the crew multipliers and the tower. Whole-unit ladders (your
strength and pick, the haulers' load) climb higher at the top than they did;
the school's kit rows were left in shards on purpose. Follow-up the same
day: the apothecary's brew speed and armful ladders are cut and doses a
brew is one to seven, a dose a rung (DESIGN.md, "Brew speed and the armful
are cut") -- the building out-brewed its drinkers. The rule is in
CLAUDE.md "Decided". Worth a look on a real yard: the fan dust-first, and
whether a 10 px pick at the top is too much rock.

## The queue -- BUILT (2026-09-12)

Every row at a working site read `busy`; a site takes a line now. `S.works[site]`
grows past one, the front entry is on the go and the rest wait at nought; paid
on press, handed back in full by pressing the row (or its name on the card)
until hands are on it. The card is one name a line with a clock on each,
top-left, sized to its names, under the boards, absent when nothing is
building; hover names the station. Design and
the as-built notes in `DESIGN.md`, "The queue". Checks: `test/queue.test.mjs`
and the `queue card` browser groups; scene `queue`.

Left: nobody has watched a refund's grains fly on a real window (the shot is
still); and a big dust bill handed back is one `bankDust` a grain in one
frame, which has not been timed.

## The desk and the sound -- BUILT (2026-09-12)

The last open boxes on `docs/release-checklist.md`, built as one wave from
`docs/wave-desk-sound.md`: the Electron shell with the save on disk
(`electron/`, the store seam in `save.js`), packaging (`bun run desk:build`,
the day as the version), the version boundary, the sound engine
(`audio.js`) and the yard's `sfx` calls. Every box but touch tooltips is
ticked. `Boulder Setup 2026.9.12.exe` and the portable built and ran.

Left, in order:

- **The ear pass -- DONE, hits only (2026-09-12).** The beds (rain, wind,
  hum, rift drone) and the duck are gone: nothing sounds between strikes.
  A strike is a recipe rendered sample by sample (`render` in `audio.js`),
  the arithmetic of the hit bench (the Boulder Hit Bench artifact), so a
  recipe landed there by ear ships as heard. **The mapping (2026-09-13):**
  every call site names its event (`rock-hit`, `footstep`, `boulder-land`,
  eighteen in all) and `SOUNDS` in `config/sound.js` says which class and
  which recipe each plays; null is silent. The player's second mapping is
  in (2026-09-13): twelve of twenty-three events sound -- the hit, the crit,
  the crew's swing and crit, the boulder landing, a machine's beat, a grain
  into the pit, a core banked, the sky summoned, a wizard's throw, strike
  and crit -- and eleven are silent by choice. The loop for changes: pick voices per event on the
  bench, `copy mapping`, paste it on the dev panel's `sounds` tab (it
  applies live and is remembered), then hand the JSON over to be written
  into `RECIPES` and `SOUNDS`. `node tools/listen.mjs` renders the mapped
  events to `shots/sound/`.
- **Events not yet in the table** (no `sfx` call at all): birds, the
  dance, the balloon, the school, the apothecary, the board, the shields'
  cutscenes. Each is one call and one `SOUNDS` row when wanted.
- **A release is `bun run release -- patch`** and nothing else on this
  machine: it bumps, stamps CHANGELOG.md, tags and pushes, and
  `.github/workflows/release.yml` does the rest on GitHub's runners -- the
  three desktop apps and the browser build, every itch channel, and a GitHub
  release with the CHANGELOG section as notes. The repo is public
  (2026-09-13), so the minutes are free. `bun run publish` still pushes one
  channel by hand when wanted; `desk:build -- --linux` on Windows builds the
  AppImage in docker. Nobody has opened the AppImage or the dmg on a real
  machine. No icon yet.
- **Nothing is signed.** Windows shows SmartScreen, mac the "unidentified
  developer" sheet. Mac: an Apple Developer account ($99/yr), a Developer ID
  Application cert as `MAC_CERT_P12`/`MAC_CERT_PASS` and an app-specific
  password as `APPLE_ID`/`APPLE_APP_PASS`/`APPLE_TEAM_ID` -- the workflow
  then signs and notarizes with no other change. Windows: Azure Trusted
  Signing (`win.azureSignOptions`) is the cheap route; an OV cert on a token
  still warns until SmartScreen learns the file.
- **A vite server watching the tree blocks the packager** (a handle on
  `release/`); `vite.config.js` now ignores it, but a server started before
  that change has to be restarted first.
- The sheet's store lines (`broken`, `yielded`, `unsaved`) were being wiped
  by the sheet's own observer before anybody saw them; fixed in passing by
  track A, not yet looked at in a browser.

## The cutscenes, fleshed out (2026-09-11)

**Status:** built (DESIGN.md, "The cutscenes, fleshed out"). The opening
gets a beat before the chat — the two of them walk out of the house to the
spot, so the house draws its first two rooms before anybody is hired — and
each shield's answer is a `cutscene.js` entry, triggered when a rock starts
to fall on a finished shield and released when the answer is over rather
than on a timer, pulled in by a zoom measured against the shield's height.
`test/cutscene.test.mjs` (5) covers the five answers the player's way;
`rock.test.mjs` and `motion.test.mjs` carry the opening's new beat. The walk
out is about four seconds at the yard's own pace — longer than the design
guessed, and left at the honest pace.

## Scenes: every part of the game, one press away -- BUILT (2026-09-11)

One dev-only list (`src/scenes.js`) read by the held sheet and `tools/look.mjs`
alike; a heading per part with a button per scene; a scene never touches the
player's save. DESIGN.md, "Scenes" (built). Left for later: the scrollbar on
the block is the browser's grey one, not the sheet's hand.

## The casino stays the wheel (2026-09-11)

Two plinko versions were built and cut in a day: a rock carrying the pot down
a tower on the roof ("The drop"), then the sand itself poured through pegs
("The sand board"). Both are in the history and in DESIGN.md as cut sections.
The wheel is what the player wants.

## Nine critics played the game (2026-09-10)

**Section A landed 2026-09-11** (`docs/critics-2026-09-10.md`, A1-A7 and
A9-A11): the shack rung hang, the opening's stuck body, the single
find-fetcher, the dead quarry pace ladder, the poop-column park, the
quarriers' dance, the tower crediting a walking wizard, the shovel hop, and
the three quiet ways a save was lost. Each has a check that was red before it.
Every balance number in that document is now worth re-measuring; the bot
matrix has not been re-run since.

**B2 decided 2026-09-11: a house with balloons keeps up with the machines.**
Measured, it does -- maxed against tune ten to twelve the sky sits at 5-10% of
the cap, never under thirty, never a shower -- and that is the intended shape.
`SCRUB_PULL` is on the dev panel ("house pull") if it ever wants moving.

**B5 built 2026-09-11.** The torn rift eats by reach, and the reach grows
with the disc (DESIGN.md, "The pit's arc", the amended inhale bullet). The two
shots are `b5-young.png` and `b5-grown.png` in the rift-reach worktree.

**C12's last item is a drawing decision.** The farm shed, the quarry shed
and the bench share one silhouette at 1x -- a slab on two legs with a flag
(`render/sites.js` `drawQuarryShed` / `drawFarmShed`, `render/crew.js`
`drawBench`). The art director's ask is one feature of three cells or more
apiece: a pit-prop A-frame roof on the quarry's, a lean-to with the trough
under it on the farm's, an anvil or vice block on the bench. Three sprites,
each with more than one reasonable shape: shoot the options before drawing one.

**A8 built 2026-09-11.** A taught hat lands on a shelf outside the school and
a hauler carries it to its station's stand (DESIGN.md, "The school", the shelf
section). Shot: `a8-shelf.png` in the rift-reach worktree.

**Read `docs/critics-2026-09-10.md` before proposing any balance or tuning
work.** Nine persona agents played the yard at `c87c485` and every finding is
ranked, deduplicated and cross-referenced there. The top of the list is five
simulation defects that make every existing balance table provisional: a shack
rung bought after one-per-rock-hand never lands (`shedhand.js:73`, kills the
ram — found by four critics independently; **fixed 2026-09-10**: the shed
release wrote `goal: 'to'` on a rockhand, which nothing ever cleared, so the
claim passed it over for ever -- `test/shack-stall.test.mjs`), the intro puts the one body on the
rock (counter sits at 1 for ten minutes), one find-fetcher while the rock heap
is backed up (shards and sparks at zero for six hours), the quarry speed ladder
does nothing at any depth, and a hauler parks forever on a poop-only column.
Fix those, re-run the bot, then tune.

## Every station's work goes to a spare hand (2026-09-10)

**Designed, awaiting approval** -- "Every station's work is done by a spare
hand" in DESIGN.md. **The shack's slice landed 2026-09-10**: a player reported
bodies stuck walking to the hut, and the shack is builder-manned now
(`shack: JOB.BUILD`); the quarry, the farm and the apothecary still claim. The shedhand claim (quarry, farm, shack, apothecary) and
the standing credit (scrub, tower, school) both go; every site is
builder-manned the way the bench and the ground already are, a hauler walks
over and does the work, and the yard borrows the nearest body when nobody is
carrying. It closes the item below and the critics' top defect (a shack rung
that never lands once the ram caps the gang at one). The teacher post is
retired with it.

## The scrubbing house, the tower and the school build their rungs for free (2026-09-10)

**Diagnosed, not fixed.** Three gang stations still credit an upgrade to a body
that goes on producing: `handsAt` counts a purifier, a wizard or a teacher at
its post, and the post is where it works. The fan ladder fills while the house
scrubs, the hat rises while the wizard casts, a trade is taught while the
lesson runs. That is the defect wave6-sim item 2 took out of the quarry and the
farm, and this pass took out of the apothecary -- where it had the opposite
face: a keeper is out dealing on nearly every frame, so `another pot` climbed
through the first batch and then froze.

**The fix is one line a trade** -- an entry in `SHED_OF` (crew/shedhand.js)
naming where the claimed body stands, and `stepShedwork(w) ||` in front of the
trade's `work` in crew/jobs.js. What holds it up is not code but where the
body stands and what it costs: a purifier claimed off the fan is a house that
stops scrubbing, and a one-wizard tower stops casting while its hat is made.
Both are the bargain `works.js` already states; both are also balance calls
the sky's target (`pollution-balance-target`) has a stake in. Decide, then it
is an hour.

## The noticeboard and the record on it (2026-09-09)

**Approved 2026-09-10. Not built.** DESIGN.md, "The noticeboard, and the record
on it", now carries the approved catalog: forty-two notices of the fifty-two
proposed, with the approved name and note for each written out verbatim. Ten
were struck off on the sheet and are gone rather than parked. A board between
the work bench and the houses that says what you have done; the income books
move off the pit mouth onto it as its second sheet, which retires `booksRect`
and the hand-tightened hit patch kept out of the rift's air.

**Recognition only.** No notice pays out, unlocks a row or changes a rate. That
is the decision the whole feature hangs off, and it is the same bargain
`records.js` already strikes with the crew's own histories.

**The three calls came down:** the locked list is counted, not named; a body
walks over when a notice lands, and the tick stays too; a body's own record
goes on the crew list off the house board, as its own later piece of work.

**What it costs, after the cuts.** Thirty of the forty-two are one comparison
against a field already on `S`. Only three need anything remembered between
frames -- two per-rock flags and one stamp, all cleared when a rock lands -- and
the two that wanted counters of their own (a crit streak, broke-having-been-rich)
are both cut. The casino pair and `nobody hired` are event hooks: marked earned
where the thing happens, with nothing carried.

**Left open, and both dev-panel questions rather than code:** every threshold in
the numbers table, and the 50,000 on the two casino notices.

Big enough for the wave treatment: the catalog, the board and its two sheets,
the site row, and the witnesses at their event sites are four tracks with nearly
disjoint ownership.

The sheet the approval was made on is `docs/noticeboard-catalog.html`.

## The farm and the quarry sell the same rate twice (2026-09-08)

**Built, 2026-09-09.** Both boards sold a `speed` rung and a `speed x` over that
same rung. Each ground now sells a place and two ladders -- a yield one and a
speed one -- twelve rungs each in four bands of three, each band its own card
with its own name and its own bill. `tierRows` in `src/upgrades/tiers.js` builds
all sixteen cards from four tables; a new band is a line in a table.
`labtend`/`labcave` are band four of the speed ladders, keys and all, and
`labcrop`/`labseam` are the two new yield multipliers; `levelOf` clamps per key
off `MULT_MAX`. The speed curves run to the same floor over nine rungs, so no
rate got faster. `PLOT_COST` is 520, `BENCH_COST` 20 and all four ladders open
at 720 dust. Checks in `test/ladders.test.mjs`, bought through the rows.

**Left open**, and both are dev-panel questions rather than code:

- **The four first prices and the ladder's steepness.** `tierCost` spreads
  `rungCost`'s five-rung span over twelve, which keeps the top of a ladder where
  a ladder's top has always been. Every first price is an `export let` with a
  `TUNABLE` row.
- **Band four's core line.** The bill is the dust price converted at `DUST_PER`
  in each of the other four coins, which at the top of a ladder is seven cores
  -- fair value by the economy's own exchange rate, and still seven rocks. Worth
  looking at on a played yard before anything is changed about it.

## The shack landed on the browser tier without ever being run against it (2026-09-08)

**Fixed, 2026-09-09 (wave release, track F).** The badge rides the shack board's own title when the board is `lone`; `openingCamX` frames bench-to-rock when the window has the room and falls back to the rock-first seat when not; the four neighbor-state checks set up their own yard. Sharded tier 430/430. Left as it was: the shack still draws a "rock miners" heading under a title that now wears the badge -- two lines about one crew.

Originally: **Open. Six browser checks red on main; the node tier is green.** The shack was
built and merged with seven green node checks of its own and the browser tier
never run, so everything below is the join between "the rock's rows moved to the
hut" and the checks that still look for them on the bench. Diagnosis for each,
because none of it has to be re-derived:

- **`your pick and a rockhand bite are bought apart` (view.js).** Fixed for the
  group run alone -- it opens the hut and stands at it for the bite, at the bench
  for the pick -- and still red under `tools/test.mjs`, which shards and so hands
  the group a different yard than `--only view` does. State from a neighbor, not
  the fix.
- **`the headcount rides on the section as a badge` (crew.js:494).** This is the
  real one, and it is not a check problem. The badge rides the section named
  "the rock", which has moved to the hut's sheet -- and the hut has a single
  group, so `lone` in shop.js draws no heading at all. The rockhands' headcount
  now has nowhere in the game to be shown. It throws rather than fails because
  the detail argument is evaluated before the guard.
  **Blocked on a call:** does the hut draw its heading after all so the badge has
  a home, does the badge move onto the board's own title, or do the rockhands
  stop carrying one?
- **`the opening view is looking at the rock` (view.js).** The shack reserves its
  ground whether or not you have bought one, so the bench and the whole walk
  behind it stand 154px further out, and a desk-sized window (1440x900) no longer
  reaches the bench. Measured: the opening camera misses it by 540px where it
  missed by 386 before.
  **Blocked on a call:** widen the opening view, or accept that the first thing
  along is now the hut's ground and the bench may sit off the edge at open.
- **`shop opens at the bench and is not buried` and `a card is only ever taller
  by a whole line of title` (boards.js).** Both pass on a fresh page and both
  fail in the sharded suite, so both are reading a bench that a neighbor filled.
  The bench lost five rows to the hut, so which rows are on it under a given
  purse changed underneath every check that assumed the old set.

## A body assigned to a closed quarry stands a body-height into the ground (2026-09-08)

**Open, and NOT new -- it predates the shack.** `test/home.test.mjs`, "a body put
to work comes out of the house first", trips `verify.js`'s ladder rule: a
quarrier walks with its feet up to 31px below a flat ground line with no working
under it. Its `foot` is right (1980) and its `y` is wrong (1998, exactly the
ground line) -- a body-height, which is the y/feet confusion this codebase warns
about.

It is reached with the quarry *closed* and two quarriers put on by `__assign`,
which is a state a player cannot get to. Seed-swept on both sides of the merge to
be sure it is not the shack's: pre-merge main sinks on seeds 2, 3, 4 and 7 and is
clean on the suite's 20250830; post-merge it sinks on 20250830, 3, 5, 6 and 7.
The merge only moved the crew block 54px and shifted the run's phase -- it did
not cause this. The check has been going green on a seed that happened to miss it.

**Blocked on:** finding what sets `y` to the surface rather than a body-height
above it. `stand` -> `climbTo(w, surfaceUnder(w))` is the path, and
`feetOn(wayAt(x, y), x)` reads 1980 for a body at 1980 -- so it is the sunk `y`
feeding `wayAt` that keeps it there, and the first push down is still unfound.
## The bench arrives out of nothing (2026-09-08)

**Built.** See "The bench is built, not delivered (built)" at the end of DESIGN.md.

The `bench` step in `STEPS` flips `S.seenBench` the frame `canAfford()` first goes true and a
workbench appears on ground that was bare -- the one structure in the game that teleports, and the
first one the player sees. The design replaces it with a call to build standing on the bench's
footprint: press it, an 18-worker-second `place` work opens on the `yard` site under a hidden
`raisebench` row, the existing lending rule takes your one digger off the rock, it walks over and
hammers, the standard bar runs over the footprint, and the bench is drawn when the work lands.

No dust price -- the row you could afford is still there to buy afterwards -- and the call cannot
time out or be dismissed, because everything you can ever buy is on that bench.

The control is a real button on the page, floated over the bench's footprint by `seatCall` in
board.js and seated off the same world-to-screen arithmetic the boards use -- the user's call. It is
the one control a player *must* find, and chrome reads as chrome in a way a mark on the ground does
not.

Checked in both tiers: `test/bench-raise.test.mjs` presses the same function the button calls and
follows the digger off the rock and back, and the browser tier's opening group finds the button with
`elementFromPoint` and clicks whatever is actually there. Two scenes for the picture: `call` and
`benchup`.


## The shop boards resize while you read them (2026-09-08)

**Built.** See "A board has a size" at the end of DESIGN.md.

Measured headless on the bench board: a card's `busy: <works>` status line took
the sheet from 525 px wide to 731 with two works named and 1167 with three, and
snapped back when the build landed. `.panel .sheet` is `white-space: nowrap` and
was content-sized, so `remeasure`/`place` re-seated the whole panel on any word
that arrived; `.cost` and `.note` had already been let out of `nowrap` one cell
at a time for the same reason, and the status line would have been the third.
The sheet's width is pinned to its row set now (`pinWidth`, board.js), the
status vocabulary is closed and short, and both are held by checks.

The one row whose reveal could flip back off -- the farm's door, gated on the
dust in the hole -- reveals through `once` and stays. `test/boards.test.mjs`
holds every row in the game to that, so the next one written the old way is
caught by the check rather than by a player.

Left alone deliberately: the casino's four table rows come and go between hands,
which is a table doing what a table does, and a row leaving because its build
landed still resizes the board -- that is a change to what the board holds, and
the design says a board may resize for those.
## Audio — the rule is written, nothing is built (2026-09-08)

**Designed, not built. Awaiting approval before any code.** See "The sound of the yard
(design, not built)" at the end of DESIGN.md, which replaces the one-line seed that used to sit
under "Open questions". This is the release-checklist audio item, done as the checklist asks: the
rule first, of the "black and white, flat shapes" kind, approved before a line of it is written.

The law is *you hear the yard, not the game; everything is struck, and nothing is played* — a sound
only exists where a body moved material, so no UI chrome sounds at all, and every voice is a short
percussive event or a slow bed of air, nothing bright and nothing long. Six voices off one signal
chain (stone, wood, metal, water, air, the rift), four density classes (the player's click always
sounds; the yard's bulk folds into one sound per short window with a hard drop past the ceiling;
beds are driven from state once a frame, never by events; punctuation is rare and may duck), and a
mix that is quiet, limited, enveloped end to end and nearly mono.

**Blocked on three answers**, all in that section: whether there is music and whether the sky is it;
whether it ships off by default or on and quiet; and whether the tower and the rift get the game's
one non-percussive voice or stay silent. The first of those decides whether an hour has an arc, so
it is not a detail to settle during the build.

No test tier can hear anything, so the ear is the check the way a shot is the check for drawing —
but the *decision* half (how many voices a burst of forty grains fires, whether a bed's level
tracks the storm) is a fact about the yard and gets a node-tier file if audio.js keeps its decisions
away from its `AudioContext`.
## A shack at the rock — built (2026-09-08)

**Built**, on `worktree-rock-shack-design`. See "The shack at the rock" at the
end of DESIGN.md, whose last subsection records the five things the build
changed about the design.

The rockhands have a hut off the rock's left flank, and the gang's two ladders,
the rock's `swing ×`, the ram and the ram's tuning ladder are sold on its board
rather than the bench's. Your own pickaxe, swing and hold-to-mine stay on the
bench, because you are the cursor. `put up the shack` is a bench row at 150 dust
and a third of a building's work, offered once the price is within reach. The
helmets and the headcount moved off the middle of the rock to the hut's door.

The layout cost nothing it was feared to: `SITES` is a declarative table, so the
shack is one row at the front of it, and the rock's size rule and the ram's
parking clamp both read `flankX()` — the nearest building — instead of naming the
bench.

**Checked:** test/shack.test.mjs (7 groups, all green), test/mult.test.mjs
re-pointed, test/kit.test.mjs's fallen-helmet race fixed (it was passing by
geometric coincidence -- see the end of the DESIGN.md section; the fix passes
with and without the shack), test/golden, test/boards, test/machines,
test/persist-roundtrip, test/wave3-buildings green, browser
boards/places/cursor/press groups green, and the layout read off
`shots/shack.png` at the biggest boulder.

**Known red, not mine:** `every field on S is accounted for` in
test/persist-roundtrip.test.mjs fails on `rescued`, `rescueTo`, `landAt`,
`shield`, `shieldsDone` and `rockHeld` — six fields in none of state.js's three
lists. It is red on main too; the shack's own fields are listed.

## Wave release — the web-side checklist (2026-09-09)

**Built and landed, 2026-09-09.** Six tracks, all green, merged without a
conflict; the integration afterward was three things: `isSave` tightened to
the boot's own rule (a blob with any string for a rock used to boot a new game
over the player's and report success); `ways()` memoized on its eight scalars
so the perf gate's `ways <= 1` holds (it was 53 a frame on the busy yard, one
per body from `wayAt`'s default argument -- the spec's premise was wrong about
main, not the gate); and the sheet's round-trip check re-run once C's
`importSave` was under A's button. Two findings surfaced by the tracks, not
fixed:

- **The sim is camera-dependent.** The sky's motes spend the shared seeded
  RNG at *screen* positions, so two camera placements draw different numbers
  and the intro's thrown grain lands on a different frame (1180 vs 1195).
  Cosmetics should have their own generator; until they do, no check can
  assert frame-exact timing across a camera change.
- **`addGrain` on full bare ground has no region.** The region lookup returns
  `null` for bare yard, the same value as "no region", so `inRegion` is always
  true and the search runs to `b.cols` -- it can walk into a neighbor's
  strip, which is the teleport the comment above it says was fixed. Neither
  gate yard hit it in 300 frames; the gate would flag it.

Originally: see
`docs/wave-release.md` (the spec, canon for the five tracks) and "The sheet"
at the end of DESIGN.md (the reasoning). Tracks: A the settings sheet on the
held sheet, with the version and the reset button; B reduced motion; C save
export/import with a one-deep `.prev`; D the hidden window's clock clamp;
E a count-based perf gate; F the shack's six browser reds (calls made: the badge on the shack board's title, the opening view widened to frame rock-to-bench). The seam modules (`src/prefs.js`, `src/version.js`,
the `__BUILD__` define, the `importSave` stub) are on the branch already so
that no track waits on another. Not in it: the Electron shell, disk saves and
packaging (one wave after the shell design), audio (its own wave after the
sound rule), touch tooltips.

## Everything that is not content (2026-09-08)

**Surveyed, nothing built.** See docs/release-readiness.md: an inventory of the
save, the clock, the window, the tab, the build and the deploy, with file
references, and then a prioritized list of what is left before this is a thing
you can hand somebody. The working list is docs/release-checklist.md — one box
per item in priority order, each with what done looks like and a pointer back
to the report's reasoning; check things off there. Note the target has since
changed to an Electron desktop app, and the checklist reflects that where the
report still argues the web case.

The three that matter. ~~A throw inside frame() stops the loop for good *and*
leaves setInterval(persist) writing the thrown state over the good save once a
second, so one bug can cost a run rather than a reload.~~ **Built, 2026-09-09**
(item 1): `src/crash.js` -- a throw in a frame, at boot, in a handler or in a
promise marks `S.fatal`, which `persist` refuses to write past; the loop is not
rescheduled; the `#crashed` sheet (the held sheet's register: a word, the
browser's one line, a `copy save` button) goes up in the middle of the window.
Any uncaught error is fatal on purpose -- a pointer handler that threw has left
the yard in a state nobody reasoned about, and the save is worth more than the
session. There is no way for a
player to get their save out of the browser -- the copy-save button exists but
is behind import.meta.env.DEV (the stopped sheet now has one, but only once the
game has stopped). And the built index.html references its assets
absolutely, so dist/ 404s from any subpath and cannot be uploaded to itch or a
Pages project path as it stands.

One real defect rather than an absence: rAF does not run in a hidden tab, so
clock.js adds the whole away duration on the first frame back while game.js
clamps dt to 100 ms. The yard does no work and every now()-based deadline --
doses, a spin, a break, nextBoulderAt -- resolves at once. Pillar 2 says no
punishment for walking away.

## The builder-throughput tuning pass — measured, not yet fixed (2026-09-08)

**Designed, not built.** See "The one bench carries two ladders' worth of waiting" at the end of
DESIGN.md. This is the tuning pass "The bench is a catch-all, and the lab goes" flagged as a real
blocker: `buildposts` and `buildpace` now gate every timed purchase in the game.

Measured with `tools/node/yard.mjs`, bought the player's way (`__buy`/`__assign`): a solo build at
max posts+pace matches its effort math almost exactly (20s measured against 18.3s predicted). But
a representative backlog — every building, both machines, all four multiplier ladders, 2,332
worker-seconds total — did not clear in 2,000 game-seconds (over half an hour, against a 90–120
minute run) even at the very top of both ladders, and builders were measured doing useful work only
about 37% of the time while three or four works sat queued together.

**Not root-caused.** The gap is roughly 4x what the ladders' own numbers predict, and it shows up
only once several works compete, which means retuning `buildpace`'s price or step is not obviously
the fix — a builder who swings faster and is idle two-thirds of the time is still idle two-thirds
of the time. Next step is instrumenting `handsAt('yard')` against builder positions to find out
whether the missing time is walking between scattered sites, `slotFor` reassignment thrash, or
`stepWorks`'s own accounting, before any number in `src/config/build.js` is touched.

## Seven movers still write `y` as a position (2026-09-08)

Found while clearing the suite. `stepFarmhand` set `w.y = walkY(...)`
outright every frame, which is a teleport whenever the body is not already
on that line -- and one was, because the celebration latches a body's own
y as the floor it dances on. It fell twenty-four pixels in a single frame,
most of its own height. Fixed there by going through `climbTo`.

The same line is written seven more times:

```
src/crew/teacher.js:28    src/crew/tenders.js:94, 115, 126
src/apothecary.js:443, 467                src/balloon.js:352
src/intro.js:207, 211
```

`route.js` names this class out loud at the foot of `climbTo`: "What made
a body float off the crest was never the climber: it was movers that never
asked it (a roam that moved x and left y) or overrode it (a sway written
as a position). Fix the mover, not the law of walking." These are the
overriders.

**Not done as one sweep, deliberately.** `climbTo` keeps state on the body
(`foot`, `footAt`, `scaleAt`) and the tenders' and the balloon's cases are
bodies going through doors and up into baskets, where "the ground under it"
is not the question being asked. Each one wants looking at on its own, with
a shot, and probably a check per mover. It is a small pass, not a
one-liner, and it is worth doing: every one of them is a body that can pop.

**Also open, from the same hunt.** A body joining the dance out of a walk
runs `w.y = stand(w)` on that frame (`jig` in crew/dance.js), and a body
mid-climb is legitimately behind its own footing -- measured, up to
seventeen pixels of snap. `stand` is `climbTo`, so it cannot move more than
a cell a frame; what jumps is `w.foot` being re-taken from the new y on the
same frame. It only shows up if the beat starts while the crew are
commuting, which `dance.test.mjs` does not currently arrange.

## The suite is green again (2026-09-08)

Ten reds, none of them a game defect. Written down because the shapes
repeat and the next one will be one of these again.

**Four checks were measuring the yard with a stopwatch.** The tower was
timed from the purchase rather than from the frame somebody is standing
in it; the gang were given ten seconds to get back to the rock when the
muck beside it goes on slumping over their columns for another half
minute; the muck on the rock was read off the single frame the yard as a
whole was wettest, on the one surface in the game with a gang shovelling
it clear; and the pot picker's press landed during the rift's tear
cutscene, so it skipped the scene instead of opening the menu. Each is
now waited for rather than counted out.

**Three were measuring against a surface that had moved.** The yard's
pitch is `SLOT_PAD + STATION_GAP` wall to wall, not STATION_GAP between
drawn extents -- every site owns the same apron now, heap or no heap. A
body's feet answer to `standTop` over `cutTop`, not to a point sample of
`quarryFloor`. And a body's footing is `surfaceUnder`, not `walkY`, which
is documented as not knowing the rock is there.

**Two were holding a copy of something live.** The pot check worked its
screen coordinates out once and then opened a board, which moved the
camera; it spent the second half pointing at bare ground. And
`wave31-order` reset with `__reset`, which is `newGame` and leaves the
buildings standing, so its second yard was its first one.

**One needed new doors.** `wave31-order` used the school and the lab; the
lab is gone. It is the school and the plots now -- on a blank yard with a
crew and a purse those are the only two unlock rows showing, and neither
is the construction bench, which cannot be half of that pair because
standing it up turns building into a post you have to hire for.

New hook: `__nocine()` ends a running scene without pressing anything. A
grant big enough to matter overfills the hole, tears the rift and plays
the tear, so any check that banks a purse and then presses a control is
otherwise pressing the skip.

**And three more the full tier turned up, in files nobody had run.** Two
were one game defect: the casino's table ground was measured to the lab,
which is deleted and therefore never seated, so `potTo` came back 0 and
the pot's plot was one column wide -- a hundred-grain stake put twenty on
the ground. Derived from the walk now. The third was `stepFarmhand`
writing `y` as a position; see the entry above it.

## The bench is a catch-all, and the lab goes -- BUILT (2026-09-07)

Built on `worktree-green-suite`: the cards, the redistribution, the lab's
deletion and its fallout. What follows is the design entry it was built
from, kept for the reasoning. See "The bench is a catch-all, and the lab is its
multiplier column" at the end of DESIGN.md, and the drawings at
https://claude.ai/code/artifact/e02a45cb-083e-4d34-bc3a-5a71fd1f25c7 (page two).

Diagnosed: the bench is 32 rows under 15 headings, about 1,600 px on a window
that is often 700, and desktop boards do not scroll. Length is the symptom; the
cause is that it is the one board that is not about anywhere.

Decided: the crew's six rows go to the houses; `posts` and `pace` go to the
construction bench (a registered site wanting only a board); the ten one-row
unlock headings collapse to one `put up` group; the rock's rows and `you` stay,
because the bench *is* the rock's board. Bench lands at 25 rows under 5
headings, roughly 640 px.

Decided: the lab is deleted. Its multipliers move under the ladders they
multiply, and buying one stays a piece of work bodies have to finish -- as a
*build*, because `registerSite('lab', ...)` and `registerSite('yard', ...)`
already run through one engine in works.js and the lab was a second name for it.
`instruments` and `another bench` fold into `pace` and `posts`. `watch the sky`
is deleted rather than rehomed.

**Blockers, both real.** Builders become the only bottleneck on every timed
purchase, so `posts` and `pace` carry weight two ladders used to -- that wants a
tuning pass, not just the move. And old saves carry `labOpen`, `labRooms`,
`labKitLevel` and scholar assignments, so the move needs a migration landing
those levels on the inheriting rows, with a fixture save in `test/fixtures/`.

**Open, small:** what the multiplier row is called where it now sits beside its
base rung. Proposal is `speed ×`.

**Decided since:** a row becomes a card -- two lines in a one-pixel edge, two
across the sheet. Measured off a real page first: every bill in the game carries
a clock (32 of 32), and with the clock counted apart 88% of bills are one or two
currencies, so time is a column rather than a coin. Every state was drawn and
holds; the stepper and the picker sit in the cell a bill would fill, and a build
in progress wears its bar on the card's own bottom edge. It costs height --
about 700 px against 500 for a plain one-line list -- which gives back most of
what collapsing the ten unlock headings won.

**Open, small:** whether twenty-five one-pixel edges read busy at full size. The
alternative is no border, with the grid gaps and a hairline doing the work. A
shot settles it, not an argument.

**Not a defect:** `askwizards` is not a dead key. It is a signpost row in
`src/upgrades/rows-shields.js` -- `sign: true`, empty bill, `lookAt(tower)` --
that appears once the jack has failed. It stays as it is.

## `__give` costs a second per hundred thousand, and used to cost nothing (2026-09-07)

`give` in hooks.js banks one grain per turn of a loop and breaks when the hole
refuses one. **The hole does not refuse any more.** Since the pit arc landed,
the first grain it cannot take tears it open and everything after goes through
the rift (`throughRift` in pit.js, and that is the design working -- nothing is
lost). The loop's only remaining stop is `n`.

So an over-large number stopped being a harmless way of saying "make me rich".
Measured, fresh yard, browser: 10k grains 3 ms, 100k 632 ms, 1M 9.2 s -- linear,
and the hole itself fills at 37,566. One check asked for a hundred million and
took about a quarter of an hour, which is why no full browser run finished all
session; that one is fixed at the call site. What is left is the general cost:
**thirteen other checks and the dev panel's own fill button ask for 999999, and
each of them now waits about nine seconds where it used to wait milliseconds.**
That is most of the browser tier's 294-second wall clock.

The fix belongs in `give`, not in the callers. Past the point where `addGrain`
starts failing, every remaining grain takes an identical path through the rift,
so they can be booked in one go instead of one at a time. The blocker is that
`throughRift` does per-grain bookkeeping (`S.stored`, `S.banked`, `S.rift`,
`S.riftAte`, and the per-kind counters) and a bulk version has to keep every one
of those exact -- it is pit.js's account and worth doing carefully rather than
quickly.

## Seeing the wind — BUILT, one part left (2026-09-07)

The dust and the haze say what the wind is doing now. Two changes, both
drawing, both off one shared shaped number (`gust` in wind.js, the wind's middle
bent down so a lull goes quiet and a gust plainly moves):

1. **Speed** -- a near mote is carried about 25 screen pixels a second in a
   typical breeze, 62 in a strong one. It was 20 at the theoretical peak and
   about 7 typically, which is a drift, and a drift is what the eye files as
   "static field".
2. **The streak** -- a mote is smeared along the wind, trailing behind itself, by
   its own size times how much of the wind its band takes. The near band streaks
   most; the far band works out at nothing and stays square without being told
   to. The haze streaks too, on its own reach, **with its ink taken down exactly
   as far as it goes wide** so a gust spreads the band instead of darkening it.

**Still not built: the gust front** (`windAt(t, x)`, so a gust crosses the yard
and you can watch it arrive). Same blocker as before -- every caller then needs
an honest `x` and `report.js` has none.

Checked by eye and by measurement, not by a suite: the `gustR` / `gustL` scenes
in `tools/look.mjs`, aimed at the times wind.js is actually strongest each way
inside the first eighty seconds (it almost never reaches its peak, so a shot at
a time that merely sounded windy is a shot of a lull). The ink conservation was
measured on the same scene, same seed, same clock, main against the branch:
four thousandths of a level out of 255. The browser `wind` group (24/24) and
`test/sky-air.test.mjs` (6/6) are green.

## The drain — BUILT (2026-09-06)

feedback8 items 5, 6 and 7 (dust spreads before the rift takes it; no swirl;
the disc reads as chaotic) were one problem: three separate accounts of how a
thing falls into the hole — the hauler's aim, `orbit()` in game.js, and the
sprite's streaks in render/cores.js — and the eye read the disagreement. There
is one law now, `riftFall` in rift.js, and all three read it: the radius comes
in steadily and the angle is its log, so the turning accelerates as the radius
shrinks. See "The drain: what falling into the rift looks like (built)" in
DESIGN.md, including the two things building it turned up that the design had
not foreseen. Covered by `test/drain.test.mjs` (3/3); the `grown` scene in
tools/look.mjs is the eyes on it.

All eight feedback8 items are built. The other five (shop closing on a
purchase, bar and done-tick above the flag, the resource card off the pit, the
pile mark under the pile) landed on main earlier the same day.

## The pit's arc — BUILT (2026-09-06)

A third era between the solid pit and the abyss: the first overflow tears a
*small* hole that inhales at full strength and grows with what it eats
(`S.riftAte`, derived diameter, nothing sold, nothing tended); at `ABYSS_AT`
(1,000,000 on the user's review) it collapses and the drowning — the abyss as
built — happens then instead of at the first overflow. Both transitions are
one-time cutscenes via `src/cutscene.js`, which owns the camera exclusively,
never pauses the yard, and skips on any click; this deliberately reverses the
game.js note against the collapse taking the camera (premise changed: rare
story beats, one system, a skip). See "The pit's arc: solid, torn, drowned
(built)" in DESIGN.md. Covered by `test/pit-arc.test.mjs` (6/6), with
`rift.test.mjs`, `pit-full.test.mjs` and `persist-roundtrip.test.mjs` green
alongside; the `tear`, `grown` and `drown` scenes in tools/look.mjs are the
eyes on it.

**It collides with the grind pass's lever 5** (below), which proposes bringing
the rift ladder back as the endless red sink. There is no ladder here and the
arc's whole argument is that there must not be one — the disc grows by being
fed, not bought. Lever 5 needs a different sink, or a decision that overrides
this section.

## Wave 7b — BUILT (2026-09-06): items 16 and 27

Hand-assignment and the build yard, canon in `docs/wave7b.md`, both DESIGN.md
sections flipped to `(built)`. Bulk assignment and touch lift are future work
by design.

**The construction bench has since been scrapped** (see DESIGN.md, "The build
yard"): workers build things themselves again, which is what the else branch
of that one `if` had been doing all along. Its two follow-ups went with it --
the missing under-staffed mark and the approximate `leftAt` on a two-build
yard -- because the yard holds one build at a time again. Hand-assignment is
untouched.

## Wave 7 — BUILT (2026-09-06), on `wave7-landing`, awaiting fast-forward

feedback7.md, four tracks (sky/intro, shop UI, crew interaction, apothecary),
canon in `docs/wave-feedback7.md`. All 25 buildable items are in; the four
wave test files plus persist-roundtrip are green on the merged tree, and the
seams (diamond → aura, the under-staffed tooltip, the swift and gleam brew
call sites, the closet heading) are wired. Items 16 (workers assigned by
hand) and 27 (the build yard) are designed, not built — their `(design, not
built)` sections in DESIGN.md await sign-off. Track deviations worth review:
only job-walkers gross out at poop (bodies mid-commute pass through); the
buried square tosses cores into the pit's mouth, not at coreHome, to avoid
the relaunch loop; the pickaxe's top bite is now 4px against the old capped
2.2px, a real balance shift. The wave's 12 standing reds (found by the full
node tier at the grind-pass landing) are all diagnosed and fixed
(2026-09-06): the ram gate and `__fullSites` now ask the pick ladder's own
top (`ROCKHAND_RUNGS`) instead of the shared `RUNGS`, which cured the five
ram/machine checks; two board-measuring reds were `getComputedStyle` in the
node yard (guarded in `panelGap()`); the janitor gagged at the poop it came
to shovel (the mess crew is exempt from the gross-out now); the jumping
celebration's check ran on rock 1, which is the reunion where nobody jumps
by design — it jumps to rock 2 now, and a walking body on the yard gives up
its walk to dance instead of never dancing; the casino's thousand-chip check
was funded for six spins against 40% odds and wave 7's motes shifted the
seeded rng into a six-loss streak — it is funded for its own forty-spin loop
now. The fan/sky pair was a broken premise in the check itself (the storm
wait ran the fan on the wound-up sky; the wait comes first now); the books
rate was green on the re-run. The browser tier's nine reds (same day,
307/316) are being worked through in the same close-out: the hover-card
checks against the slim card, the dance-jumping pair (cured with the node
one), the board-crossing tooltip pair, the loose-core cursor hint, and one
shard that died without reporting.

## The grind pass — levers 1–4 BUILT (2026-09-06), lever 5 open

The economy measured with a driven playthrough (`tools/node/playbot.mjs`,
landed with the design): the opening bench clears in eleven minutes, a new
board is affordable on the frame it opens, spores pile to thirteen thousand
against seventeen shards, and no six-hour run ever reached a wizard or a
machine. Diagnosis and six levers — reprice the grounds by mint rate, open
boards poor, let the bench ladders outrun the crew, turn the core waits into
earnings, bring back the rift ladder as the endless red sink, re-measure with
the bot — in "The grind pass (design, not built)" in DESIGN.md, with a target
pacing table. Playtested and approved 2026-09-06; the re-measure shows the opening
staggered and the apothecary earning its reveals. Open: lever 5 (the rift
ladder as the endless red sink); the quarry/lab doors may still sit heavy
(bot says 200 min / 5.3 h — a saving player will read differently, watch the
next real save); verify quarry occupancy on a real save before touching
shard supply (the bot's shard famine may be its own staffing policy).

Lever 1, second pull (2026-09-10): the found coins were still the cheap half of
every bill. The bot's yard mints forty-odd spores a minute by hour two and sat
on 6,400 spare against about 1,270 ever spent on spore-priced rows; shard rows
opened at one to twenty shards. Every shard and spore leg went up fivefold
(rows that name their own first rung, the machine bills, the wizard hat, the
lab door, the fan, the shields, the school, the second cap) and `DUST_PER_SHARD`
/ `DUST_PER_SPORE` went to a fifth (60 -> 12, 15 -> 3), so the derived dust
legs and the tier bands' coin legs move by the same factor and the dust does
not. `BREW_CROP`, the apothecary's per-brew spore drain, was left alone: it is
upkeep, not a price, and fivefold there would starve the pots. Re-measure with
the bot once a real save has run on it; the machines' shard legs (800 for the
ram) are the ones to watch if the endgame reads as a wait.

And red, the same day: the sky gives up four or five sparks a minute however
many hats are in it (one star every 42 s), so a wizard rung at 12 was three
minutes and a spell at 25-45 was five to ten. Every spark leg trebled -- the
wizard rungs, the four spells, the jack, the four machines, the tuning ladder's
first rung, the rift and its widening -- and `DUST_PER_SPARK` went 60 -> 20,
so the tuning ladder's derived dust and the machines' named dust stand where
they were. A machine is now an hour or two of red past the first wizard.

## The abyss — BUILT (2026-09-04)

The rift's picture replaced: the drowned pit holds a black liquid that eats
at its surface, instead of a disc hanging in the air. The account, the
catch-at-the-mouth rule and the spend order are unchanged; the open call went
to keeping the pit a way through (a plank over the mouth, and `pitTop`
answers with it). See "The abyss (built)" in DESIGN.md.

## Wave 5 — SHIPPED (2026-09-04)

Both batches are on main: the scalability refactor (config/smog/upgrades
barrels, `SAVED` lists with a round-trip check, the `LAYERS` and `STEPS`
lists, the crew `JOBS` registry) and all 21 feedback5.md items through the
new seams. Canon in `docs/wave5.md`; eight tracks, nine follow-up fix
branches, all merged and green except the standing red below. Two of the
wave's unasked-for changes were reverted on the user's review (2026-09-04):
the cauldron kept its original 13-cell shape (the pot pitch widened instead,
which the derived world budget absorbs), and the tonic plume went back to
exactly its pre-wave let-go-into-the-yard behavior — item 6 is withdrawn.

Follow-ups the wave surfaced, none blocking:

1. **Two checks were red before the wave and are red after** — nobody's
   regression, still undiagnosed, each verified red at `bdb9b7d`:
   `sky-readout.test.mjs` "a speck off a swing is the speck in the band",
   and the browser tier's "a hand through the smoke drags the band along"
   (the far end drifts a deterministic 1.04px against a 1px bound — a real
   small leak in the drag, not noise). Two others from that pre-wave set
   were diagnosed and fixed during the close-out: the board-shut probe had
   been outgrown by the bench board's own height, and the cursor group
   pinned the hole's pile-full mark that the rift design removed.
2. **The pit is permanently empty in the endgame** (item 20 as built):
   once the rift tears, nothing ever settles on the pit floor again, so the
   pile — and the crater the nearest-first walk carves — is unobservable
   from that moment on. If that reads badly in play, the correction is an
   inhale that takes what arrives rather than everything present.
3. **The tower lost its endless red sink** (item 15 removed the black-hole
   ladder). Late-game sparks now have one fewer place to go; the fan ladder
   and machine tuning carry it alone.
4. **Retire the four legacy apothecary fields** (`potTonic`, `potSpent`,
   `doseHold`, `strengthLevel`) once enough saves have rolled over; the
   migration in apothecary.js reads them once.
5. **Two rate mechanisms**: `lab.js`'s eased books and `stats.js`'s
   measured window. One should absorb the other; lab.js's is the weaker.
6. **`src/crew/jobs.js` vs `src/jobs.js`** — the registry and the
   vocabulary share a basename a directory apart; rename the registry to
   `registry.js` in a quiet moment.
7. **Seed the `crew` scene in tools/look.mjs** so its shots can prove
   something; unseeded, two same-code runs differ as much as any change.

## The apothecary — BUILT, reviewed, two follow-ups left (2026-09-03)

The apothecary shipped (`src/apothecary.js` + station wiring; DESIGN.md "The
apothecary (built)"). The pot is an upkeep, the stirrer brews through the door
and carries doses out one at a time, the buff lands on the body (a cells-drawn
mark and a `card(w)` row), the four ladders and the three tonics are in, and it
saves and reloads. `test/apothecary.test.mjs` is green (11/11). It went through a
harsh review; the blocking defects (miner tonic inert, the pot reading as a
table, undocumented crit coverage) are fixed. Two follow-ups remain, neither
blocking:

1. **Only dust arcs to its station; the other coins still leave the hole
   invisibly.** *(Dust done.)* A spent resource now flies to the station that
   sold the row rather than to the bench — `payTo` in pit.js, set by `buy` off
   `siteBox(u.site)`, stamped on each grain and read by `fly` (DESIGN.md "it goes
   to the shop it is spent at (built)"). But shard, spore and core are taken out
   of the hole without a flight, so the crop a brew costs still leaves the pile
   with no visible trip *into* the cauldron. Making the other coins arc to their
   station too is what is left — and it is a different job from the full
   hauler-carried delivery (`S.owed`), which is still design, not built.

2. **A second pot brews the same tonic, not an independent one.** `another pot`
   adds coverage of the one setting; the DESIGN "Open" recommendation of a
   second independent tonic (two buffs up at once, two preferred stations) is
   the follow-up. The per-tonic effect submenu is likewise a hover note for now
   — fine for three tonics, worth a real submenu once the lab's recipe ladder
   widens the list.

## Crits — BUILT, four of six work paths (2026-09-03)

Crits fire on the click/miner, the quarrier, the farmhand and the wizard's bolt
(DESIGN.md "Crits (built)"). The **hauler and labber are deliberately not
wired**, and the reasons are in the design: a hauler crit is real output nobody
can see (a crowd of them averages it flat), and the lab is *indoors* — a labber
crit would be a multiplier on a body you cannot watch, which fails the one hard
rule ("a crit you cannot see is a multiplier with extra steps"). If the lab ever
gains a visible unit of work, wire it there. Not a bug to be fixed; a line to
hold.

---


Three items left from `feedback.md` / `feedback2.md`, plus a diagnosed
jitter regression (item 5), the shield story arc (item 6), a balance call the
sky work turned up (item 8) and one piece of housekeeping. Item 7 is done.

**The balloon (item 4) is flying.** It was designed against a haze band the sky
rework was going to delete; the band survived and has the whole sky now, so the
design stood as written -- including the reason the craft moves, which the field
would have taken away. What is left of it is the clog, the fleet's aiming and
the board's reading. Items 1 (dust into the cut) and 3 (dust leniency) are done and
kept below for the record. Everything else in both files is done and on main.

Each entry says what the thing actually is, what was found when it was looked
into, and what is blocking it — so none of this has to be re-derived.

---

## 1. Dust should fall into the quarry, and be fetched from it — DONE

**Status:** done. The cut has its own sand grid, wired into the mouth, the
ladder, the drawing, the save and the reports.

**What it turned out to be, against the plan above.** A `ceiling` could not
say "no dust below the dig line" — a ceiling counts rows up from the bottom of
the *plot*, and the bottom of the plot is the deepest the cut will ever go, so
a ceiling would let dust stand at the bottom of a hole nobody had dug and hang
rock over it. So the rock still to come out is *in* the grid instead, as cells
(`ROCK_CELL`, config.js): every column starts full of it from the plot's own
floor up to wherever the dig has reached, a swing removes exactly the one cell
under it, and the ordinary sand rules do the rest — dust that was resting on
top simply has nothing under it on the next pass. `src/grid.js` gained one
optional hook for it, `fixed(c, r)`, so `settle` never reads a piece of
standing rock as a grain with somewhere to fall or slide into a shallower
neighbour's open air.

- `cut` in state.js: sized once at the deepest the cut can ever be worked to
  (`QUARRY_BENCH_MAX` benches), not grown a row at a time — a bench bought
  mid-dig only adds more permanent floor under a column's *current* target, it
  never moves a row a grain is already resting in.
- `quarry.js`: `wireCut` builds it, `layCut`/`digCell`/`tipCut`/`resetCut`
  keep the rock level with `quarryCells`, `cutTop` is the surface a body or a
  route reads (the dust's own top, not the bare rock under it — `stepQuarrier`
  and `ways().cut.at` in route.js both read it now).
- `game.js`'s chip loop intercepts a chip over the open mouth (`overCutMouth`,
  world.js) the way it already did for the pit; `blocked()` lost the one
  clause that used to bar the mouth outright. The one edge case — a chip still
  in the air the instant `fillQuarry` refills the whole column solid — falls
  back to landing on the ordinary ground rather than being lost.
- `crew.js`: a hauler routes down the one ladder for a claim on the cut's own
  dust, `downTheCut` mirroring `downTheHole`'s shape (a route rather than a
  walk, `claim`/`booked`/`carry` rather than a second bookkeeping scheme), and
  a claim is per-column via `cutTaken` the same way muck's is. Only a hauler
  ever calls `nearestCutDust`, which is what satisfies `nearestMuck`'s rule
  that only a body able to descend may claim a column it cannot stand on.
- Drawn (`drawCut` in render.js, after `drawQuarry`'s white fill), saved and
  restored (`persist.js`, the same run-length pattern as the floor, paired
  with `quarryCells` — which was never saved before this and now is, since an
  unsaved dig depth made a saved cut meaningless), reported (`cutDust` in
  report.js), verified (rule 7 in verify.js now watches the cut's ledger too;
  rules 1 and 2 needed nothing, being written generically against `ways()`
  already). Two dev hooks, `__digCut` and `__pileCut`, for tests and the
  console.
- `test/cut-dust.test.mjs`: a chip over the mouth lands in the cut and not a
  pile; a hauler is seen on the cut's own way and banks a load; `fillQuarry`
  loses nothing, even when a few grains miss the quarry's own pile strip and
  land elsewhere on the ground; no grain ever sits at or below rock still
  standing; a closed quarry works exactly as it always did.

---

## 2. The upgrade system feels disjointed

**Status:** real, and blocked on agreeing a rule rather than on any code.

**What is actually wrong.** There is no rule saying what a board is *for*, so
"where does this row go" has been answered per row. The lab was defined as "the
only place a multiplier lives" rather than by what it is *about*, so it grew one
row per station rate: "quarry speed" in the lab sits next to "speed" on the
quarry's own board, and both move the same multiplier.

**The proposed rule.** A row is exactly one of three kinds, and each kind has
exactly one home:

1. **A rung** — a finite ladder (`RUNGS = 5`) on a number one station owns. It
   lives on the board of the building that owns that number. The rock and the
   crew own no building, so their rungs are on the bench under "the rock" and
   "the crew". A number has ONE ladder: a second tier is upper rungs priced in
   the next coin — which is what `pick` already does, billed in shard + dust —
   never a second row somewhere else.
2. **A place** — bought once, opens something. The bench.
3. **A spell or a piece of research** — the tower or the lab.

**Before doing anything:** produce the full table of every existing row, which
board it is on today, and where it lands under the rule. Agree that table first.
Moving rows silently would rearrange a shop the player has learned.

---

## 3. Dust in front of the rock pile, and off the left end of the yard — DONE

**Status:** done. Two leniency changes, landed together.

**The apron opens.** `blocked()` (`src/world.js`) no longer bars the rock's
clearance, only its footprint — `pastRock`, the renamed and narrowed
`pastApron`. The first attempt broke three things by freeing the whole apron at
once; each now has its own fix instead of being begged off:

1. Grains still cannot come to rest **under the boulder** — `pastRock` covers
   the footprint only, not a hand's width either side, so the ground the rock
   stands on stays barred.
2. The **heap-side clearance the spoil heap stands off from** is untouched: the
   heap's near end still comes from `rockLeft()`/`SITES`, never from wherever
   dust happens to be lying, so it cannot creep up against the boulder.
3. `clearApron()` (`src/rock.js`) no longer shovels the footprint's leftover
   dust into the nearest column — it throws each grain as a `spawnSpoil` chip,
   the arc a miner's spoil takes, so a new boulder's sweepings land out along
   the heap instead of stacking a wall against it. `bankCeiling`
   (`src/world.js`) treats the footprint edge as the cliff the clearance ramps
   away from, so the seam reads as a low scatter shading into the heap.

**The far left opens.** Ground left of `yardLeft()` now takes the ordinary
`LOOSE_DEEP` scatter out to the edge of the world instead of being barred.
Birds mint dust over it (`weather.js`'s `holdsDust` now checks the floor's
world bounds, not `yardLeft`). Haulers still do not walk out there:
`nearestDust`/`nearestMark` (`src/crew.js`) clamp their near end at
`yardLeft()`, so a claim is never booked on a column no body can stand on to
work off.

**LOOSE_DEEP** became a `let` and a row in `config.js`'s `TUNABLE` table, since
it now caps a great deal more ground than it used to.

Covered by three new groups in `test/ground.test.mjs`: "dust let go off the end
of the yard lies where it fell", "dust lies on the ground in front of the
hill", and "a rock landing throws the dust off its footprint rather than
shovelling it". Confirmed by eye with `node tools/look.mjs apron`.

---

## 4. The scrubber balloon — the craft is built; the clog and the fleet are not

**Status:** stage 1 and part of the fleet stage are on main. A balloon is bought
on the scrubbing house's board, moored with its basket on the ground beside its
mast, boarded on foot, and once crewed it rises, crosses the sky, takes the air
in where it is and drops what it catches under itself. The house is untouched.
See DESIGN.md, "The scrubber balloon", and `src/balloon.js`.

**Built:** `CRAFT` as an array from the first craft; the rung on the house's
board (a finite ladder, `BALLOON_RUNGS`); `capOf('scrubbers')` at one plus the
craft; the berth claim; the walk to the mast and the boarding; the patrol; the
radial draught with its own gullet per craft; the drop under the basket, muck or
recycled dust; the drawing; save and restore; `test/balloon.test.mjs`.

**Three things it got wrong first**, each a rule the yard already had and that
had been written down rather than obeyed:

1. **A berth has to be a claim, not a place in the roster.** The roster's order
   is not stable, so the house's berth went to whichever scrubber sorted first
   that frame — and when that was the one already in a balloon, it was pulled
   straight back out of it.
2. **A rider is `aloft`.** The fall rule runs early in the crew pipeline, and a
   body several hundred pixels up with nothing under it is exactly what it is
   looking for: it settled the rider back on the ground every time, so the craft
   rose, lost its rider, sank, and did it again. `aloft` is how the wizard escapes
   the same rule; the scrubber wanted a `shutIn` as well, because a basket is a
   door.
3. **A thing moving less than a pixel a frame has to keep the fraction.**
   Rounding the craft's `x` every frame at four tenths of a pixel rounds it back
   where it started, for ever. The `x` is fractional now and the rounding happens
   at the moment of drawing — to a whole pixel, and not to the lattice.

**Still to do:**

- **The clog.** A craft drops wherever it is and nothing stops it, so it cannot
  yet be made to stop by a filthy yard the way every other station can. The
  design's rule is that a craft clogs on the column beneath it and clears itself
  by moving on, with the pile-full mark going on the mast when every craft is
  stalled. Worth settling item 8 first: the two are the same question about what
  a station's clog is *about*.
- **The fleet, properly.** The rung and the cap are in, and a second craft is
  bought and staffed — but the lanes have not been looked at with two in the sky,
  and nothing aims a mote at the *nearest* craft: each craft walks the whole sky
  list on its own. Fine for one, wasteful for three.
- **The reading.** Nothing on the board says whether a craft is up, crewed or
  still tied to its mast, so the one thing you can do about a balloon — put
  somebody in it — has no reading next to it the way every other station's does.

  The pollution arrow itself is already right, and worth knowing why: `drew` is
  counted **at the mouth**, inside `swallow`, so a craft's catch lands in it
  exactly as the house's does. That is the payoff from the fix written up in
  DESIGN.md under "The air" — the scrubbing figure used to be *quoted* from
  `scrubRate()`, and had it still been quoted, every balloon in the yard would
  have been invisible to the one number the player steers by.

---

## 5a. The stuck yard -- FIXED

**Status:** fixed, from a player's save (test/fixtures/stuck-yard.json, and the
check that loads it). Four defects lined up: the fall rule knocked climbers off
the tall rock's sheer toe and off the full pit's banked pile (climbTo stamps an
active ascent now, and the fall rule honours it); a body walking the brimming
pile read as standing on the yard a body's height below (wayAt answers the pile
now); a fall's landing re-tasked the body home across the world with its muck
claim still held (a landing resumes a shovelling errand, and a retask releases
any claim); and every hauler in the yard stood in a stack at the belt's post
(one tender now, ties broken by roster order). None of it showed on the small
fresh yards the other checks build, which is why the save is the fixture.

---

## 5. Workers jitter on the rock's flank during a muck clear-up

**Status:** diagnosed to one commit and one mechanism; the obvious fixes are
measured and both trade it for a worse regression. Needs one more question
answered before it can land.

**Update:** the 5a fixes halved this (264 -> 130 cycles/min) by ending the
knock-offs, but the bed9ba5 mechanism below still stands and so does its open
question.

**The symptom.** During and after a rain, bodies shovelling the hill bounce at
its flank -- ease up a few pixels a frame, snap down 8-10px, repeat, about three
times a second. Measured with a climb-then-drop counter (ease up >= 2px, then
down >= 12px from the high point): ~26 cycles/min before the offending commit,
~195-264 after, ~560 with the ram running.

**The commit.** `bed9ba5` ("A claim on a mess keeps its elbows out, to the very
last cell"). Bisected: 26 cycles/min at `bed9ba5~1`, 195 at `bed9ba5`.

**The mechanism.** That commit made a body releasing a finished muck column
`return false` for one frame ("a finished column is let go and the next one
picked a FRAME later"), so that the re-pick happens against a claim book that no
longer carries the body's own elbows. But `return false` hands the body back to
its *own job* for that frame, and the job re-plants and re-aims it -- on the
rock that is `plant`/`standOn`/target logic snapping y -- and next frame muck
duty takes it back. Once per swept column, several columns a second across a
gang, is the jitter.

**Two fixes tried, both measured, both rejected.**
1. *Hold the body in muck duty for the release frame* (`return true`): jitter
   drops to 16/min -- and the janitors' clearing rate collapses. The sky-house
   check "a yard with the post staffed is a yard being kept up with" goes from
   15 poop left (HEAD) to 95.
2. *Re-pick in the same breath, scrubbing only the body's own elbows from the
   frame's book*: jitter 18/min -- same collapse, 82 left. Every other body's
   claim was preserved exactly, so the slowdown is not about spacing.

**The open question, which is the blocker:** why does the one-frame fallthrough
to the body's own job *double* the janitors' clearing rate in that check? The
janitor's own step (`janitorWork`) only loiters -- it sweeps nothing -- so the
dropout frame should cost, not pay. Until that is understood, any fix that
removes the dropout frame will fail the same check for the same unknown reason.
Suspect: some second cleaning path runs only when `takeMess` yields, or the
elbow bookkeeping interacts with `elbowMuck`'s spacing in a way the claim book
does not show. Answer that first; the fix will then be a few lines in
`takeMess` (src/crew.js, the release branch).

**Repro.** Seed 20250830; open sites, loo, 2 miners + 2 haulers + 2 janitors;
relay 3 cells of muck across the rock's columns every 5s; count climb-then-drop
cycles over 60s of frames. The counter and the scenario are five lines each --
they lived in a scratch script, not the repo.

---

## 6. The shields — the story arc

**Status:** designed (DESIGN.md, "The shields"), not built.
## 6. The shields — the story arc

**Status:** built, end to end. `src/shield.js` owns every kind through one
`KINDS` table — material, price, coin, and how it answers a rock — with the
four bench rows, the dome on the tower's board, the piece walk on the kit-walk
legs, the rescue in `intro.js`, and seven groups in `test/shield.test.mjs`.

Three attempts to stop the next rock: timber props (bench, dust) the rock goes
straight through; a stone arch (shards) that catches one for a held beat and
then cracks; and the tower's dome (a spell, cores) that finally holds a rock
off long enough for the one underneath to walk out. The first two must fail —
the rocks are the income — and each failure is a beat, not a bill: nobody is
ever under a shield when it goes, and the wreckage flies out along the heap as
`spawnSpoil` chips and mines back as dust.

**Build it in stages that each leave the game playable:**

1. **The props.** A bench row, a built-plank-by-plank structure over the dig
   (bodies walk and climb — no teleporting), a scripted smash on the next
   landing, wreckage into the spoil arc. This stage proves the shield
   scaffolding: a structure with a footprint, a build job for the crew, a
   landing that consults what is standing there.
2. **The arch.** Same scaffolding, quarried stone, plus the two new pieces:
   the *caught* beat (a rock at rest on a shield, every body looking up) and
   the delayed collapse. The arch's stone lands minable.
3. **The dome.** The tower's fifth spell. Purple rings close over the landing
   spot; the catch is permanent. The choreography of the mate walking out —
   the buried-body system (`rock.test.mjs` "the one underneath") changes
   meaning here: after this beat there is nobody under any rock, and the
   says-dots loop moves to two bodies on the surface. Every later rock is
   caught, held a breath, set down.
1. **The props — DONE.** A bench row (`props`, dust, shown from the fourth
   rock), a frame sized against the rock it stands over (next footprint wide,
   current peak plus a body's daylight tall), raised one plank per round trip
   from the bench on the kit walk's legs machinery (`sendOn`, a `'plank'`
   leg), smashed in the air the frame the falling rock's foot crosses the
   lid, wreckage out along the heap as `spawnSpoil` chips. Saved, reset,
   reported; `test/props.test.mjs` runs the whole story through `__buy`.
2. **The arch — DONE.** Same scaffolding, quarried stone, priced in shards and
   offered only once the timber has failed. Two new pieces: the *caught* beat
   — `S.rockHeld` stops the fall the frame the rock's foot reaches the crown,
   every body on the ground marks it, and the rock rests there — and the
   delayed collapse (`ARCH_HOLD_MS`) that drops both. Drawn as a segmental
   arch on two piers, one circle-band law from foot to crown, closing at the
   crown on the trip that finishes it.
3. **The net, the jack and the dome — DONE.** Rope in spores that catches the
   rock and pays out under it to the ground; a sparks-priced machine that
   catches it and drives it back up before the rams give out; and the tower's
   dome in cores, cast on a clock rather than carried, which holds and then
   sets the rock down gently (`landRock(gentle)`) and stays standing for every
   rock after.

4. **The rescue — DONE.** `startRescue` in `intro.js` as a `'rescue'` scene
   phase, triggered by `shield.js` the first time the dome holds a rock with
   somebody still under the spot. The rock waits overhead until they are clear;
   they walk out on their own legs toward the pit — the working end of the yard
   — the camera pans with them, somebody comes to meet them, and then they
   **join the crew**, which is the whole of the reward. `S.buried` goes false
   at the start of the walk (so the square is drawn once, out of `S.pair`) and
   `S.rescued` is saved, so the beat cannot play twice.

**The hard parts, in order:** what the landing code consults (a shield is the
first thing with a say in where a rock stops); how the buried-mate state ends
without orphaning the systems that read it (dots, the opening's promise, the
"still alive" glimpses between rocks); save/restore for a mid-arc yard. Wire
new structures into the pile-full mark and per-cell variation as given.

---

## 7. The sky — DONE, with one balance question left

**Status:** built and on main. See DESIGN.md, "The sky is the band (built)".

**What it turned out to be, against the plan.** The plan was to delete the mote
band and draw the sky as a picture of `S.haze` — a field of thresholds, a cell
painted when its threshold fell under the density. The accounting argument for
that was right and the picture was wrong, three times over: value noise pulled
the cells into grey patches (patches are cloud; haze is not made of shapes); an
even scatter still blotched, because white noise clumps on its own (0.23 to 0.54
ink over eight-by-eight blocks of a middling sky, with no clumping term anywhere
in the code); and when it finally moved it was **nauseating**, which is what
settled it.

A field steps in whole cells, so the entire sky changes on the same frame,
together, several times a second. A mote is a *thing* rather than a sample: it
has its own position, its own slot, its own share of the wind, and it eases. Ten
thousand specks each moving a fraction of a pixel on their own schedule drifts;
ten thousand cells re-decided on one frame boils. No tuning gets from one to the
other, because the difference is not in the numbers.

**So the band stayed, and got the whole sky.** `bandLow()` reads off the ground
line instead of a depth below the top; a puff climbs to its own slot's height
rather than to the underside of a strip (otherwise every puff arrives on the
frame it is born, since the sky's underside is now just above the works); three
times the specks, with every "per mote" constant tripled alongside so nothing
about the balance moves; and the clouds get their own ceiling, there being no
"below the haze" left for them to sit in.

**The rain is a curve**, as asked: the chance is the share of the cap raised to
`SMOG_RAIN_BEND`, nought at nought exactly, no threshold anywhere. Bent hard at
five, because rain takes down the whole sky it breaks on and a gentle bend has
the weather doing the scrubbing house's job for it.

---

## 8. Rain muck clogs the scrubbing house

**Status:** found while building item 7. Real, reachable in play, and not
decided — it is a balance call rather than a bug, so it is written down rather
than patched.

`clogged()` (src/smog.js) counts every grain of muck lying near the house —
`outletMuck()` walks `muckCols()` across the strip — and the rain drops muck all
over the yard. So a sky bad enough to rain often rains on the house's own
doorstep and stops it. **The house is the answer to pollution, and the weather
now switches it off exactly when it is needed most.**

It was nearly unreachable before item 7: rain could not happen at all under
`SMOG_RAIN_AT`, so only a yard already at the brim could manage it. With the odds
a curve all the way down, a middling sky rains too.

**For changing it.** The clog was written for one reason and the comment says so:
the house used to spray its own walk, pouring out for as long as a body stood in
it, so it was given a strip like every other station and made to stop when the
strip filled. That is a rule about *what the house makes*. Weather muck is not
what the house makes.

**Against.** A yard buried in muck stopping its own works is consistent — the
rock stops, the cut stops, the plots stop — and the house being no exception is
the simpler rule.

**If it changes**, the fix is in `outletMuck`: count only the house's own
leavings rather than every grain on the strip. That needs muck to carry where it
came from, which `MESS` does not record today, so it is a field on the layer
rather than a one-liner. Decide the rule first.

## Housekeeping: one test fails every time — FIXED (2026-09-04)

`test/sky-readout.test.mjs`, "a speck off a swing is the speck in the band":
the check predated the arrival cross-fade (a settling mote deliberately goes
to nothing and comes back up at its spot) and then the plume lifetime, both of
which its "full weight the whole way" clause forbade. Rewritten to the rules
that actually hold now: nothing visible ever teleports (a leap happens only
while faded to nothing, and weight at the new spot is an arrival), and the
weight only ever goes one way on the climb. The plume code was tightened to
honor the first rule exactly -- fade derived from the climb's age, and the
relocation held a tenth of a second past reaching nothing.

## Housekeeping: two tests fail at random

Neither is a game bug, but they are why the suite looks untrustworthy — and an
untrustworthy suite is most of why iterating feels slow.

- `test/rock.test.mjs`, "the one underneath is covered by the rock" — roughly
  1 run in 6, and it fails alone as well as under load. It watches 400 frames
  and asserts a body says something during them; the window is timing-sensitive.
- `src/selftest.js`, "a body is thrown rather than dropped" — fails only under
  full-suite load, on a different assertion each time. It drives a real pointer
  with real `sleep()`s, which get squeezed when the machine is busy.

Both want the same treatment: assert the thing that must be true rather than
the thing that happened to be true in a fixed window.

---

## 9. The endgame pass — DONE

**Status:** built, 2026-09-01. `## The endgame pass` in DESIGN.md carries the
measurements and the two calls that went the other way from the design: the
spike was chips landing on a full strip, not the break, and the black hole is
summoned from the tower rather than bought at the bench. Covered by
`test/endgame.test.mjs` and the rewritten `test/rift.test.mjs`; the driven-ram
yard is measured by `tools/node/break-perf.mjs`.

**What it is.** Five faults with one cause — the driven ram outruns everything
downstream. The ram works a falling rock (`ready` never reads `S.rockFall`);
the belt lifts one grain a beat against the ram's six cells and both are pinned
at `MACHINE_MAX_BEATS`, so the rock's pile flickers full; the break spikes on
`clearApron`'s full-floor walk, `wakeGrid(floor)` and eight `refreshRockTops`
a frame; the rift needs a body standing two windows off screen; and the rift's
picture is an arc leaving the screen instead of the hole itself.

**The shape of the fix.** One `rockDown()` predicate for hand and machine; a
counted `bite(tender, n)` so overflow is a bigger bite and the belt's unit is a
hauler's load; measured perf fixes on the break path with a PERF.md table; the
rifter job removed (torn is open, saves restaff the body to carrying); and the
rift as a black disc hanging in the pit at the near end with the `gulped`
grains orbiting into it.

## 10. The hole holds everything — DONE

**Status:** built, 2026-09-01. The rift swallows every kind of cell, counted by
kind in `S.riftHeld`; the pile shows the counter less what is through; paying
takes from the pile first and the rift after. Written up under `### 7. The hole
holds everything` in DESIGN.md, including the two counter/pile disagreements it
turned up on the way (the red was never reconciled into the pile at all, and
`grant` moved four of the five counters without the cells) and the new verify
rule 8 that would have caught both.

## A miner can end up inside the hill (fixed 2026-09-03)

`test/endgame.test.mjs`, "the ram does not strike a rock that is still coming
down" — failed with *a body has been buried in the way it is standing on: kit
(miner) at 3695,1911 is 39px into the rock and has been under it for 61 frames*.
Caught by `verify.js`, not by the group's own assertions.

**The bisect this entry used to carry was wrong, and is worth keeping as a
warning.** It named the pit collapse, because the test passed at `e0f4c43` and
failed on the collapse alone. That was a butterfly: the collapse reshuffled the
run so that a sub-pixel margin was crossed on the one frame that mattered. The
ram was never involved, the pit was never involved, and `fall` was never a
candidate — it only fires for a body *above* its ground, and already exempts a
climb.

**What was actually happening.** `celebrate` (now in crew/dance.js) gated its
duck-out-of-the-footprint on `upTop(w)` — feet within a pixel of the ground
line. A body half way through its idle bob sits about 1.17px below its footing,
so `upTop` read false by 0.17px and the duck was skipped; `jig` then baked the
bob into the footing, so it stayed false for every frame of the fall. The rock
landed on a body standing in its own footprint, 104px deep. It climbed out
correctly at the per-frame cap to 39px — and at that moment `relieve` started a
loo break, which returns before any stepper runs, so nothing called the climb
for `LOO_MS` = 102 frames and it froze there.

**The fix** is one line: that duck asks `onYard(w)` now, the same question the
walk's own duck (crew/commute.js) and the fall rule ask. A pixel is a tolerance,
not a fact about the world, and this one was crossed by the body's own
animation. The two predicates differ only for a body at ground level over a
mouth, and no mouth is reachable from a footprint — the drop zone is `S.cx` ±
300 at the widest rock the game allows, the pit's lip is 636 away and the cut's
mouth 1,434 the other way. Measured over three seeds and 5,400 frames on the
pre-split tree: 406 body-frames in a live drop zone, of which the two predicates
disagree on 1. Rare, and one is enough, because the offset persists for the rest
of the fall once `jig` has baked it in.

**Left undone, deliberately.** `upTop` survives at two station-errand predicates
with the same 1px fragility; a false negative there costs one frame of an errand.
And `relieve` will still start a break for a body being led up a face, which is
what turned a burial into a 1.7-second freeze — with the duck fixed that measured
zero, so it is prevention rather than a live bug.

**One more thing to look at.** `wayAt` answers `rock` for a body standing under a
rock that is still 620px up in the sky, and `verify.js`'s `deepest` then measures
it against the airborne `rockTopY` — "743px into the rock" while the rock is in
the air. Today's falls run 42 frames, under `BURIED_FRAMES` = 60, so it never
fires; a longer fall or a lower threshold would make it spuriously true.
`rockDown()` in rock.js is the predicate that would exempt it.

---

## The floor plan reports room in places that are not there

`capOfBare` (upgrades.js) asks what a station holds and answers off `benches()`
and `plotCount()`. Both of those count what a quarry or a farm *would* hold —
they are read by the drawing as much as by the staffing, and a quarry draws its
benches from the frame it is dug — so neither knows whether the place was ever
opened. A shut station reports standing room, and `assignJob` will fill it.

**What it cost.** `home.test.mjs` assigned two quarriers without opening a
quarry. They walked to where the cut will be and stood 24px under the ground
line, inside a working `ways()` has no entry for, because `ways()` only makes a
`cut` while `S.quarryOpen`. `verify.js` reported it as "a body is under the yard
with no working under it", which is exactly what it was — the verifier was right
and the yard was wrong.

**Why it is not fixed here.** The rule that says it once for everybody is a gate
in `capOfBare`: a station that is not standing holds nobody. That was built and
backed out. It is correct, and it moves bodies in every check that ever staffed
a station before opening one — three checks went red on it (`dance`,
`reload`, `sky-fan`), none of them about staffing, all of them shifted by bodies
landing somewhere else. That is a change worth making deliberately, with the
fallout read one check at a time, and not as a rider on a bug fix.

**What was done instead.** The two ways in are shut. `__crew` already opened the
places it was asked to staff; `__assign` now does the same, so the two dev
handles agree. The board cannot reach this state at all — a shut station has no
board to press — so with both handles honest there is no route to it left, and
the gate is a tidying rather than a fix.

**Where to start.** `capOfBare` in upgrades.js; the flags are `S.quarryOpen` and
`S.farmOpen`. Only those two stations need it: every other count is already
nought until the place is built, because it counts things that get built rather
than a level that can be bought ahead. Expect `__crew` to need its station-open
lines moved above `rebalance()`, which is what shares the bodies out.
