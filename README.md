# Boulder Clicker

Black-and-white pixel clicker. Vite + vanilla JS, canvas.

- Each boulder is thicker than the last: boulder 2 is two sheets deep, boulder 3 is three, up to six. A hit takes one sheet off the front, so you dig **into** the rock. Shade shows what is left — dark where it is thick, pale where it is worn thin, white where you have gone right through. Dust keeps the shade of the sheet it came off.
- The rock is a **hill sitting on the ground**, right of the workbench: a rough crest, thickest at its base and through the middle. Click it to knock a pixel off at the cursor. Spoil is **aimed**, not scattered: each chip goes off whichever side of the rock it was struck from, on the one arc that lands it on clear ground past the foot. The rock keeps a bare apron either side, so the two banks stand off it instead of stacking up its flanks, and they heap up to whatever height the sand finds on its own.
- Drag to sweep: on the ground it lifts dust off the pile, in the air below the rock it catches pixels still falling. Swinging at the rock never collects its own spray. Flick and let go to throw what you are carrying. Anything past the ledge falls into the pit on the right. The pit floor sits on the bottom of the window and the ground never moves. The pit is always the same size; a bigger window is just more sky and more ground either side. Scroll sideways with the wheel or arrow keys to see the whole pit. Scroll with the wheel or arrow keys, shift-wheel or up/down to look along the pit's depth.
- The cursor starts able to carry one pixel; the brush shows FULL when loaded.
- **Who works where is written under the place they work**: a count and a less/more under each station, with the badge of the body that does the job. Carrying has a count and no buttons -- it is what a body does when it is on nothing, so it is read, not set.
- The shop is a **workbench** standing on the ground off the rock's left flank, between it and the quarry. Move the cursor near it and its board opens; move away and it closes. There is nothing to click — the ground around it sweeps like anywhere else. Rows are grouped by who the upgrade is for (you / haulers / miners), with core costs marked ◆.
- Spend pit dust there on: carry capacity, unlocking hold-to-mine, your mining speed, hiring workers, and each worker's own speed and load. Where a body works is not bought, so it is not on the bench: that is the roster under each station.
- The hole is both the goal (one million) and the money: buying an upgrade lifts dust back out of it, and you watch it fly across to the bench. Spend to get there faster, or hoard and wait.
- Dust heaped against the ledge four cells deep topples into the pit by itself.
- Workers are **hollow squares** -- every one of them, whatever job it is on. Where somebody is standing says what they are doing: on the rock they take it off in layers, down the quarry they come back with shards, at a bed they bring it on, and on the ground they scoop dust and toss it off the lip. A load rides over the head of whoever is carrying it, drawn grain by grain as whatever each grain is.
- Every boulder has a **core** (a white circle) buried at its centre, hidden by the rock until you dig down to it. Strip the rock down to nothing and the core comes loose. It rolls out from the foot of the hill before it settles — the next rock stands where the last one did, so a core left in its shadow would be one you could not pick up — and then a new rock takes its place. Pick the core up by dragging over it and throw it in the pit to bank it — or leave it, and a hauler will fetch it for you — where it joins the pile and gets buried as more dust comes in.
- Nothing about cores is shown until you bank your first one — no counter, no shop rows.
- Cores buy the fundamental unlocks, not numbers: **first miner** (1 core, which hires one for you), **first hauler** (2 cores, likewise), and the **pick**, one more pixel a swing each time (2 cores, then 3, 4...). Everything else — carry, mining speed, hiring and upgrading workers — is bought with dust.
- **The pile in the pit is the dust, not a picture of it.** One grain is one dust, drawn the same size as dust anywhere else, and the pile always shows as much of the hole as will fit in it. Past the brim the counter keeps going and the pile stays put. If the ground bed ever fills, extra dust rolls into the pit.
- **The air over a place is the colour of what comes out of it**: grey over the yard, the shard's blue over the quarry, the spore's green over the beds -- so the far end of the world says what is out there before you can make out anything standing in it.
- **A piece of research shows as a bar over the lab**, not as a number in a menu: it fills a cell at a time, and it does not move at all while the lab is empty.
- **Four more places open up, out to the left.** The **cave** is a shaft; spelunkers go down it and come back with shards △. The **farm** is a row of beds that only grow while a farmhand is standing at one, and are cut for spores ◇. The **lab** spends both on multipliers — pace, never yield, because a pixel is always worth one dust — and keeps the books: dust, shards and spores a minute. The **meteor** hangs in the sky once the tower calls one down: its grey rind falls as dust and its core is the game's only red, banked as sparks ✚. Nobody on the ground can reach it — a wizard is a hat the tower spends dust, stone and crop making, and it is the one body here whose feet leave the ground. Each is unlocked with cores, and the view glides over to show you what you bought.
- **Rocks never stop coming.** Each is a little bigger than the last until they plateau, and each holds one core. There is no ending and nothing is ever taken away to make you start again.
- Everything saves to localStorage — boulder damage, ground dust, pit contents, upgrades, crew. Reset with the button under the shop (click twice to confirm). The `r` key does it
outright, with nothing to confirm, so it is a dev-build shortcut only.

