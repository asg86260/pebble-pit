# Wave: the party -- fighters in slots, ten classes, one ladder each

**Status: DRAFT, awaiting the owner's sign-off. Once signed, this document is
canon. Subagents: do not redesign; implement.** Where a number or a name is
written here, use it. Where this document is silent, section 0 of
`docs/serpent-classes.md` ("Simplified: one ladder a class", canon) and its
section 2 decide; after them, DESIGN.md "Fighters in slots". If something
turns out to be impossible, say so in the report rather than inventing a
different feature.

## What is being built, in one paragraph

The deep's five weapon crews and their fixed door order go. In their place:
**stations** the player builds on the deep's floor, any kind, in any order,
more than one of a kind; **one fighter at a station**; the fighter's
**class** chosen on the station's board from that station's two; **one
ladder of eight rungs a station**, its signature move at rung 4 and its
capstone at rung 8; the tree shown as **collapsing rails**, one tap views,
buying commits, one Reset refunds; **fighter slots** bought with the
**fang** the serpent drops at each phase it loses; the kits and attacks of
the class bench, growing a mark at rung 4 and a touch at rung 8; statuses
laid on the whole serpent or on a fighter. The sqwife is the first fighter.
This half is not about fighting: every choice here is small, and the
simplest honest reading wins.

## What is being optimized

A second half the owner can **play through and review**: every piece built,
reached the way a player reaches it, and drawn. Numbers are first guesses in
`config/`; tuning comes after the review. Where scope has to give, give on
the polish of a drawing, never on "nothing teleports", never on reaching a
thing the player's way, never on a save from before this wave.

## House rules (CLAUDE.md, not optional)

`config.js` owns every number and `state.js` every fact that changes; every
new field on `S` goes in one of state.js's three lists. Comments say why, in
the register of `air.js` or `roster.js`. American English. Black and white
and the abyss's purple, on the `P` grid. **Nothing teleports**: every body
swims to every destination, a fang sinks and is carried, a station is built
by a body. Every ladder through `tierRows` with `named` bands and a written
table in `LADDERS`. Hover and panel text is **one short line: a name and what
it does** (the owner, 2026-09-27). Buy it like a player: every feature has a
check that reaches it through the row, the click, or the walk.

## Decided here (the owner may overrule at sign-off)

These close questions the design left open; they are the simplest reading.

1. **The floor, left to right** (the owner, 2026-09-28): the crusher, the
   pods, then the stations in the order they are bought, each at the next
   free floor slot; empty floor after the last.
2. **The first station is free.** At the snatch the first slot shows a
   **floating build button**. Pressing it offers **the altar, the armory
   or the spire** (the starting classes Brawler, Ranger, Mage); a delver
   builds the pick, and the sqwife swims to it when it stands. Until then
   she treads water by the pods, and the click still punches.
3. **A fang buys the next station, and the station brings its fighter.**
   The serpent drops a fang at each of the first three phase breaks; it
   sinks like a scale and a gatherer carries it to the crusher (`S.fangs`,
   a coin). **Once a fang is held, a floating build button appears over
   the next free slot**, drawn with the fang's mark, so it reads at a
   glance that the fang pays for it. Pressing it offers the five kinds;
   the fang is spent, a delver builds the station, and a pod resident
   swims to it as its fighter. So stations and fighters are one and the
   same: **four at most**, the first and three fangs. Building a station
   is not sold on the pods board. **The second station opens every
   class** (the owner: "Buying a second station"); a second of a kind is
   no dearer than the first (both cost a fang).
4. **With no spare pod resident**, the button still builds the station,
   and it stands without a fighter until a pod resident is free, who then
   swims to it. A station without a fighter does nothing.
5. **The station's rungs are its own.** `S.stations[i].rung`, bought on
   that station's rails. The class chosen reads them. **Reset** refunds
   every rung bought at that station (the bills paid, from the station's
   own record) and blanks its class; the fighter stays and fights the
   station's base attack at rung 0 of the next class taken.
6. **Before a class is taken the station's fighter does nothing** but
   stand guard; the first rung bought commits the class.
