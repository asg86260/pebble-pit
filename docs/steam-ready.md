# Getting ahead of the Steam review (2026-09-12)

The plan is itch first, free and pay-what-you-want, and Steam at a few
dollars only if itch shows a pull. This is the list of what a Steam review
of a small Electron idle game says, written before anybody has said it, with
what answers each one. Ticked means built; the rest say what they wait on.

## Built

- [x] **"It forgets my window every time."** The shell writes the window's
  bounds, maximized and full-screen state to `window.json` in userData and
  opens there next time -- only if a display still shows a corner of the
  rectangle, so an unplugged monitor cannot strand it. `electron/main.cjs`.
- [x] **"No full screen."** F11 and Alt+Enter toggle it, in the shell.
- [x] **"Escape doesn't pause."** It holds now (landed on main as `a93d10f`, Escape rather than space); the
  sheet's key line says so.
- [x] **"No way to quit."** A window with no menu bar had Alt+F4 and nothing
  else. `quit` is on the held sheet on the desk (hidden in a browser).
- [x] **"111 MB for this?"** Only `en-US` ships (`electronLanguages`),
  which is a few MB. The rest is Chromium and is the price of the desk;
  the page says so plainly (see `docs/itch-page.md`).
- [x] **"Where's my save?"** `save a copy` writes a file where the player
  chooses; the autosave is `%APPDATA%/Boulder/saves/current.json` with a
  `last-good.json` beside it. Written on the page.
- [x] **"No offline progress." / "There's no ending."** Both deliberate,
  both said on the page and on the sheet rather than discovered.

## Waits on you

- [ ] **"It uses CPU minimized."** True: `backgroundThrottling: false`
  keeps rAF at sixty a second while minimized, and the page cannot tell it
  is hidden (Chromium reports `document.hidden` false under that flag), so
  the yard steps *and paints* for nobody. Two honest shapes, and the design
  picked the first without the cost in front of it: (a) keep it -- the yard
  runs while the window exists, closed is the only "off"; or (b) throttle
  while minimized (`setBackgroundThrottling(true)` on minimize, off on
  restore), which stops rAF and so pauses the yard until it is looked at
  again -- the clock clamp already makes that a clean pause. (b) matches
  "nothing happens while it's closed" and kills the complaint; (a) matches
  the desk design as written. Your call; either is ten lines in
  `electron/main.cjs`.

- [ ] **"Windows says it's a virus."** SmartScreen on an unsigned installer.
  A code-signing certificate is the only real answer (Azure Trusted Signing
  is about $10/month; an OV cert is a few hundred a year). Until then the
  portable build plus a line on the page ("unsigned; SmartScreen will ask")
  is what everybody else does. Your call and your money.
- [ ] **"Generic icon."** The taskbar and the installer show Electron's.
  Wants a 256px black-and-white icon in the game's register -- the rock, the
  square, the hole. More than one reasonable shape, so options as shots
  before one is drawn (`build.icon` in package.json takes a `.ico`/`.png`).
- [ ] **"Sound is [too loud / grating / mute button only]."** Nobody has
  listened. The `SND_*` knobs on the dev panel are for that afternoon. If a
  volume control is wanted beside the mute, it is a new control with more
  than one shape (a slider is not in the sheet's register of buttons).
- [ ] **"No cloud saves."** Steam Cloud needs Steamworks; itch has none.
  A Steam wave if there is a Steam wave. Export/import covers moving a
  save between machines by hand.
- [ ] **"Doesn't work on Steam Deck / no controller."** Mouse and two keys.
  Not for this release.

## Argued against, on purpose

- Offline accrual (DESIGN.md, the pillars; release-readiness "deliberately
  not on this list").
- An ending.
- Telemetry, auto-update, a launcher. Updates are a devlog and a download.
