# Pebble Pit

A black-and-white pixel clicker about a rock, a hole and the people between
them.

**[Play it in the browser](https://cameldash.itch.io/pebble-pit)** · [Desktop
builds](https://github.com/asg86260/pebble-pit/releases/latest) · [What
changed](CHANGELOG.md)

<p align="center"><img src="itch/cover.png" alt="Three workers on a half-dug rock, spoil heaped to one side" width="630"></p>

Click the rock. Throw what comes off it into the hole. Hire somebody to do that
for you, then somebody to feed them, then somebody to sweep up after the
machines. Watch the sky get worse. Decide whether to do anything about it.

Black and white, six grays, everything on a six-pixel grid. **Nothing
teleports**: every body walks to every job, every number on a board is a body
you can watch cross the yard, and the whole thing is cause and effect you can
see. There is no music — you hear the yard, not the game.

<p align="center"><img src="docs/readme/scrubbing.png" alt="The scrubbing house under a sky full of smog" width="800"></p>

## Things to know

- **Nothing happens while it's closed.** The yard runs while you watch it and
  stops when you don't. That is on purpose; it is not a chore you check in on.
- **There is no ending.** Rocks keep coming, each a little bigger than the
  last. You'll know when you're done.
- **Your save lives where you play.** In the browser it autosaves every second
  to that browser; `save a copy` on the pause sheet (`esc`) puts it on your
  clipboard and `load a save` takes it back. The desktop build keeps it as a
  file, with a backup beside it.
- **Sound is on, and quiet.** Mute and volume are on the same sheet and
  remember.
- **Click once to start.** Browsers allow no sound and no keys until you do.

### Controls

| | |
|---|---|
| click the rock | knock a pixel off at the cursor |
| drag on the ground | sweep up dust; drag under the rock to catch it falling |
| flick and let go | throw what you are carrying — past the ledge is the pit |
| move near a board | it opens; move away and it closes |
| wheel, `←` `→` | look along the yard |
| `esc` | the pause sheet: settings, save a copy, load a save, the version |
| phone | tap mines, drag sweeps, two fingers pan, tap a board to open it |

### The desktop build

The same game as a Windows app from the
[releases page](https://github.com/asg86260/pebble-pit/releases/latest):
your save becomes a file, the window remembers where you left it, `F11` goes
full screen. It is unsigned, so Windows shows "Windows protected your PC" the
first time — *More info → Run anyway*. Downloading through the itch app skips
that. It is 110 MB for a 300 kB game; the rest is Electron. Sorry about that.

## Running it from source

Vite and vanilla ES modules on one canvas. No framework, no runtime
dependencies.

```sh
bun install
bun run dev          # http://localhost:5183 — pinned, so the phone on the wifi keeps its address
bun run build        # dist/
bun run desk         # the Electron shell over the dev server
```

`index.html` is the landing page; the game itself is `play.html`. In a dev
build, **`` ` ``** (backtick) opens the dev panel: crew by job, every currency,
the clock, sliders for every number worth arguing with, and a button for each
of the hundred-odd scenes in `src/scenes.js`. None of it ships.

### Where things live

| | |
|---|---|
| `ARCHITECTURE.md` | which file owns what, and where a new upgrade, job or station goes |
| `DESIGN.md` | the reasoning behind every feature, marked `(built)` or `(design, not built)` |
| `TODO.md` | open work, each item with its diagnosis and its blocker |
| `CHANGELOG.md` | every bug fixed, in the player's words |
| `PERF.md` | where the frame goes |
| `CLAUDE.md` | the working agreement for anyone — or anything — changing the code |
| `src/` | the game: `config.js` owns every number, `state.js` every fact that changes, modules own behavior |
| `src/render.js` | the `LAYERS` list — painting order as data; its order is the picture |
| `tools/` | the headless shell, the scene shooter, the release script |
| `test/` | the node tier |
| `src/selftest/` | the browser tier |

### Testing

Two tiers. The **node** tier (`test/*.test.mjs`) runs the whole simulation with
no DOM and covers everything about the yard. The **browser** tier
(`src/selftest/`) runs in Chrome's headless shell and covers only what needs a
real pointer, board or canvas.

```sh
bun run test                              # the node tier, ~100 s
bun run dev:test                          # a second server on 5184, so your own save is left alone
node tools/headless.mjs                   # the browser tier, against 5184
node tools/headless.mjs --only <group>    # one group
node tools/headless.mjs "__state().gw"    # one expression, against the live game
```

Most changes here are drawing, and no test can see a drawing. The check for
those is a picture:

```sh
node tools/look.mjs --list                # every scene, by the part of the game it is about
node tools/look.mjs crew,quarry --zoom 4  # set the yard up, run a second, write shots/*.png
```

`cards.html` is the card bench for anything on a board: rows drawn from plain
objects through the real builder and stylesheet, no yard behind them.

### Releasing

```sh
bun run release -- patch                  # or minor, major, 1.2.3; --dry to see without doing
```

One command from a clean `main`: it bumps the version, stamps the `Unreleased`
heading in `CHANGELOG.md`, commits, tags, and pushes. The tag is the trigger —
GitHub Actions builds the browser game and the Windows, mac and Linux apps,
pushes every itch channel, and makes the GitHub release with that version's
changelog as its notes. Nothing is built on the machine that cuts it.

## Credits

Made by Andrew Graham. Free; the tip jar is on itch.
