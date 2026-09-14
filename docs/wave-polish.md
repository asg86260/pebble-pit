# Wave polish: the dance, the dome, the fit and the hop

Four things the user asked for in one breath, 2026-09-14. This document is
canon. Subagents: do not redesign; implement. Where a number or a name is
written here, use it. Anything found impossible goes in the report, not into
a different feature.

Read `CLAUDE.md`, `ARCHITECTURE.md` and the files in your track's *owns* list
before writing anything. Every constant goes in the feature's `src/config/*.js`
file, every changing fact on `S` (and in one of `state.js`'s three lists).
Comments say why. American English. One CHANGELOG line per fix, under
`Unreleased`, in the same commit.

What is being optimized: **feel at the table**. The player has watched the
dance and the dome slow every rock for weeks; the wave is done when a rock
lands, the crew jump, and they are back at it without a five-second wait --
except on the two rocks that earn one.

---

## The diagnosis

- `core.js:82-90` sets `S.danceUntil = now() + DANCE_MS` on **every** rock,
  and `crew/step.js:107` (`dancing`) keeps every body in the dance for the
  whole fall of the next rock as well. Five seconds plus a fall, every rock.
- `shield.js:287-294`: after the dome sets a rock down it resets `caught`,
  `rested`, `setting` and stands for the next one, so every rock after the
  rescue is caught, bounced, held `DOME_HOLD_MS` and lowered at
  `DOME_SET_RATE`. The dome's job -- one hold, the rescue -- is done; after
  that it is a delay on every rock.
- `shieldPlan` (`shield.js:79-97`) sizes a shield once, at raise time, for
  rock `boulderNo + 1`, and never again. The arch and the dome are drawn as
  arcs whose apex is the catch line, so a rock 80% of the span perches on
  the apex and overhangs the curve (shots/arch!.png, shots/dome!.png on
  main). The net and props span the rock with a clear margin and are fine.
- `rock.js:197-227` `landRock()` shakes the view, throws grains and puts a
  `bang` over every head, but no body moves. The dance jump already lifts a
  body off a latched foot; the hop is that, once, on impact.

---

## Track A -- the dance is for the two rocks that earn it

**Owns:** `src/core.js`, `src/crew/step.js`, `src/crew/dance.js`,
`src/ending.js`, `test/dance.test.mjs`, `test/rock.test.mjs`,
`test/dance-once.test.mjs` (new). Additive-only: `src/state.js` (one field in
one list), `src/persist.js` (one migration line), `CHANGELOG.md`.
**Do not touch:** `src/shield.js`, `src/rock.js`, `src/render/**`,
`src/config/shields.js`, `src/intro.js`.

1. The dance after a rock is for **the first rock only**. In `stepCore`, the
   line that sets `S.danceUntil` becomes: dance for `DANCE_MS` when
   `S.boulderNo === 1 && S.rockhands > 0`, otherwise `0`. Every later rock:
   no dance, the crew go straight back to work (subject to the drop zone,
   which is unchanged).
2. The `dancing` predicate in `step.js` no longer dances every fall. It reads
   `c.now < S.danceUntil || (S.rockFall > 0 && S.danceUntil > 0)`: the fall
   after a celebrated rock is still danced through (the wind-down in
   `dance.js` depends on it), an ordinary fall is not. Confirm with
   `test/rock.test.mjs` that on an undanced fall nobody walks under the rock
   and nobody swings at a rock in the air; fix in the stages if they do.
3. The second dance is **after the sqwife is saved**, and it starts when the
   player puts the `#saved` sheet down, not while the sheet hides the yard.
   A sim-side rule, so the node tier can reach it: new saved field
   `S.storyDanced = false` (in `SAVED`); in `stepCore`, when
   `S.storyTold && !S.storyDanced` -> `S.storyDanced = true;
   S.danceUntil = now() + DANCE_MS` (if `S.rockhands > 0`). Saves written
   before the field exists load with `storyDanced = storyTold`, so an old
   finished yard does not dance on load. `ending.js` is unchanged unless the
   click needs to mark `S.dirty`.
4. `DANCE_MS` stays 5000. Do not shorten the dance; there are only two now.
5. Checks, `test/dance-once.test.mjs`: (a) rock 1 cleared by rockhands ->
   `S.danceUntil > now`; (b) rock 2 cleared -> `S.danceUntil === 0` and no
   body has `jigOn` during the fall or after the landing; (c) `S.rescued`,
   `S.intro = null`, flip `S.storyTold = true`, step one frame -> dance on;
   restore a save with `storyTold` and no `storyDanced` -> no dance.
   Update `dance.test.mjs` and the dance groups of `rock.test.mjs` to set up
   on rock 1 (they assume a dance on every rock).
6. CHANGELOG: `- The crew only dance after the first rock and after the
   rescue; every other rock they get straight back to work.`

## Track B -- the dome retires, and every shield fits its rock

**Owns:** `src/shield.js`, `src/render/shield.js`, `src/config/shields.js`,
`src/upgrades/rows-shields.js`, `test/shield.test.mjs`,
`test/shield-fit.test.mjs` (new), the shields block of `src/scenes.js`.
Additive-only: `src/persist.js`, `CHANGELOG.md`.
**Do not touch:** `src/rock.js` (export a function; the call is wired after
the merge), `src/core.js`, `src/crew/**`, `src/render/crew.js`,
`src/intro.js`, `src/ending.js`.

### B1. The dome comes down after the rescue

1. New constant `DOME_FADE_MS = 1500` in `config/shields.js` (with a
   `TUNABLE` row if the file carries them).
2. Rule, in `stepShield`: a standing dome (`s.kind === 'dome'`) with
   `S.rescued && S.intro !== 'rescue' && !s.caught && !s.fading` starts to
   fade: `s.fading = now()`. This fires the frame after the dome sets the
   rescue rock down (`landRock(true)` at `shield.js:288` -- `S.rescued` is
   already true by then, set in `getOut`), and it also fires once on loading
   any older save where a dome is still standing after the rescue.
3. A fading dome catches nothing: the `rockFootY >= shieldTopY` catch in
   `stepShield` is skipped while `s.fading`. When `now() - s.fading >=
   DOME_FADE_MS`: push `'dome'` onto `S.shieldsDone` (if not there) and
   `S.shield = null`. It is magic, not masonry -- a fade is the right exit,
   and it is the one exception to "every body walks" because there is no
   body.
4. `drawDome` draws the shell and sparks at alpha `1 - (now - s.fading) /
   DOME_FADE_MS` while fading (black-and-white rules do not apply to the
   purple band; it already uses `MAGIC_TONES`). No wizard beams on a fading
   dome. Nothing pops: the full fade, the user's stated taste.
5. `rows-shields.js`: with `'dome'` in `shieldsDone` the dome row reads as
   done exactly as the three broken kinds do (no re-buy). Check
   `cutscene.js:128` tolerates `S.shield === null` (it should already).
6. Checks in `test/shield.test.mjs` (extend the dome/rescue group): after
   the rescue rock is set down, the dome is fading; after `DOME_FADE_MS` it
   is gone and `shieldsDone` holds `'dome'`; the next rock lands on the
   ground with a shake (`S.landAt > 0`) and is never `S.rockHeld`.
7. CHANGELOG: `- The dome comes down once the rescue is over, so later
   rocks land without being held.`

### B2. Every shield fits the rock it meets

1. `shieldPlan(kind)` plans for **the rock that will actually reach it**:
   `S.rockFall > 0 ? S.boulderNo : S.boulderNo + 1` (today it always plans
   for `boulderNo + 1`, wrong when bought mid-fall).
2. New constants in `config/shields.js`: `ARCH_SPAN = 1.35`,
   `DOME_SPAN = 1.5` -- the arch's and the dome's outer width as a multiple
   of the rock's width (in px, before the leg and clearance margins). The
   rectangular kinds (props, net) keep today's `w = rock + 2*ROCK_CLEAR +
   2*legs`. For the arch and the dome, `w = max(that, round(rock.w * P *
   SPAN))`, snapped to the cell grid and even in cells. Cap: a shield never
   crosses the rock's flank clearance -- `w <= rock.w * P + 2 *
   ROCK_FLANK_CLEAR`. Heights follow from width as today (`rise = w/P/4`,
   dome `h = max(clear, w/P/2)`).
3. Export `refitShield()` from `shield.js`: if `S.shield` stands and is not
   `caught` and not `fading`, recompute `shieldPlan(S.shield.kind)` and copy
   `x, w, h` (and `rise` if stored) onto it, keeping `laid`, `poured` and the
   rest. It is called when a new rock is made (the call in `makeBoulder` is
   wired by the integrator after the merge; also call it at the end of
   `raiseShield` so the plan is fresh). Document in a comment that the width
   changing on a half-built shield is the accepted cost of a shield bought
   while a rock is in the air.
4. `test/shield-fit.test.mjs`: for each kind and for `boulderNo` 1..30,
   `shieldPlan` against `rockSize()` of the rock it plans for: inner width
   (`w - 2*SHIELD_LEG_W*P`) >= rock width in px + `2*ROCK_CLEAR`; the
   arch/dome span ratio >= its `SPAN` unless the flank cap bit; the plan
   never crosses `ROCK_FLANK_CLEAR`. And one player-path check: buy a shield
   while a rock is falling (`__next()` then `__buy`), and the plan is for the
   falling rock.
5. Shots: `arch!`, `dome!` at `--zoom 1`, before and after; the rock must
   sit on the apex with the curve visibly wider than it on both sides. Add
   a scene `dome!!` -- the dome met by a rock ten rocks later -- proving the
   refit (`S.boulderNo += 10` before `__next()`).
6. CHANGELOG: `- Every barrier is built wide enough for the rock that
   reaches it.`

## Track C -- the crew hop when a rock lands

**Owns:** `src/rock.js`, `src/render/crew.js`, `src/config/rocks.js`,
`test/land-hop.test.mjs` (new), the `landing` scene lines of
`src/scenes.js` (add `landing^`). Additive-only: `CHANGELOG.md`.
**Do not touch:** `src/shield.js`, `src/core.js`, `src/crew/**`,
`src/render/shield.js`, `src/ending.js`, `test/rock.test.mjs`.

1. Constants in `config/rocks.js` (tunable): `LAND_HOP_MS = 240`,
   `LAND_HOP_H = 1.5` (cells).
2. In `landRock()`, on a hard landing only (the same branch that shakes the
   view and hands out the `bang` mark, `S.boulderNo > 1` guard included),
   every body that gets the mark also gets `w.hopAt = at` and
   `w.hopK = Math.min(1.6, S.gh / ROCK_H)` (the shake's own scale, so a big
   rock throws them higher). A gentle set-down (`landRock(true)`) hops
   nobody. Bodies in the air (`falls`) or mid-dance are not hopped.
3. The hop is **render-time only**: in `drawWorkers`, a body with
   `now - w.hopAt < LAND_HOP_MS` is drawn `hop * P` higher, where `hop =
   LAND_HOP_H * w.hopK * 4 * t * (1 - t)`, `t = (now - hopAt) / LAND_HOP_MS`
   -- one parabola, up and back down, rounded to whole pixels. `w.y` is not
   touched, so the walk, the falls stage and the drop zone see nothing. The
   say mark over the head rides up with the body if it is positioned off
   `w.y` in the same pass; if it is drawn in `drawSays` from `w.y`, leave it.
4. `hopAt`/`hopK` are per-body ephemeral fields. Check `persist.js`'s
   `keepOf` does not write them (it whitelists); if it does, add them to the
   drop list. `test/persist-roundtrip.test.mjs` must stay green.
5. `test/land-hop.test.mjs`: clear a rock with rockhands on rock 2, run to
   the landing; every on-ground worker has `hopAt === S.landAt` and
   `hopK > 0`; a dome set-down (`landRock(true)`) sets none.
6. Scene `landing^`: the frame `LAND_HOP_MS / 2` after the landing, so the
   shot shows the crew at the top of the hop. Shot at `--zoom 2`; measure
   one body's pixel top against a `landing` shot from the same seed.
7. CHANGELOG: `- The crew get knocked off their feet for a beat when a rock
   lands.` (this one is a feature more than a fix -- put it in CHANGELOG
   anyway; the user asked for it as part of a fix list).

---

## Seams the integrator wires after the merge

- `makeBoulder(fromSky)` in `rock.js` calls `refitShield()` (Track B's
  export) right after the size is fixed. Track C owns `rock.js`; Track B
  exports the function; the call is the integrator's.
- CHANGELOG `Unreleased` collects the three lines; resolve conflicts keeping
  all.
- `DESIGN.md`: a short `(built)` note under the shields and the crew for
  each of the four; `TODO.md` if anything was left.

## Report shape (every track)

Deliverables one line each; files touched; the **pasted output** of the
test files you ran (`node --test test/<file>.test.mjs`, foreground, only the
files covering your change); shots taken and what they show; what you had
to decide that this document did not; anything you believe is wrong with
the design and implemented anyway.
