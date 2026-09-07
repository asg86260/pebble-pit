# Still to do

## 6. The shields — the story arc

**Status:** all five shields built. `src/shield.js` owns every kind through one
`KINDS` table — material, price, coin, and how it answers a rock — with the
four bench rows, the dome on the tower's board, the piece walk on the kit-walk
legs, and six groups in `test/shield.test.mjs`. What remains is the rescue
choreography: the buried mate walking out under the dome.

Three attempts to stop the next rock: timber props (bench, dust) the rock goes
straight through; a stone arch (shards) that catches one for a held beat and
then cracks; and the tower's dome (a spell, cores) that finally holds a rock
off long enough for the one underneath to walk out. The first two must fail —
the rocks are the income — and each failure is a beat, not a bill: nobody is
ever under a shield when it goes, and the wreckage flies out along the heap as
`spawnSpoil` chips and mines back as dust.

**Build it in stages that each leave the game playable:**

1. **The props — DONE.** A bench row (`props`, dust, shown from the fourth
   rock), a frame sized against the rock it stands over (next footprint wide,
   current peak plus a body's daylight tall), raised one plank per round trip
   from the bench on the kit walk's legs machinery (`sendOn`, a `'plank'`
   leg), smashed in the air the frame the falling rock's foot crosses the
   lid, wreckage out along the heap as `spawnSpoil` chips. Saved, reset,
   reported; `test/props.test.mjs` runs the whole story through `__buy`.
2. **The arch — DONE.** Same scaffolding, quarried stone, priced in shards and
   offered only once the timber has failed. Two new pieces: the *caught* beat
   — `S.rockHeld` stops the fall the frame the rock's foot reaches the crown,
   every body on the ground marks it, and the rock rests there — and the
   delayed collapse (`ARCH_HOLD_MS`) that drops both. Drawn as a segmental
   arch on two piers, one circle-band law from foot to crown, closing at the
   crown on the trip that finishes it.
3. **The net, the jack and the dome — DONE.** Rope in spores that catches the
   rock and pays out under it to the ground; a sparks-priced machine that
   catches it and drives it back up before the rams give out; and the tower's
   dome in cores, cast on a clock rather than carried, which holds and then
   sets the rock down gently (`landRock(gentle)`) and stays standing for every
   rock after.

4. **The rescue — still to do.** The one beat left, and the point of the whole
   arc: under the dome the buried mate walks out. The buried-body system
   (`rock.test.mjs` "the one underneath") changes meaning here — after this
   there is nobody under any rock, and the says-dots loop moves to two bodies
   on the surface. It belongs in `intro.js`, which already owns `S.buried`,
   `S.pair` and `sceneHolds`; `shield.js` triggers it on the dome's first
   catch. Watch `buriedVisible()`, the opening's promise, and the glimpses
   between rocks — all three read the buried state and must still mean
   something afterwards.

**The hard parts, in order:** what the landing code consults (a shield is the
first thing with a say in where a rock stops); how the buried-mate state ends
without orphaning the systems that read it (dots, the opening's promise, the
"still alive" glimpses between rocks); save/restore for a mid-arc yard. Wire
new structures into the pile-full mark and per-cell variation as given.

---
