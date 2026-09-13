# Changelog

Every bug fixed, under the version it shipped in. A fix lands here in the same
commit that fixes it, under **Unreleased**; `npm run release` turns that
heading into the version number and the date, so nobody types a number by hand.

One short line per fix, in the player's words. No account of how it looked
or why it happened -- that belongs in the commit. Features go in DESIGN.md;
this file is for things that were broken.

## Unreleased

- Quarriers come back from a refresh on the floor of the cut and keep
  digging, instead of on the far bank with a slow walk round to the ladder.
- Quarriers work the cut in pockets on a swing you can see, along a stretch,
  and never dig one column into a slot; a blaster's swing bursts.
- Holding the button on the rock stops while the rock's pile is full.
- A ladder stays on its board, greyed, when its next rung needs plots or a
  quarry the yard does not have yet.
- A janitor stands still between shovel swings and faces the mess.
- Two janitors on the last patch of a mess no longer shove each other about.
- A janitor with a shovel in its hands no longer reads as "on a break".
- A laden carter sweeps home, taking everything it walks over, and never turns round.
- A carter asks the hole again before giving up on a heap.

## v0.1.5 — 2026-09-13

- Tabbing away from the page reset the game. A store with no tab name in it
  was being read as another tab's store; now it is the same game.

## v0.1.4 — 2026-09-13

- The crew list pushed the house board around when it opened. It pops over
  the board now, one card wide, with the door as its own row on top.
- Six house checks that a commit cut by accident are back.
- A grain going into the pit paid no dust. It has its own dust gain now.

## v0.1.3 — 2026-09-12

- A release with butler missing from PATH committed and tagged before it
  failed. The check runs first now, on a clean tree.

## v0.1.2 — 2026-09-12

- A reset left behind fields the save throws away. It puts down everything
  off the `SAVED` declaration now, so the two can not drift apart.
- A card's price showed a count on its way rather than its value.
- The tower's rows said something different from every other board's for a
  build in progress. They say "building" and "in line" like the rest, and a
  waiting row reads "queued up in n".
- An achievement landing was silent. It is said out loud now.
