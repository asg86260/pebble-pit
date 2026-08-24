# Wave: the crew are people, and a pile is a heap

**This document is canon. Subagents: do not redesign; implement.** Where a number
is given here, use that number. Where a name is given here, use that name. If
something in it turns out to be impossible, say so in your report rather than
inventing a different feature.

## What is being optimised

Feel, not throughput. Every item below is about the yard reading as a place where
people work, and about a number being visible as a shape instead of as text. None
of it changes the economy: no rates, costs or limits move except where this
document says so.

## House style, and it is not optional

Read `ARCHITECTURE.md` and any file you are about to change, in full, before you
write anything. Then match what is there:

- `config.js` owns every number. `state.js` owns every fact that changes. Modules
  own behaviour. A magic number in a module is a bug in this codebase.
- Comments say **why**, in plain sentences, and are worth more than the code they
  sit over. Look at `air.js` or `roster.js` for the register. Never write a
  comment that restates the line under it.
- Black and white only, flat shapes, no gradients, no textures. Everything sits
  on the `P = 6` cell grid; a position that is half a cell off puts a hairline
  through the picture.
- No new dependencies. No frameworks. Vanilla ES modules.

## Verification, for every track

```
bun run test          # the whole suite, headless, against the server on 5184
node tools/unresolved.mjs
```

**A track is not done until `bun run test` reports 0 failures and 0 errors.** The
suite is currently **294/294**. If a check that has nothing to do with your track
starts failing, that is your bug: say so and fix it.

Start the test server in your worktree first (`bun run dev:test`), and **never
point anything at port 5183** — that is the user's own game and its save.

`__test()` in a browser console runs the same suite. `node tools/headless.mjs
"<expression>"` evaluates one expression against the game, and
`node tools/headless.mjs --shot look.png "<expression>"` sets the game up and
takes a picture of it. Use the picture. Several of these items are only right or
wrong to the eye.

---

## Track MENU — the headcount is a badge

**Owns:** `src/shop.js`, `src/style.css`.

Today a section heading with people under it reads `the rock  x3`
(`shop.js:88`). Replace the `xN` with a **black badge carrying white text**,
sitting beside the heading: black rounded-free rectangle, white numeral, the
same monospace face as the rest of the board, and small enough that a heading
without one does not jump when it gains one.

1. The badge is a `<span>` inside the heading, not text in the heading's own
   `textContent`, so the heading keeps its title and the count is styled apart
   from it.
2. It appears only when the count is more than zero, and it says the number
   alone — no `x`, no word.
3. The heading is dimmed (`opacity: .4` today). The badge must **not** be dimmed
   with it: the count is the one thing on that line worth reading at a glance,
   so the heading stays quiet and the badge is solid black.
4. Both boards use it: the bench and the lab go through the same `refresh()`.

Add a check to `selftest.js` named **`the headcount rides on the section as a badge`**,
inserted **immediately after** the group `['shop opens at the bench and is not buried', ...]`.
It should assert that a section with people under it carries a badge element
whose text is the bare number, that a section with nobody has none, and that the
badge is not inside the dimmed part.

---

## Track TRAVEL — a body walks to its work

**Owns:** `src/crew.js`, `src/lab.js`, `src/quarry.js`, `src/farm.js`,
`src/state.js`.

This is the backbone of the wave and the biggest piece of it. Two features:

### 1. Nobody pops

`syncWorkers()` (`crew.js:82-141`) partitions `S.workers` by decrementing a
`want` map per type in array order, discards everything it did not keep, and
pushes brand-new bodies for whatever is short. Move somebody from the beds to
the rock and the farmhand is deleted where it stood and a miner is created
already on the rock, at a random column. `type` is the only thing that says
what a body is *and* where it works, and it is never reassigned on a live
worker anywhere in the codebase today.

A body must **keep its identity across a change of job** and **walk there**.

**The design, decided here so you do not have to invent one:**

- When a job loses a head and another gains one in the same `syncWorkers()`
  pass, take one of the surplus bodies and **retask it in place**: it stays in
  `S.workers`, its `type` is set to the new job immediately, and a commute is
  started on it. No body is pushed and none is discarded.
- Setting `type` immediately is what keeps the bookkeeping honest -- `want`,
  `pickBed`, `elbowed` and `seatX` all filter on `type`, and a commuting body is
  on its way to that job, so counting it there is right.
