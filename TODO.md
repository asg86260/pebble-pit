# Still to do

## Feedback form -- BUILT, AWAITS THE OWNER'S WORDS AND THE DEPLOY (2026-10-13)

Built to option A (DESIGN.md, "Feedback form (built)", its As-built note):
a button under `settings` on the pause page, one under `controls` on the
landing page's settings and one under `copy save`
on the crashed sheet, the worker in `feedback/`, checks in
feedback/test/routes.test.mjs, test/feedback.test.mjs and the browser group
"the feedback form is a box, a tick and send". No build shows it yet: the
button needs `VITE_FEEDBACK_URL`. The owner dropped the line of what goes
(2026-10-13), so the public-fixture call is moot. Open, the owner's:
- **The words.** The pane's messages in en.ftl:
  `held-fbbtn`, `set-fb-word`, `title-fbbtn`, `title-fb-word`,
  `crashed-fbbtn`, `crashed-fb-ask`, `fb-box.placeholder`,
  `fb-tick`, `fb-send`, `fb-sending`, `fb-sent`, `fb-sent-nosave`,
  `fb-sent-where`, `fb-failed`.
- **The three calls** (DESIGN.md's list) were taken as recommended: no
  contact field, no kind, the tick off on the crashed sheet too.
- **The deploy.** feedback/README.md, "Deploy": create the D1 database,
  its id into feedback/wrangler.toml, migrations, the two secrets
  (`FEEDBACK_TOKEN`, `IP_PEPPER`), `wrangler deploy`, then the repository
  variable `FEEDBACK_URL`. Nothing was run against the account.

## Localization, phase two -- PLUMBING AND PICKER BUILT, LOOK AWAITS A MOCK (2026-10-13)

Built (DESIGN.md's "As built: the plumbing"): the language table
(locales/languages.json, only English `ready`), the `language` preference
and the default chain with `desk.language()`, the CJK faces cut at build
(tools/fonts.mjs), `--face`/`--track` and `FACE`, the shell's words through
the file, test/l10n-locales and l10n-default. All eight other languages are
drafted (machine, to locales/STYLE.md) and unreviewed. **The owner's call
(2026-10-13): launch English only; a language goes `ready`, and is ticked on
Steam, only after one native reader has looked at its file** -- no paid
translators. Readers are found by asking players (the feedback form,
below, and the store page). Open, in order:
- **The picker's words** (built, DESIGN.md "As built: the picker"): the
  label and heading are placeholders, `set-langbtn`, `set-lang-word`,
  `title-langbtn`, `title-lang-word`; whether the names are lowercased. It
  lists the rows with `ready: true` (every file in a dev build). A language
  goes `ready` when its file is approved and its overflow survey is clean;
  the guard then holds it complete.
- **The CJK look**: `--track` under `:lang(zh|ja|ko)` is still 1 (a TODO in
  style.css), the size step and what replaces the capitals, Korean's
  `word-break: keep-all` -- from the mock vote.
- **Check on a packaged Windows build** that `app.getPreferredSystemLanguages()`
  reports the system's list, not `en-US`.
- The rest of the section: measure (`long`/`wide`, `l10nfit`), sync, the
  sign, numbers and `list-sep`, the objective card's cap, Steam.

"Localization phase two (design, part built)" in DESIGN.md, on top of phase
one (built: every word in locales/en.ftl through `msg`). Nine languages,
Steam's common set. Eight phases, each approvable alone: measure (pseudo
locale `long`/`wide`, overflow survey, `l10nfit` browser group), choose
(picker, `language: null` follows Steam then the system, `desk.language()`),
sync (Crowdin Free, private -- neither platform's open-source plan fits a
sold game with no LICENSE), faces (subset Noto SC/JP/KR, `--track`,
`:lang` blocks), the casino sign, a German + Simplified Chinese pilot, the
other six, Steam. Blocked on the owner's calls listed at the section's
end: paid or volunteer translators, which Spanish, the picker's words, the
sign (icons recommended), the CJK look, a localized title, Steam's
achievement names.

## Endless serpent -- BUILT, WORDS AND THE WALL OPEN (2026-10-13)

"Endless serpent" in DESIGN.md (built: one bar a level on the last defense). Open:
- **Words**: the level label (`serp-level`, drawn as the bare number until
  its letters are in `NUM_FONT`), the five notices' names and notes
  (`ach-serpent-*`, `ach-allstations-*`) and the books' row
  (`books-tally-serpent`) are `[owner's words: ...]` placeholders in
  locales/en.ftl.
- **Big numbers**: the k/m shortening and its glyphs are being voted; it
  drops into `sayNum` (render/numfont.js).
- **The wall**: measured on the old loop at level 3 for seven stations at
  rung 8 (the constrict stops breaking at 4), far under the level-25
  notice; the fight is now the constrict alone, so re-measure it there
  (`tools/node/deep-pace.mjs --stood 7 --wall`) before moving the notices.

## Controller support -- BUILT, WORDS AND STEAMWORKS OPEN (2026-10-12)

"Controller support" in DESIGN.md (built). Open:
- **Words**: the controls page's pad-only rows (`ctl-pad-*`, locales/en.ftl)
  are placeholders marked `[owner's words: ...]`, shown to a player once a
  pad has been seen. The owner writes them there.
- **Steam Input**: electron/steam-input/controller_neptune.vdf is the Deck's
  default config, unproven: there is no app id to upload it under (see
  "Three builds" below). Its binding names are from the published format,
  not from a Steamworks export.
- **Nobody has held a pad**: every check drives a stand-in pad; the feel of
  the glide, the hand's speed (`PAD_HAND_SPEED`) and the repeat
  (`PAD_REPEAT_*`, config/pad.js) are first guesses.

## The index -- BUILT, WORDS AND DRAWINGS OPEN (2026-10-11)

"The index" in DESIGN.md (built). Open: every entry's text (`idx-*` in
locales/en.ftl) is Claude's draft, for the owner to edit there. Drawings to make in glyphs.html: muck, poop, pollution, rain,
clouds, birds, the hole, the sqwife, the bench, the books, and the story's
four (objective, achievements, the rescue, scenes); and whether the `i` key
gets a line on the controls page (shared with the landing page).

