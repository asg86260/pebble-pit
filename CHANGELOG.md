# Changelog

Every bug fixed, under the version it shipped in. A fix lands here in the same
commit that fixes it, under **Unreleased**; `npm run release` turns that
heading into the version number and the date, so nobody types a number by hand.

One short line per fix, in the player's words. No account of how it looked
or why it happened -- that belongs in the commit. A release may open with a
**New this release** list, a line a feature, no more; the reasoning behind a
feature lives in DESIGN.md.

## Unreleased

**New this release**
- The rain has depth like the sky does: it falls in three sheets, fine pale flecks far off and long dark strokes close in, sliding past each other as you scroll, with the clouds in front of the far ones (src/scenes.js `raindepth`; test/sky-rain.test.mjs).
- Each machine's tuning is a proper three-rung ladder now -- pips on the card, a written price a rung, and an end you reach -- and the rows are named for what goes up: ram strike, drill bite, tiller pace (test/machine-tune.test.mjs).
- The sky has depth: three sheets of cloud, far to near, each paler, finer-grained and lower the farther it is, and every cloud is its own cumulus -- a spine of big circles with puffs on top, lit from above and shaded like the boulder (src/scenes.js `cloudswell`, `rock`; test/weather.test.mjs).
- The clouds are proper puffy cumulus now, one connected mass each with a scalloped top, and they say what the sky is doing: brown when the yard has dirtied them (heavy at worst, never black) and a cool heavy grey when rain is on the way (src/scenes.js `sky2`, `cloudswell`).
- The sky is the clouds now: the smoke gathers into them so they grow and darken as the yard dirties, the rain falls from their undersides, and hand work fouls a little so a first muck comes early while the yard is still slow to watch (test/sky-air.test.mjs).
- A working machine now visibly dirties the sky instead of leaving it blank until the yard is nearly at the brim (test/weather.test.mjs).
- Rain falls over the whole world at once, not just the part on screen, so scrolling during a storm finds it already raining there rather than a sheet that follows the camera and fills in behind it (test/weather.test.mjs, "a dirty sky shows in the clouds, and its rain falls in the yard").
- A storm no longer dumps a heap of muck in its last moment; the acid comes down in the shape of the rain, a drizzle carrying little and the pour most, and is all down as the shower ends (test/wave6-sky.test.mjs, "a storm brews up, pours, and trails off").
- The clouds pale again after a storm instead of staying black: a storm now washes most of the sky down (test/weather.test.mjs, "dirty rain is a share of the sky").
- A working machine puts up visible smoke off its stack on every beat (src/scenes.js `yard`).
- The drill and the tiller are for sale once the station's two ladders are topped and every hat is bought, like the ram; the last bench and the last furrow no longer stand in the way (test/machines.test.mjs).
- Weather: it rains on its own clock now, clean rain that carries down a share of whatever smoke is overhead as acid among the water; the first storm of a yard comes in the first few minutes with the lightning, and the clouds swell before a front and settle after (test/weather.test.mjs).
- The board of times is switched off for now (`TIMES_ON` in config/times.js): no panel, no page, no post.
- The board of times: every rescue's clock on one board for everybody, best first, with your name typed once -- standing on the title screen the whole time, a page on the held sheet, and the post on the ending sheet (test/times.test.mjs, server/test/times.test.ts).
- When the board cannot be reached, every place it shows says "the board is down right now" instead of going blank, and a rescue posted then is kept and goes up the next time the game is opened (src/selftest/times.js).
- The forklift: a carter's cart with an engine under it, sold a lift at a time on the bench once the carts are a set and both hauling ladders are topped -- four times the load, twice the pace, and it smokes for every laden run (test/forklift.test.mjs).

- The income books hold still: a rate that comes in lumps, like ore or sparks, no longer halves and doubles from one second to the next while nothing in the yard has changed (test/wave5-boards.test.mjs, "a coin that arrives in lumps is read over a longer window than one that streams").
- The tiller's driver rides behind the steering column over the big wheel, not perched on the bonnet in the exhaust (test/machines.test.mjs).
- The clouds no longer hop a cell at a time when the view scrolls; they slide with it (src/scenes.js `cloudswell`, scroll while looking).
- The clouds sit near the top of the sky, the nearest highest and each sheet behind it a little lower, with no near cloud ever hanging below one behind it (test/weather.test.mjs, "the nearer the sheet, the higher it rides").
- Resizing the window no longer sends the clouds flying: they hold their height and come back into the strip in one step instead of a frame at a time (test/sky-air.test.mjs).
- A cloud no longer pops in at the edge of the window while you scroll; the sky's strip is wide enough that a cloud coming round is still off the screen (test/weather.test.mjs, "no cloud ever jumps in view while you scroll").
- The sky no longer rearranges itself a moment after the page comes up, and resizing the window no longer swaps every cloud for a new one or takes the birds out of the air (test/weather.test.mjs, "the sky is spread where the camera ends up, not where it started").
- The rain behind the yard no longer shows through the ground it is supposed to be behind; it stops at the ground line (src/scenes.js `rain`).
- The rain is lighter (src/scenes.js `rain`, `acidrain`).
- A front's clouds thin away in place as it lets go instead of climbing out of the sky (src/scenes.js `cloudsettle`).
- A storm's clouds no longer appear whole in the middle of the sky as it brews; each one comes up out of nothing where it forms (test/weather.test.mjs, "a front's clouds come up out of nothing where they are born").
- A new game starts under a new sky again, rather than keeping the last one's clouds (test/golden.test.mjs, "the same seed is the same run").
- No cell of cloud blinks in or out any more: it comes up out of the page as it fills and goes back down into it as it empties, so a sky swelling or letting go after a shower moves instead of stepping (src/scenes.js `cloudswell`, `cloudsettle`).
- A machine's smoke hangs a little longer off the stack before it thins away (src/scenes.js `yard`).
- The ram keeps up with the face it is eating: a tuned ram no longer falls behind and strikes across a widening gap (test/machines.test.mjs, "the ram advances into the hill as it eats it").
- A working machine's smoke is the brown puffs off its stack and nothing else; the fringed specks that climbed beside them and the black wisps on their own timer are gone, and the dirt shows in the clouds (test/machines.test.mjs, "smoke rises and goes out, and does not pile up").
- The water and the acid come down as one sheet across the whole window, not the water in patches under the clouds and the acid everywhere (src/scenes.js `acidrain`; test/weather.test.mjs, "it rains on a clean yard").
- The air reading no longer runs a hair over the sky while it is raining (test/sky-readout.test.mjs, "what the readout says is what is overhead").
- The clock in a card's price is the same ink as the coins beside it, on the dark page too (src/selftest/boards.js, "the clock in a tag is in the same ink as the bill beside it").
- On an iPhone playing the itch page, the yard stays put under a sweeping finger even when the phone ignores the game's refusal (src/selftest/touch.js, "one finger on the yard scrolls it").
- The load on the belt lies as a heap: no needles standing up out of it under a tuned ram, and no cliff at the tail (test/belt-load.test.mjs).

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
