# Still to do

Open work only. Each item carries its diagnosis and its blocker, so none of it
has to be re-derived. What was built is in DESIGN.md (the `(built)` sections)
and CHANGELOG.md; the old entries are in git history.

## One camera for every cutscene, and a cutscene bench -- APPROVED, BUILDING (2026-10-18)

DESIGN.md, "One camera for every cutscene, and a bench to watch them on".
The act 3 intro's zoom pop, the empty-sky climb and the lost top band come
from six cameras with their own easing, clamps and zooms. The owner chose
per-place zoom changed under the ripple, and smooth tracking. The rise into heaven is a mock-and-vote after the shot is built.

## The yard's sound set, by lanes -- BUILT, NOT LISTENED TO IN THE GAME (2026-10-18)

DESIGN.md, "The yard's sound set, by lanes". Open: the owner's ear on every
lane (the review page and `shots/sound/endgame-lanes.ogg`), the levels of the
takes against the tuned recipes, and the rest of the beats list (farm, stir,
weather, the deep, the story, acts 3-4). `node tools/node/sound-audition.mjs`
is the check for every round.

## The score and the music bench -- BENCH BUILT, GAME PLAYBACK DESIGNED, AWAITING THE OWNER'S EAR (2026-10-17)

Next: "The score in the game, and the menu filter" (DESIGN.md). Blocked on
two by-ear picks: which of the three crushed sketches is the yard, and how
deep the menus sink it (shots/music/menu-filter-demo.ogg); then the go-ahead.


