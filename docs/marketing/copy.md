# Pebble Pit 1.0: page copy

**Everything below is DRAFT for the owner to edit.** It is marketing copy,
not in-game text; nothing here goes into the game. Every claim is meant to
be true of the build today and stays inside the opening premise -- the
sources are listed at the bottom so each line can be checked or cut.

Mocks that use this copy: `page-a.html` (itch, play first), `page-b.html`
(Steam-style capsule), `page-c.html` (letterpress).

---

## Taglines (DRAFT -- pick one)

1. A rock. A hole. A few people between them.
2. Somebody is under the rock. Start digging.
3. A clicker where you can watch every number happen.

(1 is the line already on the README and the itch page; 2 is the premise;
3 is the pitch.)

## itch "short description" field (DRAFT, under 100 characters)

> Dig a rock into a hole, then hire a crew to do it in plain sight. Black and white.

(82 characters.)

## Short description (DRAFT, 76 words)

> A boulder falls on your sqwife, and you start digging. Every pixel you
> knock off the rock is a grain of dust, and every grain has to be carried
> to the pit. Spend it on a crew who mine, haul and build where you can see
> them: nobody teleports, and a station with nobody standing in it does
> nothing. Black and white, on a six-pixel grid, with no music -- only the
> sound of the yard.

## Feature bullets (DRAFT, each checkable)

- **Nothing teleports.** Every worker walks to every job and carries what
  it moves; a station with nobody standing in it does nothing.
- **A crew of people, not a counter.** Each worker has a name, an age and a
  record of what they have shifted.
- **Pick them up.** Lift a worker and drop them across the yard; they walk
  back to work.
- **They take breaks.** Idle workers smoke, sing and talk to each other --
  only when there is nothing to do, so the work never waits on it.
- **Black and white, six grays, a six-pixel grid.** A light page and a dark
  one, and a reduced-motion switch.
- **No fail state, no offline progress.** The yard runs while you watch it
  and stops when you close it. It autosaves every second, and a save can be
  copied out and loaded back.

## Platforms (DRAFT)

Browser (on itch, including phones) - Windows - macOS - Linux.
Price: **[PRICE -- owner to set]**.

## 1.0 announcement post (DRAFT, 136 words with the title)

> **Pebble Pit 1.0**
>
> Pebble Pit is out of development and at 1.0.
>
> It is a black-and-white clicker. A boulder lands on your sqwife and you
> dig. What comes off the rock is dust; the dust goes in the pit; the pit
> pays for a crew. Then the crew digs, hauls and builds while you decide
> who goes where.
>
> Nothing in the yard teleports. Every worker walks to every job, every
> grain is carried, and a station with nobody in it does nothing. Each
> worker has a name. You can pick them up.
>
> It plays in the browser, on a phone, and as a desktop app for Windows,
> macOS and Linux. Your save stays on your machine and can be copied out.
>
> [PRICE LINE -- owner to set]. The full list of changes is in the
> changelog.

## Social post (DRAFT, about 220 characters with the link placeholder)

> Pebble Pit is 1.0. A black-and-white clicker: a boulder lands on your
> sqwife, you dig, and the dust pays for a crew who mine, haul and build in
> plain sight. Nobody teleports. Browser, phone, Windows, macOS, Linux.
> [link]

---

## Media slots (all from the opening and the early yard)

| slot | shows | exists? |
|---|---|---|
| hero GIF | the opening dig: the first body swinging at the rock, carrying two grains the length of the yard and tipping them into the hole | no -- capture with `pebble-capture` |
| still 1 | the two squares on the bare ground with a heart, before the rock | `itch/shot-opening.png` |
| still 2 | a crew on the first rock, a hauler at the lip of the pit | `itch/shot-crew.png` |
| still 3 | the bench board open, a ladder card or two mid-climb | no |
| still 4 | the farm with its plots tended | no |
| still 5 | a break: two workers talking in dots, one smoking | no |
| still 6 | the same yard on the dark page (`play.html?dark`) | no |

Keep the HUD's late counters (sparks, anything purple) out of frame.

---

## Where each claim was checked

| claim | source |
|---|---|
| a boulder falls on the sqwife; you dig | DESIGN.md "The opening"; `src/objectives.js` first line ("dig the boulder to save your sqwife!") |
| a pixel of rock is one dust | DESIGN.md "A site pays for itself" (a pixel of rock is worth exactly one dust) |
| dust is carried to the pit | DESIGN.md "The opening" (the demonstration turn); `src/crew/hauler.js` |
| crew mine, haul, build | `src/crew/rockhand.js`, `hauler.js`, `builders.js`; DESIGN.md "The building site (built)" |
| nobody teleports; empty station does nothing | CLAUDE.md "Nothing teleports"; README "What it is" |
| name, age, record | DESIGN.md "Crew" |
| pick up and drop; they walk back | DESIGN.md "Crew" (the control is now right held + left click, commit 36ea5e9d -- the README's "hold right button" row is stale) |
| breaks: smoke, sing, talk, only when idle | DESIGN.md "Breaks" |
| six grays, six-pixel grid | DESIGN.md "Pillars" 6; CLAUDE.md house style (`P = 6`) |
| dark page, reduced-motion switch | DESIGN.md "Dark mode (built 2026-09-16)"; `src/prefs.js` (`dark`, `motion`) |
| no music | README "What it is"; audio is hits only (`SOUNDS` maps events to sound effects) |
| no fail state | DESIGN.md "Pillars" 2 |
| no offline progress | README "Things to know"; docs/release-readiness.md (no offline accrual) |
| autosaves every second | `src/main.js` (`setInterval(persist, 1000)`) |
| save copied out and loaded back | README "Things to know" (`save a copy` / `load a save`) |
| browser, phone, Windows, macOS, Linux | README "Where to play"; `.github/workflows/release.yml` (linux AppImage, windows, mac dmg, html channel) |
| "out of development and at 1.0" | **not yet true**: package.json is 0.5.2, latest tag v0.5.2. Only post after `npm run release` cuts 1.0. |

## Left out on purpose

- **"No ending."** The README and the old itch copy say it; the current
  build has a story end (`src/catalog.js`, "you saved your sqwife"), so the
  line is no longer true, and saying either is a spoiler.
- Cores, shields, the quarry's and farm's unlock, the sky/smog and the air
  filter, machines and sparks -- mid-to-late systems; the farm only appears
  as a picture slot.
- Play length. DESIGN.md says 90-120 minutes, the itch notes "about an
  hour"; neither is measured.
