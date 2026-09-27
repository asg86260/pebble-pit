# Wave: the serpent's class animations (mocks for review)

*Spec, canon for the four tracks. Do not redesign; implement. Where a name
or a number is written, use it. A track that finds an item impossible says
so in its report rather than inventing something else.*

The owner, 2026-09-26: "I want each of these classes to be distinct visually
and have some simple animations for the attacks ... The animations should be
clean, simple, and in the style of the rest of the game. The attacks should
also display their effect on the snake when applied. And buffs on other
attackers as well." And: "debuffs should apply to the whole snake. Not just
the length above the station."

This is a **mock**, not game code: nothing under `src/` is touched. The
bench is `docs/mocks/classes/index.html`, drawn from plain cells through
`docs/mocks/classes/harness.js`. It is reviewed by the owner before any of it
is built into the game (CLAUDE.md, "mock, vote, build").

## What each class is

Read `docs/serpent-classes.md` for all ten classes, their base attacks and
their three branches (keystone at rung 4, capstone A/B at rung 8). The owner
has voted, and these are the calls that apply here:

- **Every serpent status covers the whole snake.** Nothing is per length:
  a Bleed, a Burn, a Mark, Poison, Held, Lit, Exposed and Weakened are each
  drawn over the whole coil. Where `serpent-classes.md` says "a length",
  "the lengths either side" or "spreads to the next length", the mock shows
  the effect on the whole coil (a spread can still *travel* along the body
  as it is applied, then cover all of it).
- **"Charged" is cut as a party status.** A class's own build-up (the
  Martial Artist's charges, the Monk's chi, Iaido's draw) is still drawn,
  but as that class's own meter, not a status that others give or receive.
  Where a branch "charges another fighter", show it as Hasted instead.
- **The Bard does no damage.** Her scenes show only buffs on the other
  fighter and, for Requiem, the Weakened debuff on the serpent.
- The click is always a punch (not shown here).

## The style, in rules

1. **Black and white and the abyss's purple only**, in the deep's tones as
   seen: `GREYS` and `PURPLES` from the harness. No other color, no
   gradient, no glow, no alpha blending, no anti-aliasing. A thing is
   brighter by being drawn on more cells or on a brighter tone, and fades by
   stepping down the tones (`steps()`), never by opacity.
2. **Everything on the P grid**, through the harness's `cell`, `rect`,
   `line`, `ring`. No `arc`, no `lineTo`, no text on the canvas.
3. **The body stays the game's square** (`drawBody`, three cells). A class
   is told apart by its **hat** (on top of the square, as the game's trade
   hats are: a bar with a cell or two of difference, a few cells at most)
   and by what it **holds or throws**. Ten hats, all distinct at a glance,
   none wider than five cells or taller than two above the body.
4. **Nothing teleports.** A thrown thing flies there; a fighter who closes
   in walks or swims there and back. A fighter at the station attacks from
   the station unless the class is melee, in which case it swims up to the
   coil, strikes, and returns (the brawlers today do this).
5. **The magic is the abyss's own**: interference, ripples, rings of cells,
   the purple ramp. Spells are drawn as ripples and runs of cells, not
   sparkles.
6. **Simple.** One clear motion per attack, readable at the game's scale (a
   cell is 6 px). A strike reads in under a second. No screen shake beyond
   the coil's own stun shudder.
7. **Effects stay on the thing they are on.** A serpent status is drawn on
   the coil (on its cells, its edges, or a few cells off its top), a buff on
   the fighter (on or right round the square). A status that stands says so
   for as long as it stands, quietly; it is loud only as it is applied.

## The harness (read it; do not edit it)

`docs/mocks/classes/harness.js` gives every track:

- `P`, `CW`, `CH`, `FLOOR`, `STATION_X`, `BUDDY_X`, `BODY`, `GREYS`,
  `PURPLES`, `WHITE`, `INK`, `hash`, `clamp`, `steps`.
- `cell`, `rect`, `line`, `ring` -- drawing in cells.
- `coilY(cx, t, s)`, `coilTop`, `coilBottom`, `girth(cx)`, `coilCells(t, s,
  fn)`, `COIL_X0`, `COIL_X1`, `BELLY` -- where the coil is, for aiming and
  for laying a status on its cells.
- `burst(g, t, t0, cx, cy, k, id)` and `chip(...)` -- the voted C: every
  blow that lands calls both at the spot it lands, with `k` its size (a
  punch 0.3, a big blow 0.7, a star 1).
- `api.stun(from, len)` -- the voted D: a stunning blow calls it; the
  harness freezes and shudders the coil.
