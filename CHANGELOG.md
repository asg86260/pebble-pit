# Changelog

Every bug fixed, under the version it shipped in. A fix lands here in the same
commit that fixes it, under **Unreleased**; `npm run release` turns that
heading into the version number and the date, so nobody types a number by hand.

One short line per fix, in the player's words. No account of how it looked
or why it happened -- that belongs in the commit. A release may open with a
**New this release** list, a line a feature, no more; the reasoning behind a
feature lives in DESIGN.md.

## Held back: the second half

On main but switched off in a released build (`SERPENT_ON` in
src/config/deep.js) until it is tuned. `npm run release` and the notes skip
this section; the release that switches it on moves these under Unreleased.

**New when it is on**
- The serpent's comb is its feeding timer: it lights spike by spike from the head over the whole window, and when the last spike lights the beam leaves for its meal (test/meal.test.mjs).
- An achievement, "complete act 2", for freeing your sqouse from the serpent; a save already past it has it on load (test/finale.test.mjs).
- The constrict's orb's bar over its head is its time: it runs down as the seconds go, a click on the orb knocks a chunk off it in falling chips, the party's blows wear it down too, and at nought the orb lets go (test/orb.test.mjs).
- The serpent drops no fang once the stations standing and the fangs held or falling would fill all seven slots, at a break as at a kill (test/fangs-seven.test.mjs).
- The fangs held show on a plate set in the furnace's brick over its door, fang × N, dimmed at none, instead of on the counter card (test/fang-plate.test.mjs).
- A station with no class yet stands beside a blank flag on a pole, waving slowly, instead of a packed crate (test/props.test.mjs).
- A station that finishes building fades in as its scaffold fades out, instead of appearing at once (test/props.test.mjs).
- The constrict's orb holds its fighter halfway between the serpent and the station, in open water clear of the coil, the prop and the floor, instead of carrying it up against the coil, and the serpent swims a little higher to leave it room (test/orb.test.mjs).
- The deep's floor fades from its stone top course through the ground into the darker grey in a fixed dither, instead of two flat bands (`node tools/look.mjs deep-all,crusher`, src/selftest/deeppalette.js).
- The constrict's orb, a station whose Recruit waits on its first choice and the way up at the portal are each marked by a pointing hand tapping at them, instead of an arrow; the orb's stands beside it, clear of the coil (`node tools/look.mjs phase-orb,recruit-mark,deep-portal`).
- The deep's stations lose their domes, and each class's prop is drawn twice as big and in finer detail (the Mage's a floor candle whose flame sways), the brightest thing at its station, so the stations tell apart by shape with black water between them (test/props.test.mjs).
- Each station's prop is shaded, a pale lit edge at its upper left and a shadow on its lower right, with one small purple mark of its class before rung 8, instead of one flat grey under a purple top edge (test/props.test.mjs).
- The furnace's fire, brick and mortar keep their steps on the dark theme as on the light, instead of being squeezed together and lifted toward grey (src/selftest/deeppalette.js).
- The constriction is one steady solid beam from the comb to the orb, three cells wide at the comb with a white core, narrowing to the core alone, instead of jagged flickering bolts (src/selftest/deeppalette.js).
- The big dim shadows crossing the deep's upper water are gone, the giant and the far and middle crossings; the creatures that swim the water stay (test/deep-creature-click.test.mjs).
- The deep draws from six greys, five purples and white: one flat water with only purple stars in it, its stations, pods and furnace flat silhouettes lit along their top edges, its creatures flat, and the portal a black hole in the water (src/selftest/deeppalette.js).
- After the story's kill the serpent comes back once and stays on its last phase: each health bar emptied is a new level -- it rears, cracks to the brink and draws the deep's motes in to fill the bar again a tenth tougher -- the level on its bar, and a fang drops each level until seven stations stand (test/endless.test.mjs).
- Once he is rescued, the serpent's bar drops its row of phase pips and keeps only the level, and its belly loses the cage of ribs that held him (test/serpent-after-rescue.test.mjs).
- Big numbers in the deep read short the way the yard's do, 18.4k, 181k, 2m (test/serpent-numbers.test.mjs).
- The constrict's orb is as easy to break at every level as at the first; only the serpent's defenses grow (test/endless.test.mjs).
- The serpent's bar slides down under blows, each blow's stretch breaking off in pixel pieces that fall away, and a meal's heal flows back in instead of jumping (`node tools/look.mjs deep-numbers`).
- A blow breaks its whole stretch off the serpent's bar at once, in square chips that all flick off together and fall smoothly instead of at half the frame rate, and the bar's knock settles smoothly too (test/serpent-bar-crumble.test.mjs).
- On a narrow window the serpent's bar slides along as you scroll instead of snapping across to the serpent's other end (test/serpent-bar-pan.test.mjs).
- The deep's water and its floor reach the edges of a tall or ultrawide window instead of stopping in a hard line partway across it (test/deep-zones-reach.test.mjs).
- The deep's creatures dart away from a lash and scatter harder when a defense breaks, then ease back to their own paths; floor-dwellers skitter along the floor and shoals scatter fish by fish (test/deep-fauna.test.mjs, `node tools/look.mjs deep-scatter-lash,deep-scatter-break`).
- The deep's creatures are few now, like the birds: a click startles one off the end of the deep and shakes loose a handful of scales for the gatherers, and it drifts back in a while later (test/deep-creature-click.test.mjs).
- Every creature in the deep answers a click with its own move -- the lanternfish darts, the angler snaps, the amphipod back-flips, the shoal turns as one and flees -- and drops a handful of scales (test/deep-creature-click.test.mjs, `node tools/look.mjs deep-react-angler`).
- A creature in the deep drops its handful of scales only on the first click; later clicks still startle it, and a shoal that has fled and come back, or a new creature swimming in, has a handful of its own (test/deep-creature-click.test.mjs).
- A clicked creature in the deep moves smoothly through its reaction, easing off its path and back onto it without a jump (test/deep-creature-click.test.mjs).
- The serpent's eye holds still on its head instead of flickering between two pixels as it swims (`node tools/look.mjs deep-all`).
- The deep's water is black, on the dark theme as on the light, with half the purple stars and motes in it, dimmer.
- A swell rolls through the deep's water: one wide wave at a time, some gentle and some strong, pushes the stars and silt right and lifts them, and they ease back (`node tools/look.mjs deep-wave`).
- The deep keeps three creatures at once, each swimming the whole height of the water the window shows, top to just over the floor, and each time one swims off the end the next kind comes in, so every swimmer turns up in its turn; each sets out and comes in at a random height anywhere in the water, so a reload finds them spread top to bottom (test/deep-fauna.test.mjs).
- The serpent's meals no longer empty the deep: a creature it eats is replaced at once by the next one swimming in from just off the side of the screen, never fading in, so the water keeps its three (test/fauna-refill.test.mjs).
- After the serpent dies she hangs her gear on her station for one of the deep's crew to take up, and the two of them go home through the portal and down the whole yard with everyone falling in behind, to a house the builders put up during the walk, where they live for good (test/finale.test.mjs).
- The finale's crowd hops in held poses without flickering on and off, the quarry and the hill come and join it, and no firework opens as a hollow box (test/finale.test.mjs).
- Refreshing the page during the finale brings its closing sheet up at once instead of a moment later (test/finale.test.mjs).
- The house the two of them live in after the serpent stands at the yard's left end with its bench clear of the casino, instead of in the middle of it (test/finale.test.mjs).
- The first trip down into the deep plays a short scene: the camera finds him calling from the serpent's belly, then her under the portal, and she charges down and lands her first blow; her station stands, free, from the snatch (test/abyss-intro.test.mjs).
- During the snatch the rest of the crew fade out of the shot, the portal waits until they are gone, and no rock comes down until it is over (test/ending-stage.test.mjs).
- A station bought with a fang asks the yard's dust for its first rungs, so a new fighter climbs over minutes instead of all at once.
- When the serpent resists explosive it floats a magic barrier under its body that soaks up the Sapper's charges.
- The serpent's warded phase, split and fading resist whatever your highest-rung fighters deal, explosive included, instead of fixed kinds.
- The deep's first pod costs 10 scales, and each after it a third more.
- A click or tap on the constrict's orb no longer opens the fighter's board over the orb and its bar (src/selftest/deep.js).
- The constrict's orb rises clear of its fighter's station, and once broken the fighter sinks home instead of snapping back (test/orb.test.mjs).
- Refreshing the page while a fighter is in the constrict's orb no longer stops the game (`node tools/look.mjs phase-orb`).
- The serpent's statuses stand over its bar, twice the size, each with its name under it.
- The serpent has a fifth phase: its comb lights up and bolts lock the strongest fighter in an orb; break the orb (a click on it hits harder), or pick the fighter out of it.
- The serpent's warded phase no longer surges: its magic resist is the whole of it.
- In the snatch he stands over the middle of the whirlpool, the serpent's jaws close where he is standing, and her leap ends in the ring (test/snatch.test.mjs).
- Small hits on the serpent shed more scales: two more on every hit.
- Freeing the sqhusband plays out: the serpent goes limp, sinks to the floor and comes apart into motes, he walks out to her, and after the sheet the serpent gathers itself again (test/snatch.test.mjs).
- Each serpent phase is a window: break the defense before it eats, or the meal heals it to full; stuns and Held stop the window, and the phases are far shallower (test/meals.test.mjs).
- The Hexer's Wither now Exposes the serpent, so it takes more damage; Weakened is gone (test/classes.test.mjs).
- Buying a fighter's rung closes the board and plays its level-up: it stops fighting and rises as a purple-hearted blaze twists up round it and ends in a burst of embers; the next rung waits until it has (test/classes.test.mjs).
- The serpent's first defense breaks into a dive: it goes down out of sight under the floor and comes back up warded, the bar refilling and its four phase boxes showing for the first time (`node tools/look.mjs break-rise`).
- Every later break is a roar: jaws wide, a bump running down the body with the new hide behind it, throwing off the fighters it passes (`node tools/look.mjs break-roar`).
- A meal eaten while the serpent is stunned or Held no longer heals it (test/statuses.test.mjs).
- A fighter's later rungs ask the deep's own price in dust, ore and sparks, sized for a yard that has reached the abyss (test/deep-board.test.mjs).
- A blow knocks only its own sliver off the serpent's health bar, not a fixed chunk (`node tools/look.mjs deep-numbers`).
- The serpent's health bar stands over the first third of its body from the head, with clear water between it and the coil, and shortens to fit a phone held upright (`node tools/look.mjs deep-numbers`).
- The rescue's sheet has no button with the second half on: it stands a beat, rises and fades, and the camera pulls in on the plank as the snatch plays (test/serpent-flag.test.mjs).
- The rescue's sheet says the story isn't over when the second half follows it, and the sheet for freeing him says it is the end (src/selftest/ending.js).
- The serpent that comes up out of the pit has the deep's head: snout, purple crest and hinged jaws that open wide and shut on him, on a neck that leans out toward the plank (`node tools/look.mjs snatch`).
- The story's line carries on into the second half: drown the pit, ask the wizards how to get down, buy the portal, free your sqhusband (test/objectives.test.mjs).
- The deep's portal no longer pokes up through the water's surface, so a click on the roof is not a way up (src/selftest/deep.js).
- The serpent's bar centers over the stretch of serpent on screen instead of the middle of the window (`node tools/look.mjs deep-numbers`).
- The serpent eats to heal with its constrict: as a window runs out its comb lights, bolts lock the nearest creature in an orb and drag it slowly to the jaws, the orb shrinking as it nears, and it is swallowed, a lump runs down to the belly and purple crosses rise as the heal lands; the creature's place in the water is taken by the next kind swimming in from the end (test/meals.test.mjs, `node tools/look.mjs meal-reel`).
- A melee fighter hopping up to the hide is thrown off by the lash like one at it (test/phase-mechanics.test.mjs).
- The serpent is shorter: its head hangs just past the first fighter, leaving open water to its left (`node tools/look.mjs party-four`).
- The serpent rides lower in the deep, with more room between it, the bar and the portal (`node tools/look.mjs deep-fading`).
- The lash's tile stays under the serpent's bar all through its phase and says it stuns melee attackers, and the status badges are half again as big (`node tools/look.mjs deep-stun`).
- The serpent's ward and plates show as tiles beside its debuffs under the bar, the fading's turning from one to the other with its rim blinking ahead (`node tools/look.mjs deep-fading`).
- Every fighter attacks in its own combo -- a quick string, a reset and a rest -- at the same damage a second as before (test/combo.test.mjs).
- Every class deals physical, magic or explosive damage: the warded phase resists magic under its purple ward, the split resists physical under plates, and the fading switches between the two (test/resists.test.mjs).
- The Mage's beam pools in a ball of energy where it meets the serpent, and every status icon says what it is on hover (`node tools/look.mjs deep-fading`).
- The serpent's statuses and its phase's surge, lash or sink show as icons under its bar, each with a timer, and a fighter's own statuses stand up a post beside its station (`node tools/look.mjs deep-stun`).
- Every fighter's moves and capstones say what they do in two or three words, and the status hovers are a few words each (`node tools/look.mjs recruit-board`).
- A status's hover line on a station's board is shown whole even past the board's edge, and a status named in an effect stays on its line (`node tools/look.mjs recruit-board`).
- A station's board reads in full black, and each effect's description sits on the line under its name (`node tools/look.mjs recruit-board`).
- The Recruit's board is as wide as its five choices need, so none of their names spill out of their boxes (`node tools/look.mjs recruit-board`).
- The serpent flinches from a blow: the stretch of body round it is thrown up as one piece and settles, instead of a dent that sprang back past with a bulge running off it (`node tools/look.mjs deep-wound`).
- An arrow dents the serpent the moment it reaches the hide instead of sitting against it first, and a held beam presses the hide steadily instead of setting the coil springing on every tick (test/deep-arms.test.mjs, test/sword-dent.test.mjs).
- Blows land with weight: the serpent's hide is driven in and springs back past with a bulge running along it, the fighter is knocked back off every blow, and the bar recoils up as each number goes into it (`node tools/look.mjs deep-wound`).
- Each blow that lands in the serpent's bar knocks a chip out of the end of its fill, so even a small blow shows (`node tools/look.mjs deep-numbers`).
- The serpent's bar is bigger and hangs just over the serpent, the portal moved up for it, and every damage and heal number flies into the bar before it moves (`node tools/look.mjs deep-numbers`).
- A fighter thrown off the serpent by its lash sees stars all the way down, not only once it lands (`node tools/look.mjs phase-lash`).
- Every blow on the serpent shows its own number instead of being added into the last one's (test/serpent-numbers.test.mjs).
- A blow's number is knocked off the serpent in an arc, bigger and with speed lines for a heavy blow, and the heal's number swells along its digits and fades through the purples (`node tools/look.mjs deep-numbers`).
- A low dark dome stands behind every deep station, so the scales heaped on the floor sit behind it and the fighter reads against dark (`node tools/look.mjs party-four`).
- Each phase past the first has a mechanic, warned ahead and answered by a class: the warded phase surges its heal until a stun spends it, the split lashes the melee fighters off the hide unless a Hexer holds it, and the fading sinks into the abyss out of reach (test/phase-mechanics.test.mjs).
- The Ranger loads each shot: an arrow from the hip, nocked, drawn in two steps as he strains and sinks, held, then loosed with the string snapping and a held recoil (`node tools/look.mjs party-four`).
- The build button puts a station up at once; a Recruit fights there with a light punch until rung 1 makes it a Fighter, Novice, Scout, Adept or Apprentice, and rung 4 forks it into one of two classes (test/rails.test.mjs, test/party.test.mjs, src/selftest/deep.js).
- A new station whose Recruit is waiting on its first choice wears a chevron that says "choose a fighter" (test/props.test.mjs, src/selftest/deep.js).
- A station's board shows where every choice leads: each base unit's two specialists, and each specialist's move and capstone, with status effects named and explained on hover (test/rails.test.mjs, src/selftest/deep.js).
- Every station stands on a stepped stone plinth, off the deep's floor (test/props.test.mjs).
- Every fighter attacks the serpent straight above its own station (test/classes.test.mjs).
- Scales handed back by a station's Reset or a refund are tossed back into the crusher instead of dropped in the water (test/rails.test.mjs, test/crusher.test.mjs).
- A refund's dust and finds are tossed back into the pit and counted as they land, instead of filling the pile before the toss arrives (test/queue.test.mjs).
- The yard's house has a room for the yard's crew only, not one for every body living in the deep's pods, and the crew list shows the yard and the deep apart (test/two-crews.test.mjs).
- The serpent's fight takes about an hour: the first fighter out-hits the first heal a few rungs up, each stage after waits on the party's next rungs, and a bigger hit sheds a few more scales than a small one (test/serpent.test.mjs).
- Fighters sway a cell between attacks, and the melee ones hop as each step lands (`node tools/look.mjs party-four`).
- A station is its fighter beside a prop instead of a building under a dome: a crate below the fork, the class's own from it, its parts purple at rung 8, and its board named for the fighter (test/props.test.mjs, src/selftest/deep.js).
- The party: up to four stations built on the deep's floor, the first free and each after it for a fang the serpent drops at a break, each with a fighter of one of ten classes climbed on the station's rails, a move at rung 4 and a capstone at rung 8 (test/party.test.mjs, test/rails.test.mjs, test/classes.test.mjs).
- The second half: when the sqwife is out and the pit has drowned, a serpent takes the sqhusband down into the abyss, and the deep below is fought by the party's fighters; the scales they knock loose are gathered off the floor into a crusher (test/snatch.test.mjs, test/serpent.test.mjs, test/deep-arms.test.mjs, test/crusher.test.mjs).
- Pods, the deep's houses, bought in scales: the crew grows down there, each body works in the half it lives in first, and the deep is built by the yard's builders going down the shaft (test/pods.test.mjs, test/deep-works.test.mjs).
- The serpent snatches him through a portal in the abyss and the sqwife leaps in after him; the deep is its own crew from then, grown by its pods and building its own works, the sqwife living in its first pod, and the portal a wizard flies out and summons in the middle of the pit -- clicked, or its arrow or the corner's square -- is the player's way down; the deep is seen under the yard's own sky, mostly water (test/two-crews.test.mjs, test/snatch.test.mjs).
- A square in the corner and an arrow at the shaft take you between the yard and the deep (test/deep-shaft.test.mjs).
- Going between the yard and the deep is a ripple out of the portal, the deep full-screen water inside it, with the camera still (src/selftest/deep.js).
- The wizards' portal is a hole torn into the pit's wall, made of the abyss's own smoke and liquid, and its other end hangs in the deep: a click on it goes back up (src/selftest/deep.js).
- A builder hammering in the deep stirs up silt that sinks back and settles on the floor (test/deep-works.test.mjs).
- The pods have a board of their own that sells another pod, and the deep's stations stand further apart (test/pods.test.mjs, src/selftest/deep.js).
- The deep's crew no longer hangs still with nothing to do: a gatherer on a bare floor, a scribe whose circles are full and a wizard with nothing in reach stroll, float and hop about their station, and go straight to work from mid-air when called (test/deep-rest.test.mjs).
- The fight is read in numbers: each blow's damage rises off the coil in a carved pixel face of its own, a lance's and a beam's bleed and a grenade's burst each say one sum, and the heal rises off the wound in purple as +N once a second (test/serpent-numbers.test.mjs).
- The serpent has a bar at the top of the deep: what its defense has left, what a blow just took in grey, what the heal won back in purple, and four pips for its four defenses.
- Blows land on the serpent: each one bites its hide and bursts its scales off, and a heavy blow stuns it still, stopping its heal for a few seconds (test/serpent-stun.test.mjs).
- Fighters at the serpent's hide are no longer dragged under the deep's floor when it dives or lies down (test/party.test.mjs).
- Hovering a fighter up at the serpent no longer drops it to the deep's floor (test/classes.test.mjs).
- After the serpent's death the fighters stop attacking it and go back to their posts, the motes fade away instead of hanging in the water, and the head comes apart with the rest (test/snatch.test.mjs).
- The deep's stars and drifting motes fade in and out instead of blinking on and off (src/selftest/deeppalette.js).
- The deep's stations hold one steady purple: the lit top edge of their props, the pods and the hexer's brew no longer cycle through purples (`node tools/look.mjs deep-all`, test/props.test.mjs).

- Refreshing the page no longer stops the serpent eating: a meal already under way still lands, its creature still in the orb, and the heal comes at the end of every window however often the page reloads (test/serpent-reload.test.mjs).
- The serpent no longer sheds more scales than the gatherers can ever carry to the crusher (test/serpent.test.mjs).
- The deep's build button shows its price, one fang, instead of how many fangs you hold (src/selftest/deep.js).
- A Swordsman's blow dents and wounds the serpent once, in one place, on the turn that lands it (test/sword-dent.test.mjs, test/classes.test.mjs).
- A Sapper's two charges stick and go off in one spot instead of two (test/classes.test.mjs).
- Two of the deep's stations of one kind, or two empty lots, no longer share a board's name (src/selftest/stations.js).
- The deep no longer crawls on a large screen: its water and the serpent take a third of the time to draw they did (test/deep-paint-cost.test.mjs).
- Scales tossed into the crusher drop into its funnel instead of sliding down in front of it (`node tools/look.mjs crusher`).
- The call to build the bench no longer hangs over the deep (src/selftest/opening.js).
- Lightning in the yard's storms no longer flashes over the deep (src/selftest/deep.js).
- The deep no longer drops to about 35 frames a second in Firefox on the light page (Firefox at 2560x1440 on the `deep` scene, PERF.md "The deep in Firefox").
- Going between the yard and the deep through the portal no longer hitches: the ripple holds its frame rate in Firefox, and the first trip down no longer stalls (Firefox and Chrome at 2560x1440 on `portal`, PERF.md "The ripple in Firefox").
- On a tall window the deep's water goes all the way up to the top of the screen, with no black band over it (src/selftest/deep.js).
- The serpent is one smooth coil that no longer comes apart; its wound cracks out along the body, and he is plainly inside it, in a cage of ribs the wound breaks open (test/serpent.test.mjs).
- The serpent keeps its length as it sways, and has a sea serpent's head: a long snout and a purple crest down its neck (scene serpent-head).
- A worker thrown in the deep sinks to the deep's floor and stays down there, instead of landing on the yard's ground (test/deep-shaft.test.mjs).
- The counts card keeps clear of the wizards' portal instead of covering it (src/selftest/deep.js).
- The deep draws its water, serpent, stations and floor as a few images a frame instead of thousands of cells, so it no longer drops to a crawl on a large screen (scene deep-all).
- On a tall window the deep no longer shows the yard workers' shouts, squats and roster badges hanging over its water (src/selftest/deep.js).
- A boulder landing in the yard no longer shakes the screen while you are in the deep (test/deep-view.test.mjs).
- The deep's crew no longer shouts when a rock lands up in the yard (test/two-crews.test.mjs).
- What a deep station has in line hangs just over the station, in front of its dome, and its hover box is the station itself rather than a tall block round the dome (test/deep-works.test.mjs).
- The deep's build button is drawn as a button again, and fades in and out (`node tools/look.mjs party-button`).
- The Scout's arrows, the Assassin's daggers and the Hexer's bolts are seen flying up to the serpent, not stuck against it the whole way (`node tools/look.mjs deep-scout`).
- Gatherers work the scales lying nearest the crusher first instead of swimming across the deep to the tallest heap (test/gather.test.mjs).
- Scales you grab off the deep's floor show on your pointer, and dropped on the furnace they fall in and count (src/selftest/deep.js).
- Scales sinking from the serpent can be caught on the way down (src/selftest/deep.js).
- After a refresh the deep's builders go back to a pod or station left half built and finish it (test/deep-build-reload.test.mjs).
- Holding the right button in the deep picks out the crew down there as it does in the yard, the water veiled behind them and each body ringed (src/selftest/deep.js).
- Gatherers no longer stack into what looks like one worker: each goes for scales nobody else is on and they swim in file, a body apart (test/gather-spread.test.mjs).
- The deep no longer hitches every few seconds during a fight (test/deep-alloc.test.mjs).
- The game no longer stops in the deep when a station's crew climbs a rung (test/reexport-local.test.mjs).
- The counter in the deep stands at the left edge again and the furnace stands further in, so the card no longer covers it (src/selftest/deep.js).
- The deep's build button shows up again with a fang held, and an open station's board fills in its tree on its own (src/selftest/deep.js).
- The deep's fighters take less of every frame to find the serpent over their stations (test/deep-alloc.test.mjs).
- A load or a new game late in a long session no longer stops to walk the deep's creatures from the start (test/deep-fauna.test.mjs).

## Unreleased

**New this release**
- The chips off a builder's hammer are the paper over buildings and ground and the ink over the sky, on either page (src/selftest/work.js, "a builder's grit is plain paper or ink").
- A disk in the corner fades up for a moment as the game saves (src/selftest/savemark.js).
- A log at the saw mill saws into four timber blocks and nothing else: the sawdust heap, its hatch, its tip and its upgrade row are gone (test/after-mill-machine.test.mjs, test/no-sawdust.test.mjs).
- Act 3's goods have their own colors: each log, timber block and sign is one of four tones of its good -- bark brown, pale wood, slate -- picked when it is made and kept wherever it goes, so a pile reads as separate pieces (test/after-palette.test.mjs).
- A scale falling through the deep's water is a chip of the one air, and one still in it when the page reloads is where it was; act 3's thrown goods and the deep's scales come down on the same landing chain the yard's dust does (test/one-landing.test.mjs).
- Every box stands on the boards' dot ground: the cards, notices, buttons, signs, tabs and fields, the counter and the canvas's own cards, the black ones in the paper's dots (test/ui-tokens.test.mjs).
- Act 3's UPGRADES button lifts and sways under the pointer as a shop tile does, and pressed again puts its shop away; every station has one, God's crowd too, and clicking or hovering a station opens nothing; a shop tile pressed now sinks halfway (test/after-gestures.test.mjs).
- Act 3's stations are their own shops: open one from the UPGRADES button under it, take hold of its work to close it; the $ signs, the strip under a worked station and the glyph over a working one are gone, and one ghost hand shows how (test/after-gestures.test.mjs).
- Act 3's saw mill is a machine you can follow a log through: the sawyer walks the treadwheel, carries each log to the bed, and the blade cuts it a column a stroke into timber that rides down a chute onto the mound and sawdust that falls on the heap under the saw (test/after-mill-machine.test.mjs).
- One hand in the yard, the deep and act 3: a drag takes dust, scales, planks or logs up to what the hand can carry by weight (a plank four grains, a log sixteen, never fewer than one), and what you throw can be caught and swept up again anywhere (test/one-hand.test.mjs).
- Act 3's log and timber piles are heaps of blocks you can see, a log a 4x4 and three 2x2 timber blocks a log; each pile holds only so many, shows the pile-full mark at its brim and stops what fills it, and timber bills and a save's timber are halved to match (test/after-pile-plots.test.mjs).
- In act 3 nothing fades onto or off a pile: workers carry every block, the workshop's timber walked to it four blocks a sign, its signs standing in its rack as blocks until carried out, and a row billed in timber lands when its blocks have been carried to its station (test/after-carried-goods.test.mjs).
- The corner's way square works from every place: from heaven down to the yard, from the yard down to the deep and up to heaven once its gates are open, and from the deep down to hell once it is open, each on the ripple (src/selftest/deep.js, "the corner squares go from heaven down to the yard").
- Act 3 is one chain now: trees, the saw mill, the workshop, signs; paper, posters, the chipper, the paper mill and the press are gone, and the sawdust heap stands on the saw mill's own ground (test/after-cut-paper.test.mjs).
- Switching between light, dim and dark fades the game over in place, without reloading the page (src/selftest/settings.js, "the dark switch turns the page in place").
- In heaven each station stands on its own shelf of cloud, further apart, with ramps between, and everybody walks up and down them (test/after-floor.test.mjs).
- In heaven a lip of cloud billows runs along the path's front in place of the clouds drawn below it (scene after-camp-art).
- In heaven each station has one job, its worker fetching its own logs and taking its own signs and posters out, and hovering a roster says what the job does or why it is stuck (test/after-roster.test.mjs).
- Heaven's gates stand left of the house, appear only once it is smashed, swing open smoothly, and show the pointer when they can be clicked (test/acts-travel.test.mjs).
- The rise into heaven rides up with them: one shot from the ruined house up the road through the clouds to the cloud floor, about eight seconds (test/shot.test.mjs).
- The yard has a sound for each kind of work, each in its own register so a busy yard stays clear: footsteps, picks, hammers, shovels, carts tipping, the belt, grains landing, bodies thrown, stations landing, birds, the casino's win and loss, and the dome and the rift; the busiest are heard only where you are looking (test/sound-lanes.test.mjs).
- The dark switch steps light, dim and dark: both turn the page over, white things dark and black things light, dim on charcoal and dark on near-black (test/settings.test.mjs; test/ui-tokens.test.mjs; src/selftest/textaa.js).
- The game's words are set in Courier Prime, a Courier drawn for reading, bundled so every machine sees the same face (test/l10n-type.test.mjs).
- A "readable text" switch on the settings' graphics tab sets the game's words in DM Mono, a size up, without the wide spacing, and tooltips and board notes in their own case (src/selftest/settings.js).
- At a new yard you build who you are and then your sqouse -- a name, one of sqwife, sqouse or sqhusband, and what each wears, with a die on every row, a randomize all that leaves the name alone and a clear -- and every story line, card, sheet, the index and the books name the two of you that way; the rescue achievement now says "complete act 1" (test/who-you-are.test.mjs; src/selftest/wardrobe.js).
- The appearance page is a wider, shorter sheet of its own, the grid five tiles across and scrolling inside it (src/selftest/wardrobe.js).
- The sqwife and the sqhusband can be dressed -- a hat, a face, something at the neck, something on the back, a pattern, an aura -- on a page of their own, "appearance" on the house's board, offered once at a new yard; what they wear on their heads replaces their station hat, so the two of them can be found in any crowd; the station hats, a gold set, the serpent's comb and a dozen more pieces open with achievements, a station's first hat or the portal, and a lamp lights the way ahead of whoever wears it; capes, scarves, ribbons, flags and the rest lag as they set off and swing past and settle as they stop, what they wear holds its shape as they walk, and the comb now and then lights up as the serpent's crest does (test/pair.test.mjs; test/wardrobe-locks.test.mjs; test/wardrobe-motion.test.mjs; src/selftest/wardrobe.js).
- The appearance page and a new yard's build steps put the six slots round the close-up, three a side in the order they are worn, each showing what it wears, with a line from the chosen one to where it is worn and that slot's every item in a grid under it; a locked one is tried on faintly and not kept (src/selftest/wardrobe.js).
- The back items are drawn finer: the capes billow out behind on the walk, the balloon lags behind on a stepped string, the flag is a pennant streaming back, and the backpack has a flap and a buckle.
- On a short window, down to a laptop's 1280x800, only the appearance page's grid scrolls, so the close-up, its slots and the buttons stay in view, and the arrows walk every row of the grid before leaving it (src/selftest/wardrobe.js, "short window").
- Settings, on the pause sheet and the title page, is one page in four tabs -- graphics, audio, controls and language -- with the controls table and the languages right under their tabs, LB and RB to turn them on a pad, and the title page's volume slider drawn like the pause sheet's (src/selftest/settings.js, "four tabs"; src/selftest/language.js).
- Every zoom glides instead of stepping, the picture scaled sharp on the way, and the pointer stays on what it points at through it (test/zoom-glide.test.mjs).
- Everyone in act 3 walks three times as fast; the throne's speech keeps its pace (test/after-roster.test.mjs).
- Act 3's workers are bought with rebel: a soul a sign or poster wins pays rebel and waits in God's yard, and the pedestal's recruit row hires one, its line saying how many are ready and how many idle (test/after-recruit.test.mjs).
- Act 3's stations stand further apart, and a station worked by hand no longer puts its name up over the work (src/selftest/playcheck.js).
- The recruit row, greyed while nobody is won, says so and how to win one instead of reading like a price you cannot pay (test/after-recruit.test.mjs).
- Signs and posters no longer pile up unused in act 3 when nobody is on the carrier or the paster: idle workers take them out (test/after-roster.test.mjs).
- Every build takes 10 to 20 seconds at one pair of hands, the biggest (a new station, a machine, the last shield) 30 at most, by one rule off a row's place in its ladder instead of a figure a row (test/build-times.test.mjs).
- The sphere costs 1.75 times the dearest other machine in every coin, so it is the last machine you can afford (test/sphere.test.mjs).

- A game tab that is not being saved -- another tab has the save, or the browser refused it -- shows a struck-through disk in the corner instead of playing on in silence, takes the save back by itself once its game is the newest, and a game tab opened in the background no longer takes the save from the one you are playing (test/save-alarm.test.mjs).
- The browser closing the save's database under the page no longer stops the game; the save is retried on a fresh connection (src/selftest/savemark.js).
- The save as it was before an update changed its shape is kept beside it, so a bad update can be rolled back (test/save-alarm.test.mjs).
- In Firefox on the dark page, a builder at work no longer drops the whole game to twenty-odd frames a second after a reload (src/selftest/work.js, "the dark page draws a builder's grit with no difference fill").
- A worker's hat in a roster counter sits flush on its head instead of a pixel to one side with ragged seams (src/selftest/rosterhats.js).
- Saving on the very frame the star's sphere closes no longer leaves the ring uncut after a reload (test/sphere.test.mjs).
- Shop cards keep one width and one height, so buying a rung, a deeper bill or a card being built no longer shifts the board (src/selftest/boardwords.js).
- In act 3 logs and timber stack, roll and settle the same way wherever they land, on a pile or on open floor, never one drawn through another, heap into a mound rather than a tower, and a press on a pile takes the block on top (test/after-ground.test.mjs).
- In act 3 every member carries cells the way the yard's haulers do, by the hand's weights (a log sixteen grains, timber four), a station's loads come out of the shack's door, and a unit is held only if it was really taken (test/one-carry.test.mjs).
- Dust, scales and act 3's logs and timber held on the cursor drift round it smoothly again instead of hopping a cell at a time (scenes hand-dust, after-hand-timber).
- In act 3 a press and hold dragged across piles and the logs or timber lying about picks them up the whole way, begun on bare ground or on goods, as dragging across dust does (src/selftest/afterboards.js).
- Going back up by the corner square after looking along the deep, or down from heaven, no longer jumps to the portal before the ring closes: the ring closes on what you were looking at (src/selftest/deep.js, "going up from anywhere in the deep").
- Going between the surface and the deep plays its ripple again after a reduced-motion scene was looked at, instead of cutting straight across for good (src/selftest/deep.js, "a reduced-motion scene leaves the player's full motion").
- Act 3 keeps no stock numbers: a pile is what lies on its strip and the sawdust heap is its grains, saved as cells, and a unit appears or vanishes only at a tree felled, a cut at the saw, a sign joined, a tip through the hatch, a sign planted, an order laid, a band laid or a blow in the deep -- every frame of every check asks it (test/no-stock.test.mjs; test/conservation.test.mjs).
- A station going up is a strip of the ground: its loads are real blocks made at the shack's door, set down on the strip by members and taken off its top by the builders, and the drawing is the ground's (test/build-site.test.mjs).
- A log or plank let go over a pile of another kind lies on its mound and is carried home from the top, instead of landing beside the pile (test/off-kind-landing.test.mjs).
- A joiner carrying timber to the bench no longer sets it down as a sign or plants it in the crowd (test/conservation.test.mjs).
- In act 3, workers no longer stand waiting at a station for a hauler still on its way to the far pile, so the saw mill and the workshop keep working while one hauler does the rounds (test/after-playthrough.test.mjs).
- A stirrer at its pot no longer stays hanging in the air when a dance is cut off mid-jump (test/dance-cut-at-pot.test.mjs).
- Loading a save that was left in the deep no longer lays its sky, clouds and rain out against the window of the yard you were in before (test/held-state.test.mjs).
- The yard takes less of every frame to count what lies on its floor (test/perf-gate.test.mjs).
- Muck and rain lying on the ground no longer slow the yard down (test/perf-gate.test.mjs).
- A yard started with the same seed plays out the same whether or not the page has been clicked: the sounds no longer spend the yard's chance (src/selftest/settings.js, "the dark switch turns the page in place").
- In act 3 the sawdust heap's pile-full mark has a name, "sawdust heap", like every other station (test/deep-works.test.mjs).
- In a narrow window a board uses the whole width under the purse instead of squeezing into a sliver beside where the purse would be, so its cards keep their words inside them and several tiles share a plank (src/selftest/boards.js, "no row on any board sits on top of itself").
- In a narrow window a board stands where it really is, its width under the purse rather than beside it, so it no longer opens off to one side of where it is drawn (src/selftest/house.js, "a board that changes under you is seated by its new size").
- In a narrow window a board taller than the window scrolls inside it instead of running past its foot by the height of the purse (src/selftest/boards.js, "a board taller than the window scrolls to its last row").
- In a narrow window every board, in the yard and in heaven, fits inside the glass, its purse going on to a second line rather than off the edge (src/selftest/boards.js, "an open board lies inside the window, popover or sheet").
- A sheet going away no longer catches the click meant for what it uncovers, so the call to build the bench works the moment the pause sheet is shut (src/selftest/input.js, "the board does not shut on the way to it"; src/selftest/boards.js, "shop opens at the bench and is not buried").
- The tick and the glyph over a station that finished something are crisp at every window size in the deep, instead of a faint seam along their edges on a large window (src/selftest/deeppalette.js).
- What crosses behind the rift, or the serpent's glimpse, no longer stays up for a frame as the camera leaves for heaven or the deep through a portal (src/verify.js, rules 17 and 18; src/selftest/playcheck.js).
- A board's list of options, opened while the board is still sliding over to its station, now stays hung under the control that opened it instead of being left behind where the control had been (src/selftest/boards.js).
- A yard with a big crew in the deep no longer lags: its gatherers stopped re-reading the whole floor and the whole crew every frame (`node tools/node/break-perf.mjs`, test/crusher.test.mjs).
- A card's long name, its gain and its cancel / another strip are no longer cut short at the card's edge; the board widens to fit them (src/selftest/boardwords.js).
- The smallest words in the menus -- the appearance page's tabs and tile names, the boards' row names, the controls table, the settings tabs, the title page's foot -- are no longer too small to read, and every grey word in the menus is dark enough to read on the light page and the dark (src/selftest/textaa.js; test/ui-tokens.test.mjs).
- The appearance page stays one height as you change slots, switch between you and your sqouse, or step through a new yard's build steps (src/selftest/wardrobe.js, "one height").
- The appearance page's tiles are four to a row, every name and unlock line shows whole and wraps at spaces, and what opens a locked tile comes up in the game's tooltip; the line under the grid is gone, so hovering never moves the page (src/selftest/wardrobe.js).
- On a gamepad the focus brackets travel from one thing to the next where you can follow them, up to the corner buttons, onto a board's rows and back, while the camera glides to center each one, both eased in and out (test/pad-glide.test.mjs; src/selftest/pad.js, "the marker travels across to the corner").
- The arrow on the corner button that takes you down to the deep and back up is light on the dark theme instead of black (src/selftest/deep.js).
- A late yard with a big crew runs faster, above ground and in the deep (`node tools/node/late-perf.mjs`).
- The apothecary's brew notes and who-first heading are dark enough to read in both themes (src/selftest/contrast.js).
- A cutscene's widescreen bands stay black in dark mode instead of turning light grey, and a beat's line on them stays light (`GAME=…/play.html?dark node tools/look.mjs leaving`).
- The act 3 intro keeps its widescreen bands and its zoom through the tear, and lands in the afterlife on the cloud floor where the two of them come up instead of in the empty sky under it, climbing (test/shot.test.mjs).
- The casino, heaven's stairs and the house no longer overlap; the deep's crusher, pods and hell's slit stand clear of each other and of the party's stations (test/no-overlap.test.mjs).
- The opening, the serpent's kill, the walk home and the first trip down glide their camera and their zoom together instead of cutting across the deep or stepping the zoom, and keep who they are about in the frame (test/shot.test.mjs; cutscenes.html, the finale, snatch-kill, opening and first-trip rows).
- A hauler down the hole when the pit drowns is no longer left buried in the abyss; the drowning waits until the hole is empty (test/hauler-in-hole.test.mjs).
- Loading a save or importing one no longer leaves the noticeboard standing on the closet until the layout next changes (test/finished-save-snatch.test.mjs).
- A big casino win with the tray full no longer drops on a hauler down the torn hole in one lump; the pay streams out of the hatch and is counted as each grain lands (test/hauler-in-hole.test.mjs).
- In heaven, members holding posters when the fence is full put them back at the press and come free for work again (test/after-full-fence.test.mjs).
- In heaven, an idle member's first sign, poster or log picked up no longer counts as two (test/after-gather.test.mjs).
- In heaven, holding the right button now veils the camp and rings each member, and the one under the cursor slows so it can be picked up (src/selftest/afterboards.js).
- In heaven, a new soul joins God's crowd and the signs ink on the act's own clock, so a reload or a new game no longer shifts when either happens (test/after-crowd.test.mjs).
- On a gamepad, pressing along the stops faster than the camera can pan to each no longer throws the focus back to the middle of the window on a wide screen (src/selftest/pad.js).
- In the deep on a tall window, the pointer near the top of the glass no longer opens the board of a yard station that is not drawn there (test/gates.test.mjs).
- On a phone the opening view shows the whole rock instead of cutting off its left side (src/selftest/view.js).
- On the appearance page, right from the last tile in a row of the grid stays on it instead of jumping the focus to a key at the top of the page (src/selftest/wardrobe.js, the picker by a pad, at 390x844).
- After a load or a new game the stations' offer flags stand as the new yard has them, and heaven's ground, the serpent's bar and the fang plate start from it, instead of the last yard's raising, fading or breaking off (test/held-state.test.mjs).
- Leaving the deep, or the serpent's bar going down, no longer leaves a status's tooltip waiting on that spot of the screen (src/selftest/deep.js).
- The landing page's settings, the cloud section, the language tab and the feedback form work again: the title page no longer loads the board's page-only code through the UPGRADES button's drift (src/selftest/language.js, src/selftest/cloud.js).
- The cinema's dot-ground bands no longer fail the deep's palette read, and the afterlife's play check opens each station's board by its UPGRADES button (src/selftest/deeppalette.js, src/selftest/playcheck.js).
- Loading a save no longer shows the last yard's income rates and air trend in the books until they age out (test/held-state.test.mjs).
- The diggers' counter stays under the rock after the shack is bought, instead of moving to the shack (test/digger-roster.test.mjs).
- Switching saves no longer carries dust on the cursor, scales in the water or blocks lying in act 3 from the old game into the new one (test/save-switch.test.mjs).
- A card's refund and another buttons stand one over the other with room round their words instead of touching side by side (src/selftest/boardwords.js).
- A scene's camera pin no longer holds the view under the next check (src/selftest/view.js).

## v0.6.1 — 2026-10-19

- On the free build, "keep playing" on the "to be continued in the full game!" sheet no longer crashes the game, and the sheet stays down after a reload (test/keep-playing.test.mjs).

## v0.6.0 — 2026-10-16

**New this release**
- The controls page is one table grouped by what you do, each action once, with its mouse or keys and its controller button drawn side by side in lined-up columns (src/selftest/settings.js).
- The pointing hands at the yard portal fade away once you have gone down through it and back up, and the portal stays clickable (test/portal-hand.test.mjs).
- The drawn yard speaks one visual language: one grey and one purple ramp, a plus for the spark everywhere, pixel numbers on every count, no shaking, and everything on the cell grid.
- A consistent look across the menus: one type scale, one button height, the pause sheet one width on every page, pages centered on the title page as on the pause sheet, the gamepad's purple corner brackets for keyboard focus, one look for chosen, pressed and disabled, section signs on every board, coins that stay readable in dark mode, and no shelf tile's words cut short or under its pips.
- Nine more index entries have a drawing: muck, poop, pollution, birds, the pit, your sqwife, the bench, the books and achievements.
- Menu shadows are see-through, the lines under notices and achievements are darker and larger, and achievement names are bold.
- The farm shed wears a barn roof, so it no longer looks like the quarry shed or the bench; the farm's flag flies from the ridge.
- The deep's stations stand spread evenly under the whole serpent, the first four already spanning it, instead of bunched to one side.
- A language page off settings, on the pause sheet and the title page, lists each language in its own name with the one in use marked, and the title page's foot names the language in use (src/selftest/language.js).
- A feedback page on the pause sheet under settings, off settings on the title page, and under copy save when the game stops, sends your words and, if you tick it, your save (test/feedback.test.mjs).
- On a gamepad, X hands back a queued copy (it was Y, which now does nothing) (src/selftest/pad.js, "X on a card with a copy waiting").
- On a gamepad, every d-pad press goes to the nearest thing in that direction, in the yard, the deep, the boards and the sheets alike (test/pad-reach.test.mjs).
- The focus brackets breathe a cell out and back while they sit still, from rest on each arrival, and the gamepad's fade in and out instead of popping.
- New words on the rescue sheet, the demo's store link and an empty achievements page.
- The board of rescue times is gone: no name box or post on the rescue sheet, no times page, no name on the board in settings.
- A controller plays the whole game: the d-pad hops between the places a click lands on, A does what the click does, and the Steam Deck's back buttons and trackpads come mapped (test/pad.test.mjs).
- On Steam, every in-game achievement is a Steam achievement, and the ones already won are given at launch (test/desk-steam-achievements.test.mjs).
- A Steam build of the full game and of the demo: saves sync through Steam Cloud, and the full game offers to carry on a demo save on its first launch (test/desk-steam.test.mjs).
- On a phone the yard is drawn smaller, 130 cells across at once, so every shield's whole answer fits upright and no scene zooms (test/phone-view.test.mjs).
- Every cutscene holds the yard still and letterboxed: black bands step in, everything but the scene's subjects fades back, the haulers fade out and the attackers freeze until it lets go (test/cutscene-hold.test.mjs).
- Once the pit has drowned, now and then something shows at the abyss's surface and goes back under: a coil's back, a fin of purple spikes, or an eye watching the lip (test/glimpse.test.mjs).
- The pit is a third as long, so it fills and tears open about three times sooner; an old yard holding more than the new hole tears on load and keeps every grain (test/rift-migrate.test.mjs).
- While the rift is torn, the deep's creatures now and then cross the sky behind it, alone or in a shoal, and rarely the serpent passes or looks through (test/riftlife.test.mjs).
- Pods build in a few seconds each, never more than eight, instead of three quarters of a minute.
- The stations in the deep have no counter under them; each fighter stays at the station it first swims to.
- The ram is a tracked crawler that pushes a turning cutter wheel into the rock, throwing curling chips as it bores.
- The dome no longer holds the rescue rock up: the rock sits squashed on its crown for a beat, then bursts into grit that skates down the dome and heaps outside it for the haulers to carry to the hole (test/shield.test.mjs).
- The bench's build tiles show each coin of their price as a line that fills grey as you gather it, the same as the story card's bill (src/selftest/boards.js).
- While the dome bursts the rescue rock, the rest of the crew walk out of the shot so only the two of them are in it, and walk back to work after (test/ending-stage.test.mjs).
- No new rock comes down from the rescue until the whole ending, the drowning of the pit included, is over (test/ending-stage.test.mjs).
- A station's counter is a row of seats between its - and +: a filled pip for each body at work, a pip filling in thirds while one walks over, the specialist slots in a row of their own above (a brim each, grey ones on the outlines of hats not yet worn, and the next body sent takes a spare hat first) and only the seats left over below for plain workers, with a rule between the rows (none when every seat is a hat seat), whatever rows show centered on the - and +, and a click on a bottom pip sets the plain workers (src/selftest/crew.js).
- Every counter in the yard is a sprite over round pips, six a row and three rows with +N under: the hatted beside the plain hands under a body in the station's hat, carters under a carter, forklifts under a forklift, one - and + framing the post level with the first row (src/selftest/crew.js).
- The forklifts' garage stands on the far side of the house, with its own pip a forklift under it (test/forklift.test.mjs, src/selftest/crew.js).
- Every miner and every farmer can wear a blaster or grower hat, not just three (test/hats-gate-machines.test.mjs).
- The drill and the tiller sit greyed on their boards saying "buy 5 blasters to unlock" or "buy 5 growers to unlock" until five are bought (test/hats-gate-machines.test.mjs, src/selftest/boards.js).
- The air filter comes with its first balloon (test/filter-balloon.test.mjs).
- The forklift's load and speed sell only their last four rungs, and the balloon row only its last two, so neither starts out pocket change (test/forklift.test.mjs, test/balloon.test.mjs).
- On the story card each coin's line is its own bar, filling grey as the coins come in (src/selftest/boards.js).
- The apothecary holds three pots, one to a brew; a yard that already has a fourth loses it (test/save-floor.test.mjs).
- The tower's door no longer says "wizards live here", and the story no longer says "ask the wizards how to get down".
- After the snatch the story says "talk to the wizards about what just happened" until you open their board (test/objectives.test.mjs, src/selftest/boards.js).
- The tower's row summons a wizard instead of training one.
- The dome sits first on the tower's board as its goal card, and every goal card's ribbon reads "saving your sqwife" (src/selftest/boards.js, "the tower's dome").
- The saves page draws the slot you are playing inverted, black with white text, in place of greyed out.
- The index: every thing you have met, with a few words on each, on the held sheet's `index` page or the `i` key.
- Shop items no longer show their build time; the coins are the whole price.
- The books show how long the yard has been played, and each save on the saves page shows its own playtime.
- She calls from under a rock while it is being mined, every few seconds, in a few ways: a build of "!", one long "!", a quick burst, a "?" then "!", a sigh of dots (test/sqwife-calls.test.mjs).
- Each save has its own delete, confirmed on its row, in place of the reset progress button.
- A controls page on the settings sheet, in the game and on the landing page, lists the mouse, the keys and the 1 – 9 jump.
- Nobody goes for the muck while a storm is still raining it down; the clear-up starts once the last drop has landed.
- The first muck a storm leaves gets a short scene: a worker walks up to it, asks what it is, pulls a face and shovels it up.
- The barrier card's sign is a swallowtail ribbon that wraps the frame's edge and flaps its free end like the yard's flags (it holds still with motion off) (src/selftest/boards.js, "goal card").
- The next barrier is bought from the story's card -- its bill ticking off coin by coin, then a cancel while it is built -- and no card is pinned in the corner any more.
- Cores are gone: each barrier that falls opens the next place instead -- the props the farm, the net the quarry, the arch the tower -- and the dome is paid without them.
- After the props the story's card sells the farm, after the net the quarry and after the arch the tower, each before the next barrier, and skips a place that is already open; the place is the goal the moment the barrier falls, its bill showing and its buy dimmed until it can be bought.
- A queued shop item's "refund" now reads "cancel".
- Hold the right button to see the crew: the yard fades back, every worker is ringed, the cursor turns into an open hand, and the one under it slows down. Holding the left button as well picks a worker up, for as long as both are held; the right button alone no longer lifts anybody. Hovering no longer stops a worker.
- After the first rock, the one still buried yells for help.
- A tag at the top of the screen counts the muck on the ground, and another the poop, each going away once the last of it is swept.
- An achievement for shaking a worker dizzy.
- A card at the top left says the story's next step, from digging out the rock to saving the sqwife; it is as wide as its words up to a set width, with the barrier's picture in a column of its own and its bill and buy beside its coins.
- The first step carries a checklist under it: mine the boulder, grab a pebble, toss it into the pit.
- The pictures over a station of what it is building, what is in line and what it has finished drift gently, the way a lifted shop tile does.
- The props can be built after the first rock.

- Dust going into the pit is heard again once the pit has torn open, and the first click on the rock is heard too (test/sound-events.test.mjs, "a torn pit is heard taking the dust").
- The decimal point in counts has room around it, so 86.1k no longer reads as 861k (test/serpent-numbers.test.mjs).
- The index reads as short descriptions in one list with no headings, and the clouds, rain, lightning, objective, rescue, cutscene and sqhusband entries are gone (test/index.test.mjs).
- On a narrow window the game opens looking at the rock again, so the bigger rocks to come are not cut off at the right edge (src/selftest/view.js, "the opening view is looking at the rock").
- With the conveyor belt running, a left click anywhere no longer puts a free handful of pebbles in your hand (src/selftest/dust.js, "a click on open sky over the belt's yard catches nothing"; test/belt-head.test.mjs).
- In every cutscene the black bars frame what the scene is about instead of covering it, and notices and the corner buttons wait off the bars until the scene is over (test/letterbox-framing-desk.test.mjs).
- A notice is always drawn on top, over a tall house or any building, instead of being pushed sideways out of the window (src/selftest/touch.js, "a notice is drawn over a building that reaches into the sky").
- A rockhand on the hill no longer walks off and sinks into the ground when the serpent falls (test/freed-rockhand.test.mjs).
- A worker caught mid-swing or mid-sway at ground level counts as up in the yard, so it still steps out from under a falling rock and still goes for the muck (test/hole-depth.test.mjs).
- A yard already past the serpent retires the sqhusband along with her, instead of leaving him on the crew (test/finale.test.mjs).
- With several things being built at once, finishing one no longer pulls a builder off another site and walks a different one across the yard to take its place (test/build-throughput.test.mjs).
- The store links on the demo's and teaser's last sheets are drawn as buttons like "keep playing", no longer a blue underlined link (src/selftest/ending.js, "the store links ... drawn as the sheet buttons").
- On a gamepad the d-pad gets from the serpent to the portal and up to the corner buttons, and down from the corner back to the yard (test/pad-reach.test.mjs; src/selftest/pad.js, "the serpent is up from a station").
- The rift's tearing and the pit's drowning wait for the camera to arrive before they happen, and a long pan to them is slower, no longer a whip across the yard (test/pit-arc.test.mjs).
- A shield's rock waits in the sky until the camera has finished gliding to the shield (test/cutscene.test.mjs).
- In Japanese and Korean the shield card's cancel button no longer sits on its sentence, and in German, French, Portuguese and Russian a queued card's cancel and "another" no longer run into each other and off the card (src/selftest/boardwords.js, "board words never overlap, in every language").
- The deep's fifth, sixth and seventh party stations have their own names instead of all three reading "a undefined station" (src/selftest/stations.js, "every board says whose it is").
- No bracketed note stands in for words anywhere in the game: the language and feedback pages, the controller rows, the serpent's achievements, the books and the demo carry-over all say plain words, and the feedback form's small print is the sheet's size (test/l10n.test.mjs, "no message is a placeholder").
- Putting the rescue's sheet down with the pit not yet torn gets the crew's dance again, before the hole tears (test/dance-once.test.mjs).
- A balloon that was up when the game was reloaded comes back among the clouds instead of back at its post (test/balloon.test.mjs).
- A quarrier saved digging against the cut's near wall comes back on the cut's floor, not stood up on the bank (test/cut-station.test.mjs).
- A quarrier's swing no longer takes the same column twice and leaves the one under its pick standing a course above its neighbors (test/cut-pockets.test.mjs).
- Saving the sqwife before the pit drowned no longer leaves it solid: once her sheet is put down the hole tears, swells and drowns on its own (test/abyss-after-rescue.test.mjs).
- An idle hauler stood beside the rock no longer drifts up its flank and hangs in the air there (test/haul-belt.test.mjs).
- A fully lamped quarry gang no longer leaves a strip of the cut standing courses above the floor around it (test/cut-pockets.test.mjs).
- Two haulers no longer walk to the same pebble: the nearer one takes it and the other picks another (test/hauler-claims.test.mjs).
- A hauler with room in its hands picks up the pebbles near it, behind it too, before walking to the hole (test/hauler-claims.test.mjs).
- On a phone a save's delete stays inside its row as a ✕ and no longer wraps onto a line of its own (src/selftest/settings.js).
- The saves page keeps each save's rock, crew and time in their own columns with a gap between, instead of running them together (src/selftest/settings.js).
- A save that has already had a muck storm no longer gets the first muck's scene (test/save-floor.test.mjs).
- The story's card shows a shield's own line once: the shop's description of it is dropped, and kept only where a step has no line of its own (src/selftest/boards.js).
- On a phone a notice stands under the story's card instead of on top of it (src/selftest/touch.js).
- The story's card no longer stays faded out after a new game or a loaded save puts the story back on the step it was showing (src/selftest/boards.js).
- The cards and buttons around the edges of the screen stand the same distance in, are padded alike, and all cast the same shadow as the story's card, the counter included (src/selftest/touch.js).
- A card being built with nobody at it yet, a hand still walking over, wears the queued edge, and its refund and another keep their border (src/selftest/queue.js).
- Cards on a shelf stand a gap apart, so two queued cards no longer touch borders (src/selftest/boards.js).
- The queue of builds sits under the story's card in the top-left corner instead of on top of it (src/selftest/queue.js).
- "It never rains but it pours" is earned when a shower of muck has finished falling, not when the clouds start to gather, and never for clean rain (test/notices.test.mjs).
- Starting a new game no longer leaves the old crew's dust on the new ground (test/new-game.test.mjs).
- A Hasted or Inspired fighter keeps its buff through a reload (test/classes.test.mjs).
- Houses bought several at once each show their own progress bar, instead of an empty one covering the house being built (test/queue-repeats.test.mjs).
- A queued card's refund and another keep a solid edge instead of the card's dashed one (`node tools/look.mjs queue`).
- A board no longer opens with its title bar under the notice card at the top of the window, when it fits below the card (`node tools/look.mjs recruit-board`).
- On a phone, a flick or a long drag down from a sheet at full height closes it instead of stopping at the short height (src/selftest/sheet.js).
- The ticked glyph over a station after a rung lands wears that rung's color, not the next rung's (test/landed-unread.test.mjs).
- After a refresh mid-build, the building's shop tile no longer sprays chips over its picture every frame, and the builder rests between bursts again (test/build-reload.test.mjs).
- Workers mining the rock put up a third of the dust motes they did, and the motes thin out gradually instead of vanishing at the end (test/wave7-sky.test.mjs).
- The cancel on a queued barrier is a small button instead of a bar across the whole card, and it no longer covers the description (src/selftest/boards.js).
- Hovering a queued barrier keeps its description instead of fading it out (src/selftest/boards.js).
- The shack stands clear of the barriers: the arch and the dome no longer run into it, with bare ground left between (test/shield-fit.test.mjs).
- A worker on its way to the rock when it comes off dances at the edge of the drop instead of treading on the spot there until the next rock lands (test/dance.test.mjs).
- After a refresh, a carter halfway through gathering a heap finishes filling its hands instead of heading home with half a load (test/heap-fringe.test.mjs).
- The ram's strike rungs queue over the shack, not over the boulder (test/shack.test.mjs).
- The sqwife is always drawn behind the rock, showing wherever its cells are mined away, instead of popping in once the rock is gone (test/lodged.test.mjs).
- The garage and the house stand far enough apart that their counters never touch, and a counter hugs its pips with the + staying under the pointer while you press it (test/counter-gap.test.mjs).
- The muck and poop tags over the yard always show as many cells as lie on the ground, never one off while it rains or the crew sweep (test/mess-tags.test.mjs).
- A cutscene's black bands are deep enough to read as a film's, and in the deep a pale rule edges each so they show against the water (test/cutscene-hold.test.mjs).
- During a cutscene the counter, the station counters, the pile-full warnings and the "build the bench" call fade out with the yard and fade back after (test/cutscene-hold.test.mjs).
- The first trip down no longer jumps the picture up as its scene starts (`node tools/look.mjs abyss-intro`).
- The net no longer hangs through the ground once the rock has ridden it down (the `net>` scene, run through).
- The Windows app offers cloud saves like the Mac and Linux ones instead of shipping without them (test/release-workflow.test.mjs).
- The saves page's rows, the volume slider and the controls list span the pause sheet's and the title page's full width, as the buttons under them do, instead of stopping short of them (src/selftest/sheetwidth.js).

## v0.5.2 — 2026-09-28

- On the landing page, cloud saves are on the saves page with your slots, as they are in the game, instead of under settings (src/selftest/cloud.js).

## v0.5.1 — 2026-09-28

- The landing page's menu stands on a card of its own, so the clouds no longer drift through the name and the lines between its buttons (`GAME=.../index.html node tools/headless.mjs --shot`).

## v0.5.0 — 2026-09-28

**New this release**
- The cloud's buttons and what they answer sit in their own titled cloud saves box, and its stop button says stop cloud saves (src/selftest/cloud.js).
- On a phone the corner's gear is a pause button, and it opens the paused menu rather than the settings (src/selftest/touch.js).
- Raindrops kick up a little crown where they land (`node tools/look.mjs rain`).
- Cloud saves, if you want them: turn them on in settings and your three save slots are kept in the cloud and brought back on any device you link with a six-character code (test/cloud-sync.test.mjs).
- Roombas for the janitor's closet, up to three: they drive out to the poop and the rain's muck on the open yard and bring it home for the one janitor minding them to tip away, and they smoke (test/roomba.test.mjs).
- A card pressed again queues another of the same -- the next rung, the next house -- paid on the press at its own price; a strip along the card's foot splits into a refund of the newest one still waiting and a button for another, the only presses on the card while it is up, and the card's pips dot every rung paid for and not yet landed; the queue card shows a run as one line with its count (test/queue-repeats.test.mjs, src/selftest/boards.js).
- Save a copy, load a save and reset progress are on the saves page now, and loading a yard turns the sheet back to the front (src/selftest/settings.js).

- On the landing page, copy a save and load a save are as wide as the buttons around them, and so are the volume slider and the achievements list (src/selftest/settings.js).
- Firefox no longer drops the whole game, yard and deep alike, to about 20 frames a second after a reload in the deep with its crew at rest or a builder at work, and the endgame yard with the rift open draws in a fifth of the time it did there (Firefox at 2560x1440, reloaded into `deep-rest` then `yard`, PERF.md "Firefox after a reload").
- Clouds no longer show below the ground line in a short window (play.html in a window 300px tall).
- A rockhand who shoveled a mess on the far side of the pit walks back round the hole to the rock, instead of walking home across thin air (test/rockhand-home.test.mjs).
- A worker you pick up no longer vanishes when carried down over the drowned pit or up past the deep's ceiling (src/selftest/crew.js).
- The pause menu dims the yard behind it instead of washing it white, so the dark pit no longer glares (`node tools/look.mjs portal`, then escape).
- A card with rungs queued ahead draws the one being built in its own band's ink, not the red of the last rung queued (`node tools/look.mjs queuetop`).

## v0.4.1 — 2026-09-23

- Balloon riders get the apothecary's tonics: the balloon comes down to its post for the vial and goes back up, and the brew's plume rises off the basket in the sky (test/balloon.test.mjs).

## v0.4.0 — 2026-09-23

**New this release**
- Weather: rain comes on its own clock and carries down a share of the smoke as acid; a storm washes the sky clean (test/weather.test.mjs, test/wave6-sky.test.mjs).
- The sky is three sheets of cumulus that fill with smoke and brown as the yard dirties; rain falls from them in three sheets of its own (test/sky-air.test.mjs, test/sky-rain.test.mjs).
- A working machine smokes off its stack, and hand work fouls the air a little (test/machines.test.mjs, test/sky-air.test.mjs).
- Balloons do the cleaning: each rides from cloud to cloud drawing the muck down, with balloon power and balloon speed ladders (test/balloon.test.mjs, test/sky-fan.test.mjs).
- The air filter is a louvered shed; its gauge reads the sky, and its hover says clean, dirty or filthy and which way (src/selftest/sky.js).
- The sphere: the tower's machine, dropping sparks without using up the star; the tower trains three wizards (test/sphere.test.mjs).
- Forklifts drive themselves to the pit, park in a garage when idle, and have load and speed ladders (test/forklift.test.mjs).
- The belt ends in a ramp that flings its load over the hole, and haulers tip onto it just past the rock (test/haul-belt.test.mjs).
- Machine tuning is a three-rung ladder with pips and an end: ram strike, drill bite, tiller pace (test/machine-tune.test.mjs).
- The drill and the tiller go on sale once their station's ladders and hats are bought (test/machines.test.mjs).
- The books board keeps just the income rates, averaged over a window you pick (test/wave5-boards.test.mjs, test/books-sheets.test.mjs).
- The crew list opens in a window mid-screen (src/selftest/house.js).
- A crew switch in the corner shows, fades or hides the workers (src/selftest/touch.js).
- Idle workers go indoors after a few seconds (test/home-pace.test.mjs).
- Every station's counter stands centered under its building (src/scenes.js `liftroster`).
- Hold to toss, throw pace, throw reach and the gauge have their own pictures (test/row-glyphs.test.mjs).

- The chips off a builder's hammer on a shop tile fly at the yard's pace, pinned or sped up (src/selftest/boards.js, "a hand on a tile being built").
- A late yard runs about a quarter faster (test/belt-load.test.mjs, src/scenes.js `everything`).
- A storm no longer costs a quarter of the frame rate (test/sky-rain.test.mjs).
- A falling boulder no longer drags the frame rate (src/scenes.js `introfall`).
- The title screen no longer stands blank for four seconds (src/selftest/view.js, "the landing page's picture says when it is up").
- A reload no longer adds three workers to a yard with wizards (test/crew-load.test.mjs).
- A reload keeps a balloon's rider on the job (test/balloon.test.mjs).
- A reload keeps a rock hand's swing and a grain on the belt's scoop where they were (test/save-owners.test.mjs).
- A knocked-off hat stays where it fell across a reload (test/hat-save.test.mjs).
- Bodies climb onto the ram, the drill and a balloon's basket instead of appearing there (test/movers-y.test.mjs).
- Skipping the opening mid-throw carries on from the air (test/movers-y.test.mjs).
- Nobody can be put on a quarry or farm that is not open (test/closed-station.test.mjs).
- Haulers cross the quarry on the bridge instead of climbing down and out for nothing (test/quarry-crossing.test.mjs).
- The rock's spoil clears the boulder onto the belt (test/rock-spoil-belt.test.mjs).
- A hauler's toss up to the belt no longer falls a grain short (test/haul-belt.test.mjs).
- The belt's load lies as a heap, no needles and no cliff (test/belt-load.test.mjs).
- The ram keeps up with the face it is eating (test/machines.test.mjs, "the ram advances into the hill as it eats it").
- The shovelling gang no longer bob on the rock's flank (test/muck-jitter.test.mjs).
- Two shovellers on one spot stand a body apart (test/janitor.test.mjs).
- Dust dropped on full bare ground stays off the neighbor's heap (test/grain-region.test.mjs).
- Scrolling the view no longer changes what happens in the yard (test/camera-sim.test.mjs).
- Wizards rise to the star from their own patches of ground (test/sky-work.test.mjs).
- The filter's and the tower's upgrades are put in by a spare hand (test/spare-hand-builds.test.mjs).
- The janitor's second cap is fitted at the closet (test/built-where-sold.test.mjs).
- A build with nobody free says queued (src/selftest/boards.js).
- The tiller's driver sits behind the column (test/machines.test.mjs).
- The casino pays big stakes without freezing or lag, onto the pile in the hole (test/casino-big-stake.test.mjs).
- The casino's stake pours into its funnel after the apothecary grows (test/casino-moves.test.mjs).
- A refund no longer counts as income (test/wave5-boards.test.mjs, "a bill handed back is not income").
- A reading's note stays put under the pointer (test/hover-gate.test.mjs, "no hover turns a reading's note the page's color").
- A board taller than the window scrolls to its last row (src/selftest/boards.js, "a board taller than the window scrolls to its last row").
- A tile's gain line uses the tile's whole width (src/selftest/boards.js).
- On a half-affordable tile, the coins you have are black and the missing one grey (src/selftest/boards.js).
- A gain's number no longer breaks from its coin (src/selftest/house.js).
- The crew window's cards are wide enough to say where a body is (src/selftest/boards.js).
- The forklift row sits with the haulers (test/boards.test.mjs).
- The balloon row has a pip for each balloon (test/balloon.test.mjs).
- A price's clock is the same ink as its coins, on the dark page too (src/selftest/boards.js, "the clock in a tag is in the same ink as the bill beside it").
- On an iPhone on itch, the yard holds still under a sweeping finger (src/selftest/touch.js, "one finger on the yard scrolls it").
- Clouds slide with the scroll, keep their height on a resize, and never pop in at the edge (test/weather.test.mjs, "no cloud ever jumps in view while you scroll"; test/sky-air.test.mjs).
- The near clouds ride highest (test/weather.test.mjs, "the nearer the sheet, the higher it rides").
- The sky no longer rearranges itself after load or on a resize (test/weather.test.mjs, "the sky is spread where the camera ends up, not where it started").
- A front's clouds grow out of nothing and thin away in place, a cell at a time (test/weather.test.mjs, "a front's clouds come up out of nothing where they are born"; src/scenes.js `cloudsettle`).
- A new game gets a new sky (test/golden.test.mjs, "the same seed is the same run").
- A storm's acid falls with the rain instead of in a heap at the end (test/wave6-sky.test.mjs, "a storm brews up, pours, and trails off").
- Rain falls over the whole world, as one sheet, and stops at the ground line (test/weather.test.mjs, "it rains on a clean yard"; src/scenes.js `rain`).
- The air reading matches the sky while it rains (test/sky-readout.test.mjs, "what the readout says is what is overhead").

## v0.3.3 — 2026-09-17

- A yard with a torn pit no longer drops to a few frames a second, before and after a reload, once rain has left muck over the hole (test/perf-gate.test.mjs).
- On the dark page a card's clock count, its gain line and the ledger's leaders read in the dark ink instead of black on black (src/selftest/boards.js, "on the dark page every word on a card is lighter than its paper").

## v0.3.2 — 2026-09-17

- On an iPhone playing the itch page, the yard no longer slides under a finger that is sweeping dust (src/selftest/touch.js, "one finger on the yard scrolls it").

## v0.3.1 — 2026-09-17

- On a phone, a finger that lands a little off the dust still sweeps it instead of scrolling the yard (src/selftest/touch.js, "one finger on the yard scrolls it").

## v0.2.5 — 2026-09-17

**New this release**
- The clouds are proper puffy cumulus now, one connected mass each with a scalloped top, and they say what the sky is doing: brown when the yard has dirtied them (heavy at worst, never black) and a cool heavy grey when rain is on the way (src/scenes.js `sky2`, `cloudswell`).
- A tile being built draws its unbuilt part as an outline, the same outline it wears everywhere else, not a dotted ghost.
- A hauler scoops quicker with every rung of its pace ladder, all the way up, so an upgraded hauler is faster at the heap as well as on the walk (test/ladders.test.mjs).
- The barrier is the tower's goal card, and it pins itself into the corner once you open the tower to see it (src/selftest/boards.js, "the dome pins itself").
- The tower has a fifth enchantment, "genetically modify crops": every crop is 25% bigger. It is offered once the farm is open.
- The carter is worked at the bench like any other upgrade, not built out at the lip.
- Hold to toss throws handfuls off the pile the hand is near, from the pile itself, and leaves what is in the hand alone until you flick it.
- Another shovel in the quarry costs shards alone; it no longer asks spores.
- Hold to toss reaches the hole from anywhere on the rock's pile at its first rung (500px, up from 120); the reach ladder is for the stations further off.
- A flag over a board with something on it you have never looked at sends rings off its tip until you do.
- The mark over a station that finished something shows the thing itself, faint, with the same coloured outline its card wears and a tick over it, on a soft glow rather than in a box.
- The work over a station shows the thing itself going up, cell by cell, the way its card does; only a building coming out of the ground keeps the bar, since its own sprite already shows it rising.
- A finished ladder is drawn full: black title, black glyph, a solid `done` tag, and it no longer greys or flickers when you run short of a coin (src/selftest/boards.js, "a finished kit row stays on the board").
- The turned-down corner on a new tile is in its top-left, off the ladder's pips.
- The number notices say their number as digits: 25 rocks, 100k pebbles, a crew of 50.
- The casino is taller and its foot is a tray: a paid hand heaps in it, stands a beat, then flies out of the hatch into the hole on its own; nothing goes on the ground and no pile ever holds up the next drop (test/casino.test.mjs).
- The sign holds the count for a moment after the arm lets go, so the figure settles before it flashes DROP IT.
- A pebble off the pegs goes into its bin at the rim instead of appearing a bin's height over it.
- A reload that lands on the last stretch of a cutscene keeps the view on what the scene was about instead of sliding it half a window (test/cutscene.test.mjs).
- The outhouse comes up at 300 pebbles instead of 900.
- A station builds one thing at a time again, the rest in line behind it; different stations still build alongside each other (test/queue.test.mjs).
- What is in line at a station still stacks over it as outlines above the one going up (the shot: `node tools/look.mjs queue --zoom 2`).
- A finished rung keeps its place in the stack over its station with a tick laid on it, and the next thing going up lifts above it; everything landed since the board was read stays there, in order, until you open the board. The old faint mark in a glow is gone (the shot: `node tools/look.mjs donestack --zoom 2`; test/save-floor.test.mjs).
- A tile waiting in line no longer says "press to hand it back" on hover; its dashed edge and the next tag carry it.
- The colored plume off a body under a tonic hangs in the air a little longer, so a dosed crew reads as dosed from across the yard (the shot: `node tools/look.mjs apothbuff,buffwalk --zoom 4`).
- A tile being built, and the mark over its station, wear the coloured outline of the rung going up round the cells that are up, growing with the fill; a tile in line is the whole outline alone.
- A dark switch on the settings sheet, on the landing page and in the game: the yard in light gray on charcoal, the marks still in their colors, following the system's setting until pressed; the change is a fade through the veil, not a cut (test/settings.test.mjs, `play.html?dark`).
- The steam off a boiling pot rises in front of the buildings, on the crew's plane, and climbs slower.
- The load on the belt is dust like the ground's: it lands in cells, stands on what is under it, slumps to a heap as tall as its slope allows and rides to the head in one piece, instead of every grain lying in the band's one row with gaps between (test/machines.test.mjs, "a load piles on the band").
- Spoil coming down on the side of a tall heap on the belt lands on the heap instead of going through it to the floor for the scoop to lift back up (test/machines.test.mjs, "a tall heap on the band").
- A body dropped on the rock by hand walks to its helmet first and climbs wearing it, instead of standing on the rock bare-headed (test/wave7b-assign.test.mjs).
- Muck a rain leaves on the middle of a wide heap is shovelled up from the foot of the heap, not left lying under it for the rest of the run (test/muck-under-heap.test.mjs).

- The bar over a barrier, net or arch being built hangs above the shield's full height instead of inside the rock (the shots: `node tools/look.mjs 'props~,net~,arch~'`).

- The casino is the pour: hold the arm and pebbles pour from your purse into the funnel, a share of what you own a second; tap the sign to drop them; the bins pay in pebbles, crops, ore and sparks, each falling out of its bin through the foot on to the ground for the crew (test/casino.test.mjs, selftest/casino.js).
- "Hold to toss" on the bench: hold the button on a heap and the hand keeps sweeping it up and throwing each handful at the hole by itself, with a pace ladder and a reach ladder beside it; a heap further off than the reach is thrown that far toward the hole and lies there for the next hold (test/hold-to-toss.test.mjs).
- The belt's tuning ladder is gone: the rung bought nothing you could see, since the belt only ever moves what the ram drops.
- A save from before the first public build (v0.1.1) is no longer read: it is kept aside and offered back as a file from the settings sheet (test/save-floor.test.mjs).
- A ladder waiting on a coin the yard has no source for shows its price, greyed, instead of "needs crops" (test/ladder-chain.test.mjs).
- The phone's settings button is a cog.
- On a phone one finger anywhere on the yard scrolls it, with the phone's own momentum and rubber band; a finger that lands on dust sweeps for its whole length instead (selftest/touch.js, test/camera.test.mjs, tools/fling.mjs).
- Two arrows in the mid sky hop the view to the next station either way, each wearing the glyph of where it goes; on a phone only (test/hop.test.mjs, selftest/touch.js).
- A building goes up in the yard the way it does on its shop tile: a cell at a time, bottom course first and left to right.
- A tap on a row buys it first time, a scroll or a hold does not, and a long press reads its note (test/hover-gate.test.mjs, selftest/touch.js).
- On a phone a board is a sheet from the bottom with a handle: drag it up for the long boards, down to put it away, and the crew list opens inside it (selftest/sheet.js).
- A double tap on a phone never zooms the page (selftest/touch.js).
- The yard fills a phone's whole screen, and installs to the home screen (selftest/touch.js).
- A fullscreen button in the sky's top-right corner, and the same on the settings sheet, wherever the browser can go fullscreen (selftest/touch.js).
- A touch switch on the settings sheet, for a phone the browser does not report as one, or a desk with a touchscreen that should not be (test/settings.test.mjs).
- A gear in the sky's corner on a phone opens the settings as a sheet from the bottom, since there is no escape key to hold the yard with (selftest/touch.js).
- A sheet's rows wear their own scrollbar on a phone, so there is a way to see there is more (selftest/sheet.js).
- A sheet scrolled to its top and pulled further down comes down, the way every phone's sheets do (selftest/sheet.js).
- The casino is a plinko: the stake stands in a hopper on the roof, a handful of it goes down ten rows of pegs into eleven bins that pay into a tray, and the tray banks or goes back up for another drop -- the wheel is gone (test/casino.test.mjs, test/handful.test.mjs).

- Tapping DROP IT moves the pile on the very next frame; there is no longer a quarter second of nothing after the tap (test/casino.test.mjs).
- The muck on the ground comes back under the same buildings when the yard changes width on a load, instead of standing under the wrong ones and losing its far end (test/wave5-yard.test.mjs, test/sky-fan.test.mjs).
- A save from before the pour loads with its stake still in the funnel, and a pot it had won or staked in another coin is paid out of the foot instead of lost (test/save-floor.test.mjs, test/reload.test.mjs).
- An empty bin no longer inverts its foot or sounds when the bins pay: only the bins with a pebble in them come up (test/casino.test.mjs).
- Every grain staked into the casino's hopper goes down the board: the funnel holds the handful that falls, and none of it lifts off and vanishes when you let go (test/casino.test.mjs).
- The first haulers carry two grains and walk quicker, the gang swings slower to begin with, and a crit is worth 2x at the foot of its ladder instead of 3x, so a couple of diggers want a couple of haulers rather than eight; your own strength and swing ladders climb in smaller steps at the start (config/rungs.js).
- The pinned card stands under the gear and the fullscreen button instead of over them (src/selftest/touch.js).
- The opening can be skipped on a phone: the skip hint is a button, held (selftest/touch.js).
- The rung pips on a board stand apart on a phone instead of stacking on each other (selftest/sheet.js).
- A board comes down when its station is scrolled off the window, on every board and not only the bench's (selftest/touch.js).
- The hop arrows are thumb-sized, and on a phone held sideways they stand in the middle of the sky rather than on the ground line (selftest/touch.js).
- A scroll of a sheet's rows that lifts the finger over the yard leaves the sheet up, instead of shutting it as a tap outside (selftest/sheet.js, tools/sheetpull.mjs).
- A sheet dragged between its stops follows the finger without stutter, and the platform no longer takes the drag off the handle halfway (selftest/sheet.js, tools/sheetpull.mjs).
- The settings sheet on a phone is a sheet like the boards': the same handle, the same stops, it comes up from below the foot the way a board does instead of flying in from mid-screen, and it slides off the foot when pulled down instead of fading (selftest/sheet.js).
- The settings rows on a phone keep the desk's spacing instead of touching (selftest/sheet.js).
- Pulling a sheet's rows down is two gestures, as on every phone: a scroll that reaches the top stops there, and only a new touch from the top pulls the sheet (selftest/sheet.js).
- The coins along a sheet's top edge keep their places when a count grows or loses a digit, on the desk and the phone alike (selftest/sheet.js).
- A notice's card slides beside a building that reaches the top of the window instead of over it, which a tall settlement on a phone held sideways did (selftest/touch.js).

- A body with nothing to do gets going and slows down when it strolls, instead of going from stood still to full pace in one frame and stopping as dead (test/amble.test.mjs).
- The haulers keep working while the next rock comes down: a body that has stepped out of the footprint gets on with what is on its own side of it, and only one with a load bound for the far side waits at the line (test/haulers-through-the-fall.test.mjs).
- On a phone held upright a shield's answer is watched whole, and the two of them stay in the picture on the walk out of the house, instead of the arch's feet and the second of the pair standing off the edge of the screen (test/phone-view.test.mjs).
- Sending a body to a spot over the mouth of the hole walks it to the lip instead of crashing the yard (test/route.test.mjs).
- A crit on the rock takes the top layer across the columns beside it instead of boring straight down the one it hit; a swing shaves the rock, it does not drill it.
- A storm over a tall rock still in the air no longer crashes the yard when the bolt would have struck inside the rock (test/sky-fan.test.mjs).
- In the opening the one the first rock lands on stays stood there until it lands, instead of showing dug into the ground while the rock is still in the air (test/lodged.test.mjs).
- A refresh keeps every building where you bought it, instead of standing them all in the table's order until the next purchase snapped them back across the yard (test/wave31-order.test.mjs).
- The ram eats the rock from the left, a column at a time, instead of leaving rows and columns of half-eaten cells across the hill (test/machines.test.mjs).

## v0.2.4 — 2026-09-15

- The belt runs on its own from the moment it is bought: no hauler is posted at it, so a hauler arriving at the lip with a load tips it instead of standing there for the rest of the game (test/belt-lip.test.mjs).

## v0.2.3 — 2026-09-15

**New this release**
- The clouds are proper puffy cumulus now, one connected mass each with a scalloped top, and they say what the sky is doing: brown when the yard has dirtied them (heavy at worst, never black) and a cool heavy grey when rain is on the way (src/scenes.js `sky2`, `cloudswell`).

- The haulers spread themselves over the whole yard: each sets off for the resource farthest from where the others are headed, wherever on the ground it lies -- out past the tower included -- fills its hands with whatever is nearest, and comes home taking what it walks over (test/hauler-spread.test.mjs, test/far-ground.test.mjs, test/jobs.test.mjs).
- The shield on offer stands out on the bench: a heavy frame with "the sky" on a plate over it, the name set like a sign (`node tools/look.mjs shieldrow`).

- A hauler stood at a few grains takes all of them, instead of one and leaving the rest for somebody a yard away who had set off for them (test/cluster-trip.test.mjs).
- A hauler with room in hand takes whatever lies nearest, including what a heap has shed past the end of its own pile, instead of stepping over it on the way home (test/heap-fringe.test.mjs).
- A wizard at the top of its breath no longer drops its pouring for a frame every few frames, so two wizards summon twice as fast as one (test/sky-work.test.mjs).
- The hauler standing at the belt's post on the lip of the hole is minding the belt, and its card says so instead of "looking for pebbles" (test/pit-edge-stuck.test.mjs).
- The diggers walk to the last few cells of a rock at the pace they cross the yard, instead of ambling the width of the hill while the next rock waits (test/rock-tail.test.mjs).

## v0.2.2 — 2026-09-15

**New this release**
- The clouds are proper puffy cumulus now, one connected mass each with a scalloped top, and they say what the sky is doing: brown when the yard has dirtied them (heavy at worst, never black) and a cool heavy grey when rain is on the way (src/scenes.js `sky2`, `cloudswell`).

- The apothecary brews three things, one a coin: the hearty stew (crop) is speed, the strong brew (ore) is strength, the bracing tonic (sparks) is crit -- and every trade reads it its own way: a hauler walks faster and carries more, a wizard casts sooner and hits harder, a digger swings sooner and bites deeper. The speed brew and the mana brew are folded in, rungs and stock kept (test/three-brews.test.mjs).
- The "for" list under a pot names every trade whose station stands, staffed or not, and none whose station is not up yet (test/pot-prefer.test.mjs).
- Who a pot's doses go to first is set at the pot, under its brew: "for", a row a job, each with how many are under it -- diggers 2/3; the list stays up while you set it (test/pot-prefer.test.mjs).
- The ladder pips are back on the shelf: a column climbing the right edge of every ladder's tile.
- A tile being built shows it: the drawing fills in from the bottom as the work is done, the tag is a clock to the second, and a tile in line is a ghost with its place.
- A hand on the tile: while somebody is at the site, the builder stands beside the tile's drawing and swings at it, on the yard's own beat, throwing the yard's own chips, and slides in fading up as the body arrives and out again as it leaves.
- A rung that lands while you are looking elsewhere is news: its tile wears the unread corner again until you hover it (test/landed-unread.test.mjs).
- The quarry and farm boards are in two groups: the workers -- the plot or bench, the hat, the machine and its ladder -- under a heading wearing the headcount, and the yield and speed ladders under the ore or the crop.
- The crew hurry between the shacks and the work: a body knocking off, or one put to work out of the door, walks at twice the commute (test/home-pace.test.mjs).
- A quarry, farm or apothecary rung is built at the shed by a spare hand off the dust; nobody leaves the cut, the plots or the pot to do it, and a drill or a keeper keeps going meanwhile (test/wave6-sim.test.mjs, test/drill-upgrade.test.mjs, test/apothecary.test.mjs).

- The hole is never full: haulers and the belt keep carrying to a hole the counter calls full, and the first grain the pile has no room for tears the rift instead of standing the crew down at the lip (test/pit-full.test.mjs).

- The tile being built floats on its plate the whole time, the way a hovered one does, and sits back down when the site stalls (src/selftest/boards.js, "a tile being built fills in").

- A build nobody is at yet says `queued`, and `building` from the moment somebody is on it, rather than `nobody on it` (src/selftest/boards.js, "a board holds its size while a build is running").

- A worker picked up left of the farm and let go there comes down there, instead of jumping to the right of the farm (test/thrown.test.mjs).

- The ladder pips stay on a tile while it is being built (src/selftest/boards.js, "a tile being built fills in").
- The coins on a lifted tile's price glide with the words instead of jittering beside them (no check can see it; hover a tile on the shelf).

- A hat row's pips stand in a column down the tile's edge like every other ladder's, instead of lying flat at the top (src/selftest/boards.js, "a kit row's pips stand in a column").

- A row waiting its turn says `queued`, its tag says `next` (then `2nd`, `3rd`) counted in the line rather than among what the site is building, and hovering it says a press hands it back (src/selftest/boards.js, "a tile being built fills in").

- A tile waiting its turn is drawn as a plan -- the outline only -- and wears a dashed edge round the whole tile, so it no longer looks like a build just started (src/selftest/boards.js, "a tile being built fills in").

- A tile waiting its turn keeps its title under the cursor instead of going white on white (src/shelf.css, the hover rule under "No tile inverts on hover"; no in-page check can force :hover).

- The queue card's clocks read to the second, and a waiting line says its place the way its tile does (src/selftest/boards.js, "a tile being built fills in").

- A tile's title and its price keep clear of the pips down its edge, instead of running under them (src/selftest/boards.js, "nothing on a shelf tile runs under its pips").

- A tile's name that is wider than the slot folds to a second line instead of being cut off with an ellipsis, and the tiles beside it keep level with it (src/selftest/boards.js, "a long name on a shelf tile wraps").

- The breaker's picture is the helmet alone, without the plus in its corner (the shot: `node tools/look.mjs kitshack`).

- On a phone, one finger on the sky or the bare ground drags the view along; a finger on the dust still sweeps it (src/selftest/view.js, "one finger drags the view").

- The frame-cost gate no longer trips on the frame a rockhand clears the last cell off the hill's edge (test/perf-gate.test.mjs).

- A rockhand with no rock to work stands where it is instead of marching off across the yard (test/rock.test.mjs).
- "Another shovel" and "another plot" carry pips like every other ladder, one a bench or a plot, and each one taken out takes a little longer than the last, as the price does (test/place-pips.test.mjs).
- The tower's enchantments wait for the thing they enchant -- a machine, the quarry, the janitor's closet -- instead of standing on the board with the first spark, and each tile says what it is worth (test/spells.test.mjs).
- The mana brew reaches the wizards: a wizard comes down off the ring for its dose, drinks it on the ground, and flies back up with its plume showing (test/mana-brew.test.mjs).
- "Build the quarry" and "discover the tower" wait their turn again: the farm opens the quarry's door and the quarry the tower's, instead of all three arriving with the first core (test/door-chain.test.mjs).

## v0.2.1 — 2026-09-15

**New this release**
- The clouds are proper puffy cumulus now, one connected mass each with a scalloped top, and they say what the sky is doing: brown when the yard has dirtied them (heavy at worst, never black) and a cool heavy grey when rain is on the way (src/scenes.js `sky2`, `cloudswell`).

- Every board is shelves: a section is a plank, an upgrade is a thing standing on it with its name, its gain and one price tag under it. The description is the hover tip.
- Every upgrade has a drawing -- forty-odd of them, borrowed across the boards, with a small badge in the corner saying how: a plus for more of a thing, a chevron for faster, a coin for which stake.
- The pinned row in the corner is the same tile it is on its board, on a patch of the shelf's ground, and it stays put under the cursor.
- A door says what the place is for, where a ladder prints its gain.
- The ground is hatched below the line, so the yard reads as cut earth rather than blank paper.

## v0.2.0 — 2026-09-15

**New this release**
- The clouds are proper puffy cumulus now, one connected mass each with a scalloped top, and they say what the sky is doing: brown when the yard has dirtied them (heavy at worst, never black) and a cool heavy grey when rain is on the way (src/scenes.js `sky2`, `cloudswell`).

- Every ladder is eight rungs, two a coin: dust, then crops, then ore, then a spark -- one card, the last band red.
- Hold space to skip any scene.
- A clock over the sqwife: how long they have been under, and what the rescue took.
- The crew dance after the first rock and the rescue, and get knocked off their feet when a rock lands.
- The dome comes down after the rescue, every barrier is built to fit its rock, and the next rock is down within a second of the last.
- Every building opens with a spare hand already walking over, and every door carries its note.
- Every check now saves and reloads the game every five seconds while it runs; the "survives a refresh" fixes below are what it found.

**Fixed**

- "hold to mine" says "1 hit/s", the pace it gives, instead of "0 -> 1". (`src/selftest/boards.js`)
- A ladder waiting on crops says "needs crops", the coin it wants, instead of asking for a plot. (`test/ladder-chain.test.mjs`)
- A row with a builder walking over to it says "building", not "on the way": one word for the job from the moment somebody is on it. (`src/selftest/queue.js`)
- The apothecary's two settings read whole again -- "keep brewing" and "give tonics to" on one line each, side by side, with the pot drawn over them -- instead of a cut-off name beside a control folded onto three lines. (`src/selftest/boards.js`)
- The crew list stays out while you cross the row beside the door to reach it. (`src/selftest/house.js`)
- A new building opens with a spare worker already walking over to it, the way the quarry did, instead of standing empty until you staff it. (`test/door-staffs.test.mjs`)
- The farm, the quarry and the apothecary doors carry their line of words under the card like every other door. (`test/door-notes.test.mjs`)
- Casino winnings can be banked over a full hole: the hole gives way and takes them, instead of the row staying dead until you dig. (`test/casino.test.mjs`)
- A stirrer caught by a refresh out on its round keeps the doses in its arms and finishes the round, instead of standing in the yard empty-handed for good. (`test/helpers.mjs`, every group)
- A body stepping on or off the quarry's ladder no longer hops eight cells back, or a course down into the cut, on every refresh. (`test/helpers.mjs`, every group)
- A refresh in the moment between rocks no longer lands the next one without a word from whoever watched it. (`test/rock.test.mjs`)
- A body stopped to gag, or held under the cursor, comes down with the rock the gang are cutting from under it instead of hanging in the air. (`test/scenes-stand-d.test.mjs`)
- A new hand stands on the ground at its station instead of sinking down out of the sky to it. (`test/rock.test.mjs`, `test/cut-pockets.test.mjs`)
- A body stopped at the loo comes down with the ground the gang are cutting from under it, like everybody else. (`test/sky-readout.test.mjs`)
- A tender that steps off its machine's seat comes down to the deck instead of hanging at the seat's height. (`test/sky-readout.test.mjs`)
- A refresh no longer clears the sky: a storm goes on brewing or pouring, the drops already falling land, the smoke still climbing keeps climbing, and the readout still says which part of the works dirtied it. (`test/sky-rain.test.mjs`, `test/wave6-sky.test.mjs`, `test/sky-fan.test.mjs`)
- A refresh under a falling rock no longer lands it at once, and one in the moment between rocks no longer skips the moment. (`test/rock.test.mjs`, `test/shield.test.mjs`)
- A rock caught by the net, the arch or the dome is still caught after a refresh; the net used to stand for good with the rock on the ground under it and the arch was never offered. (`test/shield.test.mjs`)
- A loose core can still be picked up after a refresh. (`test/pit-full.test.mjs`)
- A carter sent for a core walks round the hill rather than through it. (`test/pit-full.test.mjs`)
- A spin caught by a refresh finishes; the stake no longer sits on the table under a wheel that never stops. (`test/casino.test.mjs`)
- The last grains of a banked pot reach the hole across a refresh. (`test/casino.test.mjs`)
- Breaks, knocking off and the loo come round on time across a refresh instead of starting their clocks over. (`test/breaks.test.mjs`, `test/home.test.mjs`)
- A body that had gone indoors is still indoors after a refresh. (`test/home.test.mjs`)
- A wizard caught mid-climb keeps climbing; a balloon rider stays in the basket. (`test/tower.test.mjs`, `test/balloon.test.mjs`)
- A body walking to a new job keeps walking at the commute's pace after a refresh, and one sent for a hat still fetches it. (`test/sky-readout.test.mjs`, `test/kit.test.mjs`)
- A refresh no longer hands every worker and every machine a free swing. (`test/cut-pockets.test.mjs`, `test/drill-upgrade.test.mjs`)
- A farmhand keeps its place along the row across a refresh instead of starting from the first plot. (`test/tidy.test.mjs`)
- A carter's booking in the hole survives a refresh, so it never tips in more than it spoke for. (`test/pit-full.test.mjs`)
- A body claimed to a shed for an upgrade keeps the claim across a refresh. (`test/apothecary.test.mjs`)
- The gang down the cut move with the cut when the yard re-walks, live and on load, instead of being left in the ground beside it. (`test/apothecary.test.mjs`)
- Grains in the air are no longer lost to a refresh. (`test/tidy.test.mjs`)
- The ore notices count every cell the cut has ever given up, across refreshes. (`test/crit.test.mjs`)
- A new game after a load starts with an empty cut ledger. (`test/cut-dust.test.mjs`)
- The crew only dance after the first rock and after the rescue; every other rock they get straight back to work.
- The quarry's ore yield rungs stay bought across a reload.
- A builder stood down the moment its shield stands finished cheers from the ground it is standing on, instead of jumping at the top of the window and vanishing on a refresh. (`test/scenes-stand-e.test.mjs`)
- A rockhand that comes down off the crest for a patch it cannot get a stance on stands on the hill's flank, not in the air over it. (`test/scenes-stand-d.test.mjs`)
- A half-dug cut no longer fills itself back in when the last quarrier climbs out to clear the yard.
- Quarriers down the cut move with it when a new pot shoves the quarry along, instead of being left standing in solid ground.
- A quarrier called away to build an upgrade gives up its column, so the rest of the gang dig it instead of leaving a spike.
- The crew get knocked off their feet for a beat when a rock lands.
- The dome comes down once the rescue is over, so later rocks land without being held.
- Every barrier is built wide enough for the rock that reaches it.
- After the first rock, the next one is down within about a second of the last cell going; the crew run clear instead of standing about.
- Rockhands clear the muck on their own rock instead of following the yard's drift to the far wall.

## v0.1.16 — 2026-09-14

- Quarriers stand on the floor of the cut after a reload instead of a course above it, working the air.
- Quarriers walking the finished floor of the cut walk on it, instead of floating a course above its dips.
- When a cut is finished the gang walks out from the floor, instead of standing up in a line above it and sliding down.

## v0.1.15 — 2026-09-14

- Quarriers no longer climb up and down the ladder for ever after a refresh caught them leaving a finished cut; the ground comes back in and they dig.

## v0.1.14 — 2026-09-14

- Ore comes up from the whole depth of a dig, not only its top layers.
- A shard that falls back into the quarry is picked up and thrown out again, instead of lying there and being buried.
- A quarrier's crit rings whether or not the swing turned up a shard.
- The quarry gives up ore about four times as fast.

## v0.1.13 — 2026-09-14

- The juggler notice needs your hands at the top of their ladder; a one-grain hand no longer earns it.
- The pin on a card is a pushpin in the bottom-right corner, not a ring at the bottom-left.
- The pinned card in the corner is as wide as the card on its board, so its name no longer runs into its pips.
- The machines are heard at a worker's pace instead of hammering, and the ram no longer sounds twice a strike.
- Rain falls at one speed and leans with the wind, instead of dropping straight down and speeding up.
- An achievement landing is hard to miss: the card is black, bigger, rings as it lands and stays longer.
- Under the dome, the rock comes down while the two of them meet, instead of after.
- The end-of-story sheet and the next shield's card wait until a cutscene has let go, instead of landing on top of it.
- A cutscene eases in instead of jumping closer and then panning.
- The net no longer trembles and sheds at full strength from the moment it catches; it strains as it pays out.
- The wizards' beams show while they cast the dome, even with a star still up, and land on the dome's growing edges.
- A wizard called to the dome flies there flat out instead of drifting across the yard for most of a minute.
- The dome's shell grows smoothly as it is poured instead of jumping a ring at a time.

## v0.1.12 — 2026-09-14

- On itch.io the save no longer fails when other games have filled the browser's storage for the site.
- When saving fails, the sheet says whether the browser blocked storage or the site's storage is full, and how full.
- A page that could not write its name beside the save no longer stands aside for a tab that is not there.

## v0.1.11 — 2026-09-14

- A carter sent to a full heap fills its hands there instead of taking one column and filling up from the rock's on the way home.
## v0.1.10 — 2026-09-13

- Quarriers no longer float up out of the cut and wander off across the
  yard after a refresh caught them climbing in; they resume digging.

## v0.1.9 — 2026-09-13

- Quarriers come back from a refresh on the floor of the cut and keep
  digging, instead of on the far bank with a slow walk round to the ladder.
- Quarriers work the cut in pockets on a swing you can see, along a stretch,
  and never dig one column into a slot; a blaster's swing bursts.
- Holding the button on the rock stops while the rock's pile is full.
- A ladder stays on its board, greyed, when its next rung needs plots or a
  quarry the yard does not have yet.
- A janitor stands still between shovel swings and faces the mess.
- Two janitors on the last patch of a mess no longer shove each other about.
- A janitor with a shovel in its hands no longer reads as "on a break".
- A laden carter sweeps home, taking everything it walks over, and never turns round.
- A grain beside a laden carter is that carter's, unless the one that set off for it is nearer.
- A fast carter no longer strides clean over a grain on a slow frame.
- A carter asks the hole again before giving up on a heap.

## v0.1.5 — 2026-09-13

- Tabbing away from the page reset the game. A store with no tab name in it
  was being read as another tab's store; now it is the same game.

## v0.1.4 — 2026-09-13

- The crew list pushed the house board around when it opened. It pops over
  the board now, one card wide, with the door as its own row on top.
- Six house checks that a commit cut by accident are back.
- A grain going into the pit paid no dust. It has its own dust gain now.

## v0.1.3 — 2026-09-12

- A release with butler missing from PATH committed and tagged before it
  failed. The check runs first now, on a clean tree.

## v0.1.2 — 2026-09-12

- A reset left behind fields the save throws away. It puts down everything
  off the `SAVED` declaration now, so the two can not drift apart.
- A card's price showed a count on its way rather than its value.
- The tower's rows said something different from every other board's for a
  build in progress. They say "building" and "in line" like the rest, and a
  waiting row reads "queued up in n".
- An achievement landing was silent. It is said out loud now.
