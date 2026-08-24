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

## The opening

The game used to start with a rock already sitting on the ground and a cursor to hit it with.
Nothing said why, and *why* is the one question an incremental never answers: you are clicking
because clicking is what there is.

So it starts **before** the rock. Two squares are stood on the bare ground talking to each other —
the same dots two bodies pass back and forth on a break, which is the whole of the vocabulary this
game has for people getting on — and then a boulder comes down out of the sky on one of them.

Everything after that is one body trying to get its mate out. That is what the crew is for, what
the pit is for, and why the rocks keep coming: **the one underneath is still alive.** Every time
the last of a rock goes you can see them down there, on the bare ground, saying the same dots.
And every time, before anybody can get them out, the next one lands.

It costs the game one thing: **you start with a body** rather than buying the first with a core.
That is the story's price and it is worth paying — a game that opens on somebody you are digging
out is a game with a reason in it. It plays once, on a game that has never been played, and never
again.

## The world

Every site stands on one ground line. Progression is linear and physical: the world runs off to
the **left** as you unlock things, so walking further out *is* the tech tree.

```
   farm      cave    [lab]  [school] [houses] [bench]  rock      pit
    ◇          △               ▤        ▥                ▲▲▲      ▣
  ──────────────────────────────────────────────────────────────
```

You start with the **rock**, the **bench** and the **pit** and nothing else. Ground to the left
is empty until a site is unlocked there.

| Site | Gives | Unlocked by |
|---|---|---|
| **rock** — a craggy outcrop sitting on the ground | dust ■, and a core ◯ when it is finished | you start here |
| **quarry** — an open cut; crew work its floor where you can see them | shard ◈ | cores, then its own shards |
| **farm** — something growing on the spoil; crew tend it | spore ◇ | cores, then its own spores |
| **bench** | spends dust, cores and shards | — |
| **school** | spends shards on kit: a hat or a cart that stays at a station and doubles whoever is wearing it | shards |
| **lab** | spends shard and spore on multipliers, and shows the stats page | cores |
| **pit** | holds it all, and is dug wider and deeper as you pay for it | you start with a scrape |

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
as it goes down, the farm is a row of raised beds with a stalk out of each tended one, the lab is a
block with a chimney. If a shape needs shading to read, it is the wrong shape.

## A site pays for itself

**Cores buy the place; the place buys everything after that.** The two sites that make something are
the two that grow, and they grow on what they themselves give up — which is the whole answer to
"what is the quarry *for*" on the day you open it, before the lab is anything you could afford.

**Both grow the same way: one more place for one more body to stand.**

| | Comes with | Grows to | Costs | Looks like |
|---|---|---|---|---|
| the cut | 2 benches | 5 | ◈ 3, then 5, 9… | the hole goes down another bench |
| the plot | 3 beds | 7 | ◇ 2, then 3, 6… | another bed appears in the row |

A cut holds one body a bench and a plot one a bed, and there is nowhere else down there to put
anybody — so the plus button under either station goes pale with hands still spare, and the way to
send a fourth body down the quarry is to go and buy it a bench. That is the one place in the game
where a headcount is *bought* rather than moved, and it is bought in the coin the station itself
makes.

The pace of each is priced the same way — lamps in shards, tending in spores. Dust is the one thing
the quarry has nothing to do with, and a place paid for out of the wrong pocket is a bill with
nothing at the end of it.

## The lab

The bench sells you **more**: another worker, another body on the rock. The lab sells you
**faster**, across the whole operation at once, and it is the only place a multiplier lives.
Everything it sells is a rate — a pixel of rock is worth exactly one dust wherever it came from,
which is a rule the game keeps, so growth has to come from doing the same work sooner.

**Nothing in it is bought outright.** Paying for a piece of research *starts* it. What finishes it
is bodies standing in the lab doing the work, measured in worker-seconds: two of them finish it
twice as fast as one, and an empty lab makes no progress at all however much you have paid. One
piece at a time, because a lab does one thing at a time, and the row says `working 45%` while it
runs.

