// The painting order, and the loop that walks it.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.
// That order used to be a call sequence buried in a two-hundred-line function,
// where a layer's place in the picture was whatever line it happened to sit on.
// It is a list now: `LAYERS`, top to bottom, one entry a layer. Reading the list
// is reading the picture from the back of the yard to the front of it, and
// moving a layer is moving one line.
//
// An entry is `{ name, draw }`, plus an optional `when` -- a layer that is only
// in the picture some of the time says so here rather than opening its own draw
// with a guard. Nothing in today's frame is conditional at the call site (every
// guard that exists lives inside the draw it belongs to, where it can also
// decide *what* to draw), so no entry carries a `when` yet; the loop honours one
// so that a layer which genuinely appears and disappears can say so in the list.
//
// Every draw itself lives in `src/render/`, one file a cluster. This file draws
// nothing; it only says in what order.

import { drawAir, drawAirNear } from './air.js';
import { drawBirds, drawClouds } from './weather.js';

import { drawApothecary } from './render/apothecary.js';
import { drawBalloons, drawBrollies } from './render/balloon.js';
import { drawWorkBars } from './render/bars.js';
import { drawBuildSites, drawGrit } from './render/buildsites.js';
import { drawCasino, drawCasinoMark, drawPotPile, drawSparks } from './render/casino.js';
import { drawCore, drawCoreBehind, drawPaid, drawAbyss, drawRockSand } from './render/cores.js';
import { drawKitStandCounts, drawRosterBadgeCounts, drawStockCounts } from './render/counts.js';
import { drawCount } from './render/counter.js';
import { drawBench, drawDroppedHats, drawIntro, drawKitStands, drawOffers,
         drawPointed, drawRosterBodies, drawSays, drawWorkers } from './render/crew.js';
import { drawCursor } from './render/cursor.js';
import { clearPage, enterScreen, enterWorld, leaveWorld, pressFrame } from './render/frame.js';
import { drawFloor, drawGroundLine, drawPit, drawPitOutline } from './render/ground.js';
import { drawRisingHouse, drawSettlement } from './render/houses.js';
import { drawDoneMarks } from './render/donemarks.js';
import { stepRiseLandings } from './render/landings.js';
import { drawBelt, drawDrill, drawRam, drawTiller } from './render/machines.js';
import { drawAuras } from './render/aura.js';   // wave7-ui
import { drawPileMarks } from './render/pilemarks.js';
import { drawChips, drawRock } from './render/rock.js';
import { drawScrub } from './render/scrub.js';
import { drawShocks } from './render/shock.js';          // F4
import { drawBridge, drawCut, drawFarm, drawFarmShed, drawQuarry, drawQuarryShed } from './render/sites.js';
import { drawSky } from './render/sky.js';
import { drawDraught, drawMuck, drawPuffs, drawRain, drawSmog } from './render/smog.js';
import { drawLab, drawSchool, drawSmoke } from './render/stations.js';
import { drawOuthouse, drawTower, drawTowerWaves } from './render/tower.js';

