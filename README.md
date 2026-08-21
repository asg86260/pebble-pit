# Boulder Clicker

Black-and-white pixel clicker. Vite + vanilla JS, canvas.

- Each boulder is thicker than the last: boulder 2 is two sheets deep, boulder 3 is three, up to six. A hit takes one sheet off the front, so you dig **into** the rock. Shade shows what is left — dark where it is thick, pale where it is worn thin, white where you have gone right through. Dust keeps the shade of the sheet it came off.
- The rock is a **hill sitting on the ground**, left of the workbench: a rough crest, thickest at its base and through the middle. Click it to knock a pixel off at the cursor. Spoil is **aimed**, not scattered: each chip goes off whichever side of the rock it was struck from, on the one arc that lands it on clear ground past the foot. The rock keeps a bare apron either side, so the two banks stand off it instead of stacking up its flanks, and they heap up to whatever height the sand finds on its own.
- Drag to sweep: on the ground it lifts dust off the pile, in the air below the rock it catches pixels still falling. Swinging at the rock never collects its own spray. Flick and let go to throw what you are carrying. Anything past the ledge falls into the pit on the right. The pit floor sits on the bottom of the window and the ground never moves. The pit is always the same size; a bigger window is just more sky and more ground either side. Scroll sideways with the wheel or arrow keys to see the whole pit. Scroll with the wheel or arrow keys, shift-wheel or up/down to look along the pit's depth.
- The cursor starts able to carry one pixel; the brush shows FULL when loaded.
- The shop is a **workbench** standing on the ground between the rock and the pit. Move the cursor near it and its board opens; move away and it closes. There is nothing to click — the ground around it sweeps like anywhere else. Rows are grouped by who the upgrade is for (you / haulers / miners), with core costs marked ◆.
- Spend pit dust there on: carry capacity, unlocking hold-to-mine, your mining speed, hiring workers, and each worker's own speed and load.
- The hole is both the goal (one million) and the money: buying an upgrade lifts dust back out of it, and you watch it fly across to the bench. Spend to get there faster, or hoard and wait.
- Dust heaped against the ledge four cells deep topples into the pit by itself.
- Workers are plain squares. **Miners** (hollow centre) climb the hill and take it off in layers: each walks the top layer striking the rock under its feet as it goes, so the crest comes off as a row and the next row is exposed underneath. They turn at the ends of the layer and before walking into a mate, and one that finds itself off the layer climbs back to it rather than boring a shaft. **Drillers** (a bite out of one side) work the flanks, parked at the foot of the hill eating a notch sideways into it. **Workers** (outlined) walk the whole ground, passing in front of the rock to reach either bank, scoop dust, and toss it off the lip. Both start slow and carrying one pixel; their upgrades only appear once you own one.
- Every boulder has a **core** (a white circle) buried at its centre, hidden by the rock until you dig down to it. Strip the rock down to nothing and the core comes loose. It rolls out from the foot of the hill before it settles — the next rock stands where the last one did, so a core left in its shadow would be one you could not pick up — and then a new rock takes its place. Pick the core up by dragging over it and throw it in the pit to bank it — or leave it, and a hauler will fetch it for you — where it joins the pile and gets buried as more dust comes in.
- Nothing about cores is shown until you bank your first one — no counter, no shop rows.
- Cores buy the fundamental unlocks, not numbers: **first miner** (1 core, which hires one for you), **first hauler** (2 cores, likewise), and the **pick**, one more pixel a swing each time (2 cores, then 3, 4...). Everything else — carry, mining speed, hiring and upgrading workers — is bought with dust.
- **The pile in the pit is the dust, not a picture of it.** One grain is one dust, drawn the same size as dust anywhere else, and the pile always shows as much of the hole as will fit in it. The hole holds 27,784 — about a run's worth of mining. Past that the counter keeps going and the pile stays at the brim. If the ground bed ever fills, extra dust rolls into the pit.
- Everything saves to localStorage — boulder damage, ground dust, pit contents, upgrades, crew. Reset with the button under the shop (click twice to confirm), or the `r` key.

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

## Testing

Open the game and run `__test()` in the browser console. It drives the game through the same
hooks the console has and checks the things that have broken before: the canvas covering the
window, the ground pinned to the bottom, the pit's fixed size, the shop board opening at the bench
and sitting above the canvas, mining, throwing, spending, the counter easing, cores banking, and
miners and workers doing their jobs. It resets the save first, so run it on a game you do not mind
losing.

Dev hooks in the console: `__state()` dumps the game state, `__give(n)` adds n dust, `__drop()`
releases a core, `__jump(n)` swaps in rock n, `__pile(x, n)` heaps dust on the ground,
`__crew(miners, workers, drillers)` hires a crew outright, `__next()` finishes the rock,
`__spend(n)` takes n dust back out of the pit.
