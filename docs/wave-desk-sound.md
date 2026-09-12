# Wave: the desk and the sound (2026-09-11)

The last open boxes on `docs/release-checklist.md`: the Electron shell, the
save on disk, packaging and the itch channel, the update policy, and audio.
Two designs cover them and both are approved: DESIGN.md "The desk: an Electron
shell" and "The sound of the yard". **This document is canon. Subagents: do
not redesign; implement.** Where a number or a name is written here, use it;
where the design section says something this file does not, the design
section is canon too. A track that finds an item impossible says so in its
report rather than inventing a different feature.

What is being optimized: **a build somebody can download and play**, with
their save safe. Feel and polish lose to that when scopes collide.

## The calls the designs left open, made here

- **Audio question 1 (music):** (c) -- the sky is the only score. No drone,
  no music. The air and water beds are written to swell and recede with the
  weather, and that is the whole arc.
- **Audio question 2 (default):** on, and quiet. `SND_MASTER = 0.18`. The
  mute remembers, via `prefs.js` `muted` (already there). Not a state.js
  field: a preference survives a reset and does not travel with a save.
- **Audio question 3 (tower and rift):** the rift is the one exception, as
  the palette table already says -- two low sines beating. The tower is
  silent. Nothing else gets a pitched or sustained voice, ever.
