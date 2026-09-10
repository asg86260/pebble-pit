# Wave release — everything web-side on the release checklist

This document is canon. Subagents: do not redesign; implement. Where a number
or a name is written here, use it. A track that finds an item impossible says
so in its report rather than inventing a different feature.

Source: `docs/release-checklist.md` and the reasoning behind each box in
`docs/release-readiness.md` (read the section your track cites before writing
a line). Item 1, crash containment, landed at 7b5da28 and is the model for the
register: `src/crash.js`, the `#crashed` sheet, `test/crash.test.mjs`.

**What is being optimized:** a build somebody can be handed without it losing
their run. Save safety first, then the things a player can't currently reach,
then the guardrails. When scopes collide, cut the guardrail before the door.

## What is in this wave, and what is not

| checklist item | track |
|---|---|
| 6 settings sheet, 10 version + the no-ending sentence, reset moved off the bench | A sheet |
| 7 reduced motion | B motion |
| 4 save export and import (web transport; the seam Electron's dialogs swap into) | C save |
| 5 hidden-window clock leap | D clock |
| 12 perf gate on main | E perf |

**Not this wave, on purpose.** The Electron shell (2), save-to-disk (3),
packaging (8) and the update policy (11) are one wave of their own after the
shell's DESIGN.md section is approved — they share a dependency the orchestrator
installs by hand. Audio (9) is its own wave once the sound rule in DESIGN.md is
approved. A mute switch is therefore **not** on the sheet yet: a switch that
mutes nothing is a lie. `prefs.js` already carries `muted` so it has a home.
Touch tooltips (13) wait.

## The seam modules — already on this branch, read them first

Written by the orchestrator so that no track waits on another:

- `src/prefs.js` — the player's preferences, separate from the run:
  `pref(name)`, `setPref(name, v)`, `reducedMotion()`. Key
  `boulder-clicker/prefs`. Track A writes prefs; track B reads
  `reducedMotion()`. Nobody else edits the file.
- `src/version.js` — `version()` reads `__BUILD__`, stamped by `define` in
  `vite.config.js` (`"7b5da28 · 2026-09-09"` on a build, `"dev"` on the dev
  server). Track A shows it. Nobody edits either file.
- `src/persist.js` — `exportSave()` (done) and `importSave(raw)` (a stub that
  throws). Track A calls both; track C replaces the stub's body and nothing
  else about its signature: `importSave(raw) → true | false`, never throws on a
  bad blob.

## Ownership

One owner per file. A track may call another track's existing exports; only the
owner edits the file. `config.js` / `src/config/*.js`, `state.js` (the three
lists), `hooks.js` (`HANDLES`), `console.js`, `selftest.js`, `main.js`,
`report.js` (`snapshot`) are **additive-only for everyone**: append your lines
in one block under a comment naming your track, at the stated anchor, never
reorder. Conflicts there are expected and cheap.

| track | owns | do NOT touch |
|---|---|---|
| A sheet | `index.html`, `src/style.css`, new `src/settings.js`, `src/crash.js` (the one import of `copyOut`), `src/input.js` (the reset button block only), new `src/selftest/settings.js`, `test/settings.test.mjs` | `src/prefs.js`, `src/version.js`, `vite.config.js`, `src/persist.js`, `src/save.js`, `src/world.js`, `src/clock.js`, `src/board.js` |
| B motion | `src/world.js`, `src/intro.js`, `src/cutscene.js`, new `src/config/motion.js`, `test/motion.test.mjs` | `src/prefs.js`, `index.html`, `src/style.css`, `src/input.js`, `src/render/*` |
| C save | `src/save.js`, `src/persist.js`, `test/save-import.test.mjs`, new fixture files under `test/fixtures/` | `index.html`, `src/settings.js`, `src/style.css`, `src/clock.js`, `src/game.js` |
| D clock | `src/clock.js`, `src/game.js` (the `dt` clamp line and its constant only), `test/clock-leap.test.mjs` | `src/persist.js`, `src/world.js`, everything of A/B/C/E |
| E perf | `test/perf-gate.test.mjs`, counter lines inside `src/route.js` and `src/grid.js` (additive, published on `globalThis` — see the track), `PERF.md` (a new §, additive) | every file another track owns; `tools/node/break-perf.mjs` is read-only |

## Register, for anything drawn or written

The sheet is in the held sheet's register (`.held` in `style.css`, the
`#held` and `#crashed` markup in `index.html`): white card, one-pixel black
border, monospace, upper-case, letter-spaced, centered in the window. Black and
white, flat, no gradients. Text is lower case as content and upper-cased by the
CSS. Comments say *why*, American English.

