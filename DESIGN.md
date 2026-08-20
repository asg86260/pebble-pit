# Boulder — design plan

A short, finite, cozy incremental. No prestige, no ascension, no reset loop. One run, roughly
90–120 minutes, ends on purpose.

## Pillars

1. **Finite.** Twelve boulders, then it stops. Twelve circles end up scattered through the pit,
   one per boulder — dug out of the pile rather than displayed on a shelf.
2. **No fail state.** No timers, no losing dust, no punishment for walking away.
3. **Every upgrade changes behaviour, not a number.** New worker types over bigger multipliers.
4. **The simulation is the reward.** You watch the dust pile, the crew walk, the pit fill.
5. **Two currencies, no more.** Dust scales what you have; cores open what you don't.
6. **Shades, used sparingly.** Six greys reading rock thickness is the whole palette — it is
   depth information, not decoration. Colour is available if something should stand out later.
7. **The hook is the rock, the reveal is the core.** The first boulder teaches the loop and
   nothing else. The core is buried out of sight, so finishing that boulder is a discovery
   rather than a milestone the UI announced in advance. Later unlocks can be visible rows in
   the shop; this one should not be.

## Economy

| | Source | Spends on | Total in a run |
|---|---|---|---|
| **Dust** | one per rock pixel (two from dense rock) | numbers: carry, speed, hires, worker stats | ~35,000 mined |
| **Cores** | one per finished boulder | unlocks: new worker types, new tools | 12 |

Sweep radius is fixed at 3 cells — it was an upgrade and got cut; widening the brush changed
nothing you could feel, because carry capacity is the real limit on a sweep.

Costs grow exponentially, output grows linearly — the standard incremental seesaw. Repeatables
use `base × mult^owned`. Keep `mult` in the 1.35–1.6 band; the genre sits at 1.07–1.15 for
hundreds of purchases, but our ladders are 6–15 levels, so we need steeper.

Cores are fixed-price and scarce — twelve exist, and the unlock ladder costs exactly twelve.
Everything is buyable by the end, nothing is buyable early.

The whole dust tree below costs about 14,500. A full run mines roughly 35,000. That surplus is
deliberate: in a cozy game you should finish the tree with room to spare, not scrape at it.

## Dust upgrades

| Upgrade | Effect | Base | Mult | Levels |
|---|---|---|---|---|
| carry | +1 pixel on the cursor | 8 | 1.35 | 15 |
| hold to mine | hold the button to keep mining | 25 | — | one-off |
| mine speed | 2.2 → 13.3 px/s | 25 | 1.6 | 8 |
| hire hauler | +1 hauler | 60 | 1.5 | 6 soft cap |
| hauler load | +1 grain per trip | 50 | 1.5 | 8 |
| hauler pace | 54 → 160 px/s | 60 | 1.5 | 6 |
| hire miner | +1 miner | 70 | 1.5 | 6 soft cap |
| miner speed | 0.7 → 3.8 px/s | 70 | 1.55 | 8 |

Current build uses 1.7–1.9 on the worker ladders; that outruns income by boulder 6. Drop to 1.5.

## Core unlocks — the twelve

| # | Unlock | Cost | Opens |
|---|---|---|---|
| 1 | first hauler | 1 | grants one, opens hauler hiring |
| 2 | first miner | 2 | grants one, opens miner hiring |
| 3 | wide pick | 2 | your hits clear 5 px |
| 4 | driller | 2 | new miner type |
| 5 | barrow | 2 | new hauler type |
| 6 | chute | 3 | a permanent structure |

Twelve cores, twelve spent. Buy order is the player's choice; everything lands by boulder 12.

## The workbench

The shop is a thing in the world, not a panel bolted to the corner: a bench on the ground at the
left, opposite the pit. Coming near it opens its board; moving away closes it. It has no click target at all, so the ground it stands on sweeps like any other. Nothing about
upgrades is on screen while you are mining, which keeps the scene to rock, dust, crew and pit.

The board itself is grouped by crew — you, haulers, miners — with the headcount beside each
heading and dust costs plain, core costs marked ◆. Deliberately not an upgrade web.

## Workers

Asymmetric, not tiered — each does the job a *different way*, so the crew reads as a crew.
All of them stay plain black-and-white shapes.

**Miners (work the boulder)**

| Type | Shape | Behaviour |
|---|---|---|
| chipper | square, hollow centre | takes a seat in a ring round the rock that turns as one, but sways and drifts in and out on its own timing, and leans in when it swings; a second ring forms outside when the first is full |
| driller | square with a bite out of its side | parks on the thickest rock it can find and bores that one spot out, sheet by sheet, judder and all |