The chimney says the place is being worked, and it goes out the moment the work is done — which
is a signal made of nothing happening, and no use at all if you were looking elsewhere. So
finishing leaves a **mark standing over the lab**: a tick in a box, the opposite number to the bar
that means a station has stopped. It bobs, because it is asking to be come and looked at rather
than reporting a state, and it comes down when the lab board is read. The lab's own board carries
the **crew row** as well as the bench's, because the lab is where you are standing when you start
a piece of research and walking back to the bench to staff it is a walk for nothing.

**Starting a piece of research calls back whoever the lab let out.** An empty lab sends its people
home after a while — that is the game tidying up after itself — and making you walk over and undo
that before anything can happen is a chore rather than a decision. Only the ones it sent, and only
if they are still spare: a body you have since put on the rock stays on the rock.

So the lab is a **station like any other** — it takes a job row and it competes for the crew with
the rock, the quarry and the beds. That is the one question this game asks: who is doing what. A
multiplier you can simply buy is a number; a multiplier that costs you four bodies off the rock for
a minute is a decision.

It keeps no books. Rates and totals belong on the counter and in the upgrade rows, where the number
is next to the thing it is about.

## The casino

**The one place in the yard that makes nothing.** Everywhere else, a thing you buy does something
for ever after. This takes what you have and hands some of it back, and the whole of it is a
decision you keep making rather than a purchase you make once. It is the last thing on the ground,
out past the lab — the longest walk, on purpose, for the place that produces nothing — and it costs
◯ 6.

**One table, one pot, and putting a chip down is the spin.** You pick how much — ◾ 10, 100, 1,000
or everything you have — and which of dust, shards or spores it comes out of, and the wheel goes
round: **six in ten it is doubled, four in ten it is gone.** One gesture, not two: an earlier
version opened the pot at half the stake and had it climb back over half a minute, which was a
puzzle rather than a bet — you put something down and then watched a number go up.

If it came off, the pot is sitting there and you decide again:

| | |
|---|---|
| **bank it** | take it and walk out |
| **spin again** | six in ten it doubles, four in ten it is gone |

Six in ten is generous on any one spin and ruinous kept up, which is the whole of what a casino is:
every spin is worth taking and taking them all ends at nothing with certainty. **When to stop is
the game**, and it is the only thing in this yard you can actually lose.

**A settled hand says which way it went** — a tick or a cross in a box standing over the building
for a few seconds, in the same place the lab's news stands. A wheel that stopped and told you
nothing is a wheel you had to have been watching, and you are usually somewhere else in the yard.

**It has a sign, and the sign is the one piece of writing in the yard.** Every other building says
what it is by being the shape it is — a chimney, a row of beds, a hole in the ground — and a casino
says what it is by shouting. CASINO runs down a board on the roof with a chase of lights round the
border, and the lights are the reason it is there: nothing else in this yard blinks, so from the
far end of the ground the only thing moving out past the lab is that.

**A pot has to have somewhere to land.** Everything ends up in the hole and the hole has a limit, so
banking is refused while the pit is full — and the pot *stays on the table* until there is room, the
same as a core the hole refuses waits on the ground by the lip. Nothing here is ever lost to a rule
about sand, and a full hole is a reason to dig rather than a hand you lose.

**It is a building with a wheel in it**: a block with one big round hole knocked out. Everything
else in this yard is a shape with holes in it and a wheel is the one thing properly round, so it is
the whole of the building rather than a detail on it. It turns while there is a pot on the table and
spins in earnest while a ride is being settled — the rows say what the numbers are, and the wheel
says whether anything is happening.

## Crew

**There is one kind of body.** You hire a worker, and where it works is a separate question you
can answer again whenever you like. A worker with no job carries dust to the pit, so hauling is
not a job you hire into "+D+" it is what the ones you have not put anywhere are already doing.

| | Costs | What it is |
|---|---|---|
| first worker | ◯ 1 | the one body you buy with a core |
| workers | ■ 60, then 81, 109... | every body after that |
| on the rock / down the cave / at the beds | free, both ways | where they work |

