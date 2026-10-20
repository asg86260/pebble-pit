# The polish bar: what a place has to do, as the yard does it

**Status: draft for the owner's approval (2026-10-20).** Once approved,
CLAUDE.md and the orchestrate skill point every brief here.

The owner, 2026-10-20: "theres gotta be some way to inform agents to build
things to the same level of detail and polish as what we have for act 1."
This is that page. Every line under a heading is a check a builder can make
against a shot, a test or a file, and each names where the yard does it, so
the answer to "how polished?" is "this polished, here". The yard (act 1) is
the bar. The deep (act 2) meets most of it and is cited where it is the
better model.

Read it with CLAUDE.md ("Nothing teleports", "Systems a new station joins
unasked", "Every act runs on the shared systems") and
docs/design-language/canvas.md (palette, grid, line, motion). Where this
page and those disagree, they win and this page is wrong.

**The rule this page leans on.** When an act is short of a line here, the
first question is whether the *shared* mechanism already serves every place.
In several places below it does not (render.js runs the pile-mark layer in
the yard and the deep only, verify.js walks `S.workers` only, and so on).
Those are fixed once, in the shared file, for every place -- not written
again in `src/after/` or `src/hell/` (CLAUDE.md, "Fix the system, not the
instance").

Status words in the gap tables: **M** met, **P** partial, **X** missing,
**E** exempt by an owner's call (cited; do not "fix" it).

---

## 1. A station

Exemplars: `src/stations.js` (the table), `src/apothecary.js`,
`src/quarry.js`, `src/farm.js`. Scenes: `apothecary`, `quarry`, `farm`,
`loo`, `shack`, `filtering`.

- [ ] One row in `STATIONS` (`src/stations.js`) and that row is the whole
      place: `name`, `glyph`, `stand` (or `hit` for a drawn shape), `board`,
      `empty`, `post`, the gate (`after`, `needs`, `sticky`), and `place`
      outside the yard. Nothing asks a `<place>Open` boolean by name.
- [ ] Its glyph is drawn (`GLYPHS`, `src/glyphs.js`) and its own: no two
      stations of one place share a glyph, none falls back to `crate` (the
      bench alone is a crate).
- [ ] It appears by being built (§8), never by popping in; once it stands, the
      hover names it (§6), the cursor is `pointer` over it (`CURSORS`,
      `src/input.js`) and walking up opens its board (§5).
- [ ] Its output counts the **bodies at it**, never the assigned count:
      `atPot`/`inMix` (`src/apothecary.js`), the cut's bodies in their pockets
      (`src/quarry.js`), `shutIn` on the job row (`src/crew/jobs.js`).
- [ ] Several bodies at one station stand at their own spots (the k-th
      keeper at the k-th pot, `potStandX`, `src/apothecary.js`); no two drawn
      on top of each other.
- [ ] Its footprint is claimed for its whole life and touches nothing else's
      (`src/footprints.js`, the overlap rule in `src/verify.js`,
      `test/no-overlap.test.mjs`).
- [ ] Bought from off screen, the view goes to it (`lookAt`, `src/world.js`;
      the bench's call, `src/raise.js`).
- [ ] It is a stop: the hop arrows, the digit keys and the pad reach it
      (`src/stops.js`, read by `src/hop.js`, `src/input.js`, `src/pad.js`).
- [ ] Drawn as a flat silhouette on the `P` grid, material never one tone
      (canvas.md, "Variation"); act 3's flat-tone rule is the written
      exception (CLAUDE.md).

## 2. A job and its bodies

Exemplars: `src/crew/jobs.js`, `src/crew/step.js`, `src/crew/commute.js`,
`src/crew/idle.js`, `src/render/crew.js`, `src/apothecary.js`. The engine
for acts: `src/placebodies.js`. Scenes: `crew`, `seatswalk`, `cutgang`,
`potwork`, `apothpots`, `loo`, `diggers`, `carriers`, `dance`.

- [ ] **Registered:** one row in the place's `JOBS` registry with `factory`,
      `want`, `step` (`src/crew/jobs.js`; acts: `PLACES[v].crew.jobs`,
      `src/placebodies.js`). A job with a count and no `want` has every body
      stood down (CLAUDE.md, "Nothing teleports" 1).
- [ ] **Made whole:** every body gets its own rhythm (`ph`, `sp`) and its feet
      on its ground at birth (`FACTORY`, `src/crew/jobs.js`).
- [ ] **Walking:** it walks to every destination at the place's pace; its
      facing is measured from where it went (`faceTravel`,
      `src/crew/step.js`); it follows the ground (`feetOn`, `climbTo`); a
      footstep sounds every body-width.
- [ ] **Drawn at its true position:** a moving body is laid on a whole device
      pixel as one rigid piece (`rigid`, `src/render/crew.js`), never snapped
      to the cell grid (CLAUDE.md, 2026-10-20: "motion is smooth").
- [ ] **Through the door:** it walks to the door's x, and only then counts
      (§1) and goes out of the picture (`w.inside`, `underground`, `atHome`,
      skipped in `drawWorkers`).
- [ ] **Work pose:** working is a held pose at the station's spot, never a
      slide; a swing throws the body into the work (`LOOK.lunge`/`lean`), held
      not eased (`LEAN_HOLD`), on the body's own jittered clock (`stirAt`).
      **Every** body at the station poses, not the first alone.
- [ ] **Idle:** with nothing to do it strolls to one of a handful of real,
      weighted spots (`strollTo`, `src/crew/idle.js`), its pace ramping
      (`amble`), never inside another (`elbowIdle`). No standing frozen at a
      door, no random insect walk.
- [ ] **Carry:** §4.
- [ ] **In the hand:** it can be taken up, waggled, flicked and dropped; it
      falls under gravity and lands with a sound; shaken, it stands dizzy and
      spills what it held where it lands (§9); then walks back to its job
      (`src/crew/pointer.js`, `src/crew/falls.js`).
- [ ] **Asked about:** hovered, it shows its card (`askedAbout`,
      `src/input.js`); with the right button held it is ringed over a veil
      (`ring`, `drawSightVeil`); the corner's crew switch fades or hides it
      (`dim: 1`, `src/render.js`).
- [ ] **Reacts:** a landing rock knocks it into the hop (`HOP_POSES`,
      `src/rock.js`) with a `bang` over its head.

## 3. A pile and its pile-full mark

Exemplars: `src/game.js` (who is full), `src/render/pilemarks.js`,
`src/input.js`. Scene: `marks`.

- [ ] A pile that can fill is a strip in `S.piles` or a station row with
      `pile: () => bool` and `full: msg(...)` (the crusher, `src/stations.js`).
- [ ] Full stops the station; room for one more starts it again; the
      station's own crew shovel their own pile first (`mess.when`,
      `src/crew/jobs.js`).
- [ ] The mark is the shared hollow triangle (`warning`,
      `src/render/pilemarks.js`) placed by `pileMarkAt` off the row, under the
      pile, on whole cells -- no per-place copy of the triangle.
- [ ] Hovered it says why (`fullSays`), and the cursor turns `help` on the way
      to it (`overAnyMark`, `src/input.js`).
- [ ] Each item on a pile is a cell or a drawn thing and arrives by fading in
      or being set down, never by appearing.

## 4. A resource being carried

Exemplars: `src/render/crew.js`, `src/crew/hauler.js`, `src/tween.js`,
`test/pay-travel.test.mjs`. Scenes: `pair`, `carriers`, `belttail`,
`quarry`, `apothbuff`.

- [ ] A load is drawn as the thing itself, over the head or in the cart: a
      grain is its own mark, a shard is a shard; it rides on top of what the
      body wears.
- [ ] A number changes only when the carrying body arrives: the store is taken
      from when the body stands at it, given to when it gets there.
- [ ] A bill paid at a station travels: its coins cross the screen to where
      they are spent (`test/pay-travel.test.mjs`).
- [ ] Every number drawn runs to its value through `shown()` (`src/tween.js`),
      never jumps.

## 5. A board

Exemplars: `src/board.js`, `src/boardrows.js`, `src/shop.js`,
`src/upgrades/tiers.js`. Scenes: `boards`, `bench`, `quarryboardmid`,
`farmboardmid`, `unlockbars`, `fitting`, `phonebench`. Card bench:
`cards.html`.

- [ ] **Walk-up open:** it opens when the pointer arrives at the station (a
      tap on a phone); no click to open.
- [ ] Walking to the next station slides it across; a click off any station
      puts it away; panning its station off the window puts it away
      (`viewTaken`) -- which needs a `stand` that stays where the station is.
- [ ] Its rows are registered by the owning module (`registerBoard`) and
      bought through the one `buy`/`take`/`purse`.
- [ ] Every ladder is `tierRows` with `named` bands, `LADDER` rungs,
      `TIER_BAND` to a band, pips and an end (CLAUDE.md, "Decided"); a flat row
      with one bill is a bug.
- [ ] Every row has a drawn glyph (`GLYPH_OF`, `src/glyphs.js`) and a line in
      `test/shop-rows.mjs`.
- [ ] A bill's tile fills a coin at a time as the coins come in, its price
      tweens.
- [ ] An empty board says its `empty` line.

## 6. A click target and its hover text

Exemplars: `src/input.js` (`whatIsAt`, `askedAbout`, `CURSORS`),
`src/stations.js`. Scenes: `marks`, `crew-sight`, `assign`.

- [ ] Anything that answers a click answers a hover with a word, through
      `whatIsAt` (which draws nothing, so a check can ask it).
- [ ] The hit is what is drawn (`hit`) or the ground padded by `REACH`; where
      two overlap, the table's order settles it; the hit never reaches past
      the drawing.
- [ ] The cursor says what a press will do: `pointer` at a station, `help`
      toward a mark, `grab`/`grabbing` with the hand.
- [ ] Richer tooltips win over the label: a body's card, a full pile, a choose
      mark, a done mark, a status.
- [ ] A press goes through the shared cascade in `pointerdown`; an act's own
      click is asked only after the station table.

## 7. A station's glyph stack

Exemplars: `src/render/bars.js` (`workSpots`, `stackSlot`, `buildingGlyph`,
`drift`), `src/render/donemarks.js`, `src/works.js`. Scenes: `sitebars`,
`donemark`, `donestack`, `queue`, `queuerepeat`, `fitting`.

- [ ] Over a building coming up out of the ground: the bar. Over anything else
      a station is working on: the row's own glyph, filling bottom row first,
      a cell of the drawing a share of the work, the rung's tint round what is
      up (`buildingGlyph`).
- [ ] What is in line hangs as the outline over the one being built; what has
      finished stays ticked at the foot until its board is read
      (`drawDoneMarks`); the stack reads bottom to top in the order bought.
- [ ] The stack hangs off the station's own box (`barSpot`), clear of its
      flag, and moves with the station.
- [ ] Each glyph drifts on its own hashed clock (`drift`) on whole device
      pixels -- a stack never breathes in unison.
- [ ] The bar stops dead while nobody is at the site.

## 8. A construction or build

Exemplars: `src/works.js`, `src/crew/builders.js`, `src/render/rise.js`,
`src/render/buildsites.js`. Scenes: `build`, `build2`, `building`,
`buildstalled`, `benchup`, `propsrising`, `housequeue`.

- [ ] Anything bought with work (a rung, a machine, a building) is raised by
      a body walking to its site; nothing finishes on the press; the work
      stops when nobody is there.
- [ ] A building comes out of the ground clipped to its progress
      (`risingPlaces`) with the bar over it (§7).
- [ ] The site looks like a site: barrier posts, tape, the chips off the
      hammer (`src/render/buildsites.js`); every blow sounds (`build-blow`);
      the finished thing lands with `work-land`.
- [ ] Its ground is reserved from the first frame (§1, overlaps).

## 9. A fall or a drop: bodies and rocks

Exemplars: `src/crew/falls.js`, `src/placebodies.js`, `src/rock.js`,
`src/world.js`. Scenes: `introfall`, `landing`, `rock`, `assign`, `dance`.

- [ ] A body let go of falls under `GRAV` with the hand's flick (`HURL`,
      capped, dragged by `HURL_DRAG`), bounces off the world's ends at 0.4,
      lands on the highest thing under it; a shaken body comes down dizzy and
      spills its load as grains where it lands; its hat falls on its own; the
      landing sounds (`body-land`).
- [ ] A rock lands with `boulder-land`; the jolt knocks grains off the heaps,
      every body under it says `bang` and hops, and the view shakes in
      proportion to the rock, in the yard view only. (canvas.md says "No
      shake"; `src/rock.js` shakes -- **owner question**.)
- [ ] A thing that breaks comes apart a piece at a time and each piece lands
      and is carried off; nothing vanishes.

## 10. A cutscene beat

Exemplars: `src/beats.js`, `src/cutscene.js`, `src/shot.js`, `src/skip.js`,
`src/intro.js`, `src/finale.js`. DESIGN.md: "The cutscenes, fleshed out",
"One camera for every cutscene". Scenes: `opening`, `leaving`, `introfall`,
`rescue`, `snatch`, `abyss-intro`, `finale-parade`. Bench:
`cutscenes.html`.

- [ ] A `BEATS` row (`src/beats.js`) and a scene on `cutscene.js`'s own terms,
      not a second mechanism.
- [ ] It starts before the event (the shields' scene starts as the rock leaves
      the sky) so the glide is done before the moment.
- [ ] The camera is `shot.js`'s: it frames a box between the bands, glides on
      the one ease or follows on a spring; framing measured off what is
      watched, never a fixed zoom.
- [ ] It ends on a fact plus a tail, not on a timer (a ceiling is a safety).
- [ ] The rest of the game keeps running under it; nothing lands on it
      (sheets and pins wait for `!S.cine`).
- [ ] A click or space hurries or releases the camera, never the moment;
      under reduced motion the beat is watched from where it ends.
- [ ] Every body in it walks there; what it shows has a drawing (no caption
      standing in for a picture).
- [ ] It survives a reload (`cineOwed`).

## 11. Sound

Exemplars: `src/audio.js`, `src/config/sound.js` (`SOUNDS`, `RECIPES`),
`test/sound-events.test.mjs`, `test/sound-lanes.test.mjs`,
`tools/listen.mjs`, `tools/node/sound-audition.mjs`. DESIGN.md: "The yard's
sound set, by lanes".

- [ ] Every event the player can see happen names itself to
      `sfx(name, { x, ... })`; each name is a `SOUNDS` row with a class
      (`hand`, `fold`, `punct`) and `onScreen`/`perS` where it is ambient.
- [ ] A walk sounds (`footstep`), a hammer sounds (`build-blow`), a work unit
      at a station sounds (`pick-swing`, `shovel-scrape`, `belt-load`), a
      landing sounds (`body-land`, `grain-land`, `boulder-land`).
- [ ] An off-screen place is silent under `onScreen` rows; there is no bed.
- [ ] It is heard through `tools/listen.mjs` before it is called done.

## 12. Weather and sky

Exemplars: `src/weather.js`, `src/air.js`, `src/smog/`, `src/wind.js`,
`src/render/clouds.js` (the one cloud renderer). Scenes: `sky0`-`sky3`,
`cloudswell`, `cloudsettle`, `rain`, `raindepth`, `lightning`,
`lightningflash`, `gustR`, `firstmuck`, `deep-storm`.

- [ ] The sky is cause and effect: the works dirty it in their own tints, the
      clouds swell on the storm's clock, rain is born under them, only a dirty
      drop lays muck (verify rule 14).
- [ ] It has depth: clouds slide at their own parallax, the haze in three
      bands at three distances (`src/air.js`).
- [ ] Things in it answer the hand (birds startle, are hovered).
- [ ] It stays in its place (nothing of the yard's storm reaches the deep).
- [ ] Clouds go through `src/render/clouds.js`, never a new cloud drawer.
- [ ] A place's pressure (a storm, a flare) warns before it lands and is seen
      when it lands.

## 13. Camera and pan

Exemplars: `src/world.js` (`clampCam`, `lookAt`, `setZoom`), `src/shot.js`
(`PLACE_LIMITS`), `src/view.js` (`travel`), `src/input.js` (`pan`,
`viewTaken`), `tools/jitter-check.mjs`. Scenes: `flank`, `westend`, `yard`,
`endgame`, `glide-down-in`.

- [ ] The camera is the one camera, clamped by the place's limits.
- [ ] Every move the game makes is a glide (`S.camTo`); a cut only under
      reduced motion.
- [ ] Drag, wheel, keys, the pad's stick and two fingers all pan through
      `pan`; any pan hands the view back to the player (`unfollow`).
- [ ] A place change is a ripple through a portal (`travel`), never a cut.
- [ ] Panning shears nothing and jitters nothing:
      `node tools/jitter-check.mjs <scene>` is clean.
- [ ] A one-time beat in a place goes to it (§10); opening a new chamber or
      room glides on.

## 14. The dark page

Exemplars: `src/ink.js`, `src/render.js` (`mapOf`), `src/config/palette.js`.
DESIGN.md: "Dark mode: the page turned over". Check: `play.html?dark` on any
scene; `src/selftest/deeppalette.js`; `test/after-palette.test.mjs`.

- [ ] No render file writes a color but `'#000'`, `'#fff'` and palette tokens;
      everything goes through `ink.js` by lightness.
- [ ] Each place is drawn in a map of its own where turning it over would
      invert its meaning; `mapOf` names the place.
- [ ] A fade is opacity and is exempt from the palette.
- [ ] The switch is a reload under a veil; the palette is fixed at boot.

---

## How acts inherit this

**Free from the shared systems, today:** station hit test, hover name,
`pointer` cursor, walk-up board, slide, close on click-off (a `STATIONS` row
with `place`); boards, `buy`/`take`/`purse`, `tierRows` bands and pips;
body stepping, fill-by-count, the walks, the hand's grab/flick/fall
(`src/placebodies.js`); the reload check over every place's bodies; the
no-overlap rule; beats, letterbox, glide and hurry; place travel by ripple;
the camera clamp; clouds (`src/render/clouds.js`); the warning triangle and
the stack glyph as functions.

**Shared, but not yet serving the acts (fix once, in the shared file):**

| defect | where | fix in |
|---|---|---|
| pile marks, work bars, done marks drawn in yard and deep only | `src/render.js` (`YARD_DEEP` tags) | the layers' `in`, and `markedPiles` filtered by place |
| row piles never get the `help` cursor (any place) | `src/input.js` reads `S.piles` only | `overAnyMark` over `markedPiles()` |
| glyph stack and construction only for the yard's works | `src/stations.js` registers yard sites only; `src/render/bars.js` walks `SITES` | the place engine's construction step |
| act bodies have no hover card | `src/crew/pointer.js`; `src/input.js` uses yard-only `workerAt` | `whatIsAt`/`askedAbout` ask `PLACES[v].crew` |
| crew sight veil, ring and crew switch skip act bodies | `src/render.js` layers carry no `dim`; `drawSightVeil` yard only | the layers' `dim`, a ring off `crew.box` |
| footsteps only for `S.workers` | `src/crew/step.js` | a `faceTravel`-style pass in the engine |
| hell's stations are deep stops; the pad finds none in hell | `src/stops.js` (`half` by `deepTop`); `src/pad.js` | `half` from the row's `place` |
| hop in an act lists the yard's stations (likely) | `src/hop.js` asks only `'yard'` or `'deep'` | `stops(S.view)` |
| no verify rule watches act bodies | `src/verify.js` loops `S.workers` | the rules over every `PLACES[v].crew.list()` |
| hell has no dark-page map of its own | `src/render.js` (hell falls to `'yard'`) | `mapOf` and `ink.js` ENDS |
| fall in the acts: no land sound, no dizzy, no spill | `src/placebodies.js` | the engine's `fall` |

**What an act must supply as data:** its `STATIONS` rows (place, name, a
**distinct drawn glyph**, stand/hit, board, empty, `pile` + `full` for every
pile that can fill; a `stand` that stays with the station); its crew
descriptor and a `JOBS` row per job; its art and every working body's pose;
its `LAYERS` entries with `in`, its ink map and its palette with a role a
tone; its `SOUNDS` rows and the `sfx` calls at each event; its beats' bodies
and frames with drawings; its numbers in `src/config/<act>.js`, its words in
`locales/en.ftl`, its scenes in `src/scenes.js` (one per item here), and its
save through `readOver` and `SAVERS`.

**Owner exemptions (do not "fix"):** act 3 is flat tones with God's outline
the only outline (2026-10-19); act 3 has no ladders and no bands (call 12),
so its rows are not in `test/shop-rows.mjs`; act bodies stay in their place's
own list; act 3's hand gestures and its crowd and union sim are its own; hell
has no red, its fire is white, its heat breathing white cells; hell has no
sky.

---

## Gaps, as on main (da7cb21e)

| item | act 3 | act 4 |
|---|---|---|
| **Station** row, name, gate | M | M |
| distinct drawn glyph | X all `'crate'` | X all `'crate'` |
| output from bodies at it | M | M |
| spread at the station | P one-cell offsets for three-cell bodies | X miners share one stand |
| look-at on open | X | X |
| a stop (hop/digits/pad) | P a parallel list (`gestureStops`) | X tagged `'deep'` |
| **Job** registry | M | P `step` only; filled by muster order |
| walk eased, faced | P constant walk | P constant walk |
| drawn at true x | X snapped to cells (`src/render/after.js`) | M |
| footsteps | X | X |
| work pose, every body | P first body only | P the pick alone moves |
| idle | P stands still at the door | X all stacked at the store |
| fade in and out | M | M |
| hover card, crew sight, crew switch | X (shared) | X (shared) |
| hand: lift, flick, fall | M | M |
| hand: dizzy, spill, land sound | X | X |
| **Pile** stops its station | M | M |
| shared mark and hover | P `warning()` by hand, no hover | X own mark, no hover |
| **Carry** drawn as the thing | M | P one tone cell (placeholder) |
| number moves on arrival | M | M |
| bill travels | M | X subtracts on the press |
| counts tween | X | X |
| **Board** walk-up open | M | M |
| closes on pan | M stations; P God's crowd row (likely) | P (likely never) |
| ladder in bands | E call 12 | M |
| shop-rows lines | E | M |
| **Hover** on stations, cursor | M | M |
| **Glyph stack** | P one glyph while working; no queue, no ticks | X rungs instant |
| **Construction** by bodies | P own mechanism, no bar, no sound | X rungs on the press; a chamber's contents pop at the barrier's fall |
| **Fall / drop** of things | P tree in held frames (being reworked to smooth motion) | M barrier pieces fall and land; no sound |
| **Cutscene** beats | P captions stand in for drawings | P wall beats stubs; no glide to the next chamber |
| **Sound** | X none | X none |
| **Sky** | M shared cloud renderer | E no sky |
| **Camera** | M | M clamp; P no glide on a barrier's fall |
| **Dark page** | M own spread | unverified: yard's turned map |
| line weight | M | X 1-px world lines |
| verify rules over bodies | X (shared) | X (shared) |
| reload check, overlaps | M | M |

---

## Automated gates

Every gate lands the way `KNOWN_OVERLAPS` does (`src/verify.js`): it carries
an allowlist of today's gaps, keyed `place:key:item`, green on main; red
when a listed gap is fixed but still listed (the list only shrinks); red on
any new gap. Node tier unless said.

1. **`test/place-bar.test.mjs` -- the station walker.** For every open
   `STATIONS` row in every place: a name; a drawn, distinct, non-crate glyph;
   `stationAt` and `whatIsAt` at its hit box; a board with rows or an `empty`
   line; a stop; panning two windows away shuts its board; with a `pile`,
   forced full, the mark and its hover; every job it names registered; and
   through the door -- with every body held off it, five game seconds move no
   output (needs a `made: () => number` column on every row).
2. **`src/verify.js` rule: "a body jumped"** -- every body in every place,
   failing when a frame's step exceeds the place's pace × dt plus a cell
   (skips lifted, falling, first frame, place changes); plus "a body arrived
   at full ink".
3. **`test/place-sounds.test.mjs`** -- ten game seconds in each act with
   bodies walking and working raise at least one footstep and one work
   sound; every `sfx` name used in an act is a `SOUNDS` row.
4. **`test/place-drawn.test.mjs`** -- on a recording canvas: every world fill
   at least `P / 3` on its short side; a body at a half-cell x is drawn at
   that x; hell's palette with a role a tone.
5. **`test/place-layers.test.mjs`** -- pile marks, work bars, done marks drawn
   in every place; act body layers carry `dim`; `mapOf` gives each place its
   own map.
6. **Browser: walk-up open in every place** -- a real pointer onto each act
   station opens its board with the station's name, panning away shuts it.
7. **Browser: dark page** -- `hell-forge` and `act3-mid` on `?dark`, no color
   outside the place's map.

**Shot-only (the shot is the check):** every work pose reads as working
(`act3-mid`, `hell-forge`); idle reads as people (`crew`, `after-camp`,
`hell-forge`); a load reads as the thing (`carriers`, `after-sign-carry`); a
stack drifts, not ticks (`donestack`); a beat shows a drawing, not a caption
(`opening`, `act3-start`); the pan is clean (`jitter-check`); the dark page
reads right.

**Owner questions this survey raised:** the shake on landing
(`src/rock.js`) against canvas.md's "No shake"; CLAUDE.md's
`inFilter()`/`inLab()` examples are gone (this page cites
`src/apothecary.js`).
