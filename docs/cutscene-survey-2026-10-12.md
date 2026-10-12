# Cutscene survey, 2026-10-12

The owner's note: the cutscenes feel janky; they should be more deliberate;
the background should fade so the focus is on the subjects; the ending is
chaotic -- the attackers should stop, the haulers should fade out, and you
should be able to see what the squares are doing after the rescue.

This is a survey of every scene that takes the camera or the yard, drawn from
frame-exact captures. No game code was changed for it; two scenes were added
to `src/scenes.js` so a capture can start at the top of a scene: `props>`,
`net>`, `arch>`, `dome>` (the rock let go over a finished shield) and
`ending-busy` (the whole ending on a yard with a big crew, the ram and the
belt bought).

## How the frames were taken

A headless 800x600 page on a dev server, motion preference on (a headless
browser asks for reduced motion, which turns the camera's moves into cuts),
`__still(true)` so the page's own loop does not step the yard, and one
`__fast(step)` between shots. Frame numbers below are `f<n>` at the step named
for each capture, so `f17 @0.05s` is 0.85 s in. A per-frame log of the beat,
the shot, the zoom, the camera and how many bodies were in view sits next to
each capture as `log.json`.

The contact sheets are in the worktree's `shots/` folder, which git ignores:
`C:/git/boulder-clicker/.claude/worktrees/agent-aa827c810e808c0fb/shots/cut/`.

| sheet | what it covers |
|---|---|
| `sheet-rescue-in.png` | the dome's scene coming in, f12-f34 @0.05s |
| `sheet-rescue-a.png` | the rescue, f0-f15 @0.25s |
| `sheet-rescue-b.png` | the dig, the two together, the way out, the sheet, f16-f100 @0.25s |
| `strip-rescue-ground.png` | the ground line through the rescue, cropped and blown up |
| `sheet-busy-1.png` | the same on a big crew (`ending-busy`), f0-f104 @0.25s |
| `sheet-ending-drown.png` | the sheet, then the drowning, f88-f140 @0.25s |
| `sheet-ending-snatch.png` | the snatch on the small crew, f142-f199 @0.25s |
| `sheet-busy-2.png` | the snatch on the big crew, f140-f205 @0.25s |
| `sheet-snatch-fine.png` | the rise, the take and the sink, f18-f66 @0.05s |
| `sheet-snatch-leap.png` | her leap and the empty water, f66-f139 @0.05s |
| `sheet-opening.png` | the opening from the house, f0-f119 @0.2s |
| `sheet-reunion.png` | the reunion, f0-f59 @0.2s |
| `sheet-props.png`, `sheet-net.png`, `sheet-arch.png` | each shield's answer from the rock let go, @0.2s |
| `sheet-firstmuck.png` | the first muck, f0-f29 @0.2s |
| `sheet-tear.png` | the tearing, f0-f44 @0.2s |
| `sheet-abyss.png` | the first trip down, f0-f69 @0.2s |
| `sheet-kill.png`, `strip-kill-pair.png` | the kill and him freed, f0-f55 @0.25s |

## Every scene

The table is `BEATS` in `src/beats.js`. The camera's framing is
`src/cutscene.js`; the yard's beats are in `src/intro.js`, `src/snatch.js`,
`src/firstmuck.js` and `src/abyssintro.js`; `src/stage.js` walks bystanders
out of the frame for two of them.

| beat | owns | what it is | stage.js clears it? |
|---|---|---|---|
| leave, chat, fall, down, up, show | yard | the opening: the pair walk out, the rock comes down on one | no |
| meet, part | yard | the reunion after the first rock | no |
| props, net, arch | camera | a shield's answer, the rock leaving the sky | no |
| dome + rescue | camera + yard | the dome's answer and the dig | yes, from the rock leaving the sky to the end of `rescue` |
| ending | sheet | the sheet after the rescue (2 s with the second half on) | no |
| tear, drown | camera | the hole giving way, then drowning | no |
| firstmuck | camera | the first body sent to the first muck | no |
| snatch + snatchcam | yard + camera | the serpent takes him, she leaps after | yes, for the length of `snatchcam` |
| abyss | camera (deep) | the first trip down | no |
| freed, freedsheet | yard, sheet | the kill, him out, the sheet | no |

Nothing else is quieted during any scene. `ownsYard()` stops new rocks rolling
in (`core.js`, `rock.js`) and stops the crew's own stepping only for the
opening's pair; the machines (ram, jaw, tiller, belt), the weather, the
sky motes and birds, and in the deep the party and the gatherers and the fish
all keep running through every scene.

## What reads as janky, scene by scene

### Common to every yard scene

- **The zoom moves in snapped steps.** `setZoom` snaps to whole device
  steps, so a pull-in over `CUT_IN_S` (0.5 s) is one to three visible jumps:
  0.833 -> 1.0 in a single frame for the dome (`rescue-in` f17 @0.05s),
  0.833 -> 1.167 -> 1.333 for the snatch (`rescue-stage` f142-f144 @0.25s),
  1.333 -> 1.167 -> 1 -> 0.833 one step a frame on every way out
  (`rescue-stage` f86-f87, `snatch-fine` f136+, `props` f22-f25). It reads as
  a snap, not a push.
- **The pan is a chase, not a move.** `CUT_GLIDE` takes 12% of the gap a
  frame, so 500 world pixels are covered in about half a second, fast at the
  start, and the camera is still sliding when the thing it went to see
  happens (see the dome and the shields).
- **The ground line jumps.** The vertical seat walks over the same 0.5 s:
  in `rescue-in` the ground goes from about y=160 to y=470 between f14 and
  f18 @0.05s; on the way out it drops again and the bottom chips come back.
- **The interface pops in and out.** The story card, the "build the bench"
  chip, the pit's ruler and the pile mark vanish in one frame as a scene
  takes the camera (`rescue-in` f12 -> f14) and pop back as it lets go
  (`rescue-stage` f88, `props` f24, `arch` f44, `snatch` f190 the objective
  card, `abyss` f42).
- **The background never quiets.** Clouds drift, motes and birds cross
  (`snatch-fine` f99-f135, two birds crossing the held empty water), the
  machines run and, outside the two staged scenes, the crew walk through.

### The rescue (dome + rescue), the start of the ending

- **The camera arrives as the rock lands.** The scene starts on the rock
  leaving the sky (`rescue-in` f14), the pan and the zoom snap take until
  about f20, the rock is on the dome at f25 and bursts at f27: the burst
  happens a quarter second after the frame settles. There is no held impact:
  the rock is whole one frame and a dust cloud the next.
- **Bystanders get "!" marks as they walk off,** popping on at the frame's
  edges (`rescue-in` f26-f34) -- the eye goes to the edges at the exact
  moment of the burst.
- **The dig is long and small.** About eleven seconds (`rescue-stage` f6 to
  f50 @0.25s) of two bodies three cells tall in the middle of an 800-pixel
  frame that is mostly empty dome and sky (`sheet-rescue-b`). Progress is not
  readable at that size.
- **After the rescue the two walk out of the middle.** Once she is out
  (f50) the pair walk right to the foot of the dust heap and stand there with
  hearts (f56-f72), at the frame's right edge and overlapping the heap's dark
  mass (`strip-rescue-ground`, rows f56-f72). The middle of the shot, where
  the dig was, is empty. This is the "can't see what the squares are doing".
- **The stage lets go before the shot does.** `rescue` ends at f73, the stage
  is released, and six to ten bodies walk back in over f74-f86 while the
  dome is still fading and the camera is still the scene's (`strip-rescue-ground`
  f78, f84; `sheet-busy-1` f80). The pair's moment is crowded out.