Moving somebody is walked, not popped — and walked at **the crew's own pace**, hands free, with a
floor under it so an unupgraded crew is no slower at it than it ever was. A pace upgrade that did
not apply to the one trip you are actually watching is an upgrade that does not apply.

Sites are still bought with cores "+D+" the cave at ◯ 3, the farm at ◯ 5 and the lab at ◯ 7 "+D+" but a site now buys the **place** and nobody in it. Who works it is the same question as who
works the rock, asked again.

That is the whole trade: a body on the rock is a body not carrying, and the dust it knocks loose
piles up on the ground until somebody fetches it. Nothing is spent to change your mind, because a
decision you cannot take back is one you make by reading a wiki rather than by watching the yard.

One pool also means one price curve. It is gentler than the four it replaced "+D+" 1.35 a body rather
than 1.7 "+D+" because it is no longer four separate ladders climbed in parallel.

**There is a ladder.** Bodies used to sink into the cut and rise out of it wherever they happened to
be standing, straight down through the air in the middle of the mouth — the one thing in this yard
that was plainly not a thing that could happen, when everything else walks, climbs a wall or goes
through a door. So a ladder stands in the near corner where the wall's toe is, head a cell proud of
the rim and clear of the bridge deck over it. Going in is walking to its head and coming down it;
coming out is walking back along the floor to its foot and going up. One place, worked out from the
cut, so the rungs you can see and the line a body climbs are the same line by construction.

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
| **Shard** | triangle | a quarrier's trip | the cut's next bench, its lamps, the school and its kit; lab: swing and haul pace |
| **Spore** | hexagon | a bed cut | the next bed, and tending; lab: quarry and tending pace |

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

## The school

**A job is a count, not a purchase.** You buy a body once and put it where you like; every one of
them can be taken back the moment you want the dust moving again. That makes an assignment free,
and something that is free is never really chosen.

**What the school sells is kit, and the kit belongs to the station.** Four shards put the school
up; after that a shard buys a hat for the rock or a cart for the lip, and whoever is standing there
picks it up:

| | is | does |
|---|---|---|
| **breaker** | a helmet on the rock | takes twice the bite out of the rock |
| **carter** | a cart at the lip | carries twice a load, in the cart |
| **blaster** | a helmet in the cut | brings one up twice as often |
| **grower** | a hat at the beds | brings a bed on twice as fast |

**Nothing about it is instant.** A hat bought is a hat *put out at the station*, on a stand with the
count over it — one of the thing and a figure, the way every other count in this yard is written,
rather than a row of helmets on the ground you would have to count. A body sent to the rock walks
over to the stand, picks one up and puts it on, and only then climbs the hill; a body taken off the
rock walks back and puts it down before it goes anywhere else. Buy a helmet while three are already
working and one of them comes down the hill to fetch it, one at a time. What you see is the errand,
which is the difference between kit and a statistic.

**The stand comes before the work, not after.** A body put on the rock used to walk to the middle of
it, then back down to the stand, then up the hill again — three trips to do one thing, and the one
part of this anybody watching would call wrong. And what a body is *wearing* is asked of the kit,
never of the job: somebody taken off the rock counts as a hauler the moment you take them off, and
for the whole walk back they were drawn dragging a cart they had never picked up.

**Each trade's is its own shape**, and all of them are one bar across the top of the square with one
cell of difference — which is as much difference as an eighteen-pixel body will carry. A **helmet**
is a bare bar: on the rock, what is on your head is for the rock. A **lamp** is that bar with a cell
standing proud of it: the cut is the one place in the yard with no daylight in it. A **brim** hangs a
cell over each side with a crown on top: out in the beds all day, and the only hat here that is
about the sun. A carter wears none — what you see of a carter is the cart.

**There is no ceiling on it.** There used to be — a hat a bench, a hat a bed, never more of either
than there were bodies in the yard — from back when a hat *was* a body that had been upgraded, and
buying one more than you had people for was buying nothing. Kit is not a person: a helmet on the
stand is a helmet the next hire puts on the moment you take them on, and stocking the rock before
you have staffed it is a sensible thing to do with a pile of shards. The price is the limit.

