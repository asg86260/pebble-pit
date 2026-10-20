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
| `world.js` | where the sites stand; which ground is spoken for; the camera's clamp, the two zooms (`setZoom` glides the zoom on the glass, `setZoomNow` cuts) and the one screen/world conversion (`toWorld`, `toScreen`) | changes coordinates for everyone |
| `shot.js` | the one camera while a cutscene holds (DESIGN.md, "One camera for every cutscene"): a scene names a box and the shot fits it between the bands, glides to it on the one ease (`easeInOut`) or follows it on a spring, inside each place's limits (`PLACE_LIMITS`, which `clampCam` reads too); `__shot()` reads it out | yes |
| `rock.js` | making a rock, standing it, hitting it, what comes off | yes |
| `quarry.js` | the open cut, and the crew working its floor | yes |
| `farm.js` | the plots, and farmhands tending them | yes |
| `lab.js` | the research, who works it, and the multipliers it pays out | yes |
| `dust.js` | a chip in the air: where it is aimed and how it flies | yes |
| `pit.js` | the hole: banking, capacity, spending, its paint buffer | yes |
| `core.js` | between rocks: one finished, the next brought down | yes |
| `crew.js` | the crew — a barrel over `src/crew/`; a worker type is one file there plus a row in the `JOBS` registry (`src/crew/jobs.js`) | yes |
| `air.js` | the dust hanging in the yard: three bands of it, at three distances, and its colour over each site | yes |
| `roster.js` | the crew count and its two buttons under each station | yes |
| `weather.js` | the clouds and the birds, far behind everything; the clouds swell with the storm's clock and the rain is born under them | yes |
| `render/clouds.js` | the one way a cloud is drawn, for any place with sky (act 3's sky and ground so far; the yard's sky is designed onto it, not built). The liquid sky: layers of cloud fields (`skyLayer`, `groundLayer`, `cloudLayer` for a clickable one) of many shapes and a long tail of sizes, placed by distance and by height (`CLOUDS_ALTITUDE`: low heaps and stratus, mid cumulus, high cirrus, towers rooted low), each cumulus built as turrets rising off a flat shelf, smaller turrets clustered on them a tier in front or behind, its bottom cut flat at its base line (`volume`, `CLOUDS_VOLUME`, `CLOUDS_TIERS`), the ground a cloud sea of billows of every size (`groundLayer`, `CLOUDS_SEA`), each puff on its own slow current (`puffAt`), tones by depth and role (`layerLook`, `CLOUDS_PALETTE`); and the older baked sheets (`cloudSheet`, `tickClouds`), which the node checks and a page without WebGL2 use (`stillSheet`, one baked step held still). Numbers in `config/clouds.js`; the bench is `clouds.html`; `test/clouds.test.mjs` and `tools/clouds-check.mjs` hold it | yes |
| `render/cloudgl.js` | the liquid sky's field on the graphics card (WebGL2, no dependency): every cell of every layer in view worked out afresh each frame from the puffs near it, kept steady by hysteresis and a settle pass, banded into roles (each lobe's lit cap and shadow off the lobe it belongs to, the outer lit face and shaded side, the shadow where lobes meet, the flat base), eased between tones, and copied into one canvas for the 2D page to place at each layer's true position | yes |
| `render/cloudpage.js` | clouds set down on the game's page: the card asked for once (null with no WebGL2), a place's windows worked in one pass a frame (`workClouds`), and each layer placed at its true position with every cell a whole number of device pixels (`cellOnPage`, `layerSpan`, `putCells`) | yes |
| `audio.js` | the sound: the only file that names an `AudioContext`. Modules name the event (`sfx('rock-hit', { x, hard, big })`) and it decides what survives the fold window, the ceiling and the voice cap; `SOUNDS` in `config/sound.js` maps each event to its class and a recipe in `RECIPES` (or null: counted, silent), a strike is that recipe rendered sample by sample into a buffer, the same arithmetic as the hit bench, and there is no bed of any kind. The dev panel's `sounds` tab lays the bench's mapping JSON over the table live (`applySounds`). A row's recipe may instead be recorded takes (`{ sample: [...] }`, files in `public/sfx/`, played at the scattered rate through the same fold, ceilings and cap), and a row may be `onScreen` (judged where it happened, silent out of view) or carry its own `perS` ceiling; `onStrike` hands every decided strike to `tools/node/sound-audition.mjs`, which mixes a save's yard offline as the check for the set (`test/sound-lanes.test.mjs` holds the table's files and rows). The decision half runs with no context, which is what `test/sound.test.mjs` holds; every number is `SND_*` in `config/sound.js` | yes |
| `music/` | the music bench (`music.html`, dev only, never in the build): `song.js` the song as plain data and its arithmetic (a scene's length, its notes, the bar-line launch), shared with the render and checked by `test/music.test.mjs`; `bench.js` the lanes, piano roll and step grid; `transport.js` the clock and the look-ahead scheduler; `preview.js` the quick Web Audio stand-in for every track; `live.js` the selected track out over Web MIDI to Surge XT. The only AudioContext outside `audio.js`, and it never ships. Songs live in `music/songs/*.json`; `tools/music-server.mjs` saves them and runs `tools/music/render.mjs`, which plays them through Surge XT into `public/music/<song>-<scene>.ogg`. Numbers are `MUSIC_*` in `config/music.js`; open it as `music.html?muted` from an agent | yes |
| `upgrades.js` | the economy (`buy`, `rebalance`, lending); the rows themselves are data files in `src/upgrades/` | yes |
| `shop.js` | turning those rows into a board. The boards rebuild themselves on the frame: the sim raises `S.shopStale` and never calls the shop; `main.js` drains the flag once after `step`, a press drains it on its own frame, and the hooks drain it before a check reads a board | yes |
| `stations.js` | the station table: a row a place -- whether it stands (`open`), where you stand to open its board (`stand`), and its gate (`after`, `needs`, `sticky`, read through `offered`); the shields are rows with no ground. `stationAt(x, y)` is the pointer's one question | a row a station |
| `board.js` | the one menu: where it stands, and the counter above the pit; whose it is comes off `stations.js` | yes |
| `modal.js` | the window: larger reading opened off a board, centered over a wash of its own, the yard running under it; a kind is registered by its owner (`windowFor`, the books and the crew in `shop.js`) and knows nothing of what is in it | rarely |
| `income.js` | the running record of income, written where each coin lands (`earned`, called by the pit); a rate over any window is a sum and a division | rarely |
| `tween.js` | a count on its way: every number drawn -- the card, a purse, a roster, a price -- is read through `shown(name, value)` and runs to its value instead of jumping | rarely |
| `raise.js` | the call to build the bench: the row it is finished under, and what pressing it does (the button itself is seated by `board.js`) | rarely |
| `hands.js` | what a click, a drag and a flick do | yes |
| `input.js` | events to calls, and nothing else | yes |
| `stops.js` | the one list of stops -- the rock, every standing station, the way through the portal, the orb -- each with its box; the hop arrows, the digit keys and the pad each take their part of it | a row in `STATIONS` is a stop by existing |
| `pad.js` | a pad: read once a frame and turned into the calls input.js makes, the focus over the stops and their controls, the hand on RT, the carry on LT + A; `padpage.js` is the same on the page's rows, `padread.js` the Gamepad API, `padglide.js` where the marker is drawn | yes |
| `abyssintro.js` | the first trip down: the scene's clock, her body staged between the arrival and her own swing, and what the drawing reads (his hop and call, the bar's fade, her speed lines); the framing is cutscene.js's deep path | yes |
| `finale.js` | the serpent's death and after: her gear hung back on her station and taken up by one of the deep's crew, the pair through the portal and down the yard with every body getting free of its work and falling in behind (`stepParade`, `finalePose`), the forklifts at the tail (`finaleLift`), the fireworks, the door beats, the yard held through it all and its sheet (`workPaused`). Drawn by `render/finale.js` | yes |
| `home.js` | the house at the yard's left end: its pieces in build order, the builders' haul and trips (`stepBuilder`), what is standing (`pieceUp`), and the two of them living there after the finale (`stepRetired`, `S.retired`). Drawn by `render/home.js` | yes |
| `acts.js` | acts 3 and 4's switches (`afterlifeOn`, `hellOn`; `AFTERLIFE_ON`/`HELL_ON` in `config/after.js`/`config/hell.js`, set by `VITE_AFTERLIFE`/`VITE_HELL`, which no build sets; a dev build and the node yard stand both; `__actsOn`), the two places as the camera reads them (`PLACES`, keyed by `S.view` 'after' and 'hell'; `world.js`'s `clampCam` and `view.js`'s `goPlace`/`placeCamera` read it), and the act beats' owed triggers (`owe`, `__actOwe`) until each trigger is built. Scaffold only (DESIGN.md, "Acts 3 and 4") | yes |
| `placebodies.js` | the one body engine for the acts' places (DESIGN.md, "One place engine", step 5): `stepCrew` steps any place's crew (`PLACES[v].crew` in acts.js: its own body list, a JOBS registry shaped like crew/jobs.js's, its walk, its landing) through the yard's order -- in the hand, falling, the place's stage, the job -- and fills its jobs by count; `walkLine` and `walkWay` are the two walks; `bodyAt`/`liftBody`/`dropBody` are what crew/pointer.js's hand does to an act body; `settleHeld` lets go of a body a save caught in the hand. Act bodies stay in `S.after.bodies` and `S.hell.bodies`, never `S.workers` | no -- act 3 and hell both step through it, and the hand reads it |
| `placesave.js` | `readOver(blank, saved)`: the one reader for a place's saved blob (act 3, hell) -- the saved record over the place's blank, deep one level, keys the blank lacks dropped. Each place keeps its own saver in `SAVERS` | no |
| `actbeats.js` | the acts' connective tissue (DESIGN.md, "The portals and the mansion"): `S.acts` and its save (the go-on, the house, the portals, the pair, the mansion, the end), the go-on card (`sayGoOn`), every act beat's body as placeholder phases on the cutscene system (`actBody`) and its trigger (`actDue`: A's and B's seams, guarded), the camera following the pair place to place by the ripple, and `stepActs` in `STEPS` | yes |
| `portals.js` | the acts' two portals, heaven's tear and hell's slit (`PORTALS`, `portalEnd`): how open each stands, whether the player may take it, the press (`portalAt`, `throughPortal`, which calls view.js `travel`) and the hand's fade after the round trip. Drawn by `render/portals.js` | yes |
| `ghosts.js` | the pair as souls and ghosts on the road (`S.acts.pair`): the routes up through the tear, down the cloud stair, and act 4's carry loop through the pit, the deep and the slit to hell's store; `placeAt`/`placeFor`, the place a body is seen in | yes |
| `mansion.js` | the ending's mansion: its pieces in build order, the yard's builders borrowed a piece a trip (`mansionBody`, from crew/step.js), the rock broken onto the blocks pile, the gathering of freed souls (`soulAt`). Drawn by `render/mansion.js` off a cached sheet; its sheet is `mansionsheet.js` | yes |
| `after/` | act 3, the afterlife, its loop on placeholder drawings, reworked to the owner's settled calls (DESIGN.md, "The loop: the grove and the press", "Reworked to the settled calls (2026-10-18)"): `art.js` (each station's drawing as ground and the camp laid out wide off it, read by the config and place.js), `place.js` (where everything stands, and each station's moving parts: plots, the camp's spots, stations, the pedestal, the heap and its notch, the crowd's files and ranks, the fence's slots, the stair), `index.js` (`S.after`, null until the act begins; `blankAfter`, `beginAfter`, `stepAfter` -- every frame from `STEPS`, on screen or not -- `clickAfter(wx, wy)` for input.js, and its `SAVE`), `rebel.js` (the click: the pair's speech, rebel motes counted on the pile, agitators' lines; scenery clouds; the axe owed: `axeDue`), `gestures.js` (the hand work in the world: every station's moving part dragged where it stands, the saw put on a tree by its icon, a stump lifted, the heap tipped, the bubbles popped; a plain click on a station opens track C's board, `openAfterBoard`), `work.js` (`workAfter(station, amount)`, the one door to a station's output, for the hand and the post alike), `build.js` (a station ordered on the shack: its loads carried onto its spot as a pile and raised off it a band at a time, by members from the camp or the pair), `grove.js` (plots, growth, chops, the fall, logs, stumps dug and replanted), `mill.js` (the saw, the chipper, the paper mill, the sawdust heap and its tip), `press.js` (signs and posters made, planted and pasted), `union.js` (the crowd field as bytes off `S.after.rims`, signs and posters inking it, members walking out, the throne's speech, the wardens, `support` -- the share walked out), `bodies.js` (`S.after.bodies`: members walking out, the camp count, posts filled from it, each job's frame, builders), `strike.js` (the gates: `afterGate`, `strikeDue`), `levels.js` (what each named upgrade makes of the place), `rows.js` (each card's posts and named upgrades, the shack's stations, `afterBoard`, `cardAt`; the act's coins are not the yard's purse, and no row is a ladder), `util.js` (the act's own chance off `S.after.seed`, a body's walk), `story.js` (the beat bodies; the axe hands the axe over, the rest no-ops; the rows are in `BEATS`), `sky.js` (the depth camera every far thing is drawn through -- the horizon, a floor point's world x and foot at its depth, God's camp sliding as one at his depth on his stage in the clouds (`stage`, `stageSpot`), the walk out to it across the cloud and up the stage's plinth (`walkSeen`) -- and the sky's frame; the camera only slides). Drawn by `render/after.js` (every drawing a placeholder, the `after …` entries of `LAYERS`), its clouds on the one cloud renderer (`render/after/cloudsky.js`: the sky's layers, the far bank, the path's lapped edge and the foreground, put by `ground.js` and `floor.js`; `CLOUDS_ACT3`), the path the sim walks in `render/after/floor.js`, God's camp by `render/aftercrowd.js` | yes |
| `hell/` | act 4, hell, the loop on placeholder art: `place.js` (under the deep's floor; the run of chambers and every station's spot), `stations.js` (the five stations as `STATIONS` rows, `place: 'hell'`), `index.js` (`S.hell`, `blankHell`, `beginHell`, `stepHell`, `SAVE`, `clickHell` (the pick's blow; the boards are `stations.js`' rows), `hellCamTarget`, the story's seams), `chambers.js` (hell's clock, the flares), `ore.js` (faces, vents, the click on a face), `forge.js` (furnaces, the anvil), `barriers.js` (barriers, pieces, `hellWallDue`), `bodies.js` (the muster's ghosts and every carry), `cage.js` (`cageBroken`), `coins.js` (brimstone and bars for `purse`/`take`), `levels.js`, `story.js` (beat bodies, stubs; `WALL_BEATS` off `HELL_TIERS`' length). Rows in `upgrades/rows-hell.js`; drawn by `render/hell.js` | yes |
| `deep/depth.js` | how deep a defense is at a level (`depthAt(stage, level)`, DESIGN.md "Endless serpent"): the one reader of `SERPENT_WOUND`, imports only the state and the config so the fight, the phases, the bar and verify.js all read it; the return after the story's kill is `rise` and the recoil that raises the level each emptied bar `recoil`, both in `deep/serpent.js` (its near-death and power-up read as one pose, `recoilPose`, in `deep/phases.js`), the kill's fang `dropKillFang` in `deep/party.js` | yes |
| `skip.js` | the space bar, held, ending whichever scene has the yard; `skiphint.js` is the hint under it, in the shell | yes |
| `render.js` | the `LAYERS` list — painting order as data, one entry a line, every draw body in `src/render/`; each entry's `in` names the places it draws in (yard when it says nothing) | the **order** of the list is the picture |
| `persist.js` | reading and writing the game: the loop over `SAVERS` and the codec for the three plots; plain fields come off `SAVED` in state.js in one loop, every by-hand field is written and read by its owner's `SAVE`; `restore()` reads today's shape only, after `migrate` | a field in no list is a red test; the **order** of `SAVERS` is the load |
| `migrations/` | every change to the save's shape since the save floor, one dated file a migration, run in order over the raw blob by `migrate` (`index.js`) before `restore()` reads it; keyed on `saveV` (`config/saves.js`); archiving one is deleting the file (docs/saves.md) | with a shape change; never edited after |
| `main.js` | the frame order and the browser's hooks | small; touched by most features |
| `title.js` | the landing page (`index.html`): the menu column over `play.html?demo` in a frame; reads the store, never boots a yard | rarely |
| `catalog.js` | the notices' names and notes, data with no reach into the yard; `notices.js` joins the predicates by key | with a notice |
| `fade.js` | a sheet up and down as a fade with `hidden` still the truth; the frame and `hold` call it every frame | never |
| `copyout.js` | the save onto the clipboard, shared by three sheets | never |
| `lang.js` | every word a player reads, looked up: `msg(id, args)` from the active language's bundle, English the fallback; the language settled once at boot (the `language` preference, else `desk.language()` or `navigator.languages` through languages.js); `FACE`, the canvas's font stack, and the CJK face loaded before any module measures; the pages' `data-l10n-id` written over as it loads (`localize`, `writeInto`). Imports only prefs.js, languages.js and @fluent/bundle, so anything may import it (DESIGN.md, "Localization") | rarely |
| `languages.js` | which language a player who has not chosen reads: `pickLanguage` (choice, Steam, system, browser, English; ready languages only) and the tag and Steam-name maps, pure over `locales/languages.json` -- the one table of the nine (code, own name, Steam names, tags, `ready`, CJK face). `electron/lang.cjs` writes the same rules again for the shell; test/l10n-default.test.mjs holds them equal | with a language |
| `langpage.js` | the language tab on both settings pages (the held sheet's, the landing page's): the languages offered (ready ones with a file; every file in a dev build), each a button in its own name tagged with its `lang`, the one in force inverted; a pick calls `chooseLang` and hands the reload to the page | rarely |
| `settingstabs.js` | the settings page's four tabs on both settings pages (graphics, audio, controls, language): the strip, the one in force inverted, every tab's rows in one grid cell so the sheet is the tallest tab's height, the tab remembered for the session; the keys' arrows on the strip, and `padTabs`, the pad's LB, RB and strip on the held sheet | rarely |
| `feedback.js` | the feedback form with no page: the facts that go along (`factsOf`: version, target, shell, os, lang, page, and `fatal` on the crashed sheet), the save offered (`offerOf`, gzipped and base64), the request (`reportOf`), the send (one POST, nothing queued) and the draft (prefs, `feedbackDraft`). No reach into the yard: the page hands it the open slot's blob. `setFeedbackUrl`/`setFeedbackFetch` for the checks; an empty `VITE_FEEDBACK_URL` is no form (DESIGN.md, "Feedback form") | rarely |
| `feedbackform.js` | the form drawn into an element: box, tick (a button, for the pad), send; the held sheet's settings, the landing page's and the crashed sheet each mount one, a new one every time the page is turned to | rarely |
| `gzip.js` | a save gzipped and back over CompressionStream; the cloud's sync, the feedback form and the feedback worker share it | never |
| `feedback/` | `pebble-feedback`, the feedback form's Cloudflare Worker, in `cloud/`'s shape: `handle(request, env, now)` over D1, the daily sweep, the migrations, the checks over node:sqlite (feedback/README.md for the deploy and for reading reports) | rarely |
| `tools/fonts.mjs` | the CJK faces: Noto Sans SC/JP/KR, fetched once a machine (pinned, hashed, cached outside the checkout) and cut by `subset-font` to each language file's characters into `src/fonts/<code>.woff2` (ignored); vite.config.js runs it at every build and dev start, and a missing file, network or hash is a warning, never a failed build | rarely |
| `locales/en.ftl` | the words themselves, Mozilla Fluent, grouped by where they show, a comment over each; the source every other `locales/xx.ftl` is translated from. No module writes a sentence: a new line is a message here and a `msg` call. `test/l10n.test.mjs` is red for a sentence left in src/ or a page, an id with no message, a message nothing asks for, or a word that changed | a message a line |
| `tools/wording/` | the words' tools: `inventory.mjs` writes docs/wording-inventory.json off en.ftl; `strings.mjs` is the scanner the guard uses; `pseudo.mjs` runs the yard with every message marked (test/l10n-pseudo.test.mjs); `extract.mjs` and `recast.mjs` moved the literals out; `surfaces.mjs` and `page.js` serve tools/wording-shots.mjs | yes |
| `save.js` | the store seam: IndexedDB on a page (read once before the boot, `primeStore`), `window.desk` in the shell, localStorage as the way in and the fallback; the guard, the fallback and the save floor (`isSave`) over all of it; every key follows the open slot | rarely |
| `idb.js` | IndexedDB as four promises over one key-value store; null wherever it is not to be had | rarely |
| `slots.js` | the saves page: three yards, one open at a time, labelled off their own blobs | rarely |
| `config/times.js` | the board of times' numbers, read only by `server/`: the game has had no board since 2026-10-12, and `config.js` does not re-export it | never |
| `crash.js` | a throw: the stopped sheet, the save offered out of it, the feedback form under it (fetched at the click, so the file stays light), and the `S.fatal` flag that stops `persist` writing after one | rarely; imported first by `main.js` on purpose |
| `met.js` | what the player has met, for the index: each entry's `met` fact read, `S.seen` kept, `meet(key)` for the things with no fact; no DOM | yes |
| `indexpage.js` | the index's page on the held sheet: the list by group, the entry beside it or pushed over it on a phone; every word is `config/index.js`'s | yes |
| `wardrobe.js` | the two of them: which bodies are you and your sqouse (`S.pairIds`, `whoIs`, `pairBody`, `namePair`, and `keepPair`, which mends a name whose body is gone), the five slots' items as rows of data, the outfits and their defaults, each one's name and role (`S.selves`, `cleanName`, `selvesLocked`), the story lines that name them (`storyLine`, through lang.js's `msgOr`), and their saver; no DOM, no drawing. `render/wardrobe.js` draws an outfit on any context, in three passes round the body (`dressBehind`, `dressOn`, `dressHead`); `drawBody(x, y, look)` in render/crew.js takes one, and `lookFor(who, ...)` makes it (DESIGN.md, "What the two of them wear") | yes |
| `wardrobepage.js` | the picker on the held sheet (D2 of docs/mocks/appearance-hierarchy-2026-10-16, the grid from layout A of docs/mocks/wardrobe-expansion-2026-10-16): the you and your sqouse switch, the name (its field, the pad's letter grid, Steam's keyboard) and role, the close-up (`paintWardrobe`, a frame at a time while it is up) with its six slot buttons round it and the chosen one's guide line (`lead`), sized by measuring (`sizeBig`), the slot's grid of tiles (the bare square wearing each item; a locked one, per `itemLock` in wardrobe.js, tried on faint and not kept), the slot's die, randomize all (never the name), clear, and a new yard's four steps; `wardrobePad` is the pad's role left and right, the d-pad kept to the slots and out of the grid, LT, RT, LB, RB, X, Y, B (in the grid, back to its slot) and menu on it (the nearest-that-way rule is padpage.js's, handed in by pad.js through `wardrobeNav`), and the page's own keys the keyboard's; the house board's row opens it (`openWardrobe`, crewboard.js), settings.js turns the sheet to it (`wardrobeOpener`) and offers the steps once at a new yard (`offerDress`) | yes |
| `selftest.js` | the order the browser groups run in; the checks themselves are in `selftest/`, one file to a subject | grows with every feature |

What was one `upgrades.js` is four files, split by who reads them.
`levels.js` is what every ladder and every station is worth now (`mineMs`,
`haulCap`, `commutePace`, `capOf`, `handsOf`, `gangWorth`, `machineRate`,
`kitFull`): pure functions of `S`, the config, the kit, the machines and the
world. `staffing.js` is the crew's counts (`JOBS`, `spareHands`, `rebalance`,
`hire`, `assign`, `restaff`). `words.js` is how a board says a number
(`MARK`, `purse`, `gainText`, `priceText`, `leftText`, `ordinal`).
`upgrades.js` keeps the rows and the buying (`UPGRADES`, `SECTIONS`,
`HOUSE_ROW`, `billOf`, `canPay`, `buy`, `take`). The rule: **the sim -- the
crew, the stations, `game.js` -- imports `levels.js` and `staffing.js`; only
the boards import `upgrades.js`.** `levels.js` imports none of
`upgrades.js`, `shop.js`, `board.js`, `crew.js` or `works.js`, and
`staffing.js` never rebuilds the shop: a caller that moved a body and wants
the sheet to say so calls `buildShop()` itself. `node tools/cycles.mjs`
prints the import rings and `--path a.js b.js` names the chain holding a
file in one.

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
in `src/jobs.js` (its `SAID` line, the words a `job-…` message in locales/en.ftl), the count on `S` and in `SAVED`, a shape in `drawWorkers`.
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

**A new site.** The place itself is one row in `STATIONS` (`stations.js`),
and that row is the whole of it for every system that shows or staffs a
place:

1. a distance from the rock and its own tuning numbers in `config.js`
2. its rect and its state in `state.js`, its placement in `layout` in `world.js`
3. **its row in `STATIONS`**: `open`, `stand` (its ground), `board` (the flag
   that says its board is up) and its gate (`after`, `needs`, `sticky`); its
   `name` and `glyph`, which the pointer's label, the queue card, the hop and
   any row it sells without a drawing read; `empty`, what its board says with
   nothing on it; `post`, the job its roster puts on (and a `show`, `at` or
   `kit` where they differ); `site` or a board makes it a site for works,
   built by the spare hands on its `stand` unless it says `builtBy`; a `pile`
   gives it a pile-full mark and hover. The board's page is made from the
   row when the markup has none (`pages.js`), so no HTML is needed.
4. one new file for the behaviour, which ends with `registerBoard(key, { rows,
   sections })` (`boardrows.js`): what the board sells. A section that counts
   bodies says `heads`.
5. a door row through `site({ key, ... })` in `upgrades/site.js` -- no `show`
   of its own; the gate is the row in 3
6. a `draw` in `render.js`, in painting order, and a step in `main.js`
7. its `SAVE` (`fields`, `write`, `read`, `blank`), one line in `SAVERS` in
   `persist.js` -- a by-hand name with no saver is a red test
8. checks in `selftest/`, and a line in `test/shop-rows.mjs` for every row
   (`test/deep-works.test.mjs` fails a station row with no name or glyph)

Sites are placed by their distance from the rock, so adding one moves nothing
else. Unlocking one should `lookAt()` it: it is a bill and a row in a
menu, and the thing bought is off the left of the screen.

**Anything that piles up is a cell in a plot.** Dust, shards, spores and sparks
are all values in the same grids, told apart by `isDust` and by the mark
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
(a plain copy), `SAVED_BY_HAND` (written and read by its owner's `SAVE`,
listed in `SAVERS` in `persist.js`), or `EPHEMERAL` (thrown away on
purpose). `test/persist-roundtrip.test.mjs` goes red for a field in none of
them, for a by-hand name no saver claims (or two claim), and for one
`persist()` never writes, which is the warning persist.js used to owe you.

**Every new row on any board gets a line in `test/shop-rows.mjs`** — how a
player reaches it. The two `shop-coverage-*.test.mjs` files walk the table:
hidden before the gate, shown after, bought through `__buy`, and every board
reading the same after a cold reload. A row with no line is a red check.

## The pad

A pad is a third front end on the calls the mouse and the finger make
(DESIGN.md, "Controller support"), and like input.js it decides nothing.
`padread.js` polls the Gamepad API once a frame (it raises no event for a
button) and folds every pad into one reading; `pad.js` turns that into a
focus moved between the stops (`stops.js`) and the controls inside each --
a roster's minus and plus, the casino's arm and sign, the pots, the coil --
and A into the click the focus stands for; `padpage.js` takes over whenever
a part of the page has the pad (a story's sheet, the held sheet, a window,
an open list, a board or the corner cards the pad went into), moving the
page's own focus between its buttons and clicking them. `padglide.js` keeps
where the marker is drawn and `render/padmark.js` paints it in the yard;
over the page it is painted on `#padmark`. `main.js` calls `stepPad` before
the step and `paintPad` after the page is written. The mouse and the pad
are both live: a press shows the marker (`S.padOn`), a mouse move hides it.
The checks drive the same reading through `__pad` (node) or a stand-in
`navigator.getGamepads` (src/selftest/pad.js). The Deck's back buttons and
trackpads are mapped onto inputs the game already reads by the Steam Input
default in `electron/steam-input/`, which Steamworks holds, not the depot.

## The scenes

`scenes.js` is the one list of scenes: every part of the game stood up fresh
from the `__` handles, keyed by name, each saying which part it is about
(`ABOUT`) and why it is set up the way it is. Two things read it and neither
keeps a list of its own: `tools/look.mjs` shoots one by name through
`window.__scene` (every scene of a run in one tab -- `tools/cdp.mjs` is the
browser driving both it and `headless.mjs` share), and `scenesheet.js` -- imported from main.js's dev block,
beside `dev.js` -- draws a button per scene under a heading per part on the
dev panel's `scenes` tab (`devPane` in dev.js hands out a tab by name; the
panel is `yard`, `dials`, `scenes`, `frame`). A scene never touches the
player's save: the first press keeps the store's blob aside, `S.staged` stops
`persist()` writing, and `my yard` on the tab puts it back. `scenes.html`
is the same list as a page of its own: the game framed as `play.html?bench`
(staged from boot, so the frame never writes, clears or claims the save)
and every scene down the side, with a filter, `[` `]` to step and the scene
in the address. Nothing of it
ships.