- **The stood-off crew stay in view.** `stepStage` walks bystanders to just
  outside the scene's frame and stands them there facing in, but in the
  captures they are still on screen: a row of bodies at the frame's left
  edge through the whole snatch (`sheet-busy-2` f145-f180), and all of them
  in view as soon as the camera eases out. Why the stage's measured frame and
  the drawn one differ was not traced.
- **The sheet is short and lands on a moving yard.** With the second half
  on, the "it's over" sheet stands `RESCUE_SHEET_HOLD_S` (2 s, f92-f99), over
  bodies walking under it, and floats off as a chip pops in (f100).

### The drowning, between the rescue and the snatch

- **A one-frame swing.** The drown's camera takes the shot at f103 and the
  zoom pumps 0.833 -> 0.667 -> 0.833 while the seat jumps 860 world pixels to
  the right in one 0.25 s step (`ending-busy` log f103-f104).
- **Eight seconds of a still pool.** `CUT_DROWN_S` is 8; nothing new reads
  after about f112 (`sheet-ending-drown` f112-f140).
- **Cut off by the snatch.** The drown's way out starts at f136 and the
  snatch's camera takes over at f142 mid-ease, so the zoom goes back in
  without having finished going out.

### The snatch, the end of the ending

- **The rise is a pop.** The head comes up in about 0.25 s (`snatch-fine`
  f23-f27 @0.05s) with no anticipation on the surface beyond the portal
  ring; at the 0.25 s sampling of the full run it is visible in one frame
  (`sheet-ending-snatch` f162).