7. **The star** stays the machine bought in sparks on the spire's board --
   now "any spire's board" -- and lands on the belly, or on a Lit serpent
   anywhere (no beams to follow any more).
8. **The Bard does no damage** and needs another fighter to buff; with no
   other fighter her song does nothing, and her rail says so in its line.
9. **Every class wins alone except the Bard** (the owner). Each damage class
   does half in one phase (`SERPENT_DEFENSE`, below); nothing walls.
10. **Old saves** are migrated by refund (v7, below): nothing is lost, the
    player rebuilds.

## The model (the seam every track codes against)

### State (owner: STATE; every field in a list)

```js
// src/state.js, "the party"
stations: [],     // SAVED. [{ id, kind, slot, built, cls, rung, paid, fighter }]
                  //   id: 's1', 's2'... never reused; kind: 'altar'|'well'|'armory'|'circle'|'spire'
                  //   slot: index into DEEP_SLOTS; built: false until its work lands
                  //   cls: null | class key; rung: 0..8; paid: [[coin, n], ...] summed bills for Reset
                  //   fighter: worker uid | null
stationsBuilt: 0, // SAVED. how many stations ever stood built, for the class unlock
fangs: 0, seenFang: false,   // SAVED. the coin
fangsDropped: 0,  // SAVED. breaks that have dropped theirs (a fang drops once per break, even across a reload)
fangsLoose: [],   // SAVED_BY_HAND (the scales' saver owns it): fangs sinking or on the floor
statuses: {},     // EPHEMERAL. { bleed, exposed, held, lit, weakened }: each { until, k } (ms, 0..1)
stationBoardOpen: null, // EPHEMERAL. the id of the station whose board is up
```

The armory's kind is `'armory'` (the old `font` key is retired with its
flags). Fighter buffs (`inspired`, `hasted`) live on the body as ephemeral
fields `w.inspiredUntil`, `w.hastedUntil`, not on `S`.

Retired from `S` (and from their lists): `brawlers lancers grenadiers scribes
warlocks`, `wellOpen fontOpen circleOpen spireOpen`, the nine weapon levels
(`punchLevel brawlLevel lanceLevel lanceholdLevel grenadeLevel
grenadepaceLevel sigilLevel beamLevel curseLevel`), `sigils`, `lances`,
`grenades`, `rings`, `beams`, the per-station `*BoardOpen` flags. `starOpen`
and `starLevel` stay.

### One type, one job (owner: CREW)

`TYPE.FIGHTER = 'fighter'`, `JOB.FIGHT = 'fighters'`, in `DEEP_TYPES` (so
`isDeepType` is true, its feet on `ways().deep`, `surface()` never drags it
up). `want` for fighters = the number of stations with a `fighter` set.
A fighter body carries `w.station` (a station id) and is placed and stepped
by that id. The five old types, jobs, factories, caps and `want` rows go.
`DEEP_JOBS` becomes `[JOB.FIGHT]`.

### The party module (owner: CREW) -- `src/deep/party.js`

The queries everyone reads; nobody else writes `S.stations`.

```js
export const stationById = id => S.stations.find(s => s.id === id)
export const stationsBuilt = () => S.stations.filter(s => s.built)
export const classOf = st => st.cls && CLASSES[st.cls]          // the CLASSES row, or null
export const fighterAt = st => st.fighter && workerByUid(st.fighter)
export const nextSlot = () => /* the lowest DEEP_SLOTS index with no station */
export const canBuild = () => S.stations.length === 0 || (S.fangs > 0 && S.stations.length < FIGHT_STATIONS_MAX)
export const classesOpen = kind => (S.stationsBuilt >= 2 ? PAIRS[kind] : PAIRS[kind].filter(k => STARTERS.includes(k)))
export function buildStation(kind)   // the floating button's pick: spend a fang (the first is free), push {built:false}, queue the work
export function stationLanded(id)    // the work's land hook: built = true, stationsBuilt++, seat()
export function seat()               // a spare pod resident -> each built station with no fighter, oldest first
export function moveFighter(id, dir) // the roster post's +/-: one fighter a station
export function buyRung(id, cls)     // commit cls on the first rung, rung++, add the bill to paid
export function resetStation(id)     // refund paid, rung 0, cls null (the fighter stays)
```