---

## Track A — the settings sheet

**Intent.** Four things on the checklist need a shelf and there is no shelf.
The held sheet is that shelf: the one surface in the game that is already not
the yard, already reachable from the first second (space), and already says
"the game is stopped, here is what you can do about it". It is not a place you
walk to, and settings are not a place — so this is the one non-diegetic
surface, extended, rather than a second one added. No corner button, no menu
row on any board.

**The sheet.** `#held` grows from a word and a button to this, top to bottom,
in one column, `gap: 10px` as now:

```
PAUSED
[resume]
─────────────────           (a 1px black rule, 60% of the card width)
motion: full                (toggles: "motion: less" / "motion: full")
[save a copy]  [load a save]
[reset progress]            (moved from the bench; the same arming)
space holds · ← → look about
7b5da28 · 2026-09-09
rocks keep coming. there is no finish line.
```

- **motion** is a button in `.held button` style whose text is
  `motion: less` when `reducedMotion()` is true and `motion: full` otherwise.
  Pressing it calls `setPref('motion', !reducedMotion())`. It reads the
  *effective* value on every open, so a player whose system asks for less sees
  `motion: less` before ever touching it.
- **save a copy** copies `exportSave()` to the clipboard, with the same
  fallback and the same one-line reply as `#crashed`'s `copy save`
  (`copied 12kb` / `in window.__save` / `nothing saved yet`) in a `.said`
  line under the buttons. Do not duplicate the copy code: move the button
  handler body in `crash.js` into a shared `copyOut(raw, sayEl)` in
  `settings.js` and have `crash.js` import it (that one import line in
  `crash.js` is yours).
- **load a save** reveals a `<textarea>` under the buttons (full card width,
  6 rows, same monospace, black 1px border, no resize handle) and two
  buttons, `load it` and `never mind`. `load it` calls `importSave(text)`;
  on `true` the textarea folds away and `.said` reads `loaded`; on `false`
  it stays open and `.said` reads `that is not a save`. The pasted text is
  never trimmed or altered before it is handed over.
- **reset progress** is the existing `#reset` button, markup and handler,
  moved from `#board` to the sheet. Same two-click arming, same
  `erase everything?` text, same `disarmReset`. Its CSS moves with it. Grep
  `reset` in `src/selftest/` and `test/` first — any check that finds it on
  the bench now finds it on the sheet; update those checks, do not keep a
  second button.
- **the keys line** is exactly `space holds · ← → look about`, in the
  card's small size. There are no other bindings; do not invent any.
- **the version line** is `version()` from `src/version.js`.
- **the last line** is exactly `rocks keep coming. there is no finish line.`
  — this is the checklist's "one honest sentence", and the sheet is where a
  player who is looking for a finish line goes looking.

`src/settings.js` owns all of the above's behavior (the DOM wiring, the
`.said` line, the textarea reveal); `input.js` keeps only the space/resume
hold logic it has today plus the reset arming block as it is. `main.js` gets
one additive import of `./settings.js` after `./input.js`. The `.said` and
`.why` and rule styles are shared with `#crashed` — one class each, no
per-sheet copies.

**Checks.** `src/selftest/settings.js` (browser, needs the page), listed at the
end of `TESTS` in `selftest.js` under `// wave-release: track A`, in this shape:

