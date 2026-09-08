# What is left before this is a thing you can hand somebody

The content is nearly finished. Nothing below is content. This is the survey of
everything *around* the game — the save, the window, the tab, the build, the
place it gets put — written down because none of it has ever been the subject of
a wave, and most of it has never been looked at once.

Two halves: what is actually there, with file references, and then what to do
about it in the order I would do it.

Nothing here proposes a server, an account, a payment, or an ending. The
pillars hold: no fail state, no offline accrual, no ascension, and the dev panel
is not a player surface.

---

# Part one: what is there

## The save

One key, one blob, written every second.

`src/save.js` is twenty-five lines and is the whole storage layer.
`KEY = 'boulder-clicker/v4'`; `load()` reads it, parses it, and believes it only
if `stored` is a number and `boulder` is a string; `save()` writes it inside a
`try` that swallows a quota or a private-mode refusal and lets the game keep
running unsaved; `clear()` removes it. Everything above that is
`src/persist.js`, a thousand lines of field-by-field reading with a default per
field.

What is good about it, and it is genuinely good:

- **Schema drift is handled per field, not per version.** There is no schema
  integer inside the save. Each field is read with a fallback that reconstructs
  it from what an older save does have — `S.reunionDone = s.reunionDone ?? ((s.boulderNo ?? 1) > 1)`
  at `src/persist.js:624`, the seam's debt guessed at `:866-889`, the kit
  re-worn when there is no record of who wore what at `:816`. A save that
  predates a feature gets a sensible answer rather than an exception.
- **The one field that cannot survive a reload is turned round on both
  journeys.** A dose's expiry is a moment on a clock that starts again when the
  page does, so `src/crew/records.js:97-99` writes how much is *left* and
  `persist.js` works the moment out again. That is the right shape and it is the
  only field in the game that needed it.
- **The pit is stored as a profile plus a count per shade** (`pitToSave` in
  `persist.js`), and the floor run-length encoded (`gridStr`, `:35`). A million
  cells comes out a few kilobytes. This is why writing every second is
  affordable.
- **Write points are sensible**: `visibilitychange`, `pagehide`, and a one-second
  interval, all in `src/main.js:104-106`, and `persist()` returns immediately
  unless `S.dirty`.

What is missing:

- **There is no export or import for the player.** The dev panel has a `copy
  save` button (`src/dev.js:220-232`) which puts the raw string on the clipboard
  and falls back to `window.__save` — and it is behind `import.meta.env.DEV`
  (`main.js:112-115`), so a player has never seen it. There is no import at all,
  in dev or out of it. A player's entire run lives in one origin's localStorage,
  which a browser will clear for reasons that have nothing to do with this game:
  clearing site data, a private window, an aggressive storage-eviction policy,
  or moving to another machine.
- **A corrupt save is silently a new game.** `load()` returning `null` and
  `restore()` taking the no-save branch (`persist.js:459-470`) are the same
  path. Truncated JSON, a half-written blob, a `stored` that came back a string —
  all of them start the intro over a run that may have been forty hours old,
  with no message and no copy of what was there.
- **There is one slot.** No rolling backup, no previous-good copy. The bad write
  overwrites the good one.
- **The version marker is the key.** Bumping `v4` to `v5` is how a true schema
  break would be handled, and doing that discards every existing run outright
  with no notice. Nothing reads a `v3` key today.
- **No check covers corruption.** `test/persist-roundtrip.test.mjs` covers the
  field lists and `test/reload.test.mjs` a clean round trip; grepping `test/`
  and `src/` for `corrupt`, `truncat`, `malformed` returns nothing. Two fixtures
  exist (`test/fixtures/player-yard.json`, `stuck-yard.json`) and both are
  well-formed.

## Audio

There is none. Grepping `src/` for `AudioContext`, `new Audio(`,
`createOscillator`, `.muted` returns no matches. The only trace is a design line
at `DESIGN.md:3482` — "Sound: soft ticks on a hit, a low tone when a core banks.
Optional, off by default." Never built, and there is nowhere for a mute to live
even if it were.

## Pause

Real, and better than most. `S.paused` (`state.js:394`) is set by `hold()`
(`input.js:675-680`), toggled by the space bar and nothing else
(`input.js:664-667`), and cleared by the `resume` button in `index.html`. While
held, `main.js:67-74` skips `step()` but still runs `draw()` and `hud()` — a
paused game that stopped painting would read as a crash — and `clock.js:46-50`
reads the wall either way so nothing accumulates while you are away from it.
Input is dead (`input.js:102`). `paused` is ephemeral (`state.js:731`) and
forced false on load (`persist.js:991`), so a reload never comes back held.

