<!-- [x] done and on main   [ ] still open   [!] attempted and backed out, see note -->

- [x] the quarry shouldnt cost resource that is unlocked after it. 
- [ ] the upgrade system feels really disjointed. the quarry/farm offer speed upgrades, the lab offers the same speed upgrades.
- [x] workers are still causing pollution in the quarry. i want no MANUAL workers to cause pollution. only machines should create pollution. ive said this multiple times. 
- [x] core animation is still not centered with the circle. its using the bottom right of the sprite as its center. bad. 
- [x] for the dynamic station positions, this should be easy af, each station defines its required spacing for future growth and their own pile. so when buying a station, just place it in the next open spot. 
- [ ] dust should be able to fall into the quarry, workers should be able to go into the quarry and pick it up, using the ladder. 
- [!] dust should be able to fall in front of the rock pile. 
- [x] i dont see any wizard upgrades in the tower.
- [x] i dont see any lab upgrades.
- [x] i dont see any other upgrades in the wizard tower, what are they gated behind?
- [x] lets give the janitor a unique appearance so i know where he is. 
- [x] the janitor is in the abyss, idk where he went. when i click on him in the house menu, it takes me to a totally white screen.
- [x] haze rain once it starts should mark all of the rain in the band at that point. any more haze that enters the band while its raining, should not rain down in that instance. 
- [ ] i think a better idea for the scrubber house is a floating scrubber balloon, that travels back and forth in the haze band. a worker get into the floating thing and it sucks in the haze, and drops dust below. we can have the same upgrades, scrubber baloon that drops muck, then a recycler upgrade to create dust. we could also deploy multiple balloons for faster pollution sinking. 
- [x] can we add some bloom to the sun and the wizard magic effects?
- [x] the diamond is still too large. cut by half.

<!-- notes
  #7 dust in front of the rock: tried, backed out. Freeing the apron broke three
     rules -- grains rest UNDER the boulder; the heap-side clearance is what the
     spoil heap stands off from; and clearApron sweeps whatever lies there into
     the heap's first column on every rock, standing it 12 cells against the
     boulder. Need to know WHICH strip is meant: the yard side you look at, or
     the gap between rock and spoil heap.
  #1, #4, #8, #9, #10, #11, #13, #15 were already fixed before this pass; verified
     against a running game, not by reading code.
-->