1. `the held sheet is the settings sheet` — press space; every line above is
   present and in that order (read `#held`'s children); `motion:` reads the
   effective preference; resume hides it and the game runs on.
2. `motion is a switch that remembers` — press it; `pref('motion')` flips;
   the button text flips; it survives `newRun()`.
3. `a save comes out and goes back in through the sheet` — `save a copy`
   reports `copied` or `in window.__save`; paste `nothing here` into the
   textarea → `that is not a save`, the run untouched; paste the exported
   blob → `loaded`. (Until track C lands, `importSave` throws — catch and
   report `not built` as a failing check; the orchestrator re-runs after
   the merge.)
4. `reset progress lives on the sheet and still arms` — the bench has no
   reset button; the sheet's arms and disarms as before.

`test/settings.test.mjs` (node): `prefs.js` round-trips through localStorage
and `reducedMotion()` answers false with no `matchMedia`.

---

## Track B — reduced motion

**Intent.** The simulation is the reward; the camera and the shake are
punctuation. A player who asked their system for less motion gets the same
yard, walking, and a camera that does not move under them. Nothing about the
yard's own motion changes — bodies, rain, the wheel, the corona, the flags all
stay exactly as they are.

**The rule:** when `reducedMotion()` is true —

1. **`lookAt(x)` in `world.js` snaps instead of gliding**: set `S.camX` to
   the clamped target and `S.camTo = null` in the same call. `stepCamera`
   then has nothing to do. Every purchase glide, board glide and cutscene
   `lookAt` goes through this one door, so this is the whole of the camera.
2. **`shakeView(amount)` in `world.js` is a no-op** — the shake is asked for
   in four places (a crit, the casino knock, a rift tear, the held-body
   shake); none of them is touched. Only the one function that moves the
   view declines. `stepShake` still runs and finds nothing.
3. **The intro (`intro.js`) and cutscenes (`cutscene.js`) keep every beat and
   every body**, and their camera work reduces to: the camera is already at
   the framing each beat would have glided to, from the first frame of that
   beat. The pull-back at the end of the intro becomes the wide framing from
   the start of that beat. `setZoom` calls that animate over frames become
   one call to the end zoom. Nothing is skipped and nothing is shortened —
   a player who chose less motion sees the same story from a still seat.
4. Read `reducedMotion()` at the moment of each call, not once at load: the
   switch on the sheet takes effect on the next glide.

Constants, if any are needed (there should be none beyond what exists), go in
new `src/config/motion.js`, re-exported from the barrel.

**Checks** in `test/motion.test.mjs` (node — the camera is state, no page
needed): set the pref through `setPref('motion', true)` (the switch is track
A's; here the pref *is* the subject):

1. `a glide is a snap under reduced motion` — buy something that glides the
   view (the player's way: `__buy` a row that calls `lookAt`, or `__look`
   then a purchase; say which); after one frame `S.camX` equals the target
   and `S.camTo` is null; with the pref false the same purchase leaves
   `S.camTo` set and `S.camX` short of it.
2. `a crit does not shake the view` — trigger a crit the way `test/crit.test.mjs`
   does; `S.shakeX`/`S.shakeY` stay 0 across 60 frames; with the pref false
   they do not.
3. `the intro plays to the end from a still seat` — `__reset(true)` (intro
   on) with the pref set; run until `S.introDone`; the intro took the same
   number of frames ± one as with the pref off, and `S.camX` never changed
   between two consecutive frames except at a beat boundary (log the frames
   it changed on and assert they number ≤ the beat count).
4. `the yard still walks` — under the pref, two frames apart, `workerPos`
   differs.

---

## Track C — save export and import

**Intent.** A run lives in one origin's localStorage with no second copy, and
the whole reward of this game is a yard you built over hours. The player gets
the save out and back in, and a bad paste can never cost the good one.

**Deliverables.**

1. `importSave(raw)` in `persist.js` replaces the stub. In order:
   - parse; refuse (`return false`) anything `load()`'s shape check refuses —
     put that check in one exported `isSave(obj)` in `save.js` that `load`
     itself uses, so the two cannot drift;
   - write the current save to `boulder-clicker/v4.prev` (new constant
     `PREV_KEY` in `save.js`, next to `KEY`, with a `savePrev`/`loadPrev`
     pair);
   - write the new blob under `KEY`, call `restore()`, then `buildShop()` and
     `syncWorkers()` exactly as `main.js`'s boot does (import them; this is
     the one place outside `main.js` that boots the yard, and the comment
     says why);
   - if `restore()` throws: put `.prev` back under `KEY`, `restore()` again,
     and `return false`. The yard the player had is the yard they still have.
   - on success `return true`, `S.dirty = true`, `persist()`.
   Never `location.reload()` — the sheet is open and the player is looking.
2. `exportSave()` stays as written (the raw blob). No base64, no wrapping.
3. `.prev` is written on every successful import and never read except by
   the failure path above and by `loadPrev()` — it is the one-deep undo the
   Electron wave will turn into a rolling backup. Document that in the
   comment.
4. `load()` in `save.js` gains nothing except the `isSave` extraction.

**Checks** in `test/save-import.test.mjs` (node; the yard has localStorage):

1. `a save goes out and comes back` — run a yard 30s, `exportSave()`, run
   30 more, `importSave(blob)` → true, `stored` and the roster match the
   blob's, and the yard runs on (dust rises over the next 10s).
2. `a blob that is not a save is refused and costs nothing` — `importSave('x')`,
   `importSave('{}')`, `importSave('{"stored":1}')` all false; the current
   save byte-identical before and after; the yard's `stored` unchanged.
3. `a save that parses but will not restore leaves the old one standing` —
   take a real save, corrupt one hand-encoded field so `restore()` throws
   (find one by reading `restore`; say which) → false; `KEY` holds the
   previous blob; the yard still runs.
4. `the player's yard survives a round trip` — `test/fixtures/player-yard.json`
   through `importSave`, then `exportSave()` re-imports to the same `stored`,
   the same crew count, the same rift contents.

---

## Track D — the hidden window's clock

**Intent.** Pillar 2: no punishment for walking away. Today `tick()` adds the
whole away duration to `now()` on the first frame back while `dt` is clamped
to 100 ms, so the yard does no work and every `now()`-based deadline — a dose,
a spin, a break, `nextBoulderAt` — resolves at once. The two halves must agree:
**a hidden window is a pause.**

**Deliverables.**

1. New `CLOCK_LEAP_MS = 100` in `src/config/yard.js` (or wherever `dt`'s
   neighbors live — say which), with a `TUNABLE` row.
2. `tick(held)` in `clock.js` advances `t` by `Math.min(CLOCK_LEAP_MS,
   r - wall)`, never the whole gap. The comment above `tick` is rewritten:
   the pause case and the hidden case are now the same case, and the reason
   the wall is still read every frame stays.
3. `game.js:147`'s `Math.min(100, ...)` reads `CLOCK_LEAP_MS` — the same
   number in one place, which is the point.
4. `advance(ms)` (the turned handle) is untouched; checks depend on it.
5. Confirm `air.js:203` and `balloon.js:245` (phase read off `now()`) show no
   visible jump on return: they cannot, since `now()` is now continuous, but
   say so in the report having read them.

**Checks** in `test/clock-leap.test.mjs` (node; drive `tick` with a mocked
`performance.now` — say how):

1. `an hour away is a tenth of a second on the clock` — `now()` before,
   fake the wall an hour on, one `tick(false)`, `now()` moved by exactly
   `CLOCK_LEAP_MS`.
2. `a dose bought before tabbing out is still live after` — buy a dose the
   player's way (`__buy` on the apothecary row; see `test/apothecary.test.mjs`
   for the route), note `doseLeftMs`, fake an hour, one frame, `doseLeftMs`
   is within one frame of what it was.
