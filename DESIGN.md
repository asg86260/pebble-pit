# Boulder — design plan

A short, finite, cozy incremental. No prestige, no ascension, no reset loop. One run, roughly
90–120 minutes, ends on purpose.

## Pillars

1. **It does not end.** Rocks keep coming, each a little bigger than the last until they
   plateau. One core per rock, so a core is a rock, and cores are what open everything.
2. **No fail state.** No timers, no losing dust, no punishment for walking away.
3. **Every upgrade changes behaviour, not a number.** New worker types over bigger multipliers.
4. **The simulation is the reward.** You watch the dust pile, the crew walk, the pit fill.
5. **Each currency has one job.** Dust scales what you have, cores open what you don't,
   and the lab resources multiply the whole operation. A resource that does two jobs is
   a resource too many.
6. **Shades, used sparingly.** Six greys reading rock thickness is the whole palette — it is
   depth information, not decoration. Colour is available if something should stand out later.
7. **The hook is the rock, the reveal is the core.** The first boulder teaches the loop and
   nothing else. The core is buried out of sight, so finishing that boulder is a discovery
   rather than a milestone the UI announced in advance. Later unlocks can be visible rows in
   the shop; this one should not be.

## The world

Every site stands on one ground line. Progression is linear and physical: the world runs off to
the **left** as you unlock things, so walking further out *is* the tech tree.

```
   farm        cave        rock      [bench] [lab]        pit
    ◇            △          ▲▲▲                            ▣
  ──────────────────────────────────────────────────────────────
```

You start with the **rock**, the **bench** and the **pit** and nothing else. Ground to the left
is empty until a site is unlocked there.

| Site | Gives | Unlocked by |
|---|---|---|
| **rock** — a craggy outcrop sitting on the ground | dust ■, and a core ◯ when it is finished | you start here |
| **quarry** — an open cut; crew work its floor where you can see them | shard ◈ | cores |
| **farm** — something growing on the spoil; crew tend it | spore ◇ | cores |
| **bench** | spends dust and cores | — |
| **lab** | spends shard and spore on multipliers, and shows the stats page | cores |
| **pit** | holds it all | — |

The rock is a **hill**: flat on the ground, irregular on top, worked from above by a crew
standing on it.

All the art is flat shapes: no textures, no gradients. It is a black-and-white game and mostly
stays one — **the ground is always grey**, because grey is how deep the rock was and that is the
only thing it is allowed to mean.

**Colour arrives slowly, and only where it means something.** The first of it is what the sites
give up. A shard and a spore never came off the rock, so a colour can say something about
them that shade cannot: the cave is a cold blue, the farm is green because it grew, and that is the whole palette for now. Each grain carries **its own tone** out of four, so a heap of shards speckles the way a heap
of dust speckles.

That also settles how they are drawn. Out in the yard they are solid cells painted by the same pass
that paints the dust, which is the only thing that tiles: a triangle fills half its cell however
neatly it stacks, so a heap of triangles is half air by geometry. The **shapes are kept for the
counter and the shop**, where there is room and white paper behind them, so the shape and the
colour are learned together. The cave is a shaft that narrows
as it goes down, the farm is a stalk per bed with a spore on top when it is ripe, the lab is a
block with a chimney. If a shape needs shading to read, it is the wrong shape.

## The lab

The bench sells you **more** — another miner, another worker, another trip. The lab sells you
**faster**, and it is the only place a multiplier lives.

Everything it sells is a *rate*, never a yield: a pixel of rock is worth exactly one dust
wherever it came from, and that rule stays. Growth comes from doing the same work sooner.

| Row | Costs | Multiplies |
|---|---|---|
| sharper picks | shard ◈ | every swing, yours and the crew's |
| stronger backs | shard ◈ | worker pace and scooping |
| deeper shafts | spore ◇ | cave trips |
| richer beds | spore ◇ | tending |

Four ladders and an apex, and no more. Five currencies with a wall of percentages behind them is
where cozy turns into a spreadsheet.

It also keeps the books, because nobody can tell whether a purchase helped by watching a pile:
dust, shards and spores a minute, smoothed, plus what is in the hole, rocks finished and the size
of the crew. Rates are read off **lifetime totals**, never off the balance — reading them off the
balance made a big purchase show as forty thousand dust a minute of *negative* production.

## Crew

**There is one kind of body.** You hire a worker, and where it works is a separate question you
can answer again whenever you like. A worker with no job carries dust to the pit, so hauling is
not a job you hire into "+D+" it is what the ones you have not put anywhere are already doing.