DESIGN.md, "The score, and the bench it is written on": `music.html`, the
preview, Surge live, the render and chords first are on main. Open: the
in-game playback (one loop a place, its own slider), blocked on the owner
having a song they like. loopMIDI must be installed by hand for the live
switch. Nobody has listened to the preview patterns or the render's mix.
The effects chain is built; open on it: pedalboard's Limiter seems to raise
the mix to 0 dBFS whatever its threshold (the render's report, 2026-10-17),
so the master limits about 3 dB harder than it needs to -- a by-ear call on
`MASTER_GAIN_DB` in tools/music/mix.py.

## Acts 3 and 4: the afterlife and hell -- LOOPS CHOSEN, THIRTEEN CALLS OPEN, SCAFFOLD BUILT (2026-10-17)

**Scaffold built** (2026-10-17, branch `acts-scaffold`): the switches, the
two places and their cameras, the empty steps, the stub modules, the save
fields, the beat rows and two scenes -- nothing playable (DESIGN.md, the
section's first paragraph). Blocker for anything past it is unchanged: the
mocks, then lifespans and lineage.

**Connective tissue built as placeholders** (2026-10-17 night, branch
`acts-connective`; DESIGN.md, "The portals and the mansion"): the two
portals, the go-on card, every act beat as a placeholder cutscene from its
trigger, the ghosts' road, the mansion ending and its sheet. Open: every
word (plain labels in locales/en.ftl), the mocks of the tear, the slit, the
souls and the mansion, and boards for the acts' stations on a pointer (A's
`cardAt`/`afterBoard`, B's `hellBoardAt` exist; no STATIONS rows open them).

**Act 4's loop built on placeholder art** (2026-10-17, branch `hell-loop`;
DESIGN.md, act 4's first paragraph): mine, smelt, forge, barriers, flares,
ghosts, four cards. Open on it: the hifi mocks to replace every drawing,
the input and beat wiring (`clickHell`, `hellBoardAt`, `hellWallDue`,
`cageBroken` -- Track C), a tuning pass on config/hell.js, and the
placeholder sources (black water, builders, the stair, flux).

"Acts 3 and 4: the afterlife and hell (design, not built)" in DESIGN.md,
reworked for the owner's story (God forces the dead to work forever; the
pair take God down; God is Satan unmasked; the dead travel back to the
surface; act 4 frees the real God in hell; lives returned, home) and the
owner's rule that neither act's loop is combat and each act feels distinct.
Sixteen beats, cutscene by cutscene; lifespans and lineage as the ground.
The owner's calls of 2026-10-17 are in: **everything keeps running** (the
yard and the deep run and age while the pair are dead -- worked through:
the yard runs on its last rungs to the brim, lines grow generations so the
ghosts come down among descendants, souls keep rising into the crowd and
nudge the strike's bar, four places a frame paid for by off-screen places
not drawing and the crowd stepped as data, gated on PERF.md); **act 3 is
the union**, and its loop is **the owner's grove and press** (given later
the same day, replacing D's rim-a-click loop, which is kept as a note with
E and F): the click is a cloud, which puffs faith down to the camp's
plate (a grey storm cloud -- the yard's smog risen -- gives ink), and
after `CHOP_CLICKS` cloud hits a member hands the pair an axe and a click
on a tree is a chop (`TREE_CHOPS` to fell it, logs for the haulers); faith
buys permanent volunteers (members hired out of God's yard) and saplings;
the grove (God's untended trees, old growth then replanted) gives logs,
the saw mill timber plus sawdust (a nuisance heap until the paper mill),
the workshop signs (timber and ink), the paper mill paper, the press
posters (paper and ink); carriers plant signs in the crowd (close, to the
full rim) and pasters paste posters on heaven's walls (wide, to half), and
word of mouth fills between; a soul's lean is its eight-piece rim, so the
pale field going to ink is the support meter; God's speech and wardens
take down what is spent; the mill's fence (timber against sawdust) is the
act's standing decision; gates at the first meeting (the grove opens),
the slowdown (the paper branch opens, wardens double) and the strike;
bands faith, +timber, +paper, then a pledge (a member) in the spark's
place. The heaven/hell parallel (trees to mill to signs; ore to forge to
tools) is intentional -- the owner: "heaven and hell symmetry but
different" -- and the differences are spelled out: act 3's wide,
by-product web spread into a crowd against act 4's deep, single-file tool
tiers, with tweaks against the overlap (no tiers in act 3, no by-product
in act 4). **act 4 is the mine and the
forge**, replacing expeditions -- a descending run of five chambers, each
with one ore (dross, cinder iron, pitch copper, obsidian glass, adamant;
working names), smelted with brimstone in furnaces whose heat is their
chamber's depth, forged at the anvil into five tool tiers; each tier's
tool breaks the barrier at its chamber's far side (rubble, a bone wall, a
lava gate, the anchor chains, the cage itself), worked down over time by a
wall gang, which opens the next chamber and ore; every fall ends with the
next barrier ringing the tool off, so a failed attempt names the next
ore; the union's members come down as the crew; the yard sends sparks for
the last band, ore as flux, the deep's water to quench. Spelled out how it
differs from act 1's boulder and bought shields. Still open (calls 3-8):
one defeat in heaven or two; Satan in hell or gone, five barriers or four,
the cage worked or a cutscene; what the dead can do on the surface and
when the yard's boards reopen; who gets their lives back; how it ships
(lifespans first, what sets off the fall); the ending and a tail. Act 3's
own (calls 9-15): does faith stay the clicked coin late; trees finite or
replanted; where ink comes from (storm clouds, tree galls, or the glare's
soot); the top band (a pledge or a thunderhead drop); a picket mark for
where signs go, and the fence a control or a fixed split; members stay at
their posts until the strike or walk out on joining; the axe unlocked by
a click count or a faith rung. The owner's order:
spec only, no code ("lets not build anything for act 3 yet"). Mocks of
God, the unmasking, a cloud's puff, the grove, the camp's mills, signs and
posters in the crowd going to ink, hell's chambers, the barriers and the
forge before any build.

## Who you are: Steam names, translations -- WAITING ON THE OWNER (2026-10-16)

"Who you are (built)" in DESIGN.md. The English words were read and approved
by the owner (2026-10-16). Open:
- **Steamworks:** ACH_GOTOUT's display name to "complete act 1"; and ACH_FREED to "complete act 2", by
  hand on the dashboard (the game's own notice already says it).
- **Translations** of the `-who` lines and the role word: deferred by the
  owner ("lets not worry about other languages"). Until a language writes
  them it keeps its older line (lang.js, `msgOr`), so de/fr/es/pt-BR/ru/ja/
  ko/zh-CN still say wife or husband whatever role was chosen and never say
  a name; the new `ward-*` labels show in English there.

## A stirrer stood 21px over the yard -- SEEN, NOT FIXED (2026-10-16)

Found while building the wardrobe: with the meeting's digger sent as the
sqhusband rather than the nearest body (`sendDigger(true)` in `startMeet`,
intro.js), test/scenes-stand-d.test.mjs goes red on the `everything` scene
after its reload: "a body is standing on nothing: wick (stirrer) at
4077,1959 has its feet 21px over the yard (goal in ...) for 61 frames". The
digger was changed back, so the suite is green, but the stirrer's footing is
a real hole that a different crew history reaches. Repro: put
`sendDigger(true)` back in `startMeet` and run that one file. Not diagnosed.

## Feedback form -- DEPLOYED, FIRST SHIPS WITH THE NEXT RELEASE (2026-10-13)

"Feedback form (built)" in DESIGN.md. The worker is live at
`https://pebble-feedback.graham-things.com` (D1 created, its secrets set,
each stored report also mailed to the game's inbox through the `NOTIFY_TO`
secret), the `FEEDBACK_URL` repository variable is set, and the words are
written. No released build carries the button yet: v0.5.2 predates it.
Open:
- **One report from a released build.** After the next release, send one
  from the itch page and one from a desk app, a save ticked, and see each
  land in D1 and in the inbox. Every check so far stubs the network.

## Localization, phase two -- PICKER BUILT, LAUNCH ENGLISH ONLY (2026-10-13)

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

## Endless serpent -- BUILT, THE WALL OPEN (2026-10-13)

"Endless serpent (built)" in DESIGN.md: after the story's kill the serpent
returns once onto its last defense, one bar a level, each emptied bar a
near-death and a power-up. Its words are written and big numbers read short
(`sayNum`, render/numfont.js). Open:
- **The wall**: measured on the old loop at level 3 for seven stations at
  rung 8 (the constrict stops breaking at 4), far under the level-25
  notice; the fight is now the constrict alone, so re-measure it there
  (`tools/node/deep-pace.mjs --stood 7 --wall`) before moving the notices.
  Another agent is measuring it now (2026-10-13); its numbers decide where
  the notices go.

## Controller support -- BUILT, STEAMWORKS OPEN (2026-10-12)

"Controller support" in DESIGN.md (built); the pad rows' words
(`ctl-pad-*`) are written. Open:
- **Steam Input**: electron/steam-input/controller_neptune.vdf is the Deck's
  default config, unproven: there is no app id to upload it under (see
  "Three builds" below). Its binding names are from the published format,
  not from a Steamworks export.
- **Nobody has held a pad**: every check drives a stand-in pad; the feel of
  the glide, the hand's speed (`PAD_HAND_SPEED`) and the repeat
  (`PAD_REPEAT_*`, config/pad.js) are first guesses.

## The index -- BUILT, DRAWINGS OPEN (2026-10-13)

"The index" in DESIGN.md (built); the owner's short descriptions are in
(`idx-*`). Open:
- **Drawings**: 26 entries in src/config/index.js have `glyph: null` and
  show no picture (muck, poop, birds, pollution, the hole, the rift, the
  bench, the crews, the sqwife, the serpent and the rest); each wants one
  in glyphs.html. DESIGN.md's list of the undrawn is older than the table
  and names entries that have since gone.
- **The `i` key** has no line on the controls page, which the landing page
  shares and where there is no index to open; the owner's words if it
  gets one.

## Three builds: itch, Steam, and the Steam demo -- BUILT, AWAITING STEAMWORKS (2026-10-12)

"Three builds" in DESIGN.md: the demo (2026-10-11) and the Steam build,
Steam Cloud, the carry-over and the release jobs (2026-10-12) are built,
and the carry-over's words (`shell-carry-*`) and the demo's last sheet are
written. Open:
- **App ids**: none exist. `APPS` in electron/steam.cjs is null for both
  (placeholders); the release workflow needs the repository variables and
  secrets listed at the top of release.yml before its Steam jobs run, and
  `ITCH_FULL_TARGET` before the paid page gets a push. Nothing has been
  uploaded through SteamPipe yet, so the jobs are unproven.
- **Mac**: the Steam build has no mac depot until the mac app is notarized.
- **Steam achievements** are wired (src/achievements.js): the owner creates the
  49 in Steamworks from `node tools/steam-achievements.mjs` (API name, in-game
  id, in-game title), writes their text and draws their icons.
- The demo's Steam Cloud is not read by the full game's carry-over: the SDK
  reaches only the running app's remote storage. The demo's disk copy, which
  the demo itself keeps in step with its cloud, is what is offered.

## The serpent hardens against its strongest foes -- BUILT (2026-10-07)

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

## A fifth phase: the constrict -- BUILT (2026-10-04)

"A fifth phase: the constrict" in DESIGN.md. Open:
- **Nobody has played it.** Depth 9,000 and the orb's 15% are the model's.

## The serpent heals whole: a phase is a window -- BUILT (2026-10-04)

"The serpent heals whole: a phase is a window" in DESIGN.md. Open:
- **Nobody has played it.** Depths 4300 / 9400 / 6700 / 5100 are deep-pace's
  for a four-fighter party; tune them in play.
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

## The story's objectives -- BUILT (2026-09-30)

"The story's objectives" in DESIGN.md. Open: nobody has read the line
through a whole game.

## The serpent eats to heal -- BUILT (2026-09-30; the constrict 2026-10-15)

"The serpent eats to heal" in DESIGN.md; the meal is the constrict on the
nearest creature, the owner's B of `docs/mocks/serpent-constrict-meal-2026-10-15.html`;
scenes `deep-meal`, `meal-bolts`, `meal-reel`, `meal-gulp`, `meal-swallow`,
`meal-land`. Open:
- **Nobody has watched it in play.** The timings are the mock's first guesses;
  the swallow's swell is small at the game's scale.
- **A small window often has nobody on the glass**, so the bolts reach off
  screen and the orb is hauled in from there (as the rule says).
- **A meal through the kill** plays out on a dying head, healing nothing.

## Cloud saves -- BUILT AND RELEASED (2026-09-28)

Built as `docs/wave-cloud.md`; "Cloud saves" in DESIGN.md. The worker is
deployed at `https://pebble-saves.graham-things.com` (Workers Free, D1
`pebble-cloud`) and shipped in v0.5.0 on the page, linux and mac; the
windows app first carries it in the next release (the workflow wrote its
address through pwsh, which never reached the build; fixed 2026-10-13).
Every player opts in: nothing is sent until they press *enable cloud
syncing* or enter a code.
Open:
- **The `behind` card and *take it* / *keep this one*** have node checks
  but no browser check and have never been clicked by hand.

## Resists: magic in the ward, physical in the split -- BUILT (2026-09-29)

"Resists: magic in the ward, physical in the split, both in the fading" in
DESIGN.md. Open: nobody has watched the fading switch in play (the plates
flicker in `RESIST_WARN_S` before it).

## A phase has a mechanic and a class answers it -- BUILT, TUNING OPEN (2026-09-28)

"A phase has a mechanic and a class answers it" in DESIGN.md. The surge,
the lash and the sink, each warned and answered. Open:
- **Nobody has watched a whole turn in play.** Scenes `phase-surge`,
  `phase-surging`, `phase-taut`, `phase-lash`, `phase-sink`; the periods are
  on the dev panel.
- **The answers are capstones**, so the warded phase's surge is mostly
  unanswered at the pace the model plays. A rung-4 answer, or a later
  surge, if that reads as unfair.
- **The lash's bump reads as a dip** at the belly's girth; a deeper
  `LASH_H` if it wants to read as a whip.

## The deep is paced by its purse -- BUILT, TUNING OPEN (2026-09-28)

"The deep is paced by its purse" in DESIGN.md; the model is
`tools/node/deep-pace.mjs`. Heals 8 / 86 / 176 / 238, depths 32k / 73k /
191k / 350k, the shed cap gone, gatherers taking the nearest load. Open:
- **Nobody has played it.** The hour is the model's: 4 scales a second
  banked, two clicks a second, and each class's move worth a guessed
  multiple of its hit (`MOVE` in the tool). Bills in dust, ore and sparks,
  build time and the fang's carry are left out.
- **The shed is the log of the damage** (`SCALE_PER_DECADE`, 2026-09-28):
  a full party sheds 12 to 16 a second against the gatherers' 4 to 5, down
  from about 500. Nobody has watched a rung-8 party's floor with it.
- **The banked rate is the load-bearing guess.** Four gatherers bank about
  5 a second off a thick floor, falling to 3; 3 a second makes it 71
  minutes, 5 makes it 52.
- **A party halved in one stage walls there.** Sword, Assassin and Sapper
  all take half in the split; that party reaches the fourth stage at 50
  minutes and frees him at 70.

## The serpent: the second half of the game -- BUILT, TUNING OPEN (2026-09-23)

Built as `docs/wave-serpent.md`; "The serpent" at the end of DESIGN.md.
Open:
- **Only in the paid full game**: `SERPENT_ON` (src/config/deep.js) is
  `VITE_FULL=1`, which only `--mode full` and the full Steam cut set (.env.full, .env.steam), and no
  paid build has shipped (no `ITCH_FULL_TARGET`, no Steam app id). A dev
  build and the node yard play it. CHANGELOG.md's "Held back" lines move
  under Unreleased in the release that first ships a paid build.
- **Glyphs.** The fifteen deep rows and the hop's five arrows borrow
  drawings (`GLYPH_OF` in glyphs.js); they want their own in the glyph editor.

## Fighters in slots -- BUILT, TUNING OPEN (2026-09-28)

The party is on main (docs/wave-party.md), with the branch at rung 4
(DESIGN.md, "A fighter branches at rung 4"): a base unit a station forking
into its two classes, the station picked on an empty lot's board. Open:
whether rung 4's jump (a whole class at once) is too big a step in the
ladder book.

## The deep's bench -- DESIGNED, AWAITING THE VOTE (2026-09-24)

"The deep's bench" in DESIGN.md; mocks `docs/mocks/deep-bench-2026-09-24.html`
and `docs/mocks/deep-bench/`. The altar's board sells the brawlers' two
ladders and all four doors. Blocked on the owner's calls: (a) a deep bench
holding the doors (a1 beside the pods, recommended, or a2 under the portal;
standing from the snatch or raised with its first door) or (b) the altar
redrawn generic; and which drawing (A, B, C or b1, b2, b3). No game code yet.

## The deep's crew at rest -- BUILT, TUNING OPEN (2026-09-23)

"The deep's crew at rest" in DESIGN.md, option D of the mocks. Open:
- **Nobody has watched it with forty bodies down there.** The pace, float
  height, pull and rests (`DEEP_REST_*` in config/deep.js, four on the dev
  panel) are the mock's numbers; the `deep-rest` scene is six gatherers.
- **The landing silt is the builders' grit**, drawn by `difference`, so it
  shows as bright white flecks on the dark floor, brighter than the bed.

## The janitors' roomba -- BUILT, TUNING OPEN (2026-09-23)

"The janitors' roomba" at the end of DESIGN.md, option B of the mocks. Up to
three roombas on a dock by the closet take the poop and the sky's muck off
the open yard; one janitor minds them and tips their bins. Open:
- **Nobody has watched a front with them.** `ROOMBA_BIN` (24), `ROOMBA_PACE`
  (2.5x a walk) and `ROOMBA_TIP_MS` are first guesses on the dev panel; after
  a heavy rain the bins fill in a patch or two and the trips home are most of
  the work. The soot (`MACHINE_FOUL` a grain) is unmeasured against the air
  filter.
- **The suck is silent** (`roomba-suck` maps to null in `SOUNDS`).

---

## Defects

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

- The forklift (`drawLiftBox`, render/crew.js) and its `lift` shelf glyph are
  first sketches; want a pass in `glyphs.html` and a shot.
- The farm shed, the quarry shed and the bench share one silhouette at 1x. One
  feature of three cells or more apiece: a pit-prop A-frame roof on the quarry's,
  a lean-to with the trough on the farm's, an anvil or vice on the bench. Shoot
  the options before drawing one.
- The casino: nobody has listened to its audio; the spark bin's fanfare and the
  converting bins' blinking feet are not drawn.
- The queue: nobody has watched a refund's grains fly on a real window, and a
  big dust refund is one `bankDust` a grain in one frame, untimed.
