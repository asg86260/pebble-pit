# Still to do

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

## The pot picker: two reds, both older than they look (2026-09-07)

Found while landing the rim ripple. The browser group "standing at a pot picks
what that pot brews" was throwing on its third check, which hid everything after
it; with the throw fixed the group is 13/15 and two real failures are now
visible. Neither is from the rift work.

1. **A press does not open the picker.** `ok(pressed, ...)` is red. Diagnosed as
   far as: a hover at the *same* point does open it, so `potAt` and the
   coordinates are right and the picker itself is fine; no crew count moves on
   the press, so `rosterHit` is not swallowing it either (and the roster sits at
   `groundY + P*10`, below the cauldrons at 1938–1998). Something else in the
   `pointerdown` handler returns before `potPick` at input.js:154 — the
   remaining suspects are `skipCutscene()` and `startle()`, neither ruled out.
   **Worth fixing rather than deleting the check: a press is the only way into
   that menu on a touchscreen**, so this is a real control that does not work,
   not just a red line.
2. **A potency rung does not move its recipe's line.** The last check buys
   `potency-stew` off the board and expects the stew's note to change and the
   other recipes' notes to stay put; nothing moves at all
   (`+25% work, 60 -> +25% work, 60`). Not diagnosed. Could be the purchase not
   landing or the note not being rebuilt on reopen — the board closes itself on
   a purchase now, which is the thing that changed most recently near it.

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
sections flipped to `(built)`. Follow-ups, none blocking: the buildbench has
no under-staffed mark (markAnchor doesn't know its geometry); `leftAt` quotes
the site total so a two-build yard's row clock is approximate while one work
is manned; bulk assignment and touch lift are future work by design.

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
