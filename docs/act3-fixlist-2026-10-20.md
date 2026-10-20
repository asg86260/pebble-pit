# Act 3 fix list, 2026-10-20

The owner's playthrough of act 3 on their own save, in their words, with what
the save and the code say about each. Nothing here is design: every item is
something that is broken or reads wrong in play. Each one closes only when it
is checked on the owner's save in the real game, not on a staged scene.

Status: **open** / **in progress** / **fixed (commit)**.

## Broken

1. **"the couple still arent at the pedestal"** -- fixed (5b72e4f3).
   The save had the refusal beat marked played with the pair standing in the
   camp and no route, so nothing ever sent them up. Now, between the refusal
   and the haunting, a pair with no beat holding them walks back to the
   pedestal. Check: `test/after-pair-stays.test.mjs`, the camp group.

2. **"hiring workers for stations dont do anything"** -- open.
   The save has 30 agitator, 2 woodcutter, 3 hauler and 8 sawyer posts bought,
   but only 6 bodies (all agitators) and 0 members in the camp. A post is
   filled from the camp; with the pair silent (item 1) no member ever joined.
   Still wrong after item 1: the shop sells a post nobody can fill, and says
   nothing about it.

3. **"the pedestal crowd isnt working"** -- open.
   Same root as items 1 and 2: no members, so the union's crowd never grows.

4. **"i still cant go into shop menus from stations, they close when moving
   my mouse into them"** -- open. Likely the polish-gates merge (e1914101),
   which shuts any open board when the pointer is over a station's work part.

5. **"the timber just sits in the saw and doesnt do anything. nobody is
   working. theres just numbers floating around that arent attached to
   anything"** -- open. A station's work and its counts must read like act
   1's: a body at the door, the work visible, the counts on their piles.

6. **42 logs lie on the grove floor and nobody carries them** -- open.
   The camp's second pass made the gatherer a post of its own; a save from
   before it has no gatherer, and a new post needs a member (item 2).

7. **"huge lag spikes in act 3"** -- open. To be profiled on the owner's
   save, not guessed.

8. **The full node suite on main: 30 failures** -- open. From the
   polish-gates merge (e1914101): its new "a body jumped" rule fires on act
   1's own motion (the quarry ladder, the rockhand dance, a hauler). Act 1
   must not be touched by act 3 work: revert e1914101, then re-land the
   gates only when the yard's suite is green.

## Reads wrong

9. **"whats with the gray square bars behind the pedestal? makes no sense"**
   -- open. The union's crowd as drawn: rows of grey squares that read as
   bars, not people.
10. **"the square crowd in front of god doesnt feel alive. they feel more
    like a tile floor"** -- open.
11. **"remove the clouds behind the main plane that arent a part of the sky
    clouds"** -- open. The cloud bank behind the camp (not the sky layers):
    remove it.
12. **"the main plane floor is still flat ... the floor should have some
    hills and steps up/down. i dont want a flat floor for act 3"** -- open.
    Said many times; the floor's shape is data the walk and the stations
    must follow.
13. **"the saw for the mill the teeth are way too large. looks goofy"** --
    open.
14. **"the stirer for the paper mill changes shape when doing work"** --
    open. A moving part keeps its shape; it moves as one piece.
15. **"the saw is way too large for the trees"** (the handsaw at a tree) --
    in progress, three sizes on a dial for a vote.
16. **"the gaze needs smoother motion" / "the god rays around the crown
    needs better motion"** -- in progress.
17. **Dark mode reloads the whole game** -- open. Every color is mapped once
    at load (ink.js); switching should recolor in place.

## How these get checked

- On the owner's save, loaded into the real game, at the owner's window,
  played: hire a worker and watch it walk to its post; open each station's
  board and move the mouse into it; watch a station work a unit end to end.
- Then the act 3 playthrough checks, and the yard's own suite on main, which
  must stay green: act 3 work never breaks act 1.