### Classes (owner: FIGHT) -- `src/config/classes.js`, `src/deep/classes.js`

```js
// src/config/classes.js
export const PAIRS = { altar: ['brawler', 'sword'], well: ['monk', 'martial'],
  armory: ['ranger', 'assassin'], circle: ['hexer', 'sapper'], spire: ['mage', 'bard'] };
export const STARTERS = ['brawler', 'ranger', 'mage'];   // with the altar, armory, spire
export const FIRST_KINDS = ['altar', 'armory', 'spire'];
export const CLASSES = { brawler: { name: 'Brawler', ladder: 'brawler', hit: 'brawler', melee: true, ... }, ... }
```

Each class: `name`, its `ladder` key in `LADDERS`, the `hit` key it strikes
with (a key of `SERPENT_DEFENSE`), `melee`, its tempo, its base damage per
rung from its ladder, and its move and capstone numbers. The ten, from the
canon table, with their hit keys and the status each lays:

| class | kind | base (rung 0-3) | rung 4 move | rung 8 capstone | lays |
|---|---|---|---|---|---|
| brawler | altar | punch, melee, 1.2 s | Haymaker: every 4th punch x4, a blow that stuns | haymaker stun x1.5 | Stunned |
| sword | altar | cut, melee, 1 s, bleeds | Whirlwind: each cut lands at three spots | every 3rd cut hits twice | Bleeding |
| monk | well | palm wave, ranged, 1 s; chi pips, a full row is a stunning chi palm | chi fills twice as fast | chi palm stun x1.5 | Stunned |
| martial | well | staff thrust, melee, 3/s; pips; a full row is a finisher blow | Flow: thrusts fill 2 pips | the finisher Hastes the party 3 s | Hasted |
| ranger | armory | arrow, ranged, overhead, 0.8 s | Aimed shot: every 5th arrow x5 | the aimed shot stuns | Stunned |
| assassin | armory | stab, melee, 1.5 s; x3 on a stunned serpent | Execution: stabs x(1 + wound share), to x2 | x3 in the phase's last tenth | -- |
| sapper | circle | thrown charge, ranged, 6 s | Sticky charge: stuck, ticks, one blow x3 that stuns | two stuck at once | Stunned, Exposed on the blow |
| hexer | circle | hex, ranged, 5 s: Weakened (heal cut) | Binding: the serpent Held | Held takes +30% from blows | Weakened, Held |
| mage | spire | bolt, ranged, 2 s: Lit | Arcane lantern: the whole serpent Lit | Lit takes +20% from everyone | Lit |
| bard | spire | song: other fighters Inspired (+10%) | Anthem: Inspired doubles | Inspired lingers 6 s | Inspired |

