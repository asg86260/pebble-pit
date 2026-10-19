# Wave shot: one camera, smooth zoom, and the cutscene bench

**This document is canon. Subagents: do not redesign; implement.** The
design is DESIGN.md, "One camera for every cutscene, and a bench to watch
them on", including its sections "Zooming is smooth" and "The owner's calls
(2026-10-18)". Where a name or a number is written here or there, use it. A
track that finds an item impossible says so in its report instead of
building something else.

Read first: CLAUDE.md (the working agreement), ARCHITECTURE.md, that DESIGN.md
section, and the files your track owns.

## Why

The act 3 intro (the house falls, the two of them rise to heaven's tear,
they arrive) is janky:

- the zoom steps from 960 to 1200 world pixels wide in one frame, in a held
  shot, as the view lands in the afterlife (`frameOn` → `setZoom(placeZoom('after'))`, view.js);
- the camera lands in empty sky under heaven's cloud floor and climbs with
  the pair for about ten seconds, because the act-place branch of `clampCam`
  (world.js) has no vertical limit and the shot re-plays on the pair while
  they are still far below the floor;
- the top letterbox band goes missing around the portal opening (cause not
  found by reading; the bench is how it gets caught).

The cause is six cameras, each with its own easing, chase, clamp and zoom.

## Tracks

| track | owns | additive-only | do not touch |
|---|---|---|---|
| **A: the shot and smooth zoom** | `src/shot.js` (new), `src/cutscene.js`, `src/actbeats.js`, `src/view.js`, `src/world.js`, `src/ghosts.js`, `src/render.js`, `src/input.js`, `src/crew/pointer.js`, `src/config/cutscene.js`, `test/shot.test.mjs` (new), `test/zoom-glide.test.mjs` (new) | `src/state.js` (the `S.zoomShow` field, in `EPHEMERAL`), `src/hooks.js` (one block at the end, `// wave shot, track A`), `src/scenes.js`, `CHANGELOG.md` | `cutscenes.html`, `src/cutbench/`, `vite.config.js` |
| **B: the cutscene bench** | `cutscenes.html` (new), `src/cutbench/` (new folder), `src/selftest/cutbench.js` (new) | `src/hooks.js` (one block at the end, `// wave shot, track B`), `vite.config.js` (only if a dev page needs registering; dev pages like `scenes.html` are served without it), `src/selftest/index.js` (one import line) | everything track A owns |

A may modify any other file that reads `S.zoom` for a screen-space
conversion (see A3). B calls existing hooks and A's `window.__shot()` (A5);
if `__shot` is missing at run time B falls back to `window.__state()` fields
and says "no shot readout" in the overlay. Neither track waits on the other.

## Track A: the shot and smooth zoom

1. **`src/shot.js`**: the only camera mover while a cutscene holds. A
   cutscene (cutscene.js SCENES rows, shields, and every act beat phase)
   gives `{ frame: () => ({x, y, w, h}), place?, move: 'glide' | 'follow' }`.
   It implements the five rules of the design's "The shot": bands for the
   whole hold; no zoom step in a held frame; one ease-in-out glide in x and y
   together (time from distance: `CUT_PAN_PX_S`, floor `CUT_SETTLE_S`, cap
   `CUT_PAN_MAX_S`); the box fitted between the bands with
   `CUT_FRAME_MARGIN` and clamped to the place's limits; a place change
   frames the far side first. `follow` is a critically damped spring on the
   frame's center with stiffness `CUT_FOLLOW_K` (new, `config/cutscene.js`,
   start at 6, a `TUNABLE` line). There is one easing function, exported
   from shot.js; cutscene.js's local `easeInOut` goes.
