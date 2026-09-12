# The itch page

Copy for the store page, in the game's own voice. The game is played in the
browser on the page itself (the `html` channel -- `bun run publish`); the
Windows portable is offered underneath for anybody who wants it as an app
(`bun run publish -- --desktop`). Says the deliberate things up front -- no
offline progress, no ending, where the save lives -- so they are the
description and not the complaint.

**Embed settings:** viewport 1280 x 800 (the boards want at least 960 x
600), fullscreen button on, "mobile friendly" off, orientation landscape.
Click into the frame once before keys work; that same click wakes the sound.

---

**Boulder**

A rock. A hole. A few people between them.

Click the rock. Throw what comes off it into the hole. Hire somebody to do
that for you, then somebody to feed them, then somebody to sweep up after
the machines. Watch the sky get worse. Decide whether to do anything about
it.

Black and white, six greys, everything on a six-pixel grid. Nothing
teleports: every body walks to every job, and the whole thing is watchable
cause and effect. There is no music -- you hear the yard, not the game.

**Things to know**

- **Nothing happens while it's closed.** The yard runs while you watch it
  and stops when you don't. That's on purpose; it isn't a chore you check
  in on.
- **There is no ending.** Rocks keep coming. You'll know when you're done.
- **Your save lives in this browser.** It autosaves every second, and
  `save a copy` on the pause sheet (esc) puts it on your clipboard -- do
  that before you clear site data or switch machines, and `load a save`
  takes it back. The desktop build below keeps its save as a file instead.
- **Sound is on, and quiet.** The mute and a volume are on the same sheet
  and remember.
- **Click once to start.** Browsers allow no sound and no keys until you do.

**The desktop build**

The same game as a Windows app, if you'd rather have it on the taskbar:
your save becomes a file with a backup beside it, the window remembers
where you left it, and F11 goes full screen. It is unsigned -- Windows will
show "Windows protected your PC" the first time; "More info > Run anyway".
Downloading through the itch app skips that. It is 110 MB for a 300 kB
game; the rest is the desktop shell (Electron). Sorry about that.

Free. If you liked it, the tip jar is there.

---

**Channels:** `html` (play in browser, the default), `windows-portable`
(the app). No installer channel: the portable is the same thing with no
SmartScreen fuss about an uninstaller. Mac and Linux when there is a
reason and a machine.

**Tags:** idle, clicker, incremental, pixel-art, black-and-white, singleplayer

**Pricing:** $0, pay what you want, no minimum.
