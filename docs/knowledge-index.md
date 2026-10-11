# The index: an inventory

Every thing a player meets in a released build and could want to look up,
read off the code on 2026-10-11 (main at 06f48406). This is the raw material
for "The index" in DESIGN.md (design, not built): the owner writes every
entry's player text from these notes. **Nothing in the "facts" column is
player copy** -- they are notes on what the thing does, for the owner to
write from.

Columns:

- **key** -- a proposed index key (the yard's own key where one exists).
- **name the game shows** -- the existing string, exact, with where it is
  said. Where a thing is said several ways, each is listed; the owner picks
  the entry's title.
- **glyph** -- a drawing in `GLYPHS` (`src/glyphs.js`) the entry could wear,
  or `--` where none exists. A coin's mark (`MARK` in `src/words.js`, the
  colored square / triangle / hexagon / cross) is listed as `mark:`.
- **met** -- the gate: the first moment the player has seen it, as a fact
  the save already holds where one exists. This is what an "unlock as met"
  index would read.
- **facts** -- two to four plain mechanical notes.

The deep's half (the sqhusband, the serpent, scales, the crusher, the pods,
the party's stations, the portal) is behind `SERPENT_ON = false`
(`src/config/deep.js:13`): a released build never reaches it. It is listed
last, apart, so the index can grow into it when the switch turns.

Cores were removed 2026-10-09 and are not listed. The lab and its scholars
(`TYPE.SCHOLAR`, `src/jobs.js:15`) are vestigial and not met; not listed.

---