| | Costs | What it is |
|---|---|---|
| first worker | ◯ 1 | the one body you buy with a core |
| workers | ■ 60, then 81, 109... | every body after that |
| on the rock / down the cave / at the beds | free, both ways | where they work |

Sites are still bought with cores "+D+" the cave at ◯ 3, the farm at ◯ 5 and the lab at ◯ 7 "+D+" but a site now buys the **place** and nobody in it. Who works it is the same question as who
works the rock, asked again.

That is the whole trade: a body on the rock is a body not carrying, and the dust it knocks loose
piles up on the ground until somebody fetches it. Nothing is spent to change your mind, because a
decision you cannot take back is one you make by reading a wiki rather than by watching the yard.

One pool also means one price curve. It is gentler than the four it replaced "+D+" 1.35 a body rather
than 1.7 "+D+" because it is no longer four separate ladders climbed in parallel.

The cave and the farm ask for the same thing in different shapes. A spelunker spends its time
**away** — down the shaft, off the surface entirely. A farmhand spends its time **standing at a bed** — stooping over
it on its own rhythm and shifting its weight between times, because a farm should look tended
whether or not anything is ripening this second. Either way the body is not carrying dust, which is what makes assigning one a
decision rather than a free tap.

## Economy

| | Mark | Source | Spends on |
|---|---|---|---|
| **Dust** | filled square | one per rock pixel, always | numbers: carry, speed, hires, worker stats |
| **Core** | ring | one per rock finished | places: the quarry, the farm, the lab, and the picks |
| **Shard** | triangle | a spelunker's trip | lab: swing and haul pace |
| **Spore** | hexagon | a bed cut | lab: cave and tending pace |

Each has exactly one job. Dust is the only one you can also *see* — it is the pile in the pit,
and the pile is the dust rather than a picture of it.

Sweep radius is fixed at 3 cells — it was an upgrade and got cut; widening the brush changed
nothing you could feel, because carry capacity is the real limit on a sweep.

Costs grow exponentially, output grows linearly — the standard incremental seesaw. Repeatables
use `base × mult^owned`. Keep `mult` in the 1.35–1.6 band; the genre sits at 1.07–1.15 for
hundreds of purchases, but our ladders are 6–15 levels, so we need steeper.

Cores are fixed-price and scarce: one a rock, for ever. The ladder of places costs twenty-seven
of them and the pick competes for the same pile, so nothing is buyable early and the order is
the player's to choose.

Dust should never be the thing you are short of for long. In a cozy game you finish a ladder with
room to spare rather than scraping at it; the scarce thing is cores, and cores are just time.

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

## Core unlocks

A core is a rock, so this ladder is really "how many rocks until everything is open".

| Unlock | Cost | Opens |
|---|---|---|
| first worker | ◯ 1 | the crew: one body, and hiring for dust from then on |
| open the cave | ◯ 3 | the shaft, to put workers down |
| break the ground | ◯ 5 | the beds, to put workers at |
| build the lab | ◯ 7 | multipliers and the books |
| pick | ◯ 2, then 3, 4... | one more pixel a swing, for you |
| miner bite | ◯ 3, then 4, 5... | one more pixel a swing, for every miner |

Twenty-five cores opens every place. The two picks compete with all of it for the same cores, which
is the one real spending decision in the game: pace now, or a new place to put people. Your swing
and a miner's are bought apart — one row that bought both was doing two jobs at once, and it sat
under `you` while half of what it paid for was out on the rock.

Opening a site glides the view to it. It is four cores and a row in a menu, and the thing bought
is off the left of the screen; without that, nothing appears to happen.

## Catching

Swinging and catching are separate gestures. A press on the rock is a swing and nothing else — it
never collects its own spray. To catch, press below the rock and swipe through the falling dust:
pixels in flight that pass near the cursor land on it instead of the floor. The rock takes a swing
anywhere in its footprint, so clicking its general area stays easy.

## The workbench

The shop is a thing in the world, not a panel bolted to the corner: a bench on the ground at the
left, opposite the pit. Coming near it opens its board; moving away closes it. It has no click target at all, so the ground it stands on sweeps like any other. Nothing about
upgrades is on screen while you are mining, which keeps the scene to rock, dust, crew and pit.