**Nobody is ever nailed down.** It was a body that got upgraded once and would then do nothing else
for the rest of the run — a decision you make in your first ten minutes and live with: thirteen
carts bought early were thirteen bodies that could never work a bed. Now the hat stays where the
work is. Take everybody off the rock and the helmets stay lying on it; send somebody back and they
are wearing one before they arrive. A station may own more kit than it has people, and the spare
lies on the ground there — visibly, as the thing itself put down — waiting for the next body you
send. Nothing is ever wasted and nothing is ever locked.


**It is a building, not a section on the bench.** The bench is the shop; this is a decision about
people, and the two read differently for being made in different places — which is also why the
bench is not eleven headings long. The school stands between the quarry's spoil and the crew's own
front doors, the stretch everybody walks twice a shift.

Nobody in this yard has a name — a job is a count and a body is whichever body happens to be doing
it — so a trade is not something a person carries around either. It is **the first n of the bodies
on that job**, worked out in one place. Move somebody off the rock and the hat goes to whoever is
left, which is what the count model already means everywhere else.

## Knocking off

**A yard with nothing in it to carry is a yard nobody needs to be stood in.** A body with no dust to
fetch ambles for a while, and then — after a long stretch of it, staggered per body so they trickle
off rather than clocking out together — walks to the door it was hired out of and goes in. It costs
nothing and it is never a decision you regret: dust on the ground brings every one of them straight
back out.

**The windows are who is in.** A room is white when there is somebody behind it and grey when there
is not, lit from the bottom up in the order the rooms were built. So the front of the settlement
reads the yard back to you: a lit wall is a works standing idle, a dark one is everybody out on the
ground where you can see them. A drawn curtain is grey too, which is the right answer both times —
what the colour says is whether there is anything to see. And the chimney only smokes when somebody
is in, because a hearth over an empty house is the building claiming something the windows deny.

## Breaks

**The yard at rest.** A body with nothing to do already ambles rather than standing to attention;
this is what it does during the standing about, and it is the only thing in the game that is purely
for watching. Nothing here makes, spends or moves anything, and a break that produced something
would be a break you farmed.

**Most of the time nothing happens at all.** A body that has been standing about a while gets a
*chance* at a break rather than a turn at one, and about two turns in three come to nothing. What
makes a cigarette worth noticing is that the last four times you looked over there, nobody was
having one.

**A break only ever happens to a body that had stopped anyway** — a miner stood down because the
yard is full, a hauler with nothing left to fetch, a quarrier at a face with nowhere to tip another
shard. Nobody downs tools to have one, so the pace of the works is exactly what it was before.

What they get up to is drawn in cells and never in words. A **cigarette** is the one that is not a
mark at all: it is a puff of the same smoke the lab's chimney makes, at a little over half the size,
off a body instead of off a roof. A **note** over the head is singing, a **burst** is swearing, and
**dots** are talking — and dots going back and forth between two bodies who have turned to face each
other is a conversation, which is a thing you read off the pair rather than off either of them.

**The roster counts them.** Under the headcount at each station, a second line: the mark that
trade wears out in the yard, and how many of them there are. Three of the four show the hatted
square; the haulers show a **body with a cart behind it** — what a carter is, rather than a cart
nobody is pulling. It trails left into the slot the minus button would be in, because carrying is
the one post with no buttons: you never put a body *on* it. Under it rather than beside
it, because it is a *part* of that number — of the four on the rock, two are breakers — and beside
it the two would read as separate crews. It appears only when there is one, and the haulers get it
too, buttons or no buttons.

**They have to be visible.** A tradesman wears a hat: a solid bar across the top of the square, the
only filled thing on a body. A carter also drags a box behind it, four cells by two — the one
proportion in the yard that is not a body — and **what it is carrying rides in the cart** rather
than on its own head, four abreast instead of two. That is the whole of why a cart is worth having,
and a carter walking a double load stacked overhead would be a cart that was decoration.

## The boards