The gap is discoverability: the space bar is documented nowhere a player will
look. The `#held` sheet says "paused" and offers a resume button, but you have
to have found the key to see it.

## A settings surface

There is not one. The player-reachable UI is the station boards
(`index.html`), the purse, the tooltip, the held sheet, and one `reset progress`
button that arms on first click (`input.js:335-342`). The only preference the
game remembers at all is `finished: shown` — the `#hidedone` toggle — and the
only other knobs in the game are the dev panel's, which is `import.meta.env.DEV`
only and correctly not a player surface.

So there is nowhere to put a mute, a reduced-motion switch, an export button, or
a "what is the space bar" line. That absence is the single biggest structural
gap in this list, because four separate items below all want the same shelf.

## The hidden tab, and the clock

This is the one genuine defect I found, as opposed to an absence.

`requestAnimationFrame` does not fire in a hidden tab. So no frame runs, and
`clock.js:46-50` — `if (!held) t += Math.max(0, r - wall)` — reads the wall on
the *first frame back* and adds the entire time you were away to `t` in one go.
Meanwhile `game.js:141` clamps the frame: `c.dt = Math.min(100, frameNow - S.lastFrame)`,
with the comment "a long tab-out is not a long frame", and `clock.js:79-82` caps
`frames()` at three.

The two halves disagree. Everything measured in `dt` correctly loses the away
time — nobody walks, nothing settles, no dust falls. Everything measured against
an absolute moment on `now()` jumps the whole gap at once:

- an apothecary dose (`apothecary.js:175,194,394` — `until > now()`) expires;
- a casino spin (`casino.js:62` — `now() < S.spinUntil`) resolves;
- a stirrer's next lunge, a break's end, `danceUntil`, `nextBoulderAt`
  (`core.js:84-85`) all fire on the frame you come back.

So tab away for an hour with a yard full of dosed workers and you come back to a
yard that has done no work and lost every buff you paid for. Pillar 2 says no
punishment for walking away, and this is one — a small one, but it is exactly
the shape the pillar forbids. It is not offline accrual to fix it; it is the
opposite. Either the clock should not leap while hidden, or `now()`-based
deadlines should be expressed as remaining time the way doses already are on
the save path.

Persistence across a tab-out is fine: `visibilitychange` writes
(`main.js:104`), and the one-second interval, though throttled in a background
tab, is not the only writer.

There is no offline progress and there should not be — `DESIGN.md:1421`,
"Not doing", names offline accrual explicitly.

## Window size and resize

`relayout()` (`main.js:27`) is `resize(settleIntoWorld)` plus `remeasure()`, bound
to `resize`, `load`, and `visualViewport.resize` (`main.js:97-99`), with a
500 ms poll comparing `clientWidth/Height` against `S.W/S.H` in case an event is
missed (`:100-103`). Device pixels are handled carefully in `world.js:711-722`:
the wanted ratio is `devicePixelRatio`, backed off against a fill budget
(`DEVICE_PIXELS`), then rounded so a cell is a whole number of device pixels —
which is what keeps the hairline seams out of the rock.