**The bench is not there until it is worth something.** A game that cannot afford a single row has
no bench in it — the yard is a rock, the ground and the pit, and nothing else. The first upgrade you
can pay for is what puts the bench in the world, and it stays from then on: one that came and went
would be worse than one that sat there empty. Everything else in the game already works this way —
no currency is drawn until you have seen one — and the bench is the last thing that did not.

It says what it has without being opened, in one mark above the slab:

| Mark | Means |
|---|---|
| nothing | you have read the board and cannot afford anything new |
| a dot | there is a row on it you could buy right now |
| a flag on a post | a whole heading you have never seen has appeared |

A flag outranks a dot, because one more row under a heading you have already read is not news and
a new group is. Opening the board reads every heading on it, and the flag comes down.

The board is grouped by where the work is — you, the crew, the rock, the cave, the farm and the lab — with the headcount beside each heading. Each place that can be worked carries a **job
row**: its name, a less, the count of bodies on it, and a more. It is the one row on the board
that spends nothing, and it is the only one you can run backwards. Every row is the same five columns, so the numbers line up down the page and can be
scanned rather than read: name, current, arrow, next, cost. Costs and units carry the marks the game
itself draws: a filled square for a grain of dust, a ring for a core. A rate reads `2.2 → 2.7 ■/s`
rather than naming pixels. Deliberately not an upgrade web.

## Workers

Asymmetric, not tiered — each does the job a *different way*, so the crew reads as a crew.
All of them stay plain black-and-white shapes.

**Miners (work the boulder)**

| Type | Shape | Behaviour |
|---|---|---|
| chipper | square, hollow centre | takes a seat in a ring round the rock that turns as one, but sways and drifts in and out on its own timing, and leans in when it swings; a second ring forms outside when the first is full |

**Workers (move the dust)**

| Type | Shape | Behaviour |
|---|---|---|
| worker | outlined square | walks to the nearest dust **nobody else has set off for**, scoops, and tosses it off the lip into the pit; carries its load stacked two abreast overhead, and drops everything to fetch a loose core first |
| barrow | outlined square towing a dot | slower walk, carries 4× a sweeper's load |

**The crew stop when there is nowhere to put it.** A miner with a full yard under it stands where
it is rather than knocking loose dust that has nowhere to go. Clearing the ground starts them
again.

**One grain, one worker.** A worker claims the column it is walking to and keeps it until that
column is bare. Every worker working out the nearest dust for itself, every frame, is the same
answer for all of them — so a single grain behind the crew turned the whole line round, and turned
it round again the moment the first of them reached it. Claiming is also what stops six workers
queueing at one column while the rest of the yard sits there.

A worker walks **quicker with its hands free** than with a load on. The trip out is the part that
costs nothing, so it is the part that should be quick, and a laden worker reading as heavy is
worth more than a laden worker reading as fast.

**Structures (no legs, change the world)**

| Thing | Behaviour |
|---|---|
| chute | a fixed ramp on the ground; dust that lands on it slides right and falls into the pit on its own |

The chute is the cozy end state: dust starts moving without anyone touching it.

## The rock

Boulder *n* is **n sheets thick** (capped at six) and a little wider than the last, so each one is
a longer dig. You are mining into the rock, not around it: a hit takes one sheet off the front at
that spot, and a cell holds how much rock is still stacked there.

The rock is a **hill**, not a disc: a heightfield with a rough crest, sitting flat on the ground
with its foot a couple of cells under the ground line so it reads as planted rather than laid.
It is thickest at its base and through the middle, thinning towards the skyline, so the crest
breaks through quickly and the heart of it is the real work.

The crew take it off **in layers**. A miner does not stand in one spot and bore a shaft: it walks
the top layer striking the rock under its feet as it goes, so the crest comes off as a row and the
next row is exposed underneath. It turns at the ends of the layer and before walking into a mate,
and one that finds itself off the layer — because the gang took the row down around it — climbs
back to it. Drillers work the flanks instead, parked at the foot eating a notch sideways in.
Nobody orbits anything.

Spoil is **aimed**, not scattered, and it all goes **one way**: to the right, into the strip of
ground that belongs to the rock, launched on the one arc that gets there. The pop is sized to the
distance and the sideways speed follows from how long that pop keeps it up. Nothing is nudged
mid-flight and nothing is shoved off the rock, so it reads as a throw. Two banks either side meant
half the spoil landed on the far side of the hill from everything else and somebody had to walk
round it; one pile, on the side the pit is on, is the whole yard flowing one way.

The rock keeps a bare **apron** either side. Spoil may not settle in it, so the two banks stand off
the rock rather than stacking up its flanks and blurring where the rock ends; a rock that grows
over an old heap shoves it out to clear ground.