One menu walks along the ground from station to station and shows whichever of them you are
standing at. That is a nice thing to watch and was a bad thing to read: three boards that slide
into the same spot and differ only in their rows are three boards you have to work out. **Each one
says its own name** at the top, under a rule heavier than the ones between its sections — a heading
inside a board is a group of rows, and this is the board.

**What you have to spend stands beside what you are spending it on.** Every price on a board is a
mark and a number, and the only place you could read what you *had* of that mark was the counter
over the pit — the other end of the yard, in the corner of the window, and as often as not behind
the board itself. Reading a price meant looking away from it. So the same marks, in the same
alphabet, float off the **left** of whichever board is open: left because it is read before the
price, and because the board's own numbers already run down its right-hand edge. A currency appears
the first time you have seen one, the same rule the counter goes by. On a phone there is no room
beside it, so it lies along the top instead.

**A board with nothing on it says so.** A board whose rows are not open yet renders blank, and
an empty sheet is a bug you have to rule out before you can believe it. It says `nobody left to
teach` instead.

## The workbench

The shop is a thing in the world, not a panel bolted to the corner: a bench on the ground just off
the rock's left flank, the first thing out from it, centred in the ground it has — sixty pixels of
bare yard to the crew's block on one side and sixty to the rock's apron on the other. Where the
crew live stands further out again, between the bench and the quarry: you walk out through the yard
to the houses and back in to the bench, rather than past your own front door to get to the shop.
The biggest rock is measured off the bench and stops a hand's width clear of it, so where the bench
stands is also how big the last rock gets. Coming near it opens its board; moving away closes it. It has no click target at all, so the ground it stands on sweeps like any other. Nothing about
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

**Room in the hole is claimed the same way a column is.** A hauler says how much it is going for
*before* it goes, and the room it asked for is spoken for until it tips. Without that, every body in
the yard set off with empty hands, filled them, walked to the lip and only then found out the hole
was full — eight workers stood at the brim holding a load each, with nowhere to put any of it and no
way to put it back. Room for five is one worker going for five, not five workers going for a load
each. Dust it has not booked stays on the ground, which is somewhere, rather than in a pair of
hands, which is not.

**Finds are counted in with everything else.** A shard, a spore and a core take a grain of room the
same as a grain of dust does: one capacity, one queue. They used to go in over the ceiling on the
grounds that a find is a thing you went and got rather than a grain that happened — but a hole that
holds everything except the four things it does not hold is a hole with a rule you cannot see, and
the counter over it stops being a reading of what is down there. So a shard on the ground with a
full hole behind it stays on the ground, and a core arriving at one waits in plain sight by the lip
until a dig makes room. Nothing is ever swallowed; what is refused lands beside the hole.

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

**The dance is the miners' business.** Nobody may walk under a rock that is in the air, and the crew
clear the footprint before it starts coming down — but the five seconds of celebration are five
seconds of bare ground, and freezing the whole yard through them stopped every hauler in the works
every time a rock finished. They carry on. Only what is actually overhead stops anybody.

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

*(The thing in the sky is **benched**, not deleted. It used to shed sparks; the sparks are gone,
and an object that hangs there doing nothing raises a question the game has no answer to. Everything
it needs is still in the code and the dev panel has a switch that puts it back so it can be looked
at. If it returns it will need a reason to be there — a place people go, or something worth walking
out for.)*

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

## Filters (dev only)

There is a post-process pass in `shader.js`: the yard is drawn to its 2D canvas as it always was,
that canvas goes to the GPU as a texture, and one fullscreen fragment shader puts the result on a
second canvas laid over the top. Nothing about how the game draws changes — it is a filter held in
front of the window.

**Ten dials, not a list to pick from.** A look is a *mix*: a television is curvature and a shadow
mask and scanlines and a fringe, and choosing one of those from a menu is not the same as being
able to have a little of each. So every effect is a function with an amount of its own, they all
live in one program, and a dial at zero costs a branch that is never taken. Order is not a detail —
the glass bends the picture before anything is sampled off it, the ink spreads before the paper has
a texture, and the edge of the page falls off last because it is the light in the room rather than
anything on the sheet. The dev panel has a slider each and a few presets to start from. It opens on
`scanlines 0.2, aberration 0.1`: enough that the page is coming off a screen rather than out of a
printer, not enough to argue with a picture made of whole black pixels.

