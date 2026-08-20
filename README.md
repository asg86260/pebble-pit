# Boulder Clicker

Black-and-white pixel clicker. Vite + vanilla JS, canvas.

- Each boulder is thicker than the last: boulder 2 is two sheets deep, boulder 3 is three, up to six. A hit takes one sheet off the front, so you dig **into** the rock. Shade shows what is left — dark where it is thick, pale where it is worn thin, white where you have gone right through. Dust keeps the shade of the sheet it came off.
- Click the boulder to knock a pixel off at the cursor. It falls and piles up on the ground as dust (falling-sand physics).
- Drag along the ground to sweep dust onto the cursor, then flick and let go to throw it. Anything past the ledge falls into the pit on the right. The pit is a fixed size that runs well off the right of the window — scroll with the wheel or arrow keys to see along it.
- The cursor starts able to carry one pixel; the brush shows FULL when loaded.
- The shop is a **workbench** standing on the ground to the left. Move the cursor near it and its board opens; click the bench to pin the board open, Escape or walk away to close it. Rows are grouped by who the upgrade is for (you / haulers / miners), with core costs marked ◆.
- Spend pit dust there on: carry capacity, unlocking hold-to-mine, your mining speed, hiring workers, and each worker's own speed and load.
- The hole is both the goal (one million) and the money: buying an upgrade lifts dust back out of it. Spend to get there faster, or hoard and wait.
- Dust heaped against the ledge four cells deep topples into the pit by itself.
- Workers are plain squares: **miners** (hollow centre) orbit the boulder and chip at it, **drillers** (a bite out of one side) park on the thickest rock and bore it out, **haulers** (outlined) walk the ground, scoop dust, and tip it over the ledge. Both start slow and carrying one pixel; their upgrades only appear once you own one.
- Every boulder has a **core** (a white circle) buried at its centre, hidden by the rock until you dig down to it. Strip the rock down to nothing and the core comes loose. It falls and settles on whatever dust is under it, and a new boulder takes its place. Pick the core up by dragging over it and throw it in the pit to bank it — or leave it, and a hauler will fetch it for you — where it joins the pile and gets buried as more dust comes in.
- Nothing about cores is shown until you bank your first one — no counter, no shop rows.
- Cores buy the fundamental unlocks, not numbers: **first hauler** (1 core, which hires one for you), **first miner** (2 cores, likewise), and a **wider pick** that breaks several pixels a hit (3 cores, then 6, 9...). Everything else — carry, mining speed, hiring and upgrading workers — is bought with dust.
- The pit never fills: at 80% the pile settles and each remaining grain counts for twice as much, so there is always room. If the ground bed ever fills, extra dust rolls into the pit.
- Everything saves to localStorage — boulder damage, ground dust, pit contents, upgrades, crew. Reset with the button under the shop (click twice to confirm), or the `r` key.

```
bun install
bun run dev
```

Dev hooks in the console: `__state()` dumps the game state, `__give(n)` adds n dust, `__drop()` releases a core.