// The drawing side's public surface, kept exactly as it was: the rest of the
// game imports every one of these from render.js and has no business knowing
// which file in `src/render/` each of them ended up in.
export { canvas, ctx } from './render/ctx.js';
export { cell, drawCircle, drawDiamond, drawMark, drawTriangle } from './render/marks.js';
export { risingPlace, withRise } from './render/rise.js';
export { bar, barSpot, drawWorkBars } from './render/bars.js';
export { drawBuildSites, drawGrit } from './render/buildsites.js';
export { drawGrid, drawGroundLine, drawPit, drawPitCores, drawPitOutline } from './render/ground.js';
export { drawDoneMarks, doneMarkAt, overDoneMark } from './render/donemarks.js';
export { drawCursor } from './render/cursor.js';
export { CAULDRON, CAULDRON_BREW_ROW, drawApothecary } from './render/apothecary.js';
export { drawDraught, drawMuck, drawPuffs, drawRain, drawSmog } from './render/smog.js';
export { drawOuthouse, drawTower, drawTowerWaves } from './render/tower.js';
export { drawBalloons, drawBrollies } from './render/balloon.js';
export { drawScrub } from './render/scrub.js';
export { casinoMarkAt, drawCasino, drawCasinoMark, drawPotPile, drawSparks } from './render/casino.js';
export { drawSky } from './render/sky.js';
export { drawCore, drawCoreAt, drawCoreBehind, drawPaid, drawAbyss } from './render/cores.js';
export { drawCount } from './render/counter.js';
export { drawBelt, drawDrill, drawRam, drawRunSwitch, drawTiller, stepMachineSmoke } from './render/machines.js';
export { drawPileMarks, markAnchor, markAt, overPileMark, pileMarkAt, shortMarkAt } from './render/pilemarks.js';   // wave7-ui: + shortMarkAt
export { drawLab, drawSchool, drawSmoke } from './render/stations.js';
export { drawBridge, drawCut, drawFarm, drawFarmShed, drawQuarry, drawQuarryShed } from './render/sites.js';
export { drawBench, drawBody, drawCart, drawDroppedHats, drawHat, drawIntro, drawKitStands,
         drawPointed, drawSays, drawWorkers } from './render/crew.js';

