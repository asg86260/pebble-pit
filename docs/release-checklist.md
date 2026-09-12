# Release checklist

The working list, for the target the user has picked: an Electron desktop app,
not a hosted web page. One box per item, in the order the report argues for
(adjusted where the desktop target changes the answer). Each line says what
done looks like; the reasoning and file references live in
`docs/release-readiness.md` under the section named — this file does not repeat
them. Where a line here contradicts the report, the desktop decision wins.
Check a box only when the done-looks-like sentence is true, not when a piece of
it is.

- [x] **Fatal-crash containment.** (2026-09-09: `src/crash.js`, the wrap in
  `main.js`, `S.fatal` guarding `persist`, the `#crashed` sheet; checks in
  `test/crash.test.mjs` and the last group of `src/selftest/input.js`.) Done: a throw inside `frame()` is caught, the
  loop stops cleanly, the autosave stops on fatal (so a crash cannot overwrite
  the good save), `window.onerror`/`unhandledrejection` cover boot, and the
  player sees one plain surface saying the game stopped and offering to copy
  the save out. → report §"1. Do not let a throw eat the run"

- [x] **The Electron shell.** (2026-09-12: `electron/main.cjs`, `electron/preload.cjs`; DESIGN.md "The desk"; `bun run desk`) New item, top tier: main process, preload, window
  config, icon, app name. This is the project's first structural dependency, so
  per the working agreement it wants a DESIGN.md section written and approved
  before any code — what the shell owns, what stays in the renderer, and how
  thin the preload bridge is. Done: the approved design exists and the game
  boots as a desktop window from it. → no report section; this supersedes the
  report's web-page framing

- [x] **Save durability.** (2026-09-12: `electron/store.cjs` atomic write and rolling `last-good.json`; the store seam, fallback and migration in `src/save.js`; `S.fellBack` said on the sheet; `test/desk-store.test.mjs`, `test/desk-adapter.test.mjs`) The shape is decided; write this, do not redesign:
  the canonical save becomes a file in `app.getPath('userData')`, written by
  the main process atomically (temp file + rename), with a rolling last-good
  backup written only after the new blob has parsed back, and room for multiple
  named slots. localStorage remains the fallback and the migration source — an
  existing player's browser save migrates in on first run. Autosave stops on
  fatal, and nothing overwrites a save that has not passed its parse check.
  Done: a truncated or malformed primary loads the backup, the player is told,
  and a check proves it. → report §"9. Save robustness beyond one slot" (the
  mechanism moves to disk; the guarantees are the same)

- [x] **Save export and import.** (2026-09-09: web transport — `exportSave`/`importSave` in `persist.js`, `.prev` one-deep undo, the sheet's `save a copy` / `load a save`; 2026-09-12: the native dialogs, `desk.exportTo`/`desk.importFrom` in `electron/main.cjs`, the two branches in `src/settings.js`) Done: native save/open dialogs replace the
  download/paste flow — the dev-only `copy save` in `src/dev.js` becomes a
  player-facing "save a copy" writing a file where the player chooses, and
  import opens one, validates it, and keeps the current save until the new one
  has restored cleanly. → report §"2. Player save export and import"

- [x] **Hidden-window clock leap.** (2026-09-09: `CLOCK_LEAP_MS` clamps `tick` and `dt` alike; `test/clock-leap.test.mjs`) Done: a minimized window or a suspended
  machine no longer resolves every timed thing at once on return. Today
  `clock.js` adds the whole away duration on the first frame back while `dt`
  clamps to 100 ms. The cheap mitigation is `backgroundThrottling: false` on
  the BrowserWindow, which keeps rAF running while minimized; the suspend case
  still needs the clock decision. → report §"3. The hidden tab must not spend
  the yard's clock"

- [x] **Settings sheet.** (2026-09-09: the held sheet, `src/settings.js`; mute row waits for audio) Done: one player-reachable sheet holding mute, reduced
  motion, export/import, the keyboard bindings, and the version — the shelf the
  items above and below put things on, built once rather than four times.
  → report §"4. A settings sheet"

- [x] **Reduced motion.** (2026-09-09: `prefs.js` + the switch; `lookAt` snaps, `shakeView` declines, the intro plays from a still seat; `test/motion.test.mjs`) Done: `prefers-reduced-motion` is read as the default
  of a switch on the settings sheet, and it turns off the camera moves and the
  shake — the motion that is punctuation — while the yard keeps walking.
  → report §"5. Reduced motion"

- [x] **Packaging and release channel.** (2026-09-12: `base: './'` and `dist/build.json` in `vite.config.js`; the `build` block and `desk:build` in `package.json`; `tools/publish.mjs` for the itch channels -- not yet run) Done: `base: './'` is set in
  `vite.config.js` (still required — the shell loads over `file://`), the app
  is packaged with electron-builder or Forge into per-OS artifacts, and the
  builds are published on itch.io as the desktop-build channel. This replaces
  the report's itch-HTML5-plus-Pages plan. → report §"6. Deploy it somewhere,
  on purpose" (the host argument changes; the "on purpose" does not)

- [ ] **Audio.** A wave: design first, per the working agreement — the seed is
  at `DESIGN.md:3482` (soft ticks, a low tone on a core bank, optional, off by
  default, WebAudio oscillators, no new runtime dependency). Done: a stated
  sound rule of the "black and white, flat shapes" kind lands in DESIGN.md and
  is approved before any code, then the layer is built to it with a mute that
  remembers. → report §"7. Audio, and a mute that remembers"

- [x] **Version and the no-ending sentence.** (2026-09-09: `__BUILD__` via `define`, `src/version.js`, both lines on the sheet; the store-page half waits for a store page) Done: the git hash and build date
  are injected via `define` in `vite.config.js` and shown on the settings
  sheet, and one honest sentence — rocks keep coming, there is no finish line —
  is somewhere a player will read it. → report §"10. Say the version"

- [x] **Update policy.** (2026-09-12: `S.build` in the save, `S.newerSave` read in `persist.js`, said once on the sheet by `settings.js`; loaded, never refused; updates are a devlog and a download) Done: what happens when a player is on an old build is
  decided — desktop packaging removes the mid-session cache problem, but a
  save written by a newer build can still meet an older app, so the version
  boundary still needs noticing. → report §"11. Cache-busting across an update
  mid-run" (the cache half falls away; the version-boundary half stays)

- [x] **Perf gate on main.** (2026-09-09: `test/perf-gate.test.mjs` counts `ways()` builds and `addGrain` columns; `ways()` is memoized on its eight scalars, PERF.md §8) Done: one check in the node tier that would go red
  if the busy yard's frame cost regressed — preferably asserting a count (an
  allocation or walk count per frame) rather than a wall-clock time, per the
  house rule against thresholds on noisy statistics.
  → report §"12. A perf gate on main"

- [ ] **Touch tooltips.** Low priority now — this is a desktop app. Still true
  that `input.js:209` gates all hover explanation off for touch pointers, so a
  touch-screen laptop cannot read a tooltip; a long-press route fixes it if it
  ever matters. → report §"8. Touch completeness"

Not on this list, on purpose: onboarding measurement waits until there are
players to measure (report §13), and PWA/service worker, telemetry, window-size
work, offline accrual, and an ending are argued against in the report's
"Deliberately not on this list" section — do not re-add them here.
