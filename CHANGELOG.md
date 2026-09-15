# Changelog

Every bug fixed, under the version it shipped in. A fix lands here in the same
commit that fixes it, under **Unreleased**; `npm run release` turns that
heading into the version number and the date, so nobody types a number by hand.

One short line per fix, in the player's words. No account of how it looked
or why it happened -- that belongs in the commit. Features go in DESIGN.md;
this file is for things that were broken.

## Unreleased

<<<<<<< HEAD
- A stirrer caught by a refresh out on its round keeps the doses in its arms and finishes the round, instead of standing in the yard empty-handed for good. (`test/helpers.mjs`, every group)
- A body stepping on or off the quarry's ladder no longer hops eight cells back, or a course down into the cut, on every refresh. (`test/helpers.mjs`, every group)
- A refresh in the moment between rocks no longer lands the next one without a word from whoever watched it. (`test/rock.test.mjs`)
- A body stopped to gag, or held under the cursor, comes down with the rock the gang are cutting from under it instead of hanging in the air. (`test/scenes-stand-d.test.mjs`)
- A new hand stands on the ground at its station instead of sinking down out of the sky to it. (`test/rock.test.mjs`, `test/cut-pockets.test.mjs`)
- A body stopped at the loo comes down with the ground the gang are cutting from under it, like everybody else. (`test/sky-readout.test.mjs`)
- A tender that steps off its machine's seat comes down to the deck instead of hanging at the seat's height. (`test/sky-readout.test.mjs`)
- A refresh no longer clears the sky: a storm goes on brewing or pouring, the drops already falling land, the smoke still climbing keeps climbing, and the readout still says which part of the works dirtied it. (`test/sky-rain.test.mjs`, `test/wave6-sky.test.mjs`, `test/sky-fan.test.mjs`)
- A refresh under a falling rock no longer lands it at once, and one in the moment between rocks no longer skips the moment. (`test/rock.test.mjs`, `test/shield.test.mjs`)
- A rock caught by the net, the arch or the dome is still caught after a refresh; the net used to stand for good with the rock on the ground under it and the arch was never offered. (`test/shield.test.mjs`)
- A loose core can still be picked up after a refresh. (`test/pit-full.test.mjs`)
- A carter sent for a core walks round the hill rather than through it. (`test/pit-full.test.mjs`)
- A spin caught by a refresh finishes; the stake no longer sits on the table under a wheel that never stops. (`test/casino.test.mjs`)
- The last grains of a banked pot reach the hole across a refresh. (`test/casino.test.mjs`)
- Breaks, knocking off and the loo come round on time across a refresh instead of starting their clocks over. (`test/breaks.test.mjs`, `test/home.test.mjs`)
- A body that had gone indoors is still indoors after a refresh. (`test/home.test.mjs`)
- A wizard caught mid-climb keeps climbing; a balloon rider stays in the basket. (`test/tower.test.mjs`, `test/balloon.test.mjs`)
- A body walking to a new job keeps walking at the commute's pace after a refresh, and one sent for a hat still fetches it. (`test/sky-readout.test.mjs`, `test/kit.test.mjs`)
- A refresh no longer hands every worker and every machine a free swing. (`test/cut-pockets.test.mjs`, `test/drill-upgrade.test.mjs`)
- A farmhand keeps its place along the row across a refresh instead of starting from the first plot. (`test/tidy.test.mjs`)
- A carter's booking in the hole survives a refresh, so it never tips in more than it spoke for. (`test/pit-full.test.mjs`)
- A body claimed to a shed for an upgrade keeps the claim across a refresh. (`test/apothecary.test.mjs`)
- The gang down the cut move with the cut when the yard re-walks, live and on load, instead of being left in the ground beside it. (`test/apothecary.test.mjs`)
- Grains in the air are no longer lost to a refresh. (`test/tidy.test.mjs`)
- The ore notices count every cell the cut has ever given up, across refreshes. (`test/crit.test.mjs`)
- A new game after a load starts with an empty cut ledger. (`test/cut-dust.test.mjs`)

=======
- The crew only dance after the first rock and after the rescue; every other rock they get straight back to work.
>>>>>>> main
- The quarry's ore yield rungs stay bought across a reload.
- A half-dug cut no longer fills itself back in when the last quarrier climbs out to clear the yard.
- Quarriers down the cut move with it when a new pot shoves the quarry along, instead of being left standing in solid ground.
- A quarrier called away to build an upgrade gives up its column, so the rest of the gang dig it instead of leaving a spike.
- The crew get knocked off their feet for a beat when a rock lands.
- The dome comes down once the rescue is over, so later rocks land without being held.
- Every barrier is built wide enough for the rock that reaches it.
- After the first rock, the next one is down within about a second of the last cell going; the crew run clear instead of standing about.
- Rockhands clear the muck on their own rock instead of following the yard's drift to the far wall.

## v0.1.16 — 2026-09-14

- Quarriers stand on the floor of the cut after a reload instead of a course above it, working the air.
- Quarriers walking the finished floor of the cut walk on it, instead of floating a course above its dips.
- When a cut is finished the gang walks out from the floor, instead of standing up in a line above it and sliding down.

## v0.1.15 — 2026-09-14

- Quarriers no longer climb up and down the ladder for ever after a refresh caught them leaving a finished cut; the ground comes back in and they dig.

## v0.1.14 — 2026-09-14

- Ore comes up from the whole depth of a dig, not only its top layers.
- A shard that falls back into the quarry is picked up and thrown out again, instead of lying there and being buried.
- A quarrier's crit rings whether or not the swing turned up a shard.
- The quarry gives up ore about four times as fast.

## v0.1.13 — 2026-09-14

- The juggler notice needs your hands at the top of their ladder; a one-grain hand no longer earns it.
- The pin on a card is a pushpin in the bottom-right corner, not a ring at the bottom-left.
- The pinned card in the corner is as wide as the card on its board, so its name no longer runs into its pips.
- The machines are heard at a worker's pace instead of hammering, and the ram no longer sounds twice a strike.
- Rain falls at one speed and leans with the wind, instead of dropping straight down and speeding up.
- An achievement landing is hard to miss: the card is black, bigger, rings as it lands and stays longer.
- Under the dome, the rock comes down while the two of them meet, instead of after.
- The end-of-story sheet and the next shield's card wait until a cutscene has let go, instead of landing on top of it.
- A cutscene eases in instead of jumping closer and then panning.
- The net no longer trembles and sheds at full strength from the moment it catches; it strains as it pays out.
- The wizards' beams show while they cast the dome, even with a star still up, and land on the dome's growing edges.
- A wizard called to the dome flies there flat out instead of drifting across the yard for most of a minute.
- The dome's shell grows smoothly as it is poured instead of jumping a ring at a time.

## v0.1.12 — 2026-09-14

- On itch.io the save no longer fails when other games have filled the browser's storage for the site.
- When saving fails, the sheet says whether the browser blocked storage or the site's storage is full, and how full.
- A page that could not write its name beside the save no longer stands aside for a tab that is not there.

## v0.1.11 — 2026-09-14

- A carter sent to a full heap fills its hands there instead of taking one column and filling up from the rock's on the way home.
## v0.1.10 — 2026-09-13

- Quarriers no longer float up out of the cut and wander off across the
  yard after a refresh caught them climbing in; they resume digging.

## v0.1.9 — 2026-09-13

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
- A grain beside a laden carter is that carter's, unless the one that set off for it is nearer.
- A fast carter no longer strides clean over a grain on a slow frame.
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