- A commuting body carries two fields and no more: where it is headed, and the
  fact that it is still walking. While that flag is set, `updateWorkers` runs a
  single commute step for it and **skips the job's own step function entirely**.
  It does not mine, carry, tend, research or cut on the way.
- On arrival (within `COMMUTE_SLOP`), clear the flag and initialise the job's own
  fields exactly as that job's factory would (`goal: 'to'`, `next`, `dir`, `seat`
  and so on), so the body drops into the normal machinery from there.
- **Coming out of the lab is free.** `indoors(w)` is
  `w.type === 'labber' && w.goal === 'in'` (`lab.js:96`), and a labber that is
  "inside" is standing at `labDoor()` anyway -- its `x` never moved. So flipping
  its type makes it visible at the door, which is a body walking out of the lab,
  not a teleport.
- **Coming up out of the quarry is not free.** `underground()` is a stub that
  always returns `false` (`quarry.js:198`) -- quarriers are always drawn -- but a
  quarrier at work is down in the cut, below the ground line. A commute that
  starts below the ground line raises `y` back to `walkY(x)` first, at the pace
  it climbed down with, and only then walks along. It may not slide up through
  the wall diagonally.
- A body that is retasked drops what it is carrying at its feet, exactly the way
  a stood-down body does today (`spawnChip` per unit of `w.carry`, and a held
  core becomes `S.coreItem`). Nothing may lose a load or a core.
- Walk with the idiom the rest of the file uses:
  `w.x += Math.sign(t - w.x) * Math.min(pace, Math.abs(t - w.x))`, and keep the
  feet on the ground with `walkY(x)`, so the bridge over the quarry carries a
  commuter the way it carries everybody else.
- It gets out from under a falling rock like everybody else (`duck`).
- A body stood down with no new post (the crew actually shrinks) behaves exactly
  as it does today.

Put the walking pace in `config.js` as `COMMUTE_PACE` (use `0.9`, between a laden
and an empty hauler) and the arrival tolerance as `COMMUTE_SLOP` (`P * 2`).
`ROAM_RANGE`, `ROAM_PACE` and `MINER_WALK` are module-local consts in `crew.js`
today; leave them where they are, this wave is not a tidy-up.

Where each job's station is, for the walk target: the rock is `S.cx`, the quarry
`quarryFace()`, the beds `bedX(i)`, the lab `labDoor()`, and carrying has no
station -- a body retasked to hauling is already where it needs to be and can
start straight away.

**The seam this track does not close:** a newly *hired* body should walk out of
the house (Track HOUSE). Put the spawn point behind one function in `crew.js`
called `hireSpot()` returning `{ x }`, have it return the bench's x for now, and
say in its comment that Track HOUSE replaces its body after the merge. Do not
import `house.js`; it does not exist in your worktree.

### 2. The lab lets people go

Labbers are stuck: nothing takes them off the lab, and a lab with no research is
a lab full of people doing nothing. When `S.research` is null, a labber must be
able to leave — walk out and go back to carrying dust — rather than standing in
an empty building.

Do this as **the crew's own decision**, not as a new button: a labber whose lab
has had no research for `LAB_IDLE_MS` (put it in `config.js`; use `4000`) walks
out and becomes a hauler, and `S.labbers` comes down with it. Starting a piece of
research does not drag anybody back — the player puts them back on with the
roster under the lab, which already exists.

Add checks to `selftest.js` named
**`a body walks to its new work instead of appearing at it`** and
**`an idle lab lets its people go`**, inserted **immediately after** the group
`['a worker can be taken off a job again', ...]`.

---

## Track HOUSE — somewhere to come from

**Owns:** `src/house.js` (new), `src/render.js`.

Bodies are hired out of nowhere. Give the crew somewhere to live:

1. **A stack of cubes that grows with the crew.** One cube per body on the
   payroll (`S.crew`), stacked into a block that grows up and along — simple
   square boxes on the cell grid, flat black and white like everything else, no
   roofs, no windows, no chimney. It reads as housing because it grows when you
   hire, not because it is drawn as a cottage.
2. It stands **on the ground between the bench and the rock**, clear of both:
   pick the spot from `bench.x`/`bench.w` and `rockLeft()`, put the numbers in
   `config.js` (`HOUSE_*`), and keep it clear of the rock's apron at the biggest
   rock the game allows.