3. `a spin in flight resolves after its own time, not on return` — the
   casino route from `test/casino.test.mjs`; an hour away leaves
   `now() < S.spinUntil` still true.
4. `the pause and the hidden window are the same case` — sixty `tick(true)`
   frames and sixty hidden-gap `tick(false)` frames move `now()` by the same
   amount (0 vs ≤ 60 × CLOCK_LEAP_MS is *not* the same — this check pins that
   a held frame adds nothing and a hidden gap adds one clamp per frame, and
   documents that a game left hidden for an hour with rAF still firing
   would advance at most 100 ms per fired frame). If you find rAF *does* fire
   in a hidden headless page, say so; the check must still hold.

---

## Track E — a perf gate on main

**Intent.** PERF.md records the busy yard going from 0.80 to 0.121 ms/frame and
nothing in either tier would notice it going back. The house rule forbids a
threshold on a noisy statistic, so the gate asserts **counts**, not time.

**Deliverables.**

1. Two counters, published from inside the module (never read via a dynamic
   import — see CLAUDE.md "publish it on `globalThis`"), zeroed by the check
   between frames, permanent (not `// TEMP`), each one line plus a comment
   saying it is the perf gate's:
   - `globalThis.__perf.ways` — how many `ways()` objects were built this
     frame (`ways()` is `route.js:219`);
   - `globalThis.__perf.grainCols` — how many floor columns `addGrain`
     searched this frame (`grid.js`; PERF.md §4 names the endgame spike as
     `addGrain` searching the whole floor).
   The `__perf` object is created once in `grid.js`; `route.js` adds to it.
   Under a production build these are two integer increments a frame; no
   branch on `DEV`.
