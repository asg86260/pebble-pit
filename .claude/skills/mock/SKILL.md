---
name: mock
description: Mock a look or behavior change for the owner to vote on before any game code is touched (CLAUDE.md, "A design change is mock, vote, build"). Use when the owner asks to change how something looks or moves, or a follow-up tweak to something just built ("make it weirder", "lower it"), or a control or visual has more than one reasonable shape.
---

# Mock, vote, build

No game code is touched until the owner has voted on a mock. The mock is a
page drawn from plain shapes, not the game, and it says so.

## Steps

1. **Pick the options: two to four that really differ in shape.** Do not pad
   with near-duplicates. Name the cost of each up front. Examples of costs:
   - a sim change (bodies have to walk a new ground);
   - what it hides (feet, a station's base);
   - what it moves (rosters, signs);
   - which rule it presses on (no overlap, the palette).

   If one option is the cheap one (drawing only), include it so the owner
   can see what the others buy.
2. **Copy the template** to the scratchpad:
   `cp .claude/skills/mock/template.html <scratchpad>/<topic>-mock.html`.
   Fill in the heading, the plain-shapes note (what each shape stands for and
   what the mock cannot show) and `OPTS`: a letter, a name, a draw function
   `(ctx, t)` and a caption. Draw on the game's grid with `cell()`. Animate
   with `phase()` only where the change is motion.
3. **Look at it before sending it.** Shoot it with the headless shell and read
   the picture:
   `<playwright shell> --no-sandbox --screenshot=<out>.png --window-size=1100,1300 --virtual-time-budget=3000 file://<mock>`
   (`tools/cdp.mjs`, `shellExe`, finds the shell). What made the last ones
   read:
   - Give a cloud or a heap tones. A white crest over a pale body reads as
     cloud; an outline alone on white reads as a jagged line.
   - Overlap round shapes so their tops scallop. Puffs set apart read as noise
     along a line.
   - Use the game's scale. A shape a cell or two tall disappears at the panel's
     size, so check it at real size before calling it subtle.
   - Show what the option does to what stands on it: stations, a worker
     walking (a square moving along the ground), feet.
4. **Send it and ask for the vote.** Send the HTML file to the owner, with
   one line per option and your pick with its reason. Do not build.
5. **Build the one chosen.** Then take shots with `tools/look.mjs <scene>`
   and compare them against the mock. A follow-up tweak to it is a new mock
   before it is new code, unless it is a number the owner named ("six cells
   lower").

## After a build is tried and dropped

If the owner tries a built option and changes their mind ("not quite right,
try the other one"), go back to the mock's other options. Do not invent a new
one. Revert or replace the dropped one's code, so two mechanisms are not left
side by side.
