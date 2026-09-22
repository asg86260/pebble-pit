# Pebble Pit

A black-and-white pixel clicker about a rock, a hole and the people between
them.

**[Play it in the browser](https://cameldash.itch.io/pebble-pit)** ·
[Desktop builds](https://github.com/asg86260/pebble-pit/releases/latest) ·
[What changed](CHANGELOG.md)

<p align="center"><img src="itch/cover.png" alt="Three workers on a half-dug rock, spoil heaped to one side" width="630"></p>

Click the rock. Throw what comes off it into the hole. Hire somebody to do that
for you, then somebody to feed them, then somebody to sweep up after the
machines. Watch the sky get worse. Decide whether to do anything about it.

Free, pay what you want. Plays in the browser, on a phone, or as a desktop
app. No account, no ads, no ending.

---

## What it is

- **A clicker where everything is watchable.** Nothing teleports. Every
  worker walks to every job, every grain of dust you dig is drawn in the pit,
  and buying something lifts the grains back out and flies them to the shop
  that sold it. A station with nobody standing in it does nothing.
- **Black and white, six grays, a six-pixel grid.** Color arrives slowly and
  only where it means something: a shard is blue, a spore is green, the
  machines are red, magic is purple.
- **A crew, not a counter.** Every worker has a name, an age and a record of
  what they have shifted. They take breaks, smoke, sing, swear, talk to each
  other, and dance when a rock comes off. You can pick one up and carry them
  across the yard; they walk back.
- **A sky that pushes back.** Everything you dig puts smog into the air, the
  air gathers into banks, and past a point it rains the lot back on you. The
  air filter is the answer, and it costs a body that could be on the rock;
  its dial reads the sky, and what it takes out comes out of its spout as
  muck to shovel. It never goes permanently clean.
- **Upgrades change what happens.** A new worker, a new machine, a new place
  further out along the ground. Every ladder has an end and tells you where
  you are on it.
- **A story that is also the tech tree.** The rocks keep coming and the yard
  keeps trying to stop one. Each shield fails and opens the next site: the
  farm, the quarry, the tower, and finally a dome that is summoned rather than
  built.
- **No music.** You hear the yard: the swing, the drop, the machines.

<p align="center"><img src="docs/readme/scrubbing.png" alt="The air filter under a sky full of smog" width="800"></p>

## Where to play

| | |
|---|---|
| **Browser** | [itch.io](https://cameldash.itch.io/pebble-pit). The save lives in that browser and autosaves every second. |
| **Phone** | The same itch page. One finger scrolls the yard, a tap buys, boards open as sheets from the bottom. Add it to the home screen to play full screen. |
| **Desktop** | [Windows, mac and linux](https://github.com/asg86260/pebble-pit/releases/latest). The save becomes a file with a backup beside it; `F11` goes full screen. The Windows build is unsigned, so the first launch shows *Windows protected your PC* — *More info → Run anyway*. |

## Things to know

- **Nothing happens while it is closed.** The yard runs while you watch it and
  stops when you don't. It is not a chore you check in on.
- **There is no ending.** Rocks keep coming, each a little bigger than the
  last. There is no fail state, no timer and nothing is taken away. You'll know
  when you're done.
- **Back up your save.** `save a copy` on the pause sheet (`esc`, or the cog on
  a phone) puts it on your clipboard; `load a save` takes it back. Do that
  before clearing site data or changing machines.
- **Click once to start.** Browsers allow no sound and no keys until you do.
  Sound is on and quiet; mute and volume are on the same sheet.

## Controls

| | |
|---|---|
| left click / tap | swing at the rock, buy a row, sweep dust |
| hold right button | pick up a worker, carry, drop |
| `esc` / cog | pause sheet: settings, saves, achievements |
| `F11` | full screen (desktop) |
| scroll / one finger | pan the yard |

## Running it from source

Vite and vanilla ES modules on one canvas, no framework, no runtime
dependencies.

```
bun install
bun run dev        # serves on http://localhost:5183
```

`play.html` is the game, `index.html` the landing page. In a dev build the
backtick key opens a panel with every tunable number, live.

For anyone changing the code: `ARCHITECTURE.md` says which file owns what,
`DESIGN.md` carries the reasoning behind every feature, `TODO.md` is the open
work, and `CLAUDE.md` is the working agreement, including how the tests are
run. `bun run release -- patch` cuts a version; the tag builds every platform
on GitHub's runners and pushes it to itch.

---

Made by Andrew Graham. Free; the tip jar is on itch.