**None of it ships.** It is loaded from `dev.js`, which `main.js` only reaches for under `vite dev`,
so a production build never sees the file. The pass hands a whole screen of pixels to the GPU every
frame, which on a phone would be the most expensive thing in the frame, and nothing in it has
earned that yet.

**The television dials are in there to be looked at, not because they suit the game.** Bloom,
chromatic aberration, scanlines and curvature are built for bright things on a dark screen in a
dark room. This is black shapes on white paper, and the mismatch is structural rather than a matter
of taste: white cannot get brighter, so bloom has nothing to bloom and only eats the black;
aberration fringes every edge red and cyan, when the whole pixel discipline here exists to stop
edges going grey or fringed and colour is reserved for what the sites give up; and scanlines over a
white page are grey stripes across the picture. In small amounts none of that is fatal, and small
amounts are what a dial is for.

**The press dials are the same pipeline pointed at what this game actually is** — paper, ink and
a press. Grain gives the white a tooth. Bleed grows the black by a hair, so shapes read as printed
rather than plotted. Halftone turns grey into dots the size of the lattice, which is the one effect
that *agrees* with the game: the shades already mean how deep the rock was, and a halftone says
that in the unit everything else is built in. Vignette is the edge of a lit page. Plates is
chromatic aberration's respectable cousin — a colour plate one cell out of register, touching only
what is already coloured and leaving every grey exactly where it was.

## Fitting the window

Nothing about the place changes with the window. The pit floor sits on the bottom of the viewport
and the ground line a fixed height above it, so the ground never moves. The world is laid out
around the pit at its **full** size — 3600 world pixels across and 276 deep — whatever the hole has
actually been dug to, and every site keeps its distance from the rock. A bigger window is only more
sky above and more ground either side.

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

The pit is **dug, not given**. It starts as a scrape in the ground — 150 world pixels across and
150 deep, a few hundred grains, full inside the first couple of minutes — and every **dig** bought
at the bench takes the far wall out 150px and the floor down a row. Twenty-three digs and it is the
whole hole: 3600 across, 276 deep, running about two windows to the right, so most of it sits off
the edge and you scroll to see along it.

Depth runs out first, at the twenty-first dig. There are only twenty-one rows between the scrape
and the deepest the hole can be, because the depth is pinned to the window; the last digs are all
sideways. That is the same trade the million was always under — room in this hole can only be
bought along.

**The near lip never moves.** A dig takes out the far wall and the floor, so nothing you can
already see changes place, and the world is laid out around the finished hole from the first frame:
the ground past the far wall is ground that is already there, and buying a dig does not shift the
view or the ground under you. Scrolling to the end shows you the edge of the thing rather than
running out of world.

**A bigger hole shows more of what you hold.** The pile is capped by the room in the bed, not by
the counter, so dust that was over the brim — counted but with nowhere to be drawn — comes back into
the picture the moment there is room for it.

**A stopped station says why.** The bar over a station whose pile has filled is a mark you learn,
and the first time you meet one it is a mark you have to guess at — so putting the cursor on it
gives you the words: `pile is full`. The full hole owes the same explanation and gives it, on the
bar standing on its own lip: `the hole is full`. It is the only writing in the yard, and it is not
on screen until it is asked for.

**A full hole takes nothing.** The pile *is* the dust, so a counter that went on climbing while the
pile stood still would be the number and the picture saying different things. Whether the hole is
full — and whether the heap over the mouth has unlocked — is a question about the **pile**, never
about the counter. They are nearly the same number, and the difference is a core: a core in the
pile takes a cell and is not dust, so reading the counter meant the hole was physically full one
grain before the counter agreed. The heap never unlocked, and the crew stood at the lip throwing
dust at a brim with nowhere under it, for ever, because nothing about that state could change. The
pit grid keeps a live count of its own occupied cells instead. When there is no room
the dust does not go in and is not counted: the haulers stand down and keep hold of what they are
carrying, a bar stands on the near lip to say so, and anything thrown at the brim comes back out
onto the rock's own pile. Nothing mined is destroyed by a hole with no room in it. The way to bank
another grain is to dig. A find is never turned away — there are a handful of them in a whole game
and each one is a thing you went and got.