2. **Place limits in one table** (`PLACE_LIMITS` in shot.js or world.js:
   per place, the floor's y and the top of its sky, plus x0/x1) read by
   `clampCam`'s branches, so the afterlife can no longer frame empty sky
   under its floor.
3. **Smooth zoom (design: "Zooming is smooth")**:
   - `S.zoomShow` (EPHEMERAL) is the shown zoom; `S.zoom` the drawn zoom,
     always whole, `= snapDown(S.zoomShow)`; `S.viewW`/`S.viewH` from
     `S.zoomShow`.
   - `setZoom(k)` sets a target; the shown zoom eases there over
     `ZOOM_GLIDE_S` (new, `config/cutscene.js`, start at 0.6) about the
     framed point. `setZoomNow(k)` cuts (resize, boot, scenes, reload).
   - render.js: while `S.zoomShow !== S.zoom`, the world layers draw into
     one offscreen canvas at `S.zoom` and that canvas is blitted to the
     screen scaled by `S.zoomShow / S.zoom` with `imageSmoothingEnabled =
     false`. When they are equal, the frame draws as today with no buffer.
   - `toWorld(sx, sy)` / `toScreen(wx, wy)` in world.js read `S.zoomShow`;
     every pointer, touch and hover conversion and every screen-space overlay
     goes through them. grep `S.zoom` in input paths and overlays; fix each
     one that converts screen to world.
   - In a held cutscene frame the zoom does not move; across places it
     changes under the ripple (the owner's call 1).
4. **The act beats on the shot.** Each phase's `at` becomes a `frame` box
   (a body's height around the subject is the minimum; the rise phase's box
   is the pair plus the tear above them). The act 3 intro (`house-fall`,
   `arrive`) must, frame by frame: keep both bands at full height from its
   first frame to its last; change zoom only while `S.viewTo` (the ripple) is
   on; never frame below a place's floor or above its sky; and never show a
   frame with the subject box outside the window for more than one glide.
   If the rise is still long once it is framed right, leave the length
   alone: its shape is a later mock-and-vote.
5. **`window.__shot()`** (hooks.js, your block): `{ place, zoom: S.zoom,
   zoomShow: S.zoomShow, camX, camY, viewW, viewH, frame: {x,y,w,h} | null,
   bands: <band height in world px>, hush: S.hush, beat: <beat key> | null,
   phase: <phase index or name> | null, gliding: bool }`. This is the seam
   track B reads.
6. **Out of scope:** moving the finale, the snatch, the opening and the
   first trip down onto the shot. They keep working as now (with smooth
   zoom where they call `setZoom`, cut where they need a cut); say in your
   report which `setZoom` calls you turned into `setZoomNow`.

**Checks** (node tier, your two new files): the act 3 intro played the
player's way (`act3-start`'s setup, then `__goOn()`), stepped a frame at a
time, asserting item 4's four rules every frame; a zoom glide that never
draws a fractional `S.zoom`, lands exactly on its target, and maps a
pointer at the window's middle to the same world point before and after;
`setZoomNow` cuts. Then run, one file at a time (never a sweep, never the
npm scripts): `test/shot.test.mjs`, `test/zoom-glide.test.mjs`,
`test/cutscene.test.mjs`, `test/cutscene-hold.test.mjs`, `test/beats.test.mjs`,
`test/acts-travel.test.mjs`, `test/acts-travel-story.test.mjs`,
`test/deep-view.test.mjs`, `test/phone-view.test.mjs`,
`test/letterbox-framing-desk.test.mjs`, `test/finale.test.mjs`,
`test/mansion.test.mjs`, and the browser groups touching the pointer:
`node tools/headless.mjs --only input` and `--only touch` against your own
dev server.

**Look:** shoot `house-fall`, `act3-start`, `finale-arrive`, `portal-heaven`
with `tools/look.mjs`, and a frame strip of the act 3 intro (the
pebble-capture skill's GIF method), and read them.

## Track B: the cutscene bench

1. **`cutscenes.html`**, a dev page beside `scenes.html` (copy its frame
   approach: the game in an iframe staged from boot, never the user's save).
   Left: a list of cutscenes with a filter. Middle: the picture. Under it:
   the timeline.
2. **The rows** (`src/cutbench/rows.js`): `{ key, name, setup(), start(),
   done() }` evaluated inside the frame. At least: `act3-intro` (setup the
   `act3-start` scene; start `__goOn()`; done when the `arrive` beat is
   over), `house-fall` alone, `finale` (from `finale-kill`), `snatch`,
   `opening`, `first-trip` (abyss), `tear`, `drown`, `first-muck`, and one
   shield. Use existing scenes and hooks for setup; if a row cannot be stood
   up, list it greyed with the reason.
3. **Record once, scrub freely.** Recording runs the row with
   `__still(true)`, stepping `__fast(0.1)` a frame, capturing each frame (the
   iframe canvas to an ImageBitmap) with `__shot()` read alongside, until
   `done()` or a 120 s cap. The timeline scrubs the kept frames; arrow keys
   step, space plays at real speed, `r` records again. Phase changes (from
   `__shot().phase`/`beat`) are marked and labeled on the timeline.
4. **Play from a phase**: clicking a phase mark re-runs setup and start,
   then fast-forwards (no capture) to that phase, then records from there.
5. **Overlay** (toggle `o`): the frame box, the band edges, the camera
   center's path as a line across the timeline's frames, and a readout of
   place, zoom, zoomShow, camX/camY and beat/phase.
6. **Checks** drawn as red ticks on the timeline, with a hover line naming
   the check: zoom changed while not gliding; the camera center moved more
   than `CUT_PAN_PX_S / 10` px in one 0.1 s frame while not gliding; the
   frame box outside the window; `hush` not 1 or band height under its full
   value while a beat holds.
7. **A browser selftest group** `cutbench` (`src/selftest/cutbench.js`):
   the page loads, lists the rows, records `house-fall` for 2 s, and shows
   frames on the timeline. Run it with
   `GAME=http://localhost:<port>/cutscenes.html node tools/headless.mjs --only cutbench`
   (or adapt the runner flag the way `cards.html` is driven; say which).

**Look:** a headless shot of the bench mid-scrub with the overlay on,
read before reporting.

## Both tracks

- First command, in your worktree: `git fetch origin && git reset --hard origin/wave-shot-spec`.
- A worktree has no `node_modules`: start servers with
  `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <yours> --strictPort`
  (A: 5301, B: 5302; CDP ports 9401 and 9402). Never port 5183 or 5184.
  Confirm it serves your checkout before trusting a run. Kill it when done.
- Run tests in the **foreground**. Never run a full sweep (`npm test`,
  `node --test test/*`); the machine refuses it and so do we.
- Every word a player reads goes in `locales/en.ftl` through `msg()`. The
  bench is a dev page: plain literals are fine there (as in scenes.html).
- Comments say why, in the register of `air.js`; American English; no magic
  numbers in modules (config.js owns them).
- Commit as you go and **push incrementally** to your branch
  (`wave-shot-a` / `wave-shot-b`) so nothing is lost if you are stopped.
- Report, in this shape: deliverables one line each; files touched; the
  actual pasted output of each test run; what you had to decide that this
  document did not; anything you believe is wrong with the design that you
  built anyway.