## Three builds: itch, Steam, and the Steam demo -- BUILT, AWAITING STEAMWORKS (2026-10-12)

"Three builds" in DESIGN.md: the demo (2026-10-11) and the Steam build,
Steam Cloud, the carry-over and the release jobs (2026-10-12) are built.
Open:
- **App ids**: none exist. `APPS` in electron/steam.cjs is null for both
  (placeholders); the release workflow needs the repository variables and
  secrets listed at the top of release.yml before its Steam jobs run, and
  `ITCH_FULL_TARGET` before the paid page gets a push. Nothing has been
  uploaded through SteamPipe yet, so the jobs are unproven.
- **Words**: the carry-over dialog (`CARRY_WORDS`, electron/steam.cjs) and
  the demo's last sheet are placeholders for the owner.
- **Mac**: the Steam build has no mac depot until the mac app is notarized.
- **Steam achievements** are wired (src/achievements.js): the owner creates the
  49 in Steamworks from `node tools/steam-achievements.mjs` (API name, in-game
  id, in-game title), writes their text and draws their icons.
- The demo's Steam Cloud is not read by the full game's carry-over: the SDK
  reaches only the running app's remote storage. The demo's disk copy, which
  the demo itself keeps in step with its cloud, is what is offered.

## The barriers are the gates; cores go -- BUILT (2026-10-09)

"The barriers are the gates; cores go" in DESIGN.md.

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
- **The badge's three hover lines** are blank, waiting on the owner's words
  (`STATUS_SAYS.orb`).
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

## The serpent eats to heal -- BUILT (2026-09-30)

"The serpent eats to heal" in DESIGN.md; mocks `docs/mocks/heal-fish-2026-09-30.html`
and `docs/mocks/heal-bestiary-2026-09-30.html`. Meals 6-12 s apart, chosen
fresh; scenes `meal-swim`, `meal-bite`, `meal-swallow`, `meal-land`. Open:
- **Nobody has watched it in play.** The jaws' gape and the swallow's swell
  are small at the game's scale; the creatures are the mock's, not retouched.
- **The break can be gambled** to land just before a meal, a lump early.

## Cloud saves -- BUILT AND ON, NOT YET RELEASED (2026-09-28)