**Haulers (move the dust)**

| Type | Shape | Behaviour |
|---|---|---|
| sweeper | outlined square | walks to the nearest dust, scoops, tips it over the ledge; carries its load stacked two abreast overhead, and drops everything to fetch a loose core first |
| barrow | outlined square towing a dot | slower walk, carries 4× a sweeper's load |

**Structures (no legs, change the world)**

| Thing | Behaviour |
|---|---|
| chute | a fixed ramp on the ground; dust that lands on it slides right and falls into the pit on its own |

The chute is the cozy end state: dust starts moving without anyone touching it.

## Boulders

Boulder *n* is **n sheets thick** (capped at six) and a little wider than the last, so each one is
a longer dig. You are mining into the rock, not around it: a hit takes one sheet off the front at
that spot, and a cell holds how much rock is still stacked there.

The rock is domed — the full stack through the middle, thinning to one sheet at the rim — so the
edges break through quickly and the centre is the real work.

Shade shows what is left, relative to that boulder's own thickness: dark where it is still thick,
pale where you have worn it thin, white page where you have punched clean through. Dust keeps the shade of the sheet it came off, so the ground
and pit end up speckled with light and dark.

| # | Sheets | Radius (cells) | Rock |
|---|---|---|---|
| 1 | 1 | 13 | ~320 |
| 2 | 2 | 14 | ~740 |
| 4 | 4 | 16 | ~1,900 |
| 6 | 6 | 18 | ~3,700 |
| 9 | 6 | 21 | ~5,000 |
| 12 | 6 | 24 | ~6,500 |

About 35,000 dust across a run. Radius is clamped to the space above the ground, so the boulder
never overlaps the world on a small window.

Traits (veined, hollow, crumbling, dense) are still open as a later pass — depth gives the
progression on its own for now.

## Pacing

Per-boulder clear time is the spine. Rough targets:

| Stage | Crew | Rate | Per boulder |
|---|---|---|---|
| boulder 1 | you alone, 2.2 px/s | 2 px/s | ~10 min |
| boulder 3 | you + 2 chippers | 4 px/s | ~7 min |
| boulder 6 | 4 miners, held pick | 12 px/s | ~3 min |
| boulder 10 | full crew + drillers | 30 px/s | ~1 min |

Front-loaded effort, back-loaded watching. That shape is what makes it cozy rather than grindy.

## Ending

After boulder 12 no new boulder appears. The crew sweeps the last dust into the pit, the pit
levels off, the workers stop where they stand. No score, no summary screen, no "prestige for
+5%". The save records it as finished; clicking still spawns plain boulders forever if you want
to keep going, but no more cores drop.

## Not doing

Prestige. Ascension. Multipliers on multipliers. A third currency. Timed events. Offline
accrual. Achievement grids. Anything that asks the player to come back tomorrow.

## The goal

One million dust in the hole. The counter reads `n / 1,000,000`.

One number, and it is both: what is in the hole is the score *and* the money. Buying something
lifts that dust back out of the pile, so every upgrade is a choice between arriving sooner and
being further along right now.

Every pixel is worth exactly one, wherever it came from. Shade is how deep the rock looked, not
what it pays — the counter is a plain count of pixels in the hole.

## The pit

The pit takes the bottom third of the screen and is 240 cells wide — about two windows across, so
most of it sits off the right edge and you scroll (wheel or arrow keys) to see along it. There is
ground past its far wall, so scrolling to the end shows you the edge of the thing rather than
running out of world. That is
around 12,000 grains, and dust goes in one for one: what you mine off the rock is what fills it.

A million will not fit in it whatever we do — a million 6px cells is 36 million square pixels,
roughly 250 windowfuls. So the pile settles when it is full and each grain starts counting for
twice as much: about seven settles across a run.

## The pit never fills

A run mines ~35,000 dust; the pit holds ~1,300 grains on screen. So the pile is a picture of the
total, not a store of it. When it reaches 80% it **settles**: every column is squashed, and each
remaining grain is worth twice what it was. Eight settles across a run, each one a quiet beat
rather than an interruption. Dust can always be added, so nothing ever blocks.

Same guard on the ground: if the dust bed ever fills, further dust rolls into the pit instead of
piling up mid-air.

Dust heaped against the ledge topples in on its own once it is four cells deep there. A thin
scatter just rests against the wall — so throwing everything at the edge is a real tactic, but the
ground does not quietly drain itself and put the haulers out of work.

## Open questions
- Sound: soft ticks on a hit, a low tone when a core banks. Optional, off by default.
- Dust hangs in the air and drifts, passing at its own rate as the view scrolls, so movement
  reads without any furniture in the background.
