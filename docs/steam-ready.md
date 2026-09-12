# Getting ahead of the Steam review (2026-09-12)

The plan is itch first, free and pay-what-you-want, and Steam at a few
dollars only if itch shows a pull. On itch the game is the browser build
(`bun run publish` pushes `dist/` to the `html` channel), with the Windows
portable beside it; the Electron shell is for Steam. So on itch the
installer complaints below do not arise at all -- they are here for the
day the desk is the product. On itch the game is the browser build
(`bun run publish` pushes `dist/` to the `html` channel), with the Windows
portable beside it; the Electron shell is for Steam. So on itch the
installer complaints below do not arise at all -- they are here for the
day the desk is the product. This is the list of what a Steam review
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

- [x] **"It uses CPU minimized."** Decided 2026-09-12: the yard keeps
  running while minimized; closed is the only off. The cost stands and is
  accepted. Originally: `backgroundThrottling: false`
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

- [x] **"Windows says it's a virus."** Decided 2026-09-12: not signing.
  What that costs, so it is known rather than found out: every browser
  download of the installer or the portable gets the blue "Windows
  protected your PC" sheet (More info > Run anyway) until that exact file
  has been run enough times to earn SmartScreen reputation -- and every new
  build is a new file, so it starts over each release. Downloads through
  the itch app carry no mark-of-the-web and get no sheet. Some antivirus
  products flag unsigned Electron installers on sight; nothing to do but a
  line on the page. A mac build would be worse: Gatekeeper refuses an
  unsigned, unnotarized app outright ("damaged") and the workaround is a
  terminal command, which is why there is no mac channel until there is a
  reason for one. The page says all of this in one line.
- [x] **"Generic icon."** The rock on its line, chosen from five drafts
  (`shots/icons-sheet.png`), 2026-09-12: `build/icon.png` (512, the source
  electron-builder cuts the .ico from) and `public/icon.png` (64, the
  page's favicon, copied into dist/). Drawn as a 16x16 map scaled with no
  smoothing, so it is the same pixels at every size.
- [x] **"Mute button only."** A slider under the mute, 2026-09-12: a share
  of the designed level, so all the way up is still the quiet the mix was
  pitched at. `volume` in prefs.js, `setVolume` in audio.js.
- [ ] **"Sound is [too loud / grating]."** Nobody has listened. The `SND_*`
  knobs on the dev panel are for that afternoon.
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