That bare strip is a cliff the sand cannot slump over, so a bank beside it needs somewhere to
lean or it stands straight up against the rock as a sheer wall. **A bank may only rise as it
gets away from the rock** — a cell and a half of height per cell of distance, which is the angle
the sand finds on its own, so both faces of a heap read the same. Out on clear ground there is no
ceiling at all: it heaps to whatever height it likes.

An aimed chip also **clears whatever it is thrown over**. Coming down on the near face of a bank
is the other half of how the wall was built: every chip landed on the slope facing the rock and
the heap grew back up to the foot. A chip lands where it was aimed, or on bare ground, and
nowhere short of it.

The crew walk the whole ground, passing in front of the rock, so every pile is reachable. Dust the
player cannot reach is dust the player will resent, and there is a test for exactly that.

**Finishing one is worth a moment.** The last pixel of a boulder is the end of a long job, so the
yard marks it: the core comes loose, the crew stop working and hop about on the bare ground for
five seconds — a line of them, each a beat behind the last — and only then does the next rock come
**down out of the sky**, landing on the ground it needs and shaking a few grains off the top of
both banks as it hits. Those grains were already lying there; nothing about the landing makes dust
out of nothing. A game with nobody hired skips the dance, because five seconds of standing about is
most of the early game.

When the last of the rock goes the core is loose, and it **rolls out** from the foot of the hill
before it settles — the next rock stands where the last one did, and a core in its shadow
would be a core you could not pick up.

Shade shows what is left, relative to that boulder's own thickness: dark where it is still thick,
pale where you have worn it thin, white page where you have punched clean through. Dust keeps the shade of the sheet it came off, so the ground
and pit end up speckled with light and dark.

| # | Sheets | Cells (w x h) | Rock |
|---|---|---|---|
| 1 | 1 | 60 x 26 | ~430 |
| 2 | 2 | 64 x 28 | ~990 |
| 4 | 4 | 72 x 32 | ~2,500 |
| 6 | 6 | 80 x 36 | ~4,800 |
| 9 | 6 | 92 x 42 | ~6,400 |
| 12 | 6 | 104 x 48 | ~8,200 |

Size is clamped so the rock can never grow into the bench, nor out of the sky kept clear above
the ground line.

Traits (veined, hollow, crumbling, dense) are still open as a later pass — depth gives the
progression on its own for now.

## Pacing

Per-boulder clear time is the spine. Rough targets:

Measured against a real core budget — cores are one a rock, and the sites cost 1, 2, 3, 5, 7 and 9
of them, with pick levels competing for the same cores:

| Rock | What you have | Rock holds | Per rock |
|---|---|---|---|
| 1 | you alone | ~660 | ~4 min |
| 3 | first miner, first worker | ~1,400 | ~5 min |
| 6 | the cave open, 3 miners | ~3,600 | ~6 min |
| 9 | pick 1, 4 miners | ~5,800 | ~4 min |
| 12 | pick 2, 5 miners | ~9,000 | ~3 min |
| 20 | the farm, pick 3, lab pace | ~13,000 | ~1 min |

Front-loaded effort, back-loaded watching. The hump at rocks three to six is deliberate: that is
where you are buying your first crew and feeling the cost of it. About eighty minutes to have
every site open, and it keeps accelerating after that.

Balance this by measuring, not by reading the table. `__levels()` and `__crew()` put the game in
a plausible state; a measurement taken on a *fresh* one reads as ten to fifty minutes a rock and
will send you off rewriting the wrong thing.

## No ending

Rocks keep coming and keep dropping cores. They grow until they plateau at about what the
twentieth is, because something that grows for ever would fill the sky and eventually reach the
meteor.

What changes over a run is the shape of your attention. Early on you are swinging; by the middle
you are choosing who to hire and where to put them; by the end you are watching a yard that runs
itself and deciding what the lab should make faster. There is no finish line, and nothing is
taken away to make you start again.

## Not doing

Prestige. Ascension. Timed events. Offline accrual. Achievement grids. Anything that asks the
player to come back tomorrow. No score, no summary screen, no percentage-of-a-percentage.

*(An earlier version of this list said "a third currency". There are five now
— dust, cores, shards, spores — and each has exactly one job, which is the rule
that actually matters. The lab is the only place a multiplier lives.)*

## The counter

Every currency is drawn as a mark, never described in words: dust a filled square, a core a ring,
a shard a triangle, a spore a hexagon.