**Once the hole is full the pile keeps going**, heaping up over the mouth rather than stopping
dead at the ground line — but only over the mouth. It is the same bed of sand and the bed is only
as wide as the hole, so the pile can rise but it can never get out onto the ground. Inside the hole
it lies level, because a hole fills up. And nothing goes over the brim while there is still room
down there, so a pile standing above the ground line always means the hole underneath it is full.
What stands above it heaps **from the middle**, tapering away to nothing at either end — a pile at
the lip would be a wall against the ground, which is not what a pile does.

**The pile is the dust, not a picture of it.** One grain is one dust, always, drawn the same
size as dust anywhere else, and paying takes exactly as many grains back out as the counter
loses. The pile always shows as much of the hole as will fit in it: 655 grains in the scrape you
start with, 37,566 in the hole fully dug out. It stops there, and so does the counter, which is the
whole of the pressure to dig.

A million does not fit at this grain, and the goal is parked for now. The machinery to get
there is still in place: `PIT_GRAINS` lists the sizes a grain may be drawn at, and adding
finer ones lets the pile **settle** to them as it fills — every grain kept, each column shared
out across the finer columns standing where it did, so the profile survives and only the
resolution changes. At one pixel a grain the same hole holds 1,000,224. The arithmetic is
unforgiving: a million grains needs a million pixels of hole, and since the depth is pinned
to the window it can only be bought sideways — 2px grains would need a pit seven screens wide,
3px seventeen. That is the trade whenever the goal comes back.

**A core in the pile is drawn at the size a core is**, not at the size of the cell it holds. It is
one grain as far as the sand is concerned — it heaps and settles like any other — but a cell is six
pixels, and a six-pixel ring in a bed of grey speckle is a grain that happens to be pale. You put
it in the hole and it vanished.

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

**The lip is as close to the rock as the spoil will allow.** What has to fit between the rock's
apron and the pit is one full pile and a sweep of bare ground — 1400 grains at the angle sand
stands at wants a base of 62 cells — and nothing else does. It used to stand a further 200px out,
which was ground you dragged dust across by hand: the first pile in the game is cleared with the
cursor, before there is anybody hired to carry anything, and the walk was the length of the yard
for no reason. Closing it makes neither the pit nor the pile smaller.

**Every station piles to its right**, into a strip of ground that belongs to it. The world reads
station, pile, station, pile, all the way along — the farm and its crop, the cave and what comes up
it, the rock and its spoil — and then the bench, the lab and the hole it all ends up in:

```
farm | farm pile | cave | cave pile | lab  houses  bench | rock | rock pile | pit
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

## The air

Nothing stands in the background of this game — no hills, no clouds, no furniture of any kind — so
the dust hanging in the yard is load-bearing rather than decorative. It is the only thing the view
has to move against, and the only thing keeping a yard nobody is working in from reading as a still
picture.

It hangs in **three bands at three distances**, and one number — how far off the band is — settles
everything about it at once: the far ones are pale, small, slow, and barely take the camera's
movement; the near ones are darker, bigger, sweep past, and are drawn *over* the yard rather than
behind it, so dust passes in front of the rock.

What gets it into the air is the yard itself. Motes are born off the surface of whatever is lying
about — so a full pit visibly gives off more than a bare one — and off the boots of a worker who is
actually walking, which is the one part of the weather plainly caused by something you are watching.
Most of it climbs; a fraction is heavier grit that sinks instead, and settles when it reaches the
ground line. The whole field leans on a wind made of two slow swings pulling against each other, so
it never sits still and never repeats on a beat you could count.

Motes live in **screen pixels, not world ones**: they are weather, not scenery. A mote with a place
in the world spends nearly all of the game outside the window, which is exactly where the old ones
went.

## Open questions
- Sound: soft ticks on a hit, a low tone when a core banks. Optional, off by default.