Pips (the Martial Artist's combo, the Monk's chi, the Sapper's countdown if
drawn as pips, the Haymaker's count) are the class bench's pip row: one row
under the body, lit white, unlit a grey step up from the water.

`src/deep/classes.js` exports `stepFighter(w, c)` (dispatches by the
station's class; a classless station's fighter holds guard) and the
per-class steps, reusing `swim`, `working`, `strike`, `blowK`,
`nearestSeg`, `coilAt`, `coilThick`, `rest`, the projectile loops of
`arms.js` rewritten for arrows, bolts and charges, and `stepStar`.

### Statuses (owner: FIGHT) -- `src/deep/statuses.js`

`lay(key, k, s)` sets `S.statuses[key] = { until: now + s*1000, k }` (the
longer and stronger of the two stands); `has(key)`, `level(key)`,
`stepStatuses(c)` expires them. Effects, read in `strike` and `healNow`:
**Bleeding** ticks damage; **Exposed** +25% from everything; **Held** no
heal for its length and the coil holds its pose (the stun's `serpentStill`
path); **Lit** full damage in the fading phase (replaces `FADE_UNLIT`'s
beam test); **Weakened** heal x(1 - k), capped by `HEAL_CUT_MAX`. **Stunned**
stays the built stun (`S.serpentStun`), not a status entry. Amps add, then
multiply once, capped at `AMP_MAX`. Fighter buffs: **Inspired** +10% (x2 at
Anthem), **Hasted** +20% tempo.

`SERPENT_DEFENSE` (config/deep.js) is rewritten with one row per hit key,
each damage class half in one phase and whole in the rest: brawler [1, .5,
1, 1] (the ward), sword [1, 1, .5, 1], monk [.5, 1, 1, 1], martial [1, .5, 1,
1], ranger [1, 1, 1, .5], assassin [1, 1, .5, 1], sapper [1, 1, .5, 1],
hexer [.5, 1, 1, 1], mage [1, 1, .5, 1], star [1, 1, 1, 1]. `FADE_UNLIT`
rises to .5. The click stays `strike('punch', CLICK_DMG[...])` -- the
owner: "Always a punch" -- with `punch` a row of its own and the click's
damage a written table on the first station's rung (`CLICK_DMG`).

### Ladders (owner: BOARD) -- `src/config/rungs.js`

Ten `LADDERS` entries, one a class, keyed by class (`brawler`, `sword`,
... `bard`): nine values (the base damage, or for the Bard the Inspired
share) and eight costs, the deep's `lead: 'scale'` bands (scales; +dust;
+dust, ore; +a spark). The nine old weapon ladders go. **The rung lives on
the station**: `tierRows` gains a `field` that may be a getter/setter pair
(`{ get: () => st.rung, set: v => ... }`) rather than a key on `S` -- the
one change to `upgrades/tiers.js`, additive, owned by BOARD.

### Floor slots (owner: BOARD) -- `src/config/deep.js`, `src/deep/place.js`

`DEEP_SLOTS = [.335, .475, .62, .76, .9, .405, .69]` (fractions of
`DEEP_W`; the old five spots first, two between). `slotX(i)`,
`standOfStation(st)` in `place.js`. A station kind's drawing is `SPRITES[kind]`
(the armory reuses `font`'s sprite under its new key). A built station is
drawn at its slot; an unbuilt one as the build site's scaffold, as works
are today. `FIGHT_STATIONS_MAX = 4`: the first station and three fangs.

## The boards (owner: BOARD)

- **The floating build button** (BOARD, `src/deep/buildbutton.js`): a small
  button standing over the next free floor slot, in the world, drawn with
  the fang's mark and the count held; shown at the snatch (free, the three
  starting kinds) and whenever a fang is held and a slot is free. Pressed,
  it opens a small picker of the kinds it may build (one short line each:
  the kind and its two classes); picking one spends the fang and queues
  the work. It rides the deep's camera like the roster posts, and fades
  in and out, never pops. The pods board sells pods only.
- **A station's board** (one per built station, keyed by id: `registerBoard`
  takes the id) shows **the rails** (below) and, above them, the station's
  roster post (its fighter), and on any spire the star's two rows.
- The old altar doors, weapon rows and the five weapon boards go.

### The rails (owner: BOARD) -- `src/deep/rails.js`, CSS in `shelf.css` (additive block)

The voted option 2b of `docs/mocks/tree-2026-09-27.html`, simplified to one
rail a class: the station's two classes as two plates, one rail of eight
pips each, rung 4 and rung 8 as bigger nodes; a panel beside (under, at
phone width) with one short line for what is viewed; a Buy button naming
what it buys (`Buy Brawler 5`); **Reset** (refunds, blanks). A tap or hover
views (the other rail fades); the first rung bought commits the class and
the other rail folds away (height and ink in steps over 0.2 s; instant under
`prefers-reduced-motion`). Only classes open (`classesOpen(kind)`) are drawn;
a locked class's plate shows `opens with a second station`. The pips wear
the ladder's band colors, as every card's do. The bill tag and coin marks
are the cards' own (`board.js` builders), so a rail reads as the boards do.

## The picture (owner: RENDER)

