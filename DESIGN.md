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

**Space holds the yard.** The clock stops advancing — nothing is saved and nothing is skipped, so
it comes back exactly where it was left — and a small sheet appears in the middle of the window
saying **paused**, with a **resume** button under it.

The middle, rather than a corner: the thing it is about is the whole window, so it says so where
you are already looking. It is the only overlay in the game; everything else is either drawn on
the ground or hangs off a building. Same ink, same type, same border as the boards, because it is
a sheet like the others — just put somewhere else.

Held, the canvas answers to nothing at all: no swinging, no sweeping, no picking anybody up. A
paused game you can still mine is not paused. The button is there because space is not discoverable
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

## The shields (design, not built)

The story so far has one engine and it turns one way: rocks land on people, and everything the
yard does about it happens after the fact. You dig. In the whole run nobody has yet done the
obvious thing, which is to look up. That is the arc: **the yard tries to stop the next one.**
Three tries, spread across the run, and the first two fail — not for story reasons alone. The
rocks are the game's entire income, and a wall that worked in the mid-game would starve the yard
that built it. The failures are load-bearing.

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
the quarry and priced in the quarry's own shards, because it is built of the quarry's own coin.
And it nearly works. **The arch catches one.** The rock comes down, the arch takes it, and for
a held beat the yard has won — long enough for every body on the ground to stop and look up,
which is a thing the crew has never once done at a falling rock. Then the crack runs, and the
arch comes down with the rock on top of it, and the arch's stone lands minable alongside
everything else. The lesson is the game's own color rule said out loud: everything of the
ground is grey and goes back to the ground. Rock cannot hold rock. Stacking the yard higher is
still the yard.

**The dome.** The third try is the tower's, and it is the first shield not made out of the
thing it is stopping. A spell on the spire, priced in cores — the tower is raised for cores,
and cores open what you don't have, which by then is the one thing left: the sky staying shut.
Cast, it pours the same purple the hats are made with, rings off the spire that close over the
landing spot — the rule holds, what magic emits is purple and says so. And the choreography is
the opening played back the right way round: the last of the rock goes, the one underneath is
stood there on the bare ground saying the same dots they have said all game, the next rock
comes down the way it always has — **and this time it stops.** Held overhead on the dome, the
first falling thing in the game to touch nothing, while the mate walks out from under its
shadow. Two squares stand together on the ground passing dots back and forth, and every so
often one of them says the other thing. Then the dome lets the rock down gently on the empty
spot, and the yard goes back to work.

Every rock after lands the same way — caught, held a breath, set down. The drumbeat is kept,
because the drumbeat is the income; the threat is retired, because the story is over. This is
how the first line of this document and the section above it are both true at once: **the
story ends on purpose. The yard does not.**

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
farm, the ram's under `the rock` and the belt's under `the crew` -- which is the
rule the boards were always supposed to follow.

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
up: the settlement steps back as it rises, the lab's chimney is under half the body under it, the
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

A hole in the air at the far end of the pit, past the heap. Grains stream off the top of the pile,
arc into it and are gone — the same gesture `spend` already makes when you pay for something, which
is deliberate: the yard has one way of showing dust leaving the pile and this is it. They are not
destroyed and the counter does not move. They are in another dimension, and the rift says how many.

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

**Somebody holds it open.** A wizard stands at the rift and it swallows; nobody there and it is
shut, the pile backs up, and the hole fills the way it does today. The yard's two oldest rules
survive it — nobody teleports, and a station idles until somebody is actually standing there — and
they are what stop this from being a magic box that gets something for nothing. The cost of
unbounded storage is **a body not on the rock**, which is the same bargain every other station in
this yard makes, and it is a decision you can take back whenever you like.

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

### A save from before it

A save holding more than the hole can show comes back as a full pile — up to 37,566 grains — with
the remainder standing in the rift. Nothing is clamped and nothing is destroyed. A player who had
pressed their pile twice and banked 202,000 opens the new build to a hole full of proper six-pixel
dust and a rift holding the other 165,000, which is the state the game would have put them in had
the rift existed all along.

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

## Open questions
- Sound: soft ticks on a hit, a low tone when a core banks. Optional, off by default.

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
| building | the lab, the school, the closet, the casino, the tower, the two sites | 90s |
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

## The bench takes time too (design, not built)

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

**The opening does not deadlock.** The story hands you one body, and it is
carrying -- which is spare -- so the first purchase has hands. Later, with
everybody on a job, a bench row says **nobody on it** and stays that way until
you free somebody. That is the lab's rule and it is a thing you can act on; a
purchase that quietly pulled a miner off the rock would be the yard overruling
the roster.

**What it shows.** The lab's bar, over the bench, while a builder is at it. The
builder stands at the bench the way a labber stands at the door -- no hammering
mime; the bar is the work. The bench's own mark (`benchMark`) does not flag a
row while the bench is busy, which it already knows how to do.

**What it is not on.** The casino, still. `press the pile` is the one open
question: it is sold from the bench but done to the hole by red, not by hands,
and a wizard's spell fitted at a workbench reads wrong. Proposed: it stays
instant.

### What changes in the checks

Every check that buys a bench rung and reads the effect on the next line: a
handful in `test/` (`ladder`, `pit`, `machines` via `__levels`, `boards`) and
more in `src/selftest/`. Same two fixes as last time -- `buyBuilt` where the
mechanic is the point, `__finish()` where the page is -- plus `__crew(0, n)`
to have hands spare.