A shard and a spore **are grains of dust**, as far as the ground is concerned. They fall,
heap, slump, are swept up, are carried and are tipped in by exactly the same code — the same grid,
the same repose, the same ceiling, the same pile limits. What differs is the mark drawn on the cell
and what it is worth when it reaches the pit. There is no second implementation of "a thing in a
pile" to drift out of step with the first, and every rule they did not share turned out to be a bug
waiting: the ceiling, the lattice, the repose angle, all found the hard way.

**One glyph, one size, everywhere.** Each is drawn inside the same cell-sized box — in the air, on
the ground, in the pile, on the cursor and in a worker's hands — because a cell is what a grain
occupies and what it collides as. A mark bigger than its cell lies about where the thing is, and
marks of different sizes read as different *amounts* of something rather than different things.
The board's marks are the same shapes, so the world and the shop speak one alphabet.

A find is **picked up by hand** as well, like a core: one thing rather than a load, so it costs no
carrying room, and letting go throws it. Thrown over the lip it counts, the same as if a worker had
carried it.

And whatever is being carried is drawn as **what it is**: a worker walking a shard to the pit is
visibly walking a shard, not a grey grain, and so is the load drifting round your own cursor. They stack over the pit mouth, and each
one only appears once you have seen one.

The dust count runs to each new value on an out-cubic ease — longer for a bigger jump, so a
purchase reads as a withdrawal rather than a number blinking. Buying something lifts that dust
back out of the pile: you watch it stream out of the pit, arc across, and vanish into the bench.
So every dust purchase is a choice between arriving sooner and being further along right now.

Every pixel is worth exactly one, wherever it came from. Shade is how deep the rock looked, not
what it pays. That rule is why the lab sells rates and never yields.

*(There was a target of a million dust. It is parked, not cancelled: `PIT_GRAINS` in config.js
still holds the machinery that would let the pile settle to a finer grain and hold one. See
**The pit**.)*

## Fitting the window

Nothing about the place changes with the window. The pit floor sits on the bottom of the viewport
and the ground line a fixed height above it, so the ground never moves. The pit is always 3624
world pixels across and 276 deep, and every site keeps its distance from the rock. A bigger
window is only more sky above and more ground either side.

**The picture never scales.** `CELL` in `config.js` is the whole of the zoom — the screen pixels a
cell is drawn at, and therefore the size the game is. Turning it down shows more yard at once
rather than rearranging anything. A small window shows *less* of the yard, not a smaller one: a cell is
a cell whatever you are looking at this on, and the works is a fixed thing you scroll along rather
than a thing that rearranges itself around your window. The game asks for about **840px of height**
— enough for the sky the rock stands in, the ground, and the whole depth of the pit
— and a shorter window loses sky off the top, which is the part with nothing in it. This is not a
responsive layout and does not want to be one. The **counter is the exception**: it is read rather than looked at, so it is drawn in screen pixels
and stays the size it is however far the yard has been scaled down. Everything else is furniture
and a cell is a cell; a number you have to squint at is just a number you cannot read. The room its
digits need is measured, not guessed, so it cannot clip its own number at seven figures.

Widening the world costs zoom. `SIDE_PAD + TO_LEDGE` is the width the layout insists on showing at
once, so pushing the pit further right scales the whole yard down a step on any window narrower
than that. Moving something out therefore means pulling something else in.

**A cell is always a whole number of *device* pixels** — that is
what keeps hairline seams out, and on a screen at three device pixels to one it is three times as
fine a ladder, which is what lets a phone find a scale the whole works fits in. It draws at the
screen's real resolution, backing off only against a fill budget.

The other half of that rule is that **every world position is a whole number of cells** — the
sky above the ground line included. The rock is the only thing drawn a cell at a time, so it is
the only thing that shows when the rule slips: two squares sharing an edge on a fraction of a
device pixel are each antialiased against the page, and the seam between them comes out grey.
The rock is kept an even number of cells wide for the same reason, since it is anchored by its
middle. There is a test for it at every cell size a window can pick.

Scrolling is sideways only, because there is never anything above or below worth moving to.
Wheel, arrow keys, or **two fingers** — a phone has no wheel, and one finger is already sweeping.
A tap opens a board at the bench or the lab, because a finger cannot hover.

## The pit

The pit is **one fixed hole**: 3624 world pixels across and 276 deep, always. It runs about two
windows to the right, so most of it sits off the edge and you scroll to see along it. There is
ground past its far wall, so scrolling to the end shows you the edge of the thing rather than
running out of world.

