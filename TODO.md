# Still to do

## 6. The shields — the story arc

**Status:** stage 1 (the props) built — `src/props.js`, the `props` bench row,
the plank walk on the kit-walk legs, the mid-air smash, `test/props.test.mjs`.
Stages 2 (the arch) and 3 (the dome) remain.

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
2. **The arch.** Same scaffolding, quarried stone, plus the two new pieces:
   the *caught* beat (a rock at rest on a shield, every body looking up) and
   the delayed collapse. The arch's stone lands minable.
3. **The dome.** The tower's fifth spell. Purple rings close over the landing
   spot; the catch is permanent. The choreography of the mate walking out —
   the buried-body system (`rock.test.mjs` "the one underneath") changes
   meaning here: after this beat there is nobody under any rock, and the
   says-dots loop moves to two bodies on the surface. Every later rock is
   caught, held a breath, set down.

**The hard parts, in order:** what the landing code consults (a shield is the
first thing with a say in where a rock stops); how the buried-mate state ends
without orphaning the systems that read it (dots, the opening's promise, the
"still alive" glimpses between rocks); save/restore for a mid-arc yard. Wire
new structures into the pile-full mark and per-cell variation as given.

---