Built as `docs/wave-cloud.md`; "Cloud saves" in DESIGN.md. The worker is
deployed at `https://pebble-saves.graham-things.com` (Workers Free, D1
`pebble-cloud`) and live-checked, the two-writer write included.
`CLOUD_ON` is true and the release reads the `CLOUD_URL` repo variable, so
the next release ships it. Every player opts in: nothing is sent until they
press *enable cloud syncing* or enter a code.
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
- **Switched off in a release** (2026-09-28): `SERPENT_ON = false` in
  src/config/deep.js; a dev build and the node yard still play it. Turning
  it on is that line plus moving CHANGELOG.md's "Held back" lines under
  Unreleased.
- **Glyphs.** The fifteen deep rows and the hop's five arrows borrow
  drawings (`GLYPH_OF` in glyphs.js); they want their own in the glyph editor.
- **The second half plays shallow** (the owner, 2026-09-26): answered by
  "Fighters in slots" (below).

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

## The air filter is the balloons' shed -- BUILT (2026-09-22)

"The air filter is the balloons' shed" in DESIGN.md. The shed filters nothing:
no body inside, no spout or heap. It keeps the gauge and the board; the
balloons do all the cleaning, and buying one sends a spare hand to ride it.

## The balloons ride the clouds -- BUILT (2026-09-22)

"The balloons ride the clouds" in DESIGN.md. A row of moorings beside the
dial, like the pots, inside a wider filter footprint; riders commute straight
to their own post. Aloft, a balloon lives in the clouds' parallax and travels
from cloud to cloud between the sheets, drawing each in. Because where it is
in the sky depends on the view, its work is a clock of its own: the pull is
the fan's as now, the catch is carried home to the post and thrown on the
filter's heap, and the trips up and down take a fixed time.

## The balloons draw the haze in -- BUILT (2026-09-22)

"The balloons draw the haze in" in DESIGN.md. The cloud threads are cut: tied
to clouds that scroll slower than the ground, they slid and switched clouds on
every scroll. A working balloon now gathers murk-colored cells into its box
from above and the sides, kept relative to the craft (`craftair.js`), thicker
the dirtier the sky. Clouds are no longer paled.

Open work only. Each item carries its diagnosis and its blocker, so none of it
has to be re-derived. What was built is in DESIGN.md (the `(built)` sections)
and CHANGELOG.md; the old entries are in git history (this file before
2026-09-22 carried every one of them).

---

## Defects

### `inWorking` reads the ground line to a pixel again (2026-09-22)

`onYard` is `!inWorking`, and since b58041ac `inWorking` answers true for any
feet more than a pixel under the ground line -- the tolerance 8e16327f took out
of the dance's duck because the idle bob crosses it (a body mid-bob sits about
1.17px low). The duck, the commute's duck, the fall rule and the quarry's and
farm's muck errands all ask it. b58041ac wanted a body under the ground with no
working under it (the cut moved on a re-walk) read as down a hole; the fix is a
depth that means that, not a pixel. Blocker: `inWorking` is asked across the
yard, so it moves bodies in checks that are not about it.

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

### Rain muck clogs the air filter

`clogged()` counts every grain of muck on the filter's strip (`outletMuck`,
smog/band.js), and the rain drops muck everywhere, so a sky bad enough to rain
stops the filter exactly when it is needed. For changing it: the clog was
written about *what the filter makes*, and weather muck is not that. Against: a
yard buried in muck stops every works, and no exception is the simpler rule. If
it changes, muck has to carry where it came from (a field on the layer, since
`MESS` does not record it). The balloon's clog below is the same question.

### The balloons: the clog, the fleet, the reading

The craft flies, crewed, and pulls from the clouds. Left:

- **The clog.** A craft drops wherever it is and nothing stops it. The design:
  it clogs on the column beneath it and clears by moving on, with the pile-full
  mark on the mast when every craft is stalled. Settle the rain-muck call first.
- **The fleet.** Lanes not looked at with two in the sky; each craft walks the
  whole sky list on its own. Fine for one, wasteful for three.
- **The reading.** Nothing on the board says whether a craft is up, crewed or
  tied to its mast.

### The builder bottleneck (2026-09-08)

"The one bench carries two ladders' worth of waiting" in DESIGN.md. A
representative backlog (2,332 worker-seconds) did not clear in 2,000 game
seconds at the top of both builder ladders; builders did useful work ~37% of the
time. Not root-caused, roughly 4x what the ladders predict, and only with
several works competing. Instrument `handsAt('yard')` against builder
positions -- walking, `slotFor` thrash, or `stepWorks`'s accounting -- before
touching `src/config/build.js`.

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