- **`desk.read()` returns `{ current, lastGood }`**, both `string | null`,
  rather than one string. The fallback rule ("if `current.json` fails its
  shape check, load `last-good.json`") is decided by the renderer's `isSave`,
  which is the one place that rule lives, so the renderer needs both blobs.
  Still five functions, still no events, still no path shown to the page.
- **Where the mute switch lives:** a row on the held sheet under the motion
  switch, `#sound`, reading `sound: on` / `sound: off`, same register.

## Ownership

| track | owns (edits freely) | additive-only | do not touch |
|---|---|---|---|
| **A the desk** | `electron/**` (new), `src/save.js`, `src/settings.js`, `src/main.js`, `src/persist.js`, `src/state.js`, `index.html`, `package.json`, `bun.lock`, `vite.config.js`, `.gitignore`, `tools/publish.mjs` (new), `test/desk-store.test.mjs` (new), `test/desk-adapter.test.mjs` (new), `docs/release-checklist.md`, `ARCHITECTURE.md` (its own entry) | `src/config.js` (one block at the end), `DESIGN.md` (mark "The desk" `(built)` and add an amendments paragraph; nothing else) | `src/audio.js`, `src/config/sound.js`, `src/dev.js`, every gameplay module |
| **B the sound engine** | `src/audio.js` (the stub is yours to replace), `src/config/sound.js` (new), `src/dev.js`, `test/sound.test.mjs` (new), `ARCHITECTURE.md` (its own entry) | `src/config.js` (one `export *` line at the end), `src/settings.js` (one block at the end, under `// wave-desk-sound, track B`), `index.html` (the one `#sound` button, directly under `#motion`), `DESIGN.md` (mark "The sound of the yard" `(built)`; nothing else) | `src/save.js`, `src/main.js`, `src/persist.js`, `src/state.js`, `src/prefs.js` (`muted` is already there), `electron/**`, `package.json`, every gameplay module |
| **C the yard's events** | `test/sound-events.test.mjs` (new) | every gameplay module in `src/` *except* the ones A and B own, and only `sfx(...)` calls plus the `import { sfx } from './audio.js'` line -- one line per event, at the site where the thing physically happens, nothing else changed in the file | everything A and B own; `src/config.js`; `index.html` |

`src/audio.js` is on the branch as a stub before any track starts, with the
exact signatures below, so C can import it and B can fill it. B replaces the
stub wholesale. C never edits it.

A track may call another's *existing* exports freely. The seam between B
and C is the `sfx` signature and nothing else; B does not know which modules
call it, C does not know how a voice is made.

Shared, additive-only files: keep each edit to one block at the end of the
file under a comment naming the track. Conflicts there are expected and
cheap.

## Track A -- the desk

Everything in DESIGN.md "The desk: an Electron shell", built as written, with
these specifics.

1. **`electron/main.cjs`.** One `BrowserWindow`: `width: 1440, height: 900,
   minWidth: 960, minHeight: 600, backgroundColor: '#ffffff', title:
   'Boulder', autoHideMenuBar: true`, `Menu.setApplicationMenu(null)`,
   `webPreferences: { preload, contextIsolation: true, sandbox: true,
   nodeIntegration: false, backgroundThrottling: false }`. With
   `process.env.VITE_DEV_SERVER_URL` set, `loadURL` it; otherwise
   `loadFile('dist/index.html')`. IPC handlers for the five bridge calls,
   backed by `store.cjs` at `path.join(app.getPath('userData'), 'saves')`.
   Never imports from `src/`.
2. **`electron/preload.cjs`.** `contextBridge.exposeInMainWorld('desk', {...})`
   with exactly `read` (sync: `ipcRenderer.sendSync`), `write`, `exportTo`,
   `importFrom`, `version`. `version()` returns the `{ hash, date }` the main
   process read from `dist/build.json` -- **A also writes `dist/build.json`**
   from `vite.config.js`'s `build()` via a tiny plugin `closeBundle` hook, so
   the shell and the page stamp the same build. In dev it is
   `{ hash: 'dev', date: '' }`.
3. **`electron/store.cjs`.** Plain Node, no Electron import. `openStore(dir)`
   returns `{ read(), write(raw) }`: `read()` -> `{ current, lastGood }`
   (each a string or null), `write(raw)` -> boolean. `write`:
   `JSON.parse(raw)` first (a blob that is not JSON is refused, false); write
   `current.json.tmp`; `fs.renameSync` over `current.json`; read
   `current.json` back and `JSON.parse` it; only then copy it to
   `last-good.json` (via its own tmp + rename). So at every moment the
   directory holds at least one whole save, and a throw anywhere leaves the
   old files untouched. Named slots: not built this wave; the directory is
   laid out so they can be (`<name>.json` beside `current.json`).
4. **`src/save.js` gets the store seam.** A `store` object with `get`, `set`,
   `remove`: localStorage under `KEY` when `window.desk` is absent;
   `desk.read().current` / `desk.write` when it is present. `remove` in desk
   mode writes `''`, and the renderer treats an empty or absent current as
   no save (`store.write('')` skips the parse and truncates `current.json`;
   `last-good.json` is left alone). `loadRaw`, `saveRaw`, `clear`, `load`
   route through it. `PREV_KEY`, `BROKEN_KEY`, `OWNER_KEY` and prefs stay in
   localStorage in both modes -- localStorage exists in the shell and those
   are page facts, not the save. `saveRaw` in desk mode is fire-and-forget
   on the promise but records the last resolved boolean so `S.unsaved` still
   reads true when the disk refused.
5. **Fallback.** `load()` in desk mode: if `current` passes `isSave` use it;
   else if `lastGood` passes, stash `current` under `BROKEN_KEY` as today,
   use `lastGood`, and set `S.fellBack = true` (EPHEMERAL). `main.js` after
   `restore()`: if `S.fellBack`, `S.paused = true` and `sayStore()` so the
   sheet is up on boot with `the last save would not load; this is the one
   before it`. `sayStore` gains that line, first in its chain.
6. **Migration.** In `load()` (desk mode), when both `current` and `lastGood`
   are null and localStorage has `KEY`: `desk.write(raw)` and use `raw` this
   boot. Never again while the file exists. The localStorage copy stays.
7. **The dialogs.** `settings.js`: `#savecopy` calls `desk.exportTo(exportSave())`
   when `window.desk` exists (`said` = `saved` or `not saved`); `#loadsave`
   calls `desk.importFrom()` and feeds the text to `importSave` (the same
   `took` / `that is not a save` / throw handling as the paste path). No
   paste box shown in desk mode. Main process: `dialog.showSaveDialog` /
   `showOpenDialog`, filter `{ name: 'save', extensions: ['json'] }`, default
   name `boulder-<YYYY-MM-DD>.json`.
8. **The version boundary.** `S.build` in `SAVED_BY_HAND`: `blob()` writes
   `build: BUILD`; `restore` reads it into `S.build` (default `null`). After
   restore, if `S.build?.date && BUILD.date && S.build.date > BUILD.date`,
   set `S.newerSave = S.build.date` (EPHEMERAL). `sayStore` says `this save
   is from a newer build (<date>)` once and clears it. Loaded anyway, never
   refused.
9. **Packaging.** `vite.config.js`: `base: './'`. `package.json`: `"main":
   "electron/main.cjs"`; devDependencies `electron` and `electron-builder`
   at the current release (run `bun add -d electron electron-builder` in the
   worktree; **if the download of the Electron binary is refused or fails,
   write the two entries by hand -- `"electron": "^38.1.0"`,
   `"electron-builder": "^26.0.12"` -- and say so in the report; the merge
   installs them**). Scripts: `"desk": "electron ."` with the dev URL read
   from the environment (document `VITE_DEV_SERVER_URL=http://localhost:5183/
   bun run desk` in ARCHITECTURE.md), `"desk:build": "vite build &&
   electron-builder"`. A `"build"` block: `appId: "com.boulderclicker.desk"`,
   `productName: "Boulder"`, `files: ["dist/**", "electron/**"]`,
   `directories: { output: "release" }`, `win: { target: ["nsis",
   "portable"] }`, `mac: { target: ["dmg"] }`, `linux: { target:
   ["AppImage"] }`. Add `release/` to `.gitignore`. No icon this wave (a
   default is fine; the icon is content).
10. **`tools/publish.mjs`.** The one script that talks outside: runs `butler
    push release/<artifact> $ITCH_TARGET:<channel>` for each artifact found,
    channels `windows`, `windows-portable`, `mac`, `linux`. Refuses to run
    without `ITCH_TARGET`. **Do not run it.**
11. **Checks.** `test/desk-store.test.mjs`: point `openStore` at a temp dir;
    the atomic write leaves the old file or the new, never a torn one (make
    `fs.renameSync` throw once via a monkeypatch and read back); a `current`
    that is not JSON is refused and `last-good` is untouched; after two
    writes `lastGood` is the first blob. `test/desk-adapter.test.mjs`: with a
    fake `window.desk` on the node yard, `persist` reaches `write` and
    `restore` reaches `read`; `exportSave`/`importSave` are byte-identical
    either way; the fallback sets `S.fellBack` and boots the last-good yard;
    the migration calls `write` exactly once. Also keep
    `test/persist-roundtrip.test.mjs`, `test/crash.test.mjs`,
    `test/clock-leap.test.mjs` green (they cover what you touch). The shell
    itself is looked at, not tested -- if electron installed, `bun run desk`
    and a screenshot at 1440x900 and at 960x600 in the report; if not, say
    so.
12. **Docs.** Tick the five boxes on `docs/release-checklist.md` with the
    date and the files; mark DESIGN.md "The desk" `(built)` with an
    amendments paragraph for `read()`'s shape and anything else you had to
    decide; an `electron/` entry in ARCHITECTURE.md.

## Track B -- the sound engine

Everything in DESIGN.md "The sound of the yard", built as written: the law,
the six voices, the four density classes, the mix law, the architecture
paragraph. Specifics:

1. **`src/audio.js`** replaces the stub. Exports exactly: `sfx(voice, opts)`,
   `stepAudio(dt)`, `wakeAudio()` (called on the first real pointer gesture
   -- B wires it from `settings.js`'s additive block via one
   `addEventListener('pointerdown', wakeAudio, { once: true })` on `window`,
   which is the one line outside `audio.js` that knows the context exists),
   `muteAudio(on)`, and for the node tier `audioDecisions()` -- the decision
   half, see 4. It is the only file that ever names `AudioContext`. Before
   `wakeAudio`, every call is a no-op and nothing is queued. `stepAudio(dt)`
   is called once a frame from `game.js`'s `step` -- **B may add that one
   import and one call to `game.js`**, at the end of the step, and nothing
   else in that file.
2. **Voices.** `stone`, `wood`, `metal`, `water`, `air`, `rift`. One noise
   buffer (4 s, pinkish, filled from `rand()` in `rng.js` so a seeded run has
   a seeded soundtrack), one sine. Every one-shot is source -> `BiquadFilter`
   bandpass -> `GainNode` envelope -> yard bus. Master chain: yard bus ->
   one-pole lowpass at `SND_LOWPASS_HZ = 5000` -> `DynamicsCompressor` as a
   soft limiter (threshold -18 dB, ratio 8, release 0.4) -> master gain
   `SND_MASTER`. Attack >= 3 ms on everything; releases via
   `setTargetAtTime`; a stolen voice fades over 20 ms.
3. **`opts`.** `{ x, hard, big, crit, cls }` -- `x` is world x, panned against
   `S.camX` to at most `SND_PAN_MAX = 0.3`; `hard` in [0,1] moves the band
   down and dulls; `big` adds the sine thump under stone; `crit` adds body,
   not level. Every one-shot gets detune within `SND_JITTER_CENTS = 100`,
   level within `SND_JITTER_DB = 2`, timing within `SND_JITTER_MS = 8`, all
   from `rand()`.
4. **Density.** Class is a property of the *call site's event*, passed as
   `opts.cls`: `'hand'` (never folded, never stolen, never ducked), `'fold'`
   (default -- window `SND_FOLD_MS = 80`, ceiling `SND_FOLD_PER_S = 12` per
   voice, excess *dropped*), `'punct'` (ducks the beds by `SND_DUCK_DB = 4`
   for `SND_DUCK_S = 1`). Beds are not events: `stepAudio(dt)` reads `S`
   once a frame and sets targets -- `water` from the rain (`weather.js`,
   `skyReport()` / whatever `S` says is raining) and the drowned pit; `air`
   with cutoff and gain driven off `gust()`/`give()` in `wind.js`; `rift`
   from `riftHeld()` / the rift's state in `S`; the machines' hum from the
   count of running machines. Crossfades over `SND_BED_S = 2` seconds,
   never per frame. The opening's silence: while the body is flat after the
   boulder lands (`intro.js` -- read the flag `S` carries for it), every bed
   target is 0. Voice cap `SND_VOICES = 16`, stealing oldest-and-quietest,
   hand exempt.
5. **The decision half is separate from the context.** `audioDecisions()`
   returns `{ fired, dropped, folded, byClass: { hand, fold, punct }, beds:
   { water, air, rift, hum } }` -- counters since wake, and current bed
   targets -- computed by a scheduler that works without an `AudioContext`.
   The node tier holds it: `test/sound.test.mjs` -- forty `sfx('stone')`
   calls in one frame fire one voice and fold the rest; the ceiling drops
   rather than defers (after a second of overload the count is the ceiling,
   not the backlog); a `'hand'` call in the same frame always fires; the
   `water` bed target follows a storm turned on through the yard's own hooks
   and decays over `SND_BED_S`; before `wakeAudio`, nothing is counted. A
   fake `AudioContext` is fine for anything the decision half does not
   cover; there is no `AudioContext` on the node yard, and `wakeAudio` there
   must wake the decisions without one.
6. **Config.** `src/config/sound.js`, every number `SND_`-prefixed as `export
   let`, and one `export *` line appended to `config.js`. `SND_MASTER`,
   `SND_LOWPASS_HZ`, and each class ceiling in `TUNABLE` (`dev.js`).
7. **Mute.** `muteAudio(on)` ramps master to 0 / back over 50 ms and is the
   only thing the switch calls. The switch: `#sound` button under `#motion`
   in `index.html`, its block at the end of `settings.js` under the track
   comment, reading `pref('muted')`, writing `setPref('muted', ...)`,
   `sound: on` / `sound: off`, put in order on open by its own small
   `MutationObserver` on the sheet (guarded like the existing one).
8. **Docs.** Mark DESIGN.md "The sound of the yard" `(built)` and note the
   three open questions as decided (copy the calls from the top of this
   file); an `audio.js` entry in ARCHITECTURE.md.

## Track C -- the yard's events

One line per event, `sfx(voice, { ...opts })`, at the site where the thing
physically happens -- not where the number changes. Every call obeys the
law: if no body caused it, there is no call. Nothing in the shop, the boards,
the sheet, the hover or a price makes a sound. Find each site by reading the
module; the file named is where to look, not a promise of a line number.

| event | voice | cls | opts | where to look |
|---|---|---|---|---|
| the player's click knocks off rock | stone | hand | `x`, `hard` from depth/layer, `crit` | `rock.js` `knockOff` with `from === 'you'` |
| a body's pick meets the rock | stone | fold | `x`, `hard` | `knockOff` with a body |
| a grain lands on the ground / in the pit | stone | fold | `x` | `dust.js` landing, `pit.js` `bankDust` |
| a load lands on the belt | metal | fold | `x` | `dust.js` `loadBelt` |
| a footstep | stone | fold | `x`, `hard: 0` (quiet) | `crew.js` / `crew/` where a body's walk frame advances -- one call per stride, not per frame |
| the ram strikes | metal | fold | `x`, `big` | `rock.js` around `ramX` / the machine that swings it |
| a machine's beat | metal | fold | `x` | `machines.js` / `press.js` where a machine does its work |
| a building lands on its footprint | wood | punct | `x`, `big` | `works.js` `workFinished` |
| a hatch / board / bench opens | wood | fold | `x` | `raise.js`, `house.js`, where a thing is raised |
| a core banks | stone | punct | `x`, `big` | `core.js` `bankCore` |
| a star lands | stone | punct | `x`, `big` | `meteor.js` where the meteor arrives |
| the rift tears / widens | rift | punct | `x` | `rift.js` where a rung lands and the cut grows |
| the boulder lands (opening and every rock after) | stone | punct | `x`, `big`, `hard: 1` | `rock.js` `landRock` |
| a rock breaks through a layer | stone | fold | `x`, `hard` | `rock.js` where `depthOf` changes on a knock |

Not on the list, on purpose: birds, the dance, the balloon, the tower, the
school, the apothecary, the casino wheel, the noticeboard, the shields'
cutscenes. Those are a second pass with an ear, not a guess. If you find a
site on the list that does not exist in the code, leave it out and say so in
the report.

**Check:** `test/sound-events.test.mjs` on the node yard, reading
`audioDecisions()` after `wakeAudio()` (the stub's counters are enough to
write against; B's real ones return the same shape): a click through
`__clickLever`/the pointer route fires a `'hand'` stone; a rock landing
through `run()` fires a `'punct'`; a yard with `__crew(4, 4)` run ten
seconds fires more `'fold'` stone than a yard with nobody. Buy it like a
player. Also keep green whichever existing test file covers each module you
touched -- name them in the report.

Rain and wind are beds and belong to B; do not add `sfx` calls for them.

## The stub (on the branch already)

`src/audio.js` exports `sfx`, `stepAudio`, `wakeAudio`, `muteAudio`,
`audioDecisions` with the shapes above; `sfx` counts into the decision
object by class after `wakeAudio` and does nothing else. B replaces it.

## Verification, per track

- Start a dev server for your worktree on a port nobody else uses (5187 for
  A, 5188 for B, 5189 for C): `"C:/git/boulder-clicker/node_modules/.bin/vite"
  --port <n> --strictPort`, in the background, and confirm with `curl` that it
  serves your changed file. Tear it down before you report. **Never touch
  5183.**
- Run only the test files named in your track, in the foreground:
  `node --test test/<file>.test.mjs`. Not the whole suite.
- Paste the actual output into the report.

## Report shape

Deliverables one line each; files touched; the pasted test output; what you
had to decide that this document did not; anything you believe is wrong with
the design you implemented anyway.

## Merge order

A, then B, then C. Seams the merge wires: nothing planned -- `sfx` is the
seam and it is on the branch. After the merge: install electron in the root,
`bun run desk` against 5183 for a look, both tiers once on main.
