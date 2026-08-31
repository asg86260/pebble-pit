# Still to do

## 6. The shields — the story arc

**Status:** designed (DESIGN.md, "The shields"), not built.

Three attempts to stop the next rock: timber props (bench, dust) the rock goes
straight through; a stone arch (shards) that catches one for a held beat and
then cracks; and the tower's dome (a spell, cores) that finally holds a rock
off long enough for the one underneath to walk out. The first two must fail —
the rocks are the income — and each failure is a beat, not a bill: nobody is
ever under a shield when it goes, and the wreckage flies out along the heap as
`spawnSpoil` chips and mines back as dust.

**Build it in stages that each leave the game playable:**

1. **The props.** A bench row, a built-plank-by-plank structure over the dig
   (bodies walk and climb — no teleporting), a scripted smash on the next
   landing, wreckage into the spoil arc. This stage proves the shield
   scaffolding: a structure with a footprint, a build job for the crew, a
   landing that consults what is standing there.
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