- `registerStatus(key, painter)` and `registerClass(cls)`, and `frame`,
  which draws a pane: the deep, both plinths, the coil, the serpent
  statuses, both bodies and your hat, the fighter buffs, then your scene.

A class:

```js
registerClass({
  key: 'brawler', name: 'Brawler', station: 'altar', group: 'hand',
  look: 'a flat cap; bare fists',          // one line for the card
  hat(g, cx, cy, t) { /* cells over the body at (cx, cy) */ },
  scenes: [
    { name: 'Base', about: 'A heavy punch every 1.2 s.', dur: 4,
      state(t, api) { /* api.stun / api.status / api.buff, from t alone */ },
      draw(g, t, api) { /* the attack; api.me, api.buddy are the bodies */ } },
    { name: 'Pummel', about: '...', dur: 6, state() {}, draw() {} },
    { name: 'Rage', ... }, { name: 'Bruiser', ... },
  ],
});
```

Four scenes a class: **Base, then the three branches** in the order of
`serpent-classes.md`, each showing that branch's **keystone** (the capstones
are not animated). `state(t, api)` must depend only on `t` (the scene loops
and can be restarted), and is where the scene declares what stands:
`api.status('bleeding', 0.6)`, `api.buff('buddy', 'inspired')`,
`api.stun(2.1, 1.5)`. `draw` then draws the attack itself. A scene may set
`body: false` to draw its own fighter (for one that leaves the station).

A status painter:

```js
registerStatus('bleeding', { name: 'Bleeding', on: 'serpent',
  serpent(g, t, s, level) { coilCells(t, s, (cx, cy, edge) => { ... }) } });
registerStatus('inspired', { name: 'Inspired', on: 'fighter',
  fighter(g, t, cx, cy, level) { ... } });
```

## Tracks and ownership

Each track owns **one file**, `docs/mocks/classes/group-<track>.js`, and
nothing else. It may import and call anything in `harness.js`; it must not
edit `harness.js`, `index.html`, or another track's file. If the harness
lacks something, the track works round it inside its own file and says so
in its report.

| track | file | classes | statuses it owns (painters) |
|---|---|---|---|
| **hand** | `group-hand.js` | Brawler, Martial Artist, Monk | `stunned` (a mark over the head while the harness shudders the coil), `exposed` |
| **blade** | `group-blade.js` | Swordsman, Assassin, Ranger | `bleeding`, `marked`, `keen` (fighter) |
| **fire** | `group-fire.js` | Sapper, Mage | `burning`, `lit` |
| **word** | `group-word.js` | Hexer, Bard | `poisoned`, `weakened`, `held`, `inspired` (fighter), `hasted` (fighter) |

A class may **apply** any status (through `api.status` / `api.buff`) and it
is drawn by its owner's painter. While the owners build in parallel, a
status another track owns may not be registered yet; the frame simply skips
it. Do not register another track's status.

Station keys: brawler and martial `altar`; sword and assassin `well`; sapper
and ranger `armory`; hexer and bard `circle`; mage and monk `spire`.
Class keys exactly: `brawler`, `martial`, `sword`, `assassin`, `sapper`,
`ranger`, `hexer`, `bard`, `mage`, `monk`.

## How a track works

1. First command: `git fetch origin 2>/dev/null; git reset --hard class-anims`
   (the spec branch, local), then `git switch -c anims-<track>`.
2. Serve the checkout with the root's vite on your own port (hand 5301,
   blade 5302, fire 5303, word 5304):
   `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <n> --strictPort`,
   run in the background. The bench is
   `http://localhost:<n>/docs/mocks/classes/index.html`.
3. Look at it. Shots with the headless shell:
   `GAME="http://localhost:<n>/docs/mocks/classes/index.html" CDP_PORT=<9300+n-5300> node tools/headless.mjs --shot out.png "<expr>"`
   -- the expression can click a tab and pause. Read your shots yourself;
   iterate against them. Pixels are the ground truth (CLAUDE.md).
4. Commit your one file on `anims-<track>`, with the message ending
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Commit after
   each class**, not only at the end, so an interrupted run loses little.
5. Tear down your server and confirm the port is dead. Never touch 5183 or
   5184. No browser window on the screen: headless only.
6. Run everything in the foreground. No test suites: this is a mock.

## Report

One line per class and per status painter; the hats in one line each (so
the orchestrator can check all ten are distinct); the shot paths; anything
the spec did not say that you had to decide; anything you think is wrong
with it. And the branch and last commit SHA.