## The desk

`electron/` is the desktop shell, and the rule is that the renderer is the web
build, unchanged, plus one adapter: nothing under `electron/` imports from
`src/`, and nothing in `src/` reaches the shell except `save.js` (the store
seam), `settings.js` (the two dialog branches), `achievements.js` and
`lang.js` (`desk.language()`, Steam's and the system's languages, asked once
at boot). `main.cjs` opens one window
and answers the IPC calls `preload.cjs` puts on `window.desk` --
`read(slot)`, `write(slot, raw)`, `exportTo`, `importFrom`, `version`,
`language`, and the two achievement calls -- and nothing else
crosses, no path included; `store.cjs` is the save on disk, plain Node so
`test/desk-store.test.mjs` can point it at a temp directory. It keeps
`current.json` beside `last-good.json` under `userData/saves/`: a write goes to
a temp file and is renamed over, and the save that was `current` before is
promoted to `last-good` only after the new one has been read back whole.
`steam.cjs` is the Steam build's mirror of that store (DESIGN.md, "Three
builds"): every write also goes to Steam's remote storage through
`steamworks.js` (required lazily, so nothing else needs it installed), each
slot is settled against Steam at launch by `playedS`, and the full game's
first launch offers the demo's save; plain Node too, checked against a fake
remote in `test/desk-steam.test.mjs`. `lang.cjs` is the shell's own few words
(the window's title, the carry-over dialog), read out of `locales/*.ftl` with
@fluent/bundle's CommonJS entry in Steam's or the system's language; the
packaged app carries `locales/` for it. The shell learns which build it is from
`dist/build.json` (`target`, `demo`), which vite.config.js stamps. Each notice
is also a Steam achievement: `src/achievements.js` names it `ACH_` plus its key,
`earn` tells the shell through `window.desk`, `main.js` re-sends the save's
record at launch, `steam.cjs` unlocks them, and
`tools/steam-achievements.mjs` prints the table for Steamworks.

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
node tools/look.mjs a,b,c     # the scenes named, one tab for the run, a png each
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

Dev hooks: `__state() __give(n) __spend(n) __grant({shards,spores,sparks})
__crew(miners,workers,quarriers,farmhands,labbers,wizards) __levels({...})
__lab() __meteor() __wizardHat(n) __brew() __board(name) __jump(n) __next()
__pile(x,n)
__clearFloor()`.

**Balance by measuring, and measure a plausible game.** `__levels()` and
`__crew()` exist for that. A measurement taken on a fresh save reads as ten to
fifty minutes a rock, because nothing has been bought, and will send you off
rewriting the wrong thing.
