# itch.io page

What goes in each field of the itch project editor. Assets are in this folder.

## Upload

```
bun run build
```

Or `bun run zip`, which does both and writes `../boulder-clicker-web.zip`. By hand: zip the *contents* of `dist/` (so `index.html` is at the root of the zip), upload it, and
tick **This file will be played in the browser**. The build already uses relative paths.

## Basic info

- **Title:** Boulder Clicker
- **Project URL:** boulder-clicker
- **Short description:** A black-and-white pixel clicker about a rock, a hole and the people between them.
- **Classification:** Games
- **Kind of project:** HTML
- **Release status:** In development
- **Pricing:** No payments (or "$0 or donate")

## Embed

- **Viewport:** 1280 × 830. The game needs about 830 of height before the sky, the ground
  and the whole pit fit; anything shorter loses the bottom of the pit.
- **Fullscreen button:** on
- **Mobile friendly:** on (tap mines, drag sweeps, two fingers move the view, tap the bench)
- **Automatically start on page load:** off — the opening is a twenty-second beat and should
  start when the player is looking.

## Details

- **Genre:** Simulation
- **Tags:** clicker, idle, incremental, pixel-art, black-and-white, minimalist, cozy,
  relaxing, sandbox, singleplayer
- **Made with:** JavaScript, Vite
- **Average session:** About an hour
- **Languages:** English
- **Inputs:** Mouse, Touchscreen
- **Accessibility:** a motion switch (full / reduced) and a mute on the pause sheet;
  no timers, no fail state, nothing punishes walking away.

## Cover

`cover.png` — 630 × 500, itch's recommended size. Taken from the game: rock seven with
four crew on it and the spoil bank beside it, roster and HUD hidden.

## Screenshots

- `shot-opening.png` — the opening: two bodies, two hearts, before the rock.
- `shot-crew.png` — the first rock with a crew on it and a hauler at the lip.

Take more from a real playthrough once the yard is built out (the quarry, the farm, the lab,
the star). The scene shots from `tools/look.mjs` are set up for checking drawings and carry
dev clutter.

## Description

Mine a rock. Every pixel you knock off it is one dust. Sweep the dust into the hole.

Spend what is in the hole on hands to do it for you: miners on the rock, haulers on the
ground, and the places that open up out to the left — the quarry, the farm, the lab, the
tower. Where a body works is written under the place it works. Nothing teleports; every body
walks to every job, so the whole yard is cause and effect you can watch.

Every rock has a core buried at its center. Dig down to it and a new rock falls from the sky,
a little bigger than the last. Rocks keep coming. There is no prestige, no reset loop and no
finish line.

Black and white, one canvas, flat shapes. Saves in your browser; the pause sheet has
**save a copy** and **load a save** for moving it elsewhere.

## Notes

- Saves live in localStorage under itch's game origin. Clearing site data clears them; the
  copy/paste save on the pause sheet is the way to keep one.
- Comments: on. Community: comments only (no board).