**Once the hole is full the pile keeps going**, heaping up over the mouth rather than stopping
dead at the ground line — but only over the mouth. It is the same bed of sand and the bed is only
as wide as the hole, so the pile can rise but it can never get out onto the ground. Inside the hole
it lies level, because a hole fills up; above the brim it is a heap, highest at the lip where it is
tipped in and leaning away down the length of the hole. Without that lean it filled the near end to
the very top and stopped, which is a wall rather than a pile.

**The pile is the dust, not a picture of it.** One grain is one dust, always, drawn the same
size as dust anywhere else, and paying takes exactly as many grains back out as the counter
loses. The pile always shows as much of the hole as will fit in it: 27,784 grains, about a
run's worth of mining. Past that the counter keeps going and the pile sits at the brim.

A million does not fit at this grain, and the goal is parked for now. The machinery to get
there is still in place: `PIT_GRAINS` lists the sizes a grain may be drawn at, and adding
finer ones lets the pile **settle** to them as it fills — every grain kept, each column shared
out across the finer columns standing where it did, so the profile survives and only the
resolution changes. At one pixel a grain the same hole holds 1,000,224. The arithmetic is
unforgiving: a million grains needs a million pixels of hole, and since the depth is pinned
to the window it can only be bought sideways — 2px grains would need a pit seven screens wide,
3px seventeen. That is the trade whenever the goal comes back.

Two things keep a big pile cheap, and are worth keeping either way:

- **Drawing.** The pit is painted into a scratch canvas one pixel per grain and blitted up to
  size, and only the cells that changed are pushed across.
- **Saving.** A value per cell is megabytes of speckle written every second. What matters
  about a pile is its shape and its total, so the save holds the height of every column and
  how many grains of each shade there are, and the speckle is dealt out again on the way back
  in. The profile and the count come back exact, in about 2 KB.

**Nothing gets into the pit without being carried or thrown.** That is the rule the ground has to
keep, and it used to leak two ways. A heap against the ledge tipped itself in once it was four
cells deep, and a full yard sent the rest rolling in rather than piling up mid-air. Between them
they banked the whole yard for free and left the haulers with nothing to do, which is the one
thing the ground must never do.

**Every station piles to its right**, into a strip of ground that belongs to it. The world reads
station, pile, station, pile, all the way along — the farm and its crop, the cave and what comes up
it, the rock and its spoil — and then the bench, the lab and the hole it all ends up in:

```
farm | farm pile | cave | cave pile | rock | rock pile | bench  lab | pit
```

Nothing heaps anywhere else. The ground between the strips stays bare, so every pile is legibly
somebody's, and a pile that fills is that station's problem rather than the whole yard's. Both ends
of a strip are **cliffs the sand may not lean on** — the station behind it, the bare ground in front
— so a pile rises only as it gets away from them and cannot stand up as a wall against either. A
wider rock is a narrower strip beside it, which is its own quiet pressure.

**A full pile stops the station behind it.** The miners stand where they are, nobody goes down the
cave for another shard, and the beds stop coming on. A **warning triangle under the station** says
so — the one mark in the game that means nothing is happening — and hovering it says *pile is full*
in words. It is the only writing in the yard, and it is only there when asked for. They start again once a carrier has taken a
quarter of it away, so a single grain being fetched cannot make them stutter.

That is the whole of the choice the job rows ask, made visible in the yard: another body on the
rock fills the strip faster, and somebody still has to move it. The rock's strip holds a bit over
two thousand grains and stops at 1,800, well short of physically full, so a chip is never told
there is nowhere to put it. A rock is worth more than one pile, so a body on the rock is only worth
having if somebody is carrying.

**Nothing gets into the pit without being carried or thrown.** That is the rule the ground has to
keep. It used to leak two ways: a heap against the ledge tipped itself in once it was four cells
deep, and a full yard sent the rest rolling in rather than piling up mid-air. Between them they
banked the whole yard for free and left the haulers with nothing to do. Throwing dust over the edge
is still a real tactic — a flick sends it through the air, and anything that crosses the mouth
falls in.

## Open questions
- Sound: soft ticks on a hit, a low tone when a core banks. Optional, off by default.
- Dust hangs in the air, thrown off the piles themselves: motes rise from the surface of whatever
  is lying about, so a big pit visibly gives off more than a bare one. They pass at their own rate
  as the view scrolls, which is how movement reads without furniture in the background.
