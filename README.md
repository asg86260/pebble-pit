# Boulder Clicker

Black-and-white pixel clicker. Vite + vanilla JS, canvas.

- Each boulder is thicker than the last: boulder 2 is two sheets deep, boulder 3 is three, up to six. A hit takes one sheet off the front, so you dig **into** the rock. Shade shows what is left — dark where it is thick, pale where it is worn thin, white where you have gone right through. Dust keeps the shade of the sheet it came off.
- The rock is a **hill sitting on the ground**, left of the workbench: a rough crest, thickest at its base and through the middle. Click it to knock a pixel off at the cursor. Spoil is thrown clear downhill towards the bench, and anything landing on the slope skitters down the face and off the side, so nothing is ever stranded behind the hill or buried under it.
- Drag to sweep: on the ground it lifts dust off the pile, in the air below the rock it catches pixels still falling. Swinging at the rock never collects its own spray. Flick and let go to throw what you are carrying. Anything past the ledge falls into the pit on the right. The pit floor sits on the bottom of the window and the ground never moves. The pit is always the same size; a bigger window is just more sky and more ground either side. Scroll sideways with the wheel or arrow keys to see the whole pit. Scroll with the wheel or arrow keys, shift-wheel or up/down to look along the pit's depth.
- The cursor starts able to carry one pixel; the brush shows FULL when loaded.
- The shop is a **workbench** standing on the ground between the rock and the pit. Move the cursor near it and its board opens; move away and it closes. There is nothing to click — the ground around it sweeps like anywhere else. Rows are grouped by who the upgrade is for (you / haulers / miners), with core costs marked ◆.
- Spend pit dust there on: carry capacity, unlocking hold-to-mine, your mining speed, hiring workers, and each worker's own speed and load.
- The hole is both the goal (one million) and the money: buying an upgrade lifts dust back out of it, and you watch it fly across to the bench. Spend to get there faster, or hoard and wait.
- Dust heaped against the ledge four cells deep topples into the pit by itself.
- Workers are plain squares. **Miners** (hollow centre) climb the hill and work it from the top down: each keeps a stretch of the crest to itself, stands on whatever rock is left there and sinks with it as the rock goes, ambling along to the nearest standing rock when its own stretch is bare. **Drillers** (a bite out of one side) work the flanks, parked at the foot of the hill eating a notch sideways into it. **Workers** (outlined) walk the ground between the rock and the pit, scoop dust, and toss it off the lip. Both start slow and carrying one pixel; their upgrades only appear once you own one.
- Every boulder has a **core** (a white circle) buried at its centre, hidden by the rock until you dig down to it. Strip the rock down to nothing and the core comes loose. It rolls out from the foot of the hill before it settles — the next rock stands where the last one did, so a core left in its shadow would be one you could not pick up — and then a new rock takes its place. Pick the core up by dragging over it and throw it in the pit to bank it — or leave it, and a hauler will fetch it for you — where it joins the pile and gets buried as more dust comes in.
- Nothing about cores is shown until you bank your first one — no counter, no shop rows.
- Cores buy the fundamental unlocks, not numbers: **first miner** (1 core, which hires one for you), **first hauler** (2 cores, likewise), and the **pick**, one more pixel a swing each time (2 cores, then 3, 4...). Everything else — carry, mining speed, hiring and upgrading workers — is bought with dust.
- The pit never fills: at 80% the pile settles and each remaining grain counts for twice as much, so there is always room. If the ground bed ever fills, extra dust rolls into the pit.
- Everything saves to localStorage — boulder damage, ground dust, pit contents, upgrades, crew. Reset with the button under the shop (click twice to confirm), or the `r` key.

```
bun install
bun run dev
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
`__crew(miners, workers, drillers)` hires a crew outright, `__next()` finishes the rock.