// --- the painting order -------------------------------------------------------
//
// Back to front. `world` and `screen` are spaces rather than pictures: what is
// drawn between `world` and the `world:done` under it is in the yard and zooms
// and shakes with it, and what comes after `screen` is in screen pixels. Which
// space a layer is painted in is as much a part of the order as where it sits,
// so both are in the list.
const LAYERS = [
  { name: 'page', draw: clearPage },

  // The sky goes down first: clouds and birds are the far end of everything.
  { name: 'world', draw: enterWorld },
  { name: 'clouds', draw: drawClouds },
  { name: 'birds', draw: drawBirds },
  { name: 'world:done', draw: leaveWorld },

  // Then the dust, which hangs in front of them -- it is weather in the yard and
  // not something out on the horizon, so a cloud must never paint over it.
  { name: 'air', draw: drawAir },

  { name: 'world', draw: enterWorld },
  { name: 'core behind', draw: drawCoreBehind },
  { name: 'ground line', draw: drawGroundLine },
  { name: 'quarry', draw: drawQuarry },          // a hole in the ground, so it goes down with the ground
  { name: 'quarry shed', draw: drawQuarryShed }, // the shed beside it, holding its board
  { name: 'cut', draw: drawCut },                // the dust lying in it, after the quarry for the same reason
                                                 // after the quarry, or its white columns erase it
  { name: 'bridge', draw: drawBridge },          // and the way across it
  { name: 'drill', draw: drawDrill },            // which the drill stands on
  { name: 'farm', draw: drawFarm },
  { name: 'farm shed', draw: drawFarmShed },     // the shed beside it, holding its board
  { name: 'apothecary', draw: drawApothecary },  // the pot on the fire, standing right past the farm
  { name: 'tiller', draw: drawTiller },
  { name: 'ram', draw: drawRam },                // before the rock, so the hill stands in front of it
  { name: 'belt', draw: drawBelt },              // the road from the rock to the hole
  { name: 'sky', draw: drawSky },
  { name: 'lab', draw: drawLab },
  { name: 'casino', draw: drawCasino },
  { name: 'scrub house', draw: drawScrub },
  { name: 'tower', draw: drawTower },
  { name: 'outhouse', draw: drawOuthouse },
  { name: 'pot pile', draw: drawPotPile },       // what is on the table, as a heap on the ground
  { name: 'sparks', draw: drawSparks },          // and whatever the last spin threw out of it
  { name: 'school', draw: drawSchool },
  { name: 'smoke', draw: drawSmoke },

  { name: 'rock', draw: drawRock },
  { name: 'rock sand', draw: drawRockSand },     // and whatever has come down on top of it
  { name: 'chips', draw: drawChips },            // and whatever is in the air off it
  // F4: and the ring and specks off a crit, over the chips it threw up -- the
  // blow is in front of its own spoil, the way a splash is in front of the water.
  { name: 'shocks', draw: drawShocks },

  // The bench and the settlement go down before the loose stuff, not after.
  //
  // Everything that is lying on the ground -- dust, finds, the muck a rain left --
  // is in front of every building it reaches. A heap that runs up to a wall and
  // then stops dead at it is a heap that has been drawn around the wall; a heap
  // that piles up *against* the wall and buries its foot is a heap. The buildings
  // are the yard and the loose stuff is what the yard is full of.
  { name: 'bench', draw: drawBench },
  { name: 'settlement', draw: drawSettlement },  // and the crew are drawn later still, so they walk in front of both
  { name: 'rising room', draw: drawRisingHouse },// the one room still going up, if a hire is under way

  { name: 'floor', draw: drawFloor },
  { name: 'pit', draw: drawPit },
  { name: 'muck', draw: drawMuck },              // and whatever the last rain left on top of the lot
  { name: 'abyss', draw: drawAbyss },            // the drowned pit: the liquid, its ripples and the plank

  { name: 'pit outline', draw: drawPitOutline },

  { name: 'paid', draw: drawPaid },
  { name: 'core', draw: drawCore },
  { name: 'pile marks', draw: drawPileMarks },   // and a bar over anything that has stopped for a full one
  { name: 'auras', draw: drawAuras },            // wave7-ui: the offer aura on the buildings themselves
  { name: 'work bars', draw: drawWorkBars },     // and whatever else the yard is putting up
  { name: 'build sites', draw: drawBuildSites }, // fenced off, for as long as it is under way
  { name: 'grit', draw: drawGrit },              // and the chips off the hammer, in FRONT of the walls
  { name: 'rise landings', draw: stepRiseLandings }, // a puff and a knock, the frame a rising place lands
  { name: 'draught', draw: drawDraught },        // the air going into the scrubbing house
  { name: 'tower waves', draw: drawTowerWaves }, // the tower pouring, while it is making a hat
  { name: 'done marks', draw: drawDoneMarks },   // a tick over any station that finished something
  { name: 'casino mark', draw: drawCasinoMark }, // and which way the last hand at the table went
  { name: 'offers', draw: drawOffers },          // and an arrow under whichever of them has something for you
  { name: 'kit stands', draw: drawKitStands },   // and the kit put out ready at each of them
  { name: 'dropped hats', draw: drawDroppedHats },// and any that has been shaken off somebody
  { name: 'roster', draw: drawRosterBodies },    // who is working here, under the place they work
  { name: 'intro', draw: drawIntro },            // the two of them, or whoever is under the rock
  { name: 'workers', draw: drawWorkers },
  { name: 'says', draw: drawSays },              // and what any of them stood about is saying
  { name: 'puffs', draw: drawPuffs },            // what the crew are putting up there right now
  { name: 'smog', draw: drawSmog },              // and what it has gathered into up there
  { name: 'balloons', draw: drawBalloons },      // and the craft crossing it
  { name: 'brollies', draw: drawBrollies },      // and anybody who has stepped out of one
  { name: 'rain', draw: drawRain },              // and whatever is coming down out of it, or going into the house
  { name: 'pointed', draw: drawPointed },        // and an arrow over whoever you just asked for by name
  { name: 'cursor', draw: drawCursor },
  { name: 'world:done', draw: leaveWorld },

  { name: 'air near', draw: drawAirNear },       // the nearest dust passes in front of the yard, not behind it

  // The roster's counts, in screen pixels so the digits stay sharp, but moved
  // with the yard rather than pinned to the window: the number belongs to the
  // badge beside it, shake and all.
  { name: 'screen', draw: enterScreen },
  { name: 'roster counts', draw: drawRosterBadgeCounts },
  { name: 'kit counts', draw: drawKitStandCounts },   // and how many are waiting on each stand
  { name: 'stock count', draw: drawStockCounts },     // and how many doses stand ready on the apothecary table

  { name: 'counter', draw: drawCount },          // last, and in screen pixels: it is read, not looked at

  { name: 'press', draw: pressFrame },           // and then the filter, over the finished frame
];

export { LAYERS };

export function draw() {
  for (const layer of LAYERS) {
    if (layer.when && !layer.when()) continue;
    layer.draw();
  }
}