- **The take is the one good hold** (f28-f47, about a second, him in its
  jaws), then the sink is 0.3 s (f47-f53).
- **Her leap is tiny and quick.** She stands with "!" for 1.35 s, then the
  leap is 0.65 s (f80-f93) for a body three cells tall at the snatch zoom.
- **The held empty water is busy.** 1.5 s of empty surface (f96-f126) with
  birds crossing the sky the whole time.
- **The walk out is long against the rest.** Three seconds of the two
  walking out to the plank (`rescue-stage` f142-f154) against a quarter
  second for the serpent.

### The opening (leave, chat, fall, down, up, show)

- **The chat is long.** About nine seconds (`sheet-opening` f21-f66 @0.2s) of
  the same heart and dots alternating.
- **The way out of the close-up is five zoom snaps** (f81-f91: 2 -> 1.833 ->
  1.667 -> 1.5 -> 1.333 -> 1.167 -> 1 -> 0.833), and the ground line drops
  from the middle of the frame to the bottom third with it.
- The fall itself is good: a held close-up with the rock filling the frame
  (f72-f78).

### The reunion (meet, part)

- **The camera teleports in.** One frame from the house to the rock at zoom
  1.333, then snaps to 2 over 0.6 s (`sheet-reunion` f0-f4).
- **Five snaps out** (f27-f34) and the objective card pops in on the end
  (f42).

### The shields' answers (props, net, arch)

- **The props break before the camera has settled.** The scene starts f4,
  the zoom snaps f5, and the props are gone between f6 and f8 @0.2s
  (`sheet-props`); the break is never held. The scene lets go at f22.
- **The net is the opposite: six seconds of a slow sag** (`sheet-net` f8-f35)
  and then the rock is gone between two samples (f35 -> f38).
- **The arch holds about 2.6 s** then the rock vanishes between f17 and f20.
- None of the three clears the stage: the buried one's "!" and the bodies
  under the shield stay in the shot, and bodies walk through.

### The first muck

- **A snap in.** Zoom 0.833 -> 1.333 in one 0.2 s step, with a 280-pixel
  jump (`sheet-firstmuck` f0 -> f1), then 1.5 at f2.
- **Others keep working in the frame.** Three bodies on the rock keep
  swinging through the whole scene (f0-f16) while one walks to the muck at
  the left edge; the eye is on the rock, not on the walker.
- It is short (about 3.4 s) and its way out is four snaps (f17-f21).

### The tearing

- **The tear is framed on the rock in the sky.** The rings wrap the rock and
  the pit, which is what is giving way, is off the bottom of the frame
  (`sheet-tear` f3-f27).
- The way out is three snaps (f28-f31). (At f39 the reunion fires: that is
  the scene's setup, not the game.)

### The first trip down (abyss)

- **Fish cross the frame throughout** (skeleton fish, the eye; f0-f30), in
  front of the push onto the belly and the cage.
- The camera's push and pull are otherwise smooth (the deep has its own
  framing); the serpent's bar comes back as it lets go (f33) and the
  objective card pops at f42.

### The kill and him freed (freed, freedsheet)

This is the other ending, and the owner's words fit it as well as the
rescue: **the attackers do not stop** -- a fighter keeps swimming circles
through the frame while the serpent goes limp and comes apart (`sheet-kill`
f3-f24) -- **the gatherers and the fish keep crossing**, and **you cannot see
what the two do once he is out.** He walks out as one small square
(`strip-kill-pair` f18-f26), the camera swings about a thousand world pixels
to her station and zooms out in two steps (f26-f44), and the reunion
happens inside the station's glass, under the "it's over" sheet (f44 on).

## The shortest list, by size of the problem

1. Nothing in the background quiets for any scene: machines, attackers,
   weather, birds, motes, fish, the deep's party and gatherers all run.
2. The zoom moves in visible snaps on the way in and out of every yard scene.
3. The camera arrives as the moment happens (dome, props, arch, net break),
   and the impacts are not held.
4. The stage clears only two scenes, leaves the stood-off crew in view at the
   edge, and lets them back in while the scene is still on.
5. After each rescue the pair are small, off-center or hidden (by the heap in
   the yard, by the station and the sheet in the deep).
6. The pacing is uneven: an eleven-second dig, an eight-second still pool and
   a nine-second chat next to a quarter-second serpent rise and a
   two-second sheet.
7. The interface pops off and on at each end of every scene.

The mock that goes with this is `docs/mocks/cutscene-focus-2026-10-12.html`.
