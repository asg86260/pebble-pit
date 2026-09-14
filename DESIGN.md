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

So it starts **before** the rock, and it starts **close**. Two squares are stood on the bare ground
with the view pulled right in on them — two squares at the far end of a yard are two squares; two
squares filling the window are two people — talking to each other in the same dots two bodies pass
back and forth on a break, and every so often one of them says the other thing: a heart. That is
the whole of the vocabulary this game has for people getting on, and it is enough.

Then a boulder comes down out of the sky on one of them, and **the beat is given the room to land**.
The one left standing is thrown clear as it falls — they were stood a good deal closer together than
the rock is wide, so it is already flying while the rock is still in the air; anything else is a
rock landing on both of them — comes down flat on its back, lies there in the only silence in the
game, gets up with an exclamation mark over its head, and starts digging. The view pulls back out
while it does, and by the time it is out you are playing. The whole of it takes about twenty
seconds and nothing in it is hurried.

**Then it shows you the loop rather than telling you.** The last thing the opening does is play one
turn of the game through with the real crew: the body goes at the rock, a few pixels come off onto
the ground, and it carries them the length of the yard and tips them into the hole. Two grains is
enough — what is being shown is *where dust goes*, not how much of it there is — and the view walks
with it, because the hole is off the side of any window you can see the rock in. Nothing in it is a
special case pretending to be the game: it **is** the game, one body put on the rock and taken off
it at the right moment, and the crew code does the walking, the swinging, the scooping and the
throw. All the opening does is decide when to change its mind and where to point the camera.

It hands you the yard with that body on carrying rather than on the rock, which is the shape the
demonstration just taught: you dig, it carries.

**The zoom is the one exception the game makes.** A cell is a cell whatever you are looking at it
on — that rule holds everywhere else, all game. And it holds *within* the exception too: the zoom
**steps** rather than slides, down through whole cell sizes, a dozen or so of them between close and
normal. A cell drawn across a fraction of a device pixel is a cell antialiased against the page, and
the sand is blitted up from a scratch canvas at one pixel a cell — so a fractional scale resamples
the entire pile. Sliding the zoom made the rock go soft and swim and the ground read as
see-through, which is not something you can fix by drawing it differently, only by never asking for
a size that does not exist.

Everything after that is one body trying to get its mate out. That is what the crew is for, what
the pit is for, and why the rocks keep coming: **the one underneath is still alive.** The first
rock drove them into the ground to their middle, and there they are lodged. Every time the last
of a rock goes you can see them down there, sunk in the ground line, saying the same dots;
whoever is nearest runs over and digs, and they come up a little. And every time, before they
are out, the next one lands and drives them back in. The dig is longer than any gap the rocks
leave, on purpose: the yard is seen trying, and seen failing, all game — until something
holds a rock off the spot long enough.

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

**One doorway, and every building has it.** Four cells across and four courses tall, the same in
the school, the lab, the casino, the scrubbing house and each room of the crew's own house. A door
is the one part of a building measured against a person rather than against the building, so it is
the one part with no business changing from one to the next — it is what tells you how big the rest
of it is. A body is three cells square and stands on the bottom three courses, so three of anything
is exactly a body and no more; the fourth cell each way is the daylight either side and the room
over the head that makes a hole a way in rather than a slot somebody was squeezed through.

They were all different once — two by three at the school, three by three at the scrubbing house,
three by five at the casino, four by four at the house, and nothing at all on the lab, where every
labber walked up to a blank wall and evaporated against it. The school's was the worst of them: the
smallest door in the yard on the widest building in it. Windows go the same way — two cells square
for a room with somebody in it, and the school's tall narrow lights, which come in a row and say a
crowd rather than a person.

Sizes are a family rather than a rule: the school is the long low one at twenty cells by ten, the
lab the tall one at sixteen by twelve, the casino the broad one at twenty-six by twelve, the
scrubbing house a tower at nineteen by twenty, and the crew's place a stack of six-cell rooms. What
they share is the door, the window, and the cell they are all drawn on.

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
as it goes down, the farm is a row of raised plots with a stalk out of each tended one, the lab is a
block with a chimney. If a shape needs shading to read, it is the wrong shape.

## A site pays for itself

**Cores buy the place; the place buys everything after that.** The two sites that make something are
the two that grow, and they grow on what they themselves give up — which is the whole answer to
"what is the quarry *for*" on the day you open it, before the lab is anything you could afford.

**Both grow the same way: one more place for one more body to stand.**

| | Comes with | Grows to | Costs | Looks like |
|---|---|---|---|---|
| the quarry | 2 benches | 5 | ◈ 3, then 5, 9… | the hole goes down another bench |
| the plot | 3 plots | 7 | ◇ 2, then 3, 6… | another plot appears in the row |

A cut holds one body a bench and a plot one a plot, and there is nowhere else down there to put
anybody — so the plus button under either station goes pale with hands still spare, and the way to
send a fourth body down the quarry is to go and buy it a bench. That is the one place in the game
where a headcount is *bought* rather than moved, and it is bought in the coin the station itself
makes.

The pace of each is priced the same way — lamps in shards, tending in spores. Dust is the one thing
the quarry has nothing to do with, and a place paid for out of the wrong pocket is a bill with
nothing at the end of it.

## The lab

> **Superseded.** See "The bench is a catch-all, and the lab is its multiplier column" at the end
> of this file: the lab is to be deleted and its multipliers moved to the stations they multiply.
> This section is kept because it is the argument that section is answering — the reason the lab
> existed is the reason the *time cost* has to survive it.

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
the rock, the quarry and the plots. That is the one question this game asks: who is doing what. A
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
round: **half of it doubles what you put down and half of it takes it.** One gesture, not two: an earlier
version opened the pot at half the stake and had it climb back over half a minute, which was a
puzzle rather than a bet — you put something down and then watched a number go up.

If it came off, the pot is sitting there and you decide again:

| | |
|---|---|
| **bank it** | take it and walk out |
| **spin again** | half it doubles, half it is gone |

**Even money, and that is the whole of the house's edge** — which sounds like no edge at all until
you notice that a fair double-or-nothing taken for ever ends at nothing with certainty. No spin
here is a bad bet and no run of them is a good one. **When to stop is the game**, it is the only
decision in it, nothing about the odds will make it for you, and it is the only thing in this yard
you can actually lose.

**The wheel waits for the sand.** Putting the chip down is still one gesture, but a stake is not a
number leaving a counter — it is a pot raining out of the sky on to the ground beside the building,
and it takes as long to get there as it takes. So the chip goes down, the sand comes down, and the
wheel goes round in earnest only once the last grain of it is lying still. It keeps its slow idle
turn through the pour, because it has not decided anything yet and a wheel sitting dead still would
read as one that missed the chip. **The wait is an event, not a clock**: the pot has stopped arriving
when there is nothing left to send, nothing in the air, and no column of the heap still moving —
which is a fact about the ground, so ◾ 10 settles in a blink and an all-in takes as long as an
all-in takes. And the two decisions are shut for the whole of it, front half included: a pot still
pouring is a bet already made, so it can be neither doubled up nor taken back off the table.

**A spin is the one moment in this game you are meant to sit and watch**, so it is given the room to
be one: the wheel comes off its mark and drags itself down to a stop over two and a half seconds,
and the last half-turn is the slow one — by then you can read which way it is going to go. The stop
knocks the view, and harder when it came off.

**The wheel is cut into eight**, half bare and half filled and alternating all the way round,
which is the odds written on the thing
itself rather than as a percentage on a row. A pointer stands at the top and does not turn; the
slice under it when the wheel stops is the answer. The wheel does not free-run and then get told
what happened — the answer is picked first and the wheel is *aimed* at it, six whole turns and then
a slice of the right kind under the pointer, so what you are watching is the thing deciding.

**Black and white, not red and green.** Colour in this yard means one thing — what a site gave up —
and a wheel painted in traffic lights was the first thing here that used it for mood. It does not
need it: the grammar is already on the page. **White keeps and black takes**, which is how the rest
of the ground reads: every hole a thing comes out of here is white — the doorway in all six
buildings, the mouth of the quarry, the throat of the scrubbing house — and black is mass with
nothing behind it. A white slice under the pointer is a way through and the pot comes back; a black
one is wall. The wheel is set in a white disc knocked out of the block, because neither half of it
reads against a black building on its own.

**What is on the table is a real plot of sand.** Not a drawing of a heap sized to look about right —
one grain, one of whatever was staked, settled by the same code the yard and the hole use, on its
own plot of ground either side of the building. A hundred on the table is a hundred grains lying
there and doubling it is visibly twice the sand. It goes down beside the building and walks **left**
past it as it fills, because that is where the empty ground is; the casino's own footprint is barred
and `addGrain` already looks outward, so a big enough pot flows round the building on its own.

**Everything is one for one until the numbers stop being numbers.**

| | |
|---|---|
| the stake going down | trickles out of the sky, grain by grain, and piles up — and the wheel waits for it |
| a win | the pot doubles and the extra keeps raining in until the heap *is* the new number |
| a loss | every grain lifts off the heap and fades out on its way up — it is *leaving*, not blinking off |
| banking | the whole heap goes up over the works in a long arc and down into the hole, and the counter moves as each grain lands |

**So past a hundred the heap is a reading of the pot rather than a count of it**, on a ladder of
bands written down here rather than worked out per hand:

| on the table | grains lying there | and how big that is |
|---|---|---|
| 1 to 100 | the pot itself, one for one | 108 × 66px at the top of it |
| 1,000 | 250 | 120 × 120px |
| 10,000 | 400 | 162 × 120px |
| 100,000 | 550 | 222 × 120px |
| 1,000,000 and up | 700, and that is the brim | 276 × 120px |

Between two marks it runs on the log of the pot, so nothing jumps: `shown = 100 + 150 ×
log10(pot / 100)`, clamped at the brim. Every band is a tenfold pot for a hundred and fifty more
grains, which is what a log scale is for — a double always puts about forty-five more grains on the
ground, so a win is always visibly more sand, and the heap never grows faster than the ground can
hold or the eye can read.

**The brim is the size of the building.** That is the whole of how it was picked: the casino is 156
by 72 pixels, the biggest heap in the game is 276 by 120, and a heap you read from the far end of
the yard has to be a heap standing next to a shed rather than a dune with a shed at the bottom of
it. The first go at this brimmed at five thousand grains, which drew 354 by 264 — three and a half
times the height of the roof, and still reading as weather rather than as sand.

**The heap's own ceiling comes down with it**, from forty-four cells to twenty (`TABLE_HIGH`). A
ceiling does not make a heap smaller on its own — it trades height for width one for one, and the
same thousand grains under a fourteen-cell ceiling is a 480px smear instead of a 234px mound — so
the bands are what keep the footprint down and the ceiling is what keeps the shape honest: twenty
cells clears the roof by a third and stops there.

**What broke the old rule is the far end.** The pot doubles on every ride, so eleven wins off a
thousand is two million, and two million grains is two million grains — a plot the width of the yard
filled solid, twenty-four thousand squares in the air at once, and a frame rate that says the wheel
has hung rather than that you are winning. The sand stopped being the picture and became the cost of
drawing it. The bottom of the ladder is untouched: a stake of ten is ten grains, the hundred chip is
a hundred, doubling either is visibly twice the sand, and that is the whole of the early table.

**A grain past the first band is worth its band.** One flying square carries `pot / shown` of
whatever was staked. That is the one number in this building that is not one, and it is confined to
the picture: the row on the board says the exact pot, banking credits the exact pot, and the hole
fills with the exact pot — a landing grain puts its whole weight into the pile at the point it comes
down, because the hole's rule is that the pile *is* the dust and that rule outranks this one. What
is approximate is the size of the heap on the table and nothing else.

**Which is the honest version of what was there before.** The old rule was one for one up to
whatever that stretch of ground would take, and the rest "stays a number on the board" — so a pot
past about fourteen thousand already showed you a heap that was not the pot, at the worst possible
cost, and did it by filling the yard rather than by saying so. A band is the same admission made in
advance, at a size that draws. The brim is decided before the sand is sent rather than discovered
when the ground refuses a grain; `table.capped` stays as a backstop, because the wheel waits on the
heap reaching the number and a ground that refused a grain with no way to say so would be a wheel
that never went round — but at seven hundred grains on a stretch that takes fourteen thousand,
nothing reaches it.

Measured on a two-million pot, which is eleven wins off the thousand chip: the heap went from 8,536
grains to 700, the cloud in the air from 24,000 squares to 386, and the worst frame in the pour from
1,817 ms to 1.7 ms.

**Nothing about the hand changes.** The wheel still waits for the last grain to come to rest, a loss
still lifts the whole heap off and fades it out, banking still throws every grain that is there over
the works — there are simply five thousand of them at most, whatever the pot says.


**The board hushes for the whole hand** — from the chip going down, not from the wheel starting,
because the pot pouring on to the ground is the front half of the same gesture. It stands over the
building the whole thing happens in, so it gets out of the light and comes back when it has landed. It is not closed — nothing has
been decided, and it is the same board when it returns.

**A settled hand says which way it went** — a tick or a cross in a box standing over the building
for a few seconds, in the same place the lab's news stands. A wheel that stopped and told you
nothing is a wheel you had to have been watching, and you are usually somewhere else in the yard.

**And it is felt (built 2026-09-12).** A settled hand is the one moment in the game that is news,
and a wheel that stopped and then sat there read as a wheel that had not decided. A **win** is a
burst: the sign's chase goes to a full strobe for two seconds, the wheel's slices flash sides for
the first beat, and three fountains of two-cell squares go up out of the wheel a beat apart and
rain down over the yard, fading as they fall — confetti in the yard's own shades, over the sky and
the block both. A **loss** is a dud: the sign goes out, and after most of a second its bulbs come
back one at a time round the ring while the chase picks up among the ones that are back; the pot
lifts off and fades as it always did. A hard metal punctuation for the one, a dull wooden knock
for the other. A dribble of bulbs falling off the dark sign was tried for the loss and cut: white
squares over a white sign, and gone into the ground by the time anybody looked.

**It has a sign, and the sign is the one piece of writing in the yard.** Every other building says
what it is by being the shape it is — a chimney, a row of plots, a hole in the ground — and a casino
says what it is by shouting. CASINO runs down a board on the roof with a chase of lights round the
border, and the lights are the reason it is there: nothing else in this yard blinks, so from the
far end of the ground the only thing moving out past the lab is that.

Getting the letters right took several goes, and every one of the faults was the same fault in a
different place: **a stroke needs air around it or it is not a stroke.** They were four rows deep,
which is one short of what an S needs; they were three cells thick, which at double size is
thirty-six pixels of solid ink and reads as a block with a notch in it; the C kept its right-hand
stem at the top and bottom rows, which is not a C but an O with a bite out of it; the N's diagonal
was a two-cell staircase floating between the stems and touching neither; and the letters sat one
cell from the bulbs, which is less air than the letters are thick, so the whole board read as
texture. Five rows, one-cell strokes, both C corners open, an unbroken corner-to-corner diagonal,
and two clear cells everywhere. On a window too short to hold the tall version it drops to
single-cell glyphs rather than running off the top: half a sign is worse than a small one.

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

**Everybody is somebody.** A body used to be a slot: the crew was four counts, people were made out
of them when people were needed, and coming back to a saved game handed you a fresh set standing
where your crew had been. That was deliberate for a long time — *a job is a count and a body is
whichever body happens to be doing it* — and it is what lets a hat belong to a station rather than
to a head.

It is not right any more. The game **opens on two squares who are somebody**, and a crew of
interchangeable slots underneath that story is the yard disagreeing with its own first minute. So a
body has a name, an age, and a record of what it has shifted: rock taken, finds brought up, grains
tipped into the hole, and where it has spent its time. The crew is saved as *people* rather than as
four numbers.

**None of it does anything.** There is no number on that card that feeds a rate, and there never
will be: the moment one does, the crew stop being people and become a spreadsheet with faces. It is
there so that the four on the rock are four people rather than the number four. Hover one and it
says who it is.

**And you can pick one up.** The right button, held: lift a body, carry it, drop it somewhere. It
does not put them on a job and it does not take them off one — whoever you drop walks back to
whatever they were doing, from wherever you left them. Dropping one down the far end of the yard is
a body with a long walk ahead of it, which is the entire joke and the entire point.

**Let go of, they fall.** Not lowered on a wire: the same gravity the chips and the boulder use,
accelerating, landing on whatever is under them — which over the rock means *on* the rock, at the
height of the layer they came down over, not on the ground beneath it. And if they land on their own station they are simply
back at work that instant — no walk, because there is nowhere to walk to. Putting a miner back on
the rock should feel like putting a miner back on the rock.

While one is held its card stays up, so you can read who you are holding and what is in their
hands. The rows are padded to a column so the whole thing reads as a table rather than a paragraph:

| | |
|---|---|
| age | how long on the payroll |
| favorite | what it would say it does — the job it has spent the most time on |
| mined | pixels taken off the rock |
| quarried | shards brought up out of the quarry |
| farmed | spores taken off the plots |
| stored | grains put in the hole |
| carrying | what is in its hands right now, kind by kind — only on the ones whose job is carrying |

Three counters, not one "found", because the three sites are three different jobs and a body that
has done all of them should be able to show you which one it is good at. `carrying` uses the same
marks as the counter, so the card and the counter say the same thing the same way — and it is
left off a miner or a farmhand entirely, because their hands are empty between swings and a row
that says "nothing" every time you read it is a row that trains you to stop reading.

A load is not one thing. A hauler that swept the yard is carrying dust and whatever the sites
turned up in it, so the row counts each kind separately and names it by its own mark: `■ 12  ▲ 2`.
Rolling that to one number lost the shard in the middle of the load, which is the one thing on
that row worth spotting.

## The house board

The house is the one board that sells nothing. Stand at it and it lists everybody who lives there,
one row each: their name, and where that body is standing **right now** — on the rock, at the pit,
in the quarry, at the farm plots, in the lab, at home, on a break, on the way, in your hand.
Hovering a row gives that body its whole card; clicking one takes the view to them, because the
thing you want after reading a name off a list is to go and look at them — **and puts an arrow over
their head for a few seconds**, because the view on its own is not an answer. A dozen bodies of the
same size doing the same thing, and the one you asked for somewhere among them: the arrow is what
makes that a name you can find. It bobs, so it reads as put there rather than drawn on, and it goes
away on its own before you have stopped looking for it.

Standing on a place beats what you are doing on it: a miner between swings, one stood about on a
break, one you have just put down — all of them are *on the rock*, because that is the answer to
"where is it". Carrying is the exception, since a hauler is at home everywhere; for that one the
doing is the only thing that says anything.

The right button because the left one is the whole game — swinging, sweeping, catching — and a body
is eighteen pixels walking about on top of the dust you are trying to sweep. Anything competing for
a left-press competes with the thing you do most; a press-and-hold is no better, because they walk.

**Escape holds the yard.** The clock stops advancing — nothing is saved and nothing is skipped, so
it comes back exactly where it was left — and a small sheet appears in the middle of the window
saying **paused**, with a **resume** button under it. It was space for a long while; escape is the
key every menu on every machine answers to, and a sheet in the middle of the window is a menu. A
list standing open on a board answers to the same key first — one press shuts the list, the next
holds the yard — so the key never does two things at once.

The middle, rather than a corner: the thing it is about is the whole window, so it says so where
you are already looking. It is the only overlay in the game; everything else is either drawn on
the ground or hangs off a building. Same ink, same type, same border as the boards, because it is
a sheet like the others — just put somewhere else.

Held, the canvas answers to nothing at all: no swinging, no sweeping, no picking anybody up. A
paused game you can still mine is not paused. The button is there because a key is not discoverable
and somebody who came back to a stopped screen needs a way out of it that is visible.

**There is one kind of body.** You hire a worker, and where it works is a separate question you
can answer again whenever you like. A worker with no job carries dust to the pit, so hauling is
not a job you hire into "+D+" it is what the ones you have not put anywhere are already doing.

| | Costs | What it is |
|---|---|---|
| first worker | ◯ 1 | the one body you buy with a core |
| workers | ■ 60, then 81, 109... | every body after that |
| on the rock / down the cave / at the plots | free, both ways | where they work |

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

**There is a ladder.** Bodies used to sink into the quarry and rise out of it wherever they happened to
be standing, straight down through the air in the middle of the mouth — the one thing in this yard
that was plainly not a thing that could happen, when everything else walks, climbs a wall or goes
through a door. So a ladder stands in the near corner where the wall's toe is, head a cell proud of
the rim and clear of the bridge deck over it. Going in is walking to its head and coming down it;
coming out is walking back along the floor to its foot and going up. One place, worked out from the
cut, so the rungs you can see and the line a body climbs are the same line by construction.

The cave and the farm ask for the same thing in different shapes. A spelunker spends its time
**away** — down the shaft, off the surface entirely. A farmhand spends its time **standing at a plot** — stooping over
it on its own rhythm and shifting its weight between times, because a farm should look tended
whether or not anything is ripening this second. Either way the body is not carrying dust, which is what makes assigning one a
decision rather than a free tap.

**A hand keeps the row, not one furrow.** *(built)* Half of a farmhand's tending goes into the plot
it is standing over and half is spread evenly over the others — `TEND_HERE` in config.js. It used to
all land under the body, which meant a farm with one hand on it was one stalk and six patches of
bare dirt for as long as you left it there: the row read as **abandoned** rather than as slow, and a
single assignment felt wasted instead of cheap. Somebody walking a farm all day waters what it
passes.

The split is exact, so the pace is untouched: a hand is worth one plot's worth of tending in the
time one plot takes, wherever that tending lands, and the farm's output is its headcount and
nothing else. A full complement is one hand to each plot — which is what `pickPlot` arranges and
what `capOf('farmhands')` allows — and each plot then takes its own body's half plus an even cut of
everyone else's, which comes to one whole share, exactly where the old rule landed. One hand on
seven plots brings all seven on at about a seventh of the pace (measured: 12% of a full crew's
output over three minutes, the shortfall on 1/7 being the walking a lone keeper does that seven
standing bodies do not). Slower, which is why you assign more than one; never dead, which is why
assigning one is worth doing. Nothing still grows with nobody on the farm at all.

## Economy

| | Mark | Source | Spends on |
|---|---|---|---|
| **Dust** | filled square | one per rock pixel, always | numbers: carry, speed, hires, worker stats |
| **Core** | ring | one per rock finished | **places, and only places**: the quarry, the farm, the lab, the casino |
| **Shard** | triangle | a quarrier's trip | your pick, the quarry's next bench, its lamps, the school and its kit; lab: swing and haul pace |
| **Spore** | hexagon | a plot cut | the crew's bite, the next plot, and tending; lab: quarry and tending pace |

Each has exactly one job. Dust is the only one you can also *see* — it is the pile in the pit,
and the pile is the dust rather than a picture of it.

**Every row is priced in dust as well.** Whatever else a row asks for — shards at the school, spores
at the quarry, cores for a place, red for a machine — it asks for dust too, and the dust half is
worked out from the rest through one exchange table (`DUST_PER` in upgrades.js) rather than typed
into each row.

It is a rule and not a preference, because the alternative was tried by default and did not hold:
fifteen rows across the lab, the school, the scrubbing house and the quarry were priced in a single
coin apiece and asked for no dust at all, and the two most expensive things in the game — the ram
and the belt — were among them. Which is how the pile came to have nowhere to go. A heap you cannot
spend is a heap you look at, and this game is about a heap you spend.

It is added in `billOf` rather than written into the rows, because a rule fifteen rows have to
remember is a rule the sixteenth forgets. A row that genuinely wants a different number names dust
itself, and what it names is what it costs. `test/bills.test.mjs` is what stops the next row from
skipping it.

One rule gives way to it. A machine is never priced in **what its own station makes** — the jaw not
in shards, the tiller not in spores — so that a machine is never just a bigger version of the
station that pays for it. That still holds for a station's own special coin. It does not hold for
dust, because once dust is the price of everything it has stopped being the rock's coin and become
the one the whole yard shares, and every station's output ends in the same hole regardless.

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
| open the cave | ◯ 3 | the shaft, to put workers down |
| break the ground | ◯ 5 | the plots, to put workers at |
| build the casino | ◯ 6 | the one place that makes nothing |
| build the lab | ◯ 7 | multipliers and the books |

**A core opens a place and does nothing else.** They used to sell rates as well — a pick was two
cores, a miner's bite three — which put a number on the same shelf as a whole new part of the game,
and every core spent on a bigger bite was a core not spent on somewhere to send anybody. The picks
are priced in what the ground gives up instead, which is what the ground is for: **yours is a tool
and a tool is cut stone**, so shards; **the crew's is what the crew are fed on**, so spores. That
also gives the two currencies a job each rather than one of them doing all the work.

There is no row for the *first worker* either. The opening hands you a body — the one left standing
when the rock came down — so a row selling you the crew you already have is a row that could never
fire.

Twenty-five cores opens every place. The two picks compete with all of it for the same cores, which
is the one real spending decision in the game: pace now, or a new place to put people. Your swing
and a miner's are bought apart — one row that bought both was doing two jobs at once, and it sat
under `you` while half of what it paid for was out on the rock.

Opening a site glides the view to it. It is four cores and a row in a menu, and the thing bought
is off the left of the screen; without that, nothing appears to happen.

**The board does not shut on the way to it.** It opens because the cursor is standing at a station
and it stands *above* that station, so reaching it means crossing a strip of bare canvas that is
neither — aim for a row in the far bottom corner of the sheet and the diagonal takes you out of the
station's patch of ground before it takes you into the board.

So while it is open, **the whole wedge between the station and the board counts as being on it**.
Move anywhere inside that wedge and you are on your way there; step outside it and you have gone
somewhere else. A wedge rather than a box round the pair: a box would hold the menu open while the
cursor was well off to one side, which is a menu that will not go away.

The shape is worked out rather than assumed. It would be easy to say the board stands above the
station and take its two bottom corners — true on a roomy window, false on a short one where a tall
sheet is clamped against the top and the station is somewhere behind it. So it is the convex hull of
the board and the station, whichever way round they happen to lie. And if the station has been
scrolled off the side of the window there is no wedge at all: the board is clamped inside the window
and the station is not, so the shape between them would stretch across the whole screen. No station
in sight, no journey to protect.

## The cursor

**The yard is one canvas**, so nothing drawn in it can carry a cursor of its own the way a button on
a page does. Everything has to be asked, every time the mouse moves — which is cheap, and worth it:
half the things on screen do something when you click them, and without this none of them say so.

**Crosshair is the ground state**, because the ground state of this game is aiming at a rock.
Everything else is something you can do instead:

| | |
|---|---|
| **grab** | a loose core — the one thing in this yard you pick up yourself |
| **grabbing** | while you are carrying it, or sweeping dust |
| **pointer** | a place with a board on it, the counts under a station, a bird |
| **help** | a mark that will tell you why something has stopped |

The tooltip and the cursor are asked separately and answer at different moments: the cursor changes
on the way *towards* a mark, and a tooltip appearing at the same instant would be the yard answering
a question nobody had finished asking.

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
| **blaster** | a helmet in the quarry | brings one up twice as often |
| **grower** | a hat at the plots | brings a plot on twice as fast |

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
standing proud of it: the quarry is the one place in the yard with no daylight in it. A **brim** hangs a
cell over each side with a crown on top: out in the plots all day, and the only hat here that is
about the sun. A carter wears none — what you see of a carter is the cart.

**There is no ceiling on it.** There used to be — a hat a bench, a hat a plot, never more of either
than there were bodies in the yard — from back when a hat *was* a body that had been upgraded, and
buying one more than you had people for was buying nothing. Kit is not a person: a helmet on the
stand is a helmet the next hire puts on the moment you take them on, and stocking the rock before
you have staffed it is a sensible thing to do with a pile of shards. The price is the limit.

**Nobody is ever nailed down.** It was a body that got upgraded once and would then do nothing else
for the rest of the run — a decision you make in your first ten minutes and live with: thirteen
carts bought early were thirteen bodies that could never work a plot. Now the hat stays where the
work is. Take everybody off the rock and the helmets stay lying on it; send somebody back and they
are wearing one before they arrive. A station may own more kit than it has people, and the spare
lies on the ground there — visibly, as the thing itself put down — waiting for the next body you
send. Nothing is ever wasted and nothing is ever locked.


**It is a building, not a section on the bench.** The bench is the shop; this is a decision about
people, and the two read differently for being made in different places — which is also why the
bench is not eleven headings long. The school stands between the quarry's spoil and the crew's own
front doors, the stretch everybody walks twice a shift.

A trade is not something a person carries around — it is **the first n of the bodies on that job**,
worked out in one place. Move somebody off the rock and the hat goes to whoever is left.

### The shelf outside the door (built 2026-09-11)

A taught hat used to appear on its station's stand the frame the lesson
landed -- the rock's stand, a thousand pixels from the school, with nothing
walking it; the one made object in the yard that teleported
(docs/critics-2026-09-10.md, A8). It lands on a shelf outside the school's door
now (`S.hatShelf`, by job), drawn as a stand like any other with the hat on it
and its count over it, and the nearest bare hauler walks over, takes it, and
carries it to the station's stand, where it is counted as spare only once it
is put down (`shelved` and `carried` in upgrades.js, the `take`/`put` legs in
commute.js, the errand in `stepKit`). While nobody is free it waits on the
shelf where it can be seen. A carrier caught mid-walk by a save comes back a
plain hauler and the hat is back on the shelf: the walk is made again.

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

**The janitor is the exception, and smokes.** Every other trade takes whatever comes up, and the
point of that is that you never know what you will catch somebody at. A janitor spends the whole day
stood at its post with nothing to do until somebody makes a mess, so the standing about *is* what you
see of it — and a job you mostly see idle wants an idle you can recognise from across the yard. So
its break is a habit rather than a turn: it comes round every time, it is always the cigarette, and
nobody drags it into a conversation.

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

**A board's columns are measured, never guessed.** Every row on every sheet — a price row, a job
row, a name in the settlement — is a subgrid of the sheet it sits on, and the sheet's name column
is `max-content`: exactly as wide as the longest name actually on that board. This was nine
hand-cut sets of column widths for a while, one per board plus a second set for narrow windows,
plus a rule per row for the two names that had outgrown their column. Every one of them failed the
same way — somebody wrote a longer name than the guess, and the price started before the name had
finished — and the fix was always another number. A guess cannot be right about words nobody has
written yet, so the sheet measures instead. A new row that is longer than all of them widens the
column; it does not run out of it.

That is also why a job row is a name and one stepper rather than a name and three cells: two row
shapes with different numbers of columns cannot share a set of tracks, and it was that mismatch,
not any one long name, that made per-board widths feel unavoidable.

**And every row on a board is the same height as every other**, so the names come down the sheet on
one rhythm rather than at whatever height the row above happened to end at. Two things used to break
that, and both were workarounds for the guessed columns above: a bill of two coins stacked onto two
lines because the price column could not hold them side by side, and a row with no ladder dropped
the half-line the pips sit under the name on. The column holds the bill now, and the pip line is
held whether or not there are pips in it.

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

**A row says what it gives you, never what you have.** Every purchase used to read as a
before-and-after: `1 -> 1.5` and a unit, five columns, an arrow in the middle. That is two numbers
and a piece of punctuation to say one thing, and it hands the player the subtraction. Worse, both
numbers are the game's own bookkeeping. *1.5 dust a second* is a figure that means nothing until
you have watched it for a minute, and by then you have bought the row anyway — so the board was
spending its widest columns on arithmetic nobody was doing.

So a row is three columns: **what it is, what buying it changes, what it costs.** The middle one is
the only new idea, and it has exactly two shapes:

- **Something you can count goes up by a whole number.** `+1` bench, `+1` pair of hands, `+1`
  grain of reach. If the thing being counted has a mark in the yard's alphabet, the mark comes
  after it: `+1 ▪`.
- **Everything else is a rate, and a rate is a share of itself.** `+25% ▪/s`. Half again as fast is
  `+50%` at every level and never needs the units explaining — which is the whole reason to prefer
  it, because the underlying figure is a floor-clamped exponential and no player was ever going to
  reconstruct that from two samples of it.

This is the same move the sky made when the pollution readout stopped being a number and became a
mark you go and look at. The number was never the thing; the **direction** was. A board you can
scan down a column of pluses on tells you what the yard is for faster than a board of decimals.

Two details fall out of it. A rate stepping onto its floor can gain a real amount and still round
to nothing, and a row that says `+0%` reads as broken — so one per cent is the smallest claim a
purchase is allowed to make. And a count is a count: the rate formatter puts a decimal on anything
under ten, and `+1.0 benches` is a whole number pretending to be a measurement.

The rows stay declarative about it. Each one still knows its current value and its next value —
that is the one place the maths for that upgrade lives — and the difference between them is taken
in a single function that every board shares. Adding an upgrade is still adding an object.

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
| a clock | what it costs in waiting, priced in the bill with the coins |

A flag outranks a dot, because one more row under a heading you have already read is not news and
a new group is. Opening the board reads every heading on it, and the flag comes down.

**Time is a price.** A thing that takes two minutes costs you two minutes, so it is written in the
bill beside the dust and the stone under a clock, not spelled out in a note. A row that needs a
second sheet to open beside it to carry one number is a row that does not say what it is. You cannot
be short of time, so the clock on a bill is never greyed and is never the reason a row is out of
reach; while something is being made the clock counts down what is left of it.

**Every station says whether it has anything, with one mark.** An arrow under the foot of it,
pointing up at it: there is a row on that board you could buy right now. It goes when you have
bought it, and while you are standing there reading the board, because you can see the board.

One mark and one question. There were two for a while — a flag for a heading you had never read, a
dot for something you could afford — and telling those apart is a thing to learn before the yard can
be read at a glance, for a difference that changes nothing about what you do: you walk over and look
either way. "A row you have not seen yet" went with it, and should have gone sooner: a yard you have
just started has never seen any row, so every station stood there pointing at itself from the first
frame, and a mark that is always up is a mark nobody reads.

It is drawn *under* the station, in the empty ground below the line, where nothing else in this game
is drawn. Everything over a roof — the tower's bar, the lab's tick, the casino's last hand — is about
what a place is *doing*; this is about what it is offering, and the two want telling apart.

The mark is a solid head and no shaft. Five cells by three is three courses to say "up" in, and a
shaft under a head that size stops reading as an arrow altogether: the widest course becomes a
crossbar and what hangs below it a stem, which is a dagger, or with a stouter stem a plus.

**A station is walked up to by being a station.** Boards came out of signposts for a while — one
target and one size at every one of them, since the stations are not alike — and it was worse: a yard
of eight posts, each carrying a small white panel, in a game whose buildings are black masses with
small white windows cut out of them. What you point at is the thing itself. The quarry is the exception
and always will be: it is a hole, and a bridge crosses it — a ramp up, a deck straight over the
mouth, a ramp down — so pointing at the mouth meant pointing at the deck, and walking a hauler over
the quarry opened the quarry's board on the way past. What you point at there is the ground that is
missing.

**A press on the yard puts an open board away.** A board opens by being walked up to and closes by
being walked away from, which is right while the cursor is drifting. A click is not drifting: it is
somebody deciding to do something, and if that something is swinging at the rock then the sheet in
the corner is over.

The board is grouped by where the work is — you, the crew, the rock, the cave, the farm and the lab — with the headcount beside each heading. Each place that can be worked carries a **job
row**: its name, a less, the count of bodies on it, and a more. It is the one row on the board
that spends nothing, and it is the only one you can run backwards. Every row is the same three
columns, so the page lines up and can be scanned rather than read: name, gain, cost. See **The
boards** for why the gain is a plus and never a before-and-after.

**A row says what you get, in the fewest words that are still true, and the same word every time.**
Three rules, and they took a pass of their own to arrive at:

- **The heading has already said where.** A row under *the crew* does not say "worker"; one under
  *the rock* does not say "miner"; one under *the quarry* does not say "quarry".
- **Name the thing, not the reason.** The quarry's pace row was "quarry lamps" — the fiction being
  that you work faster when you can see. Nothing else on the board is named after the reason it
  works, and a lamp is not a thing this game ever draws.
- **The same word every time, even across headings.** Two rows called *speed* under two different
  headings read better than two careful synonyms; the heading is what tells them apart. So there are
  two words for every rate on these boards: a **swing** is a pick hitting rock, and **speed** is how
  often anything else happens. One word, one meaning. Costs and units carry the marks the game
itself draws: a filled square for a grain of dust, a ring for a core. A rate upgrade reads
`+25% ■/s` rather than naming pixels or quoting the figure it is moving. Deliberately not an
upgrade web.

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

**The fullest heap first, measured against its own limit.** A find is worth crossing the yard for
and one body per ground goes for one; everybody else, while any heap is over three quarters, goes
to the heap that is nearest to stopping its station — not to the nearest dust. The nearest dust to a
body coming off the hole is always the rock's heap, so picked by distance the whole crew stood on it
while the quarry's, a quarter the size and full to the line, kept the quarry stopped behind them.
Fullness is a ratio because the limits differ by four to one: counted in grains the rock's heap
wins every time too. As the fullest comes down the next fullest takes over, so the crew settle on to
whichever heap needs them without anybody being told which one that is.

**That order decides where a trip starts; the body works that heap, and the rest of the trip is a
sweep home.** A target on a strip is worked: when the column is bare the next is the nearest on the
same strip, a shuffle along the heap, until the hands are full or the strip is. Sent for one column
it took that column and filled up from the rock's heap on the way back — the rock's strip lies
between the quarry's and the hole — so the quarry's heap, the one the fullest-heap rule had sent it
to, lost a column a trip and sat at full for a whole run (`tools/node/carters.mjs`, quarry-jam).
Then it goes for nothing else: it walks back toward the lip and takes everything it walks over until
its hands are full, and it never turns round. What is behind it is the next trip's.
A grain that lands ahead of it on the way is taken — claimed or not, unless the claimant is nearer
to it: a claim is a target for empty hands, so six bodies do not converge on one shard, not a
reservation against the body already stood over the column. Whoever is nearer keeps it; a claimant
losing its target early has most of its walk ahead and the re-pick is a small course change, where
one losing it at the last stride stops on bare ground and turns, which reads as hesitating. The step ends on the next
column with something in it, so a fast body on a slow frame does not stride clean over a grain
between two looks. This is what a person with a barrow does, and it is what makes a trip readable from across the
yard: out to the thing it went for, back with everything on the way. It used to go for whatever was
nearest next, and on a yard of single-grain finds "nearest" flips direction every grain — a body took
a spark, turned for a crop, turned back for a spark, then walked to the hole past dust, and read as
lost. Before that it re-ran the whole first-pick order at every column, and a body part-laden at the
quarry walked back past the rock's heap to the farm for a spore.

**Oldest-first was measured and turned down.** `HAUL_FIFO` sends a body to the grain that has lain
longest anywhere in the yard. It banks more dust under a ram (960 a minute against 569) by camping
on the oldest heap, and starves everything new: under the ram it fetched none of fourteen finds, and
a heap filled last sat at full for a whole run. Under any feed the crew cannot outrun, oldest first
means newest never. The knob stays for the bench to compare against.

**A booking is topped up, not just spent.** A trip books room in the hole with the hands empty,
against the room the hole has at that moment, and the walk out is long: a body booked for two
because that was all the room there was stood over a heap of twenty with a dig's worth of new room
behind it, took its two and tipped. A spent booking asks the hole again — for what the hands have
left, no more — and gets nothing when the hole is still full, which is the trip ending the way it
always did.

**A yard at rest is a yard at rest, not a yard switched off.** A body with nothing to fetch strolls:
somewhere to go, a stand about when it gets there, then somewhere else. Three things stop that
reading as insects rather than as people, and all three are the same trick every other job here
already uses.

**Its own legs.** Each body ambles at its own pace and lingers its own length of time. Six of them
at exactly one speed, standing about for exactly one interval, is a marching band.

**Somewhere to go.** The spot used to be a number a few hundred pixels either side of where it
already was, which is a random walk — no destination and no reason. It picks from real places now,
weighted: mostly just a few steps, because most of what anybody does while waiting is shuffle a few
steps; often enough *over to somebody*; and sometimes the rock or the lip of the hole, which are the
two things in this yard worth going and looking at. Going over to somebody is what turns two bodies
standing near each other into the conversation the break code could always have had and almost never
got the chance to.

**Nobody stands inside anybody.** Two idlers who end up on the same spot drift apart, the way the
gang on the rock and the crew down the quarry do. Left alone they spread across the whole yard within
half a minute and settle at a pair or two standing together — which is the shape you want: mostly
apart, sometimes talking.

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

**Your own swing lands on top too.** A click takes the crest off at the nearest high point to
where you aimed, not the cell under the cursor, and a held swing does the same. You are aiming at
the rock, not at a pixel of it — and a rock is worked from the top down whether the crew are doing
it or you are.

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

The climb runs from wherever the body actually is, not from wherever it is going. That one detail
is the whole thing: seeded the other way, a miner who walked to the foot of the rock is on top of
it the frame it arrives, and a miner dropped from your hand is on top of it before it has landed.
Put on the rock, sent to the rock, or fallen onto the rock, it goes up the same way.

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

## The building site (built)

A second pass over what a building going up looks like, after the first one
(#3/#4 of "Wave 3.1") landed the machinery and none of it read. Five separate
faults, and what they have in common is worth more than any of them: **every
one of them was invisible rather than wrong**. The jig ran, the clip clipped,
the dust spawned, the body walked. A drawing that does nothing looks exactly
like a drawing that is not there, which is why four of the five had already
been reported as done.

**The hammer.** A builder swung a two-cell hop on a 1400ms beat, on the spot,
for ever. At any speed that reads as a body *bouncing*, because a fixed rate
and a fixed place is what a machine does. It is a burst now: a fast swing
(`BUILD_HAMMER_MS`), three to six of them in a row, a pause, a step along the
patch, and again. The dip is deliberately *smaller* than the old hop -- the
engine cannot draw an arm, so the strike is a short drive plus the lunge, and
height was never what was missing.

**The grit.** Site dust was pushed onto `S.smoke` -- literally the chimney
system -- so it swelled, drifted and climbed for two and a half seconds like
smoke, because it was smoke. `grit.js` is its own list: thrown out and up off
the point of impact, gravity from the first frame, one cell throughout, dead
in under half a second. Two things feed it, and they are different events: a
hammer blow throws chips from wherever the body is standing, and the works
themselves shed a haze off the ground along the whole footprint for as long as
anything is going up.

**Two bugs inside that, both silent.** `stepGrit` took `dt` for seconds when
every stepper in this game is handed milliseconds, so each chip aged a thousand
times too fast and was gone on the next frame -- the list read empty on every
frame anybody sampled it. And once that was fixed the chips were thrown at a
fraction of a pixel: they topped out half a cell up, lived and died in the one
row of pixels directly above the ground line, and were drawn in black against
the black ground line. Twelve chips in the air, none visible.

**The draw order.** `drawSmoke` runs long before `drawHouses`, so dust thrown
off the front of a wall rendered *behind* the wall. `drawGrit` is called after
the buildings and the barriers, which is the only reason the list had to leave
`S.smoke` even setting aside how differently it behaves.

**Where a builder stands.** `siteX` answers with the middle of the thing being
built -- the right answer to the question, and the wrong place to put a body.
Everything here is a black mass on a white page, so a black body standing
inside a black building is not a body in front of a building; it is nothing.
The builder was there the whole time, hammering, invisible. It stands off the
near edge of the footprint now, at the tape, on open ground, and its burst
walks *away* from the building rather than into it.

**And arrival had to gain slack.** A burst that shifts the body a few cells and
a walk that re-aims it every frame are a tug of war -- the walk dragged it
straight back, sixty times a second. Arrival is a patch now, not a pixel. This
is the same shape as the jitter in TODO.md item 5 and is worth naming twice:
anything that re-aims a body every frame will fight anything that moves it for
its own reasons, unless the aim has slack in it.

**The walk.** `stepBuilder` walked on `FARM_WALK` -- a farmhand's pace for
stepping to the next furrow, 1.1px a frame against `COMMUTE_PACE`'s 4.6 -- for
a walk clean across the yard. It is the exact bug the comment over
`commutePace` in upgrades.js was written about, one caller having been missed:
a station's shuffling speed used for a whole commute. Worse than slow, it never
asked `commutePace` at all, so the one body the player was watching ignored
every boots and pace rung they had bought.

**The quarry's shed.** #1 of "Wave 3.1" made the shed a *second* way into the
board and left the hole answering too, so pointing anywhere at the cut threw a
shop menu over the thing you were looking at. The shed is the only way in now.
The tight margin on its ramp side stays -- that part of the old reasoning was
right, and is what keeps the board off the bridge.

**The rise, for the two that never had one.** #3 of "Wave 3.1" wired the
rise-out-of-the-ground into the six places with a `withRise` call of their own.
The quarry and the farm were not among them -- neither is *drawn* as a
building, and the sheds that carry their boards arrived in the same wave -- so
both sat in `OPENS_PLACE`, both counted as rising, and nothing clipped a draw
to it. They popped in whole. They rise now, and land with the same puff and
knock as everything else.

Covered by `test/build-anim.test.mjs` (the four numbers the eye cannot audit at
sixty frames a second) and the two rewritten groups in
`test/wave31-buildings.test.mjs`. Looked at with `node tools/look.mjs build`,
which is a new scene: bought and deliberately *not* finished, because partway
through is the only state the rise, the tape and the hammer exist in.

## The shields (design, not built)
## The shields (built)

The story so far has one engine and it turns one way: rocks land on people, and everything the
yard does about it happens after the fact. You dig. In the whole run nobody has yet done the
obvious thing, which is to look up. That is the arc: **the yard tries to stop the next one.**
Three tries, spread across the run, and the first two fail — not for story reasons alone. The
rocks are the game's entire income, and a wall that worked in the mid-game would starve the yard
that built it. The failures are load-bearing.

Five tries, spread across the run, and the first four fail — not for story reasons alone. The
rocks are the game's entire income, and a wall that worked in the mid-game would starve the yard
that built it. The failures are load-bearing.

They also escalate, which is what keeps four failures from being one failure told four times.
Each shield gets further than the last: the timber is not noticed, the net slows it, the arch
stops it dead for a moment, the jack stops it and pushes it back — and only then does something
hold. By the fourth you are not asking whether this one will work, you are watching how close it
gets, which is a different and better question for a beat to ask.

**A shield failing is a beat, never a bill.** No fail state is a pillar, and a thing you saved
up for being smashed reads as punishment unless the game goes out of its way to say otherwise.
So it does, twice over: nobody is ever under a shield when it goes — the footprint is kept clear
of bodies the way it already is for a landing — and the wreck comes most of the way home, flung
out along the heap in the same arc a miner's spoil takes and mined back as ordinary dust. What
you paid for was the finding out, and the finding out is the story.

**The props.** The first try is timber: a frame of legs and a flat lid stood over the dig,
bought on the bench for dust and raised by the crew plank by plank — walked out, climbed, and
built, because every body walks. It stands there long enough to be believed in. Then the next
rock comes through it as if it were not there, the planks go out over the heap, and the yard is
back to digging before the dust settles. The lesson is cheap and the game makes sure it is:
this one is priced to sting for a minute, not an hour.

**The arch.** The second try is stone — a proper arch over the landing spot, cut white out of
**One try per coin, and each fails the way its material has to.** The five
shields run dust, spore, shard, spark, core — which is every currency the yard
makes, spent once each on the same question. That is not a tidy pattern laid
over the story; it is the story. Each attempt is the yard reaching for the best
thing it has and finding out what that thing is worth against the sky, and the
order is the order the yard learns to make them. Two of those coins had no real
sink before this — spores and sparks piled up unspent, which is what makes a
currency flavor rather than a decision — and a beat you can only buy with them
is a better answer than another multiplier.

**The net.** The second try is rope off the farm, slung between two masts and
priced in spores. It is the first idea that is not "build it stronger": if you
cannot stop the thing, catch it. And it half works — the net takes the rock and
*slows* it, sagging and sagging as it stretches, and for a few seconds the yard
is watching a boulder come down gently for the first time. Then the rope pays
out to the ground and lets it through anyway. The lesson is the one the arch
will spend stone learning again from the other side: soft catches but does not
hold.

**The arch.** The third try is stone — a proper arch over the landing spot, cut white out of
the quarry and priced in the quarry's own shards, because it is built of the quarry's own coin.
And it nearly works. **The arch catches one.** The rock comes down, the arch takes it, and for
a held beat the yard has won — long enough for every body on the ground to stop and look up,
which is a thing the crew has never once done at a falling rock. Then the crack runs, and the
arch comes down with the rock on top of it, and the arch's stone lands minable alongside
everything else. The lesson is the game's own color rule said out loud: everything of the
ground is grey and goes back to the ground. Rock cannot hold rock. Stacking the yard higher is
still the yard.

**The dome.** The third try is the tower's, and it is the first shield not made out of the
**The jack.** The fourth try is the machines': a steel plate on hydraulic rams,
priced in sparks, because sparks buy every machine and this is a machine. It is
the yard's best technology and the only shield that does not merely receive the
rock — it *pushes back*. The plate takes the weight, holds, and then rises,
shoving the boulder a few feet back up toward the sky while the whole yard
watches. It is the closest the game comes to winning. Then the rams give out,
the plate folds, and the rock comes down on top of the wreck. The lesson is the
last one available before magic: the yard's best machine is still a thing made
out of the ground, and the ground has been losing this argument for four
shields.

**The dome.** The fifth try is the wizards', and it is the first shield not made out of the
thing it is stopping. Sold on the tower's board and priced in everything — cores, dust, shard,
spore and sparks at once, every line well above the biggest ask of that coin anywhere else at
any rung, and the whole bill about a third of everything else on every board put together, so
it is the dearest thing in the game by a distance (`DOME_BILL`; `test/shield.test.mjs` climbs
every ladder and holds it against every rung). It was four cores alone, which made the end of
the argument cheaper than the machine that had just lost it, and then a bill a climbed ladder
or two could outbid; the last shield is the whole works' answer to the sky, and its bill says
so. The four that fail are priced like a real rung of the station whose coin they spend, each
dearer than the last (`NET_COST`, `ARCH_COST`, `JACK_COST`) -- enough to sting, never enough
to stall the yard that has to keep digging under them. And it is not built, it is *summoned*: the wizards fly over from the star and ring the
landing spot the way they ring an empty sky, and pour — the same act, aimed at the ground, in
the same purple, sharing the same clock across however many of them are in the ring. The four
shields before it were labor by somebody standing at the spot; this one is the only labor in
the game done by bodies that never touch it — the rule holds, what magic emits is purple and
says so. On the bench, where every material the ground makes has now failed, the last row costs
nothing and only wonders: *maybe the wizards would know?* — and pressing it walks your eye out
to the tower, where the answer is sold by the people who will cast it. And the choreography is
the opening played back the right way round: the last of the rock goes, the one underneath is
there in the ground saying the same dots they have said all game, the next rock comes down the
way it always has — **and this time it stops.** Held overhead on the dome, the first falling
thing in the game to touch nothing, and for the first time there is time: somebody runs in
under its shadow and digs, the way somebody has dug at every gap all game, and no rock comes to
stop them. The mate climbs out and walks clear. Two squares stand together on the ground
passing dots back and forth, and every so often one of them says the other thing. Then the dome lets the rock down gently on the empty
spot, and the yard goes back to work.

Every rock after lands the same way — caught, held a breath, set down. The drumbeat is kept,
because the drumbeat is the income; the threat is retired, because the story is over. This is
how the first line of this document and the section above it are both true at once: **the
story ends on purpose. The yard does not.**

## Dust is carried to the site (design, not built)

When you buy a rung, the dust that pays for it leaves the pile and arcs across
the yard to the bench. It is the one thing in the yard that moves without
anybody moving it, and it reads that way: a purchase is a number going down
and a pretty line, where everything else you own is a body walking.

**The ask:** haulers carry it. A purchase becomes a *delivery*. The row is
pressed, the dust is reserved -- the counter drops, the pile does not -- and
haulers walk loads from the pit to the site the way they walk loads from the
rock to the pit. The work starts when the last load lands. That is exactly what
"Time is a price" already says, extended from *hands* to *materials*: a
building nobody is carrying dust to does not go up.

**What it costs.** Every purchase is slower by a walk, and that is the point
and also the risk. An early yard with three haulers would spend half its time
ferrying eight dust to the bench for a rung that used to be a click. So the
delivery is for the things that read as *building* something -- **buildings
and machines** -- and rungs keep the snap they have. A floor rather than a
kind would also do (nothing under fifty dust is carried), but the kind is the
honest line: you can watch a shed go up out of dust somebody brought; a swing
getting quicker has nothing to carry.

**Shape.** A reservation per site, `S.owed[site]`, that haulers treat as a
claim the way they claim a column of dust -- so the booking, the elbows and the
"a laden body banks what it has" rules all apply unchanged. `spend` grows a
second exit: a load lifted into a body's hands rather than into the air. The
work in `works.js` waits on `owed === 0` before its clock starts. Nothing is
drawn that is not already drawn: a hauler walking a load is a hauler walking a
load, and the pile going down at the lip is the pile going down at the lip.

**Not decided:** whether the reservation is taken out of the counter at press
or at delivery. At press is simpler and is how every other price works; at
delivery is truer and lets you cancel. Recommend at press.

### Amendment: it goes to the shop it is spent at, not the bench (built)

*(Raised while designing the apothecary, and it is the general form of the
above.)* A spent resource used to arc to **the bench**, wherever the row lived --
buy a farm rung and the dust flew to the bench, not to the farm. That was
backwards: the dust is being spent *at the farm*, on the farm's own board, so it
should travel to the farm. The destination of a spent resource is **the station
that sells the row**, not one fixed building -- and it is now.

**How it is built.** The arc already existed (`S.paid`, flown by `fly` in
game.js); all that was hard-coded was the target. `buy` in upgrades.js now reads
the row's own station off `siteBox(u.site)` and, for the length of the payment,
sets `payTo` (pit.js) to that station's centre; `lift` stamps the destination on
each grain as it leaves the pile, and `fly` flies each grain to its own stamp,
falling back to the bench for a spend with no `payTo` around it (the rift, the
casino). A bench row keeps paying to the bench, because that is its site; a farm
rung's dust arcs to the farm, a brew rung's to the cauldron.

**Not the hauler-carried version.** This is the *destination* change, not the
full "haulers walk loads to the site" design at the top of this section
(`S.owed`, the work waiting on delivery) -- that is still design, not built. The
grains still arc on their own; they just arc to the right place now.

**What is still only dust.** Only dust arcs at all -- shard, spore and core are
taken out of the hole without a flight, so the crop a brew costs still leaves the
pile without a visible trip *into* the cauldron. Making the other coins arc to
their station too -- so the crop is seen going in -- is the remaining piece.

## Later rungs cost the other grounds (design, not built)

Opening the farm feels pointless. It unlocks one ladder, for bodies you already
have, priced in a coin only it makes -- so it is an island, and the quarry is
another, and the rest of the yard never needs either.

**The ask:** past a size, every ladder starts asking for what the other
grounds make. After ten houses rungs cost food as well as dust; after fifteen
they cost green and blue too. The stations stop being islands and become
*suppliers*, and a yard that has not opened the farm at ten houses is stuck on
every rung until it does -- which is the intended pressure, and the reason the
farm is worth opening.

**Shape.** It is the dust rule's mirror. `billOf` already adds dust to every
row from one exchange table (`DUST_PER`) rather than sixteen edits; this is a
second table, `TIER_COIN = { 10: 'spore', 15: 'shard' }`, keyed on `S.crew`,
that adds a coin to every *rung* once the crew is that size, at `rungCost /
DUST_PER[coin]` of it. One table, no per-row edits, and a new tier is a line.
Places and machines are left alone -- they already cost cores and red, which is
the same idea said earlier.

**Food is the spore.** A fifth coin is a fifth mark, a fifth pile, a fifth
ledger and a fifth thing to carry, for a distinction the player never has to
make: what the farm grows is what the crew eat. The spore's mark is a hexagon
and it is green; it is already food if you squint, and it should stop being a
squint.

**The row has to say why.** A rung you cannot afford for want of a coin you
have never seen must show that coin's mark, greyed, and not simply go dark --
otherwise the first thing the tenth house does is break the shop with no
explanation. The scrubbing house's rule: the disease is the advertisement.

**Not decided:** the thresholds. Ten and fifteen are the ask; the right numbers
are the ones at which a yard that has been playing along has *just* opened
those stations, and that is a thing to measure on a save rather than pick.

## What the two grounds sell (built)

The farm and the quarry sell the same four rows as each other, and two of those
four are the same rate sold twice. Open the farm and the board is *another
plot*, *speed* (a dust rung over tending) and *speed ×* (the old lab
multiplier, over that same tending, in spores) -- one row that makes the plots
faster, and beside it a second row that makes the first row's answer bigger.
The quarry does it too: *another shovel*, *speed*, *speed ×*. A player reading
either board has to work out which speed is which before spending anything, and
the honest answer is that there was never a reason for two.

It is worse than redundant. The `tend` rung's own comment concedes that at the
old price "tending speed was worth buying before there was a second plot to
tend, which is the farm selling you a rate on a rate of nothing" -- and the fix
applied then was to triple the price, which makes a bad row expensive rather
than making it a good row.

### The shape

Each ground sells **a place, and two ladders**, and nothing else until its
machine.

- **The place** is what it is today. *another plot* to `FARM_PLOTS_MAX`,
  *another shovel* to `QUARRY_BENCH_MAX`, one coin, one price curve, and it
  ends where it ends now.
- **A yield ladder** -- how much a single go is worth. A cut comes off the plot
  worth more than one spore; a dig turns up more than `seamShards()` says
  today.
- **A speed ladder** -- how often that go happens. This is `tendMs` and
  `cellMs`, the rungs that exist now.

Two ladders, and they answer different questions: a yield rung pays the same
on a yard with one hand as on a full one, so it is the row a thin early yard
actually wants, while a speed rung is only ever worth what the headcount
already is. The old board had two speeds and no yield at all.

### A ladder is four cards, not one

Twelve rungs each, in four bands of three -- and **each band is its own card,
with its own name and its own words**. The card you can see is
the band you are on; finishing a band retires that card and the next one takes
its place. So the board still shows one yield row and one speed row at a time,
and the ladder is twelve rungs long without ever being a twelve-pip row nobody
reads.

What deepens across the bands is the **bill**. `bill` is already a list of
`[coin, n]` pairs that `billOf`, `canPay` and the price text all handle -- the
machines are priced that way -- so this costs nothing structurally.

| band | rungs | what it costs |
|---|---|---|
| 1 | 1-3 | dust, and a lot of it |
| 2 | 4-6 | dust **and the ground's own coin** |
| 3 | 7-9 | dust, its own coin, **and the other ground's** |
| 4 | 10-12 | dust, shard, spore, core and a spark -- everything the yard makes |

**The ground's own coin, and why that is not the rule being broken.** A station
is not bought *deeper* with the thing it makes -- that is why a plot costs dust
and a bench costs spores, and that stands. A ladder is not depth. Band two is
the crop going back into the ground it came off, which is what fertilizer *is*,
and it means a farm that has stopped being tended cannot climb its own ladder.
The places keep the old rule; the ladders ask the place to feed itself.

**The last band is the research.** `labtend` and `labcave` -- the multipliers
that were the lab's -- become band four of the speed ladders, and the yield
ladders get a multiplier of their own on the same machinery: three rungs, the
all-coins card, still gated on the bench standing and still a BUILD that bodies
have to finish. See "Band four is the multiplier". That
is where the second speed row went: it is not a rival ladder any more, it is
the top of the only one.

### The sixteen cards

A card is a **name** and its gain line, and nothing else. No `note`: the row
already says what it does, in the two shapes `gainText` writes -- a percentage
for a rate, a count for a count -- over the `unit` the ladder names. A sentence
under that would be the board explaining the same thing twice in worse words,
and the machines' tune rows are the only place in the game that needs one
because they alone have no `from`/`to` to show.

Each ladder is one idea escalating, and the last band is the fantastical version
of the band before it: seed becomes astral seed, a greenhouse becomes a season
you own, powder becomes charmed powder, a rail cart becomes no gravity at all.
That is what makes a band worth a new card rather than a new pip -- the words
move as far as the price does.

| band | bill | yield, the farm | speed, the farm | yield, the quarry | speed, the quarry |
|---|---|---|---|---|---|
| 1 | dust | compost | hand tools | sledges | ramps |
| 2 | + the ground's own coin | fertilizer | sprinklers | black powder | scaffolding |
| 3 | + the other ground's | hybrid seed | greenhouses | dynamite | rail carts |
| 4 | everything, sparks and all | astral GMOs | summer's aura | enchanted TNT | anti-gravity zone |

The unit each one shows is the ladder's, not the card's: `spores/cut` and
`plots/min` down the farm's two, `shards/dig` and `trips/min` down the quarry's.
So the four cards of a ladder read as one ladder however the words change.

**No card draws a prop, and that is not an oversight.** An earlier pass had each
band build a thing in the yard -- a sack, a standpipe, timbers -- which is
fourteen sprites for four ladders, and none of it is what the ladder actually
is. No ladder in this game has ever drawn a stage per rung: the kit ladders, the
crew's rungs and the machines' endless tune rows all sell a rate and draw
nothing, and the yard reads fine.

This is the "quarry lamps" rule kept rather than broken. That row was renamed
because it was *called* the reason it worked while the ladder said nothing about
its rate. These cards say the rate in the unit and the gain line, every one of
them; the name sits on top and is allowed to be fun.

### Band four is the multiplier

The last three rungs of a ladder are not more of the rung field -- they are the
multiplier over it, on the machinery that is already there. `mult.js` keeps four
of these and each is a level in `S.mult`, a `STEP` of a quarter again per rung,
a work cost that climbs with the rung, and `finish()` to land one. `labtend` and
`labcave` were exactly this, sold as a rival row beside the rung they multiplied;
band four is the same rung in the only place it makes sense, at the top of the
ladder it multiplies.

So a ladder's twelve rungs are **nine of its own field and three of a
multiplier**, and `rung()` reads `level` up to nine and `9 + levelOf(field)`
after. The yield ladders get two new multiplier fields on the same machinery --
`crop` for the farm, `seam` for the quarry -- so all four ladders end the same
way and nothing about band four is special-cased per ground.

Two consequences, both wanted:

- **A working is a BUILD.** These rows carry `work`, so bodies leave what they
  are doing and stand at the site until it is finished. That was the lab's whole
  bargain and it survives the lab.
- **`levelOf` needs a cap per key, not one for all four.** It clamps at `RUNGS`
  today, which is five. The crew's two -- `swing` and `haul`, on the shack and
  the house -- keep five; the four station ladders end at three, because a band
  is three rungs. One table, `MULT_MAX`, read by `levelOf` in the one place it
  clamps.

**What that costs at the top.** Tending and the cut used to run five rungs to
the floor and then multiply by up to 3.05; now they run nine rungs to the same
floor and multiply by up to 1.95. The very top of both rates comes down by
about a third. That is a `STEP` question rather than a shape question -- a
per-key step, or a fourth rung -- and it is a knob, so it is the dev panel's to
settle on a yard.

**Band four costs sparks, so band four is magic.** A spark is what the machines
and the rift are bought with and nothing mundane is priced in one, so the top of
each ladder is the yard admitting what it has become. It is also why band four
stays a BUILD: a working somebody has to stand and finish is a decision, and one
you simply buy is a number.

### The mechanism

One helper, used four times, rather than eight hand-written rows:

`tierRows(field, bands)` takes the level field the whole ladder counts on
(`S.tendLevel` and three new ones) and a table of four bands -- a name and the
coins it adds, which is all a band is -- and returns the four rows. Which
card shows is `Math.floor(level / 3)`; `rung()` is the level within the band and
`rungs()` is three, every band, which is why the bands are equal. A new band is a line in the table,
and the wording of every card in the game sits in one readable block per
ladder. There is no per-card price code: the bill is `rungCost(first, level)`
in dust plus the band's coins at `DUST_PER` of that.

**The speed ladders keep the range they have.** `tendMs` and `cellMs` run from
their base to their floor over `RUNGS` rungs today; over twelve they run from
the same base to the same floor in finer steps. The end of the ladder is where it
is now -- this is not a speed increase, it is the same climb sold in more
decisions.

**Saves.** `S.tendLevel` and `S.quarryPaceLevel` keep their meaning and their
place in `SAVED`; a save at rung four simply opens on band two's card. The two
yield levels are new fields and go in `SAVED`.

**Prices.** Band one is deliberately steep in dust: the farm is a place you
open after the rock has been paying for a while and its board should cost like
it. `PLOT_COST` 260 → 520, and the first yield rung 720 dust where the retired
`tend` rung asked 360. The quarry's `BENCH_COST` and its band one want the same
factor for the same reason.

**Not decided:** the exact first price and steepness of each of the four
ladders, and how much a yield rung is worth -- a flat extra per go, or a share
of a go. Both are dev-panel questions, one `export let` and one `TUNABLE` row
each, and are worth answering on a yard rather than on paper.

### What landed, and the two calls the design left open

Built. `tierRows` is in `src/upgrades/tiers.js` and is called four times, off
four tables of four lines; the shape of a ladder -- three to a band, four bands,
nine rungs of the ladder's own field -- is `TIER_BAND`, `TIER_BANDS` and
`TIER_OWN` in `src/config/tiers.js`, with `MULT_MAX` beside them. `levelOf`
reads that table in the one place it clamps. `labtend` and `labcave` are band
four of the two speed ladders and keep their keys; `labcrop` and `labseam` are
the two new yield multipliers, over `S.mult.crop` and `S.mult.seam`. All four
bands of all four ladders are works the station's own hands stand and finish,
which the speed rungs already were and the last band was as the lab's row.

The two open numbers were answered like this, and both are dials:

- **A rung costs what a rung always cost.** `rungCost` is half again a rung over
  five rungs, which is about six and a half times across a whole ladder, and
  that span is the thing worth keeping rather than the exponent, which was
  written for a ladder of five. `tierCost` is `rungCost` asked for a fractional
  level, so twelve rungs span what five did. 1.6 twelve times over is a hundred
  and seventy times the first price at the top, which is a row nobody buys.
  `CROP_COST`, `TEND_COST`, `SEAM_COST` and `QUARRY_PACE_COST` all open at 720
  dust and are all `export let`.
- **A yield rung is a share of a go, and both grounds use the same arithmetic.**
  `tierGain` is one call: a share again of itself per own rung, and the
  multiplier's quarter again per rung of band four. The farm's base is one
  spore, so a share of one is the flat extra spore the design offered as the
  other option; the cut's base is already a handful a bench, so the same call
  reads there as a share. `CROP_PER_RUNG` and `SEAM_PER_RUNG` are the dials.

Band four's bill is the dust price converted at `DUST_PER` in each of the four
other coins, which at the top of a ladder is seven cores -- steep, and steep by
the economy's own exchange rate rather than by a number picked for this row. It
is the first thing to argue with on a yard.

## Every ladder is sold in bands (built)

The farm and the quarry sell their ladders as cards -- three rungs to a card,
a bill that deepens card by card, a new name on each -- and nothing else in
the yard does. The apothecary's four building ladders and five potency ladders
are flat five-pip rows priced spore-and-dust from the first rung; the bench's,
the crew's, the shack's and the scrubbing house's are the same shape in other
coins. So the game has two ways to sell a ladder, and the one every board but
two uses is the one the grounds' redesign called "a twelve-pip row nobody
reads" and replaced. This section finishes that replacement: **the band shape
is the shape of a ladder, everywhere**, and it is a rule from here on (it is
in CLAUDE.md's "Decided" list): a new ladder on any board is built as bands
through `tierRows`, and a flat row with one bill from rung one is the old
shape. The apothecary is the first board to get it because it is the one that
asked.

What is *not* a ladder, and so not touched: a one-off (`hold to mine`, the
outhouse's `another cap`, the tower's hat), a count with no ceiling (the
school's carts, the machines' tune rows), and a place (`another pot`,
`another plot`). Those keep their coin and their one price.

### The rule

A ladder is **three bands of three rungs**, nine rungs in all, drawn as one
card with its nine pips in three groups (each band was its own card until
2026-09-12; see `tierRows`). What deepens across the bands is the bill, and
the order the coins arrive in is fixed for the whole yard:

| band | rungs | what it costs |
|---|---|---|
| 1 | 1-3 | **dust only**, and cheap -- the first card on any board is one an early yard can buy |
| 2 | 4-6 | dust **and crops** |
| 3 | 7-9 | dust, crops **and ore** |

Dust, then spore, then shard, because that is the order the run hands them
out: the rock is there from the first click, the plots are the first thing a
core buys (`FARM_DUST` 600), the quarry the second (`QUARRY_DUST` 2000). A
card never asks for a coin the yard has no source for (`coinsOpen` in
upgrades/price.js -- spore is the plots, shard is the cut, spark the sky, core
the first one banked). A bill in crops on a yard without plots is not a price
the player can read, so it is not shown: the ladder's card **stays on the
board, greyed, with "needs plots" where the price was** (`coinNeeds`) until
the plots are broken, and then prices its next rung. It stays because the
card is the whole ladder -- when each band was a card of its own the band-two
card simply went, and once the bands became one card that same gate took the
three rungs you had bought off the board with it. A card that is *only* a bill
in a coin with no source -- the grounds' research card, the hand-written rows
priced in ore (the janitor's second cap, the recycler, crit damage) -- still
goes rather than standing there. The
grounds' own tables already have this order (compost / fertilizer / hybrid
seed is dust / +spore / +shard) and keep it; nothing there moves.

**No fourth band.** The grounds' fourth card is the old lab multiplier --
everything the yard makes, a spark and a core in the bill, a BUILD bodies
stand at -- and it exists because those two multipliers were already in the
game and needed a home. The other stations never had one, and inventing six
more all-coins research cards would put sparks on every board in the yard.
Sparks are the machines' coin, end to end (see "Decided"), and the tower's
and the machines' own ladders are spark-priced and endless by that decision;
they are **not** in this design and do not take the band shape. Three bands,
nine rungs, and the ladder ends where the third card ends.

**The prices are the ladder's, not the card's.** `tierCost` already spreads
`rungCost`'s five-rung span (about six and a half times, bottom to top) across
a longer ladder by asking for a fractional level, so a nine-rung ladder keeps
the bottom and top prices the five-rung one had and puts finer steps between
them. The first rung's dust price is the number each ladder already carries
(`BREW_RUNG_DUST`, `HAUL_CARRY_COST`, `FAN_COST`'s dust worth, and so on);
the crop and ore halves are that dust at what a spore and a shard are worth
(`DUST_PER`), which is how the grounds' bands price theirs and how the machines
have always priced sparks. So no new price is typed: a band's bill is the dust
price said in more coins, and the only tuned number per ladder is still its
first rung.

**The values are the ladder's too.** Every five-rung ladder eases from a level-0
value to a level-5 value (`BREW_MS0` -> `BREW_MS5`, `BUFF_MS0` -> `BUFF_MS5`);
the same two ends now sit at rung 0 and rung 9, and `ease` is asked for the
nine steps between. A ladder gets longer without getting stronger -- the top of
the ladder is where it was, there are more decisions on the way up, and each
one is cheaper than the old rung it replaces. This is the same call the
grounds made when twelve rungs replaced five.

**A ladder that is already three rungs is one card.** `dosecarry` (a body
carries 1, 2, 3, 4 vials, and four is where believing stops), `rockhandpick`
(a whole pixel of bite a rung, three of them), the crit `power` ladder
(`CRIT_MULT_RUNGS`, three) and the school's kits (`KIT_MAX`) are short on
purpose, each for a reason written on its row. They stay one card of three
and take **band one's bill: dust only.** Stretching them to nine would break
the reason each is short; leaving them dear in shards while everything beside
them starts in dust would make them the odd rows out on every board. The
school's carts, which have no ceiling and no pips, are not a ladder and are
left alone.

### The apothecary's board

Four building ladders and five potency ladders, all through the one helper,
all three cards deep. The `brewing` section shows one card per ladder -- the
band it is on -- so the board is no longer than it is now, and the `potency`
section still shows one card a tonic. The names, in the apothecary's own
voice, each band the fantastical version of the one before it:

| ladder | unit | cards |
|---|---|---|
| dose length | s | brew concentration |
| doses a brew | doses | batch size (six rungs, 1 -> 7) |
| potency, per tonic | % | the tonic's own name -- "hearty stew" |

**Brew speed and the armful are cut (2026-09-12).** With doses a brew, brew
speed, the armful and another pot all for sale, every rung the building sold
pushed production up and nothing drew it down, and an endgame yard brewed far
past what its bodies could drink. So the batch clock is fixed at thirty
seconds (`BREW_MS`) and a stirrer carries one vial (`DOSE_CARRY`): the pot
brews as fast as a keeper can light it, and what is for sale is how far a batch
reaches (doses, **one** to seven, a whole dose a rung over two cards -- the
eased 3 -> 8 rounded to two rungs that read "5 -> 5"), how long it holds (dose
length -- kept, as the one lever that draws *consumption* down rather than
pushing production up) and how deep each recipe goes (potency). Saves carrying
`brewLevel` or `doseCarryLevel` read at the fixed values.

The potency ladders are per tonic already (`S.potency[key]`), and stay so: a
card called "a longer steep" under the stew deepens the stew. Five tonics, three
cards each, one showing per tonic. `dosecarry` ("a fuller armful") keeps its
three rungs and its one card and drops the spore half of its bill.

The reveal gates stay where they are: `after` (batches landed) still decides
when a ladder's first card shows at all, and the grind pass's rule -- no rung
bought inside a minute of the door -- holds because the first rung's dust
price is unchanged and the crop half moves to band two, where the player has
had to brew their way to it. That is the point of the shape here: the first
card is the cheap one *because* it is dust only, and the ladder gets dear in
the coins the craft has started spending.

Retire `BREW_RUNG_SPORE`: the spore half of every apothecary rung is derived
from the dust price by `DUST_PER` from band two on, like the grounds'. One
fewer tuned number.

### The other boards

The same helper and the same rule, station by station. The keys are
internal and never renamed (`S.seenRows`, works in flight in a save quote
them), so band one keeps each ladder's existing key and bands two and three
take the grounds' convention of `key2` / `key3`. Names are proposed; every one
is the ladder's idea escalating, in the register of the board it sits on.

| board | ladder | cards |
|---|---|---|
| bench | your strength | carry amount |
| bench | your swing | auto swing |
| bench | your pickaxe | pick damage |
| bench | crit chance | crit chance (2x a rung, 500 dust first) |
| bench | crit damage | one card, dust + crops + ore, 2x a rung, 1000 dust first |
| bench | hauler carry | hauler carry |
| bench | hauler speed | hauler speed |
| shack | diggers' swing | swing speed |
| shack | diggers' pick | digger pick damage, one card |
| scrub | the fan | fan power |
| farm | yield / speed | crop yield, farming speed; the research card keeps its name |
| quarry | yield / speed | ore yield, mining speed; the research card keeps its name |

**A ladder is one card (2026-09-12).** A card a band -- compost, then
fertilizer, then hybrid seed, later "hauler speed II" -- gave a nine-rung
ladder two counters for one position: which card, and which pip on it. The
ladder is one card now, its nine pips in three groups, each group in its
band's coin (black, then the farm's green, then the quarry's blue), the bill
deepening as the groups fill. The pips are the count and the price's legend
at once. The card itself is three lines, each one fact and none of them
wrapping: the name with the pips on its right; the gain with the work clock
on its right; the coins, left-aligned as cells. Left is the purchase, right
is time. A card with no gain is two lines. Settled on the card bench
(`cards.html`) against the six-coin research bill, the widest in the game,
which fits on one line. The grounds' research card stands beside the finished
ladder as a card of its own.

**Card names are the thing, once (2026-09-12).** The invented names
-- compost, fertilizer, hybrid seed; lucky charm, rabbit's foot -- were
reviewed on the Ladder Book and dropped: across thirty cards the words hid
what each ladder was for, and a player reading "sprinklers" still had to read
the gain line to learn it was speed. A card is a short, accurate description
of what climbs, and the second and third cards are the same words with II and
III -- and then, with the ladder one card, the name alone. `named(key, name)`
in `upgrades/tiers.js` builds a ladder's bands from one name.

**The crew's two multipliers are dropped (2026-09-12).** `labswing` (swing x,
over the diggers' speed and your own click) and `labhaul` (pace x, over the
haulers' walk) were the lab's last two rows still sold as rows: five shard
rungs under a ladder that had just finished, a second ladder over a number
that already had one. Same shape as load-then-harness, same answer. `mult.js`
keeps `S.mult.swing` and `S.mult.haul` readable for old saves and nothing
multiplies by them; a work in flight for either is dropped on load (a row that
no longer exists has no work). The grounds' four fourth cards are the only
multipliers left, and they are cards of their own ladders, not rows beside them.

**The harness and the boots are folded in (2026-09-12).** Load then a harness,
pace then boots, were two ladders each over one number -- what a hauler
carries, how fast it walks -- and two rows over one number read as the same
thing for sale twice. One ladder each now, to the top the pair reached
together: nineteen grains carried (two a rung from one; load and harness were
1 + 9 + 9) and four and three quarters times the base walk (`HAUL_PACE_TOP`
3.75, pace's 1.5 and boots' 2.25). A save carrying `harnessLevel` or
`bootsLevel` folds it into the ladder that is left, trimmed to the top. The
crit `power` ladder is one card of three, dust only, as above.

The fan is the one change of coin with a balance consequence: it is the sky's
lever (see "Decided" -- the sky is beaten only by investing here), and it goes
from shard-only to dust-first. Its dust price is `FAN_COST * DUST_PER_SHARD`,
the same worth it has today, so a band-one fan costs what it cost and asks for
it in the coin a polluted early yard actually has -- which brings the sky's
answer *earlier*, not cheaper. Bands two and three then put the shard back on
it. If the fan comes under control too early on a real yard, the knob is
`FAN_COST`, as it is now.

### What the helper has to learn

`tierRows` in `upgrades/tiers.js` is the one place a ladder is built as cards,
and it is written for the grounds: four bands (`TIER_BANDS`), the last one a
multiplier finished as a BUILD (`multKey`, `finish`, `workFor`). Three things
generalize, none of them new mechanism:

1. **The band count is the table's length**, not `TIER_BANDS`. A ladder with
   three lines in its `bands` is three cards; the grounds keep four.
2. **The multiplier band is opt-in.** With no `multKey`, every band climbs the
   ladder's own field and there is no `finish` card. `tierLevel` and `tierGain`
   already clamp on `TIER_OWN`; they read the own-rung count off the ladder
   instead.
3. **`tierCost` takes the ladder's length.** It spreads the five-rung span over
   `TIER_RUNGS - 1` today; it spreads it over `rungs - 1`.

`TIER_BAND` (three to a card) stays the one shared number -- it is the shape
of a card, and every board should read the same. The state fields keep their
names (`S.brewLevel`, `S.carryLevel`, `S.fanLevel`...); a save with a level of
five on a ladder that is nine long is a player five rungs up a longer ladder,
at the value `ease` gives rung five of nine -- a little below where they were,
never above, and no rung lost. `persist-roundtrip` has nothing new to learn.

A save carrying a *finished* five-rung ladder is the one case worth a look:
`done` on the old board becomes 5 of 9 on the new, with four dust-and-crop
rungs to buy. That is the design working -- the player is offered the deeper
craft -- not a migration to write.

### What this costs the player, and why it is worth it

More decisions per ladder and a cheaper first one. A board today asks the same
two coins nine times over a five-pip row; a board in bands asks one coin for
three rungs, then two, then three, and says with a new card each time that the
craft has moved on. That is more to read across a run and less to read at
once, which is the trade the grounds already made and the one every other
board is still waiting for.

### Built (notes, 2026-09-12)

What the build decided that the design did not:

- **Whole-unit ladders climb a little higher.** Your strength (a grain a
  rung), your pickaxe (a pixel a rung) and the haulers' load (a grain a rung)
  cannot take fractional steps, so nine rungs of a whole unit is a higher top
  than five were: your pick takes 10 px at the top where it took 6, a hauler
  carries 10 where it carried 6. The harness went from two grains a rung to
  one, so its top is 9 where it was 10. Every *rate* ladder -- the swing, the
  gang's swing, pace, boots, the fan, the crits, every apothecary ladder --
  eases to the floor or top it always had; `HAUL_PACE_TOP` and `BOOTS_TOP`
  say the haulers' in config.
- **The school is left alone.** Its kit rows are a count of hats with a
  ceiling, not a ladder over a rate, and the carts beside them have no
  ceiling at all; a board with hats in dust and carts in shards would be the
  odd one out in the other direction. The shard is what the school is for.
  One line to change if the rule should reach it anyway.
- **The potency cards are named for the drink and then the step**: "stew,
  steeped", "stew, twice boiled", "stew, distilled" -- five ladders showing
  one card each have to read as five tonics.
- **The crew's two multipliers** (`labswing`, `labhaul`) keep their five
  shard rungs and now follow the third card of the ladder they multiply.
- `cards(key)` in `upgrades/tiers.js` gives a ladder's three keys from its
  first, and the boards' section lists spread it; `climb(key, n)` in
  `test/helpers.mjs` buys a ladder through whichever card is showing, the way
  a player does.

### Open

- **The order of coins on the scrubbing house.** Dust / spore / shard is the
  yard's order and the design uses it everywhere. The fan is the one ladder
  where shard is its own coin today, and an argument could be made for
  dust / shard / spore there. Not taken: one order the whole yard over is the
  rule, and a per-board exception is the kind of constant the "fix the system"
  rule exists to refuse.
- **Card names.** Twenty-some proposed above. Any of them is a word in a
  table and changes nothing else.

## Not doing

Prestige. Ascension. Timed events. Offline accrual. Achievement grids. Anything that asks the
player to come back tomorrow. No score, no summary screen, no percentage-of-a-percentage.

*(The thing in the sky was benched for exactly one reason: it hung there doing nothing, and an
object that does that raises a question the game cannot answer. What it needed was a reason to be
there — a place people go, or something worth walking out for — and it has one now. The tower is
raised for cores and raises nothing but hats; a wizard, which is a hat the tower makes over a couple
of minutes, is the one body that can leave the ground; and what comes off a star is dust from the
rind and **red** from the core. **The first star is summoned like every other one.** The tower used
to call one down as it went up, which put a star overhead before anybody could reach it and made
the first wizard a person who turns up to take apart something that was already there — when making
it is the whole of what a wizard does. So the first hat opens the sky *empty*, whoever wears it goes
up to nothing at all, and the first thing that happens up there is the thing that happens every time
after: they hold their ring
round the empty spot and pour into the middle of it until a star is there, which
takes about three quarters of a minute for one body and half of that for two. An
empty sky is a job rather than a wait, and a yard with nobody in the air stays
empty until somebody is put back in it. See `meteor.js` and `wizard.js`.

It is drawn as a little sun rather than as a stone: the crust is the deepest of
the reds, the fire under it shimmers between the brighter two, and a corona of
whole cells breathes round the whole thing and reddens as the crust is stripped.
All of it is worth sparks -- the crust one a cell and the fire three -- because a
star shedding grey dust was the picture arguing with itself.

There is one other colour up there, and it is the rule that keeps the sky
legible: what the wizards *emit* is purple and everything the star is or gives is
red. The bolts, the specks trailing off a flying body, the beams of a summoning
-- purple. The crust, the fire, the corona, the sparks banked in the hole -- red.
The tower pours rings of the same purple off its spire while it is making a hat,
which is the one thing on the ground that is magic and says so.
A black body with a red middle read as an eclipse -- a thing in front of a sun
rather than a sun -- which is the wrong picture for the one object in this game
that is not on the ground. And the wizards do not touch it: they ride a ring at a
distance and throw, and the cell comes off where the bolt lands.)*

*(An earlier version of this list also said "a third currency". The rule was never the count — it
is that each one has exactly one job, and that the lab is the only place a multiplier lives. Red,
below, is a resource with a job. That is why it is allowed.)*

## What red is for (built)

**Pressing the pile.** Red buys the hole the ability to hold its dust at a finer
grain — six pixels, then three, then two — which is four times as much in the
same hole, and then a little over twice that again. The machinery was written
when the hole was and then pinned shut at one size, because a pile that packs
itself the moment it fills is a hole with no ceiling; what a full pit means is
that the yard has outgrown it, and the answer to that has to be something you go
and get. It is the one row on the bench priced in sparks and the one place where
something plainly magic acts on something plainly dirt. Every grain of the old
pile is shared out across the finer columns standing where it did, so the profile
survives, the count does not move, and what you watch is the pile settling into
itself and the room appearing underneath. See `packPit` in pit.js.

The paint store below is a *secondary* effect of the same resource rather than a
second job — it spends red, it does not define it.

### One stat, one row at a time (built)

The bench's crew gear kept the rule the tier cards keep, but by hand and only
half of it. Load and the harness are two rows over what a hauler carries; pace
and boots are two over how fast it walks, and the pace multiplier is a third.
They were all on the board at once, which read as the same upgrade for sale
twice -- and a player with two identical rows open is not being offered a
decision.

The rule is general now: **a row that continues another ladder stays off the
board until that ladder is finished.** A row says so with `after: '<key>'`, and
`chained()` in `upgrades.js` wraps its `show` so every reader of `show()` -- the
sheet, `canAfford`, the bench's mark, `__rows` -- gets the gate without asking.
The finished row folds away under "finished: hidden" and the next stands where
it stood, which is exactly what a tier card does when its band is done.

What is chained: `haulcarry` → `harness`; `haulpace` → `boots` → `labhaul`;
`rockhandspeed` → `labswing`. The swing multiplier also lifts your own swing,
but it is sold under the rockhands' rung at the shack, so that is the ladder it
follows -- tying a shack row to a bench row under "you" would be a gate the
board cannot show. The four tier ladders already do this through `tierRows` and
are not touched.

### A gain names what it is a gain of (built)

The gain line said what buying a row *changes* and not the number the game is
keeping -- "+30%", "1 → 2" -- which is the right rule and was only half of one.
The thing that changes was named only when the row's name named it: "swing
+34%" is a share of swinging, but "boots +45%" is a noun and a number with no
verb between them, and boots and pace on one board were two rows moving one
unstated stat.

So a row carries `does`, the verb its number is about, and the gain line leads
with it: `walk +45%`, `carry 1 → 3`, `crit 4 → 8%`, `per swing 1 → 2 ■`, `dig
+16%`. Every proportional row has one -- a share has to be a share of something,
and `test/gain-verb.test.mjs` holds every board to it -- and a count row has one
wherever its unit does not already say. The tier ladders take it through
`tierRows` (`dig`, `tend`), the multipliers through `ladder` in rows-mult.js, the
pot's rungs through `brewRung`. The bracing tonic's unit became `%` like the
other four: with "crit" in front, "crit 8 → 10 crit" was saying it twice.

Two things the verb forced on the card. The amount is written in no-break
spaces and a bare symbol is glued to its number (`8%`, `4x`), so an amount never
splits across a line. And the gain spans the card less the pips' corner rather
than sharing a column with the bill: the bill is the widest thing on the card
and was leaving the gain a word's width, which is where "per swing" over "1 → 2"
came from. The pips are five characters and that is all the gain gives up now.

## The ladder (design, not built)

What is here now is eight rows that never end. Every one is a level you buy
again at a price multiplied by something between 1.35 and 1.9, and the whole
game is priced in dust: of the eight, exactly two spend anything else. Blue and
green pile up unspent, which makes them flavour rather than currencies, and the
only real decision the board offers is which exponent to feed next.

Two of those rows are already finite and hide it. `swing` stops at MINE_FLOOR
and the miners' at MINER_FLOOR, and when a row reaches its floor it *vanishes
off the board*. So the game already has caps -- it just calls them infinite and
then quietly removes the evidence. Saying so out loud costs nothing and turns a
disappearance into "5 of 5", which is a thing you finished rather than a thing
that went away.

**Every upgrade is a ladder with an end, and the row says where you are on it.**
`strength 3/5`. Every rate row in the game is one now, and the last two to be
converted were the cut's `speed` and the plots' `speed`: both were a fraction a
level for ever with a floor somewhere around the ninth rung, which is a cap the
game had and would not admit to. Both are `swing(base, floor, RUNGS)` now, so
the fifth rung *is* the floor and the row says so. So are the lab's four
multipliers, which were the last genuinely endless rows on any board -- see
"The kit has a ceiling" below for the one ladder that is shorter than five. Cost rises gently within a ladder -- about half again a rung, so
six times across the whole of it -- rather than exponentially, because the job
of the *tier* is to gate progress and the job of the rungs is to be affordable
enough to be worth reading. Running a tier dry is not a wall. It is the game
telling you where to go next, and it is the only nudge it needs to give.

### The tiers

| tier | currency | comes from | what it buys |
|---|---|---|---|
| 1 | dust | the rock | your strength, hold to mine, your swing, and the crew's first strength and speed |
| 2 | spores | **the plots** | strength past what feeding a body by hand can do |
| 3 | shards | **the quarry** | gear: the pickaxes, the carts |
| 4 | cores | a rock | buildings, and nothing else |
| 5 | hearts | **a star** | driving a machine: faster, and dirtier with it |
| 6 | sparks | a star | the last two rungs of every ladder, and the machines themselves |

**The first round is dust, all of it.** The crew's strength and speed are the
first things anybody buys after their own hands, and they come long before the
cut or the plots -- so pricing them in stone or crop asks for a currency the game
has not shown you yet, on two of the first rows you will ever read. A tier's
currency gates the tier; it does not gate the way in.

**The plots come before the quarry.** *(built)* Food makes bodies and stone makes
tools, and a body has to exist before its tool means anything -- so green is
strength and blue is gear, in that order. It is also the way round that fixes the
pile: spores currently buy one row in the whole game and sit there.

The prices went with the order: six hundred for the plots, eighteen hundred for
the quarry, and the quarry is offered once the ground is broken. The yard itself did
not move -- the farm still stands out past the quarry, because where a place *is*
and when it is *sold* are two different questions and only the second one is
about pacing.

**A core opens places and a heart drives them harder.** That is the same
sentence the game already says about cores, extended by one word. A rock gives
dust all the way down and one core at its middle; a star gives sparks all the way
down and one heart at its middle -- the last thing the wizards reach, and the
reason to finish a star rather than abandon it half-mined.

**Sparks are the multiplier.** Every ladder is five rungs of ground and two of
red: the ground can take a stat as far as the ground goes, and past that it costs
something that fell out of the sky. This is what red is *for* in the long run --
and what it buys has settled since this was written. Red is **the machines'
currency**: it buys every machine in the yard and then every rung of the endless
ladders on them, and it opens the rift and buys its throughput. The pit press
used to be the example here and is cut. The paint store below spends the same red
on something that is not a multiplier at all.

### The smoke comes on in two steps

The one thing this changes about the rest of the game: **the yard is worked by
hand for most of its length, and it dirties in two deliberate steps, each of
which you buy.**

**The machines come last, not first.** They used to be pencilled in beside the
quarry -- open the cut, get a jaw and a hoist with it -- on the argument that a
problem and its answer belong in the same part of the game. That argument was
right about the pairing and wrong about which pair. A machine is the *end* of a
station, not its opening: see "The machines" below, where each one is locked
behind every slot that station will ever have and priced in sparks out of a
star. What answers hand labour is the scrubbing house, bought early because hand
labour already fouls the sky; what the machines do is make the house you already
own stop being enough.

So the curve has three beats rather than two. **A problem you can answer** --
hand smoke, and a shed with a fan in it. **An answer that stops being enough** --
the machines, which foul three times over per unit of work. **And an answer you
have to drive** -- the scrubbing house's own ladder, which is where the back half
of the sky's economy lives.

**A heart drives a machine harder.** Each machine takes one, and what it gets is
speed -- double -- and the smoke that comes with running something at twice the
rate. So red out of the sky is what turns a works that ticks over into a works
that pours, and the sky is where the bill for that arrives. Sparks *buy* a
machine and a heart *drives* it, which keeps the two steps apart: a star sheds
sparks all the way down and has exactly one heart in the middle of it.

*Hearts do not exist yet.* There is no heart currency, no mark, no cell colour
and no path from a finished star to one in hand -- so the doubling is a second
feature wearing this one's coat, and it is **not** in the first build. The three
machines ship at their undriven rate, and the shared runner carries a `driven`
flag that multiplies exactly one number when the star's core economy arrives.

What this is *not* is the shape it has now -- a meter that has been draining
since your first swing, shown to somebody who has no answer to it for another
few thousand dust.

### The machines

Four of them: **the jaw** on the cut, **the ram** on the rock, **the tiller** on
the plots, and **the belt** from the rock to the hole.

**Each has a ladder of its own, and the ladders never end.** This was the hole in
the middle of the game: every ladder in it belonged to *hands* -- pick, swing,
carry, harness, boots -- and a machine ran at the rate it was born at for ever.
So the largest purchase in the game was the end of a line rather than the start
of one, and past it there was nothing left to spend on at all. That is where the
dust surplus came from, and it is why no amount of storage was ever going to fix
it: the problem was never where to *put* the dust, it was that there was nothing
to do with it.

Red buys them, and dust like every other row. The rungs live on the board of the
building the machine stands in -- the jaw's at the quarry, the tiller's at the
farm, the ram's under `the rock` -- which is the rule the boards were always
supposed to follow. The belt's is the exception the rule allows for: carrying
has no station, so the belt and its ladder sit on the bench under the haulers'
heading, with the rest of what a hauler is issued. (It was sold at the house
for a while as the crew's machine, which put a shelf of machinery on the sheet
you go to for a roof.)

**Endless is load-bearing, not decoration.** A five-rung ladder has a finite
total cost, and a finite total cost puts the surplus straight back where it was.
What stops an endless one running away with the game is that the price climbs
faster than the gain: a rung is worth ×1.3 and costs ×1.55 of the last, so each
one buys less than the one before it and the ladder is a slope rather than a
lever. By the tenth rung a single rung costs more dust than the hole can hold --
which is where the two halves of this meet, because a ladder like that is only
climbable by a yard with a rift under it.

It is **one multiplier** in `machineRate` and nothing else. Every machine's rate
already ran through that one function, so a rung is a number in the machine's own
record rather than four rate functions to keep in step, and a fifth machine gets
a ladder by existing.

The belt is the odd one out and is worth saying why. The other three work a
face; it works the *ground between* two places, picking loose dust off the floor
and putting it in the hole -- the whole of what a hauler does, minus the walking.
It is what the yard starts asking for the moment any other machine runs: a ram
fills the rock's pile in well under a second and then stands down waiting to be
carried, so haulage is the bottleneck exactly when the works becomes worth
watching. Tier three promised carts from the beginning.

**And the dust rides it.** This is the difference between a belt and a picture of
one, and the first build got it wrong: the bite threw each grain the whole length
of the yard in one arc, over the top of a band it never touched, and what you saw
travelling along the band was a white pattern painted on it. Delete the belt,
leave a catapult, and not a number changes.

**The band is a surface, and that is the way onto it.** Anything thrown across it
comes down on it and is carried, exactly the way anything thrown across the yard
comes down on the yard -- so the rock's spoil goes straight from the miner's
shovel onto the belt and the ground between the rock and the hole never sees it.
That is what a belt from the rock to the hole *is*. Without it the machine did the
job the long way round: every grain fell to the floor, sat there, and was picked
back up and lifted five cells onto a band that had been directly over it the whole
time. What the belt will not take out of the air is a throw over another station's
strip -- the same rule the bite keeps, and for the same reason: the cut's stone
and the farm's crop belong in their own piles.

So a grain the belt picks up is a **load** -- `{ x, y, s }` in `S.belt` -- and a
load is not a chip. A chip is thrown once and left to gravity; a load is carried,
and the machine decides where it goes next on every frame. A load that landed on the band is already on it and simply
rides. A load the belt had to pick up off the ground has two legs: the scoop takes
it from wherever it lay to the band, and then the band runs it to the head. The
scoop is the exception now rather than the only way on -- there is dust lying
about from before the belt was bought, and dust that misses it. The lift is a
*climb*, not a throw, and that is forced rather than chosen --
the heap between the rock and the hole is routinely deeper than the belt is tall,
and a grain tossed at the band from inside a heap lands back on the heap. It also
means the scoop reaches *down* to a grain lying on top of a heap above the band,
which is the same two lines of code.

The head **overhangs the mouth of the hole**, so the load runs off the end and
falls in. A belt that stopped short of the lip would need its last two cells
thrown, and a load thrown off the end of a conveyor is the bouncing this replaced.
Nothing stands out there: the tender's post is on the near lip, and the trestles
stop where the ground does.

It is also the one machine not priced away from its own station's coin, because
carrying has not got one -- a hauler makes nothing, it moves what everybody else
made -- so it is priced in all three grounds at once, which is the truest thing a
price can say about a thing the whole yard uses. The lab, the school and the casino stay buildings, and
the scrubbing house is already a machine.

**A machine is a station, and it takes the hand work over.** A body walks to it
and works it, the way a body works the scrubbing house -- and the scrubbing
house is the precedent for the rest of this, right down to the comment in
`capOf`: *a machine that runs itself once somebody is standing in it*, where the
extra bodies would be a queue rather than a place to be. So a running machine
makes its station hold **one body**, `rebalance` walks the surplus back to
carrying on its own, and no station needs a line of code written for it.

The rock is the exception the doc has always made and still makes: the ram
replaces the *miners'* hand work, not yours. The hill still comes apart under
your own cursor.

**Every slot first.** A machine is not offered until the station has been given
everything hands can be given -- all five benches at the cut, all seven plots at
the farm, both of the rock's kit ladders at 5/5 -- and a full set of kit, which
is `KIT_MAX` and is three. This is what stops a machine
from hollowing out the ladder underneath it: `the next plot` can never be made
worthless by a tiller you were able to buy instead of it, because the tiller is
the thing you get *for* buying the last plot.

**So a machine is worth a full complement, times a dial.** Gated as above, you
buy it at the exact moment the cut holds five and the farm holds seven, so a
machine worth "about three hands" would be a downgrade you paid sparks for. The
rate is read off the station rather than picked: `handsOf(job)` -- what `capOf`
said before the machine -- times `MACHINE_GAIN`.

**And the machine does the station's own unit of work, one unit at a time,
through the station's own function, on the station's own clock divided by its
hands.** This is the rule that keeps everything underneath it true. The jaw takes
*one cell* through `nextQuarryCell` and `findShards`, so a dig still pays exactly
`seamShards()` and the last cell is still one-in-one. The tiller ripens and cuts
through the farm's own pair. The ram swings `minerBite()` through `knockOff`. A
machine that ate a column at a time "to look mechanical" would silently rewrite
what `dig deeper` is worth. Every ladder below a machine keeps applying because
the machine is running the same code the hands ran.

**`MACHINE_GAIN` is a dial to be measured, not believed.** Hands spend a great
deal of their day *walking* -- `CUT_STEP` between cells, along the plot line,
across the face -- and a machine that stands still does not. So a machine at
1.5x the clock is worth rather more than 1.5 hands, and the honest way to set
the number is a node check that measures a running machine against a real gang
of five and says what it found. Until that check exists the number in config is
a guess with a comment saying so.

The rock is the one place the rule has nothing to read, because `capOf` for
miners is `Infinity` -- a rock is as long as it is. Its complement is
`ROCK_GANG`, a named constant in config with its reasoning over it, which is
where every number in this game lives. What the rule against per-case constants
forbids is a `5` inlined in shared code, not a named one in `config.js`.

**A machine waits for the specialists, and is then worth more than they were.**
This is the correction that makes the upgrade path hold together, and the first
draft had it exactly backwards.

That draft said a machine reads its station's *ladders* and never its *hats*, on
the argument that a trained tender should not make the machine faster and a
five-bench fully-hatted machine should not arrive at fifteen hands. Right worry,
wrong thing. A hat is a flat doubling wherever one is worn -- twice the bite on
the rock, twice the pace at a cell, twice the tending on a plot -- so a kitted
complement of five is worth ten hands, and a machine at complement-times-one-and-
a-half was worth seven and a half. **You paid fifty sparks to make the quarry
slower.**

Worse, it made the specialists obsolete at a stroke. A machine caps its station
at one body, so the moment the machine stood up every helmet you had bought went
into a drawer, and the trade ladder stopped being worth finishing halfway up.

So the gate is **every slot and every hat**, and the rate is measured against the
gang that set of hats made: the complement, plus one again for each of it that is
wearing a hat, times `MACHINE_GAIN`. Five benches with three lamps between them
is eight hands, and the jaw is twelve. The specialists become the last thing you
buy before the machine, and the machine is worth half again what they were --
which is what the dial has meant all along.

It also settles what `MACHINE_GAIN` is a multiple *of*, which was the vaguest
thing in this section: it is a multiple of a kitted station, and there is a check
that measures a running jaw against the quarriers working the same cut in the
same yard.

**And the row comes off the board once the machine is standing.** The set of hats
is the last thing you buy before the machine and the machine *takes it* -- so a
training grounds still offering a fourth blaster after the jaw is up is a board
selling a helmet for a face nobody stands at any more. The ladder ends at the
machine, and the board has to say so by ending too. One heading at a time: the
rock's row goes when the ram goes up, the quarry's when the jaw does, the farm's
when the tiller does.

**The carts are the exception, and stay for the rest of the run.** Carrying is
not a face. The belt runs between the rock and the hole and nowhere else, and
everything off that line -- the weather's muck, the far heaps, whatever the yard
drops where the band cannot reach -- is still walked by hand by whoever is not
tending it. So the belt takes no carts when it is bought, the carters go on being
worth what they were, and the carter row is the one thing the school sells
forever.

### The kit has a ceiling, and the carts do not

**Three of any one trade, and no more** -- `KIT_MAX`, the carts excepted. A shorter ladder than the
rest on purpose: kit is the one thing you buy that a *body* has to wear, so its
ceiling answers "how many of this station's hands are the good ones" rather than
"how far up is this number". The school's board draws three pips instead of five
and says `done` on the third.

It had none at all before, on the argument that the price was limit enough: it
rises three fifths a hat, so you stop when you stop wanting to pay. Which is a
limit that never actually says no, and a row that never says no is a row you are
still buying an hour later out of habit. It was also the *only* answer to what a
station is worth, so a station's whole story was "keep feeding it shards".

And it is what makes the machines arrive. A full set used to mean a hat for every
pair of hands the station could hold -- a gate that receded as you walked at it,
because the hands are themselves a thing you buy: deepening the cut moved the jaw
further away and breaking another furrow moved the tiller. A set is three now, so
a set is a set, and the ram, the jaw, the tiller and the belt are things you can
actually get to. That is the whole point of the ceiling: the shards go somewhere
with an end on it, and what is on the other side of that end is a machine.

**Except the carts, which have no ceiling at all.** Three of the four stop where
they start, because the ram, the jaw and the tiller take those stations over and
a fourth helmet is a helmet for a face nobody stands at. Carrying is never taken
over: the belt runs the one line between the rock and the hole, and the muck, the
far heaps and whatever the yard drops off that line are still walked by hand by
whoever is not tending it. So there is always another cart worth buying, the row
goes on selling them, and what says stop is the price -- three fifths more a
cart, which is the limit the other three had before `KIT_MAX` and the right one
here. A set is still three, so the belt is gated exactly where it always was; the
carts past the set are you deciding to keep investing in carrying rather than a
bill the game presents you with. The two numbers this splits `KIT_MAX` into are
`kitSetOf` -- what a machine waits for -- and `kitMaxOf` -- what the board draws
pips against. The cart row has the first and not the second, so it shows a count
and a price where the others show pips and, in the end, `done`.

The ceiling before *this* one was a hat a bench and a hat a plot, from back when
a hat was a body that had been upgraded. That is still the wrong shape and is not
what this is: kit is not a person, a helmet on the stand is a helmet the next
hire puts on the moment you take them on, and stocking the rock before you have
staffed it stays a sensible thing to do with a pile of shards. What has a number
on it is how many helmets the rock will ever have, not how many heads are under
them today.

The wizard's point is not capped, and is the exception that says what the rule
is about: it is a licence to fly rather than a doubling, and the tower brews as
many as you have the patience for.

| | the jaw and hoist | the ram | the tiller |
|---|---|---|---|
| station | the cut | the rock | the plots |
| unlocked by | 5/5 benches, 3 blasters | both kit ladders 5/5, 3 breakers | 7/7 plots, 3 growers |
| price | 30 sparks, 2,000 dust, 25 spores | 50 sparks, 40 shards, 30 spores | 20 sparks, 1,200 dust, 18 shards |
| complement | 5 benches | 5 (`ROCK_GANG`) | 7 plots |
| worth | 12 hands | 12 hands | 15 hands |

**It is called the ram and not the breaker.** `TRADE_OF.miners` is already
`'breakers'` -- a breaker is the *hat* the school sells for the rock, counted in
`S.breakers`, saved, reported, and referred to by that name in a dozen comments.
A machine wearing the same word would collide in every one of those places. A
ram is also what the drawing already describes: an arm that reaches into the
face and strikes.

**No machine is priced in what its own station makes.** The jaw works the cut
and the cut makes shards, so the jaw is not priced in shards; the ram works the
rock and the rock makes dust; the tiller works the plots and the plots make
spores. Each is bought with sparks and with the two ground currencies its own
station does *not* produce.

That is one rule rather than three prices, and it says something true: **a
machine is paid for by the rest of the yard.** A station that could buy its own
machine out of its own output is a station whose machine is really just a bigger
version of itself, and the purchase stops being a decision about where the whole
works is going and becomes a lever you pull on one number. It also settles the
uneasiness about the row: three currencies on one row is unlike anything else in
the game, and *everything but this station's own coin* is a better reason for
that than "it is expensive".

All three together are a hundred sparks. (They were weighed against a pit press at
forty and then a hundred and forty, which is cut -- see **The rift**.) They are the first rows in the game priced in sparks at all,
which makes them the first exercise `take('spark')` has ever had -- its comment
has said "nothing is priced in sparks yet" since the day red was banked.

**What they look like.** Black mass with white cut out of it, like everything
else, and each one reads differently at a glance because each one moves
differently.

- **The jaw** is a block on the floor of the cut, a body and a half tall, with a
  mouth cut white out of its front that opens and shuts on its own beat. It eats
  a cell at a time and shunts along when a column is worked out, which is all
  the walking it does. The **hoist** stands on the deck over the mouth: an
  upright frame, a white rope line, and a skip that rides it up the ladder's
  line. What the jaw finds goes up in the skip, which retires the throw over the
  rim and finally gives the bridge deck something to be for. Its stack is *down
  in the hole*, so the smoke climbs out of the quarry mouth and a working cut
  visibly breathes.
- **The breaker** is a squat engine at the foot of the hill on the yard side,
  with an arm that reaches up into the face and strikes. One white slot for the
  piston. Its stack is at head height in the middle of the yard, where you
  cannot fail to see it: the rock is the busiest station and so the dirtiest.
- **The tiller** is a low frame that crawls the plot line end to end and turns
  the ground behind it. The only machine that travels, which is what makes it
  read as a different thing from across the yard, and its thin trail drifting
  over the green is the prettiest thing the machines do.

**And there is no switch.** A machine is stopped by taking its tender off and
started by putting one back, through the `-` and `+` the station already has.

This took three drawings and a whole mechanism to arrive at, and the mechanism is
worth naming so it is not built again. It was a lever: a thing you clicked, which
raised an *ask*, which a body walked over and answered, which flipped an `on`
flag, which changed what `capOf` said, which walked the surplus gang to carrying
or back again. Five moving parts and two save fields. It was drawn first as a
checkbox -- a question and its answer in one square, with the question written
nowhere, so which of ticked and clear meant *on* was a convention somebody had to
be told. Then as a slide switch, drawn inside out: a black knob riding a white
slot cut into a black plate, so the knob had no contrast against the thing it
slid in, the only part that visibly moved was the gap, and the whole control read
as a meter -- and worse, as the station's own meter, a white bar in a black body
being exactly how the ram draws how far through the boulder it is. Then as a
lever, which was at least honest about the mechanism.

All three were answering *is this station worked by the hands or by the machine*,
and the yard had a better answer to that from the start: **is anybody standing at
it.** A station idles until somebody is actually there, so an unmanned machine
produces nothing and smokes nothing without a line being written to make it so --
and the count directly above the machine's mark is how many bodies are there. The
lever was a second way to say a thing the yard already said, and the second way to
say a thing is the one that gets it wrong.

What it costs is the hand fallback: a station with a machine standing at it is
worked by that machine or it is not worked, and there is no putting five bodies
back on the face. That is the right trade. The machine is gated behind every slot
and every hat the station can hold, and buying it spends the hats, so by the time
you have one there is nothing the hands could go back to being better at -- a
lever whose off position was strictly worse was a decision nobody made twice.

**What is left on the roster is a label, not a control.** One strip under the
headcount with the machine's own mark on it, saying what those hands are working.
Its one rule is that it must be the *same machine* as the one standing in the
yard -- the same silhouette, feature for feature, not a family resemblance. The
ram's first mark failed that and it is the useful example: a chimney in the middle
where the yard's is at the front, a thin slot where the yard's is a square, and no
arm at all. The arm is the ram -- it is the only machine whose working end is
somewhere other than where its body stands -- and a ram without one is a shed.

**The rule that carries all of it: an unmanned machine produces nothing and
smokes nothing.** A yard choking on its own smoke with nobody to spare cannot
get worse, because the moment the
last body walks away from the machine, the machine stops. That is the
idles-until-somebody-is-standing-there rule, not a new exemption -- and it
settles the muck case too. Muck on the cut stops the jaw, the tender climbs out
and shovels it, and the machine picks up when the tender comes back.

**The belt got here first, and was the warning.** Alone of the four it never had
a lever, because there was nowhere to put one: the other three stand somewhere --
a jaw in the cut, a ram at the rock, a tiller in the field -- and a switch belongs
at the place it is about, while a belt is a run of trestles the width of the yard.
Its other home, the station's roster, was no home either, carrying being the one
post you never staff by hand and so the one roster that takes no clicks. It was
built with a lever anyway, and the lever was the bug: the purchase raised an ask
that nothing could ever answer, so a belt you had paid for -- in all three
grounds, having handed over the carters' carts for it -- stood there and never
ran. It was made leverless, and nothing was lost, and that should have been the
whole answer three drawings earlier than it was.

**What the machine is really worth, honestly.** A machine is a flat rate and a
gang is not -- but the cut can never hold more than its five benches and the farm
never more than its seven plots, and the machine is measured against a *hatted*
complement, so the hands could never out-work the jaw or the tiller anyway. The
rock is the exception and the only one: `capOf('miners')` is `Infinity`, so a big
enough gang really could beat the ram. That is the one place where losing the
hand fallback costs something real, and it is worth naming rather than hiding --
though it is named against a gang you can no longer assemble, the hats having
been spent on the machine that displaced them.

It also gives the second half of the game its own economy. A works producing
twice as much needs somewhere to put it and something to spend it on, which is
what the tier-6 spark rungs and the paint store are for.

### Settled

**A rung costs the tier's currency and dust, both.** The rock never stops giving
dust, so a game whose sinks all ran out would be a game where the thing you do
most stops mattering. Every rung above tier 1 is priced in its own currency
*and* in dust, which keeps digging worth doing for the whole run and gives the
higher tiers a floor under their price.

**The rock gets a machine, and the machine needs somebody standing at it.** The
cut, the plots and the rock all take one. What a machine is here is not "the
thing that replaces you" -- it is a station: a body goes and works it, the way a
body works the scrubbing house, and it is faster than the same body swinging by
hand and it smokes. So the rock still comes apart under your own cursor, and the
choice a machine offers is where to put a pair of hands, which is the choice the
whole roster is already about.

**One heart to a star.** Which makes the machine upgrades strictly ordered --
one star finished, one machine driven harder -- and makes finishing a star the
thing that gates the back half of the game. It puts real weight on the wizards:
how fast they take a star apart and summon the next is now the pace of the whole
late game, not just a way to make red.

**A finished ladder stays on the board, reading 5/5, and there is a switch to
hide the finished ones.** Seeing that you are done is the point of a ladder
having an end; seeing it for ever once you have twenty of them is clutter. Both
are true, so it is a preference rather than a rule.

**Old saves are not carried over.** Levels above the new caps clamp. This game
is still being built and its save format still moves; migration code for a shape
that is not settled is work that gets thrown away.

**The machines cannot ship before the sky can hold them.** `foul` turns a mote
away *with its dirt* once the band is at `MOTE_CAP`, and past that point further
fouling is free -- so three machines at three times the dirt would pin the sky
and the feature's own economy would be swallowed by a ceiling. Two consequences,
both binding. `SMOG_CAP` goes up, as one systemic number with its reasoning. And
every check about machine dirt asserts on the *rate* of fouling, never on the
standing mote count, which reads the same at the cap whatever the rate.

### Still open

- Whether the tier-6 spark rungs are the same two rungs on every ladder.
(The question of what the specialists are *for* once a machine is running is
settled: the machine **takes** them. It is gated behind a full set and is worth
what that set made, so buying it spends them -- the count goes to nought and each
body walks over and hands its helmet in, using the kit errand that was already
there. The specialists trained the machine and then took their hats off, which is
the truest thing this yard can say about what a machine is.

What that costs is the fallback, and it should be said plainly: once the hats are
spent there is no kitted gang to go back to, and with no switch there is no going
back at all. The machine is the station's way of working from then on. See the
honest note above.)
- Whether the three machines should be reachable in any order, or whether the
  jaw ought to be the one that teaches the idea.
- Whether the rest of the boards should follow the same rule the machines now
  do -- a bench costs shards and the cut makes shards, which is the thing the
  machines were deliberately priced away from. It is a bigger change than this
  section, and it is the one that would make the rule the yard's rather than
  the machines'.

*(Two that were open are settled above: a machine fouls three times over per unit
of work, and a driven machine costs nothing to keep running -- taking its tender
off is the control, and a fuel bill would be a second meter to watch for no
decision that does not already offer.)*

## The paint store (long term, not built)

Written down so it does not get lost. Three parts, in order of how much they change:

**A third resource, red.** And the farm's green becomes **yellow**, so the three
ground resources are the three primaries: blue, yellow, red. Where red comes from is
settled: the core of the meteor, fetched down out of the sky by a wizard and banked in
the hole like everything else — see `meteor.js`. It exists and it is counted; what it
has no job yet is spending, and this is the job it was always meant for.

**A paint store.** A place on the lot with three buckets standing in front of it, one
full of each. It is the first building whose output is not a number.

**Painting a body.** You pick a worker up (the crew already lift, and already keep
their own records) and bring them to the store. The first thought was dipping: walk
them into a tank and they come out that colour, dip again for a mix. The better one,
and the one to build, is a mixing board: a small UI where you spend blue, yellow and
red against each other until the swatch is the colour you want, confirm it, and *that*
is what goes into the tank the body is dipped in. The cost of a recolour is exactly
the amounts of each resource that went into the mix — a deep orange costs a lot of
red and some yellow, and a pale anything is cheap, because it is mostly nothing.

Why it is worth doing: this yard has no cosmetics at all, and no reason to care about
one body over another beyond the records it keeps. A crew you have painted is a crew
you can tell apart at a glance, which is the same thing the names started. It also
gives the coloured resources a sink that is not a multiplier, which is the one shape
of spending the lab does not already cover.

Open: whether paint survives a body leaving the yard, and whether it should tint the
hat as well or only the body.

## The air

Every grain taken out of the ground puts a mote of it into the sky — off the rock, up out of the
cut, off a plot being turned. Nothing carries them away. They gather, the band over the yard
thickens, and past a point the sky gives the lot back at once.

This is the only thing in the game that makes the works **worse**, and it is caused by the one
thing you do most. That is the point of it: the yard should not be a machine that only ever goes up.

Everything about it happens in cells you can watch, and the chain is unbroken from the swing to the
sky.

**A swing puts up a puff.** Every hit on the rock, every load out of the quarry, every plot turned
sends a cell of grey off *the place it happened*, climbing, wandering, thinning as it goes, until it
reaches the band and is part of what is up there. That is the whole connection between what the crew
do and what is overhead. Without it the sky is weather and the yard is a factory and the one has
nothing to do with the other — a number going up in a file is not something you can see.

**The sky is the motes.** There is no cloud sprite anywhere and no cloud shape. What is up there is
the dust you put there: every mote climbed off a swing, arrived, and stayed, and the sky looks like
whatever those motes have done. That is the only honest version — everything else in this yard is
grains you can count, and a painted cloud over the top would be the one thing in the game that was a
picture of something rather than the thing itself. It is also the only version with no shelves and
no right angles in it, because nobody drew any.

**They find each other.** A mote leans towards wherever there are already motes, so the sky gathers
into banks that were never placed — they are only where the motes ended up. Two details make that
work:

- The pull reads a **smoothed density over a span**, not the bin either side. At a handful of motes
  per bin the difference between two neighbours is a coin flip; a mote following that changes its
  mind every few frames and random-walks itself *apart*. Over a wide span it is following the shape
  of the sky instead of the luck of two bins.
- A patch that is **full spills outward**. Attraction alone is winner-take-all — the biggest clump
  pulls hardest, so it grows fastest, so it pulls harder, and the whole sky ends up in a few knots
  with nothing between them. Somewhere being full is what stops that, and what settles out is a sky
  of many middling patches.

Measured over half a minute at half a sky: the fullest patch goes from **2.4× to 11× the even
spread**, and the number of places with anything in them falls from **164 to 33**.

They keep to a band at the **top of the window**, because smog gathers over your head rather than at
eye level with the rock, and the band follows the window so what is up there stays up there.

### The rain

It comes down as **individual cells**, falling under gravity out of the clouds, the same way every
other grain in this game falls — not a curtain drawn over the window.

**It is sampled, not triggered.** A sky over the line does not come down on the frame it crosses it.
The yard takes a look at what is overhead every few seconds and *rolls* for it: nothing at all under
the line, about one in eight the moment it crosses, climbing to a certainty at the brim. A filthy sky
is a thing that is going to rain rather than a thing that rains at a number — which is the difference
between weather and a progress bar with a cloud drawn on it. It used to be a comparison, and a
comparison is a stopwatch: the same figure every time, and a player who had read it once could stand
under a full band counting frames to the drop.

**And a minute of dry between showers.** A shower takes down the sky it broke on and nothing else, and
the works go on fouling all the way through it — so a busy yard came out of one downpour with the band
already back over the line and started the next on the following frame. Two rains with a frame between
them is one rain that stuttered, and no amount of shovelling gets ahead of it. This is the one clock
in the weather, and it is a floor rather than a schedule: it says when a shower *may* break, never when
it must.

**The rain has no clock, and what falls is the sky itself.** A mote drops out of the band, comes down
under gravity and lands as muck — the same mote you watched climb off a swing a minute ago. The
banks overhead thin as it goes because there is visibly less of them left up there, and the rain
stops when there is nothing left to fall. Not a timer expiring and a flag flipping. Nothing in this
yard pops in or out; that goes for the thing that made the mess as much as for anything else.

The house works the same way: a staffed one takes motes **out of the sky nearest to it**, one at a
time, and they stream to its intake. One of them was a swing on the rock a minute ago and is about
to be a grain of dust on the ground beside the house. Four lists — climbing, up there, coming down,
being pulled in — and one kind of thing on four errands. Nothing is ever a new effect standing in
for a thing happening. It lays a **full layer over
the whole map**, an inch or two deep everywhere, because a shower you have to go looking for is not
a thing that happened to your works.

What it leaves is kept as **one depth per column of the world**, stacked on whatever that column
has — the ground, the floor of the quarry, or the rock itself. The layer *is* the record: what is
buried, what is in the way, and what there is to shift are all read off it, so there is no number
anywhere that can disagree with the picture. Each column's top cell is drawn a shade darker, so two
deep reads as two rather than as one taller one.

It lands as **muck** — grey, and worth exactly nothing. Where it lands is the whole cost:

| | |
|---|---|
| on the rock | the working face is buried; a swing goes into the muck before it goes into the stone |
| in the quarry | the floor silts up; a dig brings muck up before it brings a shard up |
| over the plots | the crop is smothered; a plot is dug out before it is picked |
| over the yard | mess, which the crew drop everything to shift |

**Clearing up comes first.** A body with empty hands walks to the nearest muck and shovels it,
ahead of any dust waiting to be fetched. It was the other way round at first — muck was what you did
when you had nothing else on — and that meant it never got done: there is always dust to fetch, so
the yard stayed under an inch of muck while the crew walked over it carrying grains. The dust is not
going anywhere and the mess is in everybody's way. The one exception is hands already full: you
finish the trip you are on, because putting a load down to pick up a shovel is a load on the floor
and a trip wasted.

**You lose the shift, not the dust.** Nothing is taken out of the counter and nothing is added to
it: the crew spend their time putting the yard back exactly the way it was. Muck is never carried
to the hole, never banked, and never counted — it is shifted to the edge and it is gone. That is
what stops the punishment from being a reward with extra steps, which is what a mapful of free
sweepable dust would have been.

**Two things tell it apart, doing two different jobs.**

**The colour says it is a different substance.** A drab earth brown, beside the quarry's cold blue and
the plots' green — and deliberately the dull one, because those two are saturated for being worth
something and this is worth nothing. It reads as spoil rather than as a resource you have not met
yet.

It was grey for a while, on a rule that turned out not to be true: that the yard has no colour
outside the resource marks. There is blue in the quarry, green on the plots, tone in the clouds and the
birds and the curtains. And grey cost more than the rule saved — a pile of dust here is a block of
grey cells, so grey muck lying on a pile read as more of the pile, which is the one thing it must
never read as.

It is drawn solid, with the top course a shade darker so the layer has a skin and a depth of two
reads as two. It was holed for a while — every other cell left out, so it read as loose — and two
things saying one thing is one of them too many: the brown already says this is not the pile it is
lying on, and the gaps only made a straightforward layer fussy.

**In the hole it lies on the dust.** Muck lies on top of whatever it fell on, everywhere, and the
pit is not an exception because the top of it happens to be lower than the ground. It used to land
on the ground line, which over an open pit is thin air — a grey lid across the mouth with the hole
visible underneath. It is *on* the pile and not *in* it: nothing about it counts against what the
hole holds.

**And the crew go down after it — and out the other side.** There is a ladder in each wall of the
pit, the way the quarry has one in its near corner. A body walks to the head of it, climbs down hand over hand, walks the
top of the pile to the patch it came for — the surface is not level, so it walks the shape of it the
way a quarrier walks the floor of the quarry — shovels, and climbs back out the way it came in.

It was reached from the lip first, arm out over the mouth, on the grounds that the lip is where a
hauler already stands to tip a load in. It worked and it read as a fudge: somebody shovelling a
thing eight cells away and two deep without going near it. Every other hole in this yard is one you
go down.

**Two ladders, because the hole has two sides and there is ground beyond it.** With one the pit was
a dead end: muck past the far wall was somewhere the crew could see and never reach, because the lip
clamp pins them this side of the mouth. With one in each wall the pit stops being a wall and becomes
a way through — down one side, across the top of the pile, up the other.

And a body out there with nothing left to do **comes home on its own**. The crossing only ever ran
while there was muck to chase, so the last one to finish on the far side stood on ground the clamp
would not let it leave, for good. Nothing to go for means going home, and home is always the near
side, because that is where the yard is.

Two rules bend for a body on that ladder, and both of them have to. The **lip clamp** — the line
that stops everybody walking into the hole — lets it past, because the hole is where dust goes and
not where a body with a load in its hands walks, and this one has neither. That clamp has two sides
now: written as one wall it dragged a body that had climbed out the far ladder straight back across
the mouth, which is the clamp undoing the only reason anybody went down there. And the **rock dodge**
does not apply, because a body inside the pit is not standing anywhere a rock can land. That second
one was found the hard way: with the dodge running first, the climb pushed the body two pixels down
the ladder and the dodge lifted it two back onto the ground line, and the pair of them held it at
the top of the ladder for ever, taking turns. Down the hole is checked before anything else now — a
body on a ladder can only go up or down, so nothing else has an opinion worth hearing.

The building is a **hood over a rack of pumps**: four courses of black wall flaring open at the
haze, stepping a cell out a course so the thing is widest where it meets the air and narrowest
where it stands, and the taper closing the whole way — eleven cells of sky, nine, seven, five, then
three and one cut white out of the tower's head. Everything else on this ground is the other way
up: the settlement goes straight up at one width, the lab's chimney is under half the body under it, the
casino is the same block all the way to the roof. A shape that opens upward is a shape that takes
from up there, and there is only one of them. The first version was a body and a chimney, which is
exactly what the lab is; the second was a wide hole with something turning in it, which is the
casino a few dozen cells along the same walk; the third cut the mouth as a notch that narrowed
twice and stopped, which is a bevelled roof. **The mouth is mass, and it closes whether anybody is
in there or not** — what a building is cannot depend on whether it is working.

What it is *doing* is the pumps: four slots down the front of the tower with a plunger riding in
each, **one plunger to a body**, up to four. A pump at rest sits at the bottom of its stroke, where
a hand pump stands when nobody is on it, so an idle house is four plain slots and a working one has
blocks hanging in the air partway up them — and nothing else in this yard hangs in the air except
the marks. It is a count rather than a speed on purpose: a filter plot running courses at 1.6 a
second against 3.1 is a pattern nobody can read a number off, and four pumps against one is a
number you can say out loud from the far end of the ground. It is the same arithmetic as one lit
window a body in the settlement. The stroke is stepped in the sim, not in the draw loop, so an
empty house adds nothing and the next body picks the pumps up where the last one left them.

The house stands **past the lab**, at the quiet end of the walk: what it does is about the sky over
the whole yard rather than about any one site, so it does not belong among the places that dig — and
the walk out to it is the last of the walks, which is what the cores have been buying all along. It
carries its own roster under it like every other station.

**The problem, then the diagnosis, then the cure.** The scrubbing house is not offered until two
things have happened, in that order:

1. **It has rained at least once.** Until it has come down, the haze overhead is something you have
   noticed and not something that has cost you anything — and a cure sold before the disease is a
   cure for a number.
2. **The lab has been told to watch the sky.** That research is the one piece in the lab that is not
   a multiplier: it reads how fast the yard fouls, how fast a house would clean, and how long you
   have. Making it the key to the building means you buy the house knowing what it has to keep up
   with, and it means the answer to a bad sky is a walk to the lab first — which is what the lab
   is for.

Neither is a threshold quietly passing somewhere. It was a share of the way to a downpour once, and
at a quarter that was twenty minutes of honest work: a quarter of an hour watching the sky dirty
with nothing on any board about it, which reads as the game not having noticed.

**It has to happen inside a sitting.** The first rain is about twenty minutes into a working crew,
and it comes sooner the bigger the crew — a bigger works fouls faster, so the sky is a thing that
gets worse as you *grow* rather than a timer running underneath you. Fouling was a third of that
rate for a while, which put the first rain an hour and a half out: a cost nobody meets is not a
cost.

**...but not every couple of minutes.** A yard with all three machines going and nobody in the house
put a full sky up every two and a half minutes, which is a downpour before the crew have finished
shovelling the last one: the mess never came off the ground because the weather never let it. What
was wrong there was the *pace* of the cycle and not the balance inside it, so the whole air cycle was
halved rather than the sky being made cheaper — fouling and the house's draught came down together,
and the recycler's and the filters' rates came down with them so the house gives back exactly the
dust a second it always did. Fouling against scrubbing is the number that decides whether the house
is worth buying, and it is untouched. The same yard now rains about every five and a half minutes,
which is long enough for the shovels to win and short enough to still be the bill for ignoring the
house.

### The scrubbing house

The answer is a building with somebody in it. An empty one is a shed — visibly, with nothing moving
in its slots — and it does nothing at all. Put a body in it and it starts pulling the clouds apart:
a thread of cells runs out of the nearest cloud and down the funnel in its top, which is the only
building in the yard that takes something in above the ground, and a plunger starts working in the
first of the four slots.

It is **one body**, not a queue — `capOf` has said so since it was built: a shed with a fan in it is
a place to stand, not a floor plan, and a second pair of hands on a machine that runs itself is a
way of buying a faster sky rather than a place to be. So the cost of clean air is **a body not on the
rock**, and that is a decision you can take back whenever you like — the same bargain every other
station makes.

Which makes the **fan** the whole of how the sink grows, and that is a load-bearing job. The machines
out-foul a bare house several times over and never stop, so a yard that buys its third machine has
bought a sky it cannot get back down again until it starts up the ladder. Ignore the house and it
rains on you; buy into it and it stops. That is the shape:

| running | what the sky settles at |
| --- | --- |
| three machines, nobody in the house | **2188** haze — under the line, and it rains |
| one body, no fan | **1800** — better, still losing ground |
| one body, two rungs | **713** |
| one body, the full ladder | **241** — held, and worth having paid for |

Two faults had to come out before any of that was true, and both are the same fault: **a number
standing in for a thing.**

- The fan **did nothing at all**. `pull` took its draught strength as `scrubRate() / fanPull()`, and
  `scrubRate()` is bodies × `fanPull()` — so the fan cancelled out of the one line that moves a mote
  and what was left was the count of bodies, which is one, for ever. Five rungs and three hundred and
  sixty-nine shards bought a draught identical to the one you started with. It is taken against
  `SCRUB_PULL` now, so a bigger fan is a stronger pull on the sky.
- What the house **took** was not what it was **rated at**. Whatever the draught happened to sweep
  into the throat was swallowed, which is a question about the shape of the sky rather than about the
  machine, and it came to roughly twice the rating — so a bare house held three machines on its own
  and the ladder was spare change. The rating is the rate now, counted down at the mouth as motes go
  in.

An upgrade that quietly cleaned the sky would have been a number you buy once and never think about
again — but an upgrade that quietly did *nothing* is worse, because you bought it and the board
thanked you for it.

Then the **recycler** replaces the filters, and what the same crew catch comes back as dust. Same
building, same bodies, and the tax has become a wage. It shows as a **chute at the foot** — a mouth
cut through the bottom of the near wall and a tongue of two cells out under it — because it belongs
at the end of the process rather than at the start of it, and because a post standing out of a roof
is the lab's flue and the settlement's chimney, and in this yard that means something going *out*
into the sky. This one means the opposite. It pays in *real grains* — they drop off the end of the
tongue and land on the ground beside the house, and the crew sweep them like anything else lying
about. Not a number going up: every grain in this game is a grain somebody has to carry.

### Watching it

**One number, on the scrubbing house's board: the pollution rate.** What the yard puts into the sky
less what the house takes out, a minute. Positive and the sky is filling, negative and it is
emptying, and that is the whole of it.

**Both halves of it are counted, not quoted.** The scrubbing column used to show `scrubRate()` — what
the fan is *rated* at, in motes a second — beside a fouling figure in haze a second. A mote is
`SMOG_PER_MOTE` of haze, so the house's side read about twice what it was worth; it went on quoting
the full figure while the house stood clogged, or while the sky was too thin to have anything within
reach of the draught; and the arrow that comes off the difference therefore pointed the wrong way.
You could buy the whole ladder, watch the reading go green, and drown. It counts motes at the mouth
now, as they go down the throat, in haze a second — the same unit as the fouling beside it, which is
what makes the difference between them mean anything.

It was four numbers for a while — how much is up there against the threshold, the two rates apart,
and a countdown to the next rain. Each was true and only one was a decision. How much is up there is
not something you can act on: you cannot spend it, move it or hold it. A countdown is worse than
useless, because it invites you to wait until the number is small instead of dealing with the thing
making it. And the two rates on separate rows made you do a subtraction the game can do for you —
the answer to that subtraction is the only question anybody actually has, which is whether they are
winning.

It lives on the scrubbing house alone, not on the lab as well. The one thing you do about this
number is put bodies in that house, and a reading you can act on belongs where you act on it.

**The fouling rate is counted at the source**, not worked back out of the total. Inferred, it was
the change in the haze plus what the house had taken out, floored at nought so a downpour did not
read as the yard un-mining a rock. Every part of that is defensible and the whole is wrong the
moment the house starts winning: the haze falls, the floor clamps the difference to nought, and what
is left is exactly the scrubbing rate — so fouling always read *equal* to scrubbing, the two
cancelled, and the one number this board exists to show sat at nought however many bodies you moved.
Counted where it is made there is nothing to infer and nothing to correct for.



The lab sells one piece of research that is not a multiplier: **watch the sky**. It turns the
reading on. Playing the house against the rock without it is playing blind, so it is the piece that
turns a guess into a decision — and it is the key to the scrubbing house itself.

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

*(There was a target of a million dust. It is met, and not by a finer grain: what is banked past
what the hole can show stands in the rift, and a million is a number the rift holds without
drawing a pixel. `PIT_GRAINS` is one size now and the press that sold the finer ones is cut — it
made the pile a grey slab and bought back 0.09 ms a frame. See **The rift**.)*

## The suite

Two suites, and which one a check belongs to is decided by one question: does it need a page?

**`npm test`** is the yard. It runs in node with no browser at all — `game.js` is one frame of the
game with nothing in it that draws or listens, `tools/node` gives it eighty lines of stub browser,
and `test/*.test.mjs` drive it through the same handles the console has. One file per feature, a
fresh yard per file, and node runs the files side by side: three hundred and seventy checks in
twenty seconds. `npm run test:watch` reruns the ones you are working on as you type.

**`npm run test:browser`** is the page: a pointer dragged across the canvas, a board seating itself
against the edge of a window, a cursor changing shape, a cell landing on a whole device pixel. Two
hundred and twenty-odd checks in forty-five seconds, driven through Chrome's debugging protocol by
`tools/headless.mjs` — `--only casino` runs one corner of it. Both results name the eight slowest
groups, so the next thing worth cutting is always in the output of the last run.

Every group starts from a new game. It did not use to: the browser suite was one long narrative,
and a dozen groups only passed because of the yard the group above them had left behind — which
meant a group could not be run on its own, a failure could belong to any of the groups above it,
and the whole thing could not be split. A reset is half a second of game and buys all three back.

Two costs, and only one of them is waste. **Simulated frames** are cheap each and enormous in bulk:
a `run(400)` is twenty-four thousand of them, and most of those are spent after whatever the check
is about has already happened. Those become `runUntil(...)` — run until the hole is full, until the
crew have knocked off — and stop there. **Real sleeps** are the waste, and the node suite has none
of them: it turns the game's own clock instead, so a body walking the length of the yard costs a
few milliseconds rather than the half minute it takes to happen. What is left of them is in the
browser suite, where dust in flight, the counter tween, the board sliding and the save's debounce
all hang off real frames, and a check that reads them early reads them mid-animation.

None of it ships. The handles, the reports they read and the browser suite itself are all behind
`import.meta.env.DEV` in `console.js`, the same gate the dev panel is behind, so a build drops the
lot: it was a third of what a player was being asked to download.

## The filter

Two looks are laid over the finished frame in `press.js`: a whisper of **scanlines**, and enough
**vignette** that the page is in a room rather than on a light box. Enough that the yard reads as
coming off a screen rather than out of a printer, and not enough to argue with a picture made of
whole black pixels. The amounts are in `config.js` as `PRESS_MIX`, they ship as they stand, and
there is no dial: a look you can move at runtime is a look nobody has decided on, and these are
decided.

**It is drawn in 2D, on the canvas the game is already drawing into, and that is the whole point.**
There used to be ten of these on a WebGL post-process pass — the frame handed to a second context
as a texture, one fullscreen fragment shader, the result on a canvas laid over the top. The shader
was never the cost. A three-tap fullscreen program is nothing on any card made this decade; the
*trip between the two contexts* was everything, because the picture lives in a Canvas2D context and
crossing to WebGL means the browser pulls a screen of pixels off the card and pushes it back up
again with a hard synchronisation in the middle. On a large window that was twenty milliseconds a
frame — thirty frames a second on a card that draws the yard itself in two — and it was on by
default, so every frame rate anybody ever read off the dev panel was the filter's number rather
than the game's.

So the answer was not a cheaper shader. It was not leaving the context. Scanlines are a two-pixel
pattern made once; the vignette is one radial gradient made once per window size. Together they
cost about **three tenths of a millisecond** on three and a half million pixels. The vignette goes
on last because it is the light in the room rather than anything on the sheet.

**Chromatic aberration was built and then taken out**, which is worth writing down so nobody builds
it twice. It can be done in 2D, and elegantly — an offset proportional to the distance from the
centre *is* a scale about the centre, so the fringe is the red channel drawn a hair small and the
blue a hair large, which `drawImage` does for free. What it is not is cheap. Lifting a single
colour channel off a 2D canvas means copying the whole frame and multiplying it by a primary,
twice, then compositing both back: eight fullscreen operations and two more canvases the size of
the window. On the same scene it cost **three milliseconds a frame on its own** — ten times the two
that remain — taking 154 fps down to 106. And it has to fight the game, which is black shapes on
white paper: the whole pixel discipline here exists to stop edges going grey or fringed, and colour
is reserved for what the sites give up.

**The rest went with the pass.** Curvature, bloom, bleed, halftone, plates and the phosphor mask all
need to look at neighbouring pixels or bend the sampling grid, and 2D has no way to say that
without reading the frame back itself, which is the thing `press.js` exists to avoid. Most were
built for bright things on a dark screen in a dark room anyway, and white cannot get brighter, so
bloom has nothing to bloom and only eats the black.

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

**A bigger hole shows more of what you hold.** The pile is capped by the room in the plot, not by
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
dead at the ground line — but only over the mouth. It is the same plot of sand and the plot is only
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

A million does not fit at this grain and never will, and that is settled rather than parked.
`PIT_GRAINS` is **one size**. It used to list finer ones and the press sold them: the pile would
**settle** to a smaller grain as it filled, every grain kept, each column shared out across the
finer columns standing where it did, so the profile survived and only the resolution changed. At
one pixel a grain this hole holds 1,000,224.

It is cut, because the arithmetic was never the objection — the *look* was. At two pixels the pile
is not dust any more, it is a grey slab, and buying a million grains by making every one of them
invisible is buying the number and throwing away the thing. What is banked past what the hole can
show goes to **the rift** instead, where it costs nothing to keep because nothing about it is
drawn. The hole holds what the hole holds, at full size, for ever.

**A core in the pile is drawn at the size a core is**, not at the size of the cell it holds. It is
one grain as far as the sand is concerned — it heaps and settles like any other — but a cell is six
pixels, and a six-pixel ring in a plot of grey speckle is a grain that happens to be pale. You put
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
cave for another shard, and the plots stop coming on. A **warning triangle under the station** says
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

## The crate (cut, wave 5)

feedback5 item 8 removed the crates: every strip is now the bare slope, and
`heapBase` counts whole cells instead of rounding so a station can still fill
its own pile without the brim the sides used to lend it. The section below is
kept as the reasoning that shaped the strips, not as a description of the yard.

## The crate, as it was

A station's output lands on a marked-out strip of ground. That strip is a **crate**: two sides and a
floor, in the same black the bench and the kit stand are drawn in, with the station's mark cut into
the ground beneath it.

It was pegs and a dashed run once — a surveyor's marking, which said "something belongs here" and
left you to imagine what. The crate says it outright, in the vocabulary the rest of the yard is
written in: the bench, the kit stand and the outhouse are all THINGS, and a heap of stone that lives in
a box reads faster than a heap of stone that lives on a line.

Three things about how it is drawn, each of them a fix for the same failure — that a crate has to
read as a *box*:

- **The sides are tall.** Three cells read as two pegs with a heap between them. Five is still under
  a body, so a carter throws into it rather than over a wall, and a full one still stands proud of
  its box.
- **It is one colour all round.** The floor used to be drawn in the pale ink a marking uses, level
  with the first row of grains — so the first thing thrown covered it, and a floor that only shows
  while the crate is empty is not a floor, it is two posts.
- **What is thrown in sits on the floor.** The floor lies in the cell *under* the ground line, so the
  pile rests on top of it instead of standing in it.

**The rock's strip has no crate.** It runs the width of the hill — seven hundred grains — and a box
that long is not a box, it is a bar laid across the yard with rubble behind it. What comes off the
hill is spoil, and spoil at the foot of a cliff should read as a slope of rubble that has fallen
there. One predicate (`CRATED`) says which strips are crated, and both the drawing and the rule about
how a strip fills read it from that one place — so a strip cannot end up with a box drawn round it
and no sides to fill against, or the other way about.

**A crate fills flat before it leans.** Every column takes the height of the sides, and only above
the brim does it slope away from the ends the way loose stuff does. That is the pit's own rule
(`heapCeiling`) at a station's scale, which is why it is the same arithmetic rather than a second
idea — and it is what sides are for. Without them a heap had nothing at its ends: the marked-out
ground stood emptiest exactly where it was marked. An uncrated strip is the slope alone, which is
what the rock's is.

## The rift

**The problem.** The hole holds 37,566 grains and an endgame yard banks that in minutes. Everything
past it is dust the game refuses to take: the haulers stand down, a bar stands on the lip, and the
works stops being worth watching at exactly the point you have built it up enough to want to watch
it.

Three cures were tried on paper before this one, and each of them was the same mistake wearing a
different hat — **making the hole hold more**:

- **The press** (built, and now cut). Red bought a finer grain: the same dust in smaller pieces, so
  the hole held four times as much and then nine. It worked, and what it cost was the thing the pit
  is for. At two pixels the pile stops reading as dust at all — it is a flat grey slab with a
  diagonal top, no speckle, no grains, no charm. It also bought nothing back: measured on a pressed
  hole with 202,000 dust in it, the whole pile costs **0.09 ms a frame** to settle and draw, against
  a 16.7 ms budget. So the press spent the rarest currency in the game to make the yard uglier and
  hold a number that should never have been the constraint.
- **A bigger hole.** Depth is pinned to the window, so room can only be bought sideways, and the
  world is already 3600 across. Doubling the width doubles the capacity and scales the whole yard
  down a step on any narrow window. It buys 75,000 and costs the silhouette.
- **A drain that eats the surplus.** Honest, and it answers the wrong question: it makes the
  overflow *stop existing*. What the yard wants at that point is not to lose dust faster.

The arithmetic under all three is unforgiving and worth writing down plainly. **One grain is one
dust and a grain is six pixels**, so 202,000 dust needs 202,000 cells of pile — about 7.2M px² —
and the hole is 1.5M. No arrangement of this hole shows that much dust at full size. Something in
the premise has to give, and the premise nobody had questioned is that **the pit is where the dust
is kept**.

### The cure

It is not. The pit is the **working floor** — the thing you watch, where grains land and heap and
settle and are lifted out to pay for things. What you have *banked* is a different question, and
late in the game it gets a different answer: **a rift, and the grains are somewhere else.**

A black hole hanging in the pit (it stood past the far wall at first; see the endgame pass for why
it moved). Grains lift off the top of the pile, go round it and are gone — the same lift off the pile
`spend` makes when you pay for something, which is deliberate: the yard has one way of taking dust
out of the pile and this is it. They are not destroyed and the counter does not move. They are in
another dimension, and the rift says how many.

**Why this is not the press again.** The press paid in *resolution* and you could see the bill. The
rift pays in *location*: every grain still in this dimension is a full-size, six-pixel, speckled
grain, drawn exactly as it always was. The pile keeps its charm at every stage of the game, and it
gets something it has never had — it **moves**. Today's endgame pile is permanently full, which is
one unchanging picture; a pile that drains and refills is a working yard.

**It costs nothing to draw**, because nothing in it is drawn. This is the one place in the game
where storage is free, and it is free for a reason a player can see: it is not here.

### What it does not break

**The counter and the picture still agree.** DESIGN.md's oldest rule about the pile is that the
number and the picture never say different things, and the rift keeps it by *narrowing what the
picture is about*: the pile shows everything in the hole, the rift's own reading shows everything
in the rift, and the counter is the two together. That is a fact you can read off the screen, not a
fudge. The pile is still the dust — all of the dust that is here.

**Nobody holds it open** (changed by the endgame pass, below). It was a station once: a body stood
at it or it was shut. The body arrived once and stood there for ever, two windows off screen, so
the bargain was a row you bought and forgot. Torn is open. What it costs is red to summon and an
endless ladder on the rate, and the two oldest rules survive because no body ever moved the grains
and the rift is not a station — it is what the hole does with its overflow.

**Nothing gets into the pit without being carried or thrown**, still. The rift is not a second place
for a hauler to walk to and it never appears in anybody's errand. Everything is carried to the pit
exactly as it always was; the rift is what the *pit* does with its overflow. One destination for the
crew, one rule to keep.

### What you buy

Red, and dust — like every row in the game. Then **an endless ladder on how fast it swallows**, not
on how much it holds.

Capacity is unbounded from the moment it is built, and that is the point rather than an oversight: a
magic hole with a number written on it is the pit again, and the whole lesson of the press is that
capacity is the wrong thing to sell. What you are buying is whether the rift keeps up with your
income. A yard that has outgrown its rift fills the hole and stops, exactly as it does today — so
the pressure is real, it is about throughput, and the answer to it is a ladder that never ends.

That is the shape the game has been asking for since the beginning. The pit was once bought a dig at
a time and it was taken away for making a hole in the ground the ceiling on everything else; the
press replaced it and made the pile ugly. The rift is the third attempt at the same job and the
first one that sells **rate** rather than **room**.

### Where it hangs, and the suck (the overhaul)

Two things were wrong with the built rift, and they are the same thing said twice: **it was a picture
of an absence that did not act like one.** It sat buried to its middle in the hole, and the grains it
took were lifted off the top of the pile evenly along six hundred columns — so the pile wore down
flat, the disc hung over whatever happened to be under it, and nothing on the screen connected the
two. A black hole you can watch for a minute without seeing it pull is a black circle.

**Where it hangs.** Still at the near end of the hole, and now standing in the air over the lip
rather than sunk in the pile.

- **Clear of the ground line** is what gives it a silhouette. Everything in this yard is black on
  white, so an absence only reads as one against the paper; sunk to its middle in grey speckle it is
  a blob painted on the pile — which is exactly what the ring of white cells around it in `drawRift`
  was already patching over. The whole disc now stands `RIFT_UP` cells above the line, with nothing
  behind any of it, which is the truth about it. It also puts the mouth where the grains can be seen
  arriving: a grain climbing out of the hole and crossing open sky is a black speck on white, where
  the same grain crossing a pile was grey on grey. Where it stands is most of whether the thing can
  be seen working at all.
- **Near the lip, as a fraction rather than a cell count.** `RIFT_IN` (four cells from the lip)
  becomes `RIFT_AT`, a twentieth of `pitWidth()` — thirty cells in, so it clears the counter's card,
  which stands four cells from the lip and is the one other thing at that end. A fraction because the
  hole is 3,600 across and the disc belongs at the end of it that is on screen, whatever that end
  happens to measure. Further in was tried on paper and thrown out: a quarter along is 900 world
  pixels from the lip, which on a narrow window is a scroll away from where the counter, the belt's
  head and the haulers all are — the same mistake the endgame pass corrected when it moved the rift
  in from past the far wall.
- **`PIT_PAD`, the column count and every saved grid are untouched.** The world's width is measured
  off the pit and the floor's columns off the world; the disc moves within ground the pit and the sky
  already own, and nothing is measured off it.

**The suck.** Three changes, and none of them is a constant tuned for one case:

1. **It eats what it is over, and only what is exposed.** `lift` walked the plot row by row from
   column nought, which is right for paying — a purchase comes off the top of the pile anywhere, and
   that stream off the heap is the whole picture of buying something — and wrong for a hole. The rift
   gets an order instead of a row walk: **the surface grain nearest the mouth, over and over**. Only
   the top grain of a column is a candidate, because a hole pulls at what is exposed to it and a
   grain with three grains lying on it is not. Every take drops that column's surface by one and so
   pushes it further away, handing the next take to a neighbor — and what falls out of that, with no
   shape written down and no constant to tune, is **a bowl**. The crater is not drawn; it is what
   eating nearest-first leaves behind.
   It is an order, not a reach. Capping it at a radius would look better for a second and then stop
   the yard: a crater eaten out faster than the pile can slump into it would leave the rift
   swallowing nothing with a full hole either side of it, and a full hole is what the rift is for.
   Cost is paid for by opening columns lazily into a heap keyed by distance — a column can never be
   nearer than its own offset from the mouth — so a swallow out of a 600-column pile only ever looks
   at the few dozen it is actually eating.
2. **The pile slides in.** The crater is a real void in the plot and the pit already settles grains
   into a void, so the pile creeps toward the mouth on machinery that is there, with nothing new
   written and no second rule about how dust moves. `settleSome` sweeps a rolling band of columns and
   covers the whole hole in a couple of frames, so the crater is always in a band that is about to be
   visited; there is nothing to point at the mouth.
3. **The grains are pulled, not lifted.** A swallowed grain used to ease off the pile on a smoothstep,
   join a ring a third of a radius outside the rim, and hold that radius until a cubed dive at the
   end — a grain settling into an orbit somebody had arranged for it. Everything about the shape now
   accelerates: the lift off the pile is eased *in* rather than in and out, the ring is joined just
   outside the rim, and the angle runs on a rising power of `t`, so the further in a grain is the
   faster it is dragged round. The last quarter of the path is a whip, and that is the picture of the
   thing pulling. Radius and angle are still the same one number, so a grain is exactly as far round
   as it is far in and there is no second clock to drift.

**The tearing is an event.** A hole that gives way and then begins draining at twelve grains a second
has no moment in it. The tear now **empties the hole**: every grain in it goes, over `RIFT_GULP`
seconds, with the yard rocked by the biggest knock in the game. It is the first time anybody sees the
thing work, so it is the clearest possible statement of what it is for, and the ladder's pressure
starts from a hole you watched being emptied rather than from a number on a card. Nothing is lost to
it — the counter does not move, exactly as it does not move for any other swallow.

The gulp works out its share against the time *left* rather than against the pile it started with, so
the hole is empty at the end of it by construction whatever the frame rate is and whatever fell in
while it ran. It takes from **everywhere** rather than nearest the mouth: nearest-first during a tear
would eat out the end of the hole you are looking at and leave the rest of the pile standing off the
side of the window. The hole has given way; the whole pile lifts.

**It pulls on the air, too.** A fresh rift swallows a dozen grains a second, which is about seventeen
specks in flight at a time — not something you can watch pulling, and a black hole that does not
visibly pull is a black circle. So the dust in the air near it is drawn in as well: hardest at the
rim, easing to nothing at the edge of its reach, with part of the pull going *round* rather than in,
because what makes a hole read as a hole rather than a drain is that everything near it is turning.

Most of what it eats is put back at the edge of its own reach rather than anywhere in the yard, which
is the part that matters: without it the pull only ever *clears* the sky around the disc and leaves a
bald patch with a black circle in it — a hole that has finished rather than one that is working.
Feeding it back gives the pull something to pull on. Not all of it, because a hole that recycles
everything drags the whole sky into a ring around itself. Nothing is counted or lost either way: a
mote is weather, not stock, and the field holds exactly the number the yard has earned.

**What it does not touch.** The counter and the picture still agree; nobody holds it open; nothing is
carried to it; capacity is still unbounded and the ladder is still on rate. The rift is still what
the hole does with its overflow — the overhaul is about where it hangs and what it looks like doing
it.

**How it is checked.** The node tier: the disc's middle is above the ground line and its lower edge
below it, it sits in the first tenth of the hole, a swallow takes from the columns under the mouth
and leaves the far end of the pile alone, and a save from before it still comes back as a full pile.
Then a shot, measured in pixels: black above the ground line where the disc stands, and a hollow in
the pile under it.

### A save from before it

A save holding more than the hole can show comes back as a full pile — up to 37,566 grains — with
the remainder standing in the rift. Nothing is clamped and nothing is destroyed. A player who had
pressed their pile twice and banked 202,000 opens the new build to a hole full of proper six-pixel
dust and a rift holding the other 165,000, which is the state the game would have put them in had
the rift existed all along.

## The abyss (built)

*Built 2026-09-04, as designed. The two calls made at build: the drowned pit **stays a way
through** — a plank lies over the mouth at the brim, and `pitTop` answers with it, so the crossing
the two ladders bought survives the drowning; and a grain that ends up *under* the surface (a dev
tip, a save's leftovers) is absorbed upward to it unseen — the liquid's body is drawn over
anything below the line, so no wrong journey is ever visible. The account is byte-identical to the
rift's; `abyssLine` in pit.js owns where the surface stands, rising out of the floor over the
gulp. A payment the hole cannot show now surfaces out of the liquid and arcs to its station, which
closes the "invisible endgame payment" the rift always had.*

The rift's *account* stays; its *picture* goes. Instead of a black disc hanging in the air over the
mouth, **the pit itself liquefies**: the moment the hole cannot take a grain, the pile turns to a
black liquid, an abyss standing in the hole, and from then on the liquid is what eats.

**The tear becomes the drowning.** Today the hole gives way and the whole pile orbits up into a
disc — dust flying *up* to be destroyed, which reads as a machine. Liquefying reads as the thing
that actually happened: the ground gave out. Over the gulp's few seconds the pile darkens from the
bottom up and slumps into a level black surface; grains still solid ride down into it. When it is
over, the hole holds a liquid standing at a fixed line a few cells below the brim.

**What the liquid does.**

- Anything that lands on it is taken at the surface: a short swallow ripple where it struck, and
  gone. The catch-at-the-mouth rule stays — a thrown grain crossing the brim dives to the surface
  and is eaten there, rather than orbiting a disc.
- The surface is alive but quiet: a slow swell of a cell or two, black on white, flat shapes — no
  gradients, which the current disc's speckled halo already bends. A liquid is *easier* to keep
  inside the game's language than a black hole is.
- Spending still lifts out of the abyss: paid grains surface and arc to the station exactly where
  the pile's used to lift from. The liquid holds everything the rift held — dust, finds, the red —
  and `riftHeld`'s account is untouched.

**What it must not break.** The counter and the picture still agree: the counter is what you own,
the pile-turned-liquid shows a *surface*, and the readout that said what the rift holds now reads
off the abyss. Nobody holds it open, nothing staffs it, capacity is still unbounded. The haulers'
walkable surface over the pit becomes the liquid's line — bodies do not walk on it; the two ladders
stop at the surface, and the pit stops being a way through once it has drowned (or the crossing is
kept by a plank laid over the mouth — the one open call worth deciding at review).

**Why a liquid rather than a disc.** The disc is the one object in the yard that is not a thing a
works could have: it hangs, it spins, it has no silhouette against the ground. A drowned pit is
still the pit — the same hole, gone wrong in a way you watch happen — and "the ground ate it" is
the same sentence the collapse already says.

**How it would be checked.** Node tier: the accounting is byte-identical to the rift's (same
`S.rift`, `riftHeld`, swallow and spend order), a grain thrown at a drowned pit is counted the
frame it crosses the surface, and a save from the disc era comes back drowned with nothing lost.
Then shots: the tear mid-gulp, the standing surface, a throw being eaten, a purchase surfacing.

## The pit's arc: solid, torn, drowned (built)

*Proposed 2026-09-05, built 2026-09-06 as designed, with `ABYSS_AT` raised to
1,000,000 on review. Reverses one built behavior — the abyss arriving at the
first overflow — and one written camera decision (the note over the pipeline in
game.js), each with the changed premise named below. Build notes: the disc's
draw and orbit came back verbatim from the pre-abyss tree (`drawRift` in
render/cores.js, `orbit` in game.js), gated on torn-not-drowned; the cutscene
triggers watch the *gulp starting* rather than the era flags, which is the one
thing both live transitions do and a restore never does; `__rift` now lands a
yard at the end of the arc (drowned, fed past the threshold) so every endgame
check keeps its meaning, and `__tear(ate)` is the hook into the middle of it.*

The pit currently has two eras: a solid pile of drawn grains, and then, the
moment it cannot take one more, the abyss. The jump is a single gulp. This
design puts a third era between them, so the endgame's infinite storage is
*earned by watching it grow* rather than granted in one cut:

1. **Solid.** The pit as it is today: every grain a drawn cell, the crater, the
   crossing. Nothing changes here.
2. **Torn.** The first time the pit cannot take a grain, a *small* hole tears
   above the mouth and starts eating. It grows with what it eats. This is the
   disc era, back — but staged, not permanent, and with the two documented
   failures designed out (below).
3. **Drowned.** When the hole has eaten enough, it collapses down into the pit
   and the pit liquefies — the abyss, exactly as built. The abyss is the end
   state; nothing about its behavior, account, plank, or surface changes. Only
   its *arrival* moves later.

### The torn era, and why it does not repeat the old rift's failures

The original black hole failed twice, and both post-mortems stand (rift.js,
tower.js): a slow trickle never read as *pulled*, and a purchase ladder made
the one non-machine in the yard a machine with a dial. The torn era keeps both
verdicts:

- **It inhales what is within its reach, and the reach grows with it.**
  *(Amended 2026-09-11.)* It inhaled everything from the first frame, and the
  late-game critic's ten-hour run showed what that costs: the pit tore at
  4 h 43 m and was an empty white hole under a black disc until it drowned at
  8 h 27 m — the pile the whole opening is about, gone for the era that is
  supposed to be about losing it (docs/critics-2026-09-10.md, B5). So the disc
  eats what lies within so many cells of its underside: `RIFT_REACH0` cells
  into the pile the day it tears, the far corner of the hole at `RIFT_WMAX`,
  climbing geometrically between (`riftReach`). Freshly torn it skims a crater
  out of the top of the pile under its mouth; the pile stands, its top peeling
  up into the disc, at a level that sinks as the hole grows; grown, it takes
  everything, as before. Still no rate and no ladder — the reach is the disc's
  size and nothing else — and every grain the yard tips in lands on top of the
  crater, inside the reach, so income never stalls. The disc hangs higher
  (`RIFT_UP` 3 → 8 cells) so the pile is in view under it: the picture is
  dust being inhaled more and more, which is what the arc is for.
- **It sells nothing.** No summon row, no appetite ladder, no upgrade of any
  kind. Its growth is fed, not bought: the diameter is a pure function of the
  grains it has eaten. Nothing tends it, nothing has a dial. Playing the game
  is what grows it, which is the growth the original lacked — it was meant to
  be the endgame's storage and it never got bigger, so it never kept up and
  never felt like it was becoming anything.

**Growth.** One new saved counter, `S.riftAte` — cumulative grains ever
swallowed, monotonic, never reduced by spending (spending reads `riftHeld` as
today and does not shrink the hole; a wound does not heal because you took
something back out of it). The diameter is derived, never stored:

```
w = RIFT_W0 + (RIFT_WMAX - RIFT_W0) * sqrt(min(1, S.riftAte / ABYSS_AT))
```

- `RIFT_W0` = 4 cells — a tear, clearly smaller than the old disc.
- `RIFT_WMAX` = 12 cells — clearly too big for the sky it hangs in.
- `ABYSS_AT` = 1,000,000 grains — nearly thirty times the hole's own
  capacity, so the era is a real stretch of play, not a beat. All three go in
  `config.js` under `TUNABLE`; the numbers above are the opening bid, tuned
  from the dev panel against real pace.

The square root front-loads the visible growth (the first fifty thousand
grains double it) and slows toward the ceiling, which is the shape of a thing
straining. `seatRift` reads the derived width; grains still climb out of the
hole and cross open sky into it — nothing teleports.

**The drowning.** The frame `S.riftAte` crosses `ABYSS_AT`, the hole gives
way downward: the existing gulp becomes the collapse, the disc falls into the
mouth as the pile liquefies, and from then on the game is in the abyss era as
built — same `S.rift` account, same surface, same plank, same spend-surfacing.
The disc's own critique ("not a thing a works could have") is answered by the
staging: the torn era's whole job is to *fail into* the abyss, and a wound you
watched grow for an hour giving way is the payoff of having watched it.

**Saves.** `riftAte` joins `SAVED`. A save with `riftOpen` set and no
`riftAte` (disc- and abyss-era saves) seeds it from the sum of `riftHeld` —
already-drowned yards land past `ABYSS_AT` or are pinned drowned by their
existing drowned state, so nobody is pulled back an era. A fresh yard starts
solid.

### Cutscenes

Both transitions are one-time events the player should be *shown*: the camera
goes to the pit, the moment plays with its flair, the camera is let go. The
pipeline note in game.js decided against the collapse taking the camera, for
two reasons: a yank interrupts the player, and the ad-hoc grab "stole the
frame from anything else pointing the camera." The second was a defect of not
having a system; the first is answered by consent-by-rarity plus a skip. The
premise that changes: these are once-per-yard story beats, not recurring
events, and the user wants them staged.

One mechanism, `src/cutscene.js`, not two hand-cut camera grabs:

- **It owns the camera exclusively while a scene runs.** `lookAt`, zoom and
  any hold go through it; nothing else may point the camera during a scene
  (the follow, the purchase-glide and the intro all yield — the intro cannot
  collide anyway, being over long before the first overflow).
- **The yard does not pause.** A cutscene is a camera, not a stop: bodies keep
  walking, the sim keeps stepping. What the scene controls is where you look
  and for how long.
- **Any click skips**, the `skipIntro` precedent: the event still happens in
  the world at full flair — skipping releases the camera, never the moment.
- **A scene is a list of timed beats** (glide here, zoom to k, hold s
  seconds, release), data in `config.js`, so the two scenes here and any
  later one are entries, not forks.
- **Letting go does not go home.** The seat stays on the event and the zoom
  and the held ground line ease out to the yard's own over `CUT_OUT_S`, the
  way the opening lets go of its pair. The first cut put the zoom back in one
  frame and glided the view to wherever the player had been looking, which
  read as a snap and took the picture off the thing it had just made a fuss
  about (user, 2026-09-12). The player scrolls away when they are done.

The two scenes:

1. **The tearing.** Overflow detected → glide to the pit mouth, pull in a
   step (the intro's zoom machinery, `camLockY`) → a held beat on the brim,
   the shake, white page splitting into the `RIFT_W0` tear → the first
   overflow visibly streams up into it → release. ~6 seconds.
2. **The drowning.** `ABYSS_AT` crossed → glide to the pit, wider frame (the
   whole mouth in view) → the disc strains, the collapse, the existing
   liquefy-from-the-bottom over the gulp's seconds → a beat on the standing
   black surface → release. ~8 seconds.

Flair stays inside the language: black and white, flat shapes, the existing
shake, interference and fade vocabulary (full fades, flowing interference, no
popping). No gradients, no letterboxing bars — the yard does not become a
film, the camera just goes and looks.

### How it would be checked

Node tier (`test/pit-arc.test.mjs`): the first overflow tears a `RIFT_W0`
hole and does not drown the pit; the diameter is monotone in `riftAte` and
pinned at `RIFT_WMAX`; crossing `ABYSS_AT` drowns; spending never shrinks the
hole; a disc-era save and an abyss-era save each come back in the right era
with nothing lost; `riftAte` round-trips (the persist check is red for a
field in no list). Player-path: the tear is reached by filling the pit
through play (throws and hauls), never by setting `riftOpen` with a hook.
The cutscene steps run in the node yard (they are sim state), asserting the
camera is released and the world never paused. Then shots: a `tear` scene
and a `drown` scene in tools/look.mjs — the fresh tear, the half-grown hole,
the collapse mid-liquefy.

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

## The sky is the band (built)

**The section that used to sit here described a dither field drawn from the
pollution level, and it is gone along with the code: what is below is what is in
the game.** The "What was tried" part is kept because the reason it failed is not
guessable from the result, and somebody will otherwise have the same idea again.

### What was tried, and why it was wrong

The pollution in this game is a scalar, and the band appeared to be an expensive
way of storing it: `reckon` sets `S.haze` from the mote count and `motesWanted`
converts straight back, and nothing anywhere asks where a mote is. So the sky was
rebuilt as a picture of that one number — a field of thresholds, a cell painted
when its threshold fell under the density.

That reasoning was right about the accounting and wrong about the thing on the
screen, and it took three passes to find out how wrong:

1. **Value noise pulled the cells into soft grey patches.** Patches are cloud.
   Haze is not made of shapes, and the moment specks organise into shapes the sky
   stops reading as dirt in the air.
2. **An even scatter still blotched**, because white noise clumps on its own:
   over eight-by-eight blocks of a middling sky the ink ran from 0.23 to 0.54,
   with no clumping term in the code at all. Blue noise fixed the measurement.
3. **And then it moved, and it was nauseating.** This is the one that matters.
   A field steps in whole cells, so every cell in the sky changes at the same
   instant, together, several times a second. It does not matter how even the
   field is or how faint each cell is: a whole sky flickering in lockstep is not
   something a person can look at.

The band never had that problem and could never have it, because **a mote is a
thing rather than a sample**. It has its own position, its own slot, its own
share of the wind, and it eases. Ten thousand specks each moving a fraction of a
pixel on their own schedule is a sky that drifts; ten thousand cells all being
re-decided on the same frame is a sky that boils. No amount of tuning gets from
one to the other, because the difference is not in the numbers.

### What it is now

**The band, over the whole sky.** Nothing about how a mote behaves has changed.
The slots, the spread that opens with age, the sway lanes, the creep along the
sky, the settling, the plume that climbs out of the works and thins into what is
already up there — all of it is exactly what it was. The only change is how much
sky it has.

- `bandLow()` is read off **the ground line** rather than as a depth below
  `bandTop()`, so the haze fills the window from a couple of cells under the top
  down to a little clear air over the works. A fixed depth would leave a tall
  window with clean air under the sky and a short one with the haze in the dirt.
- **A puff climbs to its own height**, not to the underside of a strip. That test
  used to be one number for every speck because the band *was* a strip; with the
  sky the whole window its underside is just above the ground, and every puff
  would have arrived on the frame it was born. So a puff rises until it reaches
  the place it is going to live, which is its slot's share of the sky. Some go a
  little way and some go all the way up, and a plume thins out over the whole
  height of the window instead of stacking against a ceiling.
- **Three times the specks**, because the same count over four times the height
  is a quarter of the sky it used to be, which is not a haze. Every number marked
  "per mote" is multiplied by three with it — what the house's filters fill with,
  what the recycler hands back, how fast a rain empties the sky, how much dirt one
  drop carries. Nothing about the balance moves; the only thing that changes is
  how much sky one speck stands for.
- **The clouds get their own ceiling.** They used to sit below the haze strip,
  because a pale cloud drawn through your own smoke tied the weather and the works
  together in the one place this game keeps them apart. There is no below the haze
  any more, so the rule goes: a cloud seen through the works' own dirt is the
  right picture, and `CLOUD_TOP` keeps them out of the top of the window where the
  smoke is thickest.

### The rain is a curve, not a line

It used to be nothing at all under `SMOG_RAIN_AT` and a roll above it. Now the
chance is the share of the cap raised to `SMOG_RAIN_BEND`, so **how often it rains
is how dirty the sky is, all the way down** — and nought at nought exactly, which
is both right and what keeps `breaks` from spending the seeded generator on a coin
it never flips.

Bent hard, because this is a balance lever and not a look. Rain takes down the
whole sky it breaks on, so a gentle bend has the weather doing the scrubbing
house's job for it — and the house is the thing you are meant to invest in. At
five: a quarter-full sky is a shower about once in an hour and a half, a half-full
one about one in three minutes, and a brimming one rains the moment `RAIN_GAP`
lets it.

**One thing this turned up that is not yet decided.** `clogged()` counts every
grain of muck lying near the scrubbing house, and the rain drops muck all over the
yard — so a sky bad enough to rain often rains on the house's own doorstep and
stops it. The house is the answer to pollution and the weather now switches it
off. That was nearly unreachable before, because rain could not happen below the
line at all. The clog was written to stop the house spraying its own walk with its
own filters, so counting the sky's muck in it is arguably wrong; but changing that
is a balance decision rather than a fix. See TODO.

### Lightning (built)

A strike is the storm being *seen*, and nothing else: it costs the yard
nothing, touches no body and moves no number. The bargain is that the weather
already has a price — the muck the shower leaves — and a second one hung on a
flash would be a cost you could not see coming. So it is drawn and it is
gone.

It comes with the pour, not the drizzle: the odds a second are the square of
the storm envelope over `BOLT_EVERY_S`, so a full pour strikes about every nine
seconds and the front and the tail almost never do. One at a time. The bolt is
a run of cells from over the top of the window down to whatever that column
has for a floor — the ground, the rock, the dug quarry — jogging sideways with
momentum (`BOLT_KINK` is the chance a segment changes its lean; the rest keep
going, which is the difference between a bolt and a worm) with one fork off it
partway down. For its first instant (`BOLT_FLASH_S`) the whole finished frame
is inverted: the page is already white, so the only way it can flash is to go
dark, and a white bolt on a black sky is the picture everyone has of one. Then
the bolt hangs black over the shower for `BOLT_LIFE_S`, fading through its
second half.

`S.bolt` is ephemeral, like the rain it came with. Scenes `lightning` and
`lightningflash` hold either frame; `__strike(hold, flash)` is the hook under
them.

## The endgame pass (built)

Five things go wrong together once the ram is fully driven, and they are one
story: the rock is worked faster than anything downstream of it was written for.
Measured on the code rather than the yard, a ram at `tune` 5 with the drive heart
and the spell is at the `MACHINE_MAX_BEATS` ceiling every frame -- eight beats of
six cells, forty-eight chips a frame, about 2,900 a second -- and the belt, at the
same ceiling, lifts eight grains a frame. Nothing about the ram is wrong. What is
wrong is that every machine's overflow is capped by the same constant, and the
rift is a station with a body in it that stands two windows off screen.

### 1. The ram waits for the ground

**What happens.** `boulderAlive()` is true the instant `makeBoulder` fills the
grid, so the ram hammers the rock all the way down -- chips thrown off a face
that is still six hundred pixels up. Your own hand is already refused a falling
rock (`overBoulder` checks `S.rockFall`), and the miners already duck out from
under it (`dancing`, crew.js). The machine is the one worker that never went
through those stages.

**The rule.** One predicate, `rockDown()`: alive *and* `S.rockFall <= 0`. It is
what `overBoulder` reads, and it is what the ram's `ready` reads. The hand and the
machine ask the same question of the same function, so they cannot drift apart
again -- a third thing that works the face reads it too, by existing. The ram's
beat clock is held (`beatAt = now + 200`, as an unmanned machine's is) rather than
allowed to run up an owed count while the rock is in the air, so the landing is
not followed by a burst of eight beats at once.

### 2. A beat's overflow is a bigger bite, not more bites

**What happens.** `stepMachines` turns time owed into beats and runs `bite()`
once per beat, up to `MACHINE_MAX_BEATS`. Two things follow. Every machine tops
out at the same eight units a frame, so the belt (one grain a beat) can never be
tuned to keep up with the ram (six cells a beat), whatever either ladder says --
a 6:1 deficit no purchase can close, and the rock's pile fills, and the ram stops,
and the pile is cleared by a handful, and the ram refills it in two frames. That
oscillation is most of what the endgame *feels* like. And each of the eight bites
does its own full `refreshRockTops()` pass over the rock grid, so the ram's cost
is eight scans a frame for one frame's work.

*(2026-09-11: the cap is a quarter second of the machine's own clock now,
`MACHINE_CATCHUP_MS`, not eight units -- at eight units a frame the cap was the
rate from the fourth tuning rung on, and rung five bought nothing over rung
four. A woken tab is still bounded; the dial means what it says. See
docs/critics-2026-09-10.md, B3.)*

**The rule.** A bite takes a *count*. `bite(tender, n)` does `n` units of the
station's own work in one call -- `knockOff(x, y, minerBite() * n)` for the ram,
`n` grains off the ground for the belt, `n` furrows for the tiller, `n` cells for
the drill -- and the runner calls it once a frame with everything owed. The
beats cap stays, as a cap on *units* rather than calls, so the frame budget is
unchanged; what changes is that the belt's unit is now what a hauler's is. **The
belt lifts a load a beat, not a grain**: `haulCap()` grains, the same number the
carters carry, because the belt is "the whole of what a hauler does, minus the
walking" and a hauler does not carry one grain. That is the systemic fix rather
than a constant: the belt's throughput is derived from the carry ladder it already
sits beside on the board, and both machines are measured in the station's own
units.

At the top of both ladders the belt then keeps up with the ram by the same margin
their rates already say it should, and the pile-full stop on the rock becomes what
it was written to be -- the yard finding its level -- rather than a flicker.

### 3. The spike at the break

**What happens**, ranked by the code:

1. `clearApron()` on landing walks every column of the floor -- about sixty
   thousand cell reads -- to find the twenty-odd columns under the footprint,
   and throws a chip for every grain buried there.
2. `makeBoulder` calls `tipRockSand()`, a chip per grain lying on the old hill,
   and `refreshPiles()`, which ends in `wakeGrid(floor)` -- every column of the
   ground marked awake, so the next several frames are full settling passes.
3. `boulderAlive()` scans the whole rock grid, and is asked every frame by the
   ram's `ready`, by `stepCore`, by every miner and by the drawing.
4. The chip loop itself: ~2,900 spawns a second under a driven ram, every one a
   live body in `S.chips` until it lands.

**The rule.** Measure before and after, the way PERF.md does: the node yard,
`__crew`, a driven ram, `--cpu-prof` over the same seeded frames, and a frame-time
table in PERF.md. Then, in order: `clearApron` walks the footprint's columns and
not the floor's; `refreshPiles` wakes the columns the rock's clearance touches and
not the world; `boulderAlive` becomes a count kept by `refreshRockTops` (which
already visits every column) rather than a scan; and item 2 above takes the eight
`refreshRockTops` passes to one. **Nothing mined is destroyed** still holds: the
chips thrown by `clearApron` and `tipRockSand` are grains that were lying there
and every one still flies. If, measured, those two are the spike, the fix is to
throw them over a few frames rather than one -- a scatter that takes a quarter of
a second reads as a landing anyway -- and never to drop them.

### 4. The rift does not need holding open

**What it was.** A body stands at it or it is shut. That was the bargain that
stopped it being a magic box: unbounded storage cost a body not on the rock. The
bargain has stopped paying. At the far end of the longest walk in the game, past
the whole hole, the body arrives once and stands for ever; the decision is never
taken back, because there is nothing to take it back for. It is a job row you
buy and forget, which is the exact thing the machines' ladders were built to
remove, and a body two windows off screen holding a thing open is not cause and
effect anybody can watch.

**The rule.** Torn is open. There is no rifter: the job leaves `JOBS`, the `want`
map, the roster, the crew board and `capOf`; a save with a rifter in it gets that
body walked back to carrying through `S.restaff`, exactly as `buyMachine` walks a
displaced gang. What it costs instead is what it already cost -- red to tear it,
and an endless ladder of red and dust on how fast it swallows -- and that is
enough, because rate was always the thing being sold. The two oldest rules
survive: nobody teleports, since no body was ever what moved the grains; and a
station idles until somebody is there, which the rift is not -- it is not a
station, it is what the hole does with its overflow, and the hole has never been
staffed either.

### 5. The black hole is in the hole

**What it was.** A lens standing on the ground past the far wall, and a stream of
grains arcing the length of the pit to reach it -- the same arc a purchase makes,
which was the point. Nobody sees it. The endgame yard's dust is drawn as an arc
leaving the screen, and the pit itself is one unchanging full pile.

**The rule.** The rift hangs *in the pit*, over the pile, at the near end -- its
center a few cells in from the near lip, at about half the hole's depth -- where
the haulers tip in, the belt's head drops, and the counter stands. It is a black
disc of cells rather than a lens on the ground: the only shape in the game that
is an absence, drawn as the paper's opposite, and always filled, because it is
always open. Grains still land in the pile first -- **nothing gets into the pit
without being carried or thrown**, unchanged -- and the rift lifts them off the
top at its rate, the same `lift` that paying uses. What changes is where a lifted
grain goes: not an arc to the far end but **an orbit**. Off the top of the pile
it rises to the ring, goes round the disc a turn or two on a tightening spiral,
and is gone at the center. `S.gulped` carries an angle, a radius and a decay
instead of a target; `fly` gets a second mover for the orbit. Each grain keeps its
own shade, so the ring is speckled the way the pile is.

**How it reads.** When the rift keeps up, a grain dropped in the hole is lifted the
frame it lands and the pit is a black disc with a ring of dust turning round it
and nothing much beneath -- which is the picture asked for, and it is the picture
of a rift that is *winning*. When income beats the rate, the pile heaps up under
the disc, and around it, and the ring eats it from the top down: the picture of a
rift that is losing, and the whole of the pressure to widen it. The counter and
the picture still agree exactly as before -- the pile shows what is in the hole,
the rift holds the rest, and the counter is the two together. The ring itself is
at most a couple of hundred grains in flight (the cap `lift` already has), and it
is the picture of the *rate*, never a count: a faster rift is a fuller, faster
ring.

**Cost.** Nothing new is drawn per grain that was not drawn before -- the orbiting
grains are the `gulped` list that already existed -- and a disc of cells is
cheaper than the lens. The pile beneath is the same plot it was.

**What is settled by this and worth saying plainly.** `PIT_PAD` stays; the world's
width is measured off it and every save's floor depends on that. `RIFT_W`/`RIFT_H`
become the disc's diameter. `seatRift` places it in the pit; `riftMouth` is its
center; `stepRifter`, `newRifter`, `atRift`, `inRift` go. `rift-migrate` and
`rift.test.mjs` are rewritten against the passive rift (no `__assign('rifters')`),
and the pile mark and tooltip on the near lip -- `the hole is full` -- still stand
when it is, because a losing rift is exactly a hole that fills.

### 6. It is summoned from the tower

Not bought at the bench. It is the one plainly magic thing done to the one
plainly dirt thing, and the tower is where the yard's magic comes from, so it is
called down from there -- `summon a black hole`, on the tower's board under its
own heading, offered once the tower stands, there is red to spend, and the hole
has actually turned dust away. Its ladder, `widen the black hole`, sits beside
it for the same reason the wizards' ladders do: what a board is about is what
stands on it. The bench's `the hole` section is gone with them.

### 7. The hole holds everything (built)

**What it is now.** The rift swallows dust and nothing else. `lift` steps over
any cell that is not dust, so a shard, a spore, a spark or a core banked in the
hole sits in the pile for ever, and the pile is where those are *kept*: the
counters say what you own, and `seedPitCores` puts exactly that many cells in
the hole. A hole the rift keeps empty of dust is a hole with a scatter of finds
lying on its floor and a black disc over them, which reads as a black hole that
is fussy about what it eats.

**The rule.** One capacity, one queue, one rift. A grain is a grain whatever
it is: the rift lifts whatever is on top at its rate, dust or find, and what it
takes is counted by kind in `S.riftHeld` -- cores, shards, spores, sparks --
beside `S.rift` for the dust. The counters do not move, because nothing is
spent and nothing is lost; the pile shows what is in the hole, which is now
the counter *less* what is through the rift, so `seedPitCores` targets
`S[kind] - S.riftHeld[kind]` and the picture and the number still agree by
construction. The counter card is unchanged: it reads what you own, and what
you own is the two places together, exactly as it is for dust.

**Paying.** Out of the hole first and the rift only after it is empty, the same
rule dust already keeps. `takeCoreCells` lifts what the pile has; whatever it
could not find is taken off `riftHeld` instead. A purchase still has its picture
whenever there is one to draw.

**A core too.** It is the rarest thing in the game and it is drawn at the size
a core is, with its glow, and it goes into the black hole like everything else.
A rule with four kinds and an exception for the fifth is the hole "that holds
everything except the four things it does not hold" the pit section already
threw out once. The core's glow was the argument for keeping it visible in the
pile; a black hole is where a thing that glows goes to stop being seen, and
that is the right picture for the endgame.

**Saved** as four numbers beside `rift`, clamped to the counters on the way in
the way `rift` is clamped to `stored`; a save from before has nought through
and every find still in the pile, which is what it had. The mark and tooltip on
the lip are untouched. `rift.test.mjs` gains two groups: the coins go through
and the counters do not move, and a coin is spent out of the hole first and the
rift after -- the second through `__pay`, which is the very function every row's
bill goes through rather than a hook that subtracts a number.

**What building it turned up.** Two things, both of them the same fault: a
counter and a pile that had been allowed to disagree.

- **The red was never in the pile's books.** `HELD` -- the table
  `seedPitCores` reconciles against -- listed cores, shards and spores and not
  sparks, because nothing had ever been priced in red when it was written. So a
  spark went into the hole when it was banked and was never reconciled again,
  and a reload put the counter back without the grains. It is in the table now,
  and every coin is reconciled the same way or the pile is showing four of the
  five things you own.
- **Granting a coin moved the counter and not the cells.** `grant` did the
  honest thing for dust -- bank the grains, overflow through the rift -- and
  simply added to the counter for the other four, which is the game's central
  rule broken by its own dev hook. It seeds the pile now.

And `seedPitCores` sends through the rift whatever the hole will not take,
which is the answer `rehomeDust` already gave for dust. Without it an endgame
hole -- full to the brim -- had nowhere to put a find, and the counter was left
naming something the yard could not point at.

**A new rule watches it.** verify.js rule 8: for every coin, what is lying in
the hole plus what is through the rift is what the counter says, checked once a
second in one walk of the plot. It is the oldest rule about the pile -- the
number and the picture never say different things -- asked of the four coins
rather than only of dust, and it caught both faults above the first time it
ran.

**One knock-on, in the checks rather than the game.** `stuck-yard.json` owns
24,009 sparks and 9,151 spores that a full hole cannot show, so restoring it now
sends them through the rift where before they were quietly absent from the pile.
That shifts the seeded generator along, and a shower landed inside a stretch two
of the fan checks measure across -- checks whose own premise was "with nothing
allowed to rain", enforced by nothing. They wind the sky back up and measure
again until they get a stretch with no shower in it, which is the cure their
sibling had already been given.

### What was decided, and what the measurement said

The calls: the belt's unit is a carter's load; the disc hangs in the pit at the
near end; the landing's throw may be spread if it is the spike. It was not.

**Measured before anything was changed**, with `tools/node/break-perf.mjs`: the
node yard with every machine standing, the ram at `tune` 12 with the drive
heart, the belt at the same, the tower up and the rift fourteen widenings up --
thirty seconds, seeded, each frame timed, main and this branch run on the same
scene one after the other on a quiet machine (two runs each, the worse shown).
On a busy one the same script shows forty-millisecond frames on *both*, which
is the machine and not the yard -- PERF.md's rule about minimums holds.

| frame          | before  | after   |
|----------------|--------:|--------:|
| median         | 0.47 ms | 0.30 ms |
| 90th           | 1.73 ms | 1.07 ms |
| 99th           | 4.38 ms | 2.03 ms |
| worst          | 7.53 ms | 3.66 ms |
| a rock landing | ~0.9 ms | ~0.6 ms |
| a rock breaking| ~1.4 ms | ~1.2 ms |

The break was never the spike. The landing and the break are a millisecond
each. The worst frames were mid-rock, with three or four hundred chips in the
air and two thousand loads on the belt, and the profile put the cost in one
place the reading of the code had not: **a chip landing on a strip that has
reached its ceiling**. `addGrain` looked for a column with room by walking
outward, both ways, asking `full` of every column -- and `full` walks that
column's rows -- for as far as the grid goes. Six hundred columns of ninety
rows, per grain, on frames a driven ram was landing fifty of them. The region
rule already said the grain may only settle on the strip it landed on; the
search now stops at the strip's edge on each side, which is a few dozen
columns instead of the world. The rest of the list, in the order the profile
gave it: `boulderAlive` was a twelfth of the frame and is a read of `rockTops`
now (`clearBoulder` is the one way to zero the grid, so the tops cannot go
stale); `quarryShape` built a template-string key on every call and compares
four numbers instead; `clearApron` visits the footprint's columns and not the
floor's; the counted bite takes the ram's eight `refreshRockTops` a frame to
one and the belt's eight walks of the run to one; and the rift's swallow, which
asked `countDust` of the whole hole every frame it ran -- a fifth of the
simulation once the ladder was up -- reads a dust ledger the grid keeps beside
its cell ledger (`b.d`, kept by `put` and `recount`, watched by verify.js rule
7 the way `n` is). `wakeGrid(floor)` on a new rock and the landing's thrown
grains were measured and left alone: a millisecond, not a spike.

**One consequence worth naming.** A machine fouls per beat, and a beat of the
belt is now a load rather than a grain, so the belt fouls per load: up to
sixteen times less smoke per grain moved at the top of the carry ladder. That
is the rule -- the stack smokes for the work done -- applied to a unit that was
wrong before, not a change to the rule, and it is the belt alone; the ram's
beat is what it was.

**A save with a rifter in it** comes back with that body as a carter where it
stood, on the strip past the far wall, and it walks home over the ladders it
came by. Nobody teleports and nobody is lost; `rebalance` counts the spare hand
without being told.

## Open questions
- Sound: answered. See "The sound of the yard (built)" at the end of this file — the
  seed was soft ticks on a hit and a low tone when a core banks, optional and off by default, and
  what it grew into is a rule rather than a list. Whether it ships off by default is still open,
  and is one of the three questions there.

## Time is a price (built)

Everything past the bench was bought the way you buy anything in a menu -- watch
a number climb, press once, and the thing is simply *there*. The yard had no idea
anything had been built. Two rows in the whole game knew better: the lab's
research, which somebody has to stand there and do, and the tower's hat, which
takes two minutes -- and both of them are the most interesting purchases in the
game for exactly that reason. The waiting is what makes the choice a choice.
While the cut is going down a bench it is not doing anything else, and you had to
decide that was the thing worth the yard's time.

**So time is a price like the rest of them, on every row past the bench.** The
machinery for saying so was already here and had been since the tower: `MARK.time`
is a clock, `priceText` writes it as `2 min` rather than 120,000 of something,
`purse('time')` is `Infinity` because you cannot be short of it, and `buy` skips
it when it takes payment. One row used all of that. Every row past the bench uses
it now.

### The shape

A row says what kind of thing it sells and where it is built:

```js
kind: 'place', site: 'quarry',   // kind: rung | place | building | machine
```

and nothing else about the row changes. `buy` does not apply the effect any more.
It takes the coin -- all of it, now, because what you are waiting on is the
labour and not the bill -- and puts a **work in progress** on the site:

```js
S.works[site] = { key, done, of, at }        // worker-seconds
```

`done` climbs by one second a second **for every pair of hands actually standing
at the site**, and when it reaches `of` the row's own `buy` runs for real. So a
row still describes one thing and still does it in one function, and the waiting
is not written into thirteen of them. The rows hand themselves to `registerRows`
at the bottom of each board's file, which is how a work coming back out of a save
-- a key and two numbers, because a function is not a thing you can write down --
knows what to do when it lands.

**It is worker-seconds and not a clock.** An empty cut builds nothing however
long you leave it. That is the same sentence the lab has said since the day it
opened and the same sentence the machines say about their tenders, and it is what
makes the wait a decision rather than a delay: a station building its own upgrade
is a station not producing while it does.

**Who works it.** Four sites have a gang of their own, and the work is theirs:

| site | whose hands |
|---|---|
| quarry | the quarriers in the cut |
| farm | the hands on the row |
| scrub | whoever is in the house |
| tower | the wizards |
| yard | **the builders** |

The school and everything on the bench have no gang, because the thing being
built is not standing there yet. Those go to the yard, and the yard's spare hands
walk over and put it up.

**The builders are not a job on the roster and never will be.** You do not decide
to have builders -- you decide to build something, and the hands that had nothing
else on go and do it, which is what "spare" already meant. The count is derived
in `rebalance` and goes back to nought the moment the thing is standing. It is
capped at `BUILD_GANG`: a build that swallowed every idle body would stop the dust
moving altogether, and what this is meant to be is a share of the yard's attention
rather than all of it. What it costs you is the dust they are not carrying.

**One work per site.** The cut builds one thing at a time; so do the plots, the
school, the scrubbing house and the tower. A queue you fire and forget is not a
decision, and the lab has had this rule since the day it opened -- one piece per
bench, and the second bench is a purchase.

**Stored as what is left, never as a deadline.** `now()` starts wherever the page
started, so an absolute time saved in one session is a meaningless number in the
next. Worker-seconds have no such problem, which is what makes them safe to write
down at all -- and `brewLeft` in persist.js was already the pattern.

### How long

Time is a price, so it scales the way a price scales -- off the kind of thing and
the rung, from one table (`WORK_BASE`), not hand-tuned per row:

| kind | what it is | with one pair of hands |
|---|---|---|
| rung | one step up a ladder, and a hat off the school's stand | 8s |
| place | a bench in the cut, a furrow, the recycler | 30s |
| building | the lab, the school, the outhouse, the casino, the tower, the two sites | 90s |
| machine | the ram, the belt, the jaw, the tiller | 180s |

A rung climbs with the ladder the way its price does (`WORK_STEP`, a third again
a rung). A place, a building and a machine are flat: a bench is a bench whether it
is the second or the fifth. Read every figure as "with one pair of hands on it":
five quarriers take a bench out in a fifth of that, which is what a gang is for.

**The school's rows are rungs, not places.** A hat is a thing somebody is shown
how to wear rather than a building, and the carts have no ceiling -- a set of six
at a building's pace would be twenty minutes of standing about for a purchase
whose whole character is that you make it again.

### What it is *not* on

**The bench's own ladders stay instant.** Your strength, hold to mine, your
swing, the crew's first strength and speed: these are the opening of the game,
and a game that begins by making you wait eight seconds for the first row you
ever read is a game that begins badly. The bench's *buildings* and *machines* do
take time -- they are the biggest purchases in the game and the ones whose
instantness read worst, a whole lab appearing in a frame.

**The casino is not on it at all.** A stake is not a purchase and a wheel you
have to wait for is not a wheel.

**The lab keeps its own worker-seconds.** It had a time price before any of this
and it is a better one than a site's: the body has to be *inside*. Nothing here
replaces it, and the lab's rows carry no `kind`.

### What it shows

The bill grows a clock beside the coins, counting down what is left **at the rate
the site is actually going** -- so putting two more bodies in the cut halves the
number you are looking at. With nobody on it the clock shows the one-body figure
rather than "never": a row saying never reads as broken, and the honest thing to
tell you is how long it would take if you put somebody on it, which is the
decision the number is there to inform. The row itself is greyed and says
**building**, or **nobody on it** when the site is empty -- and a row whose site
is putting up something else is greyed with its ordinary price, because "the cut
is busy" is not the same information as "you cannot afford it".

And the *site* says so, because this game draws what it does: the same bar the lab
has always had, hanging over the place the work is happening, filling a cell at a
time and stopping dead the moment the last body walks off. `benchMark` no longer
flags a row whose site is busy -- a mark on the bench promising a row you cannot
press is the bench telling you to walk over for nothing.

## The balance pass (three of six built)

Six things the survey of every board turned up, in the order they are worth
fixing. The first three are done; the rest are written down and left.

1. **The lab's four multipliers climbed 1.9 a rung.** *(fixed)* Every other ladder in the
   game climbs about 1.6 -- `rungCost`, and "half again a rung, six times across
   the whole of it" in "The ladder" above. The lab is the row that stands between
   you and every other multiplier, and it is the steepest thing on any board. It
   uses `rungCost` like everything else now, and takes dust with its stone --
   `labkit` was on a rate of its own (`BENCH_KIT_RATE`, four fifths again a rung)
   and is on the same curve as everything else.

2. **Tier-two-and-up rows are priced in their coin *and* dust.** *(fixed)* "The
   ladder" says so and the bench's gear rows do it -- the pickaxes, the harness,
   the boots all take their coin and a pile of dust, which is what keeps the rock
   worth digging for the whole run. The quarry's two rows, the farm's two, the
   lab's four and the scrubbing house's fan were single-coin, so the rock
   stopped mattering the moment the cut opened. Done systemically rather than
   row by row: `billOf` puts dust on every row from a rate per coin
   (`DUST_PER`), and a row naming dust itself is opting out of that rule --
   so none of these do.

3. **A place and a rate rung were priced identically.** *(fixed)* `quarrybench` and
   `quarrypace` are both `BENCH_COST x BENCH_RATE^level`; `farmplot` and `tend`
   are both `PLOT_COST x PLOT_RATE^level`. A furrow and a rung of tending speed
   costing the same at every level is a coincidence, not a decision.

4. **`BENCH_COST` says "shards for the first of them" and the row spends
   spores.** Stale comment on a live number.

5. **Red does not do what red is for.** Tier six is "the last two rungs of every
   ladder, and the machines themselves". The machines take sparks; `packpile` and
   the wizard's own two ladders take sparks; every other ladder in the game is
   five rungs of ground and stops. The last-two-rungs half of the tier is
   unbuilt. Bigger than this pass -- flagged, not folded in.

6. **`cost:` shadowing `bill:`.** Several rows carry both, the `cost` there for
   "anything that asks in one coin". Two prices on one row is one of them going
   stale.

## The bench takes time too (built)

"Time is a price" stopped at the bench's own ladders on the argument that the
opening should not begin with a wait. That argument was about a *clock* -- eight
seconds of nothing happening on the first row you ever read. It is a weaker
argument against *somebody walking over and doing it*, which is the opposite of
nothing happening: it is the first thing in the game that shows you the crew
work for you. So the bench joins the rest.

**Every row on the bench is built, and it is built at the bench.** Strength,
hold to mine, your swing, the pickaxes, the crew's strength and speed, the
harness and the boots: `kind: 'rung'`, and a new site, `bench`. The buildings
and the machines sold from the bench keep `site: 'yard'` -- a lab is built where
the lab will stand, not on a workbench.

**Who does it: whoever is spare, and they walk to the bench.** The bench has no
gang of its own, so like the school and the yard it is a builders' site. That
means the builders now serve *three* sites rather than one, which is the one
piece of new machinery this needs:

- `S.builders` is `min(spare, BUILD_GANG × busy builder sites)` -- three per
  site at most, never the whole yard.
- A builder is *assigned* a site when it is made or freed (round-robin over the
  busy builder sites), walks to it, and stands there. When its site's work
  lands it takes the next busy site or goes back to carrying. A builder is
  counted at exactly one site, so a hat being taught and a rung being fitted
  do not share the same pair of hands.
- `S.works[site].at` is where they walk: the bench's own x for the bench.

**One work at a time on the bench.** It is the same rule every site has, and it
is what stops the opening from being "queue five rungs and walk away": you buy
strength, somebody walks over and fits it, and *then* you buy swing. The board
greys the other rows meanwhile with their ordinary prices, so the reading is
"the bench is busy", not "you cannot afford this".

**How long.** Bench rungs are rungs: 8 worker-seconds, times 1.35 a rung. With
one body that is eight seconds plus the walk. The walk is deliberately part of
it -- see "No teleporting" -- and the first body in the game lives next door to
the bench, so the first wait is about ten seconds of watching somebody come and
do something. That is the opening the game wanted anyway.

**Nobody spare: the nearest body comes and does it.** Carrying first -- a
hauler is spare by definition -- and if there is nobody carrying, the body
standing nearest the site is *lent*: taken off its count, walked over, and given
back to its station the moment the site has nothing left to build. One body a
site, never a gang -- borrowing is what keeps a purchase from stalling, not a
way to staff a build off the rock. The row never says "nobody on it" at a
builders' site, because there is always somebody; the price of that is a miner
away from the rock for ten seconds, which is a price you can see being paid.

This is the builders' rule and not the bench's alone: the yard and the school
are builders' sites too, and one rule for three places beats one rule each.
The four sites with a gang of their own keep the lab's rule -- an empty cut
builds nothing -- because their work *is* the gang's, and lending a miner to
the quarry would be the yard deciding who works where.

**The opening still cannot deadlock**, and now for two reasons: the story's one
body is carrying, and even if it were not, it would be the nearest.

**What it shows.** The lab's bar, over the bench, while a builder is at it. The
builder stands at the bench the way a labber stands at the door -- no hammering
mime; the bar is the work. The bench's own mark (`benchMark`) does not flag a
row while the bench is busy, which it already knows how to do.

**What it is not on.** The casino, still.

### What changes in the checks

Every check that buys a bench rung and reads the effect on the next line: a
handful in `test/` (`ladder`, `pit`, `machines` via `__levels`, `boards`) and
more in `src/selftest/`. Same two fixes as last time -- `buyBuilt` where the
mechanic is the point, `__finish()` where the page is -- plus `__crew(0, n)`
to have hands spare.
## The whole yard dances

A rock comes off, the yard celebrates, and bodies judder on the spot instead of
dancing. This has been rewritten three times and reported again each time, so
the fix is not another tuning pass on the moves. It is the arrangement around
them.

### What is actually wrong

Nothing in `MOVES` is broken. Every reported judder has the same shape: **two
things moving one body on the same frame.**

- the duck walks a body out of the drop zone while the dance's `spin` pulls it
  back onto `moveFrom` — five pixels one way, five the other, sixty times a
  second. Patched by dragging the marks along with the duck (`heldUp`,
  `JOBS.miner.held`), in three places, each with its own re-anchoring rule.
- `elbowJig` shoves bodies apart, and the same two marks have to be shoved with
  them or the shove is undone before it is drawn.
- `step`'s drift back toward `jigAt` fights the zone wall when the mark lies
  through the zone. Patched by re-taking the mark.
- a body whose job stepper still runs — a quarrier digging, a farmhand tending,
  a hauler carrying — is moved by its work and by nothing else, so it stands
  still while the rest of the yard dances. Half the yard not having noticed.

Every one of those is a patch on a collision that should not be possible. And
the collisions are possible because **who dances is decided in five places**:
`JOBS.miner.held`, the hauler's idle branch, `heldUp` from three call sites, and
the absence of a `held` row on every other job.

### The rule

**While the yard is celebrating, every body stops what it is doing and dances.**

One stage, high in the list, above the commute and the work and the mess:

```
celebrate  the rock is off. Every body in the yard stops and dances.
           Nothing below this line runs.
```

That is the whole of it. `JOBS.*.held` goes; the hauler's idle-branch dance
goes; `heldUp`'s three call sites go. No job may opt in or out, so no job can
quietly forget to, and no work stepper can run alongside the dance.

### What that buys

**Nothing else moves a dancing body.** The class of bug is gone by
construction, not by patching each collision as it is found. There is no clamp,
no duck and no elbow running against the dance, because none of them run at
all.

**The mark is taken once and never moved.** Chosen when a body enters the
dance, clear of the drop zone, and left alone until the celebration is over.
Every re-anchor rule (`w.jigAt = w.x` in the duck, in the elbow, in the zone
wall) goes with the thing it was patching.

**The drop zone is settled before the dance starts, not during it.** A body
standing where the next rock will land walks out — a plain walk, at the duck's
pace, dancing nothing — and starts dancing when it is clear. Walking and
dancing are never both happening to one body, which is the collision itself.

**Bodies may overlap.** `elbowJig` goes. The mark spread already scatters a
gang, and two squares briefly sharing ground is a smaller thing to look at than
either of them juddering.

### Where it sits in the stages

Below the commute and the loo, above the stations, the work and the mess. The
top half of that is the fix -- nothing under it can move a dancing body. The
bottom half is the old `held` row's own reasoning, kept: **a body already on its
way somewhere finishes the walk.** Put above the commute it stopped bodies
mid-errand, and a miner sent for its helmet stood down to dance with the hat
still on the stand -- walking and dancing at once, which is the collision this
is against, arriving from the other side.

### Who does not dance

A body that is not standing in the yard cannot dance in it, and this list is
the whole of the exception:

- **in your hand**, **falling**, **floating** down out of the sky — already
  above the celebrate stage in the order, so they are untouched by it.
- **seeing stars** — the same, and for the same reason.
- **indoors**: at home in the shacks, through the lab door, inside the
  scrubbing house. They are not on screen; they carry on and come out to a
  celebration that may already be over.
- **aloft** in the balloon, or on the way to crew one.

Everybody else dances **where they stand**, including a quarrier on the floor
of the cut and a wizard up the tower — they dance on whatever they are standing
on, the way a builder already hammers on a bench top.

### What it costs

Work stops for the length of a celebration (`DANCE_MS`, five seconds, plus any
fall still in the air). Today only the miners stop; the cut, the plots, the lab
and the carrying all run straight through. So this is a real production pause
of a few seconds a rock, and every machine stands down with its tender for the
same few seconds — a station idles when nobody is standing at it, which is the
yard's own rule and not a new one.

That is the price of the thing being asked for, and it is worth naming out
loud: a celebration everybody joins is a celebration nobody is working through.

### What changes in the checks

`test/dance.test.mjs` and the browser's `stations.js` both assert on who is
dancing and who is standing through it. The bar they measure — a body's frame
to frame jump while dancing — stays; what changes is that they may now demand
it of every body rather than of the miners.


### Three things learned building it

**The footing is taken once, and it is where the body already is.** Read afresh
every frame -- which is what the old `heldUp` did -- it is a third thing moving
a dancing body: the dance travels, the yard is not flat, and a body stepping
over the lip of the hole had its feet moved a whole cell between two frames.
Measured at 36px on one body, and up to thirty crossings a second on another.
And it is `w.y`, not a fresh lookup of the surface: the job's own stepper put
the body there and knows things this does not -- asking the ways instead lifted
four quarriers out of the cut and stood them on the ground above it.

**The step turns back at a change of ground**, the same way it turns at the drop
zone, so a body dances on the footing it joined with rather than pacing off the
edge of it.

**Only a body out under the open sky ducks.** `duck` walks a body sideways with
no notion of walls; run on a quarrier down the cut it walked it out through the
side -- the one thing `route.test.mjs` exists to forbid -- and a body below the
surface is not under the rock in any case.

### One thing it uncovered

Poop and muck share a book of claims, and a hauler shovelling ordinary muck
reserved the columns either side of its patch. If somebody had left something
under that reservation, the janitor's own search -- which asks for poop first --
was told there was none, by a body that could not have touched it. With a yard
full of idle hands on the muck, the poop a player wants gone could sit under
somebody else's elbow for ever. B4 said poop is a janitor's alone; the second
book says so where it counts.

## One shop, one clock, one bar

Everything you can buy in this yard is built by somebody. That was true of
thirteen rows and quietly untrue of eleven others, and there was no way to tell
which from a board: the tower's four spells, the black hole and its widening,
the four machine tunings and the balloon were all had the instant you pressed
them. The lab and the wizard took time, but through two systems of their own,
each with its own clock, its own bar and its own save fields.

So: **one abstraction, and a row cannot opt out of it.**

### The rule

A row is one of three things, and the first is nearly all of them.

- **A purchase.** It starts a piece of work at a site. It has a `kind` (which
  says how long) and a `site` (which says where, and therefore who builds it).
  Nothing is had the moment you press it.
- **A bet or a dial.** The casino's stakes, the chip size, the air rate. These
  set a number or put money down; there is nothing to build and no waiting to
  make a decision out of.
- **A job row.** Moves bodies between stations.

Anything else is a mistake, and a check says so by name rather than leaving it
to be noticed in play: every row in every list must answer to one of the three.
That is the "inherently" part -- a new row added tomorrow gets a clock and a bar
by having a `kind`, and gets caught if it does not.

### What works.js grows

Two hooks, both defaulted so every existing site keeps behaving exactly as it
does today:

- **room** -- how many works a site can have on the go. One, everywhere, except
  the lab, where it is the number of benches. `S.works[site]` becomes a list,
  and "one work per site" becomes "as many as the site has room for", which is
  the same sentence with the number named.
- **effort** -- worker-seconds a pair of hands puts in per second. One
  everywhere (`BUILD_EFFORT`), except the lab, where it is `labPace()` -- which
  is what the `labkit` ladder has always been buying.

### What stops being its own system

**The lab's research.** `S.research` / `S.research2`, `startPiece`, `progress`,
`drawLabBar` and the two save fields go. A lab row is an ordinary row with a
`kind` and `site: 'lab'`; the lab is an ordinary site with room for two and an
effort of its own. What a finished piece does stays where it always was -- in
the row's own `buy`.

**The wizard's brewing.** `S.brewAt` is a wall clock: a wizard trains while the
tower stands empty, which no other work in this game does. It becomes a work at
the tower like the rungs beside it, which means somebody has to be up there.
That is a real change to how it plays and it is the point: the rule the whole
yard runs on is that a station idles until somebody is actually standing there.

### The bar

`drawWorkBars` already walks the sites and draws one bar over each. It draws one
per *work* now, so a lab with two benches shows two, side by side. Nothing else
draws a progress bar afterwards -- the lab's own is deleted rather than kept in
step, because two pictures of one fact is how they drift.

### What it costs to play

Eleven rows that were instant now take somebody's time: 5s for a rung, 18s for a
place, 45s for a building, 90s for a machine, climbing with the rung the way the
price does. The four tunings are rungs; the spells and the black hole are
buildings; widening the hole is a rung; the balloon is a machine.

## The hole collapses

A full hole used to stop the yard. A hauler cannot put its load down, so nothing
is banked, so nothing is earned — and the cure was a purchase: a black hole
summoned from the tower for red. Priced, that is, in the one coin that had
stopped coming in. A yard that filled its hole before it could afford one was
stuck, and playing harder could not get it out.

So there is no purchase. **The first grain the hole cannot take tears it open**,
and that grain goes through. Nothing stops, nothing is lost, and there is nothing
to buy first.

Through the rift is not away: `inHole` is what you own less what is through, so
the counters do not move and the pile simply shows less of what you have. It is
the account the rift always kept, arrived at without the hole having to say no.

Two halves, and the second is the one that matters. Tearing the hole open stops
it *refusing* grains; it does not on its own make anybody fetch one, because a
hauler books room before it sets off and the booking asked the hole how much it
had left. With the hole full the answer was none, so six carters banked fifteen
grains in thirty seconds — the rift's own swallowing rate, and a yard still
stopped in every way that matters. A booking is a promise that there will be
somewhere to put this down; once the hole cannot refuse, the promise is always
good, so `pitFree` is unbounded from the moment it collapses.

**What it costs.** The pressure of a filling hole is gone, and with it some of
the reason to buy the belt and more carriers. That was a deliberate trade: a
mechanic that can end a run is worse than a mechanic that is missed. The rift's
own ladder stays — how wide it is torn open is still worth buying, because it is
what drains the pile back down to something you can see.

## The shop's language (design, not built)

Seven boards, fifty-two rows, and three grammars running at once. The writing
itself is not the problem -- "somewhere to keep a shovel, and somebody to swing
it" is the best line in the game -- the problem is that a player who learns what
a row is called on one board cannot use that anywhere else.

### What was already right, and stays

The bench names the same stat the same way for different bodies, and lets the
section heading say whose it is: `carry` and `haulcarry` are both **strength**,
under *your gear* and *crew gear*; `speed` and `minerspeed` are both **swing**,
under *your gear* and *rock miners*. That is not a collision to be fixed. It is
the language, and everything below is an attempt to make the rest of the boards
speak it.

**A heading is a label, not a voice.** It says who or what the rows under it are
about, in the plainest words the game has for that -- *rock miners*, *housing*,
*critical hits*, *build*. The personality lives in the rows and their notes,
where it is attached to a thing you are actually deciding about; a heading with
a voice on it is a riddle standing between you and a list. This is why *a lucky
swing* became *critical hits*, *the block* became *housing*, *the rock* became
*rock miners* and *put up* became *build*.

### The rules

One rule per `kind`, because rows are already typed that way -- so this is a
thing a check can hold the boards to rather than a thing fifty-two rows have to
remember. See `test/boards.test.mjs`.

| kind | the rule |
|---|---|
| `rung` | a bare noun, naming the quantity. The board and its section say whose it is. |
| `place` | **"another X"**, where X is what marks one body's place at that station. |
| `machine` | **"the X"**. |
| `building` | **"build the X"**. One verb for all of them: ten rows with ten verbs read as ten unrelated purchases. The narrative shield rows are the exception -- they are a scripted arc, not a catalogue. |
| tune rows | **"tune the X"**, the same verb for all four. The note carries the flavour. |
| capability | the plain sentence of what you can now do. |

And two rules that are not about names:

- **Every rated row states a unit.** Four lab rows say `+25%` of nothing.
- **Every row has a note.** Fifteen of fifty-two have one, and which buildings
  got one looks arbitrary: the scrubbing house, the outhouse and the tower have
  them; the farm, the quarry, the lab, the casino and the school do not.

**A place is always standing room for one more body.** `capOfBare` says so for
every station in the game -- quarriers are capped by `benches()`, farmhands by
`plotCount()`, labbers by `labRooms()` -- so "another X" is not a figure of
speech, it is what the row does. Each board names that room in its own idiom:
the ground a farmhand stands on, the shovel a quarrier holds, the bench a labber
sits at, the cap a janitor wears. The yard already did this once, with "a second
cap".

**A lab row is named exactly what the row it multiplies is named.** The lab said
*quarry speed* while the quarry's own board said *speed*, for the same number --
two conventions for one quantity. So the qualifier comes off and the heading
does the work, the way it already does on the bench. You learn "speed" once and
it means the same thing in five places.

That forces the lab's sections, which were grouped by theme, to be grouped by
the board each row multiplies -- otherwise `labcave` and `labtend` are two rows
called *speed* under one heading:

| was | becomes |
|---|---|
| the lab: `labkit`, `labroom` | the lab: `labkit`, `labroom` |
| the work: `labswing`, `labhaul` | the rock: `labswing` / the crew: `labhaul` |
| the ground: `labcave`, `labtend` | the quarry: `labcave` / the farm: `labtend` |
| the air: `labair` | the air: `labair` |

Six headings over seven rows is heavy, and it buys something worth the weight:
the lab's board and the bench's board now use the same headings for the same
things, which is the whole of what the lab is -- the rows you already have,
multiplied.

### What changes

Eighteen rows. Everything not listed keeps its name.

| board | key | now | becomes |
|---|---|---|---|
| bench | `pick` | upgrade pickaxe | **pickaxe** |
| bench | `minerpick` | upgrade pickaxe | **pickaxe** |
| bench | `loopost` | a second cap | **another cap** |
| bench | `tuneram` | drive the ram harder | **tune the ram** |
| bench | `tunebelt` | speed the belt | **tune the belt** |
| farm | `farmplot` | new plot | **another plot** |
| farm | `tunetiller` | gear up the tiller | **tune the tiller** |
| quarry | `quarrybench` | dig deeper | **another shovel** |
| quarry | `tunejaw` | sharpen the drill | **tune the drill** |
| lab | `labkit` | better instruments | **instruments** |
| lab | `labroom` | a second bench | **another bench** |
| lab | `labswing` | swing speed | **swing** |
| lab | `labhaul` | carry speed | **speed** |
| lab | `labcave` | quarry speed | **speed** |
| lab | `labtend` | plot speed | **speed** |
| scrub | `fan` | a bigger fan | **the fan** |
| scrub | `balloon` | a scrubber balloon | **the balloon** |
| scrub | `recycler` | recycler | **the recycler** |

Units to add: `labswing` and `labhaul` in dust a second, `labcave` in stone a
minute, `labtend` in crop a minute -- the same units the rows they multiply
already print. And the three place rows say what they are counting: *plots*,
*shovels*, *benches*.

**"upgrade pickaxe" was the only genre-speak in the game.** The only row on any
board containing the word *upgrade*, and the only imperative-with-an-object
among the stat rungs, where everything around it is a bare noun. Every row on
every board is an upgrade; saying so is a word that carries nothing.

**"better instruments" goes the same way.** Every rung makes something better.

**Four tune rows, four verbs, one rule.** *Drive the ram harder*, *speed the
belt*, *gear up the tiller*, *sharpen the drill* -- and the notes one line below
them are already perfectly parallel ("the ram strikes 1.3x harder, again"). The
shape existed a line down and the names would not use it. The flavour is not
lost, it moves to where the flavour already lives.

### "dig deeper" becomes "another shovel"

The one row that named the act rather than the thing, and the argument written
over it was that "the thing you are buying is the hole going further down, and
that is what the row should say". That was right about what the row *leaves
behind* and wrong about what you are *buying*: a bench is standing room for one
more quarrier -- `capOfBare` caps them at `benches()` -- and "dig deeper" reads
as a bigger yield out of the same hole rather than as another body in it. It is
the only place row in the game that does not tell you a body can now stand
there, and it was the one place row whose whole point was that a body can.

A bench does do both, and the note is where the other half goes: another body at
the face, and the cut a bench deeper for them to work. The name says who; the
note says what it leaves behind.

### What is exempt

**The casino's table.** *chips*, *stake*, *bank it*, *spin again* are moves at a
table, not purchases -- a different register on purpose, and the one board where
the player is not shopping.

**`airrate`.** It is a readout wearing a row: it says *pollution / holding
steady* and sells nothing. It should stop being a row rather than be renamed
into one.

## Crits (built)

Every ladder in the game makes a number bigger. What none of them do is change
what a swing *is*, and the yard is a thing you watch -- so the swing worth
watching is the one that comes off differently from the last.

**A crit is a unit of work that counts for several. What that is worth depends
on what the work was.**

One rule, in one place, called wherever work happens -- not a constant per
station. Every station already has its unit: a swing at the rock, a swing at the
face, a stoop over a plot, a trip, a bolt, a second of research.

| station | a crit is | what it does |
|---|---|---|
| your click, a miner | a swing that takes several pixels | adds |
| a quarrier | a swing that turns up a lump, not a trickle | pulls forward |
| a farmhand | a stoop that brings the plot most of the way on | adds |
| a hauler | a trip that carries double | adds |
| a labber | a second that counts as several | adds |
| a wizard | a bolt that takes a cluster of cells | pulls forward |

*(Amended 2026-09-11: a crit at the cut also takes the neighboring cells out,
so the dig finishes sooner. Pulling forward alone changed nothing about the
rate -- a dig ends when every cell is dug, whenever its stone came up -- and
the economist measured a crit rung at the quarry as worth nothing a minute
(docs/critics-2026-09-10.md, B6). The seam is still exactly `seamShards()`.)*

**The bounded jobs pull forward rather than add**, and that is what lets the cut
have crits at all. A dig is worth `seamShards()` and not a shard more -- see
`findShards`, and "a dig never ends owing you any". A crit does not put extra
stone in the ground; it takes several of the ones already there in one swing, so
the dig finishes sooner and the total never moves. Which is what the row wanted
anyway: the face gives up a lump instead of a trickle, the haulers go less often
and carry more, and the whole of it is visible.

Two rungs, and they are the two everybody expects: **how often** and **how much**.
They apply everywhere, because the rule does.

### A crit you cannot see is a multiplier with extra steps

The one hard requirement. Pillar 4 is that the simulation is the reward, and a
crit that resolves silently into a counter is a number wearing a costume. A
bigger bite out of the rock, a burst of dust off it, a lump going over the rim
-- if you cannot tell from looking at the yard that one happened, it has not
earned its place on a board.

### What a crit looks like: a fountain of dust

**Dust off the spot, straight up, and fanning out as it falls.** That is the
whole of the effect and it is the same effect at every station -- the rock, the
face, the plot, wherever the crit landed. A column of grains leaves the work
upward and spreads into a bell on the way down, and then it does what any grain
does: arcs, settles, and is hauled off like the rest.

It is **real dust, not a drawn ring.** The pile is the dust and never a picture
of it, so the burst is the payload -- the grains it throws up are grains you
keep, banked wherever they come to rest. The machinery is already in the yard:
`JOLT_GRAINS` throws thirty grains off the banks when a boulder lands, and
`SHAKE_FLING` / `SHAKE_SCATTER` / `SHAKE_LIFT` are the pop, the spread and the
upward kick on a shaken body's spill. A crit is that, aimed up, off the cell that
was worked.

**A higher arc, and the grains swell through the top of it.** Crit dust does not
fly like ordinary spoil -- it goes up on a taller arc than anything else in the
yard, and each grain grows to its fattest at the apex and shrinks back to an
ordinary grain by the time it lands. A fountain that rises, blooms at the top and
settles. That is the read-at-a-glance tell that a crit happened and not just a
big swing: dust in this game is one cell and never bigger, so a grain the size of
two is a grain that could only have come off a crit.

**The apex is free -- the arc already knows where it is.** A chip is a place and
a velocity under gravity (`spawnChip` in dust.js), so a grain at the top of its
flight is the grain whose vertical speed has fallen to nothing, and one just
launched or about to land is moving fastest. Size is read straight off that --
biggest where the grain is slowest vertically, back to `P` where it is fastest --
so there is no apex to store and no per-grain timer: `drawMark` already takes a
`size`, and the swell is a number worked out from `vy` the same frame it is
drawn. It also ties the two tells together for nothing: a crit throws higher, so
the grain hangs longer near its slow apex, so it is both higher *and* fatter, and
the harder the crit the more of both.

**The moment does not hang.** No pause, no slow-motion, no zoom, and nothing
stops -- not the body that crit and not the ones around it. The crew do not look
up, the view does not shake, and the next swing comes on its own clock as if
nothing had happened. What makes a crit noticeable is the fountain and only the
fountain: it is loud in the instant and gone by the next, which is the one thing
that can happen several times a second without wearing on the eye or grinding the
yard to a halt.

**No screen shake.** The view is thrown for a boulder landing (`SHAKE_LAND`, 15
px) and for a building going up (`BUILD_SHAKE`, 7.5) -- the two biggest things
that happen -- and a thing that happens every few seconds cannot borrow their
voice without drowning them out. The dust is the drama; the camera stays still.

### It is loudest where the yard is thinnest

Crits are a roll, and rolls average out. One body swinging makes a crit an event;
twenty bodies swinging make it a flat multiplier nobody can see. So crits are
loud on your own click and at a station with one or two bodies in it, and they
wash out at scale.

That is a feature and it is worth saying out loud: it is the one thing on any
board that keeps *your own hand* worth using deep into a run, in a game whose
whole shape is handing the work over to other people.

### What is wired, and why two stations are not

Crits fire on four of the six work paths in the table: **your click and a
miner** (`rock.js knockOff`, ADD), **a quarrier** (`quarry.js findShards`, PULL
FORWARD), **a farmhand** (`farm.js cut`, ADD) and **a wizard's bolt**
(`wizard.js`, PULL FORWARD). The fountain of dust rides every one of them.

**The hauler is left out on purpose.** A hauler is the job everybody falls back
to, so a yard has more of them than anything else -- and a crit on a station
with a crowd in it is exactly the "flat multiplier nobody can see" this section
warns about. A carrying crit would be real output and invisible, which is the
one thing crits are not allowed to be.

**The labber is left out for a stronger reason: the lab is indoors.** The crew
go inside it and there is nothing to watch -- the chimney is the only tell it is
worked at all. A crit is a thing you see happen, off the cell that was worked,
and there is no cell and no watching a labber's second. Wiring one would put a
multiplier on a body you cannot see, which fails "a crit you cannot see is a
multiplier with extra steps" outright. The two design lines pull against each
other here -- a labber is a thin station, where a crit is meant to be loud, and
it is also a hidden one, where a crit cannot be seen -- and the hard rule wins:
no invisible crits. If the lab ever gains a visible unit of work, this is the
place to revisit.

Also on the roll but not in the original table: a **miner under a bracing
tonic** rolls at a lifted chance (`critBoost`), so the apothecary reaches the
crit ladder for one body at a time -- see "The apothecary".

## The apothecary rework (built, wave 5)

feedback5 items 7, 11-14, 17-18 reshaped the station: the plot reads hut,
bookshelf, pots, left to right. The hut is the building — the board's target
and the home of every global rung. Each pot is its own: bought one at a time,
set to its own tonic (a board section per pot), brewing simultaneously, its
flame and steam mixed from its brew's color. Stock is per tonic on the
bookshelf, a count badge a shelf, and switching a pot's brew keeps the
backlog. The ladders are hybrid by decision: potency is one row per tonic —
committing to a recipe is the point — while brew speed, dose length, batch
size and the stirrer's armful (carry 1/2/3/4) stay facts about the building.
Haulers take only the carry tonic; a multiplier on a crowd of carters averages
flat, so the other brews skip them and say so in their hover text. The old
single-pot fields (`potTonic`, `potSpent`, `doseHold`, `strengthLevel`)
migrate on load and are dead otherwise.

## The apothecary (built)

A pot, a fire, and a keeper who lights it and walks the doses out. The farm's
crop goes in and comes out as a tonic the whole yard is under.

### The keeper lights it; the pot brews itself (2026-09-03)

The stirrer was split between two jobs it could not do at once: standing at the
pot to keep the batch advancing, and carrying a finished dose out to a body. The
batch clock only ran while it stood there, so every trip out to deal a dose
*stalled the brew*. Changed so a batch is **lit by the keeper standing at the
pot** (an unkept or bodiless pot still brews nothing -- the work is begun by a
body that is there, the yard's rule) but, **once lit, cooks on its own clock**
and does not pause for the keeper's absence. So the keeper lights a batch, walks
a dose out and deals it, and comes back between deals -- which is when the next
batch lights. Doses now pile into a **stock** when brewing outpaces dealing (the
table's count reads that backlog), and adding a second keeper is how you clear it
faster. `boiling` (the steam) is now "a batch is going", not "a body is stirring".

### Built (notes, 2026-09-03)

Shipped as `src/apothecary.js` plus the usual station wiring (crew, world,
persist, board, render). What the doc left open, and how it landed:

- **Doses vs bodies is ONE rung.** A dose is one body, one buff -- a fresh dose
  refreshes the timer rather than stacking -- so "doses a brew" and "bodies a
  brew" are the same sentence, and they are folded into a single ladder
  (`doses a brew`, 3 -> 8). Four ladders, not five: brew speed, buff length,
  buff strength, doses a brew. This is exactly the fold the "Open" section
  allowed for.
- **The unlock price is a core + 900 dust** (`APOTHECARY_CORES` /
  `APOTHECARY_DUST`), the farm's own shape a shade dearer, shown once the plots
  are broken (`S.farmOpen`).
- **Crop is spent at brew-start, not carried in by a hauler.** The general
  "resource carried to the shop it is spent at" machinery (`S.owed[site]`) was
  found to be *designed, not built* -- there is no `S.owed` in the tree, and the
  spend still arcs to the bench. So the pot pays for its crop + reagent through
  the ordinary `take` at the moment a batch begins, and the **doses ARE carried
  out** by the stirrer, a dose at a time, no teleporting. The carried-*in* half
  and the general "spent resource goes to the selling station" rule are left as
  a follow-up (see TODO.md), rather than forcing a new hauling system in under
  this feature.
- **The buff reaches the body cleanly** through three per-body readers in
  `apothecary.js`: `workBoost` (scales the action clock -- wired at the farm cut
  and the quarry dig), `critBoost` (a per-body chance added to `critRoll` --
  wired at the farm, the quarry and the wizard) and `carryBoost` (multiplies
  `load(w)` in crew.js -- every hauler). Coverage note: the +work and +crit
  tonics reach the gathering stations and the wizard; the miner's swing at the
  rock is not yet scaled (the rock's crit is shared with your own click, which
  has no body), so a stew or a bracing tonic dealt to a miner shows in the card
  and the mark but does not yet quicken the swing. Flagged in TODO.md.
- **A second pot is more of the same tonic**, not an independent second tonic:
  `another pot` raises the stirrer cap and adds a brew slot that brews the pot's
  one setting. The "Open" recommendation of a second *independent* tonic per pot
  is a follow-up.
- **The board** is the apothecary's own flyout (like the farm's), a menu of the
  three tonics you set (not buy), a keep/one-off dial, a preferred-station dial,
  and the four ladders. The per-tonic effect is shown on hover (one line) rather
  than in a nested submenu -- with three tonics a hover note is a menu, not a
  wall; the true submenu is a follow-up if the list grows.

### It is an upkeep, not a timer

You do not brew a potion and drink it. **You choose what the pot is set to, and
it brews for as long as it has crop and a body.** The buff is up while both hold
and lapses when either stops.

This is the first thing in the game paid for *continuously*. Everything else is
bought once and kept for ever, so "can I afford this" has only ever meant "do I
have the pile today". A standing order asks a different question -- can the farm
keep this up -- and it is the only kind of sink that scales with a station's
output on its own, without a row being added every time the yard gets bigger.

Which is the point. Green is the coin with nothing to do: of four hundred spores
of lifetime demand, about a quarter is food-shaped and the rest is pickaxes and
machines priced green because blue was already taken. More one-off rows would not
fix that, because a one-off is satisfied once. A drain is never satisfied, and it
gets thirstier exactly as the farm gets better.

**Lapsing is not a punishment.** Nothing is lost and nothing is owed -- the yard
is back to what it was, and the pot picks up again the moment there is crop to
pick up with. No fail state, and nothing asking anybody to come back and top it
up.

### The rules it inherits

**It needs a body.** A pot nobody is stirring is a pot that is not brewing. The
apothecary competes for the crew with the rock, the cut, the plots and the lab,
which is the only real question this game asks, and a station that worked while
empty would be the first one that did not ask it.

**The pot says whether it is up.** The lab's chimney rule, word for word: a lab
with research paid for and nobody in it does not smoke at all. On the boil means
the buff is on. That is the readout, and there is not a second one -- you learn
it from across the yard the way you learn the lab is being worked.

**Its place row is "another pot".** Standing room for one more stirrer and one
more tonic up at a time -- `capOfBare` shaped, and the grammar in "The shop's
language" already names it.

**A potion is never fed by the thing it boosts.** This is the machines' own rule
-- a machine is never priced in what its own station makes -- and it matters more
here, because a tonic that quickens the farm and is brewed out of the farm's crop
pays for itself and stops being a decision. A tonic is a trade between two parts
of the yard or it is not a tonic.

### Where it stands in the run

Early, and not late. The instinct that potions are an endgame thing comes from
potions being magic, and this is not magic: it is herbs and a pot, and you are
already growing the herbs. It goes in shortly after the plots are broken, and it
is the reason the plots are worth breaking.

That also keeps the two registers apart. Down here it is a fire and a wooden
spoon; up at the tower it is rings and bolts and a hat that takes two minutes to
make. The tower stays the last act.

A later tier of the same building is where the two meet -- the recipes that need
something off a star -- so the apothecary is a place you have walked past for
hours before it starts making anything strange. Which is a better late building
than a new one, because it is one you already know.

### The recipes are the lab's

Research the recipe, brew the tonic. The lab already works rather than buys, and
it is the one building whose whole job is making other buildings better -- so a
growing list of tonics is something the game can already hand out, and a tech
ladder that does not need a new system to hang on.

### The board: choosing what to brew

The apothecary's board is a **menu of the tonics you know**, and it reads
differently from every other board in the game because you are not buying a
rung -- you are setting what the pot is making. Each tonic on the menu shows the
three things you decide against:

- **what it costs** -- the crop a brew takes, in the coin it takes it in;
- **the brew time** -- how long the pot is at one batch;
- **the effect**, as a **submenu** -- what the tonic does and how much, opened off
  the tonic rather than crowding the row, because a menu of a dozen tonics each
  spelling out its whole effect is a wall of text and a menu of names you can
  open is a menu.

**A toggle: keep brewing, or a one-off.** The pot is set to a tonic and then set
to one of two rhythms. *Keep brewing* is the upkeep -- it brews that tonic again
and again for as long as it has crop and a body, and it is the standing order the
whole apothecary is built around. *A one-off* is a single batch: brew this once,
deal it out, and stop. The one-off is for a tonic you want *now* -- a burst of
crit before a rich boulder -- without committing the farm's whole crop to
keeping it lit. Same pot, same stirrer; the toggle is only how many times it
comes round.

**A preferred station.** Somewhere on the apothecary's board you set **who the
doses go to first** -- a station the round favours. Without it "bodies a brew"
is a number with nowhere to point: a brew that reaches four workers is worth
most when you chose *which* four, and the whole reason to brew a quarry tonic is
to get it onto the quarriers rather than onto whoever the stirrer passed first.
The preference is a nudge, not a wall -- the stirrer still deals to others once
the favoured station is covered -- so a small brew lands where it matters and a
big one spills to the rest of the yard.

### The stirrer deals the doses

A brewed tonic is not a number that switches on -- it is **carried to the bodies
it is for**. The stirrer fills a dose off the pot and walks it out to a worker --
the preferred station first -- the way a hauler walks a load: the buff lands on a
body when the dose reaches it, and not before. So a fresh brew spreads across the
yard rather than blinking on everywhere at once, and you can see the tonic going
round -- which is the whole of what makes it a thing that happened rather than a
flag that flipped.

This is the same shape as everything else in the yard: no teleporting, a body
walks. It also makes "how many workers a brew reaches" a real quantity with a
picture behind it -- the stirrer gets round to so many before the brew is spent
-- rather than an abstract cap. A body whose dose has worn off is a body the
stirrer comes back to, so a farm that keeps the pot fed keeps the round going.

### The buff is on the body, and it says so

A dealt tonic is worn, and you can see it is worn -- **twice over, at two
distances.**

**On the body, across the yard.** A buffed worker carries a mark that says a
tonic is on it -- drawn in cells like everything else, no glow and no gradient
(the six-shade rule holds). You do not have to open anything to see that the
round has reached this corner of the yard: the bodies with the mark are the ones
the pot is currently keeping up, and the mark fading is the dose wearing off.

**In the stat card, up close.** `card(w)` in crewboard.js is the per-body sheet
-- name, age, what it is doing, its tallies -- and a body under a tonic gets a
row there: which tonic, and how long it has left. That is where you read the
*what*, the way the mark on the body is where you read the *that*. It is one
more `row(...)` on a card that already lists everything else true about a body,
so a worker's whole state -- what it does, what it is doing, and what it is under
-- is in one place.

### The potion ladders

The apothecary's own board, and unlike the stations it is a building whose rungs
are all about the *tonics* rather than about a rate of production. Five, and each
one is a plain lever on what a brew is worth:

| rung (as it reads on the board) | what it does |
|---|---|
| **a quicker brew** | how fast the pot turns crop into a dose |
| **a longer draught** | how long a dose lasts on the body it is dealt to |
| **a stronger draught** | how much the tonic is worth while it is up |
| **a bigger batch** | how many bodies one brew can be dealt out to |

The board reads in the apothecary's own voice rather than in stat words: "a
longer draught" and "a stronger draught", not "buff length" and "buff strength".
Four rungs, not five -- `doses` and `bodies-a-brew` folded into one ("a bigger
batch"), because a dose is one-body-one-buff and does not stack, so "more doses"
and "more bodies reached" are the same sentence. The pot's own controls sit
under "the pot" ("the fire" -- kept burning or out after this -- and "doses go
to"); the tonics sit under "the menu", each showing its effect, how long it
lasts, and the crop-and-reagent a brew costs, right on the row.

These are the tech ladder the lab's recipes feed into: a recipe unlocks a
tonic, and these rungs make every tonic you know worth more at once. So the lab
widens the list and the apothecary deepens it, which is the same division of
labour the lab and the stations already have.

### The numbers (a starting point, to tune on a real farm)

All of these are sized off the one measurement that matters: **the farm caps at
~86 spore a minute (~12 per hand, linear below that), and the apothecary opens
early, when the farm is a few hands and cutting 12--40 a minute.** So the first
pot has to be affordable for a small farm and a second one has to bite.

**A tonic is a crop base plus a reagent.** Not crop alone. Every recipe is the
herbal base -- spore, which is what keeps the apothecary a *continuous green
drain* the way the whole design wants -- plus **one reagent coin** that gives the
recipe its identity and, in doing so, drains a second coin at the same steady
rate. So the apothecary is a sink for more than green: a tonic with a shard
reagent is a standing draw on blue, which blue badly needs.

**The reagent is never the coin of the station the tonic boosts**, and the crop
base is dropped entirely for any tonic that boosts the *farm* -- that is the
"never fed by what it boosts" rule, made sharper. A crop-only farm tonic would
have the farm paying for its own speed, a loop; a farm tonic is priced in shard
and dust instead, no crop at all. Every other tonic carries the crop base freely,
because the crop it costs is not the output it speeds.

**The first three tonics.** Plain, mid-sized, and each a lever the game already
has:

| tonic | effect on a buffed body | costs | the one-off it is for |
|---|---|---|---|
| **a hearty stew** | works +25% faster (its own main action, whatever the body does) | crop + dust | the everyday standing order |
| **a bracing tonic** | crit chance +8 points | crop + shard | a burst before a rich boulder |
| **a strong brew** | carries +50% | crop + shard | clearing a backed-up pile |

+25% is the lab's own `STEP`, so it reads as one familiar size. The crit tonic
is the reason crits are worth building first: a standing order on a rate that
does nothing is a standing order nobody sets. The stew is the general buff, so
its reagent is dust, the shared coin; the two targeted tonics take shard, the
coin of neither the crew nor the crit they lift.

**(built, 2026-09-10) The bills differ, recipe by recipe.** Every brew used to
cost the same flat twelve spore and two of its reagent, and a book of five
things at one price is a book with no choice in it -- only the reagent's name
changed from line to line. Each recipe now has a bill of its own (`BREW_BILL`):
the stew is the everyday brew at the everyday coin (12 spore, 40 dust); the
bracing tonic is the sharp one and pays in the scarce coin (10 spore, 4 shard);
the strong brew and the speed brew are the crop-heavy ones, the haulers' brews
eating the haulers' own harvest (16 spore + 2 shard; 20 spore); and the gleam
brew is priced in sparks (8 spore, 3 sparks) -- a brew that makes sparks costs
the thing it makes, and it is hidden until a first spark has been seen, the way
the shard brews hide until the quarry opens. Three sparks a batch is a real draw
on the machines' coin (sixty dust to the spark) without being a machine's price.

**One pot, at level 0:**

| dial | value | why |
|---|---|---|
| crop base a brew | 8–20 spore, per recipe | the green drain, on every tonic |
| reagent a brew | 40 dust / 4 or 2 shard / 3 sparks, per recipe | the second coin, per the recipe |
| brew time | 30 s | → **drain = 10 spore/min + 4 reagent/min** to keep one pot lit |
| buff length | 60 s | — |
| doses a brew | 3 | → 2 brews/min × 3 = 6 doses/min |
| bodies held buffed | ~6 per pot | 6 doses/min × 60 s length = 6 bodies always up |

The green drain is exactly what it was -- 10 spore/min a pot, sized under the
farm as before. The reagent is a lighter second draw (a shard reagent at ~4/min
a pot sits well under the quarry's ~5/min at full pace), so it is a real cost
without making blue the thing that gates a green building.

**The arc that falls out of it.** A brand-new apothecary on a 2-hand farm
(~12--24/min) can just keep one pot lit -- a real squeeze, which is the right
feeling at the moment it opens. A growing farm keeps one comfortably and a second
pot (another 10/min *and* another stirrer body) is the stretch. A mature farm at
86/min is never crop-limited on pots at all -- and that is intended, because by
then the limit is **bodies**: every pot needs a stirrer, so "how many pots" is a
question asked of the crew, not the crop. Early it is crop-gated, late it is
crew-gated, and the handover is the farm growing.

**Is a tonic worth a body?** A stirrer is a body not cutting -- about 12
greens/min given up. A +25% stew held on ~6 bodies is worth about +1.5
bodies-worth of work, minus the one stirring, minus 10/min of crop: marginal the
day it opens and a clear win once the ladders widen the round. That is the
decision doing its job.

**The five ladders, level 0 → maxed (5 rungs, `rungCost`, priced in spore and
dust like every tier-two row):**

| rung | 0 | 5 |
|---|---|---|
| brew speed | 30 s | 15 s (drain doubles, coverage doubles) |
| buff length | 60 s | 180 s |
| buff strength | +25% | +60% |
| doses a brew | 3 | 8 |
| bodies a brew | (see below) | — |

Maxed, a single pot pours: 4 brews/min × 8 doses × 180 s length is far more
coverage than one pot has bodies to spend it on, which is the endgame pushing you
toward a second pot and its second stirrer.

### Open

- **`doses a brew` vs `bodies a brew`.** Held as two rungs above but they are the
  same sentence unless a body can hold more than one dose at once. If a dose is
  one-body-one-buff, fold them into a single rung; keep two only if a body can
  stack. Decide with the brewing model.
- **A second pot: a second tonic up, or a stronger one?** A second *tonic* (two
  different buffs running at once, two preferred stations) is the more
  interesting board and the harder sum. Recommend a second tonic.
- **The apothecary's own rung prices.** The first-rung dust/spore figures follow
  the house `rungCost` curve; the exact first values want the same measure-on-a-
  save treatment `TIER_COIN`'s thresholds do, not a pick here.
- **Star-tier tonics.** The later recipes that cost something off a star are left
  for when the tower and the star economy are settled -- named in the arc, not
  numbered here.

## Workers assigned by hand (built)

The counters and their plus/minus buttons under each station do the job, but
they are a spreadsheet's answer to a question the yard already knows how to
ask with bodies: pick a worker up, carry it to a station, put it down. The
game already has the pickup (the hand lifts a body today), and wave 7 gives
the hover a pause and a question mark, so the hard part -- catching one -- is
solved. What is missing is the drop meaning something.

**The bargain.** Assignment becomes a physical act with travel time -- you do
not reassign half the yard in a second, you carry them one at a time, and the
body you drop still has to walk in through the door before it counts. In
exchange the boards lose two buttons per station and a number nobody loved,
and the yard's one rule ("nothing teleports") finally applies to the player's
own hand.

**The shape.**

- A worker dropped within a station's rect (the `siteBox`, padded a cell)
  retrains to that station's job: hat swap at the bench as today's retraining
  does, then the walk in. Dropped anywhere else, the body goes back to what
  it was doing -- a drop is only an order when it lands on a door.
- While a body is held over a station, the station shows the same aura wave 7
  gives affordable offers, so the drop target reads before you commit.
- The counters do not vanish in the same change. First the drag-assign ships
  alongside them; the plus/minus buttons go only after it has proven it can
  cover the cases the buttons cover -- bulk moves ("five quarriers, now") are
  the open question below. Removing the readout number itself is not planned:
  a count you can see is information, not a control.
- `rebalance()` stays the single owner of `S.haulers`; a drop changes the
  *ask* (`S.<job>`), exactly as a button press does today, so the economy's
  invariant is untouched.

**As built (wave 7b).** Canon in `docs/wave7b.md`. The counters and buttons
stayed; the drop rides `joinJob` so the ask moves exactly as a button press
does and the body walks its retraining. The steady ring draws on the
station's own walls (a ring in the padded white sky is invisible), and shows
for no-deal cases neither -- own job, full station. Touch has no lift today
and got nothing. Still open, deliberately:

- Bulk assignment. Carrying ten bodies one at a time is a chore, not a game.
  Candidates: dropping a body while holding shift moves its whole idle
  cohort; or the station's aura, clicked while a body is held, takes "as many
  as fit". Decide by playing the drag version first.
- Whether a held body's old station should count it as gone immediately or
  only when the new door swallows it. The walk-in rule says the latter; the
  counter should read "in transit" somehow or the numbers look wrong.

## The build yard (built, then scrapped)

A rung and a building cost the same click and read the same on the board, but
one is a number and the other is a thing that should exist in the yard.
Construction is invisible -- a bar fills, a building rises, nobody built it.

**The bargain.** New constructions (stations, machines, pots -- anything with
a `works.js` site) require a builder: a construction bench adjacent to the
existing bench, one worker assigned, and that body walks to the site and
works the build. Build time becomes a function of hands on it rather than a
flat timer. In exchange the player gets a visible cause for every rising
wall, and a new ladder: the construction bench upgrades to run more than one
build at once (a second builder's post), which is the answer to the late-game
click-five-buildings-at-once moment. Rungs stay instant -- a rung is a better
tool, not a new wall, and gating numbers behind a walk would be pure
friction. That is also the answer to the confusion that raised the item: if
only buildings summon a walking builder and a fenced footprint, the board
does not have to explain which rows are buildings -- the yard does.

**The shape.** A new site per the ARCHITECTURE.md checklist (rect in
`world.js`, file of its own, hire row, `want` map entry in `syncWorkers`,
draw in LAYERS, fields in the saved lists). The builder job follows the
JOBS-registry pattern; output depends on a body through the door
(`inBuild()`), never on the assigned count. Queued builds wait visibly --
fenced footprint, no bar moving -- until a builder frees up, which is itself
the signal to buy the second post. BUILD_GANG (wave 3) folds in: the gang
multiplier becomes the builder's pace ladder.

**As built (wave 7b).** Canon in `docs/wave7b.md`. Before the bench was
bought, builds behaved exactly as they always did (one `if`, no migration);
the bench itself was the last self-raising build. With it open, only builders
counted toward building and machine works, queued builds stood fenced with an
empty bar, and the `buildposts` ladder (sparks, +1 concurrent build and +1
builder each) with a `buildpace` ladder replaced BUILD_GANG.

**Scrapped.** The construction bench is gone. It was two trestles in the yard
standing side by side, and the row that raised it read `build the work bench`
-- named after the shop it stood next to, which is the collision that made
both of them awkward to talk about. What it bought was a build *queue*: works
standing fenced because nobody had been hired to them, and a post ladder to
widen it. Nobody wanted the queue. Workers build things themselves, which is
what the yard did before the bench and does again -- the yard derives a spare
body per busy site and lends the nearest one when nobody is spare.

The removal was the deletion of one `if` in `rebalance` and the else branch
below it, which had been the pre-bench world the whole time. Gone with it: the
`buildposts` and `buildpace` ladders (a sparks sink and a spores sink), the
builder post on the roster, the trestle in `render/stations.js`, and the
yard's room going back to one build at a time.

Three rows had been gated on `S.buildbenchOpen` -- the casino, the
multipliers and the tower. Each of them had named whichever building happened
to sit at that tier: the lab first, then the trestle when the lab went. Two
scrapped buildings in a row is the mechanism asking to be written down, so it
is `invested()` in `upgrades/site.js` now -- two places bought and the first
rock behind you -- which is the thing those rows were actually waiting for.

The workbench stays. The ten `build the X` rows have nowhere else to live: a
place cannot sell the row that opens it, and the invented stand for one of
them (the janitor's closet) was already tried and scrapped.

## The grind pass (design, not built)

The game's prices were set against the yard that existed when each row was
written; the yard that actually reaches them is richer, and getting richer
faster than any five-rung ladder gets dearer. Measured with a playthrough bot
(`tools/node/playbot.mjs` — clicks the rock, staffs the stations, buys every
shown row it can pay for; four strategies, two seeds, six game-hours each),
the run looks like this:

- **The opening bench is one purchase, not eight.** First dust banks around
  minute seven; within the following *forty seconds* every one of the eight
  opening rows is affordable, and a greedy player clears the whole bench —
  thirty-one rungs — by minute eleven. The 1.6x rung curve never gets ahead of
  a crew that is itself compounding (each house is more hands, and the house
  costs only 1.35x a body).
- **A new board opens already beaten.** The farm door is bought ten seconds
  after it first shows. The apothecary is the worst case: the door and all
  seven of its ladders — twenty-three rungs — go in under four minutes, every
  row affordable *on the frame the board first existed*. The board is a list
  to click through, not a set of choices.
- **The three grounds mint at wildly different rates and are priced at par.**
  By hour six the yard holds thirteen to twenty thousand spare spores against
  a peak of seventeen shards — yet `DUST_PER` says a shard and a spore are
  both worth forty dust, and ladders in either coin start at the same handful.
  Everything shard-priced (the pickaxe, the harness, the school, the fan, the
  wizard at forty shards) starves for hours and then lands in one burst;
  nothing spore-priced is ever a decision. In six greedy hours no run ever
  afforded a wizard, so sparks — the whole red economy, the machines, the
  tuning ladders — were never touched.
- **Cores are waits, not goals.** The quarry door (two cores) sits shown and
  unaffordable for ninety minutes; the lab door (two more) for nearly four
  hours. Cores come one a rock on the rock's own clock, so nothing the player
  does moves these — the mid-game's two biggest purchases are timers wearing
  price tags.
- **Dust has nowhere to go.** By hour six income is six hundred to a thousand
  dust a minute; the endless house is the only sink still standing, and the
  user's own late saves show every counter in surplus.

One caveat the numbers carry: the bot's shard famine is partly its own crew
policy — before retuning anything shard-side, measure quarry occupancy on a
real save (are the benches actually swinging?). If a staffed cut digs this
slowly for a player too, that is a defect, not a tuning.

### The bargain

The fix is not "make everything expensive". It is: **a purchase should be
seen before it can be had, and had before the next one is seen.** The gap
between *seen* and *had* is the grind, and it should be minutes early, tens
of minutes in the middle, and the better part of an hour late. Targets, in
active-play minutes (4 clicks/sec, sensible staffing — the bot's greedy run):

| milestone | today | target |
|---|---|---|
| opening bench cleared | 11 min | 30–45 min |
| farm open | 24 min | 15–25 min (fine) |
| apothecary board cleared | +4 min after door | +45–90 min |
| quarry open | 116 min (waiting) | 35–55 min (earning) |
| lab open | 4 h (waiting) | 1.5–2.5 h (earning) |
| first wizard | never (6 h) | 2.5–4 h |
| first machine | never (6 h) | 5–8 h |
| spare coins at 6 h | 13k spores, 5k dust | < 30 min of income, any coin |

### The levers, in the order they are worth pulling

1. **Reprice the grounds by what they mint.** `DUST_PER` calls shard and
   spore equals; the yard mints spores at up to two hundred a minute and
   shards at a handful an hour. Split them: spore 40 → 15, shard 40 → 60,
   and multiply the spore leg of every spore-priced ladder by three to four
   (the apothecary's `brewRung` base 5/300 → 18/900, `quarrybench` 3 → 10,
   `quarrypace` 4 → 12, `labcave`/`labtend` likewise). The farm's glut is the
   apothecary's upkeep coin, so the ongoing `BREW_CROP` 5 → 12 as well. This
   is one table and a handful of `first` constants — no mechanism changes.

2. **Open a board poor.** A door you can afford is a door whose board you
   cannot yet clear: set every station ladder's first rung at roughly *half
   the door*, not a fortieth of it. The apothecary door is 900 dust and its
   ladders open at 300; the farm door is 600 and a plot is 260 (about right —
   and the farm is the one board that pacing survives on). Add the stagger
   the bench already knows (`seenX` flags, not thresholds): potency rows show
   after the first brew lands, `brewdoses`/`bufflength` after the third, the
   second pot after the fifth. Earned reveals, in the house pattern.

3. **Make the opening bench outrun the crew.** Keep `rungCost` at 1.6x — the
   solo player prices are right — but the crew rows should climb with the
   crew they serve: `haulcarry`/`haulpace`/`rockhandspeed` first costs x3
   (50/60/70 → 150/180/210), and the house 1.35x → 1.45x so the twentieth
   body is a real decision (60 → ~64k lifetime instead of ~35k). The crit
   pair x4 (60/80 → 240/320): they are the strongest per-rung buy on the
   board and currently the cheapest.

4. **Turn the core waits into earnings.** Keep cores one a rock — the rhythm
   is right — but let the doors lean on the grounds the player can push:
   quarry door 2 cores + 1,800 dust → 1 core + 6,000 dust; lab door 2 cores
   + 5,000 → 1 core + 12,000 + 20 spores. The player still needs the rock's
   gift, but the rest of the bill is theirs to hurry.

5. **Give the late coins somewhere to die.** The tower already lost its
   endless red sink (TODO, wave 5 follow-up 3); the decided list says sparks
   tear *and widen* the rift — so the rift-widening ladder returns as the
   endless spark sink (x1.7 a rung, gain worth watching but not owning, in
   the tune-ladder mold). The wizard's endless x1.7 three-coin bill is
   already the natural spore/shard drain — the reason it never fires is that
   nobody reaches it, which levers 1–4 fix. No new sink beyond what is
   already decided; the surplus is a supply problem wearing a sink costume.

6. **Keep the bot, and re-measure every pull.** `tools/node/playbot.mjs`
   lands with this pass; the table above is its output, and each lever is
   verified by rerunning it, not by re-reading the constants. The pacing
   table in "Pacing" above gets re-measured the same way once the dust
   settles.

Not doing: income nerfs (the crew doubling, the lab multipliers and the
hats are the game's feel and they stay); prices indexed to live income (a
price that chases the player can never be beaten, and the sky is already
the one live opponent); any new plant or sink outside the decided list.

## The drain: what falling into the rift looks like (built, then superseded)

> **Superseded by "The rift pulls" below.** Everything in this section about
> *why* the three motions had to agree still holds and is why the section is
> kept. What is gone is the answer it reached: one authored spiral that every
> grain was pinned to. A law of infall is still a script — the giveaway was
> that a grain released at rest orbited exactly as hard as one flung past at
> speed — and the rift has actual gravity now, with the shape of a fall left to
> fall out of it. `riftFall` is deleted.


Three notes from the ninth round of feedback, all about the same few hundred
pixels: dust thrown into a torn pit spreads itself evenly across the hole
before the rift takes it; the grains it takes do not swirl; and the disc reads
as chaotic rather than as something flowing.

They are one problem. There is no single account of *how a thing falls into
this hole* — there are three, invented separately, and the eye sees the
disagreement between them long before it can name it.

### What is there now, and why each piece looks wrong

**The throw.** A hauler at the lip aims each grain with
`land = pit.x + P*2 + |bell()| * (far - pit.x) * 0.45` — a spread across the
width of the hole, tailing away from the lip. That is the right throw for
building a pile, and it is the throw the yard has always used. With the rift
open there is no pile: `riftCatch` takes every grain the moment it crosses the
mouth. So the yard is still aiming at a floor that no longer exists, and the
picture is a fan of dust flung across a hole followed by a second, unrelated
motion dragging it all back to one point. Nothing is wrong with the physics;
the *aim* is answering a question the rift already settled.

**The orbit.** `orbit()` in game.js moves a caught grain by
`a = a0 + spin * t^1.8 * RIFT_TURNS * 2π` and `r = R * (1.32 - 1.25 * t^2.2)`,
with the first quarter of its life spent lerping from where it was caught onto
that curve (`join`, eased `e = join²`). Two exponents above 1 mean it barely
turns and barely descends for most of its life, then does both at once at the
end: a grain hangs at the rim and then drops. Water in a drain does the
opposite — it circles slowly while it is wide and *faster* as it narrows,
because what is conserved is angular momentum, not angular speed.

**The sprite.** The disc is drawn well, and three things on top of it are the
"chaos": the speckle rings counter-rotate (`ring % 2 ? -1 : 1`) and are snapped
to the cell lattice (`Math.round(px/P)*P`), so each cell *jumps* between lattice
sites as its ring turns — a boil, not a drift; the lens warp carries two angular
harmonics (`a*2` and `a*3`), so the rim lobes rather than breathes; and twelve
short streaks at 0.8 turns read as a wheel of spokes rather than as flow.

### The rule: one spiral, and everything falls along it

**A single law of infall, in one place, read by everything that falls in.**
Given a distance from the center in disc radii, it answers where a thing is on
its way down. The sprite's streaks and the grains' orbit both read it, so the
drawn infall and the real dust are on the same curve — which is the whole of
what makes a drain read as a drain rather than as decoration over a hole.

The law is the drain's own: **angle accelerates as radius shrinks.** Radius
falls smoothly and steadily from the outside in; the angle advances as the
inverse of the radius, so a grain sweeps slowly while it is wide and whips
round several times in the last stretch before it goes under the disc. One
constant says how many turns the whole fall takes; nothing else is tuned
per-caller.

Three consequences, each one a note answered:

1. **The throw aims at the drain.** With the rift open, the hauler at the lip
   throws *at the disc* rather than across the hole — the same `aim` and the
   same arc, a different target. The grain leaves their hands on a line to the
   thing that is going to eat it, is caught at the mouth as it already is, and
   joins the spiral near where it entered. There is no fan and no second
   motion; there is one throw that goes in.
2. **The grains swirl.** `orbit` reads the law instead of its two exponents,
   and the `join` lerp goes with it: a grain caught at the mouth is *already*
   on the curve at its own radius, so there is nothing to ease onto. It circles
   in, faster and faster, and passes under the disc.
3. **The disc calms down.** The speckle stops counter-rotating and stops
   snapping to the lattice (whole pixels are fine — the rule the flag's pole
   already follows — but it must not hop a cell at a time); the lens keeps one
   harmonic so the rim breathes as a shape instead of lobing; the streaks get
   fewer, longer and given more turns, so each is a curve the eye can follow
   rather than a tick mark. The disc itself, the halo and the paint order are
   untouched — the silhouette is right and this is not about the silhouette.

### What this must not break

- **Nothing teleports.** The grain still crosses the yard, still arcs off the
  lip, still enters at the mouth. The law governs what happens *after* it is
  caught, which is the one stretch of its life that was already an animation.
- **The count is not touched.** `throughRift` books every grain exactly as it
  does today. This is the picture of the fall, not the accounting of it, and
  `S.gulped`'s cap stays a drawing budget.
- **The drowning still reads.** The abyss's dive ignores the orbit today and
  keeps ignoring it; the drowned pit's own motion is settled and is not
  reopened here.
- **The rift's growth and its bargain are unchanged.** No ladder, no new sink,
  nothing bought — the disc still grows only by being fed. See the pit's arc.

### The numbers, to tune against a shot

One constant for the turns of the whole fall (`RIFT_TURNS` is 2.4 and wants to
be nearer 4 once the turning is where the eye can see it), one for how long a
grain takes to fall, and the sprite's own streak count, length and turn — every
one already exists in `config/rift.js` or `config/effects.js`, so this adds a
law and takes tuning away rather than the other way round. The `rift` and
`grown` scenes in tools/look.mjs are the eyes on it.

### Built (2026-09-06)

`riftFall(from, u)` in rift.js is the law: the radius comes in at a steady
rate and the angle is the log of how far in it has come, normalized so a whole
fall spends `RIFT_TURNS` (now 4) and a thing joining nearer the rim spends
proportionally fewer. `orbit()` in game.js and the streaks in `drawRift` both
read it, and `riftEntry` in pit.js stamps every grain with the angle and radius
it actually went in at — so `orbit`'s quarter-life lerp onto a curve it was not
on is gone, along with the two exponents that made it necessary.

The hauler aims at the disc rather than across the hole while the rift is open
and the pit has not drowned, with a little scatter so grains do not go in
single file. The speckle turns one way and sits on whole pixels rather than
whole cells; the lens keeps one angular harmonic. Streaks are five, capped by
**turns** rather than by length — the spiral tightens, so a fixed length is a
short arc at the rim and a three-wrap coil near the middle.

Two things fell out of building it that the design did not foresee:

- **A streak's cell spacing has to be derived, not written down.** The law lays
  down the same arc length for every equal step of `u` anywhere on the spiral
  (the steady radius and the log angle cancel exactly), so one step size spaces
  the cells evenly the whole way in — but that size depends on the disc's
  radius, and the disc grows from four cells to twelve. Written down, it was a
  dotted line at one size and a doubled smear at another. `drawRift` works it
  out from `rad`.
- **Only about a turn and a half of the spiral is ever visible**, the rest
  being behind the disc. Twelve streaks of half a turn each is three times more
  ink than there is track to carry it, and they close into solid rings.

Covered by `test/drain.test.mjs` (3/3) — the law's shape, that a grain is
stamped with where it really went in, and that it comes in the whole way rather
than hanging and dropping — with `rift`, `pit` and `pit-arc` green alongside.
Whether it *looks* right is a shot: the `grown` scene.

## The rift pulls (built)

There is no drawn swirl anywhere near the hole any more. The rift has weight,
everything near it is given the pull, and what each thing does about it is its
own business.

**Grains.** `orbit` in game.js: an inverse square toward the middle, quoted at
one disc radius so it follows the disc as it grows; the grain's own speed
carries it; a little is shed each frame (`RIFT_DRAG`) so nothing circles for
ever; inside `RIFT_EAT` it is gone. A grain a hauler threw arrives with the arc
still on it — `riftCatch` keeps the chip's velocity — and swings round the hole
before it goes. A grain lifted off the pile was lying still and drops straight
in. Neither is drawn, and the difference between them is the whole point.

**The sky's dust.** `intoTheRift` in air.js: the same pull, added to the mote's
own speed rather than to its position, through the `sx, sy` pair the cursor's
draught already uses — which decays, so orbits lose energy and come in instead
of circling, and a mote that escapes carries its swing back out into the sky.
The field turns because the wind is carrying it sideways past something heavy,
not because anything told it to turn.

### What this replaced, and why

Two scripts, both of which moved a thing the same way whatever it had been
doing:

- a **law of infall** (`riftFall`, the section above) — a logarithmic spiral
  every grain was pinned to, the same turns for a grain dropped at rest as for
  one flung past at speed;
- **`RIFT_SPIN`** — a fixed share of the air's pull pushed sideways, to make a
  vortex out of a shove.

Both looked like physics and neither was. Gravity costs the same arithmetic and
is the real thing, and it is the rule the yard already runs on everywhere else:
a number that changes without a cause you can watch is the one thing this game
does not do.

### What it must not break

- **The count is not touched.** `throughRift` books every grain exactly as it
  did; this is how a grain moves, not whether it is banked.
- **Everything is still eaten.** The drag guarantees it — an orbit decays — and
  `RIFT_EAT` is a mouth rather than a point, so nothing circles out of reach.
  `RIFT_VMAX` holds the speed near the middle, where a true square would fling
  a grain across the yard in a single frame.
- **The drowning is untouched.** The abyss's dive never read the old law and
  does not read this one.

Covered by `test/drain.test.mjs` (3/3): a grain at rest falls straight, the
same grain given a sideways clip swings instead, and a thrown grain keeps the
speed it arrived with. Those are the checks the old law would have failed.
## Seeing the wind (built, except the gust front)

There is one wind. `wind.js` says so in its first line and it is right: the haze, the grit, the
smoke, the balloon and — since the flag pass — the flags all lean on one signed number, and that
shared motion is the whole of what makes a field of dots read as weather rather than as insects.

The complaint that opened this is that **you cannot see it**. The flags were the only thing in the
yard visibly moved by the wind, and because they were the only thing, they had to carry the whole
impression on their own — which is exactly why they read as a gale. Calming them fixed the
overstatement, and left the understatement behind it: a yard where a strong gust and a dead calm
look the same everywhere except on four small pennants.

So this is not "add motes". There are already 95 to 420 of them, in three parallax bands, and every
one already takes `wind()`. They just do not *say* anything about it. The design is about making the
wind legible in the air that is already there, and it is two changes.

### 1. A mote's shape says how hard it is blowing

A mote is drawn as a square of its band's size, and a square has no direction in it. Whatever the
wind is doing, the field looks the same; only its slow sideways creep differs, at `AIR_LEAN` = 0.34
screen pixels a frame — about twenty a second at full wind, which over a mote three pixels wide is
below the speed at which the eye reads motion as *being blown* rather than as drifting.

Instead: **a mote elongates along the wind as the wind rises.** At calm it is the square it is now.
At full lean it is drawn two or three cells long and one high — a dash lying the way the air is
going. Between, it is between; and because `wind()` is signed, the dash leans the way the wind
actually blows, so the whole field turns over together when the gust comes about. The near band
stretches most and the far band least, on the same one number that already settles a band's size,
pace and pallor, so nothing new has to be decided per band.

This is the cheap half and it is most of the effect. It adds no motes, no state, no field and no
save key: it is one rule inside the mote's own draw, reading a number that is already in hand. It is
also the reason to prefer it over spawning a new "wind mote" kind — a second field of specks whose
only job is to say *wind* would be a second account of the air, and this codebase has paid for
second accounts of one thing several times now.

A grain of care: the dash must stay on the cell lattice and stay whole pixels, or it puts the
hairline through the picture that everything else here is arranged to avoid. And the far band is one
pixel; it cannot elongate without becoming the near band's weight, so the far band keeps its square
and the effect lives in the two nearer ones. That is not a special case — it is the same
"how far off is it" number saying, correctly, that you cannot see the shape of a speck at that
distance.

### 2. The wind is a front that crosses the yard, not a clock that ticks everywhere at once

`windAt(t)` takes only time, so every mote and every flag in the yard turns at the same instant. Over
a yard this wide that is subtly wrong, and it costs the one thing that would make a gust legible as
an *event*: you cannot watch it arrive.

Make the field spatial: `windAt(t, x)`, the same two swings with a phase that runs with `x`, so the
gust is a wave crossing the yard at a speed you could measure. Then the dust over the quarry leans
before the dust over the rock; the school's flag comes about a moment before the tower's; and a
strong gust reads as something that *travels*, which is what makes weather feel like it is happening
to a place rather than being a property of the clock.

The flag's own field had exactly this (`FLAG_GUST_SPAN`) and I deleted it in the pass that put the
flags on `wind()`. Deleting it was right and keeping the idea is also right: it was a good idea in
the wrong module. One flag-private spatial wind is two skies; one spatial wind in `wind.js` is one
sky with weather in it.

**The cost, stated plainly, because it is the part worth arguing about:** every caller of `windAt`
has to have an `x` to pass. The mote fields and the smog vents have one. The balloon has one.
`report.js` does not obviously want one, and a default (the camera's middle) is the kind of guessed
constant this codebase treats as a future bug. If that default cannot be made honest, this half is
worth dropping and the first half stands on its own — it is the one carrying the effect.

### What building it turned up that the design had not

**The wind almost never reaches its own peak, so calibrating against the peak
calibrates against nothing.** The first pass set the speed so that a full gust
was brisk, took a shot, and got a field barely faster than before. Sampled over
fifty minutes, the median of `|gust|` is 0.24 and the ninetieth percentile 0.60
-- the lull envelope keeps it away from 1 nearly all the time. The numbers are
set against that distribution now: a typical breeze carries a near mote about
25 screen pixels a second, a strong one 62, and the rare peak 92. The lesson
generalizes past this feature: any constant tuned against a field's extreme is
tuned against a case the player almost never sees.

**The bend had to be gentler than it looked.** A power of 1.6 made the quiet so
quiet that half the time nothing moved at all, which trades one unreadable
state for another. It is 1.3.

**The haze needed its ink taken down exactly as far as the speck goes wide,**
and this is the part that mattered most and was not foreseen at all. A gust does
not make more muck; it spreads the muck that is there. Without the compensation,
every speck drawn three cells wider laid down three times the ink and the whole
band darkened whenever it blew -- and how dark the band is, is how filthy the
yard is, a reading the player is meant to act on. A weather effect that moved
that reading would have been lying about the game's state. Measured on the same
scene, same seed, same clock, main against the branch: the sky's mean ink moved
by four thousandths of a level out of 255, which is nothing.

**`const gust` was already a local in `smog/sky.js`,** and it shadowed the new
import for the whole of `place()` -- a temporal-dead-zone error at the first
frame, from a name collision rather than anything about the design. Renamed to
`lift`, which is what it was for.

### What this deliberately does not do

- **No new mote kind.** "More motes to show the wind" is the obvious reading of the ask and I think
  it is the wrong one: the field is already dense, and doubling it costs frame time on a yard that
  has a measured budget, to say a thing that shaping the existing motes says better.
- **No new sink, no new number to buy.** The wind is not a resource and must not become one.
- **Nothing that makes the sky beatable.** This is drawing only; it does not touch how the sky
  fouls or clears, which is a decided question.

### How it would be checked

Both halves are drawing, so no test in either tier can see them and a green suite would prove
nothing. The check is a shot: a `gust` scene in `tools/look.mjs` seeded so the clock lands on a
strong lean, and its opposite a few seconds later, with the camera wide enough to hold the dust, a
flag and the smoke in one frame. If the three do not lean together, that is the bug, and it is
visible in one picture.

## The bench is a catch-all, and the lab is its multiplier column (design, not built)

The bench is thirty-two rows under fifteen headings and stands about 1,600 px tall on a window
that is often 700; boards do not scroll on desktop, so the foot of it is simply off the top of the
screen. But length is the symptom. The bench is the only board in the game that is not *about*
anywhere: it sells your own gear, the crew's gear, the rock's ladders, the shields, the build
yard's ladders, and ten buildings that do not exist yet. A board that is about everywhere is a
board you search rather than read.

The rule that fixes it is already written down, at the janitor's closet:

> the same reason the lab's and the school's rows left the bench: a decision about a place is made
> at the place. This one cannot be, because the place is what it buys.

So the question is only which rows still have a place to go.

**What moves.** The crew's six rows — strength, speed, harness, boots, the belt, tune the belt —
go to the houses, where the crew live and where the board already stands. The build yard's `posts`
and `pace` went to the construction bench, which is already a registered site and only wants a
board — and then the construction bench was scrapped and both ladders with it, so that half of
this is moot. `build the bench` itself stays, by the rule above.

**What does not, and why that is not a failure.** `you` has no station because you are the cursor.
The shields stand in the yard but are not buildings you walk up to. And the rock's rows stay, which
is the one that looks wrong and is not: **the bench is the rock's board.** It stands on the ground
off the rock's left flank, sixty pixels clear on either side, and the biggest rock in the game is
measured off it. Giving the rock a board of its own would mean opening a sheet on the one thing in
this game you click constantly — and a press on the yard puts an open board away, so it would close
itself on every swing.

> **Superseded, this paragraph only.** See "The shack at the rock" at the end of this file: the
> rock gets a hut a few cells off its flank, and the door you press is the hut's rather than the
> rock's. The rest of this section stands.

**The ten unlock rows lose their headings, not their place.** Ten headings each carrying a single
`build the X` is about 600 px spent on a table of contents. They become one group, `put up`, where
the building's name is the row; a heading over one row was never telling you anything the row did
not.

That leaves the bench at twenty-five rows under five headings — your gear, the rock, and what you
can put up — and it is a board about something again.

### The lab goes

The lab's bargain is stated in its own section above: it sells *faster* where the bench sells
*more*, and it is "the only place a multiplier lives". That is the whole building. The multipliers
are not rows the lab happens to hold, they are what the lab is — so moving them out and keeping the
room was never one of the options on offer. It is delete or don't.

Delete. Each multiplier goes to the station it multiplies and sits directly under the ladder it
multiplies: `swing ×` under the rock on the bench, `speed ×` under the crew at the houses, under
the quarry at the quarry, under the farm at the farm. Three boards selling a row called *speed* for
the crew, under a heading called *the crew*, is a comparison the player has to hold in their head
across a walk. Under one heading it is a comparison you can see.

**The time cost survives the building, and this is why deleting it is cheap.** `works.js` already
drives both:

```
registerSite('lab',  { room: labRooms, effort: labPace, started: () => begin() });
registerSite('yard', { room: () => (S.buildbenchOpen ? buildPosts() + 1 : 1) });
```

(The yard's line is the shape it had while the construction bench stood. The bench is gone and
the yard takes the default room of one again, which is what it had before — the argument below is
unaffected either way.)

Both run through `handsAt(site) * effortAt(site)`. Research and building are one mechanic
implemented twice under two worker names, and the lab's `instruments` and `another bench` are
`pace` and `posts` with different labels. So buying a multiplier still starts a piece of work that
bodies have to stand and finish; it is a build, done by builders, through the machinery that
already exists. The decision the lab was there to create — a multiplier that costs you bodies off
the rock rather than a number you simply buy — is kept intact. What goes is the second
implementation of it.

The scholar job, the lab room, the chimney and the finished-work tick go with the building.
`watch the sky` is deleted outright rather than rehomed: it is a one-shot spore unlock for a
readout that never earned its row.

### What this costs, said plainly

**Builders become the only bottleneck on everything that takes time.** Every timed purchase in the
game now queues at one bench with one ladder, where there used to be two. That makes `posts` and
`pace` much more load-bearing than they were, and it is a balance question rather than a layout
one — it wants the tuning pass, not just the move.

**Old saves carry a lab.** `labOpen`, `labRooms`, `labKitLevel` and the scholar assignments all
need a migration that lands their levels on the rows that inherit them, or a player who has bought
the lab out loses what they bought.

**The yard loses a building and a worker type**, which is a smaller world. The case for it is that
the building was a second name for a mechanic the yard already had, and the worker type was a
second name for a builder.

### The one wording call left

A station now shows a base rung and its multiplier on the same sheet, and they cannot both be
called *speed* — the rule is one word one meaning, and these are two different things about the
same rate. The proposal is `speed ×`, which reads as what it is and needs no explaining; it does
add a character to the boards' alphabet, which is the reason to say it out loud rather than assume
it.

### A row becomes a card

Two lines inside a one-pixel edge, two across the sheet: the name and what it costs on top, what it
gives and how far up the ladder underneath.

**The bill and the pips have swapped corners since, and the title wraps.** As first built the name
took the whole top line with the bill under it, which meant a title of three words pushed the price
down — the card grew a line for the sake of the name, and the price stopped sitting where the eye
had learned to find it. The price is the answer to the question you open a board to ask, so it holds
the top-right corner; how far up a ladder you have got is a glance, and a glance is happy at the far
corner. A title with no room left takes a second line instead, which is what a title can afford to
do and a bill cannot. Making that possible needed a ceiling over the sheet — it was shrink-to-fit
with nothing above it and answered "no room" by getting wider, right off the side of the window.

**Three lines now, the same three on every card (2026-09-12).** The swap above bought the price its
corner at the cost of everything else: the name and the bill are the two widest things on a card,
and a grid's columns are shared down every row, so a four-coin bill on the first line starved the
gain on the second, the name beside it wrapped for a bill it was not even next to, a card with no
gain came out a line shorter than its neighbor, and the pips sat wherever the row's height left
them. Read across the bench it was five shapes of card. So the card is three lines: the name on the
first, the whole width; what it gives on the second, the whole width; the pips at the left of the
third and the bill hard right on it, and that line is the card's bottom edge whatever the card
beside it did. Nothing shares a line with words but a run of pips, which is never wider than a few
characters. A title wraps only when it is longer than the card, which none of them is. A job row and
a dial take the same three lines with their control where the bill would be, so a board of mixed
rows is one shape. The cost is a line a card — the bench is about a quarter taller — and it was
weighed against the two-line shape with the pips beside the title and the gain beside the bill, in a
shot, and lost to it on the one card whose gain still wrapped. A note under a row is a fourth line,
between the gain and the bill, and is still the one thing that makes a card taller than its
neighbor.

**The measurement came first, and it changed the answer twice.** Read off a real page — every board
open, every building up, the ink in each cell measured with a Range, because a cell is a grid track
and its own rect is the column width — **every bill in the game carries a clock, all thirty-two of
them**, and with the clock counted apart **88% of bills are one or two currencies**. Only four rows
cost three or more, and they are exactly the four machines. So time is not an occasional coin to be
squeezed in beside the money; it is on every row, which makes it a column by definition rather than
a special case. That is what makes one line a row possible at all, and it is why the widest sheet
in the game comes to 475 px against the 440 it already renders — the width this was feared to cost
is thirty-five pixels.

**The new-card mark is made of the card, and it comes off one card at a time.** It was a dot hung
nine pixels off the left of the title — right while rows were names in one shared column with no
boxes around them, because the mark stood in the margin that column left. On a card that margin is
the card's own border, and the dot read as a blemish on the box. A turned-down corner is made of the
card instead: it takes no room from the title, so nothing re-wraps when a card stops being new, and
it is the same ink as the words, so it inverts under the cursor and pales with a card you cannot
pay for. What clears it changed with it. Closing the board used to clear every mark on it, which
says *it was on the screen* when the question is *did you read it* — on a board of a dozen, the one
row you came for is the one you looked at, and clearing the rest throws away the answer to "what is
new here" for every card you scrolled past. Hovering is the cheapest true evidence the page has that
a card was read, so hovering is what clears it; a press does too, because a finger cannot hover.

**And a card is the right shape because the rows are independent.** The argument for the shared
subgrid was that it lets the page be *scanned* — which is what this file has always claimed, and it
is true. It was never that rows are compared with one another: a rung inside a row is sequential,
with no choice in it, and two rows under one heading are separate purchases with different effects.
The only thing weighed across rows is the price. A subgrid asserts that its rows are a series to be
read as a column; independent things do not need that, and the card's edge says the truer thing —
this is one whole item. Scanning survives, because the names still line up in two columns.

**Every state holds, and two of them are better than the row managed.** The stepper on a job row and
the picker on a dial both sit in the cell a bill would fill, which is the same trick that let those
rows share a grid with price rows in the first place. A build in progress wears its bar on the
card's own bottom edge rather than growing a line to hold one — a row had nowhere to put that. And a
finished card kept on the board reads as a ladder you have climbed rather than as dead space, which
is a small argument against folding finished rows away by default.

**What it costs, plainly.** The bench comes to about 700 px against roughly 500 for the same rows as
a plain one-line list in one column. Cards give back most of what collapsing the ten unlock headings
won. That is the price of the look and it is worth being deliberate about rather than discovering
later.

**Left open:** whether twenty-five one-pixel edges read busy at full size. The alternative is no
border at all — the grid gaps and a hairline doing the same work — and it is a thing to look at in a
shot rather than argue about here.

### How it would be checked

Most of this is rows moving between boards, which both tiers can see. Each station that inherits a
multiplier gets a check that buys it **the player's way** — through the shop row at that station,
not through a `__` hook — and asserts the work starts, a builder walks to it, and the rate moves
only once the work is finished. The bench gets a check that its section list is the five it should
be. The save migration gets a fixture: a save with a bought-out lab in `test/fixtures/`, loaded,
with a check that the levels landed on the inheriting rows. The boards' own look is a shot, not a
suite.

## The one bench carries two ladders' worth of waiting (design, not built)

"The lab is deleted" named this as a real blocker rather than a detail: once every timed purchase
in the game — every building, both machines, all four multiplier ladders, and the bench's own kit
rows (`carry`, `auto`, ...) — queues through one site (`SITE_JOB.yard === SITE_JOB.bench ===
JOB.BUILD`), `buildposts` and `buildpace` are carrying weight that used to be split across the
lab's `instruments` and `another bench` on one side and the bench's own ladders on the other. This
section is the measurement that was promised, not a redesign.

### What was measured

`node tools/node/yard.mjs`, driven by hand: bench opened, `buildPostLevel` and `buildPaceLevel`
set directly, builders assigned through `__assign` (the player's button), and a representative
backlog queued through `__buy` the way a player would press the rows. The backlog is the eight
one-off buildings plus both machines plus all four multiplier ladders run to their cap —
everything that would ever compete for the bench's room in one run:

```
buildings (8 x 45)                                           360 worker-seconds
machines  (2 x 90)                                            180 worker-seconds
4 mult ladders, 5 rungs each, LAB_WORK=45 x 1.35^level      1,792 worker-seconds
                                                             -----
representative backlog                                      2,332 worker-seconds
```

`buildposts` tops out at 3 slots (`BUILD_POST_RUNGS = 2`), `buildpace` at x2.46
(`BUILD_PACE_RUNGS = 3`, `1.35^3`). At the very top of both ladders, with three builders assigned
(matching the three slots — a fourth or fifth body assigned is clamped straight back down by
`rebalance`, so posts is a hard cap on builder headcount as well as concurrency):

- **A single work with no competition costs almost exactly what the math says.** The school,
  alone, at max pace, took 20 game-seconds against a predicted 45 / 2.46 = 18.3. The formula is
  right and the one-body case is healthy.
- **The full backlog — all four multiplier ladders plus every building open at once, the shape the
  yard is actually in once the bench and a few stations are up — did not finish in 2,000
  game-seconds**, over half an hour against a 90–120 minute run, at maxed posts and pace. Lower
  configurations (posts=0/pace=0; posts maxed/pace 0; posts 0/pace maxed) all hit the same ceiling
  worse.
- **Measured utilization at the top of both ladders: builders were doing useful work at the yard
  about 37% of the time** — three bodies assigned, three slots open, three or four distinct works
  queued. That is the finding that changes the shape of the fix. Raw effort math
  (2,332 / (3 x 2.46) ≈ 315s) says the backlog should clear in about five minutes; measured, it
  does not clear in half an hour. The gap is not the ladders' own numbers — it is time builders
  spend not attached to any work while several are queued at once, which the solo-work case never
  exercises. This was not root-caused further (candidate causes not yet distinguished: walking
  between the yard's scattered site coordinates, `slotFor`'s per-frame reassignment, or the
  `each`/`own` split in `stepWorks` under-crediting a body mid-transition) and is flagged rather
  than guessed at.

### What this means for `buildposts` and `buildpace`

**Retuning the two ladders' price or step is not obviously the fix, and might be the wrong fix
entirely.** The measured shortfall is roughly 4x (half an hour observed against five minutes
predicted from the ladders' own numbers), and it shows up precisely when several works are queued
together, not in the one-body case the ladders were presumably tuned against. Cutting
`buildpace`'s price or raising its cap moves the effort-math prediction, which is not the number
that is wrong. If the gap is a body spending most of a queued build walking rather than swinging,
no amount of `buildpace` fixes that — a builder who is faster *while working* and idle two-thirds
of the time is still idle two-thirds of the time.

**The honest next step is root-causing the 37%, not re-costing the ladders.** Candidates, in the
order they are cheapest to rule out:

1. Instrument `handsAt('yard')` per frame against `S.workers` positions for the three assigned
   builders, across one run of the representative backlog, and see whether the gap is walking
   (bodies in transit), reassignment thrash (`slotFor` moving a body off a work it just reached),
   or something in `stepWorks`'s own accounting.
2. If it is walking: the sites a builder is asked to cover at once (the school, the tower, the
   mult ladders' `siteX` fallback, which for a multiplier row with no station box centers on
   `S.cx`) may simply be far enough apart that three builders queued on four to eight scattered
   targets spend more time in transit than any pace number can buy back — which would make this a
   placement question (how far apart builder-manned sites stand) rather than a ladder-pricing one.
3. Only once the mechanism is known does re-pricing `buildposts` / `buildpace` — or adding a rung
   to either — become a number to argue about rather than a guess.

### What is NOT proposed here

No change to `BUILD_POST_RUNGS`, `BUILD_PACE_RUNGS`, `BUILDPOSTS_SPARKS0`, `BUILDPACE_SPORES0`,
`BUILD_PACE_STEP` or `WORK_STEP` is proposed in this section. Guessing a new number against a
mechanism that has not been found would be exactly the kind of tuned-constant bug CLAUDE.md warns
against — a constant right about today's content and wrong the moment a ninth building or a fifth
mult ladder is added. The measurement says there is real debt; it does not yet say which file owns
the fix.

### How it would be checked

A node-tier check belongs in `test/wave7b-build.test.mjs` or a new `test/build-throughput.test.mjs`
once the mechanism is known: bought through `__buy`/`__assign` the way a player reaches it,
asserting utilization at the bench stays above some floor once several works are queued together (a
regression guard, not a balance target by itself). Until the mechanism is found, a check would only
pin down today's number rather than the cause.

## A board has a size (built)

The complaint: *the shop menus shift layout way too often. Things are constantly
changing, disabling because no worker is available, new text showing up and
causing shifts.*

Measured on the bench board, headless, a frame at a time.

| what happens | what the sheet does |
|---|---|
| a card's status line reads `busy: the next bench` | 525 → 529 px wide |
| ...naming two works | 525 → **731** px |
| ...naming three | 525 → **1167** px |
| a row arrives when something unlocks | 363×350 → **525×481** |
| the status line swaps `building` / `on the way` / `nobody on it` | no change |
| a section badge appears | no change |

So the card height is fine and the badge is fine. Two things move the board, and
they are both the same defect wearing different clothes: **the board has no size
of its own.** It is whatever its content measures this frame, `remeasure` reads
that back, and `place` re-seats the panel by it -- so any word that arrives
anywhere on the sheet walks the whole board sideways, taking every row out from
under the cursor.

The rule this design asserts:

> **Nothing a board *says* may change the size of the board. Only what a board
> *holds* may.**

A row arriving is a change to what the board holds, and the board is allowed to
grow for it. A card telling you the cut is busy is a thing the board is saying,
and it must fit in the board that already stands there.

### 1. The sheet is `nowrap`, and that is the mechanism

`.panel .sheet` sets `white-space: nowrap`. Two things already opt back out of
it -- `.rows button .cost`, so a three-coin bill wraps inside its own cell, and
`.rows .note`, so a description wraps as prose. Both of those opt-outs were
written for exactly this bug, one card at a time.

`.rows button .gain` did not opt out, and `.gain` is the cell `refresh` writes
every transient status into: `building`, `on the way`, `nobody on it`, and
`busy: <every work at this site, by name>`. That last one has no bound on its
length -- it is a join over `worksAt(u.site)` -- so one card can demand any width
it likes and the sheet hands it over.

Patching `.gain` the way `.cost` and `.note` were patched would be the third
per-cell exception in the same file for the same reason, which is the shape of
bug this codebase has a rule about. The mechanism is that **the sheet takes its
width from its longest line**, and the fix is to stop it doing that at all.

### 2. The sheet's width is measured from the rows, once, and pinned

After `build` changes the row set -- and only then -- the sheet is measured and
that width is set on it explicitly, for as long as that row set stands. The
number is measured, never guessed: it is what the browser makes of the rows that
are actually there, which is the same reading `max-content` gives today, taken
once instead of continuously.

With a pinned width, every cell inside is laid out against a box that does not
move. `refresh` can write anything it likes into a `.gain` and the board stays
where it is. `remeasure` stops being a thing that fires on words -- `boardReworded`
survives only for the height, which nothing in the measurements above moves.

A row set changing still resizes the board, which is right: the board holds
something new. It happens on a purchase or an unlock, which is a moment the
player caused and is watching.

### 3. `show()` must be monotonic until the row is consumed

A row may leave a board because you bought it or finished it. A row may not
leave because a number dipped, a machine stopped, or a hand is in play -- that is
the board rearranging itself behind you over something you did not do.

Surveyed, one predicate in the game does the second thing, and it is on the
board you spend the most time reading:

| where | predicate | what makes it flip back |
|---|---|---|
| `rows-farm.js` | `nearly(FARM_DUST)` | `S.stored` falls whenever you spend, on anything, anywhere |

Two others looked like it and are not. `rows-scrub.js` reads
`MACHINES.some(m => running(m.key))`, and `running` turns out to be nothing but
`bought` -- a machine is stopped by taking its tender off, which does not unbuy
it -- so that gate only ever goes one way. The casino's four table rows carry
`!busy() && !S.paying`, and a table that changes between hands is a table; those
rows come and go because you staked, which is a thing you did.

So `show` splits in two:

- **`once`** -- what reveals the row. Asked only until it is true, and then
  never again.
- **`show`** -- whether the row has been consumed. That is the one reason a row
  is allowed to leave a board, and it is what every `show` in the game is
  already mostly about (`!S.farmOpen`, `!S.scrubOpen`, `level < RUNGS`).

The latch is `revealed` in shop.js over a new `S.shownRows` (SAVED, beside
`S.seenRows`), and every board goes through it -- so the rule is enforced for a
row written tomorrow, not just for the one row that broke it today. A row with
no `once` is untouched.

The check is the more important half of this, because the survey above will go
stale: `test/boards.test.mjs` counts the rows on every board with the yard rich,
dirty and raining, then spends the purse and cleans the yard and counts again.
Nothing it does is a purchase, so nothing has been consumed and nothing has any
business leaving. Written against `__rows`, which asks the same gate a board
does, it catches the next two-way `show` without anybody adding a key to a list.

### An over-long status, in a box that cannot grow: written short

With the width pinned, `busy: break the ground, put up the school, the next
furrow` no longer fits the card, and a truncation is a sentence with its end cut
off rather than a fact. So the vocabulary is closed instead, and every word in
it fits by construction: **`busy`**, **`busy (n)`**, `building`, `on the way`,
`nobody on it`. The longest of those measures 101 pixels, and the widest gain
any row prints is 59, so this cell can no longer be the widest line on a sheet
whatever it is asked to say.

The cell it lands in had to be widened to take even that. The gain column is
`1fr` against the bill's `auto`, so a card with a wide bill leaves it very
little: measured across every board, five cards had a gain column narrower than
`nobody on it` -- 82 pixels on the crew's `labhaul`. Widening the column on all
of them would have moved every bill in the game. But a status is a fact about the
card rather than an entry in that column, and the cell beside it on that row is
empty, so while one is up it simply takes the line (`.waiting` in style.css).
Nothing moves for it, and the tightest cell a status can now land in holds 102
against the 101 it needs. That margin is one pixel, which is why it is held by a
check that tries every word against every card on every board rather than by
this paragraph.

The count is the part worth having on the face of the card in any case: how many
works are ahead of yours is the thing you would act on. *Which* ones they are
goes in the row's tooltip, which hangs over the board and cannot move it -- not
in the note line, which is prose that wraps, and would have traded a width that
moves for a height that does.

### Checks (built)

- `test/boards.test.mjs`, *a row that has been revealed stays revealed*: count
  the rows on every board with the yard rich, dirty and raining, then spend the
  purse and clean the yard and count again. Over `__rows()`, so a two-way `show`
  written tomorrow is caught without a list of keys in here. Verified to bite:
  with the farm's `once` folded back into its `show`, it names `unlockfarm`.
- `src/selftest/boards.js`, *a board holds its size while a build is running*:
  press a build row through the DOM, walk back up to the board, and sample the
  sheet's size on every frame the build runs. Then write a line nobody would
  write straight into a gain cell and measure again -- because the short
  vocabulary alone passes the first half, and it is `pinWidth` that has to hold
  the second. Verified to bite: without the pin the sheet goes 525 -> 1167.
  The same group tries every word in the vocabulary against every card on every
  board and fails on any that would spill -- which is what holds the one-pixel
  margin the `.waiting` rule buys.

This is the page tier for both halves of the size question, because a sheet's
width is a fact about layout and there is nothing in the yard that knows it.
## The sound of the yard (built)

*Built 2026-09-12 (docs/wave-desk-sound.md, track B): `src/audio.js`, `src/config/sound.js`,
`test/sound.test.mjs`, the `#sound` switch on the held sheet. The three open questions at the end
of this section were decided in the wave document, and are copied here so the section reads
whole: **(1) music** -- (c), the sky is the only score: no drone, no music; the air and water beds
swell and recede with the weather and that is the whole arc. **(2) default** -- on, and quiet,
`SND_MASTER = 0.18`; the mute remembers through `prefs.js`'s `muted`, a preference rather than a
state.js field, so it survives a reset and does not travel with a save. **(3) the tower and the
rift** -- the rift is the one exception, two low sines beating; the tower is silent, and nothing
else ever gets a pitched or sustained voice. Amendments the build made: a fold window's sound is
*decided* when the window opens (that is when the counters move) and *emitted* when it closes, so
everything inside the window is in it; `byClass` counts what the yard asked for and `firedBy` what
got through; punctuation has a ceiling of its own (`SND_PUNCT_PER_S`), a guard against a burst
nobody designed rather than a balance number; the machines' hum counts a machine while a tender is
in reach (`mannedAt`, the belt's own reading), not while it is merely bought; the "one-pole"
lowpass is a biquad at a low Q, which is the nearest thing Web Audio has; and the sound's knobs
sit beside `TUNABLE` on the dev panel rather than in it, because `config.js` was additive-only
that wave. None of it has been listened to yet -- the node tier holds the decisions, and the ear
is the next pass.*


The seed for this was one line under "Open questions": soft ticks on a hit, a low tone when a core
banks, optional, off by default. That is a list of two sounds, and a list of sounds is exactly the
wrong thing to write down first. The visual side of this game is not held together by a list of
sprites — it is held together by *black and white, flat shapes, everything on the P = 6 grid*, and
every sprite anybody has drawn since has been drawn to that. The audio needs its own sentence of
that kind before it needs a single oscillator, because a hundred individually pleasant noises with
no rule behind them is what a bad idle game sounds like.

### The law

> **You hear the yard, not the game. Everything is struck, and nothing is played.**

Two clauses, and each one throws work out.

**You hear the yard, not the game** is the audio of *nothing teleports*. The yard is a works with
people in it; sound is the evidence of material being moved by a body. So a sound exists when and
only when something physically happened somewhere you could have been looking: a pick meets stone,
a load lands on the belt, rain arrives, a building comes down onto its footprint. The corollary is
the useful half — **if a number changes and no body caused it, it makes no sound.** Dust ticking up
is silent. A price going green is silent. A row unlocking in the shop is silent. The shop opening,
closing, scrolling, hovering: silent. There is no UI chrome in this soundscape, no confirmation
blip, no menu whoosh, no reward jingle, because none of those things are events in the yard — they
are events in a spreadsheet with a picture on top, and the whole game is an argument against being
that. The one place this bites, and it is worth accepting: **buying something is silent at the
moment you press.** You hear it when the builders start swinging, which is when it actually
happened.

**Everything is struck, and nothing is played** is the audio of *flat shapes, six greys*. Every
voice in the game is a short percussive event or a slow bed of moving air. Nothing is pitched into
a scale, nothing plays a melody, nothing arpeggiates, nothing swells to announce itself. There is
no key and there is no tempo, so nothing can ever be *out* of key or off the beat — which is the
property that lets a soundscape run for two hours without turning into a tune you are sick of. The
sonic reading of the six-grey palette is a narrow band: **nothing bright, nothing long.** No content
much above 5 kHz, because high frequency is what wears an ear out over an hour, and this is a game
about grey rock under an overcast sky, not a game about glass. Nothing rings longer than a footstep
unless it is a bed.

Held together, those two clauses settle most of what would otherwise be argued one sound at a time.

### The palette: six voices, one set of parts

A yard sounds like *a place* rather than a folder of effects because everything in it is heard
through the same room and made of the same handful of materials. So the palette is not six sound
designs. It is one signal chain, built once, with six settings.

**The shared DNA.** One noise buffer generated at boot — a few seconds, pinkish, filled from the
game's own `rand()`, so a seeded run has a seeded soundtrack — and one sine. Every one-shot in the
game is `source (noise or sine) → bandpass → gain envelope → the yard bus`. What separates stone
from metal is center frequency, bandwidth and decay length; not a different technique, and certainly
not a different sample pack. Everything sits around one low center — call it the yard's note, a
frequency rather than a pitch — so that fifty unrelated events in one second still sound like fifty
things happening in one room.

| voice | what it is | how it is made |
|---|---|---|
| **stone** | the pick, the crack, a grain landing, the boulder | low-Q bandpass noise, center low, 40–90 ms decay; the big ones get a sine thump underneath that tunes down as it goes |
| **wood** | boards, sheds, the bench, a hatch | narrower band, higher center, faster decay, one weak second resonance so it reads as hollow |
| **metal** | the ram, the belt, a machine's beat | two slightly detuned bandpasses and a longer ring — still dull. Never a bell and never a chime; a bell is a tune with one note in it |
| **water** | rain, the drowned pit | broadband noise under a slowly wandering lowpass. No transients at all: rain here is not a sequence of drops, it is a band that opens |
| **air** | wind, the sky, the smog band | the same noise with the cutoff far lower, its cutoff and gain driven straight off `gust()` and `give()` in wind.js — so **the wind you can see is the wind you can hear**, one source of truth, the way the sky band already works |
| **the rift** | the tear, the pull, the abyss | the only voice that is not struck: two very low sines, detuned a few cents, beating slowly against each other. That beat *is* the flowing interference the pit already draws. Never a whoosh, never a riser |

Six voices. If a new station cannot be built out of one of them, that is a question about the
station, not a request for a seventh voice — the same way a new sprite does not get a seventh grey.

### Density: what always sounds, what is folded, what is a bed

This is the part that decides whether the game is bearable at minute ninety, and it is where idle
games with bad audio actually go wrong. The failure is never a bad sound. It is a fine sound played
four hundred times.

**Four classes, and every event in the game belongs to exactly one.**

1. **Always — the player's own hand.** The click on the rock. Never throttled, never stolen by the
   voice cap, never ducked. It is the one event the player caused directly and it is allowed to be
   the clearest thing in the mix. It carries the information the click already has: harder rock is
   lower and duller, a crit is the same voice with more body under it, breaking through a layer
   moves the band. Not louder — *different*. A reward that is merely louder is the slot machine
   this game has spent five thousand lines refusing to be.

2. **Folded — everything the yard does in quantity.** Grains landing, footsteps, the belt's loads, a
   machine's per-beat tick, dust going into the hole. The rule is one line and it is the whole of
   the discipline here: **a handful of gravel is one sound, not forty.** Each class holds a short
   window, of the order of 60–100 ms; events arriving inside a window neither queue nor each fire —
   they fold into the single sound that window will emit, making it a little louder and a little
   wider in the band. Past that, each class has a hard rate ceiling per second, and events over the
   ceiling are *dropped*, not deferred. A ceiling that defers is a ceiling that runs permanently
   late once the endgame yard gets going, and then you are hearing last minute's yard.

3. **Beds — the things that are simply true right now.** Rain, wind, the machines' hum, the rift,
   the drowned pit. Continuous, present while their cause is present, gain crossfading over
   *seconds* and never over frames. They are not triggered by events at all: they are driven once a
   frame from state, in one `stepAudio(dt)` that reads the yard and sets levels. That structure is
   not tidiness — an event-triggered bed is a bed that eventually gets stuck on when some edge case
   fails to send its stop, and a stuck bed is the worst bug this layer can have.

4. **Punctuation — rare by construction.** A building landing on its footprint. A core banking. A
   star. The rift tearing. The boulder in the opening. These may be the loudest things in the game
   and may **duck the beds** a few dB for about a second underneath them. They have earned it by
   being rare, and they are rare because the game made them rare rather than because a cooldown is
   holding them back.

**Silence is in the palette.** The opening already has the only silence in the game: the body lies
flat on its back after the boulder lands, and the design says nothing in it is hurried. Audio honors
that literally — not a quiet moment but *nothing*, not even wind, until the body gets up. The lull
between rocks is the same. A soundscape with no holes in it is one you stop hearing by minute ten,
and after that it is fatigue with no information in it.

### The mix law

- **Very quiet by default, and satisfying at that volume.** Anything that has to be loud to be good
  is a sound that has not been designed yet. The target is a laptop speaker at half volume in a
  room with other things going on.
- **Master chain, in order:** yard bus → a gentle one-pole lowpass around 5 kHz, which is the
  six-grey palette enforced in one place instead of voice by voice → a soft limiter with a slow
  release, which exists so the endgame yard at full tilt is *the same loudness* as the opening yard
  rather than louder → master gain, default low.
- **Everything is enveloped; no gain value ever jumps.** At least a few milliseconds of attack on
  every voice, beds included; releases through `setTargetAtTime` rather than an exponential ramp to
  zero, which is not a thing that exists. A voice stolen by the cap fades over about 20 ms, never
  stops. This is the abyss note read into audio: full fades, no popping.
- **Nothing repeats exactly.** Every one-shot takes detune within about a semitone, a couple of dB
  of level and a few milliseconds of timing scatter, all from the game's `rand()`. Two semitones is
  the outer limit before variation stops sounding like variation and starts sounding like a fault.
- **Nearly mono.** The yard is drawn flat, so pan shallowly from world x against the camera center
  and cap it well short of hard — about ±0.3. A hard-panned yard is a yard you have to sit in the
  middle of.
- **A voice cap with per-class shares**, stealing the oldest and quietest first. The player's click
  is exempt.

### Architecture, in one paragraph and no code

A single `src/audio.js` owns the `AudioContext` and is the only file in the repo that has ever heard
of one. Modules never build a node; they say what happened — a call of the shape `sfx('stone', { x,
hard })` — and audio.js alone decides whether that survives the window and the ceiling. Beds come
from one `stepAudio(dt)` reading state, per the class rules above. Every number lives in `config.js`
behind an `SND_` prefix, and the handful that want an ear — master gain, the lowpass corner, each
class's ceiling — hang on `dev.js` as knobs, because that panel is where every other number in this
game was actually found. The context is created on the first real pointer gesture, because browsers
allow nothing else; before that, calls are no-ops and are **not** queued, or the yard coughs up its
whole first second at once. Mute lives on the settings sheet beside the reduced-motion switch when
that sheet exists, and it remembers. `ARCHITECTURE.md` gets an entry, and the mute state goes in one
of state.js's three lists like any other fact.

**How it gets checked.** Neither tier can hear anything, exactly as neither can see a sprite — so
the ear is the check, the way the shot is the check for drawing, and a green suite is not evidence
this layer is right. What the node tier *can* hold is the decision half, provided audio.js keeps its
decisions separate from its context: given forty grains in one frame, how many voices does it decide
to fire, and does a bed's target level follow the storm. That is a fact about the yard and belongs
in the node tier as its own file. Everything downstream of the decision is a listening job.

### What the research turned up that is worth taking

- **Mini Metro** (Vreeland) proves the thing is possible without music: a line's sound is *derived*
  from game state — station count is the sequence length, station type the timbre, occupancy the
  dynamic. Worth stealing: the derivation, and the hard caps on how much may sound at once. Worth
  leaving: the quantized tempo grid. This yard has no beat, and quantizing a pick swing would move
  the sound off the body that made it, which breaks the law's first clause outright.
- **Its density trick specifically:** when events exceed capacity the excess is dropped, not queued.
  That is where class 2's ceiling comes from, and it is the opposite of what a naive event queue
  does.
- **Balatro** is the counter-example, held at arm's length. Its card sounds are wonderful and its
  score counter is a slot machine on purpose. Take the tactility — a sound that lands just behind
  the hand and has weight in it — and leave the escalation: there is no prestige loop here to feed,
  and the pillars say the simulation is the reward.
- **Ordinary game-audio practice on repetition** — round-robin variants, about a semitone of pitch
  jitter, a couple of dB of level jitter — is right, and is cheaper here than anywhere else, because
  the voices are synthesized and the round robin is a random number rather than ten recorded takes.
- **Web Audio specifics:** an exponential ramp cannot reach zero, so `setTargetAtTime` is the
  release; a gain assigned directly rather than scheduled is the click you are trying not to make;
  and one noise buffer generated once and read from different offsets is an unlimited supply of
  non-identical noise for nothing.

### Open questions — the three that change the shape of the work

1. **Music: none, a drone, or the sky?** Three honest options. (a) No music ever, only the yard.
   (b) A generative drone under everything, tied to progress. (c) **The sky is the only score** —
   no music as such, but the air and water beds written *as* music, so the weather is what swells
   and recedes across an hour and the yard plays on top of it. The recommendation is (c): the sky is
   already a live decision the player invests in, and it is the only system in the game with a
   natural arc. This is the call that decides whether an hour has a shape or is flat, so it wants
   deciding on purpose rather than by default.
2. **Off by default, or on and quiet?** The seed said off. An audio layer built to this standard and
   shipped off by default is one most players never hear. The alternative is on, pitched quiet
   enough that nobody's first act is reaching for the mute, with a mute that remembers. A taste
   call, not an engineering one.
3. **Does the tower get a voice — and does the rift?** These are the two things in the yard that are
   not material, and the law says everything is struck. Either they stay silent, which is austere
   and consistent and makes the game's two strangest systems its quietest; or one of them is the
   single deliberate exception — the only sustained, pitched, non-percussive voice in the game —
   which would make magic legible by contrast the moment you first heard it. Taking that exception
   once is a design. Taking it twice is the start of a soundtrack.
### The ear pass (built, as hits only)

*Amendment, 2026-09-12. The call below was made a third way: neither A nor B, and no beds at all.
The player's word was "no ambiance or background noise, just hits" and "super clean, indie, pixel
art". So every bed and the duck were removed -- a still yard is silent -- and a strike became a
recipe rendered sample by sample, sfxr-fashion: a body (a wave with a pitch fall), a click on the
front, a resonant band of grit, and a pixel stage (bit depth and a sample-rate divide), through the
recipe's own lowpass and a soft clip. The recipes were landed by ear on a bench page that runs the
same arithmetic; `SND_STONE` is the one landed so far. `hard`, `crit`, `big` and the fold's widening
keep the meanings given below. The measurement and the two proposals stand as the record of why.*


*2026-09-12. The first listen, done with `tools/listen.mjs`: every voice rendered through the real
`audio.js` into an offline context, written to `shots/sound/*.wav`, and measured. Nothing in
`audio.js` or `config/sound.js` is changed by this section; it is the diagnosis and the proposal.*

**What it measured.** After the whole master chain, the player's own click on the rock peaks at
**−37 dBFS** and is audible for 300 ms; wood at −42, metal at −43 for 670 ms. The rain bed sits at
−25, the wind at −30 in a gust, the rift and the abyss at −20 — twelve to seventeen decibels *over*
the hand. The only things that reach a laptop speaker at half volume are the beds and the thumps,
and the beds are filtered noise. So the game sounds like noise because, at the level it plays, noise
is all it has: the one voice that was meant to be the clearest thing in the mix is the quietest.

The strike's shape is the other half. The 10 ms peak envelope of the click is flat at about −40 dB
for ninety milliseconds and then drifts down over two hundred more: no front, no body, a "pfff".
Two causes, both in the voice itself. A bandpass over the pink buffer at Q 1.2 keeps a sliver of an
already-quiet source, so `level: 0.5` under `SND_MASTER 0.18` is nothing. And a 3 ms linear attack
into a `setTargetAtTime` release has no transient in it: the first two milliseconds of a struck
thing carry the strike, and this voice has no first two milliseconds.

**What "short and satisfying" is, in numbers.** A hand strike peaks between −12 and −16 dBFS after
the master (the mix law's quiet default still holds -- `SND_MASTER` stays), is within 40 dB of its
peak for 60–150 ms, and has a front: its loudest 10 ms is its first 10 ms. The beds sit at least
12 dB under the hand, so the still yard is a floor you stop hearing and a click is always over it.
The `big` thumps stay where they are; they were the only voices already at level.

**The strike, proposed.** Every one-shot gets a *front*: two milliseconds of bandpassed noise
between 1.6 and 4 kHz, under the corner, the same node for every material with only the center
moved. Under the front, one of two bodies, and this is the call to make by ear before it is built
-- `node tools/listen.mjs --proto` renders both, eight files, `A-*` and `B-*`:

- **A, a struck body.** A sine that falls in pitch over ten milliseconds and is gone in forty --
  the thump the boulder already has, scaled to the material: 140 Hz falling from 2.2× for stone,
  85 Hz for hard stone, a 390 Hz triangle with a weak 1050 Hz partner for wood, a 620/645 Hz pair
  beating for metal. Peaks −12 to −15, lengths 80–290 ms. It reads as a knock: something with mass
  was hit. It is still struck and never a note -- the fall in pitch is what stops it being one --
  but it is more voice than the palette table promised.
- **B, the noise design at level.** The bands as specified, with the level raised eight to
  sixteen times to land at −12 to −16, the ring cut to a third (stone's release constant 20 ms, not
  60; metal's 40, not 140) and the same front on top. Peaks −12 to −16, lengths 60–200 ms. It reads
  as a crack: grit, no pitch anywhere. Nearer the letter of the palette; drier to live with.

Whichever is chosen, `hard`, `crit` and `big` keep their meaning: down and duller, more under it,
the thump beneath. The fold's widening and gain still apply. And the beds come down: rain to about
−37, wind to −40 in a gust, the rift bed to −32, so the hand clears them by twelve. Levels go
through `config/sound.js`; the front and the body are two more lines in `play`.

**The tool stays.** `tools/listen.mjs` is `look.mjs` for the other sense: a change to a spec is a
wav and a row of numbers in ten seconds, and it is the only way this file gets checked, since no
test in either tier can hear.

## The shack at the rock (built)

The bench section above ruled that the rock's rows could not leave, and the reason it gave was a
door:

> Giving the rock a board of its own would mean opening a sheet on the one thing in this game you
> click constantly — and a press on the yard puts an open board away, so it would close itself on
> every swing.

That is an argument about the rock being the door, and it is right. It says nothing against the
rock having a door somewhere else. A shack a few cells off the rock's flank is pressed the way the
outhouse and the school are pressed — you walk to it and you click *it* — and the rock stays the one
thing in the yard you only ever hit. So the rows can go where they belong after all, and this
section supersedes that paragraph and nothing else in it.

**What it is: the rockhands' hut.** The gang has worked this whole game out of nowhere. Every other
trade has a building — the growers have the plots, the blasters have the cut, the janitor has the
shed — and the one trade that was here first works out of thin air, with its helmets standing in
the middle of the rock it is trying to take down. The shack is the smallest building on the ground
after the outhouse: a board, a stand with the helmets on it, and a door the gang comes out of.

### Where it stands, and why that is the expensive part

There is no bare ground on the rock's left flank. `TO_BENCH` is -336, the bench keeps sixty pixels
of clear ground on the rock's apron side, and **the biggest rock in the game is measured off the
bench** — it grows until it is a hand's width from it and stops there. Wedging a shack into that
gap takes the room out of the rock, which is the one thing on this ground that must not get
smaller.

So the shack takes the bench's distance and **the bench moves out by the shack's width plus one
gap**, with the quarry, the plots, the casino, the tower and the sky moving with it — one
coordinated edit to the constants in `config/yard.js`, which is exactly what those constants are
for. The world already runs away to the left as sites open; this is one more step of that.

And the size rule is re-pointed while it is being touched: the rock is measured off **the nearest
building on its left flank**, not off the bench by name. That is the systemic form of the rule the
code already means, it is what makes this move cost the rock nothing, and it is what stops the next
building put down there from silently shrinking the hill.

**The right-hand side was the other option and it is worse.** The strip to the rock's right is
where the rock's own spoil piles; a building standing in it bars grain, pushes the heap outward,
and would have the pile-full mark firing for a reason that is architecture rather than backlog.

**One thing to settle in a shot rather than argue here:** the ram stands at `rockEdge(-1)`, the
rock's own left edge, and at full rock size that edge comes a long way out. The shack's inner face
and a standing ram must not overlap. It is a clearance, so it is measured off a screenshot at the
biggest rock, not reasoned about from the numbers.

### Amendment — the gap is derived now, and the shack moved in

The shack went up three hundred and forty pixels off the boulder, and every other station in this
yard wears its shed three cells from the wall. The gap was not spacing. It was room the rock had
not grown into yet: `TO_FIRST_SITE` was a hand-measured 264 -- the width of rock one, by eye --
and `rockSize` kept its own `P * 14` of clearance off the flank building. Two numbers, one
decision, in two files that could not be read against each other, and the spacing one was wrong.

Both ends are one rule now. `ROCK_W_MAX` and the newly-named `ROCK_FLANK_CLEAR` sit at the top of
the site table, ahead of the walk, because the walk is measured off them:

    TO_FIRST_SITE = (ROCK_W_MAX / 2) * P + ROCK_FLANK_CLEAR - SLOT_PAD

The first slot along stands exactly where the biggest rock stops needing the ground, and no
further. The shack closes from 342px to 228px at boulder one and to 84px -- the clearance itself --
from boulder seventeen on, which is where a run spends most of its time; and `gw` still reaches its
full 92 cells, so the move costs the rock nothing. That is the whole bargain: the hut reads as
attached to the thing it belongs to, and the hill is the size it always was.

**Why not closer.** Two options were weighed and dropped. Standing the shack one `SHED_GAP` off the
biggest rock would read properly attached at the end, but it takes the clearance out of the rock and
caps it near 70 cells -- the endgame boulder a quarter narrower, which is the one thing on this
ground that must not get smaller. Riding the rock's live flank would be attached at every size, but
the shack would then slide 144px left over a run, and placing the walk off `rockLeft()` re-ties the
knot `placeSites` already says it hit and undid: the rock sized by its flank, the flank placed off
the rock.

**The world got narrower, which had never happened before.** `gridSlide` in persist.js only ever
handled the ground *growing* in front of the boulder -- every change to the yard until now added
columns on the left. Nineteen columns came off, and a save from the wider world fell through to
`fillFlat`, which re-packs the same number of grains flat along the floor and loses where each one
lay and what kind it was: the exact loss that function exists to prevent, in the one direction it
did not cover. It takes a negative shift now, dropping what runs off the near end -- bare
`YARD_MARGIN` ground past the last building, which nobody heaps on.

### Amendment — the hut rides the rock after all, and the yard's pads are its own

Two things were still too far apart, and each was a rule that had been argued the other way above.

**The shack stands off the rock that is here, and scoots.** "Riding the rock's live flank" was
dropped above because placing the *walk* off the live rock re-ties the knot. The walk does not
move: the shack keeps its slot -- the sum above, less the pad, which is where it stands at the
biggest rock and what `flankX` and so the rock's cap still read. The *hut* stands nearer:
`ROCK_FLANK_CLEAR` (six cells now, not fourteen) off the rock by its number, `rockWidthAt(n)`,
never its clamped width -- and when a broader rock comes down it slides out toward the slot at
`SHACK_SCOOT` while the rock is still in the air. A cell or two a rock, a second of a hut
shuffling over; from rock seventeen on it is standing in its slot and the two rules agree. Nothing
teleports, the rock is the size it always was, and the gang's kit stand, the hut's board and the
rockhand fitting a pick at the door all read the live rect and go with it. `shackSpot` and
`stepShack` in world.js.

**A site pads by its own heap.** `SLOT_PAD` was the widest heap in the yard, the quarry's
thirty-five cells, laid beside all thirteen sites on the argument that an even rhythm is wall to
wall. Nine of them have no heap, so the shack and the bench stood three hundred and thirty pixels
apart for nothing, and the walk to the tower was a screen and a half of bare ground. `padOf(row)`
is the site's own standoff and heap, on the side the heap lies, and the rhythm the yard reads --
one `STATION_GAP` between one drawn thing and the next -- holds by construction. The quarry and
the farm are exactly where they were relative to their neighbors; everything with no heap closed
up by thirty-five cells a side.

**And the hut's rows are worked at the hut.** They moved onto the shack's board and stayed
`site: 'bench'`, so a pick bought at the door was fitted a walk away by whoever was spare. It is
the quarry's rule now: `site: 'shack'`, gang `JOB.ROCK`, and the work claims one rockhand to stand
at the hut for the duration (shedhand.js). All of them, the multiplier included: `swing ×` was the
one row on the board still `site: 'yard'`, and a yard row with no ground of its own is centered on
the rock, so a spare builder stood in the middle of the boulder to fit it. And the bar hangs over
the hut while any of them is on the go -- the shack is in works.js's site-box table, which is where
`barSpot` reads a roof from.

### What moves in

| row | from | why it can move now |
|---|---|---|
| `rockhandpick` — pickaxe | the bench, under *the rock* | it is the gang's tool, and the gang has a hut |
| `rockhandspeed` — swing | the bench, under *the rock* | the same |
| the rock's `swing ×` | `rows-mult.js` | its own comment says the bench draws it because "the rock has no board of its own" |
| `ram` | `rows-bench.js` | its own comment says it is "the only one of the three sold from the bench — because the rock is the one station with no board of its own" |

Those two comments are the same sentence, and this section is what makes it false. The two machines
that had a home were always sold at it; the ram is coming into line rather than being moved.
Where the ram is *built* does not change — the row still points at `specOf('ram').at()` and the
builders still walk to the rock's edge to stand it up. Only which sheet sells it.

**What does not move: your own gear.** `pickaxe`, `swing` and `hold to mine` stay on the bench, on
the rule the bench section set — you are the cursor, not a body, and the cursor has no station.
That leaves two rows called *pickaxe* and two called *swing* on two boards, and that is right
rather than a collision: they are one idea bought for two different pairs of hands, and each is
sold at the place its hands belong. It is the same doubling the crew's *strength* and your
*strength* already live with.

### How it arrives

**A `put up the shack` row on the bench, the cheapest building in the game.** Dust and shards, no
core — a core opens a *place*, in the sense of somewhere new to send people, and this is a shed for
people who are already there. It goes up the way everything goes up: a work at the site, builders
walking out, a bar over the ground. Nothing appears.

It is offered once there is a crew (`S.crew > 0`), which is the condition the rockhand rows already
carry, so a player who has hired nobody is not sold a hut for a gang that does not exist. The rows
inside keep their own `show` unchanged.

**What this costs the opening, said plainly.** The gang's two ladders now sit behind a purchase and
a walk that were not there before, and they are among the first things a new player climbs after
the houses. The mitigation is the price and the length of the build, both of which should be the
smallest in the game — and if playtesting says the first ten minutes drag, the fix is those two
numbers, not putting the rows back on the bench. The gate buys something real: the first building
you ever put up is now one you have an immediate reason to want, rather than the school.

### The helmets, and somewhere to stand

**The stand moves to the door.** `KIT[JOB.ROCK]` is a trade, and a trade's hats stand where its
roster stands, which for `mine` is `S.cx` — the middle of the rock. So today the helmets, and the
headcount over them, are drawn on top of the thing you are clicking. Once the hut is up they stand
outside it, the way the caps hang outside the outhouse: `mine`'s `at` answers the shack's middle
when it stands and `S.cx` when it does not, because the row exists from the first hire and the
building does not. The count and the stand travel together — they are one drawing — and the rock
gets its face back.

**And the gang musters at it.** A rockhand with nothing to do idles on the rock face. Once the hut
stands, its idle anchor is the door: bodies come out of it to work and drift back to it when the
rock is gone. That is the difference between a hut and a picture of one, and it is the same
sentence `kit.js` already makes about hats — a thing that belongs to a station is a thing you watch
somebody walk to. Nothing about the work itself changes: they still climb the hill and take the
crest off in layers.

**What the shack joins unasked.** No strip in `S.piles`, because it produces nothing, so no
pile-full mark. Drawn like the outhouse — a flat black block, a white doorway, on the cell grid,
with `shadeNear` where it meets the ground, because a flat fill reads as printed paint.

### The wording call

The row, the board title and the hover all want one word. `the shack` is the proposal: it is what a
shed for a gang is called, it is one syllable among `the school` and `the casino`, and it needs no
gloss. `the hut` reads the same and is no better. Said out loud here rather than assumed, the way
`speed ×` was.

### What the save carries

`shackOpen` in `SAVED`, and a `shack` box in `state.js`. **No migration.** Nothing about a level
changes — `rockhandPickLevel`, `rockhandSpeedLevel`, the mult level and the ram's own state are all
untouched, and a save that has bought them out opens the shack with its ladders already climbed.
That is the cheap axis of this change, and it is worth naming beside the lab's deletion, which had
to move four fields.

### How it would be checked

- **Bought the player's way**, in a new `test/shack.test.mjs`: press the bench row through `__buy`,
  assert a work starts at the site, a builder walks to it, and the building stands — never a hook
  that sets `shackOpen`.
- **The rows landed**: once it stands, the shack's section list is the four rows above and the
  bench's no longer holds them. `hooks.js` already keeps a board/section registry, so this is a
  list assertion rather than a DOM one.
- **The helmets**: the stand's world x is the shack's middle once it stands, and `S.cx` before it.
- **The muster**: a rockhand with no rock left to work ends up within a cell of the door, driven
  with `runUntil` in game seconds.
- **`test/persist-roundtrip.test.mjs`** covers `shackOpen` the moment it is in a list.
- **The layout is a shot, not a suite.** `tools/look.mjs rock` at the biggest rock: the shack, the
  bench's new distance, the ram's clearance, and the hill still the size it was. No check in either
  tier can see any of that.

### What changed on the way in

Five things the design got wrong or left open, settled by building it. They are
here rather than folded silently into the prose above, because each one is a
thing the next section like this should not have to find out again.

**The layout was one row in a table, not a coordinated edit.** The section above
says the shack's ground costs "one coordinated edit to the constants in
`config/yard.js`" — moving `TO_BENCH` and everything behind it. That was true of
a yard that has not existed for some time. `SITES` in `config/sites.js` is a
declarative table and placement is a walk (`placeSites` in world.js), so the
whole of the layout change is one row at the front of that table plus `'shack'`
in `PINNED_FIRST`. The bench and everything behind it move because the walk
walks, `GROUND_LEFT` grows because it is summed off the same table, and the
world's own widening migration (`floorShift` in persist.js) was already written.

**The rock's size rule was two rules, not one.** `rockSize` measured off
`bench.x + bench.w` — the flank the design named — and so did `ramTargetX`, which
parks the ram clear of the building behind it. Both are `flankX()` now (world.js:
the greatest right-hand edge among the placed sites). Re-pointing only the first
would have put the ram inside the hut, which is the same class of bug one level
down: a rule that names one building goes wrong the next time the walk is
reordered, and here the reorder was in the same commit.

**Dust alone, no shards.** The design priced it in "dust and shards". Shards come
out of banking rock cells, so they are early enough — but the shack is the first
thing a player puts up, and a bill in a second currency is a second thing to
understand before the first building. `SHACK_DUST` is 150 and there is nothing
else on the row. The gate that actually matters turned out to be `nearly()`, the
rule every other door on the bench follows: the row appears at 75 grains in the
hole. The crew clause is kept and is nearly always true — the yard starts with
one pair of hands — so it only ever speaks for a save that has none.

**The lean-to did not survive the shot.** A roof falling three courses across
eight columns is a step every two and a half cells, and a stepped *silhouette* at
this size reads as a staircase. It is flat with a course of eave standing a cell
proud each side. The mark over the door went the same way twice: a pickaxe stood
beside the wall read as a post with a hat on, and the same pick cut into the
front read as a face. What is over the door is a small white hill — the thing the
gang works rather than the thing they work it with — built out of even courses,
because the front is eight cells and its middle is a seam rather than a column.

**The muster is the kit walk, and that is all it should have been.** The design
promised bodies drifting back to the door "when the rock is gone". The rock is
never gone for long: `dancing` in crew/step.js holds the gang celebrating for the
whole gap between boulders, so the window the promise described barely exists.
And the one time a rockhand genuinely has nothing to do — its pile full, waiting
on the haulers — it stands down *at the face*, deliberately and rightly, because
that is where it will start again. So what makes the door a door is the walk that
was already there: the helmets hang at the shack (`kitX`), and every breaker
walks to it for one before it walks to the rock. Idle spare hands have the hut
added to the handful of places they will wander to (`strollTo` in crew/idle.js),
so there are people about it. Nothing was added that fights a behavior that was
already correct.

**One check elsewhere was passing by coincidence, and the move exposed it.** `a
hauler that picks the helmet up is a rockhand` in test/kit.test.mjs shakes a
rockhand's helmet off and expects a hauler to claim it. It carried the owner
"across the yard" first so the race would be a race — and that gesture did
nothing at all: `lift`, move, `drop` puts the body straight back down, and a
rockhand walks briskly back to its own layer, so the owner was standing over its
own helmet again before its stars cleared. The owner is then the nearest body to
it and wins by the yard's own rule (`ownerRacing` in crew/kitwalk.js). What the
check actually turned on was whether a hauler's errand happened to have it near
the rock in that second and a half — a fact about how far apart the buildings
stand — and moving every hauler's errands one slot further out is exactly what
adding a site at the head of the walk does.

It is fixed rather than re-tuned: the owner is now *held up* while the race runs
(a body in the air is not in the race, which is the rule that makes the helmet
genuinely up for grabs), and the check waits for the swap with `runUntil` instead
of reading whatever is true twenty seconds later — the helmet changes hands more
than once in that window. The fixed check passes on a tree with the shack and on
one without, which is the point: it is not a fact about a layout any more.

## The bench is built, not delivered (built)

The bench is the one thing in this yard that teleports. `STEPS`' `bench` step in
game.js watches `canAfford()`, and the frame it first goes true it sets
`S.seenBench` and a workbench is simply *there* -- top slab, legs, something
clamped to it -- on ground that was bare the frame before. Nobody walked, nobody
swung anything, nothing was fenced. It is the first structure the game puts up
and it is the only one it does not build.

Every other structure is a work: paid for, its ground reserved, a body standing
at it, a bar over it that stops dead when the body leaves. That mechanic is what
the whole middle of the game is made of, and the first time a player meets it is
somewhere around the shack, by which point there is a yard full of things moving
to miss it against.

**So the bench is built, by the one body you have, and it is the first thing the
game teaches.**

### What happens instead

Nothing appears when `canAfford()` first goes true except a **call to build**,
standing on the bare ground where the bench will go. It is a control, not an
announcement: it does nothing until it is pressed.

Press it, and a work starts on the `yard` site under a key of its own. The
existing rules take it from there and none of them need changing:

- `busyBuilderSites` names the yard, `rebalance` finds no spare hand, and
  `nearestLendable` **lends your one digger** -- taken off the rock, marked
  `lentFrom`, given back the frame the work lands.
- It walks. It stands inside the fenced ground, swings the hammer in bursts, and
  throws grit off every blow, because that is what a builder already does.
- The standard bar hangs over the footprint and stops if the body is pulled off.
- When it lands, `S.seenBench = true` and the bench is drawn -- by somebody who
  walked there, which is the rule the rest of the yard keeps.

Eighteen worker-seconds: `place` in `WORK_BASE`, the figure for a bench in the
cut, a furrow, a hat off the stand. The workbench is that size of job and gets
that number rather than one written for it.

### What it costs, and why that is the point

Your only body is off the rock for those eighteen seconds. The dust stops
climbing while the bench goes up, and you can watch it not climb.

That is the first bargain the game asks you to make, and it is the same bargain
every later one is: **a body doing this is a body not doing that.** Teaching it
here is free, because at this moment there is exactly one body and exactly one
thing it could otherwise be doing, so the trade is legible in a way it will
never be again once there are nine of them.

**No dust price.** The bench arriving was never a purchase and is not one now --
the row you could afford is still sitting there to buy once the bench stands. A
cost here would be a second toll on one moment, and would let a player press the
button and be left with neither the bench nor the row.

### The rule it must not break

The bench must stay **inevitable**. Everything you can ever buy is on it, so a
player who never presses this can never buy anything, ever. Therefore: the call
never times out, cannot be dismissed, does not move, and once pressed the build
stands whatever happens to your dust afterward. It is a *when*, not a *whether*.
It is also the reason it wants to look like an ask rather than like scenery.

### The control itself

A real button on the page, floated over the bench's own footprint -- the same
kind of thing a board is, seated the same way a board is, in the same voice: a
white sheet, a one-pixel black rule, the boards' uppercase monospace. It says
`build the bench` and it is the only thing in the window that does.

It is a button and not a drawn mark because it is the one control in the game a
player *must* find. Everything else that is not on a board -- the machine's run
switch, a cauldron -- is a thing you may notice; this is a thing that has to be
pressed before there is a game at all, and chrome is unmistakably chrome in a way
a hollow square on the ground is not.

Seated in `hud()` off the same world-to-screen arithmetic the boards use, so it
stands over the bench's footprint through a pan and a zoom, and clamped inside
the window for the same reason a board is. It vanishes the frame it is pressed:
from then on the fence, the tape and the bar are the announcement, exactly as
they are for every other build.

### What it needs in code

- A hidden row, `raisebench`, registered through `registerRows` and on no board:
  `works.js` finishes a work by calling `rowFor(w.key).buy()`, so the bench needs
  a key to be finished under. Its `buy` is one line -- `S.seenBench = true`.
- `YARD_ROW_SITE` and `siteBox` learn that `raisebench`'s ground is the bench's
  own rect, so the fence, the bar and the builder all stand on it.
- The `bench` step in `STEPS` stops setting `S.seenBench` and starts deciding
  whether the call is out: `!S.seenBench && canAfford() && !workOn('raisebench')`.
  Derived, so **nothing new is saved** -- the work itself already rides in
  `S.works.yard`, and a save mid-build comes back mid-build.
- One check, bought the player's way: mine to the first affordable row, assert no
  bench, click the call, run the yard until the work lands, assert the bench and
  assert the digger went back to the rock.

## The sheet (built)

Spec: `docs/wave-release.md`; built 2026-09-09 by six tracks, landed on main the
same day. The bargain in one paragraph, because the spec is a build document
and this is the reasoning.

Every board in this game is a place you walked to, and settings are not a
place. The one surface that is already not the yard is the held sheet -- escape
stops the clock and a white card in the middle of the window says so -- and
it is reachable from the first second of a new game, before a bench exists.
So the sheet grows rather than a second surface being added: under PAUSED and
its resume button go the motion switch, the save going out and coming back in,
the reset button (off the bench, where it was the one row that was not a
purchase), the two keys written down, the build's name, and the one honest
sentence about there being no finish line. No corner button, no gear, no row
on any board. What the player gives up is nothing; what the fiction gives up
is one card it already had.

Reduced motion means the camera and the shake -- the punctuation -- and
nothing the yard itself does: bodies walk, rain falls, the wheel spins, the
star breathes. The intro plays every beat from a still seat.

A hidden window is a pause. The clock may not leap on return, because a
leap is every timed thing you paid for resolving at once, which is the one
punishment for walking away that pillar 2 forbids.

## The landing page (built)

The title front on the held sheet was the cheap version: a pause screen with
a different word on it, over the yard you were already in. A landing page is
where a game *begins* -- the name, the picture, the menu -- and it is the one
place a player is not yet in a yard, which is what makes choosing one there
feel natural rather than like a settings row. So the title becomes a page of
its own, and the game page goes back to opening playing.

### The bargain

**Two documents.** `index.html` is the landing page and `play.html` is the
game. The itch embed, the desk, a bookmark all land on the title; `play`
opens the game. The cost is one document load between the two -- about a
second, the yard's own boot -- and every tool that drives the game names
`play.html` (`GAME` in headless.mjs gets it appended once). What it buys is
a page with nothing of the game's DOM in it: no boards, no HUD, no toast, no
pointer over a yard, and a menu that is the page rather than a sheet.

**The picture is the yard, live.** Not a still. The page runs the game's own
renderer on a demo yard -- a scene from `scenes.js`, so it is the same code
and never goes stale -- with the camera composed so the left third is empty
sky and ground under the menu, and the sim running: the pair step out of the
house, a small crew swings at a rock, motes drift. A scene is staged
(`S.staged`), which is exactly what a demo yard needs: never written to any
slot. Under `motion: less` it stands still. The rule of the whole game --
watchable cause and effect -- is the first thing on the page.

**Nothing is a sheet.** The menu is a column on the left, in the sheet's
hand (the boards' monospace, tracked capitals, one-pixel borders), and each
button opens *in the column*: `saves` swaps the buttons for the three rows
and a `back`; `achievements` for the record's cards; `settings` for the
switches. One place, and the yard keeps moving behind it.

### The page

```
PEBBLE                         .  .     .        .
PIT                                 .        .
a rock. a hole. a few people
between them.                          ▄▄▄▄
                                   ▄▄▄▄████▄▄▄▄
[ PLAY                    ]        ████████████      □ □
  yard 1 · rock 12 · 7 crew · 4 min ago
[ SAVES · 2 of 3 yards    ]  ─────────────────────────────
[ ACHIEVEMENTS · 11 of 42 ]
[ SETTINGS                ]
[ QUIT                    ]  (desk only)

v0.1.12      rocks keep coming. there is no finish line.      itch · github
```

- **The name** in two lines, 34 px, tracked wide -- the sheet's `.word` a
  size up -- and under it the one line the itch page opens with.
- **`play`** is the one filled button. Under it, what it will open: the open
  slot's label as the saves page writes it (`yard 1 · rock 12 · 7 crew ·
  4 min ago`), or `a new yard` when the slot is empty. Enter and space are
  `play` too.
- **`saves · n of 3 yards`** turns the column into the three rows. Picking a
  row opens that slot (the pointer, `setSlot`) and nothing else happens --
  the label under `play`, the count on `achievements` follow -- because no
  yard is running here to switch. An empty row is armed as on the sheet.
- **`achievements · x of y`** is the open slot's record, read off its blob
  (`won`, `wonAt`), the record's cards in the column, two across. Per yard by
  construction, as before.
- **`settings`** is the sheet's settings page in the column: motion, sound,
  volume, `save a copy` / `load a save` acting on the open slot's blob
  through save.js (no yard needed: export is `slotRaw`, import validates and
  writes the slot), `reset progress` armed, erasing the open slot.
- **`quit`** on the desk only. The footer: the version, the one honest
  sentence, and `itch · github` links on the web.

### What changes in the game page

- `play.html` boots playing again -- no hold, no title front. The held sheet
  keeps its `saves`, `achievements` and `settings` pages (esc while playing
  should not mean leaving the yard); its `title page` button becomes a real
  exit: `persist()`, `await storeSettled()`, then `location.href =
  'index.html'`. The store is written behind, and a navigation that did not
  wait could lose the last write.
- `main.js`'s boot: `hold(true, 'title')` goes; the harness door in
  `newGame` stays and is harmless.
- `index.html`'s script is `src/title.js`: `primeStore`, the labels off
  `slotLabels`, the record off the blob, the demo scene through the renderer
  with the camera composed. It shares `save.js`, `slots.js`, `record.js`,
  `prefs.js`, `settings.js`'s `copyOut`; it never imports `main.js`.
- The desk loads `dist/index.html` (the title) and `desk.version()` fills
  the footer. `vite.config.js` gets two inputs.

### As built (2026-09-14)

Built as written, with four things the design did not say:

- **The picture is the game page in a frame, not the renderer on the title
  page.** `index.html` holds an `<iframe src="play.html?demo">` with the
  pointer off, and `main.js` in `demo` stands the staged yard (a reset with
  the intro skipped, a small crew hired straight off, `DEMO_HEAD_START_S`
  of it run before the first frame so the rock is down and the crew at it),
  hides every piece of chrome (`body.demo`), leaves the reading layers out
  of the picture (`asPicture` in render.js: counts, marks, cursors,
  controls) and composes the camera as the opening view pushed right by
  `TITLE_COLUMN`. Why a frame: the game's modules reach the boards' DOM as
  they load (board.js), so a title page that imported the renderer would
  have needed every board's element or a rewrite of every load-time touch;
  the frame is the whole game, unchanged, which is also what makes the
  picture the game and never a copy of it.
- **The record's names are data now.** `catalog.js` holds key, name and
  note; `notices.js` joins its `when` predicates by key. `record.js` reads
  the catalog, so the landing page can read a save's record without the
  game behind it (`recordListOf`, `recordLabelOf`).
- **`reset` no longer clears the store under a staged yard** -- the demo's
  reset would otherwise have erased the open slot to make a picture.
  `showSlots` takes what picking a row means (`switchSlot` on the sheet,
  the pointer on the title), so slots.js needs no yard.
- **No yard is "yard 1".** The label under `play` and the saves rows say
  what a slot holds -- `rock 12 · 7 crew · 4 min ago` -- and the number is
  the row's, not a name; the fronts say `saves · 2 of 3`; opening one says
  `loaded`. The one honest sentence is not on the landing page.

`copyOut` moved to `copyout.js`, shared by the settings sheet, the crashed
sheet and the landing page. The held sheet's `return to title` button is a
real exit: `persist`, `storeSettled`, then `index.html`; on the desk both
pages carry `exit to desktop`. The `title` front on the held sheet is gone,
and the game page opens playing again.

**The way in, and the sheet's wash (same day).** Two documents meet in a
load, and a load is a blank page: so `play` puts a white veil over the
landing page (`VEIL_MS`), asks for `play.html` from behind it, and the
game page boots under a veil of its own that lifts one frame after the
first is drawn -- the middle of one fade rather than a cut. Under `motion:
less` both veils go at once. And the held sheet stands on a wash now: white
at two thirds over the yard with a stipple of single dark cells on the
six-pixel grid (`#scrim`, kept in step with the sheet by the frame), so it
reads as over the yard rather than pasted on it; every button on it is the
sheet's width, since a column of one width reads as a menu.

**Every screen meets the next as a fade (same day).** The way in was one
fade; now they all are. `return to title` and `exit to desktop` put the
veil up and let the store take the last write before the page goes; the
landing page boots under its veil and lifts it a frame after its front is
written; the held sheet and its wash come up and go down as fades
(`fade.js`, `SHEET_FADE_MS`) with `hidden` still the truth -- put on after
the element shows, taken off ahead of the hide, so every check and observer
reading `hidden` reads what is there; and a page turned, on the sheet or in
the landing page's column, comes in as a short fade, which is nothing but a
keyframe on elements going from hidden to shown. Under `motion: less`
(`body.still`, kept in step by the motion switch on both pages) every one
of them is nought.

### Checks

- `test/title.test.mjs` (node): the label under `play` for a played, empty
  and unreadable slot; `saves` counts the yards; the record off a blob,
  newest first, named from the catalog; picking a slot moves the pointer
  and writes nothing.
- Browser, `src/selftest/settings.js`, group `the landing page reads the
  store and play opens the game`: `index.html` in a frame, the labels read,
  the rows read, `play` pressed, the frame landing on `play.html` with the
  yard, and the slot's blob unchanged by any of it. The look is
  `WINDOW=1280,800 GAME=http://localhost:<port>/index.html node tools/headless.mjs --shot landing.png "new Promise(r => setTimeout(r, 3000))"`.

## The save is in IndexedDB (built)

A player on itch.io, in plain Chrome, saw `not saving: storage is blocked or
full` while every other itch game they played kept saving. The other games
were the clue. itch serves every HTML game from one origin,
`html-classic.itch.zone`, in an iframe on the game's page, and Chrome's
localStorage cap -- about five megabytes -- is one cap for that whole origin,
shared by every game a player has ever run there. Most engines save to
IndexedDB and never touch it; the games that do use localStorage mostly write
a high score. A player with a nearly full one keeps those working, because a
high score still fits, and loses ours, because eighteen kilobytes of yard does
not. The save was in the one store on that origin with a small, hard, shared
wall, and nothing about our writes -- ~10 kb fresh, ~18 kb busy, one key --
was the problem.

### The bargain

**The save moves to IndexedDB; localStorage is the way in and the way out.**
IndexedDB has its own quota on the same origin, in the hundreds of megabytes,
and exactly localStorage's partitioning and blocking rules, so the save is out
of the shared wall and no worse off anywhere. What it costs: IndexedDB only
answers in its own time, and the yard reads the store as if it did not -- an
import writes the blob and reads it straight back through `restore`. The desk
adapter had already solved that shape for a file (the copy in hand is the
truth, the store is only ever behind it), so the page borrows it: **every key
of ours is read once, before the boot, into memory, and answered from there
after** (`primeStore`, awaited at the top of `main.js` before `restore`); a
write goes to memory now and to the database behind it, and whether the
database took it is the answer the *next* write gives -- one write behind,
never silent, `S.unsaved` reading it as before.

A save the database has not got and localStorage has is carried across once
on the first prime and then removed from localStorage, which also hands the
shared quota back. Where IndexedDB is not to be had -- the node yard, a
browser refusing it -- `openKv` answers null and the save stays in
localStorage exactly as it was. The tab-owner key stays in localStorage on
its own: the `storage` event that tells a page it has been overtaken fires
for nothing else.

**Blocked and full are told apart.** They want different things of the
player. `SecurityError` on a read or write is the browser denying the page
any storage (third-party storage turned off): the sheet says so and that
the game in its own tab is the way round it. `QuotaExceededError` on a write
is the origin's quota, and the sheet says how full and how little of it is
ours -- `this site's storage is full (4.9 mb used, 19 kb of it ours)` -- so a
player reads that it is not the game that filled it. Anything else names
the error.

**A claim that could not be written is no claim.** With localStorage full,
the page's name beside the save could not be written, the name there was
some earlier page's, and the page took it for another tab: it stood aside,
reloaded when looked at, and stood aside again -- a loop with no save in
it. `claimTab` now says whether the claim took, and a page whose claim did
not is unguarded against a second tab rather than guarded against a ghost.

### Checks

`test/idb-store.test.mjs` (node, a fake database): the autosave goes to the
database and not localStorage, and a boot reads it back; a localStorage save
comes across once and leaves localStorage; a full localStorage does not cost
the save; a refusing database reads as an unsaved yard and says `full`;
blocked and full are told apart and a write that takes clears it; a claim
that did not take does not yield. `src/selftest/settings.js`, group
`the save is in the database`: in real Chrome, the autosave is read back out
of IndexedDB by hand, localStorage is filled until it throws, and the yard
keeps saving.

## The desk: an Electron shell (built)

The target is a desktop app, not a hosted page. This is the project's first
structural dependency, so this section says what the shell owns, what stays
in the renderer, and how thin the bridge is -- and it stops there until it is
approved. Checklist items 2, 3, 8 and 11 (`docs/release-checklist.md`).

### The bargain

Electron buys three things the page cannot have: a save that is a file, a
window that keeps its clock, and native dialogs for a save going out and
coming back in. It costs a 100 MB download for a 300 kB game and a second
process to keep honest. The bargain is worth it only if the game itself does
not know it is inside a shell -- so the rule is **the renderer is the web
build, unchanged, plus one adapter**, and everything Electron-shaped lives in
`electron/` and never imports from `src/`.

### What the shell owns

- **The window.** One `BrowserWindow`, 1440x900 to open, 960x600 minimum,
  white background so the first frame is not a flash of dark, no menu bar,
  title "Boulder", `backgroundThrottling: false` so rAF keeps firing when the
  window is minimized (the clock clamp from the release wave covers suspend).
  `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`.
- **The save, as a file.** `app.getPath('userData')/saves/current.json`,
  written atomically -- to `current.json.tmp`, then renamed over -- and a
  `last-good.json` written only after the new blob has been parsed back from
  disk. Named slots are the same directory with the player's name for the
  file; `current` is the one the game boots from. Nothing ever overwrites a
  file that has not passed its parse check. The store is `electron/store.cjs`,
  plain Node with no Electron import, so the node tier can test the atomic
  write and the fallback by pointing it at a temp directory.
- **The dialogs.** `showSaveDialog` / `showOpenDialog`, JSON filter, default
  name `boulder-<date>.json`.
- **The version**, which is the same `__BUILD__` the web build stamps.

### The bridge

`electron/preload.cjs` exposes exactly one object, `window.desk`, with five
functions and no events:

```
desk.read()            -> string | null     the current save, or nothing
desk.write(raw)        -> Promise<boolean>  atomic; false if the blob failed its parse-back
desk.exportTo(raw)     -> Promise<boolean>  a save dialog; false if cancelled
desk.importFrom()      -> Promise<string|null>  an open dialog; the file's text, or nothing
desk.version()         -> { hash, date }
```

Nothing else crosses. No `ipcRenderer` reaches the page; no file path is
ever shown to the renderer.

### The adapter

`src/save.js` gains one seam: a `store` object with `get`/`set`/`remove`
that is localStorage when `window.desk` is absent and `desk.read`/`desk.write`
when it is present. `persist`, `restore`, `exportSave` and `importSave` do
not change. The settings sheet's `save a copy` and `load a save` call
`desk.exportTo` / `desk.importFrom` when the desk exists and fall back to the
clipboard and the textarea when it does not -- two branches in
`src/settings.js`, no third surface.

**Migration.** On first run with no `current.json`, the adapter reads the
browser's `boulder-clicker/v4` from localStorage and writes it through
`desk.write` before `restore` runs, so a player who was on the web build
keeps their yard. The localStorage copy is left in place; it is never read
again while the file exists.

**Fallback.** If `current.json` fails its shape check, `last-good.json` is
loaded instead and the settings sheet opens on boot with one line: `the last
save would not load; this is the one before it`. Offered, not silent -- the
report's open question, answered: silently restoring an older save is its
own data loss, so the player is told, once, on the surface they already know.

### Packaging and the channel

`base: './'` in `vite.config.js` (the shell loads `dist/` over `file://`).
`electron-builder`, one config block in `package.json`: Windows NSIS and
portable, macOS dmg, Linux AppImage, all unsigned for now. Published to
itch.io as desktop channels with butler by hand; the script is
`tools/publish.mjs` and it is the one script that talks to the outside.
`bun run desk` opens the shell against the dev server (`VITE_DEV_SERVER_URL`),
`bun run desk:build` builds `dist/` then packages it.

### The version boundary

A save records the `hash` and `date` of the build that wrote it (one field,
`build`, in `SAVED_BY_HAND`). On load, a save whose `date` is later than the
app's own is loaded anyway -- the game has never broken a save going
backward, and refusing would be the punishment -- but the sheet says `this
save is from a newer build (<date>)` the first time it is opened. There is
no auto-update; a player is told on the sheet when the itch page has a newer
build only if the store page is checked by hand, which is to say not by the
app. Updates are a devlog and a download.

### What it must not do

- Anything in `src/` may not import Electron or reach `window.desk` except
  `save.js` (the store seam) and `settings.js` (the two dialog branches).
- No telemetry, no network call of any kind from either process.
- No offline accrual: a file save changes where the yard is kept, not what a
  closed app does with the clock.

### How it would be checked

`test/desk-store.test.mjs` (node): the atomic write leaves either the old
file or the new, never a torn one (kill mid-write by throwing inside the
rename); a `current.json` that fails the shape check loads `last-good.json`;
the migration copies the browser save exactly once. `test/desk-adapter.test.mjs`
(node): with a fake `window.desk`, `persist` goes through `write` and
`restore` through `read`, and `exportSave`/`importSave` are byte-identical
either way. The shell itself is looked at, not tested: `bun run desk`, a
screenshot at 1440x900 and at the minimum size.

### Amendments, as built (wave-desk-sound, track A, 2026-09-12)

- **`desk.read()` returns `{ current, lastGood }`**, each a string or null,
  rather than one string. The fallback rule lives in the renderer's `isSave`,
  which is the one place that decides what a save is, so the renderer needs
  both blobs. Still five functions, no events, no path.
- **`last-good.json` is the save before the last write**, promoted only after
  the new blob has been read back whole, rather than a copy of the new blob.
  A copy of the new one would be no help against the one failure the fallback
  is for -- a build writing a shape the reader refuses -- and the autosave is
  once a second, so "one write behind" is a second behind. A reset (`write('')`)
  promotes the yard it clears the same way; nothing empty is ever promoted.
- **The adapter answers from memory once it has written.** `desk.write` is a
  promise and the yard reads the store straight back after writing it (an
  import writes the blob and `restore` reads it), so `save.js` keeps the last
  blob it wrote and reads the disk only before the first write. The page is the
  only writer, so the copy in hand is the truth and the file is only ever
  behind it. `S.unsaved` carries the last answer the disk gave, one write
  behind.
- **An empty `current` is a reset, not a reason to fall back.** Only a blob
  that is present and will not read falls back to `last-good`; otherwise a
  reset would be undone on the next boot. The migration likewise only runs
  when neither file has ever existed, so a reset does not bring the browser's
  old yard back.
- **"Said once" is once per opening of the sheet.** The held sheet's observer
  wipes the store line as the sheet comes up and asks `sayStore` again, and
  lets the two once-only flags (`fellBack`, `newerSave`) go when the sheet
  goes down. Clearing the flag inside `sayStore` would have lost the line to
  the same observer's wipe on the boot that sets it.
- **The fallback does not offer the bad blob.** It is put under `BROKEN_KEY`
  for the console, but `S.broken` stays false: `save a copy` hands over the
  yard that is standing, not the blob that would not read.

## Save slots and the title page (built; the title front since replaced)

The game has one yard and one autosave. A player who wants to start over
without losing the yard they have -- to try the other opening, to show a
friend the first minute, to keep a drowned pit and go and build another --
has nothing but `save a copy` to a file and `load a save` back from one, and
that is a bug report's tool, not a player's. The desk store was laid out for
slots (`<name>.json` beside `current.json`) and stopped there. This is the
rest of it.

### The bargain

**A slot is a yard, not a snapshot.** Three of them, numbered, and one is
the yard you are playing. The autosave writes to the one you are in and no
other; switching slots is switching which yard the page is running. That
is the "profiles" model rather than the "save here / load" model, and it
was chosen on purpose: a snapshot slot is a copy of a yard the player has
to remember to take, and a copy taken once and played past is a copy that
lies. A yard that is always its own save cannot lie, because nothing is
ever copied -- the same autosave that already keeps the one yard keeps
each of the three.

What it costs the player: nothing they had. Every existing save is slot 1,
under the key it has always had; slots 2 and 3 are empty until stepped into.
What it costs the code: the key the store reads and writes becomes a
function of which slot is open, and one more page on the held sheet. The
guarantees the desk wave bought -- an atomic write, a last-good beside every
save, nothing overwriting a blob that has not parsed back -- hold per slot,
because each slot is the same pair of files under a different name.

**Nothing is named by the player.** The game has no text field but the paste
box and does not want one on a sheet whose other lines are one word each.
A slot says what it holds instead, read off the save itself: `1 · rock 12 ·
7 crew · playing`, `2 · rock 3 · 2 crew · 5 days ago`, `3 · empty`. That is
more than a name would tell you and it cannot go stale.

**Stepping into an empty slot is the new game.** It starts the intro, the
way a first visit does, without touching the yard you left. The reset
button stays as it is and erases only the slot you are in: with slots
there are two different wishes -- "start another" and "wipe this one" --
and they get two different buttons, neither of which can do the other's
harm.

### What is on the sheet

A `saves` button on the held sheet's front, beside `achievements`, turning
the page to a list of three rows and a `back` -- the record's shape, because
it is the record's kind of thing: a page to read, behind the one surface
that is not the yard. Each row is a button:

```
1 · rock 12 · 7 crew · playing
2 · rock 3 · 2 crew · 5 days ago
3 · empty
```

The row you are in is inert and says `playing`. Pressing another row saves
the yard you are in, opens that slot, and boots it -- `restore` and
`bootYard`, the same boot an import does -- with the sheet still up and the
`said` line reading `yard 2` (or `a new yard` for an empty slot). No reload:
the page is already up and the player is looking. Pressing an empty row is
the two-click arming the reset uses (`start a new yard?` for four seconds),
because it is the one press on the page that begins an intro.

The time is the coarse kind -- `just now`, `4 min ago`, `3 h ago`, `5 days
ago` -- and comes from a `savedAt` stamp `blob()` starts writing. A save
from before the stamp shows no time and nothing else changes.

### What moves, file by file

- **`save.js` keys by slot.** `KEY`, `PREV_KEY` and `BROKEN_KEY` become
  functions of the open slot: slot 1 is exactly the keys of today
  (`boulder-clicker/v4`, `.prev`, `.broken`), so no existing save moves;
  slot *n* is `boulder-clicker/v4/n` with the same suffixes. Which slot is
  open is a page fact, not a save fact -- it lives beside the prefs under
  `boulder-clicker/slot` and is never on `S` -- read once at module load
  and written by `openSlot(n)`. The desk adapter's held blob becomes one per
  slot. `slotRaw(n)` reads any slot's blob without opening it, for the labels.
- **The tab owner is per slot.** `OWNER_KEY` follows the slot too, so two
  tabs on two different slots are two yards and neither yields to the other;
  two tabs on one slot behave exactly as today. The `storage` listener in
  main.js compares against the open slot's owner key. (A page that yields
  and reloads boots into whatever slot is written under `boulder-clicker/slot`
  at that moment, which the other tab may have changed -- the store is the
  yard now, as the yield already says.)
- **`persist.js` gains `switchSlot(n)`:** `persist()` the yard standing,
  `openSlot(n)`, then `restore()` and `bootYard()`, then `S.dirty = true;
  persist()` so the new slot has a blob the instant it is entered. `reset`
  and `importSave` need no change: `clear`, `loadRaw` and `saveRaw` already
  go through the store and the store now knows its slot. `blob()` writes
  `savedAt`.
- **`src/slots.js`** is `record.js`'s twin: `slotLabels()` (parse each
  slot's blob for `boulderNo`, `crew`, `savedAt`; a blob that will not parse
  is `unreadable`; none is `empty`), `showSlots(el)` writing the rows, and
  the click wiring including the two-click arm on an empty row.
- **`settings.js`** adds the `saves` pane to `showPane`, the way `record`
  is there; **`index.html`** the button, the page and its `back`;
  **`style.css`** the rows (`.held .slots`, one column, the record's card
  shape).
- **The desk.** `store.cjs`'s `read(slot)` and `write(slot, raw)`: slot 1 is
  `current.json` / `last-good.json` exactly as today; slot *n* is
  `slot-n.json` / `slot-n.last-good.json`. `preload.cjs` and `main.cjs`
  thread the slot through `desk:read` and `desk:write`; `exportTo`,
  `importFrom` and `version` do not change. The migration from the browser
  runs for slot 1 only, exactly as now -- slots 2 and 3 never had a browser
  copy to bring over.
- **`hooks.js`:** `__slot(n)` for the node tier, which is `switchSlot`.

Not built with this: copying a yard from one slot to another (a snapshot
by another name; `save a copy` / `load a save` do it by hand and the sheet
stays small), and deleting a slot from the list (switch in, reset).

### The title page

*Superseded by "The landing page": the title is a page of its own now, and
the held sheet has one front again. Kept as the reasoning it grew out of.*

The game opens playing. There is no front door: the page loads, the yard
is running, and the sheet with the settings on it is somewhere behind
escape. With three yards that is no longer good enough -- the first thing
a player with slots wants to know is *which one is this* -- and a title
page is the answer that every other game gives. So the game opens held,
on the sheet, and the sheet's front says `pebble pit`.

**The title is the held sheet's other front.** The sheet already has a
front (`paused`, `resume`) and pages behind it; the title is a second front
on the same sheet, sharing every button below the fold. What differs is
the word and the top button: `pebble pit` and `play` on the title, `paused`
and `resume` when held. Behind the sheet is the yard, standing still --
the player's own yard, or the two figures of the opening for a new one --
which is the title's picture, and a better one than anything drawn for
the purpose: it is the thing you are about to play.

```
        pebble pit                          paused
          play                              resume
        --------                          --------
   saves · yard 2                     saves · yard 2
   achievements · 3 of 40             achievements · 3 of 40
   settings                           settings
   quit                               title page
                                      quit
```

- **`play`** is `hold(false)`; escape at the title does the same, because
  escape already toggles the hold and a title you cannot get past with the
  key that got you there would be a trap.
- **`saves`** is the slots page above, and carries which yard is open.
  Picking a row switches the yard behind the sheet, on either front.
- **`achievements`** is the record, as today. It is per yard by
  construction: the record reads `S.won`, `S.won` is in the save, and the
  save is the slot's -- picking another yard on the `saves` page is what
  changes the count on this button. Nothing is kept across yards; a notice
  earned in one is not earned in another.
- **`settings`** becomes a page of its own: motion, sound, the volume, `save
  a copy` / `load a save` with the paste, `reset progress`, the keys and
  the build. They were the front page's whole body; a title page with a
  volume slider on it is not a title page, so they go behind one word.
  `reset progress` stays on the settings page, not the front, and erases
  the open slot only.
- **`title page`**, on the held front only, is the way back out of a yard
  that is not the desk's `quit`: it turns the sheet to the title front and
  nothing else -- the yard stays held behind it, so `play` is `resume` by
  another name. On the desk **`quit`** stands on both fronts; on the web
  it has no pane, as now.
- The `said` line sits under the fold on both fronts, so what the store has
  to say on boot -- the desk's fallback, a save from a newer build, a
  yielded tab -- is said on the title, where the boot now stops.
- The one honest sentence (`rocks keep coming. there is no finish line.`)
  stays on the title front and only there.

**Boot.** `main.js` boots the yard as today, then `hold(true)` on the title
front instead of running. A first visit's intro is started by `restore`
and waits under the hold -- the intro is on the yard's clock, and the clock
does not run held -- so a new player's first beat is the first beat after
`play`, not a cutscene under a sheet. The desk's fallback used to be the
one thing that held the boot; it is now a line on the title.

**The harness.** `fast()` in hooks.js skips frames while `S.paused`, so a
title that holds the boot would hold every check and every scene shot.
Every check and every scene starts from a fresh game through `__reset` /
`__seed` (`newGame`, `seedGame` in hooks.js), and that door lets the hold
go: one line, `S.paused = false`, which the frame turns into the sheet
going down. `tools/look.mjs` and `headless.mjs` go through the same door
and need nothing of their own. A check about the title itself is the one
that must not use it, and boots the page to look.

**`showPane` learns membership.** `data-pane` becomes a space-separated
list (`data-pane="title main"` for the buttons both fronts share), and an
element is shown when the list holds the page's name. Today's one-name
elements are a list of one and do not change. This is the system fix over
duplicating the shared buttons on each front and wiring each twice.

Checks, browser tier, group `title` in `src/selftest/settings.js`: a booted
page is held with the sheet reading `pebble pit`; `play` takes it down and
`fast(1)` moves the clock; escape holds and the front reads `paused`;
`title page` turns it to `pebble pit` with the yard still held; `settings`
shows the motion switch and the front does not; `saves` from the title,
row 2, `back`, `play` -- and the intro is standing. Node tier: `__reset`
leaves the game unpaused (the harness door), in `test/slots.test.mjs`.

### As built (2026-09-13)

Built as written, with two things the design did not say:

- **An empty slot boots through `reset`, not `restore`'s no-save arm.** That
  arm is written for a page that has just loaded and starts the intro over
  whatever the last yard left in the fields a save does not carry --
  `introDone` among them -- so stepping from a played yard into an empty slot
  never started the intro. `reset` blanks all of it first, which is what a
  new game is; `switchSlot` reads the slot and takes one door or the other.
- **The desk's migration is slot 1's only.** It keyed off "no file yet",
  which on the desk is also what an empty slot 2 looks like; it now runs only
  for slot 1, whose save the browser's was.

`hold(on, front)` in input.js takes the front to open on; the boot passes
`'title'`. The `title` and `saves page` groups are in
`src/selftest/settings.js`, the rest in `test/slots.test.mjs`,
`test/desk-store.test.mjs` and `test/desk-adapter.test.mjs`.

### Checks

- `test/slots.test.mjs` (node): play a yard in slot 1, `__slot(2)` starts
  the intro with slot 1's blob untouched under its key; play, `__slot(1)`
  brings the first yard back with its rock number and crew; `slotLabels()`
  reads `rock`, `crew` and `empty` right; a reset in slot 2 leaves slot 1
  standing; an import lands in the open slot only.
- `test/desk-store.test.mjs`: `write(2, raw)` lands in `slot-2.json` and
  promotes to `slot-2.last-good.json`, and `current.json` is not touched;
  `read(2)` on a fresh directory is two nulls.
- `test/desk-adapter.test.mjs`: the fake desk grows the slot argument; the
  migration runs for slot 1 and never for slot 2.
- The browser tier, group `slots` in `src/selftest/settings.js`: hold the
  game, press `saves`, press row 2 -- the player's way -- and the intro is
  standing; press `back`, resume, hold again, and row 1 reads `rock` and
  row 2 reads `playing`.

## What the five resources are called (built)

Player-facing, they are **pebbles**, **cores**, **ore**, **crops** and
**sparks**. That is the whole vocabulary, and nothing shown to the player uses
another word for any of them.

They were dust, cores, stone, crop and sparks, which had two problems. "Dust"
and "stone" were describing the same substance at two sizes, so a player who
had both had no way to tell from the names which one the quarry made. And the
yard had a third word in play for things it had already named: a plot's ripe
crop answered `food` to the hover, and the unit of dust was a `grain` -- so the
counter, the books and the tooltip could each call the same stuff something
different.

**The code still says `dust`, `shard` and `spore`.** The keys on `S`, the CSS
classes, the unit keys in `UNITS`, the fields in `SAVED` -- none of them moved,
because they name the thing in the code rather than on the screen, and renaming
a save field is a migration for no gain. The rename is a display-layer rename
only: `BOOKS` in stats.js, `cellLabel` in input.js, and the handful of row
notes and section titles that spelled a resource out in words.

So when reading this document: `shard` in a code sample is the thing the boards
call ore, and `spore` is crops. The two vocabularies are deliberate and the
seam between them is the display layer.

## The noticeboard, and the record on it (built, then amended)

### Amendment — the record moves to the held sheet; the board is the books

Three things, all asked for after living with it:

**The board is pinned between the bench and the front doors.** It was placed by purchase order
like a station, and it is not a station -- it is furniture on the busiest strip of the yard, and
one yard had it out past the school. It is out of `SITES` altogether and centered in the gap the
walk already leaves between the bench and the house (`seatSites`, world.js), so it claims no
slot and the world is no wider for it.

**The record is a list on the held sheet, not a second sheet on the board.** The books answer
"what is the yard earning now"; the record answers "what has happened". Asked at one place they
read as one board with two moods. And the record's rows were built in a board's shape -- they lit
up under the cursor, they carried a note in the price column, they were the shape of a thing you
might buy -- for a list on which nothing is for sale. So the record is written on to the held
sheet (the settings sheet, the one surface that is already not the yard): one plain line a
notice, name left and what earned it right, no hover and no button. Holding the game is what
reads it -- the tick over the board comes down then. The noticeboard's own sheet is the books,
and opens with the first grain banked. `record.js`, `showRecord`; `hold` in input.js.

*Amended again:* the list is a page behind the front of the sheet rather than a block on it. On
the front, where the list stood, is one button carrying the count -- `the record · 3 of 40`, the
honest half of a locked list -- and pressing it turns the sheet over to the list with a `back`
button under it. Forty lines of record between PAUSED and RESUME had made the sheet a page to
scroll before it was a place to stop, and the count is the thing a player checks; the list is the
thing they read once in a while. The sheet always comes up on its front (`showPane` in
settings.js), so resume is always where it was.

**The sprite is on the lattice.** The old slips were laid out at thirteen and a half pixels a
column on a six-pixel grid, which put a hairline gutter between every pair and a lopsided bottom
row, and their number tracked the record, which is no longer on the board. The face is a fixed
arrangement of six pinned sheets -- three across the top, three of unequal width along the bottom
-- in paper tones (`PAPER`, config/notices.js; the heap greys read as dirt against the black
panel), each with a line or two of ink on it. Every edge is a whole cell; the panel is thirteen
cells wide because that is what three three-cell sheets with a cell around each come to, rather
than the sheets squeezed into a panel sized first.

### Amendment — a toast when one lands (built)

The original design said, in so many words, "no toast, no banner, no card sliding in over the
yard": every other thing the game tells you, it tells you with a mark on the ground where the
thing is, and asks you to walk over. That is still how the yard talks about the yard. But a
notice is not about a station; it is about *you*, and the two announcements designed for it --
the tick over the board and a body walking across to read it -- were both signals you would
find later rather than hear now, and in the event neither was ever built: the record went up
with no announcement at all. A player earns "you're a wizard squarey" with the camera on the
tower and finds out the next time they hold the game. The record is the one thing in the game
written in words, and the moment it is written is the one moment worth saying out loud. So the
rule stands for the yard and bends for the record, once, here.

**One card, at the top of the window, for a few seconds.** The card is the record's own card --
`name` on top in the boards' hand, `note` underneath in lower case, the same one-pixel edge --
so what slides in is the thing you will later find on the held sheet, not a third design for
the same fact. It sits centered against the top edge, over the yard and under nothing: the
boards open at the pointer and the held sheet at the center, so the top edge is the one strip
no other surface claims. It slides down a few pixels as it comes and fades as it goes; under
`motion: less` it appears and disappears in place, the way the rest of the page already
answers that switch.

**One at a time, in the order they landed.** A single rock can land several notices in one
frame (`ownhand`, `underminute`, a rung on the rock ladder). Three cards stacked is a pile, and
a pile is read as noise. They queue, each shown for `TOAST_MS` with `TOAST_GAP_MS` between,
and the queue plays through. It is never cut short: a notice that was announced and one that
was not are different things to the player, and the queue is what makes every notice get its
beat.

**It is a button, and pressing it is "show me".** Decided on the sheet, against the first
draft's "dismissed by time and nothing else": the one thing a player wants from a card that
says they did something is to see it written down, and the sheet is one press away. Pressing
the card holds the game and brings the held sheet up turned to the achievements page rather
than its front -- `hold(true)` and then `showPane('record')`, so the sheet is opened the one
way it is ever opened and the page is turned after. It carries no close: it goes by itself.

**The tick and the walk are dropped,** also decided on the sheet. They were the original
design's two announcements and neither was built; the toast is now the one. What is kept is
the bookkeeping under them -- `wonSeen`, `unreadNotices`, `markNoticesRead` -- because holding
the game still reads the record and the count of what has not been looked at is still a fact
about the yard, whether or not anything in the yard shows it. The toast itself marks nothing
read; pressing it does, by way of `hold`.

**When it is silent.** The veteran save's catch-up (`catchUpNotices`, `earn(key, quiet)`)
never toasts -- thirty cards in a row is the feature introducing itself by shouting, which is
the exact thing the quiet pass was built to avoid. A yard being reset or restored starts the
line empty: what was earned before this sitting is on the sheet, not in the air. All three go
through one call, `hushNotices`, which moves `wonShown` to the end of the record; there is one
line that knows what silence is. While a cutscene has the camera (`cutsceneRunning`) the line
holds, and plays once the camera is given back, because a card over a cutscene is a card over
the one thing the game has asked you to watch. Held, the clock does not move, so a card that
was up stays up under the sheet and comes down when the game does.

**Where it lives.** `src/toast.js`, in the browser shell beside `record.js` and `settings.js`
-- DOM, so nothing in the simulation frame knows it exists. It keeps no line of its own: what
is waiting is whatever `S.wonAt` places after `S.wonShown` (`EPHEMERAL`), read again each
frame, so a yard starting over (which empties `wonAt`) or a hush (which moves `wonShown` up)
empties the line without the module being told, and nothing said is ever a thing the record
has forgotten. That is one read of state the record already keeps and no second place that
knows how a notice is earned -- the same seam `unreadNotices` uses. Called from `frame()` in
`main.js`, after `hud()`, on the game's clock, so a check turning the handle sees the card go
up and come down on the game's seconds. `TOAST_MS` and `TOAST_GAP_MS` in `config/notices.js`,
both `TUNABLE`.

**What it must not become.** Not a place for anything but the record. No "rock cleared", no
"rung bought", no "a body came of age" -- every one of those has a mark in the yard already, and
a toast for them is the spreadsheet with a picture on top that the whole game is built against.
The bend is for the forty-two notices, and the file is named for them.

**Checks.** Browser tier only -- it is DOM. Four groups in `src/selftest/settings.js` (the
held sheet's file, where the record's checks are): *a notice landing is said out loud, in the
record's words* -- the rock clicked and the chips hauled, so the first grain is earned the way
a player earns it, and the card says the first to land and then the grain in its turn (the
opening lands a core and a hire before the grain does); *several landing at once are said one
at a time*; *pressing the card holds the game on the achievements page*; *a record that was
already written is not said again* -- a quiet earn and a save coming back both say nothing.

### The original design


The yard has kept a great many facts about itself since the first rock and has
never once said any of them back. `banked` counts every grain that ever went in
the hole; `boulderNo` counts the rocks; a body carries its own name, its age and
what it has mined, quarried, farmed and stored. None of it is shown anywhere. The
books over the pit mouth are the one exception, and they only report the last
thirty seconds.

So: a board in the yard that says what you have done. Not a currency, not a
ladder, not a rung -- a record.

### The bargain

**Recognition, and nothing else.** No notice pays out, no notice unlocks a row,
no notice makes anything faster. This is the one decision the whole feature hangs
off, and it is the same bargain the crew's own records already strike (see
`records.js`: "None of it does anything -- no number here feeds a rate"). A yard
of fifty little payouts is fifty balance decisions, and every one of
them turns into a number you buy once and stop thinking about -- the thing the
sky rule already refuses. A record that pays is a quest log. A record that does
not is a record.

What it costs the player is therefore nothing, and what it is worth is that the
game noticed. That has to be enough, and it is only enough if the things
recognized are things worth noticing -- which is what makes the catalog below the
part of this document to argue with, rather than the mechanism.

### Where it stands

**A noticeboard, between the work bench and the houses.** One row in `SITES`
(`config/sites.js`), placed between `buildbench` and `house`, so the walk reserves
its ground from the moment the table names it -- like every other station, whether
or not anything has been earned yet.

That spot is chosen and not arbitrary: it is where the crew already pass. The
houses are where they live, the bench is where they are kitted, and the strip
between the two is the busiest ground in the yard. A board nobody walks past is a
board nobody reads.

**The books move onto it.** The income sheet is currently the only board in the
game with no building under it -- an invisible ten-by-five rectangle at the near
lip of the pit (`booksRect` in board.js), with a hand-tightened hit patch because
the ordinary eight cells of padding reach into the rift's air. That was the best
available answer while the books had nowhere to live. They have somewhere now.
`standAt.stats` becomes the noticeboard's rect, `nearStats` becomes the ordinary
`near()` every other station uses, and `booksRect`, `BOOKS_STAND_W` and
`BOOKS_STAND_H` are deleted. The tight patch and the rift no longer have to be
kept out of each other's way, because they are no longer in the same place.

**Two sheets, one board**, exactly as the house already does it: the house board
carries the crew, and the list of names opens off it (`crewListOpen`,
`buildCrewList`). The noticeboard carries the income books, and the record opens
off it the same way. Nothing new is invented for this -- it is the second use of
a mechanism that already has one.

**It is not bought.** No core price, no row on the bench, no unlock. Recognition
is not for sale, and a board you have to pay to be told what you have done is the
feature disagreeing with its own bargain in its first minute. It goes up the way
everything here goes up -- somebody builds it -- the first time a notice is
earned, which in practice is the first grain in the hole. A free `place`-sized
work in `S.works.yard`, a builder walks over, and the board stands. Nothing
teleports and nothing is charged.

### What a notice is

One object, in the shape the boards already read:

```js
{ key:  'firstcore',
  name: 'a core in the hole',
  note: 'bank a core out of a broken rock',
  when: () => S.seenCore }
```

**The note says what you did to earn it.** Not a remark about it, not a joke at
its expense, not a line of flavor -- the plain thing you had to do, in the words
the yard would use. A record that comments on itself is a record you stop
trusting: the first time a note is a quip rather than a fact, every other note
becomes a thing to be read twice, and the sheet stops being the one place in the
game that tells you plainly what happened. It is also the only wording that is
any use to the player who has *not* earned a notice yet and is trying to work
out what it wants.

`name` names the moment and may be as plain or as pointed as it likes -- "the
hole turned a grain away" is a title. `note` is the requirement, and is never
anything else.

`when` is a predicate over the game, asked a couple of times a second by the same
sampler that already drives the books (`sampleBooks`), never per frame. Forty-odd
predicates at two hertz is nothing; forty-odd at sixty hertz is a thing to
measure, and there is no reason to find out.

**A rule reads a standing fact, or it declares its witness.** Most of the catalog
below is free: the fact is already on `S` and the predicate is one comparison. A
feat that cannot be read off a standing fact -- "cleared a rock without hiring
anybody" -- needs somebody to have been watching, and the answer is **one** saved
object, `S.tally`, whose keys are bumped at the one place the event happens. A new
witness is a key in that object and a line at the event site; it is never a new
field on `S`, and it is never a second place that knows about achievements. The
alternative -- a counter per feat, scattered across fourteen modules -- is the
hand-cut-constant-per-case bug wearing a different hat.

Three fields are saved, and all three go in `SAVED`: `S.won` (the keys earned, an
array), `S.wonAt` (when each landed, so the sheet can read newest first), and
`S.tally`.

### How one announces itself

**The bobbing tick over the station, and nothing new.** `drawDoneMarks` already
draws exactly this signal for exactly this reason: "a rung usually lands while you
are looking somewhere else, and the bar coming down is a signal made of nothing
happening". A notice landing is the same event -- something finished while you
were looking at the rock -- so it wears the same mark, over the noticeboard,
until you go and open it. `doneMarkAt` derives the spot from the station, so the
noticeboard is covered by being a station.

No toast, no banner, no card sliding in over the yard. Every other thing this
game has to tell you, it tells you by putting a mark on the ground where the thing
is, and asking you to walk over. This is not the one to break that with.

**And a body walks over,** decided on the sheet: when a notice lands somebody
comes from the houses, stands at the board for a beat, and goes back, the way
the crew already dance when a rock comes down (`danceUntil`). It is the most
in-register version of "the yard noticed" that this game could have, and it was
offered here as the first thing to cut if it got expensive. It is not being cut.
The tick stays as well: the walk is what happens, the tick is what waits for you
while you are looking somewhere else.

### What the sheet shows

**What you have done, and how much board there is left.** Earned notices, newest
first, each with its name and its note. Under them, one line: `14 of 42`.

Unearned notices are **not named** -- decided on the sheet, not merely proposed.
That is the rule the whole game already follows: the books show only currencies
you have seen, the counter names nothing you have not met, and a locked list is
that rule broken forty times over in the one place a new player will read a
sheet end to end. It also spoils the rock, because half the catalog is a thing
you have not yet found out is in here.

It is one predicate on the row's `show` either way, so it stays cheap to revisit
on a played yard -- but it is settled, and the build goes this way.


### What is recognized — the approved catalog

**Forty-two notices, approved 2026-09-10.** Ten of the fifty-two proposed were
struck off on the sheet and are gone rather than parked: `everything the sky
threw, answered`, `five rocks`, `the hole filled before the cut was opened`,
`the yard buried`, `spotless, with nobody sweeping`, `a crit streak`, `broke,
having been rich`, `one body that has done every job`, `the yard's best hand`
and `ten hours on one clock`. The names and notes below are the approved
wording, verbatim -- they are not a draft to be improved on the way into code.

Three kinds, and deliberately not a fourth. **Not** one notice per station
opened, per trade taught, per tonic brewed: a completionist map of the game's
own menu is a checklist of purchases, and the yard already has a board that
lists what you have bought. A notice is about something that *happened*.

**What happens on its own** — seventeen, every one a standing fact on `S`.

| notice | note | reads |
|---|---|---|
| makin money | throw a pebble into the pit | `banked > 0` |
| better keep digging | clear the first rock | `boulderNo >= 2` |
| you saved your sqwife | no more rocks, you did it. | `rescued` |
| something was inside it | bank a core out of a broken rock | `seenCore` |
| you've constructed additional pylons | build another house | `crew >= 1` |
| the first ore | bring ore up out of the quarry | `seenShard` |
| cultivation | grow your first crop | `seenSpore` |
| magic in the air | earn your first spark | `seenSpark` |
| the pit is full | fill up the pit | `seenFullPit` |
| the rift torn, storage is solved | fill the pit causing an inter-dimensional rift | `riftOpen` |
| the rift has gotten bigger | a whole ocean of inter-dimensional storage. | `drowned` |
| conjure a star | call a star down from the tower | `meteorOpen` |
| you're a wizard squarey | finish a wizard hat at the tower | `wizardHats >= 1` |
| hello, potion seller | brew a batch at the apothecary | `brews >= 1` |
| first day of school | send somebody to the school and teach them a trade | any of the four trade counts |
| educating the masses | teach every trade there is to teach | all four at their cap |
| building complete | you built everything | the `*Open` flags, all of them |

**Numbers, for the long tail** — eighteen. Every threshold is a placeholder
wanting a played yard and the dev panel: an `export let` with a `TUNABLE` row.

| notice | note | reads |
|---|---|---|
| ten rocks | clear ten boulders | `boulderNo >= 10` |
| twenty-five rocks | clear twenty-five boulders | `boulderNo >= 25` |
| fifty rocks | clear fifty boulders | `boulderNo >= 50` |
| a hundred rocks | clear a hundred boulders, thats a lot of rocks | `boulderNo >= 100` |
| ten thousand pebbles | bank ten thousand pebbles | `banked >= 1e4` |
| a hundred thousand pebbles | bank a hundred thousand pebbles | `banked >= 1e5` |
| a million pebbles | bank a million pebbles | `banked >= 1e6` |
| ten million pebbles | bank ten million pebbles | `banked >= 1e7` |
| a hundred million pebbles | bank a hundred million pebbles | `banked >= 1e8` |
| five squares | hire a crew of five | `crew >= 5` |
| ten squares | hire a crew of ten | `crew >= 10` |
| twenty five squares | hire a crew of twenty-five | `crew >= 25` |
| fifty squares | hire a crew of fifty | `crew >= 50` |
| a thousand ore out of the cut | dig a thousand ore out of the quarry | `quarryTotal >= 1e3` |
| ten thousand ore | dig ten thousand ore out of the quarry | `quarryTotal >= 1e4` |
| a million through the rift | send a million pebbles through the rift | `riftAte >= 1e6` |
| a hundred batches | brew a hundred batches | `brews >= 100` |
| an hour on one clock | keep one body on the payroll for an hour | `records.lived`, the eldest |

**Feats you would have to set out for** — seven, and where the work is.

| notice | note | reads |
|---|---|---|
| nobody hired | clear a whole boulder with nobody on the payroll | `boulderNo` steps while `crew === 0` |
| your own hand alone | clear a boulder without a single worker touching it | witness: no worker mined this rock |
| never touched it | clear a boulder without swinging at it once yourself | witness: no swing of yours this rock |
| a rock off in under a minute | clear a boulder in under a minute | witness: the stamp of the last step |
| every job staffed at once | put at least one body on every job at once | every count in `JOBS` above nought |
| we're so back | win 50k in a single spin at the casino | a hand settles paying 50k or more |
| time to get a loan | lose a 50k stake in a single spin at the casino | a hand settles taking a stake of 50k or more |

The two casino notices were a *streak* -- hands won or lost one after another --
and they are a single spin now, at 50,000. A streak is the wrong shape for that
room: the table is one big decision repeated, so what you remember about it is
the size of the hand rather than how many of them went your way, and a run of
small wins is not a story. The 50,000 is a placeholder like every other
threshold here.

### What the ten cuts did to the cost

Striking off ten notices took most of the bookkeeping with them, which is worth
saying plainly because it changes what building this is:

- **Three tallies, not eleven.** Only `your own hand alone`, `never touched it`
  and `a rock off in under a minute` need anything remembered between frames --
  two per-rock flags and one stamp, all three cleared when a rock lands, all
  three about the same event. `a crit streak` and `broke, having been rich`
  were the two that wanted counters of their own, and both are cut.
- **The casino pair needs no tally either.** A hand settling for 50k or more is
  marked earned where it settles: the notice list is already the record, so
  there is nothing further to keep. That is an event hook, not a counter.
- **`nobody hired` is an event hook as well** -- the frame `boulderNo` steps,
  ask what the payroll is.

So the whole of the "somebody had to be watching" half of this feature is one
small object cleared once a rock, plus three lines at three event sites. Thirty
of the forty-two are one comparison against a field that is already on `S`.

### The veteran save

The first load after this lands is the one interesting case: a yard forty rocks
in satisfies thirty rules at once, and thirty ticks and thirty notices is a
feature introducing itself by shouting. So on that first load every rule is
evaluated **silently** -- earned, stamped, and marked already read. No mark, no
walk, no beat. You open the board and find your record already written, which is
what it should say: these are things you did, and the board is late, not you.

That is one flag and one pass, and it is the same shape as the migrations
`persist.js` already runs for `banked` and `riftAte`.

### What it must not become

- **A payout.** See the bargain. If a notice ever pays, the catalog stops being a
  question about what is worth noticing and becomes a question about balance,
  and it never comes back.
- **A second scoreboard.** The books say what the yard earns; the record says what
  it has done. A rate does not belong on the record sheet and a lifetime total
  does not belong on the books.
- **A reason to add a counter.** Every rule reads a standing fact, hooks an event
  that is already happening, or bumps a key in the one tally. The moment a notice
  wants a field of its own on `S`, the notice is wrong, not the rule.

### The three calls, decided

All three were open when this was written and all three came down on the sheet:

- **The locked list: counted, not named.** An unearned notice is not named on
  the sheet; the count says how much board is left (`14 of 42`). This is the rule
  the books and the counter already follow -- nothing in this game names a thing
  you have not met -- and it keeps half the catalog as something you find out is
  in here.
- **The walk: somebody walks over.** When a notice lands a body comes from the
  houses, stands at the board a beat, and goes back, the way the crew already
  dance when a rock comes down. It was the flourish this design offered to cut
  first if it got expensive; it is not being cut. The bobbing tick over the
  station stays as well -- the walk is what happens, the tick is what waits for
  you.
- **A body's own record: on the crew list.** `records.js` has kept a name, an age
  and four counters per body since the crew were made people, and none of it has
  ever been shown. It goes on the crew list off the house board, where the
  question "who is this" is already being asked -- not on the record sheet, which
  is about the yard rather than about any one of them. That is its own piece of
  work and is not part of building this.

### The tally, and the ground under the board (built)

Two things that came after the record went up.

**A second section on the books: the tally.** The books say what is coming in this half minute
and the record says which moments have happened, and neither is allowed a
lifetime total -- so the yard went on keeping a dozen of them without saying
one back. `the tally` sits under the income: rocks cleared, pebbles banked, ore
dug, pebbles through the rift, batches brewed, hats finished, bodies on the
payroll, notices earned, and the longest any one body has been on one clock.
Every figure is read straight off `S`; nothing is measured, eased or newly
counted, and every row names a thing only once you have met it, the rule the
books and the counter already keep. It lives in `stats.js` beside the income
rows, in the same row shape, so the board needed no second kind of row.

**The house owns the board's ground.** The board stands in the walk between
the front doors and the bench, and a walk is one `STATION_GAP` of bare ground:
eleven cells of board in twenty cells of walk left four and a half either side,
and it read as leaning on the house. The house row in `SITES` now carries
`furniture: () => BOARD_W`, and `padOf` pads a site by its furniture the way it
pads one by its heap -- so the gap the board is centered in is the walk plus
the board, and the ground either side of it is a walk's worth. The world is
eleven columns wider for it, which is the board's own width and no more.

## The cutscenes, fleshed out (built)

There are two cutscenes in the game and one opening, and between them they
cover three of the yard's one-time beats. The rest — five shields, each
answering a rock exactly once, and the two of them walking out to where the
story starts — happen where the camera happens to be. A shield failing is the
most expensive thing the player has bought in the game so far, and it goes off
in the corner of the window if the view was on the farm. The ask is that every
one-time beat is *shown*: the opening starts at the house, and every shield's
answer is a cutscene.

### The opening starts at the door

Today the two squares are stood at the landing spot from the first frame, with
the view pulled in on them. They came from nowhere, which is the one thing
this game never lets anybody do. So the opening gets a beat in front of the
one it has: **the two of them come out of the house and walk over to the
rock's ground**, and the chat, the crush and the rest play exactly as built.

**The house stands before the crew does.** `cubes` in house.js draws no rooms
at all while `S.crew` is nought, so at the start of a fresh game there is no
house to come out of. The rooms it will draw once somebody is hired are the
doorway and one room to live in — two rooms for the first body — and those
are the two the pair live in. So the house is drawn with its first two rooms
from the first frame of a fresh game (`n = 2` while the opening runs, as well
as when `S.crew > 0`), and the crush changes nothing about it: the one left
standing becomes the crew of one, whose house is the same two rooms. Building
is additive, and this is the same rule read from the other end — the rooms
were always there; hiring adds to them.

**The walk.** A new phase, `leave`, before `chat`. The pair are made at the
door (`doorAt()`), a body's width apart, and walk to `pairX(0)` and `pairX(1)`
at `COMMUTE_PACE` — the pace anybody crosses the yard at, no story pace. The
door is about a thousand pixels from the spot, so the walk is about four
seconds -- the opening's one stretch of nothing but walking, and it is the
length the yard's own pace makes it. They talk as
they go: the same dots, the same turn-taking, the heart on its own clock —
`talking`'s speech is lifted into a helper both phases call. `chat` begins
when the second of them arrives; `INTRO_CHAT_MS` is unchanged, so the whole
opening is longer by exactly the walk.

**The camera** starts pulled in (`INTRO_ZOOM`) on the door and walks with
them — `camX` tracks the pair's midpoint each frame, the way `show` walks
with the body that carries the first grain — and is stood still on `S.cx`
from the moment they arrive, which is where `hold` already puts it. Under
reduced motion the view is the arrival framing from the first frame: the pair
walk into a still shot, the way every reduced-motion beat is watched from
where it ends.

`skipIntro` skips the walk the way it skips the chat: the crush happens at
the spot with the pair put there. The opening's checks (`intro.test.mjs`)
gain one: the pair start at the door and the first rock lands on the spot,
not the door.

### Every shield's answer is a cutscene

The five answers — the timber come straight through, the net paying out, the
arch catching and cracking, the jack shoving and buckling, the dome holding
while somebody walks out — are the story's whole spine, and four of them cost
the player a currency. Each is a one-time event by construction: a failed kind
goes into `shieldsDone` and its row never returns, and the dome's first hold
is the one that carries the rescue. They are exactly what `cutscene.js` was
built for, and they become entries in it rather than a second mechanism.

**The trigger is the rock leaving the sky, not the rock arriving.** The timber
breaks on the frame the rock reaches it, so a camera that goes on the answer
sees a wreck. The scene starts when a rock begins to fall (`S.rockFall` goes
from nought to more) while a finished shield stands (`shieldUp()`), so the
glide in happens under the fall and the view is stood on the spot before the
rock meets the thing. Watched, not called, like the gulp: shield.js does not
learn that a camera exists.

**Once per kind.** The four that fail can only answer once. The dome answers
every rock after the first; only its first hold — the one with the rescue in
it — is a scene, and the fact that says so is `S.rescued`, which already
exists. A save from before this design comes back with its shields where they
are: a kind in `shieldsDone` never plays, a dome that has already rescued
never plays.

**A scene ends when the answer is over, not on a timer.** The tear and the
drowning run a fixed number of seconds; a shield's answer has a length the
game decides — the net sags for as long as `NET_SLOW` takes, the jack holds
`JACK_HOLD_MS` and then shoves `JACK_PUSH` at `JACK_PUSH_RATE`, and the
dome's first hold waits on somebody's walk. So `cutscene.js` gains a scene
kind whose end is a fact rather than a duration: a shield scene releases a
beat (`CUT_SHIELD_TAIL_S`, ~1.5 s, so the wreck is seen flying out along the
heap) after `S.shield` is gone, or, for the dome, after the rock has been set
down (`S.rockFall === 0 && !S.rockHeld`). A ceiling (`CUT_SHIELD_MAX_S`,
~30 s) is a safety, never the design.

**The framing** is one rule for all five: centered on the shield's span
(`S.shield.x + S.shield.w / 2`), with the ground line low in the frame
(`CUT_SHIELD_GROUND`) because everything watched here happens above it. The
pull-in is *measured*, not fixed: the span, the rock over it (and, for the
jack, as far up as the rams shove it) and a little sky fill `CUT_SHIELD_FILL`
of the window, and the zoom is whatever makes that so, never closer than
`CUT_SHIELD_ZOOM`. A fixed step was tried first and cut the arch's crown off
the top of the frame -- the shields are of five different heights, and a
constant cannot be right about all of them.
The rescue is the one beat that already moves the camera on its own
(`lookAt(S.rescueTo)` in `startRescue`) — that pan yields to the scene, which
is on the same spot anyway, and the intro.js note that pulling in on the
rescue "would say *watch this*" is retired: the user's call is that it should.
The camera stays on the span rather than following the walker; the walk out
from under is a few body-widths and stays in frame at 1.5.

**What is not a scene:** a shield going up. The build is labor at a fenced
site — the thing you bought is being made by somebody you can watch — and it
is long, and it is not one-time in the way the answer is. The *unfinished*
shield smashed by a rock that comes early is not a scene either: it is a
mistake, not a beat, and nothing should reward the camera for it.

**Skipping and saving** are as built: any click releases the camera and never
the moment; `cineOwed` carries the scene's name across a reload and the
answer resumes from the saved `S.shield` and `S.rockHeld`, so the owed scene
plays over the answer as it stands.

### Shape

- `config/rift.js` → the cutscene numbers move to a `config/cutscene.js`
  (`CUT_TEAR_*`, `CUT_DROWN_*` join `CUT_SHIELD_ZOOM`, `CUT_SHIELD_FILL`,
  `CUT_SHIELD_GROUND`, `CUT_SHIELD_TAIL_S`, `CUT_SHIELD_MAX_S`), since they
  are no longer the rift's.
- `cutscene.js`: a scene is an entry in a table -- length, zoom, spot, and
  for the shields an `over` fact and a tail; the trigger watch grows a second
  clause on the rock leaving the sky under a finished shield.
- `intro.js`: the `leave` phase, `pairX` unchanged, the pair made at the door;
  `hold` walks `camX` with the pair during `leave`.
- `house.js`: `cubes` draws two rooms while the opening runs.
- No new field on `S`: `S.intro === 'leave'` is a phase of a saved-by-hand
  field that already exists, and the scene names are strings in `S.cine`.

### How it is checked

Node tier: `test/cutscene.test.mjs`, new — for each of the five kinds, the
yard is stood at that shield built (the `shieldBuilt` setup in scenes.js is
the recipe), the next rock is thrown, and the check asserts a scene named for
the kind is running while the rock is in the air, the camera is on the span,
the yard never paused (a walker keeps walking), and the scene releases after
the answer with the camera glided home; a second throw at the dome runs no
scene. The opening's checks in `rock.test.mjs` and `motion.test.mjs` gain the
door and the `leave` beat. Then the shots: the `props!` … `dome!` and
`rescue` scenes in tools/look.mjs run the dance through and show the scene's
own framing, and `opening` starts at the door — with a `leaving` scene beside
it.

## Scenes: every part of the game, one press away (built)

Built 2026-09-11: `src/scenes.js` (the list), `src/scenesheet.js` (the block on
the held sheet, the kept save, `__scene` / `__scenes`), `tools/look.mjs`
asking the page. Ninety-nine scenes under fourteen parts. Checked by
`test/scenes.test.mjs` (the list), `test/scenes-stand-{a..e}.test.mjs` (every
scene that does not need the page stands a yard up, split five ways because
each is a real yard and the lot is seven minutes) and the `scenes` browser
group (the block, the press, the save byte-identical). Two calls made in the
build: the node yard's snapshot has no `houses` or `craft`, so `houseboard`,
`balloon` and `brolly` are marked `page` and left to the shot; and the sheet's
line-list check reads the block as one line, "the scenes".

**The ask.** The game is big enough that finding a feature by playing up to
it is an hour's work, and a feature nobody can reach is a feature nobody
looks at. There should be a scene for every part of the game -- the rock and
its shack, the crew, the cut, the plots, the apothecary, the school, the
house and its sky, the tower, the casino, the pit and the rift, the shields,
the endgame -- and pressing one should stand the yard at that place, ready to
be played, watched and broken.

**The rule.** One list of scenes, written once, read by both of the things
that want a scene: the shot tool (`tools/look.mjs`) and the sheet in the game.
A scene is a fact about the game, not about either tool, so it lives with the
game: `src/scenes.js`, dev-only, and the two readers ask it rather than
keeping lists of their own. Today there are two lists that cannot see each
other -- ninety scenes as strings in `look.mjs`, three story beats and the
shields as buttons in `dev.js` -- which is the same defect the boards had
before `UPGRADES` was the one list a row is on.

**What a scene is.** A name, the part of the game it is about, one plain
sentence, and the setup:

```
rock: { about: 'the rock', say: 'the gang on the crest, the shack beside it',
        run: () => { window.__reset(); window.__crew(3, 2); window.__shack(); ... } }
```

`run` is a function, not a string, so it is checked when the file is read and
reads like the rest of the code; the `__` handles it calls are the ones the
checks use (hooks.js), which is what makes a scene exactly what you would
have typed into the console. Every scene starts from `__reset()`: a scene is
a place in the story, not whatever yard was standing when the button was
pressed -- the dev panel's beats already say so, and it holds for all of
them. The list is `SCENES`, keyed by name, and the parts are `ABOUT`, an
ordered list of the headings, so a scene about a part the list does not name
is red in `test/scenes.test.mjs` rather than orphaned under nothing.

**The sheet.** The held sheet is the one surface that is not the yard, and it
is where the settings went for the same reason; scenes go under them, below
a rule. One heading per part in `ABOUT`'s order, and under each a row of
buttons, one per scene, drawn in the sheet's own buttons -- black on white,
the pixel face, nothing new. Pressing one runs the scene, closes the sheet
and lets the clock go, so the yard is standing where the scene says with
the player looking at it. The markup is not in `index.html`: `scenes.js`
appends its own block to `#held` when it is imported, and it is imported
from the `import.meta.env.DEV` block in `main.js` beside `dev.js`. A build
has no scenes section because it has no scenes module, which is one gate
rather than two, and it is the gate the dev panel already stands behind.

**A scene never touches your save.** The sheet is reachable on the player's
own game, and a scene is a fresh yard, so pressing one on port 5183 would put
a synthetic yard over an evening's play. So: the first scene pressed in a
page copies the store's blob aside (`boulder-clicker/v4.kept`), sets
`S.staged` (ephemeral) and `persist()` declines while it is set -- the one
line, beside the `fatal` and `yielded` declines it already has. The sheet
grows a `my yard` button while staged; pressing it puts the kept blob back,
clears the flag and restores. Reloading a staged page comes up on the kept
save, because nothing was ever written over it. A scene is a place you
visit, and the yard you left is where you left it.

**The shot tool reads the same list.** `look.mjs` stops carrying scenes.
`window.__scene(name)` (published by scenes.js on the same DEV window as the
other handles) runs one, and `window.__scenes()` returns the names by part,
so `node tools/look.mjs rock --zoom 4` is the same command with the scene
looked up in the page instead of the file, and `--list` prints what the sheet
would show. The comments that explain *why* a scene is set up the way it is
-- the sky that has to fall into place for eight seconds, the flag shot
partway through the hoist -- move with the scenes; they are the valuable part.

**What goes.** `SCENES` and `SHIELDS` in `dev.js` and the two rows that draw
them: the sheet draws the same beats under "the story" and "the shields". The
dev panel keeps its knobs, its hires, its sky and its clock -- those are
dials, not places. `SCENES` in `look.mjs` goes with it.

**The parts, and the scenes that go under each** -- the existing ninety,
sorted, and the gaps filled so that every part has at least one:

- the story: opening, reunion, landing, the intro beats
- the rock: rock, shack, shackrock, shackwork, crest, core, crit, flank
- the crew: crew, assign, dance, belt, marks, apron, loo, kit
- the bench: call, benchup, bench, build, fitting, buildboard, sitebars
- the cut: quarry, plume, laddersdeep, quarryboard
- the plots: farm, farmboard
- the apothecary: apothecary, potwork, apothpots, apothshelf, apothpick, apothbuff, keeper
- the school: schoolbar, schoolboard, shelf
- the house and the sky: scrubbing, houseboard, sky0-3, rain, brolly, balloon, moored
- the tower: towerflag, flag, flaghoist, aura
- the casino: casino
- the pit and the rift: rift, grown, rim, drown, tear
- the shields: props, net, arch, jack, dome, and each one's rock, and the rescue
- the endgame: endgame, books, notices

**The bargain.** Nothing for the player: none of it ships, and the sheet they
hold is unchanged in a build. For the work, one list instead of three, and a
scene that is written once is a button, a shot and a check fixture the same
day. What it costs is that `look.mjs` needs the page to know a scene's name,
which it did not before -- and that is the right way round: the page is the
game.

**Checked by** `test/scenes.test.mjs`: every scene names a part in `ABOUT`;
every part has a scene; every `run` leaves the yard standing (no throw, one
second runs); and, through the sheet, a scene pressed on a page with a save
leaves the store's blob byte-identical and `my yard` brings it back.

## Every station's work is done by a spare hand (design, not built)

**The shack's slice is built (2026-09-10).** `shack: JOB.BUILD` in `SITE_JOB`;
the rock is out of `SHED_OF` and `ARRIVED`; a rockhand's step is its own
again. A pick is fitted by a hauler off the dust and the rock's gang swings
throughout. Player report: bodies stuck on the walk to the hut. The quarry, the
farm and the apothecary still keep the shed claim, and the standing rule at the
house, the tower and the school is untouched -- the rest of this section is
still the plan.

**The rule.** A row bought at any station -- a rung, a hat, a trade, a pot, a
multiplier -- is a piece of work, and the body that does it is a spare hand:
one of the haulers, walked over from carrying dust, standing at the station
while the bar fills, and walking back to the dust when it lands. It is the
yard's own rule for the bench and the ground (`rebalance`, upgrades.js),
applied to every site there is. Nothing about the station's own gang changes:
they go on digging, farming, swinging, stirring, scrubbing and casting the
whole time, and none of them credits the bar.

**What it replaces.** Two rules, and a defect in each:

- The shedhand rule (wave6-sim item 2): the quarry, the farm, the shack and the
  apothecary each *claimed one of their own gang* to the shed for the
  duration. The bargain was honest -- a producer stops producing -- but the
  claim could stall for good. A rock gang capped at one by the ram, or a
  one-body gang with a load in its hands, never gets a body that qualifies
  (`shedhand.js:73`), so the row takes your spores and sits at nought for the
  rest of the run. Four critics found it independently
  (`docs/critics-2026-09-10.md`); it kills the ram.
- The standing rule: the scrubbing house, the tower and the school credit a
  body at its post, and the post is where it works, so the fan ladder fills
  while the house scrubs and the hat rises while the wizard casts. That is the
  "rungs for free" defect in TODO.md, diagnosed and left for a balance call.

One rule closes both. A spare hand is a real cost -- a hauler off the dust for
the duration, which you can see -- and it is a cost that is always payable,
because carrying is the job nobody is assigned to and the yard borrows the
nearest station body when nobody is carrying (the fallback the bench has
always had; it is deliberate and it stays).

**What goes.**

- `crew/shedhand.js`, the claim (`w.onBuild`, `w.atShed`), `SHED_SITES`, and
  the `stepShedwork(w) ||` in front of four trades' `work` in crew/jobs.js.
  The tenders' and the commute's references to the claim go with it.
- `SITE_JOB` in works.js. It said which gang's presence credits each site, and
  the answer is now "the builders" for every site, so the table is a constant
  and `builderManned` is `true`. `SITES` stays as the list of places a work
  can be at. `noGang` goes: a station with nobody in it is now the same case
  as a station full of people.
- The `ARRIVED` table in crew/muster.js, which counted the gang for
  `handsAt`. `handsAt(site)` is the number of builders standing at the site,
  capped one per work, as it already is on the yard.
- The teacher. The school's trades and hats were its whole job (wave6-sim
  item 1 put it there so the school stopped depending on whoever was spare),
  and under this rule that is exactly who does them. The job comes off `TYPE`,
  `JOB`, the roster, the kit table, `SAVED`, and the save is migrated: a save
  with teachers on it puts them back on carrying. `crew/teacher.js` is
  deleted.

**What stays, and is checked.** The bar over the station (`barSpot`); the
builder's walk to the station's own front (`siteX` → `footHook`, which is what
lends a builder to an empty tower today); one body per work; the swing at
`w.y`; the lent body walking home when the last site clears; `stalled(site)`
for a site with a work and nobody at it, which is what the mark on the row
reads. Every existing "worked at the shed, by the gang" check turns into
"worked at the station, by a spare hand" -- the same walk, the same bar, a
different hat on the body -- and each of them still buys the row the way a
player does.

**The bargain, stated.** An upgrade costs the yard one carrier for the
duration. A yard with no spare carriers pays with its nearest producer
instead, visibly, and gets it back. A one-body station is never stalled by
its own upgrade, and no station gets its rungs for nothing.

## The queue (built)

**The owner's word (2026-09-12):** instead of every row at a busy site reading
`busy`, a queue. Unbounded. Paid on press, as today. A queued row can be pulled
back out for a full refund until somebody has hands on it. And the queue is
shown -- as a floating card in the viewport, not on a board and not on the
held sheet.

### What it overturns, and why

"One work per site, and it is not a queue" has been works.js's opening line
since the lab. The bargain it struck was that waiting is a decision: you buy
strength, watch somebody fit it, *then* choose swing. The construction bench's
queue was scrapped for the same reason ("nobody wanted the queue").

The premise no longer holds, and it is worth saying which half. The decision
was never the *wait*; it was the *spend*. With the coin taken on press, what
you queue is coin you no longer have, and that is the whole of the choice --
the same choice a one-at-a-time board offered, made once instead of every ten
seconds. What one-at-a-time actually produced, on a yard with six sites and a
purse that fills faster than a builder walks, is a board you come back to on a
timer to press the next thing. That is a chore with a decision's costume on.

The queue keeps the spend as the decision and drops the timer. Nothing about
*who builds it* changes: one body per site's work, the nearest lent when nobody
is spare, an empty cut building nothing. A queue does not staff itself.

### The rule

- `S.works[site]` is already a list, oldest first. It grows without bound. The
  front `roomAt(site)` entries -- one, everywhere, since no site registers a
  room -- are **on the go**; the rest are **in line**. That is the whole of the
  data model: no second list, no new field on `S`, nothing new in `SAVED`.
- A work in line is at nought. It has no bar, no fence tape, no builder walking
  to it, no rising building. `stepWorks` shares hands over the on-the-go
  entries only; `siteFor` (builders.js) and the `handsAt` cap (muster.js) see
  the on-the-go entries only. Two helpers in works.js, `onTheGo(site)` and
  `inLine(site)`, and every reader of `worksAt` asks for the one it means.
  `worksAt` itself keeps meaning "everything at the site", because the save,
  the report and the count on the card mean that.
- **When a work lands, the next in line is on the go on the same frame**, and
  everything that happens at a `start` -- `started`, the staff hook -- happens
  to it then. The builder freed by the landing takes it the way it takes the
  emptiest slot today. Nothing teleports: the ground is reserved when it is
  paid for (`reserve` stays in `start`, so a queued yard building's patch is
  spoken for from the press), and the walk is the walk.
- `start` loses its `fullAt` guard; `siteBusy` is false for every row, and the
  `busy` / `busy (n)` branch in shop.js goes with it. What is left is
  `building` (mine, on the go) and one new word, **`queued up in n`** (the
  owner's wording, over `in line (n)`) -- this row's place, counting the work
  at the front as one, so the first behind it reads `queued up in 2`. The
  vocabulary stays closed and the width check in `selftest/boards.js` tries
  every word on every card.
- **Pressing an in-line row again pulls it out**, and the bill comes back in
  full: dust and coins put back into the pile the way `take` lifted them out.
  The refund arcs *from* the site back to the bench -- `payTo` the other way,
  the same dust and the same flight -- so what was paid is seen coming back. A
  row on the go is committed, as today; its tooltip says so, once.
- Duplicates: a rung row already in line cannot be pressed again (its next
  rung is not for sale until this one lands); a repeatable row (a hat, a pot)
  can be queued as many times as you can pay for, and the card counts them.

### The card

**Amended as built (2026-09-12).** The first draft was a line per site with
the site's name, the clock and a `then` list. The owner wanted it smaller and
more of a glance, and then settled it: one name a line, and the hover says
the station.

A small card, top-right of the window, in the boards' own paper, **absent
when nothing is building anywhere**. One name a line, across every site in
`SITES` order, each site's run in the order it will land. The first line of a
site's run is the work being built and carries its bar as five pips
(`QUEUE_PIPS`, filled for the share done -- the same glyphs a row's ladder
uses); the lines behind it are plain names. No site names, no clocks: the
row on the board has the clock, and the card is where you watch names leave.

```
●●●●○ a bigger pocket   ◴  2
hold to mine            ◴  7
a bigger sack           ◴ 12
```

Every line carries a clock (amended 2026-09-12, the owner's ask): the front's
is what is left of it at the pace the site is actually going, or its status
(`on the way`, `nobody on it`) when nobody is at it; a waiting line's is how
long until *it* lands, everything ahead of it counted at the site's own rate.
Hover a name and the board's own tip names the station, beside the line.
A waiting name is a button: press it and the work is handed back, through
the row's own `buy`, so the card and the board cannot disagree about what a
press does. The front name is not a button.

It stands top-left and **under** the boards (`z-index` 9 to their 10): on a
short window a board reaches the corner, and the board you walked up to read
is the thing that should win it. It is as wide as its longest name and a line
per work -- the owner's call (2026-09-12), over a first cut at a fixed width
that clipped names. It fades in and out (`.off`) rather than popping. Held
(`S.paused`), it is faded with the rest.

**The board stays up on a purchase** (amended 2026-09-12, the owner's ask).
It used to put itself away when a row was bought (feedback8 item 1) so what
you paid for could be watched in the yard the sheet covers -- decided when a
site took one work at a time and the next press was ten seconds off anyway.
The point of a line is pressing the next row while you are still standing
there; walking away is one step, and the card in the corner shows the yard's
doing without the board getting out of its way. A press that buys nothing
leaves it up as it always did.

### What it is not

- Not a way to staff a build. One body per site's work, as before.
- Not on the casino, which has no works.
- Not a plan across sites: each queue is one site's line, and there is no
  cross-site ordering because sites do not share hands.

### How it is checked

`test/queue.test.mjs`, node tier, bought like a player through `__buy`:

- Three rungs pressed at the bench: purse down by all three bills at once;
  one work on the go, two in line; the on-the-go one has a builder, the two in
  line have none and stand at nought; they land in the order bought.
- A yard building queued behind another: its ground is reserved on the press
  (`S.buildOrder`), nothing rises for it until the one in front lands.
- Pull-out: press an in-line row, the bill is back in full to the grain, the
  list is one shorter, the builder count is unchanged. Press the on-the-go
  row: nothing happens.
- A save written mid-queue comes back with the same list in the same order,
  and the line behind the front is still at nought.

`src/selftest/queue.js`, browser tier: the card is absent on a fresh game,
present with one name after one press and two after two, the front line
carrying its pips; pressing the waiting name removes it and refunds; and the
card's layer stands under the boards', read off the computed style.

**As built.** Everything above, with these findings: the fence tape stays on
a yard building in line (its ground is reserved on the press, and a fenced
empty plot with no bar and no body is what "waiting" looks like on the
ground); the bars, the done-marks and the builders read `onTheGo(site)` and
the fences and the report read `worksAt(site)`; the report grew a `line`
field (every site's whole list) beside `works` (the front alone), so no
older check changed meaning. The flag over a station now stays up through a
build (`test/boards.test.mjs`), since the next row can be pressed. `refund`
in pit.js is `bankDust` per grain -- one call a grain, the same as a hauler's
tip -- with the payment's `S.paid` flight run the other way.

## The cut is worked in pockets (built)

### What is wrong

A quarrier's swing is not a thing you can see. `CUT_DIG_MS` says a cut is
sixteen seconds of swinging at pace nought, and `cellMs` divides that by the
cells in the cut -- about three hundred on a two-bench cut -- so one cell is
fifty-odd milliseconds and the floor, `CUT_SWING_MIN`, is sixty. Then
`paceShare` divides *that*: twelve milliseconds at rung nine, less on band
four. A cell goes in one frame. The body's lunge (`QUARRY_SWING`, 620 ms) is
still on its way down when the next cell goes, so the pick never lands on
anything; and the walk, divided by the same share since the ladder moved
under the gang's feet, crosses a face in a blink. What the player sees is a
gang darting about the floor of the hole while the floor sinks -- the
loading bar with people drawn on it that the seam rework took out of the
*pay* and left in the *work*.

The picker is not the problem. `nextQuarryCell` takes the shallowest course
and one of the few nearest open cells on it, and a fresh yard dug by five
quarriers -- or by the jaw, which asks the same function -- comes out as a
flat-bottomed pit worked down in layers, at every depth and every rung (shot
2026-09-13). But a body re-picks after *every* cell, and a cell is one
frame, so it re-picks sixteen times a second: the scatter that was meant to
be a pace or two of walk is a body that never stands still.

### The rule

**One swing takes a pocket, not a cell, and a body works a run.**

- **The beat.** A swing is `CUT_BEAT_MS` at pace nought -- about a second,
  the lunge and the recovery -- and the pace ladder shortens it through
  `paceShare` down to a floor, `CUT_BEAT_MIN`, of about four hundred
  milliseconds. The floor is the point: below it the pick does not visibly
  land, and the whole change is for nothing. Past the floor the ladder buys
  nothing on the beat and buys it on the pocket instead.
- **The pocket.** Each swing takes `CUT_POCKET` cells off the body's course
  -- three, the cell under the pick and its two neighbors on the same
  layer, the way a crit's extra cells already go through `nearestUndug`. The
  pocket's cells go together on one frame, which is what makes a swing look
  like it did something. Where the ladder has hit the beat's floor, the
  pocket widens by the share the beat could not take, so `pocket / beat`
  climbs the same curve `1 / cellMs` climbs today.
- **Throughput is unchanged, by construction.** `pocket × (1 / beat)` at
  every rung equals `1 / cellMs` at that rung. `CUT_DIG_MS` still says how
  long a cut takes; `cellMs` becomes the derived number the pocket and the
  beat are solved from, not the clock a body runs on. `quarryRate` and the
  row's gain line do not move, `findShards` deals the same scatter over the
  same cells, and the jaw -- which takes one cell a tick on its own clock and
  does not swing -- is not in this at all.
- **The run.** A body picks a *run*, not a cell: the nearest `CUT_RUN`
  pockets open on the current course, walked in order from the near end. It
  re-picks when the run is done, when the course it is on runs out
  (something shallower has opened -- silt came down, or a neighbor's run was
  finished by someone else), or when its own cell is dug from under it.
  `nextQuarryCell`'s claim set becomes a set of runs, so two bodies never
  walk to one pocket. The walk is the same `CUT_STEP / paceShare()` it is
  now; what changes is that it happens once a run instead of once a cell,
  which is the "flying" gone without touching the number.
- **The blaster's swing is the blast.** A trained quarrier's swing takes a
  double pocket (`CUT_POCKET × 2` -- the same ground its current `/ 2` on
  the swing time bought), and on landing it fires `shockAt(x, y, power,
  'quarry')` at the pick -- the same ragged ring and speck burst a crit
  leaves, at about a third of a crit's power -- and stands the beat out
  before its next. The apprentice swings and the ground goes; the blaster
  sets a charge and the ground *bursts*. This is the trade's bump, the
  thing a player bought at the school being visible from across the yard. A
  crit at the cut stays what it is -- more ground out at once, a full ring
  -- and a blaster's crit is both.
- **No puff for a plain swing.** Considered and dropped: a few specks on
  every swing was a gang with five rings a second going in the hole, and
  the crit's ring lost its meaning. A plain swing is the lunge landing and
  three cells gone. That is enough to read.

### What it costs

Nothing on the balance sheet, on purpose: shards a minute, cut time, the
ladder's gain line and the jaw's pace are identical at every rung. The only
number that changes is how many times a second a body picks a cell.

The walk is still nine tenths of a shift -- the pace ladder still buys the
walk, which is what its rungs were named for -- and a run walked from the
near end is a shorter walk than five re-picks across the same stretch.
Measured on the same seeded scene before and after, a cut should finish in
the same wall time or a shade sooner; if it comes out slower the run length
is wrong, not the beat.

### Numbers

`config/quarry.js`, one block, all on `TUNABLE`: `CUT_BEAT_MS = 1000`,
`CUT_BEAT_MIN = 400`, `CUT_POCKET = 3`, `CUT_RUN = 4`, `CUT_BLAST_POWER = 1`.
`CUT_SWING_MIN` goes -- the beat's floor replaces it. `NEAR_CELLS` comes
out of quarry.js and into config as `CUT_RUN` while the file is open; a
magic number in a module is a bug here.

### How it is checked

`test/cut-pockets.test.mjs`, node tier, on the driven yard:

- A body's dig frames: between one `digCell` and the next from the same body,
  at least `CUT_BEAT_MIN` game-milliseconds pass, at pace nought and at rung
  fifteen. (The thing the change is for.)
- Throughput: a two-bench cut with one quarrier finishes within ten percent
  of the same cut's time on main, at pace nought and rung nine, on the same
  seed. (The thing the change must not move.)
- Layers hold: at no frame does any column stand more than one pocket deeper
  than the shallowest undug column on its course.
- A blaster's dig fires one shock at the cut per swing and an apprentice's
  fires none; a crit fires one either way and not two.
- The run: a body's `x` between re-picks is monotonic -- it walks one way
  along a run, never back.

And the shot: a `cutgang` scene, five quarriers at pace nought and at rung
fifteen, one blaster among them, held on the frame a blaster's swing lands.

**As built (2026-09-13).** Everything above, with these findings:

- **The beat is 2.6 s, not one.** The numbers above were guessed; the
  measurement (`tools/node/cut-time.mjs`, five and one quarriers at pace
  nought and rung nine on the suite's seed) put main at 108 / 436 / 31 /
  94 s a cut, and a one-second beat with a three-cell pocket finished in
  half that -- the run took more walking out than the beat put back. The
  beat and the pocket are not solved from `cellMs` after all; `CUT_BEAT_MS`
  is tuned against the measured cut time, and `test/cut-pockets.test.mjs`
  pins it (110 / 31 s built, within a tenth). The floor of 400 ms is never
  reached on the nine rungs (rung nine is 520 ms) and only bites on band
  four. `CUT_SWING_MIN` stays, as the jaw's clock.
- **The slots were real, and were the extra cells.** The picker was never
  the problem. `nearestUndug`, asked once per extra cell, took the nearest
  undug column at any depth -- and once a neighbor had been taken it was
  still the nearest, one deeper -- so a crit's second and third cells went
  down the same neighbor. On main that was a notch; with a blaster's pocket
  it was a shaft five cells deep under a body standing beside it. A swing's
  extra cells come off the course the cell under the pick was on, and stop
  when the course is out.
- **A claim is the pocket, not the run.** Booking the whole run put most of
  the face behind one body -- a blaster's run is twenty-four of the cut's
  twenty-six columns -- and a body grossed out for a second with its stretch
  booked left the others two courses down at the far end. Only the cell in
  front of a body and its two neighbors are claimed; the run is that body's
  plan, and `runStands` drops what somebody else took.
- The checks are five groups in `test/cut-pockets.test.mjs`; the layer
  check is "no column more than a course under both its working neighbors"
  (a finished neighbor is the bench wall) plus a floor spread of three
  courses, since a body stood still with a stretch in front of it is a
  course the others get ahead of. Two scenes, `cutgang` and `cutgangdeep`,
  and two tools, `cut-time.mjs` and `cut-trace.mjs` (the profile and every
  body's leg, cell and run, half a second at a time).