2. `test/perf-gate.test.mjs`: the standard busy yard from PERF.md
   (`__crew(4,4,3,3)`, `__fullSites`, granted currencies, 10 s settle), then
   the driven endgame yard from `tools/node/break-perf.mjs` (read it; call
   the same setup, do not copy it). For each, 300 frames, and assert per
   frame: `ways ≤ 1` and `grainCols ≤ ` a ceiling **derived from the yard**
   — e.g. `2 × P × the widest strip in S.strips` — not a number typed in.
   State the derivation in the check's comment. If a derived ceiling is
   genuinely not available for `grainCols`, assert the *ratio* to the number
   of grains added that frame instead, and say so.
3. A new PERF.md section, `## 8. The gate`, three paragraphs: what is
   counted, why counts and not milliseconds, and how to raise the ceiling
   when a legitimate change needs it.

**Checks**: the file above. It must pass on main as-is — if it does not, that
is a finding, not a reason to loosen the ceiling: report the counts you saw
and the frame they spiked on, and leave the check red with the numbers in the
assertion message.

---

## Verification, per track

- Dev server: start your own from the repo root binary,
  `"C:/git/boulder-clicker/node_modules/.bin/vite" --port <5201 + track index: A 5201, B 5202, C 5203, D 5204, E 5205> --strictPort`,
  confirm it serves *your* worktree (`curl -s localhost:<n>/src/<your file> |
  grep <your new symbol>`). **Never touch port 5183** (the user's game) or
  5184. Tear it down before reporting and verify the port is dead.
- Browser checks: `GAME=http://localhost:<n>/ CDP_PORT=<9401 + track index> node tools/headless.mjs --only "<group name>"`.
- Anything drawn or laid out (track A): `WINDOW=1200,800 GAME=... CDP_PORT=... node tools/headless.mjs --shot shots/<name>.png "<expr>"` and read the shot.
- One node test file per track (named in your ownership row), run alone:
  `node --test test/<file>.test.mjs`. Buy like a player: at least one check
  per feature reaches it through `__buy`/the pointer, not a `__` hook.
- Run tests in the **foreground**. Never run the full suite; never
  `run_in_background` a test.
- First command in your worktree: `git fetch origin && git reset --hard origin/worktree-wave-release`.
- Commit early and often to your branch, push each commit
  (`git push -u origin wave-release-<track>`), and report: deliverables one
  line each, files touched, **pasted** test output, judgment calls the spec
  left open, anything you believe is wrong with the design you implemented
  anyway.

## Seams the orchestrator wires post-merge

- Re-run track A's `a save comes out and goes back in through the sheet`
  once C's `importSave` is in.
- `crash.js`'s `copy save` sharing `copyOut` with the sheet (A owns the
  import line; verify the crashed sheet still copies).
- The `#hidedone` toggle stays on the bench — it is a fact about the bench's
  rows, not a preference. Reconsider only if a track argues otherwise.
- Tick the checklist boxes; TODO.md status; DESIGN.md gets a short `(built)`
  section "The sheet" pointing here.
- Full suites on main, after the merge, once.
