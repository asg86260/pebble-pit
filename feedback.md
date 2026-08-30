<!-- [x] done and landed on main   [~] partly done   [!] attempted and backed out, see note   [?] could not reproduce, need repro -->

- [x] some workers are walking through the air over the pit after cleaning muck. some are behaving correctly and walking across the dust in the pit.  
      could not reproduce. 150 simulated seconds, full crew, muck everywhere, every site open: no air-walkers. what was going on when you saw it?
- [x] quarry workers are getting stuck on the ladder.  
      could not reproduce either, same run. repro conditions welcome
- [x] i also want to explore adding magic systems to other stations via tower upgrades. e.g. enhance a machine to work 50% faster. or quarries are 25% luckier spells. magically build a house, houses cost 50% less. magic janitor now works twice as fast, and moves twice as fast. etc.  
      four spells on the tower: quicken the machines, bless the cut, raise the houses, hasten the janitors. one-offs rather than rungs (7d001c8)
- [x] a lab unlock two research two things at once. allowing two workers at once.  
      'a second bench' -- one body per bench, two things looked into at once (b248bbc)
- [x] lets make the smoking animation more real, large puffs of smoke instead of constant puffs.  
      a puff is a handful of motes let go together and coming apart on the way up; every chimney in the yard goes through one function now (6ee8a14)
- [x] with the new worker booking system doesnt over leave the dust pile. we need to still gather the other resources.  
      the crew asked 'is any heap backing up' and the machines made that permanently true. it is a cap now, not a switch: one body keeps up with the finds, the rest shift grit (4094e44)
- [x] give the janitor some more idle movements.  
      it gets the stood-down miner's shift of weight and wanders a few cells to prop itself up somewhere else (ff10e9f)
- [x] the speed of green vs blue resources is a bit off. spend a lot of time waiting on blue resources.  
      a bench of the cut is worth three shards rather than two (7d001c8)
- [x] once all the haze has been rained, stop the raining, new haze that enter the band should not immediately rain down.  
      a shower rains the sky it broke on; haze arriving mid-shower belongs to the next one (ff10e9f)
- [x] the workers muck cleaning animation is weird. just give them the same animation as mining, run up to the pile, the pile disappears one cell at a time.  
      a cell to a swing, like mining, on the yard and down the hole (4db3ee0)
- [x] we also need to get upgrades for the scrubber house to handle all of the new pollution.  
      a fan ladder -- it was built to answer hand labour and the machines out-dirty it several times over (7933fe6)
- [x] lets make a conveyor belt machine from the rock into the pit, to free the haulers up for the other resources.  
      the belt, from the rock to the hole. takes the rock's spoil and loose ground, priced in all three grounds (673f917)
      (worth doing and the yard is already asking for it: the ram fills the rock's pile in under half a second and then stands down waiting to be carried, so haulage is the bottleneck the moment any machine runs. DESIGN.md's tier 3 already promises "gear: the pickaxes, the carts". it is the one machine that changes the yard's traffic rather than a station's rate.)
- [x] machine pollution should just be gray, not blue.  
      a machine's dirt goes up as soot, in its own grey, rather than as the station's own colour (6ee8a14)
- [x] the farm machine should affect the grow speed of everything and then the animation should be the farm tractor actually animating back and forth across all the plots. and thats what harvests the plants.  
      the tiller is a tractor now: a run up the row and back, the whole row coming on as it passes (a53fb53)
- [x] the rock machine should animate with the rock progress, some sort of bar or extension.  
      a bar across the engine's flank, filling as the boulder goes (a53fb53)
- [x] the quarry machine should show a rope/connector between the machine and top pulley. lets also do a few more design/review loops on the quarry, i think the overall idea is good, but the actual designs dont really make sense.  
      the line carries down the mouth of the cut to the jaw, and the skip rides that stretch (a53fb53)
- [x] the worker animation for cleaning muck is still not right. they move back and forth and slide around when cleaning.  
      same fix -- feet snapped to a cell, a stroke at a time. pinning them outright was tried and made a gang bunch up (4db3ee0)
- [x] i think we should reduce the amount of pollution that machines make.  
      MACHINE_FOUL three to 1.6 -- at fifteen times the pace, three times the dirt per unit was forty-five times the smoke (6ee8a14)
- [x] lets also flex the upgrade diamond and the full pile icon, if theres only one showing it should be centered, then when another appears, they should flex justify-content center under the stations.  
      centred as a group: one in the middle, two parting about the middle (a53fb53)