- **Fighters**: the square body plus the class's kit, its rung-4 mark and
  rung-8 touch, and **each rung's attack**, exactly as the owner approves
  them on `docs/mocks/kit-growth-2026-09-27.html` -- **the single visual
  reference** for classes (the class bench shows the retired branch
  keystones; use it only for a detail the growth page lacks). Ported from
  the page's cells to world cells, driven by the sim's own timers (not
  fixed animation clocks: the old `PUNCH_MS` bug), so tempo and positions
  follow the game while shapes, gear, tones and motion match the page.
- **Off-grid motion** (the owner, 2026-09-28, option 2 of
  `docs/mocks/grid-2026-09-28.html`): kits and attacks are built from whole
  cells, but a thing **in motion** is drawn at whole pixels, and everything
  returns to the cell grid at rest -- as bodies already walk. **A moving kit
  is one rigid sprite**: its cells drawn once into its own image and that
  image moved, and for a spin rotated, whole; never re-drawn as a new line of
  cells at each position or angle ("the cells should stay intact and aligned
  correctly"). No smoothing, no sub-pixel. This is a deliberate exception to
  CLAUDE.md's "everything on the P grid", for the deep's fighters only.
- **Statuses** on the whole serpent (the bench's painters for Bleeding,
  Exposed, Held, Lit, Weakened) and on fighters (Inspired, Hasted); the
  stun is the built ring.
- **The fang**: a white fang of a few cells, sinking and carried like a
  scale; a mark on the counter card beside the scale's once seen.
- **Stations** at their slots, and their build scaffolds.
- The weapon layers (`sigils`, `beams`, `lances`, `grenades`, `punches`)
  are replaced by `fighters` and `shots` (arrows, bolts, charges) in
  `LAYERS`, in the `DEEP` set.

## Old saves (owner: STATE) -- migration v7

`src/migrations/2026-09-28-party.js`, `SAVE_V` 7:

- The altar and the open old doors become built stations of their kind
  (`font` -> `armory`), classless, rung 0, in the floor's order, **at most
  `1 + serpentStage`** (the first station and a fang a break); a door past
  that is refunded with the rest.
- **Every weapon ladder level is refunded**: the sum of its bills paid,
  added to the purse. Sigils, lances, grenades, beams are dropped.
- `fangsDropped = serpentStage`, and `fangs` = the breaks past, less the
  stations beyond the first that the old save already stands (at least 0),
  so no fang is lost or doubled.
- Weapon bodies become pod residents (gatherers); the sqwife becomes the
  fighter of the first station.
- The migration says one line on load (`says`): "The deep was rebuilt:
  pick your fighters' classes; your upgrades were refunded."

## Tracks and ownership

Disjoint files. A track may call any track's exports; only the owner edits
a file. Shared files are additive-only, one block at the end under a
comment naming the track.

| track | owns | tests it writes or rewrites |
|---|---|---|
| **CREW** | src/jobs.js, src/crew/jobs.js, src/crew/deep.js, src/crew/muster.js, src/crew/commute.js, src/staffing.js, src/levels.js, src/config/deepcrew.js, src/snatch.js, src/deep/party.js (new), src/roster.js | party.test.mjs (new), deep-crew, pods, two-crews, snatch |
| **FIGHT** | src/deep/arms.js, src/deep/serpent.js, src/deep/rest.js, src/deep/classes.js (new), src/deep/statuses.js (new), src/config/deep.js, src/config/classes.js (new) | classes.test.mjs (new, one group a class), statuses.test.mjs (new), deep-arms, serpent, serpent-stun, serpent-numbers, deep-rest |
| **BOARD** | src/stations.js, src/deep/rows.js, src/deep/rails.js (new), src/deep/buildbutton.js (new), src/config/deepboard.js, src/config/rungs.js, src/deep/place.js, src/deep/sprites.js, src/works.js (DOWN_THERE, TICKS_AT only), src/upgrades/tiers.js (the field getter only), src/glyphs.js, ladders.html, glyphs.html, stations.html | rails.test.mjs (new), deep-board, deep-works, gates, test/shop-rows.mjs; a browser group `rails` in src/selftest/deep.js |
| **RENDER** | src/render/arms.js, src/render/deep.js, src/render/crew.js (deep bodies only), src/render/serpent.js, src/render/scales.js, src/config/deepdraw.js, src/deep/kits.js (new) | deep-view; shots of every scene below |
| **STATE** | src/state.js, src/migrations/*, src/config/saves.js, src/crew/records.js, src/hooks.js, src/scenes.js, src/verify.js | persist-roundtrip, save-floor, party-migrate.test.mjs (new, from a real v6 save in test/fixtures/) |

Shared, additive-only: `src/config.js` (the barrel), `src/render.js`
(LAYERS entries), `src/game.js` (STEPS), `src/selftest.js`, `src/shelf.css`,
`CHANGELOG.md`, `DESIGN.md`, `TODO.md`.

**Order of work inside the wave.** STATE lands the state fields, the
retirements and `__party` hooks first (a skeleton commit on the spec
branch, before the tracks fork), so every track codes against real fields.
CREW's `party.js` stubs (signatures above, bodies `TODO`) land in the same
skeleton. Then the five tracks run in parallel.

## Hooks and scenes (owner: STATE)

`__party({ stations: [{kind, cls, rung}], slots, fangs })` stands a party
up for the setup a check is not about. Scenes: `party-start` (just after
the snatch, no station), `party-one` (a Brawler at rung 4), `party-four`
(four fighters, rung 8, one of each of four classes), `party-bard` (a Bard
and a Ranger, Anthem), `party-fang` (a fang sinking after a break),
`party-rails` (the altar's board up, blank rails), `party-button` (a fang held, the button over the next slot), and one scene a class at
rung 8 (`class-brawler` ... `class-bard`). The old weapon scenes are
removed or rewritten onto classes.

## Checks (buy it like a player)

- **party.test.mjs** (CREW): after the snatch the floating button offers
  three station kinds; one is built free by a delver and the sqwife swims
  there; a fang drops at a break, sinks, is carried, and the button
  appears; its button spends it on a station a delver builds, and a pod
  resident swims there as its fighter; four stations is the most.
- **classes.test.mjs** (FIGHT): for each class, bought through its rails'
  Buy to rung 4 and to rung 8, the move and the capstone happen (a
  Haymaker lands every 4th punch and stuns; an Aimed shot every 5th arrow,
  stunning at rung 8; the Bard's Inspired raises another fighter's hits),
  and each damage class alone breaks the bare coil.
- **statuses.test.mjs** (FIGHT): each status does what the table says, on
  the whole serpent; amps and heal cuts cap; a Held serpent holds its pose.
- **rails.test.mjs** (BOARD): view does not commit; the first rung commits
  and folds; Reset refunds exactly what was paid; a locked class opens with
  the second station; a station built twice keeps two ladders.
- **party-migrate.test.mjs** (STATE): a real v6 save (stations open,
  weapon levels bought, a stage broken) loads: stations stand, the purse
  holds the refund, slots equal the stage plus one, no body lost, the reload
  check holds.
- New `verify.js` rules (STATE): one fighter a station; stations ≤ `FIGHT_STATIONS_MAX`; a fighter's station exists and is built;
  `fangsDropped` ≤ stage; no fighter in the yard.
- Every test file that hardcodes a retired job, row or flag is rewritten by
  its owner above; `test/shop-rows.mjs` lists every new row.

Run only the files that cover the change, `--test-concurrency=4`, in the
foreground. **No full suites** in the wave; the orchestrator runs both
tiers once on main after the merge.

## Worktrees and reports

As `docs/wave-class-anims.md` and CLAUDE.md "Waves": first command
`git reset --hard wave-party && git switch -c party-<track>`; your own vite
port (CREW 5311, FIGHT 5312, BOARD 5313, RENDER 5314, STATE 5315; CDP 9300
plus the last two digits), always `GAME` and `CDP_PORT`; never 5183 or
5184; headless; tear down. Commit as you go. Report: deliverables one line
each, files touched, the **pasted** test output, shot paths, what you had to
decide, and what you think is wrong with this document.

## Open, for the owner at sign-off

1. **The numbers**: the ten ladders, `CLICK_DMG`, the fang
   and slot costs, the heals and depths. First guesses go in; the ladder
   book and a play-through tune them.
2. **Decided-here items 1-10** above: overrule any.