3. Nothing there at all until the first body is hired.
4. Export `doorAt()` from `house.js`, returning `{ x }` — the ground in front of
   the stack, where a new body steps out. Nothing consumes it in your worktree;
   the seam is wired after the merge. Say in its comment that it is the spawn
   point for a newly hired body.
5. Export `drawHouses(ctx)` and call it from `render.js` in the world pass,
   before the workers are drawn so a body walking in front of the stack is in
   front of it.

The stack is scenery: it is never clicked, never hovered, has no menu, and holds
no state of its own beyond what `S.crew` already says.

Add a check to `selftest.js` named **`the crew have somewhere to live`**,
inserted **immediately after** the group
`['the sites are laid out left of the rock, in order', ...]`: no house before the
first hire, one cube per body after, the stack clear of the bench and of the
rock's apron.

---

## Track PILES — a full pile looks full

**Owns:** `src/world.js`, `src/grid.js`.

A pile of shards or spores holds `PILE_LIMIT` (180) and is spread along a strip
390–444px wide. 180 grains over 70-odd columns is two cells deep: a scatter, not
a heap. You cannot tell a full pile from a half-empty one, and the only thing
that says a station has stopped is the warning triangle under it.

**A resource pile must fill into a mound, and a full one must be obviously
full** — a small version of what the pit does, where the dust stacks into a
profile you can read the level off.

1. Give the quarry's and the farm's piles a **heap zone**: a strip narrow enough
   that `PILE_LIMIT` fills it to a proper mound rather than a scatter. Work the
   width out from the limit and the slope rather than guessing — with a slope of
   `BANK_SLOPE` a triangular heap of `n` grains wants a base of about
   `sqrt(4n / BANK_SLOPE)` cells — and put the result in `config.js`. Do not
   change `PILE_LIMIT` itself; the economy does not move in this wave.
2. The heap **stacks instead of slumping flat**: it grows up as it fills, and at
   `PILE_LIMIT` it is a full mound with a crest, plainly at its limit. It must
   not slump out past its zone as it grows.
3. The rock's own spoil keeps behaving as it does now — it is a bank of dust
   along a long strip and that is right for what it is. This item is about the
   quarry's and the farm's output only.
4. Nothing may topple into the pit that does not today, and the apron by the rock
   stays bare. The existing checks about banks, aprons and the pit's lip must all
   stay green — read them before you start, they encode rules this track can
   easily break.

`bankCeiling()` in `world.js` is where a column's allowed height is decided, and
its comment explains why a bank leans away from both ends of its strip. That rule
is what flattens a small pile. Changing it for the resource piles is the work;
changing it for every pile is not.

Add a check to `selftest.js` named **`a full pile is a heap you can read`**,
inserted **immediately after** the group
`['spoil is aimed, and lands clear of the rock', ...]`: a filling pile grows
upward rather than only sideways, a full one stands at its crest, and the pile
reports full at the same count it does today.

---

## Ownership, in one place

| Track | Owns outright |
|---|---|
| MENU | `src/shop.js`, `src/style.css` |
| TRAVEL | `src/crew.js`, `src/lab.js`, `src/quarry.js`, `src/farm.js`, `src/state.js` |
| HOUSE | `src/house.js` (new), `src/render.js` |
| PILES | `src/world.js`, `src/grid.js` |

**Do NOT touch another track's files.** You may *call* anything they export that
exists today; you may not change it.

### Shared files, additive-only

`src/config.js`, `src/main.js` and `src/selftest.js` are shared. Rules:

- **`config.js`**: append your constants in one block at the **end of the file**,
  under a comment naming your track. Do not edit an existing constant unless this
  document tells you to.
- **`main.js`**: at most a single line — one field on the `__state()` object, if
  your checks need one. Nothing else. Do not reorder anything.
- **`selftest.js`**: insert your new group at the anchor named in your section
  above, and nowhere else. Do not edit an existing check unless your feature
  legitimately changes what it asserts, and say so loudly in your report if you
  do.

Conflicts in these three files are expected and will be resolved at the merge.
Keeping your edit to one block in one place is what makes that cheap.

## What every track reports back

1. Deliverables, one line each, done or not done.
2. Files touched.
3. **The actual output of `bun run test`** — pasted, not summarised.
4. What you had to decide that this document did not decide for you.
5. Anything you believe is wrong with the design, which you implemented anyway
   because this document is canon.