```
bun install
bun run dev
```

The dev server listens on every interface, so a phone on the same wifi can reach it: use the
**Network** address Vite prints. The port is pinned to 5183 so that address stays the same,
which means starting a second server needs an explicit port (`bun run dev --port 5184`).

On a phone: a tap on the rock mines it, a drag sweeps dust and flicks it, **two fingers drag
the view**, and a **tap on the bench** opens the shop — there is no hovering, so hovering
cannot be how it opens. It draws at the screen's real resolution rather than a capped one,
and a cell is always a whole number of device pixels, which is both what keeps the seams out
and what lets a narrow screen find a scale that fits the whole works on.

## The code

One canvas, twenty small modules, no framework. **ARCHITECTURE.md** says which file owns
what and where a new upgrade, worker, bed of sand or site goes. The short version: modules
own behaviour, `state.js` owns every fact that changes, `config.js` owns every number that
decides how it plays.

```
node tools/unresolved.mjs     # names a module uses but cannot see
```

## While you are working on it

Press **`** for a dev panel: crew by job, currencies, sites, which boulder,
running the clock on, and sliders for the numbers most worth arguing with — the
zoom, the slope of a pile, what a pile holds, every pace in the game. It moves
them while the game runs, because that is how they were found. It is loaded only
by `bun run dev` and a build has none of it in it.

## Testing

```
bun run dev:test    # a second server on 5184, so the game you are playing keeps its save
bun run test        # the whole suite, headless, in another terminal
```

`bun run test` runs the same suite in Chrome's headless shell over the debugging protocol --
nothing to install, and it prints the failures and the console. One expression instead of the
suite: `node tools/headless.mjs "__state().gw"`, and `--shot yard.png "expr"` sets the game up
and takes a picture of it. It talks to 5184 by default; `GAME=http://localhost:5183/` points it
somewhere else, which will reset that origin's save.

Or open the game and run `__test()` in the browser console. It drives the game through the same
hooks the console has and checks the things that have broken before: the canvas covering the
window, the ground pinned to the bottom, the pit's fixed size, the shop board opening at the bench
and sitting above the canvas, mining, throwing, spending, the counter easing, cores banking, and
miners and workers doing their jobs. It resets the save first, so run it on a game you do not mind
losing.

Dev hooks in the console: `__state()` dumps the game state, `__give(n)` adds n dust, `__drop()`
releases a core, `__jump(n)` swaps in rock n, `__pile(x, n)` heaps dust on the ground,
`__crew(miners, workers, spelunkers, farmhands)` hires a crew outright, `__next()` finishes the
rock, `__grant({shards, spores, sparks, cores})` and `__levels({...})` set up a plausible game,
`__lab()` and `__meteor()` open those, `__wizardHat(n)` puts hats on the tower's stand,
`__spend(n)` takes n dust back out of the pit, `__reset()` starts a new game.