The layout does not respond and is not meant to. `DESIGN.md:2476` ("Fitting the
window") is explicit: the picture never scales, a small window shows *less* of
the yard rather than a smaller one, the game asks for about 840px of height, and
a shorter window loses sky off the top. `world.js:701-702` floors the world at
320×240. Ultrawide simply shows more world and the camera clamp stops at the
edge; very large windows lower the effective dpr through the fill budget.

I could not find any place this actually breaks. It is the best-covered area in
this document. What is untested is the *extremes* — nothing in either tier
asserts anything about a 320px-tall window or a 5120px-wide one, and the failure
there would be visual, which no test can see anyway.

## Touch and mobile

Further along than I expected, and short of finished.

Present: `touch-action: none` on the canvas (`style.css:23`); a coarse-pointer
media query at `style.css:712` that stacks the panel, turns the purse
horizontal, caps sheets at the viewport with `overflow-y: auto` (`:727-731`),
enlarges tap targets (`:736-741`), and swaps hover styling for `:active`
(`:742-743`); two-finger pan (`input.js:132`); and a tap that toggles a
station's board, because a finger cannot hover (`input.js:287-306`). The README
documents all of it and `vite.config.js` binds `host: true` so a phone on the
wifi can reach the dev server. Rendering at real device resolution with an
integer cell is precisely what lets a narrow screen find a scale that fits.

Missing:

- **Touch users get no tooltips at all.** `input.js:209` gates the whole hover
  block on `e.pointerType !== 'touch'`, and `showTip`/`askedAbout` live inside
  it. Every explanation in this game is a tooltip. On a phone, the game does not
  explain itself. There is no long-press path.
- **No touch equivalent for right-click**, which is how you lift a worker
  (`input.js:113`).
- **No pinch**, which is correct — the zoom is fixed by design — but a player
  will try it, and `touch-action: none` means it does nothing rather than
  zooming the page.
- The coarse-pointer query is one block. Nothing measures whether the boards
  actually fit; a phone in portrait with a nine-row board is a guess.

## Keyboard and accessibility

The whole keyboard surface is `input.js:653-670`: space toggles pause,
left/right arrow pan, and anything with ctrl/meta/alt is left to the browser.
Backtick opens the dev panel (`dev.js:328-334`), dev builds only. There is no
Escape binding — boards close on pointer-leave. There is no reset key, removed
deliberately and the reasoning is in the comment at `input.js:656-661`.

There is **no `prefers-reduced-motion` anywhere** in `src/` or `index.html`.
Every animation is unconditional: the intro cutscene with a camera pull-back,
the yard shake on a crit, the wheel spin, the rain, the corona breathing, the
camera glide when something is bought. For a player who asks their OS for less
motion, this game currently answers with all of it.

Contrast is inherently fine — the palette is six greys plus two accents, and the
one place that matters (the counter) is drawn in screen pixels so it does not
shrink with the yard (`DESIGN.md:2476`).

**Screen readers are out of scope and should be stated as such rather than
hedged.** The game is a canvas whose entire content is a simulation you watch;
there is no text alternative that would be a game rather than a description of
one. The honest move is a `<noscript>`-adjacent line and a sentence on the
distribution page saying what the game needs, not an ARIA layer over a canvas
that would help nobody.

## First load

A brand-new player gets: no loading screen, no splash, no `<noscript>`.
`index.html` is the hidden boards, the held sheet, the tooltip div, and a bare
`<canvas>`. Boot is four synchronous calls — `relayout(); restore(); buildShop();
syncWorkers();` (`main.js:85-88`) — then the first frame.

With no valid save, `persist.js:459-465` builds an empty rock and calls
`startIntro()`. The intro (`src/intro.js`) is a cutscene, not a tutorial: two
workers stood close up, chatting, then a boulder falls on one; the survivor gets
up and starts digging while the camera pulls back. Any click skips it
(`input.js:104`). It is a strong opening and it teaches nothing — deliberately,
since the first boulder is meant to teach the loop. Whether it teaches the loop
*enough* is a playtesting question nobody has data on, because there is no
instrumentation.

## What the player sees on a crash

The worst answer available.

There is **no `window.onerror`, no `error` listener, no `unhandledrejection`
handler** in shipped code. The one `addEventListener('error', ...)` is inside
`runTests()` at `src/selftest.js:80` and is removed at `:111` — dev only. The
forty-odd `try` blocks in `src/` are local guards (`save.js:4,16,24` for
storage, `input.js:115,122` for pointer capture) and none of them surfaces
anything.

Two failure modes follow:

1. **A throw during boot** aborts module evaluation before the first
   `requestAnimationFrame` is ever scheduled. The DOM is parsed, so the player
   gets an unsized blank canvas on the page background. No message.
2. **A throw inside a frame** is worse. `requestAnimationFrame(frame)` is the
   *last* statement of `frame()` (`main.js:77`), so a throw in `step()`,
   `draw()` or `hud()` skips the re-schedule and the loop stops for good. The
   canvas freezes on the last painted frame, the listeners stay attached, and
   clicks appear to do nothing. And `setInterval(persist, 1000)` keeps
   running — so a state that has just thrown gets written over the good save,
   once a second, for as long as the tab is open.

That second one is the sharpest edge in this document. A bug that would have
cost a reload can instead cost the run.

## Old browsers

`vite.config.js` sets no `build.target`, so Vite 7's default
`baseline-widely-available` applies — roughly Chrome/Edge 107, Firefox 104,
Safari 16. There is no browserslist and no legacy plugin, so the build is a
single `<script type="module">` with no `nomodule` fallback: a browser without
ESM gets a blank page and no explanation.

The code itself is conservative. `structuredClone` at `src/hooks.js:431` is the
newest API in the codebase and it is dev-path only. No `Object.groupBy`, no
`toSorted`, no `findLast`, no `OffscreenCanvas`. The CSS has no `:has()`, no
container queries, no `color-mix()`. Nothing needs to be pulled back; the target
is fine. What is missing is anything that *says so* when it is not met.

## The build

It succeeds cleanly and it is small.

```
vite v7.3.6 building client environment for production...
✓ 178 modules transformed.
dist/index.html                   5.53 kB │ gzip:   1.81 kB
dist/assets/index-Conaepxa.css   10.96 kB │ gzip:   2.84 kB
dist/assets/index-CW3NMxve.js   290.53 kB │ gzip: 106.74 kB
✓ built in 1.10s
```

307 kB raw, 111 kB gzipped, zero warnings, one second. Three files and no
others — no images, no fonts, no audio, because everything in this game is drawn
procedurally and the favicon is a deliberate empty `data:` URI. The dev panel,
the console handles and the browser suite are all folded out by
`import.meta.env.DEV`. `dist/` is gitignored.

Two things about it:

- **The asset paths are absolute** (`/assets/index-*.js`), because `base`
  defaults to `/`. The build as it stands works from a domain root and 404s from
  any subpath — which is to say it does not work on itch.io or a GitHub Pages
  project page today.
- **Filenames are content-hashed**, which is the right half of cache-busting.
  The other half is missing: `index.html` itself will be served with whatever
  cache policy the host picks, and a player mid-run who reloads onto a new
  `index.html` gets a new bundle against an old save with no notice either way.

## Deploy

There is none. No `.github/`, no workflow, no `netlify.toml`, no `vercel.json`,
no `.itch.toml`, no butler script, no `CNAME`, no `gh-pages` dependency, no
`deploy` script in `package.json`. `vite.config.js` is twelve lines of dev and
preview server config. Every build this project has ever produced has been
produced by hand and gone nowhere.

## Versioning

There is no version. `package.json` has no `version` field, no `description`, no
`license`, no `repository`. Nothing version-like is shown in game, no build hash
is injected, and there is no `CHANGELOG.md`. The only marker in the whole
product is the save key's `v4` (`save.js:1`).

So a bug report cannot be tied to a build, and a player cannot tell whether the
thing they are looking at is the thing that was fixed.

## Performance guardrails

`PERF.md` is a very good measurement log and it is not a policy. It records what
the frame cost before and after each pass — the busy fourteen-body yard at
0.121 ms/frame against 0.80 before, a restored nine-thousand-mote sky at 2.80
against 4.98 — and it states its methodology as a guardrail in its own right:
take the minimum of ten 150-frame segments, because the machine is contended,
and the sim is deterministic so before and after are the same 1800 frames.

Nothing gates. `tools/node/break-perf.mjs` prints a table and is in no npm
script. `tools/fps.mjs` counts animation frames in a real window and is likewise
manual. `test/frame-rate.test.mjs` is not a perf test despite the name — it
asserts frame-rate *independence*, that a walk covers the same distance at 30,
60 and 120 Hz, which is a correctness check against pixels-per-frame motion. No
millisecond budget is asserted anywhere in `test/`. The runtime `beat` instrument
in `main.js:41-62` is DEV only and folds to nothing in a build.

Given the project's own rule that a full suite runs once, on main, after the
merge, a perf gate would have to live in that same place or it will not be run.

---

# Part two: what to do, in order

Sizes are the project's own: **a fix** is under an hour, **a sitting** is an
afternoon and one commit, **a wave** is a spec plus tracks.

---

### 1. Do not let a throw eat the run — a fix

**What.** Wrap the body of `frame()` (`main.js:66-78`) so a throw is caught;
on a fatal, stop calling `persist`, stop rescheduling, and put something on
screen that says the game has stopped and how to copy the save out. Add a
`window.onerror`/`unhandledrejection` pair for the boot case, which throws before
any frame exists.

**Why here.** `requestAnimationFrame(frame)` is the last statement of `frame()`,
so a single throw stops the loop permanently, and `setInterval(persist, 1000)`
(`main.js:106`) carries on writing the state that just threw over the last good
save, once a second, until the tab closes. That is the one bug in this document
that converts an inconvenience into a lost run. Everything else on this list can
wait behind it.

**Open question.** What the surface says. This game has no text UI and a modal
apology would be the ugliest thing in it — but a blank canvas is worse. My
instinct is the `#held` sheet's register: one word, one line, one button that
copies the save.

---

### 2. Player save export and import — a sitting

**What.** Two buttons, plus a paste field. The export already exists in
`dev.js:220-232` and needs promoting rather than writing. Import needs a
validate-then-swap: parse, run `load()`'s shape check, keep the current save
under a second key until the new one has restored cleanly.

**Why here.** A run lives in exactly one origin's localStorage
(`save.js:1`) with no second copy, and the browser will clear it for reasons
unrelated to this game. There is also no way to move a run between machines, and
this game's whole reward is a yard you built over many hours. The dev button
exists precisely because "a report is only as good as the yard it happened in" —
that argument is at least as true for the player as for the developer.

**Open question.** Where the buttons live, which is item 4. And whether the
exported thing is the raw JSON blob (honest, huge, pasteable-into-a-bug-report)
or something base64 and opaque (tidier, harder to hand to somebody). I would
take the raw blob for the same reason `copy save` does.

---

### 3. The hidden tab must not spend the yard's clock — a fix, possibly a sitting

**What.** Decide what `now()` means across a gap. Either the clock does not leap
while the tab is hidden, or every absolute deadline is stored as remaining time
the way doses already are on the save path.

**Why here.** `clock.js:46-50` adds the whole away duration on the first frame
back, while `game.js:141` clamps `dt` to 100 ms — so the yard does no work but
every timed thing resolves at once: doses (`apothecary.js:175`), a spin
(`casino.js:62`), a break, `danceUntil` and `nextBoulderAt` (`core.js:84-85`).
Pillar 2 says no punishment for walking away and this is a small one.

**Open question.** Which fix. Not advancing the clock while hidden is one line
and makes a hidden tab identical to a pause, which is coherent and makes the
`#held` sheet's promise true for both. But `now()` would then no longer track
the wall, and `air.js:203` and `balloon.js:245` read phase off it — a wind that
skips is a visual discontinuity, though nobody is looking at it while the tab is
hidden. I lean to the one-liner and a shot to confirm nothing jumps on return.

---

### 4. A settings sheet — a sitting

**What.** One player-reachable sheet in the register of the existing boards, and
nothing on it that is not needed: mute, reduced motion, export/import, the
keyboard bindings written down, the version, and the reset button moved off the
bench.

**Why here.** Items 2, 5, 7 and 12 all need somewhere to live and there is
currently no such place — the only player preference in the entire game is
`#hidedone`, and the only other knobs are in the dev panel, which is correctly
not a player surface. Building four homes for four settings would be exactly the
"same bug patched five times" the working agreement warns about; build the shelf
once.

**Open question.** Where you reach it from. Every board in this game is a place
you walked to, and settings are not a place. The house is the closest thing to
"about you" and already carries the crew. The alternative is the one thing in
this game that is not diegetic — a corner button — which would be a real break
with the fiction and should be argued rather than assumed.

---

### 5. Reduced motion — a fix once item 4 exists

**What.** Read `prefers-reduced-motion`, respect it as the default value of a
switch on the settings sheet, and let it turn off the intro cutscene's camera
work, the crit shake, the camera glides, and the corona breathing.

**Why here.** There is no `prefers-reduced-motion` anywhere in `src/` or
`index.html` and every animation is unconditional. The intro is the first thing
a new player sees and it is a scripted camera move (`intro.js`). For a player who
asked their system for less of that, the game's first act is the worst case.

**Open question.** How far it goes. The simulation *is* the reward (pillar 4), so
this cannot mean a still yard. My read is that it should kill camera moves and
screen shake and leave the yard itself walking — the motion that is content
stays, the motion that is punctuation goes.

---

### 6. Deploy it somewhere, on purpose — a sitting

**What.** Set `base: './'` in `vite.config.js`, add a build-and-publish path,
and pick a host.

**Why here.** The built `index.html` references `/assets/index-*.js` absolutely,
so today's `dist/` 404s from any subpath — it cannot be uploaded to itch.io or a
GitHub Pages project page as it stands. And there is no CI, no workflow, no
config of any kind, so shipping is currently a manual act nobody has performed.

**Recommendation: itch.io, with a GitHub Pages mirror.** For a black-and-white
canvas incremental with no accounts and no monetization, itch is the right room:
its audience actively browses for exactly this, it hosts an HTML5 zip with no
server of your own, it gives you a page with screenshots and a devlog — which is
also the answer to item 10 — and it costs nothing. Steam via a web wrapper wants
an Electron-shaped build, a store page, a hundred dollars, and a support
obligation, for an audience that expects a different kind of thing; it is a
later decision, not a launch one. Your own domain is the most control and the
least discovery, which is why it is the mirror rather than the home. What itch
demands specifically: `base: './'`, a zip with `index.html` at its root, the
"this file will be played in the browser" flag, and a stated viewport — say
1280×840, since `DESIGN.md:2476` asks for about 840px of height.

**Open question.** Whether the itch page is the canonical one or the mirror. I
would make itch canonical and Pages the always-current build.

---

### 7. Audio, and a mute that remembers — a wave

**What.** The design line already exists at `DESIGN.md:3482` — soft ticks on a
hit, a low tone when a core banks, optional and off by default. Built with the
WebAudio oscillators the platform already has, since no new dependency is
allowed and none is needed: this game's palette is six greys and its sound
should be the equivalent.

**Why here.** There is no audio anywhere in `src/`. This is the largest single
absence between the current state and something that reads as finished, and it
is a wave rather than a sitting because "which events make a sound" is a
question about every system in the game at once — the rock, the pit, the wheel,
the star, the rain — and because a sound layer that is added system by system
will end up with no consistent voice.

It sits below the fixes above because a silent game is a game, and a game that
eats your save is not.

**Open question, and it is the whole design.** What the *rule* is, in the way
"black and white, flat shapes, no gradients" is a rule. Something like: one
sound per kind of event, never per grain; pitch carries material, not
importance; nothing loops. Without a rule of that shape this becomes a hundred
tuned constants, which the working agreement says is the bug rather than the
fix. Also: off by default, per the design line, means most players never hear
it — worth deciding whether the first core bank is the moment that offers it.

---

### 8. Touch completeness — a sitting

**What.** A long-press that shows the tooltip a mouse gets on hover, and a touch
route to lifting a worker.

**Why here.** `input.js:209` gates the entire hover block on
`e.pointerType !== 'touch'`, and every explanation in this game is a tooltip. On
a phone the game currently cannot explain itself at all. Lifting a worker is on
right-click (`input.js:113`) with no touch equivalent. The rest of the mobile
work is done and done well — the coarse-pointer block at `style.css:712`, the
two-finger pan, the tap-to-open-a-board — which is what makes this gap
conspicuous rather than expected.

**Open question.** Whether mobile is a supported target or a thing that happens
to work. That decision changes the size of this item by an order of magnitude:
"long-press shows the tip" is an afternoon, "the boards fit a portrait phone and
every interaction has a finger route" is a wave. The README already promises
phone play, so somebody has to answer it.

---

### 9. Save robustness beyond one slot — a sitting

**What.** Three things, none of them large. Keep the previous good save under a
second key and fall back to it when the primary fails its shape check. Tell the
player when that happens rather than silently starting the intro. And write the
save to a temporary key before swapping it in, so a write interrupted mid-way
cannot destroy the only copy.

**Why here.** `save.js` has one key, `load()` returns `null` for every kind of
failure, and `restore()` treats that null identically to a first-ever visit
(`persist.js:459-470`). There is also no check anywhere in `test/` for a
truncated or malformed save — the two fixtures are both well-formed. With item 1
done this becomes much less likely to be needed, which is the argument for it
being below rather than above.

**Open question.** Whether the fallback is automatic or offered. Silently
restoring an older save is its own kind of data loss if the player had already
seen the newer one.

---

### 10. Say the version, and say there is no ending — a fix

**What.** Inject the git hash and a date at build time via `define` in
`vite.config.js`, show it on the settings sheet, and put one honest sentence
somewhere a player will read it: rocks keep coming, nothing is taken away, there
is no finish line.

**Why here.** There is no version anywhere — `package.json` has no `version`
field, nothing is injected, no changelog exists — so no bug report can be tied
to a build and no player can tell whether their bug is fixed. And `DESIGN.md:1128`
("No ending") is a deliberate, well-argued design position that has never been
stated *to the player*. A player who is looking for a win screen and does not
find one concludes the game is unfinished; a player who is told there is no
finish line and that this is the point plays it as intended. The distribution
page from item 6 is the natural place for the second half, and a devlog is the
natural place for update notes.

**Open question.** Whether the no-ending line lives on the store page only, or
also in the game — and if in the game, whether it belongs on the books board,
which is the one board that is about the run as a whole rather than about a
place.

---

### 11. Cache-busting across an update mid-run — a fix, once item 6 exists

**What.** Whatever the host is, `index.html` must be served no-cache and the
hashed assets immutable. Then decide what happens when the build changes under a
player who is mid-session.

**Why here.** Vite already content-hashes the assets, so the mechanism is half
there; what is not decided is the `index.html` policy, and that decision belongs
to whoever sets up item 6, at the moment they set it up. The failure mode is
specific and nasty: a player reloads onto a newer bundle whose save handling has
changed, and neither the player nor the code knows a version boundary was
crossed — because there is no version (item 10).

**Open question.** Whether to notice at all. A small game can reasonably do
nothing here. But if `v4` ever becomes `v5`, "your save is from an older
version" needs somewhere to be said, and saying it needs both item 10 and item 4.

---

### 12. A perf gate on main — a fix

**What.** One check, in the node tier, that runs the standard busy yard and
asserts the frame cost is under a ceiling generous enough not to be flaky —
`break-perf.mjs` already produces the number and `PERF.md` §0 already states the
methodology (minimum of ten 150-frame segments, never the mean, because the
machine is contended).

**Why here.** `PERF.md` records that the busy yard went from 0.80 to 0.121
ms/frame across several passes, and nothing in either tier would notice it going
back. `test/frame-rate.test.mjs` is frame-rate *independence*, not cost. The
project's own rule puts the full suite on main after the merge, which is exactly
where a noisy timing check belongs and the only place it would survive.

**Open question.** Whether a wall-clock assertion can be made non-flaky on a
contended machine at all — the working agreement is emphatic that 25–40 ms
frames show up on main and on a branch alike under contention. The alternative,
and probably the better one, is to assert a *count* rather than a time: the
number of `ways()` allocations per frame, or columns walked per `refresh` —
a rule asserted directly rather than a threshold on a noisy statistic, which is
what the house style asks for anyway.

---

### 13. Onboarding, measured rather than guessed — a wave, and not yet

**What.** Find out what the first ten minutes actually does to a new player, and
fix what it turns out to be doing.

**Why here, and why last.** The intro is a cutscene rather than a tutorial by
design (`intro.js`, and pillar 7 — the hook is the rock, the reveal is the
core), which is a strong position, but nobody has watched a stranger play this.
There is no instrumentation and, per the no-server rule, there should be none
that phones home. What is possible without a dependency or a server: a local
ring buffer of first-session milestones — time to first swing, to first core, to
first hire, to opening the bench — written into the save and surfaced by the
same export button item 2 builds, so a willing playtester can hand you their
first hour along with their yard. That is instrumentation that respects the
rules, and it is worth nothing until somebody is actually playing.

**Open question.** Whether to build it at all before there are players. My honest
answer is no — ship items 1 through 6, put it on itch, watch three people play
it over a shoulder, and let what you see decide whether this is a wave or a
paragraph.

---

## Deliberately not on this list

- **Offline accrual.** `DESIGN.md:1421` rules it out and item 3 is the opposite
  of it — restoring the promise that walking away costs nothing, not paying you
  for it.
- **An ending, a score, a summary screen.** Same section. Item 10 proposes
  saying there is no ending, which is the honest version of the same decision.
- **A PWA and a service worker.** There is no manifest and no service worker
  today, and I do not think this game needs either: it is one 111 kB gzipped
  bundle with no assets, it loads instantly on a second visit from the ordinary
  HTTP cache, and a service worker is a whole extra update-lifecycle to get
  wrong (item 11) in exchange for working on a plane. If offline play is later
  wanted for its own sake it is a sitting, and it should come after item 11 has
  settled what an update means.
- **Screen reader support.** Stated as out of scope above, with the reason.
- **Anything with a server, an account, or money.** Not proposed anywhere.

---

## The short version

If only three things get done: **catch the throw** (item 1), **let the player
take their save with them** (item 2), and **put it somewhere people can play it**
(item 6). The first stops the game destroying a run, the second stops the
browser doing it, and the third is the difference between a thing that is
finished and a thing that has been released.
