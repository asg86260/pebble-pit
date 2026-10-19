# Wave: act 3 built to the owner's decisions (2026-10-18)

Canon. Do not redesign; implement. Every decision below is an answered card on
the decisions board; every look is a voted mock in `docs/mocks/`. Where a mock
and this page differ, this page wins. Everything stays behind `AFTERLIFE_ON`.
Act 3 is framed at the yard's scale (zoom 1, a cell 6 px, a body 3 cells) --
check every drawing there, light and dark, at about 2000x967 and 800x600.

## Track A -- the camp: stations, hand work in the world, bubbles, building

Owns: `src/render/after/*`, `src/after/place.js`, `src/after/gestures.js`,
`src/render/aftercues.js`, `src/after/bubbles.js`, `src/after/build.js`,
`src/after/grove.js`, `src/after/mill.js`, `src/after/press.js`,
`src/after/bodies.js`, the act-3 drag routing in `src/input.js`.

- **Hand work is in the world.** Retire the floating hand-work card
  (`src/render/aftercard.js` and its LAYERS entry). A drag on a station's moving
  part is work; a plain click on a station calls Track C's
  `openAfterBoard(key)`. Generous grab zones; moving parts big enough to grab.
- **Wide spacing**: about one station width of open floor between neighbors,
  at least 12 cells, derived in `place.js`, never hand-tuned.
- **Grove**: keep today's pine with the trunk 10 cells tall. A saw icon shows
  over a fully grown tree; clicking it enters saw mode for that tree. The saw is
  the one-person enlarged handsaw (saw 3 of `docs/mocks/act3-saw-2026-10-18`)
  with a handle on one side only; drag back and forth, faster cuts faster. A
  stump never moves on its own; when diggable it shows a shovel icon only (no
  plate); drag it up out of the ground. No stump crit.
- **Saw mill**: take 2, "through the beams" (`docs/mocks/act3-sawmill-2026-10-18`).
  Spin the 14-cell flywheel; faster cuts faster, capped.
- **Chipper**: the jaws, plus the slot-machine arm
  (`docs/mocks/act3-chipper-2026-10-18`, "the chosen control"): drag a log from
  the pile into the jaws, pull the arm down and hold it; steady speed while held;
  release springs it back a pose at a time and the jaws stop.
- **Paper mill**: vat and line with all five steps
  (`docs/mocks/act3-papermill-2026-10-18`): mould lifts a wet sheet, pegged wet,
  fades grey to white, sways in held steps, a second worker peels dry sheets to
  the stack. Stir in circles; faster fills sooner. Upgrades: bigger vat (more a
  batch), drying line (a second batch at once).
- **Workshop**: shed with roof A, the clean gable
  (`docs/mocks/act3-workshop-2026-10-18`). 4 nails a sign, 2 taps each (half,
  flush); a miss does nothing; the joiner taps on its own once you stop; a
  carrier takes finished signs to the pile.
- **Press**: unchanged.
- **Pedestal (cloud pillar)**: bubbles at uneven intervals and mixed sizes, the
  big ones still the 5x crit; symbols only inside (!, ?!, a raised fist), never
  words.
- **Unbuilt stations show nothing.** Remove the dashed `ghostBox`. Ordered from
  the shack: members carry 8 loads onto the spot as pile (a), planks and blocks
  (`docs/mocks/act3-unbuilt-2026-10-18`); two stay as builders; each band takes
  two loads as it fades in until the pile is gone.
- **Members who join fade** out of the crowd and count as members; a worker
  bought into a post walks in from the camp's edge.

## Track B -- the sky: God's crowd, God, the sermon

Owns: `src/render/aftercrowd.js`, `src/config/aftercrowd.js`, the act-3 zoom in
`src/view.js`, `src/after/union.js` (speech and warden rules), the sky drawing.

- **Our crowd behind the camp is dropped.** God's crowd fills the whole sky in
  parallax bands (`docs/mocks/act3-skycrowd-2026-10-18`, round 2): thins soul by
  soul and the bands sink and shrink as support rises; slow rolling waves (A);
  rallies spreading from signs and posters through every band (C).
- **God** high in the center, a giant square on a tower throne, crown, robe --
  now with **horns and a harder scowl** (owner, after round 2). He is a light
  source in both themes (raw tones): his glare, halo, rays and the searchlight
  gaze brighten what they touch. Idle: breathing, glancing, drumming fingers,
  straightening the crown. Halo reads faintly as an iris; rays orbit and fade
  with support, gone at the strike.
- **The sermon** is atmosphere: roaring symbol bubbles roll through the crowd.
  Now and then a speech **burns a sign or poster**, warned first by the gaze
  settling on it; it chars away with a fade. Souls are never knocked back.
  **Wardens are dropped.**
- **Tithe line**: bowed carriers with real planks and sheets climb to God; the
  glare swallows the loads; the line thins with support and stops at the strike.
- **Sky**: thin cloud layers between bands, small souls drifting up, no spires,
  no dashed horizon line.
- **Camera**: panning to the right side zooms in toward God.

## Track C -- the boards, coin marks, pacing

Owns: `src/after/rows.js`, `src/config/after.js` (numbers), the board UI for act
3, coin marks. Merge the paused `act3-pacing` branch first (pace harness,
tuned numbers, scales on bills, paper mill second batch) and re-run its checks.

- Export `openAfterBoard(key)` for Track A's plain click. Boards use the yard's
  board sheet with tabs choice A (shelves: POSTS, then UPGRADES).
- **Shack**: one build tab, camp order (saw mill, chipper, paper mill,
  workshop, press); build only; locks stay with their reasons; built stations
  stay listed as built.
- **Grove**: posts woodcutter, hauler; upgrades the axe (moved here), plot,
  faster growth, bigger trees, stump removal.
- **Saw mill**: sawyer; second blade, bigger heap. **Chipper**: feeder; second
  drum, wider spout. **Paper mill**: pulper; bigger vat, drying line.
  **Workshop**: joiner, carrier; second bench, bigger sign. **Press**: printer,
  paster; bigger stack, bigger poster.
- **Pedestal**: agitator posts, no cap; bigger speech (rebel a bubble) only.
- **Crowd**: a status board, nothing to buy -- share won, members, the three
  gates and how close, the next speech.
- **Coin marks** for rebel (a flag), timber (two planks), paper (a sheet), at
  the yard's coin size (`docs/mocks/act3-handwork-ui-2026-10-18`).
- Bills: rebel + the yard's coins in band order + scales from the ore band, per
  the pacing pass.

## Shared

- `config.js`, `render.js`, `hooks.js`, `scenes.js`, `en.ftl`: additive only,
  one block per track under a comment naming the track.
- Every track: targeted test files only, foreground; its own vite on its own
  port, killed after; shots at the yard's scale light and dark compared against
  the voted mock; push incrementally to `act3-build-<track>`.
- Report: deliverables one line each, files, pasted test output, shot paths,
  what you decided that this page did not, and what you think is wrong.