## 1. Materials (5)

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `dust` | "pebbles" (`src/stats.js:21`); "pebble" on hover (`src/input.js:375`); "pebbles in the pit: what everything costs" on the counter (`src/input.js:550`); objective "grab a pebble" (`src/objectives.js:25`) | `mark: dust` (black square; also `BADGES.dust`) | from the first click (the opening's quest) | Chipped off the rock by your click, the diggers and the ram; lie on the ground until carried. Banked by tossing into the pit; the count in the pit (`S.stored`) is what every bill is paid from. Every grain knocked off puts a mote into the sky. |
| `shard` | "ore" (`src/stats.js:22`, hover `src/input.js:372`) | `ore`; `mark: shard` (blue triangle) | `S.seenShard` -- the first ore banked (`src/pit.js:183`) | Dug out of the quarry by the miners and brought up to the pit. Pays the arch, the quarry's own ladders and the later bands of every ladder. Its motes in the sky are blue. |
| `spore` | "crops" (`src/stats.js:23`); "crop" on a grain and on a grown plot (`src/input.js:373`, `:473`) | `ear`; `mark: spore` (green hexagon) | `S.seenSpore` -- the first crop banked (`src/pit.js:184`) | Grown on the farm's plots, tended and harvested by farmers. Pays the net. The first crop is what lets the apothecary be offered. Its motes in the sky are green. |
| `spark` | "sparks" (`src/stats.js:24`); "spark" on a grain (`src/input.js:374`) | `spark`; `mark: spark` (red cross, the only red in the game) | `S.seenSpark` -- the first spark banked (`src/pit.js:185`) | Shed by the star when the wizards bolt its cells off (the sphere catches more). The machines' currency end to end: every machine, every rung of its ladder, and the rift. The casino can also pay in them. |
| `crit` | "crit chance", "crit damage" (`src/upgrades/rows-luck.js:16`, `:26`) | `cracked` (crit damage's), `spark` | the first crit (no flag today; the bench's crit rows are bought on it) | A hit on the rock can crit: a fountain of dust instead of a chip. Chance and size are two bench ladders. Loudest where the yard is thinnest (DESIGN.md, "Crits"). |

## 2. The yard (8)

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `rock` | "rock" on hover (`src/input.js:468`); "the boulder" in the objective "dig the boulder to save your sqwife!" (`src/objectives.js:21`); "rocks cleared" in the books (`src/stats.js:166`) | `cracked` | from the start | Falls out of the sky onto the spot, one after another; each cleared counts `S.boulderNo`. Chipped by click, by the diggers and by the ram. Each fall drives the one underneath back into the ground. The barriers are tries at holding the next one off. |
| `pit` | "the pit" (counter hover `src/input.js:550`; notice "the pit is full", `src/catalog.js:29`); "the hole" in the books ("most into the hole", `src/stats.js:141`) | `--` | from the start (objective "toss the pebble into the pit", `src/objectives.js:26`) | Every grain banked is a drawn cell in it; it has a capacity and fills. Full, it tears the rift. The four coins all land here; the counter over it reads what is in it. |
| `rift` | "the rift" (`src/input.js:389`); notice "the rift torn, storage is solved" (`src/catalog.js:30`); "through the rift" (`src/stats.js:176`) | `portal` (the whirlpool drawing, now worn by the portal row) | `S.riftOpen` -- the first grain the full pit could not take (`src/pit.js:168`) | A small hole tears over the pit's mouth and eats what comes. It grows with what it eats. Past `ABYSS_AT` it collapses into the pit and the pit drowns. Sparks widen it. |
| `abyss` | "the abyss" (`src/input.js:388`); notice "the rift has gotten bigger" (`src/catalog.js:31`) | `portal` | `S.drowned` (`src/rift.js:91`) | The drowned pit: liquid, bottomless storage, the end state of the pit's arc. Nothing banked into it is ever drawn again. |
| `muck` | "muck" (hover `src/input.js:415`; mess tag `play.html:137`); "muck lying about" (`src/stats.js:115`); "most muck cleared" (`src/stats.js:142`); notice "it never rains but it pours" (`src/catalog.js:74`) | `--` (the mess tag wears a warning triangle) | the first storm that ends with muck down (`S.tally.muckRains >= 1`); the first muck's scene plays then (`src/firstmuck.js`) | Dirty rain lands as muck; stacks to `MUCK_MAX` a column. Nobody goes for it while a storm is still dropping it (`muckOpen`); after, haulers, janitors and roombas shovel it. Muck on the rock, the cut or a plot eats work there. Muck near the air filter clogs it. |
| `poop` | "poop" (hover `src/input.js:415`; mess tag `play.html:138`) | `--` | the first body to relieve itself, soon after the first hire (`src/crew/nature.js`) | Every body now and then stops, says so, and leaves `LOO_MUCK` cells. Never on the rock, the cut or the plots. The janitors' job; never waits for the weather. Five patches unattended (`S.seenMess`) is what offers the janitor's closet. |
| `bird` | "bird" (`src/input.js:471`); notices "get off my land", "not one of you" (`src/catalog.js:67-68`) | `--` | any time; they cross the sky now and then | Cross behind the yard. A click startles one. Cosmetic, plus two notices. |
| `house` | "the house" (`src/stations.js:201`); "house" on hover (`src/input.js:461`) | `house` | the first hire (`S.crew > 0`) | A block that grows a room per body; buying another house is how you hire (`HOUSE_ROW`). Its board is the crew list. Haulers start from it. Spell "cheapen the houses". |

## 3. The sky (7)

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `pollution` | "pollution" (`src/stats.js:107`); "the sky is ... full" (`:110`); the dial's bands "clean", "dirty", "filthy" (`src/config/filter.js:47`); sources "from the machines", "from the rock", "from the quarry", "from the farm" (`src/stats.js:84-87`) | `--` | `S.seenAir` -- the first rain front (`src/smog.js:182`) | Every grain taken out of the ground puts a mote in the sky, colored by what kicked it up; machines put up soot. Capped at `SMOG_CAP`. Only the air filter takes it down; rain only taxes it. How full it is decides how dirty the rain is. |
| `cloud` | -- (no string) | `--` | from the start (`CLOUDS_ON`) | Slide past at the back. Swell and darken before a front: the clouds are the forecast. |
| `rain` | "showers weathered" (`src/stats.js:114`) | `--` | `S.rains > 0` -- the first front | Comes on its own clock (`RAIN_EVERY_S`), whatever is overhead. Washes a share of the sky down: clean drops vanish, dirty ones land as muck. A scrubbed yard just gets wet. Heft rolled per storm. |
| `lightning` | -- (no string) | `bolt` (the wizards' "heavier bolts" glyph) | the first heavy pour | Comes with the pour, one at a time, about every nine seconds at full storm. Costs nothing and touches nothing: the storm being seen. Throws embers. |
| `star` | "the star" in the wizard's note (`src/tower.js:147`); notice "conjure a star" (`src/catalog.js:32`) | `star` | `S.meteorOpen` -- the first wizard hat finished (`src/tower.js:51`) | A rock in the sky: a rind round a core. Only wizards reach it; each cell they bolt off sheds sparks. When it is gone the wizards summon the next. |
| `balloon` | "balloon" on hover (`src/input.js:472`); "the balloon" row (`src/filter.js:89`); "balloon power", "balloon speed" (`src/filter.js:77`, `:68`) | `balloon` | the air filter built | The air filter's craft: ride up among the clouds and draw the haze in. Power and speed are its ladders. |
| `recycler` | "the recycler" (`src/filter.js:114`) | `lever` | on the air filter's board | Hands back part of what the filter takes out of the sky. |

## 4. Places (21)

### Stations (`STATIONS`, `src/stations.js`)

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `bench` | "the bench" (`src/stations.js:183`) | `crate` (none of its own) | `S.seenBench` -- the call to build it (`src/raise.js:31`), up once a row is affordable | The catch-all board: your own click, carry and toss ladders, the haulers' gear, crits, the doors to every new place, the barriers. |
| `shack` | "the shack" (`src/stations.js:173`); door "build the shack" (`src/upgrades/rows-shack.js:17`) | `hut` | offered once `S.crew > 0` and dust is near `SHACK_DUST`; sticky | The diggers' station at the rock: their swing and pick ladders, the breaker hat, the ram. |
| `stats` | "the books" (`src/stations.js:209`) | `sack` (borrowed) | `S.banked > 0` | The noticeboard: playtime and income a second. The full books window (sky, crew, tally) is dev-panel only today (`src/stats.js:218`). |
| `farm` | "the farm" (`src/stations.js:151`); door "build the farm" (`src/upgrades/rows-farm.js:7`) | `furrow` | offered when the wooden barrier has failed and dust is near `FARM_DUST`; sticky | Plots grow crops; farmers tend and harvest. Ladders: plots, tending, yield; the grower hat; the tiller. |
| `quarry` | "the quarry" (`src/stations.js:144`); door "build the quarry" (`src/upgrades/rows-quarry.js:9`) | `hoist` | offered when the farm stands and the net has failed | An open cut; miners work its floor and carry ore up. Ladders: depth, pace, seam; the blaster hat; the drill. |
| `apothecary` | "the apothecary" (`src/stations.js:160`); door "build the apothecary" (`src/upgrades/rows-apothecary.js:13`) | `pot` | offered when the farm stands and the first crop is seen | A keeper lights it, the pot brews itself, one batch every `BREW_MS`. Three brews, one a coin (below); doses walk out to the crew as buffs. |
| `tower` | "the tower" (`src/stations.js:165`); door "discover the tower" (`src/upgrades/rows-tower.js:12`) | `tower` | offered when the quarry stands and the arch has failed | Trains wizards (a hat each), who fly up to the star. Sells the spells, the sphere and the dome. |
| `casino` | "the casino" (`src/stations.js:127`); door "build the casino" (`src/upgrades/rows-casino.js:12`); its lever "the arm" (`src/levers.js:21`) | `die` | offered when the quarry stands and the second rock has fallen | No board: levers on the building. The handful -- a pour of 32 grains down a peg board -- pays by the bins; stakes in pebbles, ore, crops. Notices "we're so back", "time to get a loan". |
| `outhouse` | "the janitor's closet" (`src/stations.js:188`); door "build the janitor's closet" (`src/upgrades/rows-outhouse.js:16`) | `bucket` | offered at `S.seenMess` or five patches of poop lying | Janitors clear poop and muck. Sells "another cap" (`src/outhouse.js:23`) and the roombas. |
| `filter` | "the air filter" (`src/stations.js:131`); door "build the air filter" (`src/upgrades/rows-filter.js:13`) | `balloon` | offered after the first rain, the sky seen, and a machine running | The only thing that empties the sky. Air purifiers work it; balloons and the recycler are its ladders. Its dial reads clean / dirty / filthy. |

### Machines (`MACHINES`, `src/machines.js`), and the forklift

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `ram` | "the ram" (`src/machines.js:25`) | `ram` | the shack's ladders and its hats bought out | The rock's machine. Bought and tuned in sparks; puts up soot. |
| `jaw` | "the drill" (`src/machines.js:24`) | `jaw` | the quarry's ladders and hats bought out | The quarry's machine. Sparks; soot. |
| `tiller` | "the tiller" (`src/machines.js:26`) | `tiller` | the farm's ladders and hats bought out | The farm's machine. Sparks; soot. |
| `belt` | "the belt" (`src/machines.js:36`) | `belt` | the haulers' carry and pace ladders bought out and a cart for every pair of hands | From the rock to the pit; unmanned; haulers tip onto it. Changes the yard's traffic. |
| `sphere` | "the sphere" (`src/machines.js:39`); its note "capture the power of a star" (`src/tower.js:171`) | `sphere` | the star is up and the tower's gate met | The tower's machine: a shell round the star that catches its light and lets it fall as sparks. |
| `roomba` | "the roombas" (`src/machines.js:46`); "a roomba" (`src/outhouse.js:40`) | `roomba` | on the janitor's closet board | Up to `ROOMBA_MAX` machines that clear mess from a dock; bins of muck and poop. |
| `driver` | "forklift" (`src/upgrades/rows-kit.js:123`); "forklift load", "forklift speed" | `lift` | on the bench, with the haulers' gear | Drives itself to the pit with nobody aboard, and smokes. A count, one more a press. |

### The barriers (`SHIELD_ROWS`, `src/upgrades/rows-shields.js`; the dome in `src/tower.js`)

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `props` | "wooden barrier" (`src/upgrades/rows-shields.js:23`); objective "maybe building a wooden roof will stop the next boulder?" (`src/objectives.js:29`) | `planks` | offered from the second rock (`PROP_FROM`) once the opening has played | The first try against the sky. Fails under a rock; its failing opens the farm. Pebbles. |
| `net` | "the net" (`:33`) | `net` | the props have failed and the farm stands | Catches and slows the rock; fails. Opens the quarry. Crops. |
| `arch` | "cut the arch" (`:44`) | `arch` | the net has failed and the quarry stands | Stone; fails. Opens the tower. Ore. |
| `dome` | "conjure the barrier" (`src/tower.js:194`) | `dome` | the arch has failed, the tower stands, a wizard exists | Poured by the wizards, not carried. Holds: the rescue follows. All four coins. |

## 5. Crew (14)

A body's hover is its own name card (`card`, `src/crewboard.js:89`); the
bare label fallback is the raw type (`src/input.js:449`). The roster words
are `jobSaid` (`src/jobs.js:77-79`).

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `rockhand` | "diggers" (`src/jobs.js:77`); type "rockhand" | `pickhead` | the first hire put on the rock | Swing at the rock from its row. Swing-speed and pick ladders at the shack. |
| `hauler` | "haulers" (raw job, `src/jobs.js:34`) | `sack` | from the start (the opening hands you a body on carrying) | Carry pebbles from the ground to the pit; whoever is left over after every job takes its share. Shovel muck. Lent to builds. |
| `quarrier` | "miners" (`src/jobs.js:77`) | `swing` | the quarry built | Work the cut's floor and bring ore up. |
| `farmhand` | "farmers" (`src/jobs.js:77`) | `hoe` | the farm built | Tend plots and harvest crops. |
| `purifier` | "air purifiers" (`src/jobs.js:78`) | `balloon` | the air filter built | Work the filter; through its door is what counts. |
| `stirrer` | "apothecary" (`src/jobs.js:78`) | `pot` | the apothecary built | The keeper who lights the pot. |
| `janitor` | "janitors" (`src/jobs.js:41`) | `cap` | the janitor's closet built | Go after poop first, then muck. Spell "quicken the janitors". |
| `wizard` | "wizards" (`src/jobs.js:42`); row "train a wizard" (`src/tower.js:146`) | `point` | the tower built, the first hat | Fly up and bolt the star apart for sparks; summon a new one. Pour the dome. Notice "you're a wizard squarey". |
| `builder` | "builders" (`src/jobs.js:43`) | `shovel` | the first thing bought that has to be built | Spare hands lent to put up a building or a machine; nobody's station. |
| `breaker` | "breaker" (`src/upgrades/rows-kit.js:28`) | `helmet` | the props tried | The diggers' hat: "twice the bite". |
| `carter` | "carter" (`:31`) | `cart` | the props tried | The haulers' cart: "twice the load". |
| `blaster` | "blaster" (`:34`) | `lamp` | the arch tried | The miners' hat: "twice the trips". |
| `grower` | "grower" (`:37`) | `brim` | the net tried | The farmers' hat: "twice the tending". |
| `brews` | "hearty stew", "strong brew", "bracing tonic" (`src/apothecary.js:71`, `:74`, `:77`) | `bowl`, `sack`, `spark` (their potency rows') | the first batch brewed (notice "hello, potion seller", `src/catalog.js:34`) | One a coin: stew (crops) speeds, strong brew (ore) strengthens, tonic (sparks) crits. A buff on the body, and it says so. |

(The tower's five spells -- "speed the machines", "enrich the quarry",
"genetically modify crops", "cheapen the houses", "quicken the janitors",
`src/config/tower.js:32-40` -- are rows, not things; listed here for the
owner's call on whether rows get entries at all.)

## 6. The story (5)

| key | name the game shows | glyph | met | facts |
|---|---|---|---|---|
| `sqwife` | "sqwife" (objective `src/objectives.js:21`; notice "you saved your sqwife", `src/catalog.js:24`) | `--` | the opening | Buried by the first rock, lodged to the middle; every rock cleared, the nearest body runs to dig; every next rock drives them back in. Yells for help through the first rock. |
| `objective` | the line, e.g. "dig the boulder to save your sqwife!" (`src/objectives.js`) | `--` | the opening | One line, the story's next step; the card under it sells the row. |
| `notices` | "achievements" (held sheet, `play.html:197`); `CATALOG` (`src/catalog.js`) | `--` | the first notice ("makin' money") | Forty-odd notices; the record lists the earned ones newest first. |
| `rescue` | "you saved your sqwife" (`src/catalog.js:24`) | `--` | `S.rescued` | The dome holds, the sqwife comes out, the saved sheet, the crew dance. |
| `cutscene` | -- | `--` | the opening | Scenes take the camera; holding space skips one. |

## Not in a released build (behind `SERPENT_ON`)

| key | name the game shows | notes |
|---|---|---|
| `sqhusband` | "free your sqhusband from the serpent's belly" (`src/objectives.js:49`) | snatched after the rescue |
| `serpent` | "the serpent" (`src/input.js:456`) | the deep's fight |
| `deep` | "down to the deep" (`src/input.js:453`) | the place under the drowned pit |
| `portal` | "conjure the portal" (`src/tower.js:208`) | glyph `portal` |
| `scale` | `MARK.scale` (`src/words.js:48`) | the deep's coin |
| `crusher`, `pods` | "the crusher", "the pods" (`src/stations.js:216`, `:222`) | the deep's purse and houses |
| fighters, gatherers, delvers | `src/jobs.js:23-27` | the party |

---

## Counts

| group | entries |
|---|---|
| materials | 5 |
| the yard | 8 |
| the sky | 7 |
| places | 21 (10 stations, 7 machines, 4 barriers) |
| crew | 14 (9 jobs, 4 hats, the brews) |
| the story | 5 |
| **released total** | **60** |
| behind `SERPENT_ON` | 7 more |

## What already exists to build on

- **A "met" list has precedent:** `S.seenRows` / `S.seenSects`
  (`src/state.js:419-420`, saved) remember which rows a board has shown.
- **Most "met" facts are already saved flags**: `seenShard`, `seenSpore`,
  `seenSpark`, `seenAir`, `seenMess`, `seenBench`, `riftOpen`, `drowned`,
  `meteorOpen`, `rains`, `tally.muckRains`, `shieldsDone`, every
  `<place>Open`. About ten entries (crit, lightning, bird, cloud, poop,
  balloon, the brews) have no flag and would need the index's own list.
- **Live numbers that already exist** (`src/stats.js`): income a second per
  coin (`bookRate`), the sky's readouts (trend, put up / taken out a minute,
  % full, full in, share by source, showers weathered, muck lying about),
  crew counts per job, and the tally (rocks cleared, pebbles banked, ore
  dug, through the rift, batches brewed, hats finished). The mess counts
  are `messCounts()` (`src/smog/layer.js`), the purses `purse()`
  (`src/words.js`).
- **The hover registry** `whatIsAt(x, y)` (`src/input.js:447`) already
  answers "what is under the pointer" in a word for grains, buildings, mess,
  the rock, machines, birds, balloons, crops and bodies -- the whole of
  option C's lookup.
